# korlec.com 인계 문서 — 회원관리 · 문법리스트 · 배포 (2026-10-09)

> 다른 채팅창에서 이어서 작업할 때 이 문서를 첫 메시지로 붙여넣으세요.
> 대상은 **GitHub `ryujel/korlec` 저장소 하나**입니다. 사용자는 개발자가 아닙니다. 쉬운 한국어로, 짧게 설명하세요.
> 이 문서에는 비밀번호·키·토큰을 적지 않았습니다. 적지도 마세요.

## 1. 반드시 지킬 것 (사용자 지시)

1. **웹 서버 하나로만 작업한다.** 작업 대상은 `ryujel/korlec`(GitHub) + Supabase(DB) + Vercel(배포)뿐이다.
2. **Drive의 옛 로컬 폴더와 PC 로컬 서버는 절대 참조하지 않는다.** 읽지도, 수정하지도, 설명에 끌어오지도 않는다. (사용자가 명시적으로 금지함.)
3. **"main에 반영"이라고 말한다.** ("합친다/merge"는 헷갈려 한다.) 반영 전에 항상 묻는다: *"main에 반영할까요? (반영하면 바로 사이트에 올라갑니다)"*
4. **사용자에게 되묻기를 줄인다.** 이미 알아낼 수 있는 것(다른 채팅창 기록, 저장소 코드)은 먼저 직접 찾는다. 선택지를 늘어놓지 말고 추천 하나를 말한다. 두 번 이상 짜증을 냈다("어쩌라는 거야", "왜 이렇게 복잡해").
5. **평문 비밀번호를 파일·DB·채팅·커밋에 쓰지 않는다.** DB에는 암호화된 값만(`password_hash` 컬럼, 아직 미사용).
6. **되돌리기 어려운 일은 먼저 확인한다:** DB 삭제·수정(drop/truncate), 환경변수, 도메인, `main` 반영.

## 2. 구조

| 구성 | 내용 |
|---|---|
| 코드 | GitHub `ryujel/korlec`, 기본 브랜치 `main` |
| 배포 | Vercel 프로젝트 `korlec` (무료 Hobby 플랜), 도메인 `korlec.com` |
| DB | Supabase. 서버만 service key로 접근(RLS 켜고 정책 없음) |
| 서버 기능 | `api/` 폴더 (Vercel 서버리스) |
| 화면 | `index.html` + `portal.js` + `portal.css` (빌드 없음, 정적) |
| 환경변수 이름 | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_DB_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (값은 Vercel에만) |

### 가장 중요한 제약 3가지
1. **서버 기능 파일은 12개까지.** (Hobby 한도, 현재 정확히 12개.) 새 `api/*.js` 파일을 만들면 배포가 실패한다("No more than 12 Serverless Functions"). 새 기능은 **기존 파일 안에 넣고** `vercel.json`의 `rewrites`로 주소를 연결한다. 핸들러 본체는 `api/_lib/`(밑줄 폴더는 함수로 안 센다)에 둔다.
   - 현재 파일: `admin/users`, `ai/index`, `auth/login`, `auth/logout`, `auth/me`, `curriculum/index`, `curriculum/overview`, `dev/users`, `fallback`, `local/[action]`, `persistent-state`, `roster`.
   - 본보기: `/api/admin/set-role → api/admin/users?action=set-role`, `/api/roster/link|unlink → api/roster?action=…`, `/api/auth/name → api/auth/me?action=name`, `/api/grammar-tags* → api/curriculum/index?action=…`.
2. **`main`에 올리면 곧 운영 배포다.** 그리고 배포(빌드) 때 `scripts/migrate.js`가 `supabase/migrations/*.sql` 중 **새 파일을 실제 DB에 자동 적용**한다(파일 이름으로 적용 여부를 기록). 이미 적용된 파일은 수정하지 말고 새 번호 파일을 만든다.
   - 브랜치 푸시도 Vercel이 **미리보기 빌드**를 만들고, 그 빌드도 같은 DB에 마이그레이션을 실행했을 수 있다.
