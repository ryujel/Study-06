# korlec.com — 웹 Claude Code 채팅창 안내서

> 새 채팅창을 열 때 이 문서를 첫 메시지로 붙여넣으세요.
> 관리할 폴더 = **GitHub `ryujel/korlec` 저장소 전체** (실제 구조를 읽어서 작성, 2026-10-03 기준 `main` = `e875900`).
> `□` 표시는 아직 확인 못 한 값입니다. 채팅창의 Claude에게 "찾아서 채워줘"라고 하면 됩니다.
> **비밀번호·API 키·토큰은 이 문서에 적지 마세요.** 환경변수는 이름만 적습니다.

## 1. 한눈에

| 항목 | 내용 |
|---|---|
| 사이트 | **korlec.com** (한국어 강의교재 사이트, 코드 이름 KorEdu) |
| 관리 폴더 | GitHub **`ryujel/korlec`** (private) — https://github.com/ryujel/korlec |
| 이 채팅창의 역할 | korlec.com **웹 배포 전용**: 코드(GitHub) · DB(Supabase) · 배포(Vercel) |
| 다른 채팅창 | 내 PC용 KorEdu 로컬 포털(Drive `KorEdu` 폴더)은 별도 채팅창. 섞지 않는다. |

흐름: **코드 수정 → GitHub push → Vercel 자동 배포(이때 DB 변경도 적용) → 사이트는 Supabase 데이터를 사용**

## 2. 세 서비스 이름표

| 서비스 | 하는 일 | 이 프로젝트에서 |
|---|---|---|
| **GitHub** | 코드 보관 | `ryujel/korlec`, 기본 브랜치 `main` |
| **Supabase** | 회원·명부·학생 데이터 | 프로젝트 이름 □ / ref □ / 지역 □ |
| **Vercel** | 사이트 배포 | 프로젝트 이름 □ / 도메인 `korlec.com`(연결 여부 □) |

## 3. korlec 폴더 지도 (실제 구조)

저장소는 "내 PC용 KorEdu 전체"와 "웹용 코드"가 한 곳에 있습니다. 웹에서 쓰는 곳에 ★를 붙였습니다.

```
korlec/
├─ index.html, portal.js, portal.css, curriculumStore.js   ★ 포털 화면 (사이트 첫 화면)
├─ api/                    ★ 웹 서버 기능 (Vercel 서버리스, 로그인·회원·명부)
│  ├─ _lib/                  supabase.js(DB 호출) · session.js(로그인 세션) · people.js
│  ├─ auth/  admin/  dev/  local/  curriculum/  roster.js  persistent-state.js
│  └─ [...path].js           나머지 주소 처리
├─ supabase/               ★ DB 변경 기록만 둔다
│  └─ migrations/            0001_users_roster.sql, 0002_student_data.sql … (번호 이어서)
├─ scripts/migrate.js      ★ 배포할 때 새 SQL만 자동 적용
├─ vercel.json             ★ 배포 설정 (/lec/1-01/ → 강의 폴더 연결)
├─ package.json            ★ 의존성(pg)과 migrate 명령
├─ Textbook/KorLecture/    ★ 강의교재 Lev1~3 (약 89개 과 폴더, 이름 규칙 Lev1-01-00)
│  └─ manifest/lessons.js    과 목록
├─ Textbook/강의원문_transcript/   강의 원문 텍스트
├─ Tool/                     수업 위젯 (01Chatting 대화 · 02Markup 판서 · 03TextComment 첨삭 · 04~05 한글/쓰기 · MakingText)
├─ VideoScript/              유튜브 자막 학습 도구
├─ admin/                    관리자 페이지 (import-state.html)
├─ docs/                     설계·계획 문서 (CURRICULUM_SPEC.md 등)
├─ md/                       HANDOFF 문서, 자막 AI MASTER 프롬프트 00~08
├─ portal_server.py, koredu_launcher.py, START/STOP_KOREDU.*, seed_*.py   내 PC 로컬 실행용 (웹 배포와 무관)
└─ README_MASTER.md          전체 설명 (로컬 중심, 웹 내용은 아직 없음)
```

### 폴더 관리 규칙

1. **DB 변경은 `supabase/migrations/`에만.** 새 파일은 `0003_이름.sql`처럼 **번호를 이어서** 만든다. 이미 적용된 파일은 고치지 않고 새 파일로 바꾼다.
2. **웹 서버 기능은 `api/`에만.** 화면 코드는 루트의 `portal.*`, 강의는 `Textbook/KorLecture/`.
3. **로컬 전용 파일**(`portal_server.py`, `START_KOREDU.*`, `seed_*.py`)은 웹 작업 중 건드리지 않는다.
4. 새 설명 문서는 `docs/`, 인수인계 문서는 `md/HANDOFF_날짜_주제.md`.
5. `.env`, `*.zip`, `*.bak`, `*_DATA/`, `*.exe`는 올리지 않는다(`.gitignore`에 이미 있음).
6. 강의 폴더 이름은 `Lev{급}-{번호2자리}-00` 형식을 지킨다(주소 연결 규칙이 이 이름에 의존: `vercel.json`).

