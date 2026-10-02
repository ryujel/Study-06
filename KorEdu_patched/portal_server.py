from __future__ import annotations

import base64
import hashlib
import hmac
import http.cookies
import http.server
import json
import os
import re
import secrets
import socketserver
import threading
import time
from email.utils import formatdate
from pathlib import Path
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).resolve().parent
HOST = '127.0.0.1'
PORT = 8800
DATA_ROOT = Path.home() / 'KorEdu_DATA' / 'Auth'
USERS_FILE = DATA_ROOT / 'users.json'
SESSIONS_FILE = DATA_ROOT / 'sessions.json'
OUTBOX_FILE = DATA_ROOT / 'outbox.json'
ROSTER_FILE = DATA_ROOT / 'roster.json'   # { teacher_email: [student_email, ...] }  — 학생은 선생 1명에 속함

# 회원번호(시리얼 ID): 이름이 겹쳐도 사람을 구분하는 고유 키. 역할별로 접두사+번호를 따로 매긴다
# (T01=선생님 중 첫 번째, S0000001=학생 중 첫 번째). 역할이 바뀌면 새 접두사로 새 번호를 받고,
# 예전 번호는 previous_member_ids 에 이력으로 남긴다 — 버리는 게 아니라 "몇 번이었다가 몇 번이 됐다".
MEMBER_ID_PREFIX = {'admin': 'AT', 'teacher': 'T', 'student': 'S', 'guest': 'G'}
MEMBER_ID_WIDTH = {'admin': 2, 'teacher': 2, 'student': 7, 'guest': 2}

# 권한등급(auth_lv): 화면에 이미 쓰이는 "강의단계 Lev1~4"랑은 다른 개념이라 이름을 분리했다.
# 숫자가 작을수록 권한이 세다 — 관리자=0, 선생님=1, 학생=2(일단 2만 씀, 3은 나중에), 손님=10.
AUTH_LV_DEFAULT = {'admin': 0, 'teacher': 1, 'student': 2, 'guest': 10}

# 학습등급: 학생의 한국어 실력 구분(권한등급과 별개). 학생/손님에게만 의미가 있다. 기본은 초급.
LEARNING_LEVELS = ('초급', '중급', '고급')
LEARNING_LEVEL_DEFAULT = '초급'


def auth_lv_for_role(role: str) -> int:
    return AUTH_LV_DEFAULT.get(role, 2)

# 커리큘럼 / 진도 (로컬 시뮬레이션. 나중에 Supabase 테이블로 그대로 이전)
CUR_ROOT = Path.home() / 'KorEdu_DATA' / 'Curriculum'
CUR_MASTER_FILE = CUR_ROOT / 'master.json'          # [ {id,type,ref_id,title,level,order} ]  전체공통 순서열
CUR_ASSIGN_FILE = CUR_ROOT / 'assignments.json'     # { id: {id,student,teacher,section,type,ref_id,title,order,source,locked,created_at} }
CUR_PROGRESS_FILE = CUR_ROOT / 'progress.json'      # { "student||type||ref_id": {student,type,ref_id,marker_index,max_reached,total,updated_by,updated_at} }
CUR_SESSIONS_FILE = CUR_ROOT / 'sessions.json'      # { id: {id,student,date,seq,done,done_by,done_at,created_at} }
CUR_LOG_FILE = CUR_ROOT / 'progress_log.json'       # [ {student,type,ref_id,session_id,from_idx,to_idx,at,by} ]  append-only(캡)
CUR_SYLLABUS_FILE = CUR_ROOT / 'syllabus.json'      # [ {id,track,order,unit,title,lecture,youtube:[],word,review} ]  자동배정용 단원 순서열
CUR_PACE_FILE = CUR_ROOT / 'pace.json'              # { student: {track,units_per_session,extra_youtube,cursor,updated_by,updated_at} }
CUR_NAMES_FILE = CUR_ROOT / 'names.json'            # { student: {teacher, student} }  커리큘럼 상단 이름표
CUR_SNOTE_FILE = CUR_ROOT / 'session_notes.json'    # { session_id: {q, a, talk} }  회차 질문/답변/대화기록
CUR_WORDS_FILE = CUR_ROOT / 'wordlists.json'        # { ref: [ {ko, roman, tr} ] }  한 번 수집하면 보관, update 로만 갱신
CUR_TYPES = ('youtube', 'lecture', 'word', 'review')

# W04 복습(첨삭) 저장. 학생별·자료별. { image(base64), comments[], teacherName, studentName, updated_by, updated_at }
HW_ROOT = Path.home() / 'KorEdu_DATA' / 'Homework'
HW_MAX_BYTES = 8 * 1024 * 1024   # 이미지 base64 포함 문서 한도

# 판서(ScreenInk) 캡처 저장 목록. 학생·회차별로 여러 장이 순서대로 쌓인다. { items: [{id, image, ts, created_by}] }
BOARD_CAP_ROOT = Path.home() / 'KorEdu_DATA' / 'BoardCaptures'
BOARD_CAP_MAX_ITEMS = 200

# W15 문장 저장. 학생·회차별로 여러 개. { items: [{id, text, rec, translation, ts, created_by}] }
SENTENCE_ROOT = Path.home() / 'KorEdu_DATA' / 'Sentences'
SENTENCE_MAX_ITEMS = 300

LECTURE_MANIFEST = Path(__file__).resolve().parent / 'Textbook' / 'KorLecture' / 'manifest' / 'lessons.js'
LECTURE_ROOT = Path(__file__).resolve().parent / 'Textbook' / 'KorLecture'

LOCK = threading.RLock()
SESSION_DAYS = 30   # 로그인 유지 기간 — 한 달마다만 다시 로그인
CODE_MINUTES = 15
PBKDF2_ROUNDS = 200_000
EMAIL_RE = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
BOOTSTRAP_ADMIN_EMAIL = 'ryujel@naver.com'

# 접속 IP: 로그인할 때 IP를 기록하고, 그 로그인(쿠키)은 같은 IP에서만 유효하다.
# IP가 바뀌면 "IP가 바뀌었다"고 알리고 로그인을 해제한다. 같은 IP면 쿠키는 SESSION_DAYS(30일) 유지.
# 웹 서버 앞에 프록시가 있으면 환경변수 KOREDU_TRUST_PROXY=1 로 X-Forwarded-For 를 쓴다(그 외에는 접속 소켓 주소).
TRUST_PROXY = os.environ.get('KOREDU_TRUST_PROXY') == '1'
IP_LOG_MAX = 30

# LOCAL browser lifecycle. The portal page sends heartbeats and a pagehide goodbye.
# Closing/navigating away from the last KorEdu tab stops the LOCAL portal after a short grace period.
CLIENT_LOCK = threading.RLock()
ACTIVE_CLIENTS: dict[str, float] = {}
HAD_BROWSER_CLIENT = False
NO_CLIENT_SINCE: float | None = None
BOOT_TIME = time.monotonic()
CLIENT_STALE_SECONDS = 120.0
NO_CLIENT_GRACE_SECONDS = 4.0
FIRST_CLIENT_TIMEOUT_SECONDS = 120.0


os.chdir(ROOT)
DATA_ROOT.mkdir(parents=True, exist_ok=True)
CUR_ROOT.mkdir(parents=True, exist_ok=True)
HW_ROOT.mkdir(parents=True, exist_ok=True)
BOARD_CAP_ROOT.mkdir(parents=True, exist_ok=True)
SENTENCE_ROOT.mkdir(parents=True, exist_ok=True)


def _read_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except Exception:
        return default


def _write_json(path: Path, data) -> None:
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    tmp.replace(path)


def normalize_email(value: str) -> str:
    return (value or '').strip().lower()


def next_member_id(role: str, users: dict) -> str:
    prefix = MEMBER_ID_PREFIX.get(role, 'M')
    width = MEMBER_ID_WIDTH.get(role, 4)
    maxn = 0
    for u in users.values():
        mid = str(u.get('member_id') or '')
        if mid.startswith(prefix) and mid[len(prefix):].isdigit():
            maxn = max(maxn, int(mid[len(prefix):]))
    return f'{prefix}{maxn + 1:0{width}d}'


def assign_member_id(user: dict, users: dict) -> None:
    """user['role']에 맞는 새 회원번호를 부여한다. 이전 번호가 있으면 이력에 남긴다."""
    old = user.get('member_id')
    new = next_member_id(user.get('role', 'student'), users)
    if old and old != new:
        prev = user.get('previous_member_ids') or []
        prev.append({'member_id': old, 'until': now_ts()})
        user['previous_member_ids'] = prev
    user['member_id'] = new


def ensure_member_ids() -> None:
    """기존 회원 중 회원번호/승인상태가 없는 사람을 채운다(서버 시작 시 1회).
    이미 활동 중이던 기존 학생은 이 기능이 생기기 전부터 써왔으니 승인된 걸로 간주해서
    갑자기 강의실이 막히지 않게 한다 — 승인 절차는 이제부터 새로 가입하는 학생부터 적용."""
    with LOCK:
        users = _read_json(USERS_FILE, {})
        changed = False
        missing = [u for u in users.values() if u.get('email_verified') and not u.get('member_id')]
        missing.sort(key=lambda u: u.get('created_at') or 0)
        for u in missing:
            assign_member_id(u, users)
            u['updated_at'] = now_ts()
            changed = True
        for u in users.values():
            if u.get('email_verified') and 'approved' not in u:
                u['approved'] = True
                changed = True
            if u.get('email_verified') and u.get('auth_lv') is None:
                u['auth_lv'] = auth_lv_for_role(u.get('role', 'student'))
                changed = True
            if u.get('email_verified') and u.get('role') in ('student', 'guest') and u.get('learning_level') not in LEARNING_LEVELS:
                u['learning_level'] = LEARNING_LEVEL_DEFAULT
                changed = True
        if changed:
            _write_json(USERS_FILE, users)


def ensure_bootstrap_admin() -> None:
    """Keep the designated LOCAL bootstrap account as Admin.

    Existing users are promoted on every server start. If the auth store is
    reset, the same email will be created as Admin at the next signup.
    """
    email = normalize_email(BOOTSTRAP_ADMIN_EMAIL)
    with LOCK:
        users = _read_json(USERS_FILE, {})
        user = users.get(email)
        if not user:
            return
        changed = False
        if user.get('role') != 'admin':
            user['role'] = 'admin'
            changed = True
        if changed:
            user['updated_at'] = now_ts()
            users[email] = user
            _write_json(USERS_FILE, users)


def password_hash(password: str, salt_b64: str | None = None) -> tuple[str, str]:
    salt = base64.b64decode(salt_b64) if salt_b64 else secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, PBKDF2_ROUNDS)
    return base64.b64encode(salt).decode(), base64.b64encode(digest).decode()


def password_ok(password: str, salt_b64: str, expected_b64: str) -> bool:
    _, actual = password_hash(password, salt_b64)
    return hmac.compare_digest(actual, expected_b64)


def code_hash(code: str) -> str:
    return hashlib.sha256(code.encode('utf-8')).hexdigest()


def make_code() -> str:
    return f'{secrets.randbelow(1_000_000):06d}'


def now_ts() -> int:
    return int(time.time())


def session_cookie(token: str) -> str:
    """Persistent LOCAL login cookie. Survives KorEdu/Chrome restarts; expires after SESSION_DAYS."""
    max_age = SESSION_DAYS * 86400
    expires = formatdate(time.time() + max_age, usegmt=True)
    return (
        f'koredu_session={token}; Path=/; HttpOnly; SameSite=Lax; '
        f'Max-Age={max_age}; Expires={expires}'
    )