3. **Vercel 배포 용량 10GB 한도를 이미 넘긴 적이 있다**(저장소 전체 약 100MB를 배포마다 올림). 오래된 배포는 지워지고 그 미리보기 주소는 410이 된다. 용량 경고가 다시 뜨면 오래된/오류 배포를 지우게 안내한다.

## 3. 이번 작업에서 만든 것 (모두 `main`에 반영 완료)

### 3-1. 회원관리 (Mypage → 회원관리, 관리자 전용)
- 표 열: 회원ID | 회원(이름·이메일) | Role | 권한레벨 | 학습레벨 | 담당 선생님 | 저장. 제목 `회원관리`, 새로고침 버튼 없음, 위쪽 빈 공간 제거.
- **관리자가 한 행에서 바꿀 수 있는 것:** Role, 권한레벨(0/1/2/3/10), 학습레벨(초급/중급/고급, 학생·손님만), 담당 선생님(학생만, 선택 즉시 저장). 한 `저장` 버튼으로 Role+권한레벨+학습레벨이 같이 저장된다.
- 최초 Admin(`ryujel@naver.com`)과 현재 로그인한 관리자는 Role을 바꿀 수 없다.
- 권한레벨은 **직접 바꿨을 때만** 서버로 보낸다. Role만 바꾸면 서버가 새 Role의 기본값으로 맞춘다(관리자 0, 선생님 1, 학생 2, 손님 10).
- **Myinfo에서 회원 이름을 직접 수정**할 수 있다(`POST /api/auth/name`, 본인 이름만). Myinfo에는 회원ID·권한레벨·학습레벨도 읽기 전용으로 보인다.
- **Mypage 메뉴는 마우스를 올리면 열린다**(클릭은 열기만, 닫지 않음 — 터치 대비). 위젯 작업창이 열려 있어도 메뉴가 위로 뜬다(헤더 `z-index` 50).

### 3-2. 회원 데이터 규칙 (DB `profiles` 표)
| 항목 | 규칙 |
|---|---|
| 회원번호 `member_id` | 관리자 `AT01`, 선생님 `T01`, 학생 `S0000001`, 손님 `G01`. Role이 바뀌면 새 번호를 받고 예전 번호는 `previous_member_ids`(jsonb)에 보관. 기존 `A01` 같은 관리자 번호는 `AT##`로 자동 변환됨 |
| 권한레벨 `auth_lv` | 0/1/2/3/10만 허용(DB 제약). 숫자가 작을수록 권한이 세다. 3은 학생 예약값 |
| 학습레벨 `learning_level` | 초급/중급/고급만(DB 제약). 학생·손님만 가짐. 값이 없으면 강의 급수(`level`)로 정함: Lev1=초급, Lev2·3=중급, Lev4=고급 |
| 승인 `approved` | 학생이 되면 다시 승인 필요. 담당 선생님을 지정하면 승인된 것으로 처리 |
| 비밀번호 | `password_hash`, `must_change_password` 컬럼만 만들어 둠. **회원별 비밀번호 로그인은 아직 없다** |
| 권한·번호 부여 함수 | `assign_missing_member_ids()`, `set_member_role(email, role, learning, auth)`, `set_student_teacher(student, teacher)` — 모두 DB 함수, 서버(service key)만 호출 가능 |

관련 마이그레이션: `0003_member_fields.sql`, `0008_set_member_role_auth.sql`. 샘플 회원 7명은 `supabase/seed/members_sample.sql`(자동 적용 안 됨, 필요할 때만 SQL Editor에서 직접 실행, 비밀번호 없음).