## 4. 환경변수 (코드에서 확인한 이름 — 값은 Vercel에만)

| 이름 | 용도 | 비고 |
|---|---|---|
| `SUPABASE_URL` | Supabase 주소 | `api/_lib/supabase.js` |
| `SUPABASE_SERVICE_KEY` | 서버 전용 관리자 키 | **브라우저로 보내면 안 됨** |
| `SUPABASE_DB_URL` | 배포 시 DB 변경 적용용 연결 주소 (Session pooler) | 없으면 DB 변경을 건너뜀 |
| `AUTH_SECRET` | 로그인 세션 서명 | `api/_lib/session.js` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | 초기 관리자 계정 | 비밀번호는 문서에 적지 않기 |

□ 위 5~6개가 Vercel에 모두 들어 있는지는 **이름만** 확인합니다(값은 보지 않기).

## 5. Claude에게 주는 작업 규칙 (저장소 `CLAUDE.md`로 복사 — 지금 korlec에는 `CLAUDE.md`가 없음)

1. 사용자는 개발자가 아니다 → 한국어로 짧고 쉽게 설명한다.
2. 작업 브랜치에서만 수정하고 **`main`에 바로 push하지 않는다.** PR은 사용자가 요청할 때만 만든다. (`main` push는 곧 운영 배포다.)
3. 되돌리기 어려운 일은 먼저 확인한다: DB 삭제·수정(drop, truncate), 환경변수 변경, 도메인/DNS 변경, 운영 배포.
4. 로그인·회원 코드(`api/auth`, `api/_lib/session.js`) 변경은 보안 영향을 먼저 설명한다.
5. 비밀번호·키·토큰을 파일, 커밋, 채팅에 쓰지 않는다.
6. 3장의 폴더 규칙에 맞는 위치에 파일을 만든다. 애매하면 먼저 묻는다.
7. 변경 후에는 "무엇을 바꿨고, 어디서 확인하는지"를 3줄 이내로 알린다.

## 6. 자주 하는 일 (채팅창에 이렇게 말하기)

| 하고 싶은 일 | 요청 문장 |
|---|---|
| 현재 상태 점검 | "GitHub 최신 커밋, Vercel 마지막 배포, Supabase 테이블 목록을 표로 알려줘" |
| 화면 수정 | "○○ 화면의 ○○를 바꿔줘 (브랜치에서)" |
| DB 표 추가 | "`supabase/migrations/0003_○○.sql`을 작성해줘. 적용은 배포할 때 자동이니 내용 먼저 보여줘" |
| 강의 추가 | "`Lev3-07-00` 폴더를 기존 과 구조대로 만들고 `manifest/lessons.js`에 등록해줘" |
| 배포 전 확인 | "이번 변경이 운영에 영향이 있는지 체크리스트로 알려줘" |
| 오류 | "Vercel 배포 로그에서 실패 이유를 쉬운 말로 설명해줘" |

## 7. 새 채팅창 첫 메시지 (복사해서 쓰기)

```
이 채팅창은 korlec.com 웹 배포 전용이야. 관리할 폴더는 GitHub ryujel/korlec 저장소야.
- Supabase: □
- Vercel: □
첨부한 KORLEC_CLAUDE_CODE_GUIDE.md의 폴더 지도와 작업 규칙을 따라줘.
먼저 저장소를 읽고 안내서와 다른 점이 있으면 표로 알려줘. 아직 수정은 하지 마.
```

## 8. 처음 한 번만 확인 (체크리스트)

- [ ] 새 채팅창에 GitHub `ryujel/korlec` 연결(쓰기 권한 포함)
- [ ] Supabase 프로젝트 이름·ref·지역을 2장에 기입
- [ ] Vercel 프로젝트 이름, `korlec.com` 도메인 연결, GitHub 연동(push → 자동 배포) 확인
- [ ] 4장 환경변수 이름이 Vercel에 있는지 확인
- [ ] 이 채팅창에서 쓸 수 있는 연결(GitHub / Supabase / Vercel) 확인
- [ ] `CLAUDE.md`를 저장소에 추가(5장 복사) — PR로 올리기

## 9. 채팅창 구분

| 채팅창 | 대상 | 제목 |
|---|---|---|
| ① KorEdu 로컬 | Drive `KorEdu` 폴더, `portal_server.py` | `KorEdu-로컬` |
| ② korlec 웹 (이번 것) | GitHub `ryujel/korlec` + Supabase + Vercel | `korlec-웹배포` |
| ③ 연습용 | `ryujel/Study-06` | `Study-06-연습` |

## 10. 주의: 같은 코드가 두 곳에 있음

Drive `KorEdu` 폴더와 GitHub `korlec`에 같은 파일(`portal.js` 등)이 따로 있습니다. 한쪽만 고치면 서로 달라집니다.
**웹(korlec.com)에 반영할 변경은 GitHub `korlec`에서 하고, 내 PC용은 Drive에서** 한다는 기준을 정하세요. (이번 세션의 로그인 패치 `KorEdu_patched/`는 Drive 기준이라 korlec에는 아직 반영되지 않았습니다. `api/auth/`가 로그인 처리를 따로 하므로 그대로 적용되지도 않습니다.)