def clear_session_cookie() -> str:
    return (
        'koredu_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; '
        'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    )


def public_user(user: dict) -> dict:
    email = normalize_email(user.get('email', ''))
    return {
        'email': user.get('email'),
        'member_id': user.get('member_id') or '',
        'name': user.get('name') or user.get('email', '').split('@')[0],
        'role': user.get('role', 'student'),
        'level': user.get('level', 1),
        'access': user.get('access', 'free'),
        'email_verified': bool(user.get('email_verified')),
        'approved': bool(user.get('approved', True)),
        'auth_lv': int(user.get('auth_lv')) if user.get('auth_lv') is not None else auth_lv_for_role(user.get('role', 'student')),
        'learning_level': user.get('learning_level') if user.get('role') in ('student', 'guest') else None,
        'created_at': user.get('created_at'),
        'teacher': student_teacher(email),  # 이 학생의 담당 선생 이메일 (없으면 None)
    }


# ---------------------------------------------------------------------------
# 선생-학생 명부 (roster)
# ---------------------------------------------------------------------------

def load_roster() -> dict:
    raw = _read_json(ROSTER_FILE, {})
    if not isinstance(raw, dict):
        return {}
    out: dict[str, list[str]] = {}
    for teacher, students in raw.items():
        t = normalize_email(teacher)
        if not t:
            continue
        seen: list[str] = []
        for s in (students or []):
            se = normalize_email(s)
            if se and se not in seen:
                seen.append(se)
        out[t] = seen
    return out


def save_roster(roster: dict) -> None:
    with LOCK:
        _write_json(ROSTER_FILE, {t: list(s) for t, s in roster.items() if s})


def student_teacher(student_email: str) -> str | None:
    student_email = normalize_email(student_email)
    if not student_email:
        return None
    for teacher, students in load_roster().items():
        if student_email in students:
            return teacher
    return None


def roster_link(teacher_email: str, student_email: str) -> None:
    """학생을 선생에게 연결. 학생은 선생 1명에만 속하므로 다른 선생에게서 떼어낸다."""
    teacher_email = normalize_email(teacher_email)
    student_email = normalize_email(student_email)
    with LOCK:
        roster = load_roster()
        for t in list(roster):
            roster[t] = [s for s in roster[t] if s != student_email]
        roster.setdefault(teacher_email, [])
        if student_email not in roster[teacher_email]:
            roster[teacher_email].append(student_email)
        save_roster(roster)


def roster_unlink(student_email: str) -> None:
    student_email = normalize_email(student_email)
    with LOCK:
        roster = load_roster()
        for t in list(roster):
            roster[t] = [s for s in roster[t] if s != student_email]
        save_roster(roster)


# ---------------------------------------------------------------------------
# 커리큘럼 / 진도 저장소  (로컬 JSON = 미래 Supabase 테이블)
# ---------------------------------------------------------------------------

def _new_id(prefix: str) -> str:
    return f'{prefix}_{int(time.time()*1000):x}{secrets.token_hex(2)}'


def cur_load(path: Path, default):
    return _read_json(path, default)


def cur_save(path: Path, data) -> None:
    with LOCK:
        _write_json(path, data)


def _lecture_manifest_lessons() -> list[dict]:
    """KorLecture manifest 에서 강의 목록(순서 포함)을 읽는다. 없으면 빈 리스트."""
    try:
        raw = LECTURE_MANIFEST.read_text(encoding='utf-8')
        m = re.search(r'window\.KOREAN_LESSONS\s*=\s*(\{.*\})\s*;?\s*$', raw, re.S)
        if not m:
            return []
        data = json.loads(m.group(1))
        return data.get('lessons', []) if isinstance(data, dict) else []
    except Exception:
        return []


def _track_of(level_str: str) -> str:
    """'1급' → '1'. track 키는 문자열 숫자."""
    m = re.search(r'(\d+)', str(level_str or ''))
    return m.group(1) if m else '1'


_LESSON_TITLE_CACHE: dict[str, str] = {}
_VIDEO_TITLE_CACHE: dict[str, str] | None = None


def lesson_title(ref: str) -> str:
    ref = str(ref or '')
    if ref not in _LESSON_TITLE_CACHE:
        t = ''
        for les in _lecture_manifest_lessons():
            if str(les.get('lesson_id') or '') == ref:
                t = str(les.get('title') or '')
                break
        _LESSON_TITLE_CACHE[ref] = t
    return _LESSON_TITLE_CACHE[ref]


def video_title(vid: str) -> str:
    global _VIDEO_TITLE_CACHE
    if _VIDEO_TITLE_CACHE is None:
        _VIDEO_TITLE_CACHE = {}
        for cand in (Path.home() / 'VideoScript_DATA' / 'library.json',):
            try:
                data = json.loads(cand.read_text(encoding='utf-8'))
                for x in data if isinstance(data, list) else []:
                    _VIDEO_TITLE_CACHE[str(x.get('videoId') or '')] = str(x.get('title') or '')
            except Exception:
                pass
    return _VIDEO_TITLE_CACHE.get(str(vid or ''), '')


def resolve_item_title(ctype: str, ref: str, stored: str) -> str:
    if ctype == 'youtube':
        return video_title(ref) or stored or ref
    if ctype == 'lecture':
        return lesson_title(ref) or stored or ref
    return stored or ref


def wordlist_cached(ref: str, refresh: bool = False) -> list[dict]:
    """단어는 한 번 수집하면 wordlists.json 에 보관. refresh 일 때만 원본에서 다시 수집."""
    ref = re.sub(r'[^A-Za-z0-9._-]+', '', str(ref or ''))
    if not ref:
        return []
    with LOCK:
        store = cur_load(CUR_WORDS_FILE, {})
        if not refresh and isinstance(store.get(ref), list):
            return store[ref]
        words = lesson_preview_words(ref)
        if words or refresh:
            store[ref] = words
            cur_save(CUR_WORDS_FILE, store)
        return words


def lesson_preview_words(ref: str) -> list[dict]:
    """KorLecture Lev1-xx-00/lesson-data.js 의 previewWords 를 읽는다."""
    ref = re.sub(r'[^A-Za-z0-9._-]+', '', str(ref or ''))
    if not ref:
        return []
    fp = LECTURE_ROOT / ref / 'lesson-data.js'
    try:
        raw = fp.read_text(encoding='utf-8')
        m = re.search(r'window\.LESSON_DATA\s*=\s*(\{.*\})\s*;?\s*$', raw, re.S)
        if not m:
            return []
        data = json.loads(m.group(1))
        out = []
        for w in data.get('previewWords', []) or []:
            if not isinstance(w, dict):
                if w:
                    out.append({'ko': str(w), 'roman': '', 'tr': {}})
                continue
            ko = w.get('ko')
            if ko:
                tr = w.get('tr') if isinstance(w.get('tr'), dict) else {}
                out.append({'ko': str(ko), 'roman': str(w.get('romanization', '')), 'tr': tr})
        return out
    except Exception:
        return []


def syllabus_seed_from_manifest() -> list[dict]:
    units = []
    for i, les in enumerate(_lecture_manifest_lessons(), start=1):
        lid = str(les.get('lesson_id') or '').strip()
        if not lid:
            continue
        units.append({
            'id': _new_id('syl'),
            'track': _track_of(les.get('level')),
            'order': int(les.get('seq') or i),
            'unit': lid,
            'title': str(les.get('title') or lid),
            'lecture': lid,
            'youtube': [],
            'word': lid,
            'review': lid,
        })
    units.sort(key=lambda u: (u['track'], u['order']))
    return units


def syllabus_load() -> list[dict]:
    return cur_load(CUR_SYLLABUS_FILE, [])


def syllabus_ensure_seeded(force: bool = False) -> list[dict]:
    with LOCK:
        cur = cur_load(CUR_SYLLABUS_FILE, [])
        if cur and not force:
            return cur
        seeded = syllabus_seed_from_manifest()
        if seeded:
            cur_save(CUR_SYLLABUS_FILE, seeded)
            return seeded
        return cur


def pace_get(student: str) -> dict:
    student = normalize_email(student)
    row = cur_load(CUR_PACE_FILE, {}).get(student)
    return row or {
        'student': student, 'track': '1',
        'units_per_session': 1, 'extra_youtube': 0, 'cursor': 0,
        'updated_by': '', 'updated_at': 0,
    }


def pace_set(student: str, updates: dict, updated_by: str) -> dict:
    student = normalize_email(student)
    with LOCK:
        allp = cur_load(CUR_PACE_FILE, {})
        row = allp.get(student) or {'student': student, 'track': '1',
                                    'units_per_session': 1, 'extra_youtube': 0, 'cursor': 0}
        for k in ('track', 'units_per_session', 'extra_youtube', 'cursor', 'interval_days'):
            if k in updates and updates[k] is not None:
                row[k] = updates[k]
        if isinstance(updates.get('dist_rules'), dict):
            row['dist_rules'] = updates['dist_rules']
        if updates.get('yt_sort') in ('added', 'date', 'name', 'random'):
            row['yt_sort'] = updates['yt_sort']
        row['track'] = _track_of(row.get('track'))
        row['units_per_session'] = max(0, int(row.get('units_per_session', 1)))
        row['extra_youtube'] = max(0, int(row.get('extra_youtube', 0)))
        row['cursor'] = max(0, int(row.get('cursor', 0)))
        row['interval_days'] = max(1, min(30, int(row.get('interval_days', 7) or 7)))
        row['updated_by'] = normalize_email(updated_by)
        row['updated_at'] = now_ts()
        allp[student] = row
        cur_save(CUR_PACE_FILE, allp)
    return row


def syllabus_track(track: str) -> list[dict]:
    t = _track_of(track)
    return sorted([u for u in syllabus_ensure_seeded() if _track_of(u.get('track', '1')) == t],
                  key=lambda u: u.get('order', 0))


def _unit_plan(u: dict) -> list[tuple]:
    utitle = str(u.get('title', '') or u['unit'])
    plan = [('lecture', u.get('lecture') or u['unit'], utitle),
            ('word', u.get('word') or u['unit'], f'{utitle} · 단어'),
            ('review', u.get('review') or u['unit'], f'{utitle} · 복습')]
    plan += [('youtube', v, utitle) for v in (u.get('youtube') or [])]
    return [(c, str(r or '').strip(), t) for c, r, t in plan if str(r or '').strip()]


def autofill_one(student: str, date: str, updated_by: str, want: int | None = None) -> dict:
    """한 수업일에 pace.cursor 부터 want(기본 units_per_session) 단원을 auto 배정하고 커서를 전진."""
    student = normalize_email(student)
    pace = pace_get(student)
    cursor = max(0, int(pace.get('cursor', 0)))
    if want is None:
        want = int(pace.get('units_per_session', 1))
    want = max(0, int(want))
    units = syllabus_track(pace.get('track'))
    picked = units[cursor:cursor + want]
    if not picked:
        return {'added': 0, 'units': [], 'cursor': cursor, 'exhausted': True}

    session_get_or_create(student, date)
    teacher = student_teacher(student) or updated_by
    added = 0
    with LOCK:
        assigns = cur_load(CUR_ASSIGN_FILE, {})
        mine_here = [a for a in assigns.values()
                     if a['student'] == student and a['section'] == date]
        have = {(a['type'], a['ref_id']) for a in mine_here}
        order = 1 + max([a.get('order', 0) for a in mine_here] or [0])
        for u in picked:
            for ctype, ref_id, atitle in _unit_plan(u):
                if (ctype, ref_id) in have:
                    continue
                row = _assign_row(student, teacher, date, ctype, ref_id, atitle, order, 'auto')
                assigns[row['id']] = row
                have.add((ctype, ref_id))
                order += 1
                added += 1
        cur_save(CUR_ASSIGN_FILE, assigns)

    new_cursor = cursor + len(picked)
    pace_set(student, {'cursor': new_cursor}, updated_by)
    return {'added': added, 'units': [u['unit'] for u in picked], 'cursor': new_cursor}


def recompute_pace_cursor(student: str, updated_by: str = '', today: str | None = None) -> int:
    """실제 남아있는 배정을 기준으로 pace.cursor 를 다시 계산해 저장한다.
    회차를 지운 뒤(또는 재생성) 커서가 실제로는 없는 강의 뒤를 가리켜 다음 자동배치가
    건너뛰는 일이 없도록, syllabus 순서에서 "확정된"(잠금/수동, 완료 회차, 과거 회차) 강의의
    연속 접두사 길이로 되감는다."""
    student = normalize_email(student)
    today = today or time.strftime('%Y-%m-%d')
    done_dates = {s['date'] for s in sessions_for(student) if s.get('done')}
    assigns = cur_load(CUR_ASSIGN_FILE, {})
    committed = {
        a['ref_id'] for a in assigns.values()
        if a.get('student') == student and a.get('type') == 'lecture'
        and (a.get('locked') or a.get('section') in done_dates
             or (re.match(r'^\d{4}-\d{2}-\d{2}$', str(a.get('section', ''))) and a['section'] < today))
    }
    units = syllabus_track(pace_get(student).get('track'))
    cursor = 0
    for u in units:
        if (u.get('lecture') or u['unit']) in committed:
            cursor += 1
        else:
            break
    pace_set(student, {'cursor': cursor}, updated_by or student)
    return cursor


def pace_suggestion(student: str) -> dict | None:
    """최근 완료된 수업일의 '계획 단원 대비 실제 완료율' 로 속도 조정을 제안한다 (적용은 안 함)."""
    student = normalize_email(student)
    pace = pace_get(student)
    ups = max(1, int(pace.get('units_per_session', 1)))
    done = [s for s in sessions_for(student) if s.get('done')]
    done.sort(key=lambda s: (s.get('done_at') or 0))
    recent = done[-3:]
    if not recent:
        return None
    prog = cur_load(CUR_PROGRESS_FILE, {})
    assigns = [a for a in cur_load(CUR_ASSIGN_FILE, {}).values() if a.get('student') == student]
    ratios = []
    for s in recent:
        planned = {a['ref_id'] for a in assigns
                   if a.get('section') == s['date'] and a.get('type') == 'lecture'}
        if not planned:
            continue
        completed = 0
        for ref in planned:
            p = prog.get(_progress_key(student, 'lecture', ref)) or {}
            total = int(p.get('total', 0) or 0)
            reached = int(p.get('max_reached', 0) or 0)
            if total and reached / total >= 0.8:
                completed += 1
        ratios.append(completed / len(planned))
    if not ratios:
        return None
    avg = sum(ratios) / len(ratios)
    n = len(ratios)
    if avg < 0.6 and ups > 1:
        return {'direction': 'down', 'current': ups, 'suggested': ups - 1, 'avg': round(avg, 2),
                'reason': f'최근 {n}회차 평균 완료율 {int(avg*100)}% — 회차당 {ups}→{ups-1}단원으로 낮추는 걸 고려하세요.'}
    if avg >= 0.95:
        return {'direction': 'up', 'current': ups, 'suggested': ups + 1, 'avg': round(avg, 2),
                'reason': f'최근 {n}회차 모두 계획대로 완료 — 회차당 {ups}→{ups+1}단원으로 올릴 수 있습니다.'}
    return {'direction': 'keep', 'current': ups, 'avg': round(avg, 2),
            'reason': f'최근 {n}회차 평균 완료율 {int(avg*100)}% — 현재 속도 유지.'}


def _hw_path(student: str, ref: str) -> Path:
    s = re.sub(r'[^A-Za-z0-9._-]+', '_', normalize_email(student))[:100]
    r = re.sub(r'[^A-Za-z0-9._-]+', '_', str(ref))[:100]
    return HW_ROOT / f'{s}__{r}.json'


def homework_get(student: str, ref: str) -> dict | None:
    p = _hw_path(student, ref)
    if not p.is_file():
        return None
    try:
        return json.loads(p.read_text(encoding='utf-8'))
    except Exception:
        return None


def homework_set(student: str, ref: str, hw: dict, updated_by: str) -> dict:
    comments = hw.get('comments') if isinstance(hw.get('comments'), list) else []
    row = {
        'student': normalize_email(student),
        'ref': str(ref),
        'image': str(hw.get('image') or ''),
        'comments': comments[:500],
        'teacherName': str(hw.get('teacherName') or '')[:60],
        'studentName': str(hw.get('studentName') or '')[:60],
        'zoom': float(hw.get('zoom') or 1) if str(hw.get('zoom') or '').strip() else 1,
        'updated_by': normalize_email(updated_by),
        'updated_at': now_ts(),
    }
    with LOCK:
        _hw_path(student, ref).write_text(json.dumps(row, ensure_ascii=False), encoding='utf-8')
    return row


def _bc_path(student: str, session_id: str) -> Path:
    s = re.sub(r'[^A-Za-z0-9._-]+', '_', normalize_email(student))[:100]
    sid = re.sub(r'[^A-Za-z0-9._-]+', '_', str(session_id))[:100]
    return BOARD_CAP_ROOT / f'{s}__{sid}.json'


def board_captures_get(student: str, session_id: str) -> list:
    p = _bc_path(student, session_id)
    if not p.is_file():
        return []
    try:
        data = json.loads(p.read_text(encoding='utf-8'))
        return data.get('items', []) if isinstance(data, dict) else []
    except Exception:
        return []


def board_captures_add(student: str, session_id: str, image: str, updated_by: str) -> list:
    with LOCK:
        items = board_captures_get(student, session_id)
        items.append({
            'id': f'bc_{now_ts()}_{secrets.token_hex(4)}',
            'image': str(image or ''),
            'ts': now_ts(),
            'created_by': normalize_email(updated_by),
        })
        items = items[-BOARD_CAP_MAX_ITEMS:]
        _bc_path(student, session_id).write_text(json.dumps({'items': items}, ensure_ascii=False), encoding='utf-8')
    return items


def board_captures_delete(student: str, session_id: str, capture_id: str) -> list:
    with LOCK:
        items = [x for x in board_captures_get(student, session_id) if x.get('id') != capture_id]
        _bc_path(student, session_id).write_text(json.dumps({'items': items}, ensure_ascii=False), encoding='utf-8')
    return items


def _sent_path(student: str, session_id: str) -> Path:
    s = re.sub(r'[^A-Za-z0-9._-]+', '_', normalize_email(student))[:100]
    sid = re.sub(r'[^A-Za-z0-9._-]+', '_', str(session_id))[:100]
    return SENTENCE_ROOT / f'{s}__{sid}.json'


def sentences_get(student: str, session_id: str) -> list:
    p = _sent_path(student, session_id)
    if not p.is_file():
        return []
    try:
        data = json.loads(p.read_text(encoding='utf-8'))
        return data.get('items', []) if isinstance(data, dict) else []
    except Exception:
        return []


def sentences_add(student: str, session_id: str, text: str, updated_by: str) -> list:
    with LOCK:
        items = sentences_get(student, session_id)
        items.append({
            'id': f'sent_{now_ts()}_{secrets.token_hex(4)}',
            'text': str(text or ''),
            'rec': '',
            'translation': '',
            'ts': now_ts(),
            'created_by': normalize_email(updated_by),
        })
        items = items[-SENTENCE_MAX_ITEMS:]
        _sent_path(student, session_id).write_text(json.dumps({'items': items}, ensure_ascii=False), encoding='utf-8')
    return items


def sentences_update(student: str, session_id: str, sentence_id: str, patch: dict) -> list:
    with LOCK:
        items = sentences_get(student, session_id)
        for it in items:
            if it.get('id') == sentence_id:
                if 'text' in patch:
                    it['text'] = str(patch.get('text') or '')
                if 'rec' in patch:
                    it['rec'] = str(patch.get('rec') or '')
                if 'translation' in patch:
                    it['translation'] = str(patch.get('translation') or '')
                break
        _sent_path(student, session_id).write_text(json.dumps({'items': items}, ensure_ascii=False), encoding='utf-8')
    return items


def sentences_delete(student: str, session_id: str, sentence_id: str) -> list:
    with LOCK:
        items = [x for x in sentences_get(student, session_id) if x.get('id') != sentence_id]
        _sent_path(student, session_id).write_text(json.dumps({'items': items}, ensure_ascii=False), encoding='utf-8')
    return items


def _progress_key(student: str, ctype: str, ref_id: str) -> str:
    return f'{normalize_email(student)}||{ctype}||{ref_id}'


def progress_get(student: str, ctype: str, ref_id: str) -> dict | None:
    return cur_load(CUR_PROGRESS_FILE, {}).get(_progress_key(student, ctype, ref_id))


def progress_set(student: str, ctype: str, ref_id: str, marker_index: int,
                 total: int, updated_by: str, session_id: str | None = None,
                 clear: bool = False, checked_sections: list[int] | None = None) -> dict:
    """강의(lecture) 진도는 섹션 체크박스 목록(checked_sections)으로 관리한다 — 단어/복습 같은
    다른 유형은 예전처럼 marker_index(현재/총 개수)를 그대로 쓴다. max_reached는 두 방식 모두에서
    '완료율 계산용 공통 숫자'로 계속 쓰기 위해, 체크박스 목록이 오면 그 개수로 자동 맞춘다
    (진도율 계산 코드를 따로 안 바꿔도 되게)."""
    student = normalize_email(student)
    marker_index = max(0, int(marker_index))
    total = max(0, int(total))
    key = _progress_key(student, ctype, ref_id)
    with LOCK:
        prog = cur_load(CUR_PROGRESS_FILE, {})
        prev = prog.get(key) or {'marker_index': 0, 'max_reached': 0, 'checked_sections': []}
        if checked_sections is not None:
            checked_sections = sorted({max(0, int(i)) for i in checked_sections})
            max_reached = len(checked_sections)
        else:
            checked_sections = prev.get('checked_sections') or []
            # 학습완료해제: 최고도달점(max_reached)까지 초기화 → 진도 0%
            max_reached = 0 if clear else max(int(prev.get('max_reached', 0)), marker_index)
        row = {
            'student': student, 'type': ctype, 'ref_id': ref_id,
            'marker_index': marker_index,
            'max_reached': max_reached,
            'checked_sections': checked_sections,
            'total': total or int(prev.get('total', 0)),
            'updated_by': normalize_email(updated_by),
            'updated_at': now_ts(),
        }
        prog[key] = row
        cur_save(CUR_PROGRESS_FILE, prog)
        # 로그
        log = cur_load(CUR_LOG_FILE, [])
        log.append({
            'student': student, 'type': ctype, 'ref_id': ref_id,
            'session_id': session_id or None,
            'from_idx': int(prev.get('marker_index', 0)), 'to_idx': marker_index,
            'at': now_ts(), 'by': normalize_email(updated_by),
        })
        cur_save(CUR_LOG_FILE, log[-2000:])
    return row


def _assign_row(student: str, teacher: str, section: str, ctype: str, ref_id: str,
                title: str, order: int, source: str) -> dict:
    return {
        'id': _new_id('as'),
        'student': normalize_email(student),
        'teacher': normalize_email(teacher) or None,
        'section': section,           # 'personal' | 'YYYY-MM-DD'
        'type': ctype,
        'ref_id': str(ref_id),
        'title': str(title or ''),
        'order': int(order),
        'source': source,             # 'auto' | 'manual'
        'locked': source == 'manual',
        'created_at': now_ts(),
    }


def sessions_for(student: str) -> list[dict]:
    student = normalize_email(student)
    rows = [s for s in cur_load(CUR_SESSIONS_FILE, {}).values() if s.get('student') == student]
    rows.sort(key=lambda s: (s.get('date') or '', s.get('seq') or 0))
    return rows


def session_get_or_create(student: str, date: str) -> dict:
    student = normalize_email(student)
    date = str(date)
    with LOCK:
        sess = cur_load(CUR_SESSIONS_FILE, {})
        for s in sess.values():
            if s.get('student') == student and s.get('date') == date:
                return s
        seq = 1 + max([s.get('seq', 0) for s in sess.values() if s.get('student') == student] or [0])
        row = {'id': _new_id('se'), 'student': student, 'date': date, 'seq': seq,
               'done': False, 'done_by': None, 'done_at': None, 'created_at': now_ts()}
        sess[row['id']] = row
        cur_save(CUR_SESSIONS_FILE, sess)
        return row


def curriculum_board(student: str) -> dict:
    """학생 1명의 전체 보드: 전체공통(master) + 학생공통(personal) + 수업일 세션들. 진도 오버레이 포함."""
    student = normalize_email(student)
    prog_all = cur_load(CUR_PROGRESS_FILE, {})
    assigns = [a for a in cur_load(CUR_ASSIGN_FILE, {}).values() if a.get('student') == student]

    def with_progress(item: dict) -> dict:
        p = prog_all.get(_progress_key(student, item['type'], item['ref_id']))
        return {**item,
                'title': resolve_item_title(item['type'], item['ref_id'], item.get('title', '')),
                'progress': p or {'marker_index': 0, 'max_reached': 0, 'checked_sections': [], 'total': 0}}

    common = sorted(cur_load(CUR_MASTER_FILE, []), key=lambda m: m.get('order', 0))
    common = [with_progress({'type': m['type'], 'ref_id': m['ref_id'], 'title': m.get('title', ''),
                             'order': m.get('order', 0), 'section': 'common', 'source': 'master',
                             'id': m.get('id', 'm_' + str(m.get('ref_id')))}) for m in common]

    personal = sorted([a for a in assigns if a.get('section') == 'personal'], key=lambda a: a.get('order', 0))
    personal = [with_progress(a) for a in personal]

    snotes = cur_load(CUR_SNOTE_FILE, {})

    def _hw_has(ref: str) -> bool:
        hw = homework_get(student, ref) or {}
        return bool(hw.get('image') or (hw.get('comments') or []))

    sessions = []
    for s in sessions_for(student):
        items = sorted([a for a in assigns if a.get('section') == s['date']], key=lambda a: a.get('order', 0))
        nt = snotes.get(s['id']) or {}
        sessions.append({**s, 'items': [with_progress(a) for a in items], 'notes': nt,
                         'has_review': _hw_has(s['id']),
                         'has_board': _hw_has(s['id'] + '__board'),
                         'has_talk': bool((nt.get('talk') or '').strip())})

    names = cur_load(CUR_NAMES_FILE, {}).get(student) or {}
    return {'student': student, 'names': names,
            'common': common, 'personal': personal, 'sessions': sessions}


def curriculum_summary(student: str) -> dict:
    """대시보드용 한 줄 요약: 전체 진도율 · 회차 완료 · 다음 수업일 · 최근 활동."""
    student = normalize_email(student)
    b = curriculum_board(student)
    items = list(b['common']) + list(b['personal'])
    for s in b['sessions']:
        items += s['items']
    done = total = last_at = 0
    for it in items:
        p = it.get('progress') or {}
        t = int(p.get('total') or 0)
        if t:
            total += t
            done += min(t, int(p.get('max_reached') or 0))
        last_at = max(last_at, int(p.get('updated_at') or 0))
    today = time.strftime('%Y-%m-%d')
    upcoming = sorted(s['date'] for s in b['sessions'] if s['date'] >= today and not s.get('done'))
    behind = sorted(s['date'] for s in b['sessions'] if s['date'] < today and not s.get('done'))
    # 최종 강의일자 = 시작 또는 완료된 회차 중 가장 늦은 날짜 (없으면 None)
    lesson_dates = sorted(s['date'] for s in b['sessions']
                          if (s.get('started') or s.get('done')) and s.get('date'))
    return {
        'student': student,
        'pct': round(done / total * 100) if total else 0,
        'items': len(items),
        'sessions_done': sum(1 for s in b['sessions'] if s.get('done')),
        'sessions_total': len(b['sessions']),
        'next_session': upcoming[0] if upcoming else None,
        'last_lesson': lesson_dates[-1] if lesson_dates else None,
        'behind': len(behind),
        'last_activity': last_at or None,
    }


def add_outbox(email: str, kind: str, code: str) -> None:
    with LOCK:
        rows = _read_json(OUTBOX_FILE, [])
        rows.append({
            'id': secrets.token_hex(8),
            'email': email,
            'kind': kind,
            'code': code,
            'created_at': now_ts(),
            'expires_at': now_ts() + CODE_MINUTES * 60,
        })
        rows = rows[-200:]
        _write_json(OUTBOX_FILE, rows)


def _touch_client(client_id: str) -> None:
    global HAD_BROWSER_CLIENT, NO_CLIENT_SINCE
    client_id = (client_id or '').strip()[:128]
    if not client_id:
        return
    with CLIENT_LOCK:
        ACTIVE_CLIENTS[client_id] = time.monotonic()
        HAD_BROWSER_CLIENT = True
        NO_CLIENT_SINCE = None


def _drop_client(client_id: str) -> None:
    global NO_CLIENT_SINCE
    client_id = (client_id or '').strip()[:128]
    if not client_id:
        return
    with CLIENT_LOCK:
        ACTIVE_CLIENTS.pop(client_id, None)
        if HAD_BROWSER_CLIENT and not ACTIVE_CLIENTS and NO_CLIENT_SINCE is None:
            NO_CLIENT_SINCE = time.monotonic()


def _lifecycle_watchdog(httpd) -> None:
    global NO_CLIENT_SINCE
    while True:
        time.sleep(1.0)
        now = time.monotonic()
        with CLIENT_LOCK:
            stale = [cid for cid, seen in ACTIVE_CLIENTS.items() if now - seen > CLIENT_STALE_SECONDS]
            for cid in stale:
                ACTIVE_CLIENTS.pop(cid, None)
            if HAD_BROWSER_CLIENT and not ACTIVE_CLIENTS:
                if NO_CLIENT_SINCE is None:
                    NO_CLIENT_SINCE = now
                elif now - NO_CLIENT_SINCE >= NO_CLIENT_GRACE_SECONDS:
                    break
            elif ACTIVE_CLIENTS:
                NO_CLIENT_SINCE = None
            elif not HAD_BROWSER_CLIENT and now - BOOT_TIME >= FIRST_CLIENT_TIMEOUT_SECONDS:
                # Browser never connected (Chrome launch failed, etc.). Avoid leaving hidden servers forever.
                break
        
    try:
        httpd.shutdown()
    except Exception:
        pass


class Handler(http.server.SimpleHTTPRequestHandler):
    server_version = 'KorEduLocal/0.1'

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

    def log_message(self, fmt, *args):
        print('[KorEdu]', fmt % args)

    def _json(self, status: int, payload: dict, cookie: str | None = None):
        raw = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        if cookie:
            self.send_header('Set-Cookie', cookie)
        self.end_headers()
        self.wfile.write(raw)

    def _body(self, max_len: int = 1_000_000) -> dict:
        length = int(self.headers.get('Content-Length', '0') or '0')
        if length > max_len:
            raise ValueError('요청이 너무 큽니다.')
        raw = self.rfile.read(length) if length else b'{}'
        try:
            data = json.loads(raw.decode('utf-8'))
        except Exception as exc:
            raise ValueError('잘못된 요청 형식입니다.') from exc
        if not isinstance(data, dict):
            raise ValueError('잘못된 요청 형식입니다.')
        return data

    def _client_ip(self) -> str:
        if TRUST_PROXY:
            fwd = (self.headers.get('X-Forwarded-For') or '').split(',')[0].strip()
            if fwd:
                return fwd
        try:
            return self.client_address[0]
        except Exception:
            return ''

    def _session_token(self) -> str | None:
        raw = self.headers.get('Cookie', '')
        if not raw:
            return None
        cookie = http.cookies.SimpleCookie()
        try:
            cookie.load(raw)
        except Exception:
            return None
        morsel = cookie.get('koredu_session')
        return morsel.value if morsel else None

    def _session_record(self) -> dict | None:
        token = self._session_token()
        if not token:
            return None
        with LOCK:
            sessions = _read_json(SESSIONS_FILE, {})
            session = sessions.get(token)
            if not session:
                return None
            if session.get('expires_at', 0) < now_ts():
                sessions.pop(token, None)
                _write_json(SESSIONS_FILE, sessions)
                return None
            if session.get('revoked'):
                return None
            ip = self._client_ip()
            bound = session.get('ip')
            if not bound:
                session['ip'] = ip          # IP 기록이 없던 예전 로그인: 지금 IP에 묶는다
                sessions[token] = session
                _write_json(SESSIONS_FILE, sessions)
            elif ip and bound != ip:
                # 로그인했던 IP와 다르다 → 로그인 해제(다음 /api/auth/me 에서 안내 후 정리)
                session['revoked'] = 'ip_changed'
                session['revoked_ip'] = ip
                session['revoked_at'] = now_ts()
                sessions[token] = session
                _write_json(SESSIONS_FILE, sessions)
                self._log_ip(normalize_email(session.get('email', '')), 'ip_changed', ip, bound)
                return None
        return {**session, '_token': token}

    def _log_ip(self, email: str, event: str, ip: str, old_ip: str = '') -> None:
        """회원 기록에 접속 IP 이력을 남긴다(최근 IP_LOG_MAX개). event: login | ip_changed"""
        with LOCK:
            users = _read_json(USERS_FILE, {})
            user = users.get(email)
            if not user:
                return
            log = user.get('ip_log') or []
            entry = {'event': event, 'ip': ip, 'at': now_ts()}
            if old_ip:
                entry['from'] = old_ip
            log.append(entry)
            user['ip_log'] = log[-IP_LOG_MAX:]
            if event == 'login':
                user['last_ip'] = ip
                user['last_login_at'] = now_ts()
            users[email] = user
            _write_json(USERS_FILE, users)

    def _pop_ip_notice(self) -> dict | None:
        """IP가 바뀌어 해제된 로그인이면 안내 내용을 돌려주고 그 세션을 지운다(한 번만 안내)."""
        token = self._session_token()
        if not token:
            return None
        with LOCK:
            sessions = _read_json(SESSIONS_FILE, {})
            rec = sessions.get(token)
            if not rec or rec.get('revoked') != 'ip_changed':
                return None
            sessions.pop(token, None)
            _write_json(SESSIONS_FILE, sessions)
        return {'reason': 'ip_changed', 'oldIp': rec.get('ip'), 'newIp': rec.get('revoked_ip'),
                'message': f"접속 IP가 바뀌어 로그인이 해제되었습니다. ({rec.get('ip')} → {rec.get('revoked_ip')}) 다시 로그인해 주세요."}

    def _real_user(self) -> dict | None:
        """실제 로그인한 사용자 (act_as 무시)."""
        session = self._session_record()
        if not session:
            return None
        with LOCK:
            users = _read_json(USERS_FILE, {})
        return users.get(normalize_email(session.get('email', '')))

    def _current_user(self) -> dict | None:
        """유효 사용자. admin이 act_as 로 다른 사용자를 지정했으면 그 사용자 (LOCAL 시뮬레이션용)."""
        session = self._session_record()
        if not session:
            return None
        with LOCK:
            users = _read_json(USERS_FILE, {})
        real = users.get(normalize_email(session.get('email', '')))
        if not real:
            return None
        act_as = normalize_email(session.get('act_as', ''))
        if act_as and real.get('role') == 'admin':
            target = users.get(act_as)
            if target:
                return target
        return real

    def _set_act_as(self, email: str | None) -> None:
        session = self._session_record()
        if not session:
            return
        with LOCK:
            sessions = _read_json(SESSIONS_FILE, {})
            rec = sessions.get(session['_token'])
            if not rec:
                return
            if email:
                rec['act_as'] = normalize_email(email)
            else:
                rec.pop('act_as', None)
            sessions[session['_token']] = rec
            _write_json(SESSIONS_FILE, sessions)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/auth/me':
            user = self._current_user()
            real = self._real_user()
            acting = bool(real and user and real.get('email') != user.get('email'))
            notice = None if user else self._pop_ip_notice()
            if notice:
                return self._json(200, {'ok': True, 'user': None, 'realUser': None, 'actingAs': False,
                                        'mode': 'LOCAL_JSON', **notice}, cookie=clear_session_cookie())
            return self._json(200, {
                'ok': True,
                'user': public_user(user) if user else None,
                'realUser': public_user(real) if (real and acting) else None,
                'actingAs': acting,
                'mode': 'LOCAL_JSON',
            })

        if parsed.path == '/api/admin/users':
            return self._admin_users()

        if parsed.path == '/api/roster':
            return self._roster()

        if parsed.path == '/api/dev/users':
            return self._dev_users()

        if parsed.path == '/api/curriculum/board':
            q = parse_qs(parsed.query)
            try:
                return self._cur_board((q.get('student') or [''])[0])
            except (PermissionError, ValueError) as exc:
                return self._json(400, {'ok': False, 'message': str(exc)})

        if parsed.path == '/api/curriculum/master':
            try:
                return self._cur_master_get()
            except (PermissionError, ValueError) as exc:
                return self._json(400, {'ok': False, 'message': str(exc)})

        if parsed.path == '/api/curriculum/progress':
            q = parse_qs(parsed.query)
            try:
                return self._cur_progress_get((q.get('student') or [''])[0],
                                              (q.get('type') or [''])[0],
                                              (q.get('ref_id') or [''])[0])
            except (PermissionError, ValueError) as exc:
                return self._json(400, {'ok': False, 'message': str(exc)})

        if parsed.path == '/api/curriculum/syllabus':
            try:
                return self._cur_syllabus_get()
            except (PermissionError, ValueError) as exc:
                return self._json(400, {'ok': False, 'message': str(exc)})

        if parsed.path == '/api/curriculum/sources':
            try:
                return self._cur_sources()
            except (PermissionError, ValueError) as exc:
                return self._json(400, {'ok': False, 'message': str(exc)})

        if parsed.path == '/api/curriculum/wordlist':
            q = parse_qs(parsed.query)
            ref = (q.get('ref') or [''])[0]
            refresh = (q.get('refresh') or [''])[0] in ('1', 'true', 'yes')
            return self._json(200, {'ok': True, 'ref': ref, 'words': wordlist_cached(ref, refresh)})

        if parsed.path == '/api/curriculum/overview':
            try:
                q = parse_qs(parsed.query)
                view = (q.get('view') or [''])[0]
                return self._cur_overview(view)
            except (PermissionError, ValueError) as exc:
                return self._json(400, {'ok': False, 'message': str(exc)})

        if parsed.path == '/api/homework':
            q = parse_qs(parsed.query)
            try:
                return self._hw_get((q.get('student') or [''])[0], (q.get('ref') or [''])[0])
            except (PermissionError, ValueError) as exc:
                return self._json(400, {'ok': False, 'message': str(exc)})

        if parsed.path == '/api/curriculum/board-captures':
            q = parse_qs(parsed.query)
            try:
                return self._bc_get((q.get('student') or [''])[0], (q.get('session_id') or [''])[0])
            except (PermissionError, ValueError) as exc:
                return self._json(400, {'ok': False, 'message': str(exc)})

        if parsed.path == '/api/curriculum/sentences':
            q = parse_qs(parsed.query)
            try:
                return self._sent_get((q.get('student') or [''])[0], (q.get('session_id') or [''])[0])
            except (PermissionError, ValueError) as exc:
                return self._json(400, {'ok': False, 'message': str(exc)})

        if parsed.path == '/api/curriculum/pace':
            q = parse_qs(parsed.query)
            try:
                return self._cur_pace_get((q.get('student') or [''])[0])
            except (PermissionError, ValueError) as exc:
                return self._json(400, {'ok': False, 'message': str(exc)})

        if parsed.path == '/api/auth/mailbox':
            email = normalize_email((parse_qs(parsed.query).get('email') or [''])[0])
            with LOCK:
                rows = _read_json(OUTBOX_FILE, [])
            rows = [r for r in rows if r.get('email') == email and r.get('expires_at', 0) >= now_ts()]
            latest = rows[-1] if rows else None
            return self._json(200, {'ok': True, 'mail': latest, 'local_only': True})

        # index.html 은 portal.js / portal.css 에 파일 mtime 쿼리를 붙여 캐시를 무력화
        if parsed.path in ('/', '/index.html'):
            idx = Path(__file__).resolve().parent / 'index.html'
            try:
                html = idx.read_text(encoding='utf-8')
                for asset in ('portal.js', 'portal.css', 'curriculumStore.js'):
                    fp = idx.parent / asset
                    if fp.exists():
                        v = int(fp.stat().st_mtime)
                        html = html.replace(f'"{asset}"', f'"{asset}?v={v}"').replace(f"'{asset}'", f"'{asset}?v={v}'")
                raw = html.encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(raw)))
                self.end_headers()
                self.wfile.write(raw)
                return
            except Exception:
                pass

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        _allowed = ('/api/auth/', '/api/admin/', '/api/local/', '/api/roster/', '/api/dev/', '/api/curriculum/', '/api/homework')
        if not parsed.path.startswith(_allowed):
            return self._json(404, {'ok': False, 'message': 'Not found'})
        try:
            data = self._body(HW_MAX_BYTES if parsed.path in ('/api/homework', '/api/curriculum/board-captures', '/api/curriculum/sentences-update') else 1_000_000)
            if parsed.path == '/api/local/heartbeat':
                _touch_client(str(data.get('client_id', '')))
                return self._json(200, {'ok': True})
            if parsed.path == '/api/local/goodbye':
                _drop_client(str(data.get('client_id', '')))
                return self._json(200, {'ok': True})
            if parsed.path == '/api/auth/signup':
                return self._signup(data)
            if parsed.path == '/api/auth/verify':
                return self._verify(data)
            if parsed.path == '/api/auth/resend':
                return self._resend(data)
            if parsed.path == '/api/auth/login':
                return self._login(data)
            if parsed.path == '/api/auth/logout':
                return self._logout()
            if parsed.path == '/api/auth/forgot':
                return self._forgot(data)
            if parsed.path == '/api/auth/reset':
                return self._reset(data)
            if parsed.path == '/api/auth/google':
                return self._json(501, {'ok': False, 'code': 'WEB_REQUIRED', 'message': 'Google 로그인은 다음 WEB 단계에서 Supabase Google OAuth로 연결합니다.'})
            if parsed.path == '/api/admin/set-role':
                return self._admin_set_role(data)
            if parsed.path == '/api/roster/link':
                return self._roster_link(data)
            if parsed.path == '/api/roster/unlink':
                return self._roster_unlink(data)
            if parsed.path == '/api/roster/approve-student':
                return self._approve_student(data)
            if parsed.path == '/api/roster/set-guest':
                return self._teacher_set_guest(data)
            if parsed.path == '/api/dev/act-as':
                return self._act_as(data)
            if parsed.path == '/api/curriculum/assign':
                return self._cur_assign(data)
            if parsed.path == '/api/curriculum/unassign':
                return self._cur_unassign(data)
            if parsed.path == '/api/curriculum/reorder':
                return self._cur_reorder(data)
            if parsed.path == '/api/curriculum/progress':
                return self._cur_progress(data)
            if parsed.path == '/api/curriculum/session':
                return self._cur_session(data)
            if parsed.path == '/api/curriculum/session-done':
                return self._cur_session_done(data)
            if parsed.path == '/api/curriculum/session-start':
                return self._cur_session_start(data)
            if parsed.path == '/api/curriculum/session-delete':
                return self._cur_session_delete(data)
            if parsed.path == '/api/curriculum/master':
                return self._cur_master_set(data)
            if parsed.path == '/api/curriculum/syllabus':
                return self._cur_syllabus_set(data)
            if parsed.path == '/api/curriculum/pace':
                return self._cur_pace_set(data)
            if parsed.path == '/api/curriculum/autofill':
                return self._cur_autofill(data)
            if parsed.path == '/api/curriculum/bulk-autofill':
                return self._cur_bulk_autofill(data)
            if parsed.path == '/api/curriculum/regenerate':
                return self._cur_regenerate(data)
            if parsed.path == '/api/curriculum/names':
                return self._cur_names_set(data)
            if parsed.path == '/api/curriculum/session-note':
                return self._cur_snote_set(data)
            if parsed.path == '/api/homework':
                return self._hw_set(data)
            if parsed.path == '/api/curriculum/board-captures':
                return self._bc_add(data)
            if parsed.path == '/api/curriculum/board-captures-delete':
                return self._bc_delete(data)
            if parsed.path == '/api/curriculum/sentences':
                return self._sent_add(data)
            if parsed.path == '/api/curriculum/sentences-update':
                return self._sent_update(data)
            if parsed.path == '/api/curriculum/sentences-delete':
                return self._sent_delete(data)
            return self._json(404, {'ok': False, 'message': 'Not found'})
        except PermissionError as exc:
            return self._json(403, {'ok': False, 'message': str(exc)})
        except ValueError as exc:
            return self._json(400, {'ok': False, 'message': str(exc)})
        except Exception as exc:
            print('AUTH ERROR:', repr(exc))
            return self._json(500, {'ok': False, 'message': 'LOCAL 인증 처리 중 오류가 발생했습니다.'})

    def _require_admin(self) -> dict:
        user = self._current_user()
        if not user or user.get('role') != 'admin':
            raise PermissionError('관리자 권한이 필요합니다.')
        return user

    def _admin_users(self):
        try:
            self._require_admin()
        except PermissionError as exc:
            return self._json(403, {'ok': False, 'message': str(exc)})
        ensure_bootstrap_admin()
        ensure_member_ids()
        with LOCK:
            users = _read_json(USERS_FILE, {})
            rows = [{**public_user(user), 'last_ip': user.get('last_ip'), 'last_login_at': user.get('last_login_at')} for user in users.values() if user.get('email_verified')]
        rows.sort(key=lambda row: (0 if row.get('email') == normalize_email(BOOTSTRAP_ADMIN_EMAIL) else 1, row.get('created_at') or 0, row.get('email') or ''))
        return self._json(200, {'ok': True, 'users': rows})

    def _admin_set_role(self, data: dict):
        try:
            self._require_admin()
        except PermissionError as exc:
            return self._json(403, {'ok': False, 'message': str(exc)})
        email = normalize_email(data.get('email', ''))
        role = str(data.get('role', '')).strip().lower()
        if role not in {'admin', 'teacher', 'student', 'guest'}:
            raise ValueError('Role은 Admin / Teacher / Student / Guest 중에서 선택하세요.')
        if email == normalize_email(BOOTSTRAP_ADMIN_EMAIL) and role != 'admin':
            raise ValueError('최초 Admin 계정은 Admin에서 변경할 수 없습니다.')
        learning = data.get('learning_level')
        if learning not in (None, '') and learning not in LEARNING_LEVELS:
            raise ValueError('학습등급은 초급 / 중급 / 고급 중에서 선택하세요.')
        with LOCK:
            users = _read_json(USERS_FILE, {})
            user = users.get(email)
            if not user or not user.get('email_verified'):
                raise ValueError('인증된 회원을 찾을 수 없습니다.')
            role_changed = user.get('role') != role
            user['role'] = role
            if role_changed:
                assign_member_id(user, users)   # 역할이 바뀌면 새 접두사로 새 회원번호, 예전 번호는 이력으로 보관
                user['approved'] = role != 'student'  # 학생이 아니면 승인 불필요, 학생이 되면 다시 승인 필요
                user['auth_lv'] = auth_lv_for_role(role)
            if role in ('student', 'guest'):
                if learning in LEARNING_LEVELS:
                    user['learning_level'] = learning
                elif user.get('learning_level') not in LEARNING_LEVELS:
                    user['learning_level'] = LEARNING_LEVEL_DEFAULT
            else:
                user.pop('learning_level', None)
            user['updated_at'] = now_ts()
            users[email] = user
            _write_json(USERS_FILE, users)
            if role_changed and role != 'student':
                roster_unlink(email)   # 더 이상 학생이 아니면 담당 선생님 명부에서도 빠진다
        return self._json(200, {'ok': True, 'user': public_user(user), 'message': '회원 Role을 변경했습니다.'})

    def _teacher_set_guest(self, data: dict):
        """선생님이 자기 학생을(유료 수업을 안 들으면 등) 직접 Guest로 내릴 수 있게 한다.
        관리자 승인 없이, 담당 선생님 판단만으로 바로 처리 — 대신 '내 학생'만 가능하다."""
        actor = self._current_user()
        if not actor or actor.get('role') not in {'admin', 'teacher'}:
            return self._json(403, {'ok': False, 'message': '선생님/관리자만 처리할 수 있습니다.'})
        student = normalize_email(data.get('student', ''))
        if actor.get('role') == 'teacher':
            mine = set(load_roster().get(normalize_email(actor.get('email', '')), []))
            if student not in mine:
                return self._json(403, {'ok': False, 'message': '내 학생만 Guest로 바꿀 수 있습니다.'})
        with LOCK:
            users = _read_json(USERS_FILE, {})
            user = users.get(student)
            if not user or user.get('role') != 'student':
                raise ValueError('학생 계정을 찾을 수 없습니다.')
            assign_member_id(user, users)   # G01 같은 새 회원번호, 예전 학생번호는 이력으로 보관
            user['role'] = 'guest'
            user['approved'] = True
            user['auth_lv'] = auth_lv_for_role('guest')
            user['updated_at'] = now_ts()
            users[student] = user
            _write_json(USERS_FILE, users)
        roster_unlink(student)
        return self._json(200, {'ok': True, 'user': public_user(user), 'message': f'{user.get("name") or student} 학생을 Guest로 전환했습니다.'})

    # ------------------------------------------------------------------
    # 선생-학생 명부 + 시뮬레이션 (LOCAL)
    # ------------------------------------------------------------------

    def _verified_users(self) -> list[dict]:
        with LOCK:
            users = _read_json(USERS_FILE, {})
        return [u for u in users.values() if u.get('email_verified')]

    def _roster(self):
        user = self._current_user()
        if not user:
            return self._json(401, {'ok': False, 'message': '로그인이 필요합니다.'})
        role = user.get('role')
        me = normalize_email(user.get('email', ''))
        roster = load_roster()

        # 승인 대기(가입은 했지만 아직 담당 선생님이 없는 학생) — 선생님/관리자 누구나 보고 승인할 수 있다.
        # 승인하는 순간 그 선생님과 자동으로 매칭된다.
        pending = [public_user(u) for u in self._verified_users()
                   if u.get('role') == 'student' and not u.get('approved')]
        pending.sort(key=lambda r: r.get('created_at') or 0)

        if role == 'admin':
            teachers, students = [], []
            for u in self._verified_users():
                pu = public_user(u)
                if pu['role'] == 'teacher':
                    teachers.append(pu)
                elif pu['role'] == 'student' and pu['approved']:
                    students.append(pu)
            teachers.sort(key=lambda r: (r['name'] or r['email']))
            students.sort(key=lambda r: (r['teacher'] or '~', r['name'] or r['email']))
            return self._json(200, {'ok': True, 'scope': 'admin', 'teachers': teachers, 'students': students, 'roster': roster, 'pending': pending})

        if role == 'teacher':
            mine = set(roster.get(me, []))
            students = [public_user(u) for u in self._verified_users()
                        if u.get('role') == 'student' and normalize_email(u.get('email', '')) in mine]
            students.sort(key=lambda r: (r['name'] or r['email']))
            return self._json(200, {'ok': True, 'scope': 'teacher', 'students': students, 'pending': pending})

        # student
        return self._json(200, {'ok': True, 'scope': 'student', 'teacher': student_teacher(me)})

    def _roster_link(self, data: dict):
        actor = self._current_user()
        if not actor or actor.get('role') not in {'admin', 'teacher'}:
            return self._json(403, {'ok': False, 'message': '선생님/관리자만 학생을 배정할 수 있습니다.'})
        teacher = normalize_email(data.get('teacher', ''))
        student = normalize_email(data.get('student', ''))
        if actor.get('role') == 'teacher':
            teacher = normalize_email(actor.get('email', ''))  # 선생은 자기 자신에게만
        with LOCK:
            users = _read_json(USERS_FILE, {})
        t, s = users.get(teacher), users.get(student)
        if not t or t.get('role') not in ('teacher', 'admin') or not t.get('email_verified'):
            raise ValueError('담당 선생님 계정을 찾을 수 없습니다.')
        if not s or s.get('role') != 'student' or not s.get('email_verified'):
            raise ValueError('학생 계정을 찾을 수 없습니다.')
        roster_link(teacher, student)
        return self._json(200, {'ok': True, 'message': f'{s.get("name") or student} → {t.get("name") or teacher} 배정 완료.', 'roster': load_roster()})

    def _approve_student(self, data: dict):
        """선생님/관리자가 가입한 학생을 승인 = 그 순간 승인한 선생님과 자동으로 매칭된다."""
        actor = self._current_user()
        if not actor or actor.get('role') not in {'admin', 'teacher'}:
            return self._json(403, {'ok': False, 'message': '선생님/관리자만 승인할 수 있습니다.'})
        student = normalize_email(data.get('student', ''))
        teacher = normalize_email(actor.get('email', '')) if actor.get('role') == 'teacher' else normalize_email(data.get('teacher', ''))
        with LOCK:
            users = _read_json(USERS_FILE, {})
            s = users.get(student)
            if not s or s.get('role') != 'student' or not s.get('email_verified'):
                raise ValueError('학생 계정을 찾을 수 없습니다.')
            s['approved'] = True
            s['updated_at'] = now_ts()
            users[student] = s
            _write_json(USERS_FILE, users)
        if teacher:
            roster_link(teacher, student)
        return self._json(200, {'ok': True, 'message': f'{s.get("name") or student} 학생을 승인했습니다.'})

    def _roster_unlink(self, data: dict):
        actor = self._current_user()
        if not actor or actor.get('role') not in {'admin', 'teacher'}:
            return self._json(403, {'ok': False, 'message': '선생님/관리자만 배정을 해제할 수 있습니다.'})
        student = normalize_email(data.get('student', ''))
        if actor.get('role') == 'teacher':
            if student not in set(load_roster().get(normalize_email(actor.get('email', '')), [])):
                return self._json(403, {'ok': False, 'message': '내 학생만 해제할 수 있습니다.'})
        roster_unlink(student)
        return self._json(200, {'ok': True, 'message': '배정을 해제했습니다.', 'roster': load_roster()})

    def _dev_users(self):
        """시뮬레이션 스위처용 사용자 목록 (admin 전용, LOCAL)."""
        real = self._real_user()
        if not real or real.get('role') != 'admin':
            return self._json(403, {'ok': False, 'message': '관리자 전용입니다.'})
        rows = [public_user(u) for u in self._verified_users()]
        rows.sort(key=lambda r: ({'admin': 0, 'teacher': 1, 'student': 2}.get(r['role'], 3), r['name'] or r['email']))
        session = self._session_record() or {}
        return self._json(200, {'ok': True, 'users': rows, 'actAs': normalize_email(session.get('act_as', '')) or None})

    def _act_as(self, data: dict):
        """admin이 다른 사용자로 행동 (LOCAL 시뮬레이션). {email} 또는 {clear: true}."""
        real = self._real_user()
        if not real or real.get('role') != 'admin':
            return self._json(403, {'ok': False, 'message': '관리자 전용입니다.'})
        if data.get('clear'):
            self._set_act_as(None)
            return self._json(200, {'ok': True, 'user': public_user(real), 'actingAs': False})
        email = normalize_email(data.get('email', ''))
        with LOCK:
            users = _read_json(USERS_FILE, {})
        target = users.get(email)
        if not target or not target.get('email_verified'):
            raise ValueError('전환할 사용자를 찾을 수 없습니다.')
        self._set_act_as(email if email != normalize_email(real.get('email', '')) else None)
        return self._json(200, {
            'ok': True,
            'user': public_user(target),
            'realUser': public_user(real),
            'actingAs': email != normalize_email(real.get('email', '')),
        })

    # ------------------------------------------------------------------
    # 커리큘럼 / 진도
    # ------------------------------------------------------------------

    def _cur_actor(self):
        user = self._current_user()
        if not user:
            raise PermissionError('로그인이 필요합니다.')
        return user

    def _resolve_student(self, actor: dict, student_arg: str) -> str:
        """요청한 student 이메일 정규화. 학생 본인이면 자기 자신으로 강제."""
        if actor.get('role') == 'student':
            return normalize_email(actor.get('email', ''))
        s = normalize_email(student_arg)
        if not s:
            raise ValueError('학생을 지정하세요.')
        return s

    def _can_view(self, actor: dict, student: str) -> bool:
        role = actor.get('role')
        me = normalize_email(actor.get('email', ''))
        student = normalize_email(student)
        if role == 'admin':
            return True
        if role == 'student':
            return me == student
        if role == 'teacher':
            return student in set(load_roster().get(me, []))
        return False

    def _can_manage(self, actor: dict, student: str) -> bool:
        """배정·세션·순서 변경 = 선생/관리자만."""
        return actor.get('role') in {'admin', 'teacher'} and self._can_view(actor, student)

    def _cur_board(self, student_arg: str):
        try:
            actor = self._cur_actor()
            student = self._resolve_student(actor, student_arg)
        except (PermissionError, ValueError) as exc:
            return self._json(400, {'ok': False, 'message': str(exc)})
        if not self._can_view(actor, student):
            return self._json(403, {'ok': False, 'message': '이 학생의 커리큘럼을 볼 권한이 없습니다.'})
        if actor.get('role') == 'student' and not actor.get('approved'):
            return self._json(200, {'ok': True, 'pendingApproval': True, 'board': None, 'canManage': False})
        return self._json(200, {'ok': True, 'board': curriculum_board(student),
                                'canManage': self._can_manage(actor, student)})

    def _cur_assign(self, data: dict):
        actor = self._cur_actor()
        student = self._resolve_student(actor, data.get('student', ''))
        if not self._can_manage(actor, student):
            return self._json(403, {'ok': False, 'message': '배정 권한이 없습니다.'})
        section = str(data.get('section', '')).strip()          # 'common' | 'personal' | 'YYYY-MM-DD'
        ctype = str(data.get('type', '')).strip()
        ref_id = str(data.get('ref_id', '')).strip()
        title = str(data.get('title', '')).strip()
        if ctype not in CUR_TYPES:
            raise ValueError('자료 유형이 올바르지 않습니다.')
        if not ref_id:
            raise ValueError('자료 ref_id 가 필요합니다.')
        if section == 'common':
            if actor.get('role') not in ('teacher', 'admin'):
                return self._json(403, {'ok': False, 'message': '전체공통 편집 권한이 없습니다.'})
            with LOCK:
                master = cur_load(CUR_MASTER_FILE, [])
                if any(m.get('type') == ctype and str(m.get('ref_id')) == ref_id for m in master):
                    return self._json(200, {'ok': True, 'duplicate': True})
                order = 1 + max([m.get('order', 0) for m in master] or [0])
                master.append({'id': _new_id('m'), 'type': ctype, 'ref_id': ref_id,
                               'title': title, 'level': 1, 'order': order})
                cur_save(CUR_MASTER_FILE, master)
            return self._json(200, {'ok': True})
        if section != 'personal' and not re.match(r'^\d{4}-\d{2}-\d{2}$', section):
            raise ValueError("section 은 'common'·'personal' 또는 YYYY-MM-DD 여야 합니다.")
        if section != 'personal':
            session_get_or_create(student, section)             # 수업일 세션 자동 생성
        with LOCK:
            assigns = cur_load(CUR_ASSIGN_FILE, {})
            dup = [a for a in assigns.values()
                   if a['student'] == student and a['section'] == section
                   and a['type'] == ctype and a['ref_id'] == ref_id]
            if dup:
                return self._json(200, {'ok': True, 'assignment': dup[0], 'duplicate': True})
            order = 1 + max([a.get('order', 0) for a in assigns.values()
                             if a['student'] == student and a['section'] == section] or [0])
            row = _assign_row(student, student_teacher(student) or actor.get('email', ''),
                              section, ctype, ref_id, title, order,
                              'auto' if data.get('auto') else 'manual')
            assigns[row['id']] = row
            cur_save(CUR_ASSIGN_FILE, assigns)
        return self._json(200, {'ok': True, 'assignment': row})

    def _cur_unassign(self, data: dict):
        actor = self._cur_actor()
        aid = str(data.get('id', '')).strip()
        with LOCK:
            assigns = cur_load(CUR_ASSIGN_FILE, {})
            row = assigns.get(aid)
            if row:
                if not self._can_manage(actor, row['student']):
                    return self._json(403, {'ok': False, 'message': '해제 권한이 없습니다.'})
                assigns.pop(aid, None)
                cur_save(CUR_ASSIGN_FILE, assigns)
                return self._json(200, {'ok': True})
            # 전체공통(master) 항목 삭제
            if actor.get('role') in ('teacher', 'admin'):
                master = cur_load(CUR_MASTER_FILE, [])
                nm = [m for m in master if str(m.get('id', 'm_' + str(m.get('ref_id')))) != aid]
                if len(nm) != len(master):
                    cur_save(CUR_MASTER_FILE, nm)
                    return self._json(200, {'ok': True})
            return self._json(404, {'ok': False, 'message': '항목을 찾을 수 없습니다.'})

    def _cur_reorder(self, data: dict):
        actor = self._cur_actor()
        student = self._resolve_student(actor, data.get('student', ''))
        if not self._can_manage(actor, student):
            return self._json(403, {'ok': False, 'message': '순서 변경 권한이 없습니다.'})
        ordered = [str(x) for x in (data.get('ordered_ids') or [])]
        with LOCK:
            assigns = cur_load(CUR_ASSIGN_FILE, {})
            for i, aid in enumerate(ordered):
                if aid in assigns and assigns[aid]['student'] == student:
                    assigns[aid]['order'] = i + 1
            cur_save(CUR_ASSIGN_FILE, assigns)
        return self._json(200, {'ok': True})

    def _cur_progress_get(self, student_arg: str, ctype: str, ref_id: str):
        actor = self._cur_actor()
        student = self._resolve_student(actor, student_arg)
        if not self._can_view(actor, student):
            return self._json(403, {'ok': False, 'message': '진도를 볼 권한이 없습니다.'})
        ctype = str(ctype or '').strip()
        ref_id = str(ref_id or '').strip()
        if ctype not in CUR_TYPES or not ref_id:
            raise ValueError('type / ref_id 를 확인하세요.')
        return self._json(200, {'ok': True, 'progress': progress_get(student, ctype, ref_id)})

    def _cur_progress(self, data: dict):
        actor = self._cur_actor()
        student = self._resolve_student(actor, data.get('student', ''))
        if not self._can_view(actor, student):     # 학생·선생 둘 다 (view 권한이면 됨)
            return self._json(403, {'ok': False, 'message': '진도 기록 권한이 없습니다.'})
        ctype = str(data.get('type', '')).strip()
        ref_id = str(data.get('ref_id', '')).strip()
        if ctype not in CUR_TYPES or not ref_id:
            raise ValueError('type / ref_id 를 확인하세요.')
        checked_sections = data.get('checked_sections')
        row = progress_set(student, ctype, ref_id,
                           int(data.get('marker_index', 0)), int(data.get('total', 0)),
                           actor.get('email', ''), str(data.get('session_id') or '') or None,
                           clear=bool(data.get('clear')),
                           checked_sections=checked_sections if isinstance(checked_sections, list) else None)
        return self._json(200, {'ok': True, 'progress': row})

    def _cur_session(self, data: dict):
        import datetime as _dt
        actor = self._cur_actor()
        student = self._resolve_student(actor, data.get('student', ''))
        if not self._can_manage(actor, student):
            return self._json(403, {'ok': False, 'message': '수업일 생성 권한이 없습니다.'})
        date = str(data.get('date', '')).strip()
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', date):
            # 날짜는 넣지 않는다 — 순번용 임시 날짜만 자동 생성 (시작 체크 시 실제 날짜가 됨)
            pace = pace_get(student)
            try:
                interval = max(1, min(30, int(pace.get('interval_days') or 7)))
            except (TypeError, ValueError):
                interval = 7
            last = max((s['date'] for s in sessions_for(student)), default='')
            base = _dt.date.fromisoformat(last) if re.match(r'^\d{4}-\d{2}-\d{2}$', last or '') else _dt.date.today()
            date = (base + _dt.timedelta(days=interval)).isoformat()
        return self._json(200, {'ok': True, 'session': session_get_or_create(student, date)})

    def _cur_session_delete(self, data: dict):
        actor = self._cur_actor()
        sid = str(data.get('session_id', '')).strip()
        with LOCK:
            sess = cur_load(CUR_SESSIONS_FILE, {})
            row = sess.get(sid)
            if not row:
                return self._json(404, {'ok': False, 'message': '수업일을 찾을 수 없습니다.'})
            if not self._can_manage(actor, row['student']):
                return self._json(403, {'ok': False, 'message': '권한이 없습니다.'})
            student, date = row['student'], row['date']
            sess.pop(sid, None)
            cur_save(CUR_SESSIONS_FILE, sess)
            # 그 회차에 배정된 항목도 제거
            assigns = cur_load(CUR_ASSIGN_FILE, {})
            for aid in [a for a, v in assigns.items() if v.get('student') == student and v.get('section') == date]:
                assigns.pop(aid, None)
            cur_save(CUR_ASSIGN_FILE, assigns)
            # seq 다시 매김
            mine = sorted([s for s in sess.values() if s.get('student') == student], key=lambda s: s.get('date', ''))
            for i, s in enumerate(mine, start=1):
                s['seq'] = i
            cur_save(CUR_SESSIONS_FILE, sess)
        # 관련 회차 노트/homework 는 그대로 두되 board 에서만 사라짐
        try:
            snotes = cur_load(CUR_SNOTE_FILE, {}); snotes.pop(sid, None); cur_save(CUR_SNOTE_FILE, snotes)
        except Exception:
            pass
        # 그 회차에 있던 강의가 지워졌으니 커서도 되감는다 — 안 그러면 다음 자동배치가
        # 실제로는 없는 강의 뒤부터 이어져 앞 강의가 통째로 비는 문제가 생긴다.
        recompute_pace_cursor(student, actor.get('email', ''))
        return self._json(200, {'ok': True, 'board': curriculum_board(student)})

    def _cur_session_start(self, data: dict):
        """회차 '시작' = 학생에게 열림. 시작 전에는 학생은 내용만 보고 액션 불가."""
        actor = self._cur_actor()
        sid = str(data.get('session_id', '')).strip()
        started = bool(data.get('started'))
        with LOCK:
            sess = cur_load(CUR_SESSIONS_FILE, {})
            row = sess.get(sid)
            if not row:
                return self._json(404, {'ok': False, 'message': '수업일을 찾을 수 없습니다.'})
            if not self._can_manage(actor, row['student']):
                return self._json(403, {'ok': False, 'message': '권한이 없습니다.'})
            row['started'] = started
            row['started_at'] = now_ts() if started else None
            sess[sid] = row
            cur_save(CUR_SESSIONS_FILE, sess)
        return self._json(200, {'ok': True, 'board': curriculum_board(row['student'])})

    def _cur_session_done(self, data: dict):
        actor = self._cur_actor()
        sid = str(data.get('session_id', '')).strip()
        done = bool(data.get('done'))
        with LOCK:
            sess = cur_load(CUR_SESSIONS_FILE, {})
            row = sess.get(sid)
            if not row:
                return self._json(404, {'ok': False, 'message': '수업일을 찾을 수 없습니다.'})
            if not self._can_manage(actor, row['student']):
                return self._json(403, {'ok': False, 'message': '완료 처리 권한이 없습니다.'})
            was_done = bool(row.get('done'))
            row['done'] = done
            row['done_by'] = normalize_email(actor.get('email', '')) if done else None
            row['done_at'] = now_ts() if done else None
            sess[sid] = row
            cur_save(CUR_SESSIONS_FILE, sess)
            if was_done != done:
                log = cur_load(CUR_LOG_FILE, [])
                log.append({
                    'student': row['student'], 'type': 'session', 'ref_id': sid,
                    'session_id': sid,
                    'from_idx': 1 if was_done else 0, 'to_idx': 1 if done else 0,
                    'at': now_ts(), 'by': normalize_email(actor.get('email', '')),
                })
                cur_save(CUR_LOG_FILE, log[-2000:])
        return self._json(200, {'ok': True, 'session': row, 'board': curriculum_board(row['student'])})

    def _cur_master_get(self):
        actor = self._cur_actor()
        rows = sorted(cur_load(CUR_MASTER_FILE, []), key=lambda m: m.get('order', 0))
        return self._json(200, {'ok': True, 'master': rows,
                                'canEdit': actor.get('role') in {'admin', 'teacher'}})

    def _cur_master_set(self, data: dict):
        actor = self._cur_actor()
        if actor.get('role') not in {'admin', 'teacher'}:
            return self._json(403, {'ok': False, 'message': '마스터 순서열은 선생/관리자만 편집합니다.'})
        items = data.get('master')
        if not isinstance(items, list):
            raise ValueError('master 는 배열이어야 합니다.')
        clean = []
        for i, m in enumerate(items):
            if not isinstance(m, dict):
                continue
            ctype = str(m.get('type', '')).strip()
            ref_id = str(m.get('ref_id', '')).strip()
            if ctype not in CUR_TYPES or not ref_id:
                continue
            clean.append({
                'id': str(m.get('id') or _new_id('m')),
                'type': ctype, 'ref_id': ref_id,
                'title': str(m.get('title', '')),
                'level': int(m.get('level', 1) or 1),
                'order': i + 1,
            })
        cur_save(CUR_MASTER_FILE, clean)
        return self._json(200, {'ok': True, 'master': clean})

    # ── 자동 스케줄: 단원 순서열(syllabus) + 학생 속도(pace) ──

    def _cur_syllabus_get(self):
        actor = self._cur_actor()
        rows = syllabus_ensure_seeded()
        rows = sorted(rows, key=lambda u: (str(u.get('track', '1')), u.get('order', 0)))
        return self._json(200, {'ok': True, 'syllabus': rows,
                                'canEdit': actor.get('role') in {'admin', 'teacher'}})

    def _cur_syllabus_set(self, data: dict):
        actor = self._cur_actor()
        if actor.get('role') not in {'admin', 'teacher'}:
            return self._json(403, {'ok': False, 'message': '단원 순서열은 선생/관리자만 편집합니다.'})
        if data.get('seed'):
            return self._json(200, {'ok': True, 'syllabus': syllabus_ensure_seeded(force=bool(data.get('force')))})
        items = data.get('syllabus')
        if not isinstance(items, list):
            raise ValueError('syllabus 는 배열이어야 합니다.')
        by_track: dict[str, int] = {}
        clean = []
        for u in items:
            if not isinstance(u, dict):
                continue
            unit = str(u.get('unit', '')).strip()
            if not unit:
                continue
            track = _track_of(u.get('track', '1'))
            by_track[track] = by_track.get(track, 0) + 1
            yt = u.get('youtube') or []
            clean.append({
                'id': str(u.get('id') or _new_id('syl')),
                'track': track,
                'order': by_track[track],
                'unit': unit,
                'title': str(u.get('title', '') or unit),
                'lecture': str(u.get('lecture', '') or unit),
                'youtube': [str(v).strip() for v in yt if str(v).strip()][:10],
                'word': str(u.get('word', '') or unit),
                'review': str(u.get('review', '') or unit),
            })
        cur_save(CUR_SYLLABUS_FILE, clean)
        return self._json(200, {'ok': True, 'syllabus': clean})

    def _cur_overview(self, view: str = ''):
        """대시보드 첫 화면: 학생=본인 보드, 선생/관리자=담당 학생 요약 목록.
        관리자는 선생님을 겸할 수 있어서(자기 앞으로도 학생을 배정받을 수 있음), view='teacher'면
        관리자도 '내 학생만'(자기 명부) 기준으로 반전해서 본다 — 기본은 전체(모든 선생님-학생)."""
        actor = self._cur_actor()
        role = actor.get('role')
        me = normalize_email(actor.get('email', ''))
        if role == 'student':
            if not actor.get('approved'):
                return self._json(200, {'ok': True, 'role': 'student', 'pendingApproval': True})
            return self._json(200, {'ok': True, 'role': 'student',
                                    'board': curriculum_board(me),
                                    'summary': curriculum_summary(me)})
        roster = load_roster()
        admin_as_teacher = role == 'admin' and view == 'teacher'
        if role == 'admin' and not admin_as_teacher:
            emails = [normalize_email(u.get('email', '')) for u in self._verified_users()
                      if u.get('role') == 'student']
        else:
            emails = [normalize_email(e) for e in roster.get(me, [])]
        users_by_email = {normalize_email(u.get('email', '')): u for u in self._verified_users()}
        students = []
        for em in emails:
            u = users_by_email.get(em)
            if not u:
                continue
            students.append({
                'email': em,
                'name': u.get('name') or em,
                'level': u.get('level', 1),
                'teacher': student_teacher(em),
                'summary': curriculum_summary(em),
            })
        students.sort(key=lambda s: (s['summary']['behind'] == 0, s['name']))
        # 승인 대기 학생(선생님/관리자 누구나 승인 가능 — 승인하는 순간 그 선생님과 자동 매칭)
        pending = [public_user(u) for u in self._verified_users()
                   if u.get('role') == 'student' and not u.get('approved')]
        pending.sort(key=lambda r: r.get('created_at') or 0)
        return self._json(200, {'ok': True, 'role': role, 'students': students, 'pending': pending,
                                'canToggleView': role == 'admin', 'viewingAs': 'teacher' if admin_as_teacher else role})

    def _cur_sources(self):
        """자료함 위젯용 드래그 소스 목록. 강의 = KorLecture manifest (준비된 것만)."""
        actor = self._cur_actor()
        lectures = []
        for les in _lecture_manifest_lessons():
            lid = str(les.get('lesson_id') or '').strip()
            if not lid:
                continue
            status = str(les.get('status') or '')
            lectures.append({
                'unit': lid,
                'title': str(les.get('title') or lid),
                'grammar': str(les.get('grammar') or ''),
                'level': str(les.get('level') or ''),
                'ready': status in ('ready', 'draft'),
            })
        return self._json(200, {'ok': True, 'lectures': lectures,
                                'canManage': actor.get('role') in {'admin', 'teacher'}})

    # ── W04 복습(첨삭) 서버 저장 ──

    def _hw_get(self, student_arg: str, ref: str):
        actor = self._cur_actor()
        student = self._resolve_student(actor, student_arg)
        if not self._can_view(actor, student):
            return self._json(403, {'ok': False, 'message': '이 학생의 복습을 볼 권한이 없습니다.'})
        ref = str(ref or '').strip()
        if not ref:
            raise ValueError('ref 가 필요합니다.')
        return self._json(200, {'ok': True, 'homework': homework_get(student, ref),
                                'canEdit': self._can_view(actor, student)})

    def _hw_set(self, data: dict):
        actor = self._cur_actor()
        student = self._resolve_student(actor, data.get('student', ''))
        # 첨삭은 학생·선생 둘 다 저장 가능 (view 권한이면 됨) — 실제로는 선생이 주로 쓴다.
        if not self._can_view(actor, student):
            return self._json(403, {'ok': False, 'message': '복습 저장 권한이 없습니다.'})
        ref = str(data.get('ref') or '').strip()
        if not ref:
            raise ValueError('ref 가 필요합니다.')
        hw = data.get('homework')
        if not isinstance(hw, dict):
            raise ValueError('homework 객체가 필요합니다.')
        row = homework_set(student, ref, hw, actor.get('email', ''))
        return self._json(200, {'ok': True, 'homework': row})

    # ── 판서(ScreenInk) 캡처 저장 목록 — 학생·회차별로 여러 장 ──

    def _bc_get(self, student_arg: str, session_id: str):
        actor = self._cur_actor()
        student = self._resolve_student(actor, student_arg)
        if not self._can_view(actor, student):
            return self._json(403, {'ok': False, 'message': '이 학생의 판서를 볼 권한이 없습니다.'})
        session_id = str(session_id or '').strip()
        if not session_id:
            raise ValueError('session_id 가 필요합니다.')
        return self._json(200, {'ok': True, 'items': board_captures_get(student, session_id),
                                'canManage': self._can_manage(actor, student)})

    def _bc_add(self, data: dict):
        actor = self._cur_actor()
        student = self._resolve_student(actor, data.get('student', ''))
        if not self._can_view(actor, student):
            return self._json(403, {'ok': False, 'message': '판서 저장 권한이 없습니다.'})
        session_id = str(data.get('session_id') or '').strip()
        if not session_id:
            raise ValueError('session_id 가 필요합니다.')
        image = str(data.get('image') or '')
        if not image:
            raise ValueError('image 가 필요합니다.')
        items = board_captures_add(student, session_id, image, actor.get('email', ''))
        return self._json(200, {'ok': True, 'items': items})

    def _bc_delete(self, data: dict):
        actor = self._cur_actor()
        student = self._resolve_student(actor, data.get('student', ''))
        if not self._can_view(actor, student):
            return self._json(403, {'ok': False, 'message': '판서 삭제 권한이 없습니다.'})
        session_id = str(data.get('session_id') or '').strip()
        capture_id = str(data.get('id') or '').strip()
        if not session_id or not capture_id:
            raise ValueError('session_id/id 가 필요합니다.')
        items = board_captures_delete(student, session_id, capture_id)
        return self._json(200, {'ok': True, 'items': items})

    # ── W15 문장 저장 — 학생·회차별로 여러 개 ──

    def _sent_get(self, student_arg: str, session_id: str):
        actor = self._cur_actor()
        student = self._resolve_student(actor, student_arg)
        if not self._can_view(actor, student):
            return self._json(403, {'ok': False, 'message': '이 학생의 문장을 볼 권한이 없습니다.'})
        session_id = str(session_id or '').strip()
        if not session_id:
            raise ValueError('session_id 가 필요합니다.')
        return self._json(200, {'ok': True, 'items': sentences_get(student, session_id),
                                'canManage': self._can_manage(actor, student)})

    def _sent_add(self, data: dict):
        actor = self._cur_actor()
        student = self._resolve_student(actor, data.get('student', ''))
        if not self._can_view(actor, student):
            return self._json(403, {'ok': False, 'message': '문장 저장 권한이 없습니다.'})
        session_id = str(data.get('session_id') or '').strip()
        if not session_id:
            raise ValueError('session_id 가 필요합니다.')
        text = str(data.get('text') or '')
        if not text.strip():
            raise ValueError('문장 내용이 필요합니다.')
        items = sentences_add(student, session_id, text, actor.get('email', ''))
        return self._json(200, {'ok': True, 'items': items})

    def _sent_update(self, data: dict):
        actor = self._cur_actor()
        student = self._resolve_student(actor, data.get('student', ''))
        if not self._can_view(actor, student):
            return self._json(403, {'ok': False, 'message': '문장 수정 권한이 없습니다.'})
        session_id = str(data.get('session_id') or '').strip()
        sentence_id = str(data.get('id') or '').strip()
        if not session_id or not sentence_id:
            raise ValueError('session_id/id 가 필요합니다.')
        items = sentences_update(student, session_id, sentence_id, data)
        return self._json(200, {'ok': True, 'items': items})

    def _sent_delete(self, data: dict):
        actor = self._cur_actor()
        student = self._resolve_student(actor, data.get('student', ''))
        if not self._can_view(actor, student):
            return self._json(403, {'ok': False, 'message': '문장 삭제 권한이 없습니다.'})
        session_id = str(data.get('session_id') or '').strip()
        sentence_id = str(data.get('id') or '').strip()
        if not session_id or not sentence_id:
            raise ValueError('session_id/id 가 필요합니다.')
        items = sentences_delete(student, session_id, sentence_id)
        return self._json(200, {'ok': True, 'items': items})

    def _cur_snote_set(self, data: dict):
        actor = self._cur_actor()
        sid = str(data.get('session_id') or '').strip()
        with LOCK:
            sess = cur_load(CUR_SESSIONS_FILE, {})
            row = sess.get(sid)
            if not row:
                return self._json(404, {'ok': False, 'message': '수업일을 찾을 수 없습니다.'})
            if not self._can_view(actor, row['student']):
                return self._json(403, {'ok': False, 'message': '권한이 없습니다.'})
            can_manage = self._can_manage(actor, row['student'])
            notes = cur_load(CUR_SNOTE_FILE, {})
            cur = notes.get(sid) or {}
            for k in ('q', 'a', 'talk'):
                if k in data:
                    if k in ('a', 'talk') and not can_manage:
                        return self._json(403, {'ok': False, 'message': '이 항목은 선생님만 입력할 수 있습니다.'})
                    cur[k] = str(data[k] or '')[:8000]
            notes[sid] = cur
            cur_save(CUR_SNOTE_FILE, notes)
        return self._json(200, {'ok': True, 'notes': cur})

    def _cur_names_set(self, data: dict):
        actor = self._cur_actor()
        student = self._resolve_student(actor, data.get('student', ''))
        if not self._can_manage(actor, student):
            return self._json(403, {'ok': False, 'message': '이름표 수정 권한이 없습니다.'})
        with LOCK:
            alln = cur_load(CUR_NAMES_FILE, {})
            row = alln.get(student) or {}
            for k in ('teacher', 'student'):
                if k in data:
                    row[k] = str(data[k] or '')[:60]
            alln[student] = row
            cur_save(CUR_NAMES_FILE, alln)
        return self._json(200, {'ok': True, 'names': row})

    def _cur_pace_get(self, student_arg: str):
        actor = self._cur_actor()
        student = self._resolve_student(actor, student_arg)
        if not self._can_view(actor, student):
            return self._json(403, {'ok': False, 'message': '이 학생의 속도 프로필을 볼 권한이 없습니다.'})
        return self._json(200, {'ok': True, 'pace': pace_get(student),
                                'suggestion': pace_suggestion(student),
                                'canEdit': self._can_manage(actor, student)})

    def _cur_pace_set(self, data: dict):
        actor = self._cur_actor()
        student = self._resolve_student(actor, data.get('student', ''))
        if not self._can_manage(actor, student):
            return self._json(403, {'ok': False, 'message': '속도 프로필 수정 권한이 없습니다.'})
        row = pace_set(student, {
            'track': data.get('track'),
            'units_per_session': data.get('units_per_session'),
            'extra_youtube': data.get('extra_youtube'),
            'cursor': data.get('cursor'),
            'interval_days': data.get('interval_days'),
            'dist_rules': data.get('dist_rules'),
            'yt_sort': data.get('yt_sort'),
        }, actor.get('email', ''))
        return self._json(200, {'ok': True, 'pace': row})

    def _cur_autofill(self, data: dict):
        """새 수업일(회차)에 커서부터 속도만큼 단원을 자동 배정한다. source='auto'."""
        actor = self._cur_actor()
        student = self._resolve_student(actor, data.get('student', ''))
        if not self._can_manage(actor, student):
            return self._json(403, {'ok': False, 'message': '자동 배정 권한이 없습니다.'})
        date = str(data.get('date', '')).strip()
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', date):
            raise ValueError('날짜는 YYYY-MM-DD 형식이어야 합니다.')
        want = data.get('units')
        want = int(want) if want not in (None, '') else None

        r = autofill_one(student, date, actor.get('email', ''), want)
        out = {'ok': True, 'added': r['added'], 'units': r['units'], 'cursor': r['cursor'],
               'board': curriculum_board(student),
               'canManage': self._can_manage(actor, student)}
        if r.get('exhausted'):
            out['exhausted'] = True
            out['message'] = '순서열 끝에 도달했습니다. 순서열을 늘리거나 속도를 확인하세요.'
        return self._json(200, out)

    def _cur_bulk_autofill(self, data: dict):
        """(n)차 수업자동배치: 다음 수업일부터 간격만큼 n개 회차를 만들고 각 회차에 자동 배정."""
        import datetime as _dt
        actor = self._cur_actor()
        student = self._resolve_student(actor, data.get('student', ''))
        if not self._can_manage(actor, student):
            return self._json(403, {'ok': False, 'message': '자동 배정 권한이 없습니다.'})
        try:
            count = max(1, min(40, int(data.get('count') or 1)))
        except (TypeError, ValueError):
            count = 1
        pace = pace_get(student)
        try:
            interval = max(1, min(30, int(pace.get('interval_days') or 7)))
        except (TypeError, ValueError):
            interval = 7
        sess = sessions_for(student)
        last = max((s['date'] for s in sess), default='')
        if last and re.match(r'^\d{4}-\d{2}-\d{2}$', last):
            start = _dt.date.fromisoformat(last) + _dt.timedelta(days=interval)
        else:
            start = _dt.date.today()
        want_lecture = bool(data.get('want_lecture', True))
        email = actor.get('email', '')
        made = []
        for i in range(count):
            d = (start + _dt.timedelta(days=interval * i)).isoformat()
            session_get_or_create(student, d)
            if want_lecture:
                r = autofill_one(student, d, email)
                made.append({'date': d, 'added': r['added']})
                if r.get('exhausted'):
                    break
            else:
                # "강의" 체크 해제 — 회차만 만들고 강의/단어/복습은 안 채운다 (유튜브만 나중에 채울 수 있게)
                made.append({'date': d, 'added': 0})
        return self._json(200, {'ok': True, 'made': made,
                                'board': curriculum_board(student),
                                'canManage': self._can_manage(actor, student)})

    def _cur_regenerate(self, data: dict):
        """미래·미완료 수업일의 auto(비잠금) 배정을 지우고 커서를 되감아 다시 채운다.
        과거 회차·완료 회차·수동(locked) 항목은 건드리지 않는다."""
        actor = self._cur_actor()
        student = self._resolve_student(actor, data.get('student', ''))
        if not self._can_manage(actor, student):
            return self._json(403, {'ok': False, 'message': '재생성 권한이 없습니다.'})
        today = str(data.get('from', '')).strip() or time.strftime('%Y-%m-%d')
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', today):
            raise ValueError('from 은 YYYY-MM-DD 형식이어야 합니다.')

        sess = sessions_for(student)
        # 재생성 대상 = 오늘 이후(포함) & 미완료 수업일
        future = sorted([s for s in sess if s['date'] >= today and not s.get('done')],
                        key=lambda s: (s['date'], s.get('seq', 0)))
        future_dates = {s['date'] for s in future}

        removed = 0
        with LOCK:
            assigns = cur_load(CUR_ASSIGN_FILE, {})
            for aid in list(assigns):
                a = assigns[aid]
                if (a.get('student') == student and a.get('section') in future_dates
                        and a.get('source') == 'auto' and not a.get('locked')):
                    del assigns[aid]
                    removed += 1
            cur_save(CUR_ASSIGN_FILE, assigns)
        # 커서 되감기: track 순서에서 "이미 확정된" 단원(과거·완료 회차 또는 잠금/수동 강의 배정)의
        # 연속 접두사 길이만큼.
        cursor = recompute_pace_cursor(student, actor.get('email', ''), today)

        refilled = []
        for s in future:
            r = autofill_one(student, s['date'], actor.get('email', ''))
            refilled.append({'date': s['date'], 'units': r['units'], 'added': r['added']})
            if r.get('exhausted'):
                break

        return self._json(200, {
            'ok': True, 'removed': removed, 'from': today,
            'cursor': cursor, 'refilled': refilled,
            'board': curriculum_board(student),
            'canManage': self._can_manage(actor, student),
        })

    def _signup(self, data: dict):
        email = normalize_email(data.get('email', ''))
        password = str(data.get('password', ''))
        name = str(data.get('name', '')).strip()[:50]
        if not EMAIL_RE.match(email):
            raise ValueError('올바른 이메일(ID)을 입력하세요.')
        if len(password) < 8:
            raise ValueError('비밀번호는 8자 이상으로 설정하세요.')

        code = make_code()
        with LOCK:
            users = _read_json(USERS_FILE, {})
            existing = users.get(email)
            if existing and existing.get('email_verified'):
                return self._json(409, {'ok': False, 'message': '이미 가입된 이메일입니다. 로그인해 주세요.'})
            salt, digest = password_hash(password)
            created_at = existing.get('created_at') if existing else now_ts()
            users[email] = {
                'email': email,
                'name': name or email.split('@')[0],
                'password_salt': salt,
                'password_hash': digest,
                'email_verified': False,
                'verification_hash': code_hash(code),
                'verification_expires_at': now_ts() + CODE_MINUTES * 60,
                'role': ('admin' if email == normalize_email(BOOTSTRAP_ADMIN_EMAIL) else (existing.get('role', 'student') if existing else 'student')),
                'level': existing.get('level', 1) if existing else 1,
                'auth_lv': existing.get('auth_lv') if existing and existing.get('auth_lv') is not None else auth_lv_for_role('admin' if email == normalize_email(BOOTSTRAP_ADMIN_EMAIL) else (existing.get('role', 'student') if existing else 'student')),
                'access': existing.get('access', 'free') if existing else 'free',
                'created_at': created_at,
                'updated_at': now_ts(),
            }
            _write_json(USERS_FILE, users)
        add_outbox(email, 'verify', code)
        return self._json(200, {'ok': True, 'email': email, 'message': '회원정보를 저장했습니다. LOCAL 인증메일함에서 인증코드를 확인하세요.'})

    def _verify(self, data: dict):
        email = normalize_email(data.get('email', ''))
        code = str(data.get('code', '')).strip()
        with LOCK:
            users = _read_json(USERS_FILE, {})
            user = users.get(email)
            if not user:
                raise ValueError('가입 정보를 찾을 수 없습니다.')
            if user.get('email_verified'):
                return self._json(200, {'ok': True, 'message': '이미 이메일 인증이 완료되었습니다.'})
            if user.get('verification_expires_at', 0) < now_ts():
                raise ValueError('인증코드가 만료되었습니다. 인증코드를 다시 받아주세요.')
            if not hmac.compare_digest(user.get('verification_hash', ''), code_hash(code)):
                raise ValueError('인증코드가 일치하지 않습니다.')
            user['email_verified'] = True
            user['verification_hash'] = None
            user['verification_expires_at'] = None
            if not user.get('member_id'):
                assign_member_id(user, users)
            # 학생은 선생님이 승인해야 강의실이 열린다(승인 = 그 선생님과 자동 매칭). 선생님/관리자는 승인 불필요.
            if 'approved' not in user:
                user['approved'] = user.get('role') != 'student'
            if user.get('role') in ('student', 'guest') and user.get('learning_level') not in LEARNING_LEVELS:
                user['learning_level'] = LEARNING_LEVEL_DEFAULT
            user['updated_at'] = now_ts()
            users[email] = user
            _write_json(USERS_FILE, users)
        return self._json(200, {'ok': True, 'message': '이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다.'})

    def _resend(self, data: dict):
        email = normalize_email(data.get('email', ''))
        code = make_code()
        with LOCK:
            users = _read_json(USERS_FILE, {})
            user = users.get(email)
            if not user:
                raise ValueError('가입 정보를 찾을 수 없습니다.')
            if user.get('email_verified'):
                raise ValueError('이미 인증된 계정입니다.')
            user['verification_hash'] = code_hash(code)
            user['verification_expires_at'] = now_ts() + CODE_MINUTES * 60
            user['updated_at'] = now_ts()
            users[email] = user
            _write_json(USERS_FILE, users)
        add_outbox(email, 'verify', code)
        return self._json(200, {'ok': True, 'message': '새 인증코드를 발급했습니다.'})

    def _login(self, data: dict):
        email = normalize_email(data.get('email', ''))
        password = str(data.get('password', ''))
        with LOCK:
            users = _read_json(USERS_FILE, {})
            user = users.get(email)
            if not user or not password_ok(password, user.get('password_salt', ''), user.get('password_hash', '')):
                return self._json(401, {'ok': False, 'message': '이메일(ID) 또는 비밀번호가 올바르지 않습니다.'})
            if not user.get('email_verified'):
                return self._json(403, {'ok': False, 'code': 'EMAIL_NOT_VERIFIED', 'email': email, 'message': '이메일 인증을 먼저 완료하세요.'})
            sessions = _read_json(SESSIONS_FILE, {})
            token = secrets.token_urlsafe(32)
            sessions[token] = {'email': email, 'created_at': now_ts(), 'expires_at': now_ts() + SESSION_DAYS * 86400, 'ip': self._client_ip()}
            _write_json(SESSIONS_FILE, sessions)
        self._log_ip(email, 'login', self._client_ip())
        cookie = session_cookie(token)
        return self._json(200, {'ok': True, 'user': public_user(user)}, cookie=cookie)

    def _logout(self):
        token = self._session_token()
        if token:
            with LOCK:
                sessions = _read_json(SESSIONS_FILE, {})
                sessions.pop(token, None)
                _write_json(SESSIONS_FILE, sessions)
        cookie = clear_session_cookie()
        return self._json(200, {'ok': True}, cookie=cookie)

    def _forgot(self, data: dict):
        email = normalize_email(data.get('email', ''))
        code = make_code()
        with LOCK:
            users = _read_json(USERS_FILE, {})
            user = users.get(email)
            # 실제 WEB에서는 계정 존재 여부를 노출하지 않는 방식으로 유지할 예정.
            if user and user.get('email_verified'):
                user['reset_hash'] = code_hash(code)
                user['reset_expires_at'] = now_ts() + CODE_MINUTES * 60
                user['updated_at'] = now_ts()
                users[email] = user
                _write_json(USERS_FILE, users)
                add_outbox(email, 'reset', code)
        return self._json(200, {'ok': True, 'email': email, 'message': '가입된 이메일이면 비밀번호 재설정 인증코드가 발급되었습니다.'})

    def _reset(self, data: dict):
        email = normalize_email(data.get('email', ''))
        code = str(data.get('code', '')).strip()
        password = str(data.get('password', ''))
        if len(password) < 8:
            raise ValueError('새 비밀번호는 8자 이상으로 설정하세요.')
        with LOCK:
            users = _read_json(USERS_FILE, {})
            user = users.get(email)
            if not user or not user.get('reset_hash'):
                raise ValueError('비밀번호 재설정 요청을 찾을 수 없습니다.')
            if user.get('reset_expires_at', 0) < now_ts():
                raise ValueError('재설정 인증코드가 만료되었습니다.')
            if not hmac.compare_digest(user.get('reset_hash', ''), code_hash(code)):
                raise ValueError('인증코드가 일치하지 않습니다.')
            salt, digest = password_hash(password)
            user['password_salt'] = salt
            user['password_hash'] = digest
            user['reset_hash'] = None
            user['reset_expires_at'] = None
            user['updated_at'] = now_ts()
            users[email] = user
            _write_json(USERS_FILE, users)
        return self._json(200, {'ok': True, 'message': '비밀번호를 변경했습니다. 새 비밀번호로 로그인하세요.'})


class ReuseServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == '__main__':
    ensure_bootstrap_admin()
    ensure_member_ids()
    print('')
    print('========================================')
    print('  KorEdu LOCAL Portal + Auth')
    print('========================================')
    print(f'Portal : http://{HOST}:{PORT}/')
    print(f'Auth data: {DATA_ROOT}')
    print('LOCAL email verification uses the in-app LOCAL mailbox.')
    print('Google OAuth will be connected in the WEB/Supabase step.')
    print('')
    with ReuseServer((HOST, PORT), Handler) as httpd:
        watcher = threading.Thread(target=_lifecycle_watchdog, args=(httpd,), daemon=True, name='KorEduLifecycle')
        watcher.start()
        httpd.serve_forever()