### 3-3. 문법리스트 (Mypage → 문법리스트)
- 다른 채팅창("korlec환경setup 유튜브")이 만든 작업이 `claude/modest-cerf-v8z26r` 브랜치에만 있어서 사이트에 없었다. 이를 `main`에 반영했다(커밋 `c849c1f`).
- 데이터는 **Supabase `video_grammar_tags` 표**(영상 1행, `tags`는 jsonb)에 있다. 확인: `https://korlec.com/api/grammar-tags-all`을 로그인한 상태로 열면 JSON이 나온다. 현재 영상 `tuPgTkrk8tM` 1개만 있다.
- API는 `api/curriculum/index.js`의 `grammar-tags`, `grammar-tags-all`, `grammar-tags-unregistered`.
- 화면 기능: 강의별/영상별 묶음, 분할 화면, 엑셀식 다단계 정렬, 순차 재생, `기초제외`(은/는, 이/가, 을/를, 의, 도, 와/과).

## 4. 겪은 문제와 원인 (같은 실수 방지)

| 증상 | 원인 | 해결/교훈 |
|---|---|---|
| 회원관리가 안 바뀜 | 수정이 브랜치에만 있고 `main`에 없었음 | "main에 반영"해야 사이트에 나간다 |
| 배포가 계속 Error | 서버 파일 4개를 새로 만들어 16개 → Hobby 한도(12) 초과 | 기존 파일에 합치고 `vercel.json` rewrites 사용 |
| 처음엔 용량·작성자 문제로 의심했으나 아니었다 | 실제 로그가 한 줄로 원인을 알려줬다 | **추측 전에 Build Logs부터 본다** |
| 문법리스트가 "사라짐" | 그 작업이 다른 브랜치의 미리보기에만 있었고 미리보기가 삭제됨 | 새 기능이 미리보기엔 보이는데 정식 주소에 없으면 `main` 미반영을 먼저 의심 |
| Mypage 하위 메뉴가 안 보임 | 헤더 `z-index`(30)가 오른쪽 위젯 작업창(43~46)보다 낮았음 | 헤더 50으로 상향 |
| 문법 목록이 비어 보임 | 옛 코드가 PC의 `localhost:8123`을 부르던 구조 | 웹에서는 `PIPELINE_ORIGIN`이 빈 값(같은 주소)이라 `/api/…`로 간다 |

## 5. 남은 일 · 알려진 한계

1. **문법 데이터 구조 개선(급하지 않음):** 지금은 영상 1행에 태그가 통째로 들어 있고, `grammar-tags-all`이 전체를 한 번에 내려준다. Vercel 응답 한도(약 4.5MB) 때문에 영상이 **약 50~70개**를 넘으면 문법리스트가 안 열린다(영상 1개 응답이 대략 6~8만 자, 추정). 영상이 20~30개를 넘기 전에 "매칭 1건 = 1행" 표로 바꾸고 서버가 걸러서(강의/영상/문법별, 페이지 나눔) 주도록 바꾼다. 사용자에게는 아직 결정을 받지 못했다.
2. **문법 태그를 만드는 규칙이 없다.** AI 후처리 설정(`scripts/ai/rules.js`)에서 문법 단계는 "보류" 상태다. 다른 영상의 문법 태그는 아직 DB에 없다.
3. **회원별 로그인은 없다.** 웹 로그인은 환경변수의 관리자 1명(`ADMIN_EMAIL`)뿐이라 선생님·학생이 직접 로그인하지 못한다. Google 로그인 등은 501(미구현). 비밀번호 재설정·가입·인증메일도 미구현. Myinfo 이름 수정도 지금은 관리자만 쓸 수 있다.
4. **엑셀 샘플의 PWD 열:** 사용자가 "초기 비밀번호를 한 번만 넣고 이후 변경을 요구"하는 방식에 동의했지만 **구현하지 않았다.** 구현할 때 `password_hash`(암호화)만 쓰고 평문은 어디에도 두지 않는다.
5. **회원번호 재사용:** 학생이 다른 Role로 바뀌면 그 번호가 비어, 다음에 학생이 되는 사람이 같은 번호를 받을 수 있다(이전 번호 이력에는 옛 주인이 남음). 번호를 한 사람에게 영구히 묶을지 사용자에게 아직 묻지 못했다.
6. **로컬 서버에 기대는 코드가 남아 있다:** `VideoScript/player.html`, `VideoScript/index.html`, 엑셀 패치 파일 2개, 강의 진도 파일 1개에 `localhost` 호출이 있다. 웹으로 옮길 대상이다(문법 부분은 끝남).
7. **다른 채팅창의 미반영 작업 점검:** 이전 채팅창이 만든 브랜치가 `main`에 반영됐는지 확인되지 않은 것이 더 있을 수 있다(예: `claude/gallant-mendel-6uo6g7`(위젯 설명보기), `claude/optimistic-cannon-smft2f`(강의교재)). `git fetch` 후 `git log main..origin/<브랜치>`로 확인하고 사용자에게 알린다.
8. **Study-06 저장소(`ryujel/Study-06`, 브랜치 `claude/clever-lovelace-3736xy`)에 옛 로컬용 패치 폴더가 남아 있다.** 사용하지 않는 파일이다(참조 금지). 지울지는 사용자에게 묻는다.

## 6. 작업 방법 (검증된 절차)

- **저장소 받기:** `git clone --depth 1 https://github.com/ryujel/korlec /home/user/korlec` (push 권한이 필요하면 `add_repo`를 push로).
- **작업 순서:** 새 브랜치에서 수정 → 시험 → 브랜치에 푸시 → 사용자에게 "main에 반영할까요?" → 동의하면 `git push origin <브랜치>:main`(빨리감기일 때만, `git merge-base --is-ancestor origin/main HEAD`로 확인). 충돌이 나면 `main`을 먼저 가져와 풀고 시험한 뒤 올린다.
- **화면 시험:** `python3 -m http.server`로 저장소를 띄우고 `playwright-core`(`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`)로 `/api/**`를 가짜 응답으로 막아 확인. 주소 `…/index.html#admin`, `#grammar-admin`, `#mypage`.
- **서버 함수 시험:** `fetch`를 가짜로 바꾸고 핸들러에 `{method, query:{action}, body, headers:{cookie}}`를 넣어 호출. 쿠키 이름은 `api/_lib/session.js`의 `COOKIE`(현재 `korlec_session`)를 쓴다.
- **DB 변경 시험:** `@electric-sql/pglite`로 `0001`부터 순서대로 적용하고 두 번 실행해도 같은 결과인지(멱등) 확인. Supabase에는 직접 접속하지 못한다.
- **커밋 작성자:** 사용자 쪽 Vercel이 작성자 때문에 막았던 것은 아니었다(원인은 서버 파일 수). 그래도 안전하게 하려면 작성자를 사용자(`ryujel`)로 하고 `Co-Authored-By` 줄을 남긴다.
- **배포 확인:** Vercel → korlec → Deployments에서 맨 위가 **Ready**인지 → 로그에 `[migrate] 적용: <파일>`이 있는지 → `https://korlec.com`을 **Ctrl+Shift+R**로 새로고침. 정확한 Vercel 직접 링크는 계정 이름을 몰라 못 만든다(대시보드에서 들어가게 안내).
- `korlec.com`은 이 환경에서 직접 열 수 없다(프록시 차단). 실제 화면은 사용자의 캡처로 확인한다.

## 7. 주요 커밋 (`ryujel/korlec`)

| 커밋 | 내용 |
|---|---|
| `1e0ba1d` | 회원번호·권한/학습레벨 컬럼, Myinfo 이름 수정 (`0003`) |
| `8ea9115` | 관리자가 Role·학습레벨·담당 선생님 저장 |
| `07b5a8e`, `b4ccc33` | Mypage 메뉴 겹침 수정, 마우스 올리면 열림 |
| `a694405` | 스크립트 캐시 버전 갱신(작성자 `ryujel`) |
| `7339390` | 서버 기능 12개 한도에 맞춤(rewrites 방식) |
| `73c55dc` | 회원관리 화면 정리, 권한레벨 수정(`0008_set_member_role_auth`) |
| `c849c1f` | 문법리스트 브랜치를 `main`에 반영 |
