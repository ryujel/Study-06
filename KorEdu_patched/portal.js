(() => {
  const MODULES = {
    video: {
      label: '영상',
      items: [
        { id: 'youtube', label: '유튜브', type: 'iframe', url: 'http://localhost:8120/' },
        { id: 'localvideo', label: '동영상', type: 'placeholder', title: '동영상 학습', text: '로컬/웹 동영상 모듈이 이 영역에 연결됩니다.' }
      ]
    },
    textbook: {
      label: '교재',
      items: [
        { id: 'lecture', label: '강의', type: 'iframe', url: 'http://localhost:8121/' },
        { id: 'conversation', label: '대화', type: 'placeholder', title: '대화교재', text: '대화 중심 학습 모듈을 연결할 자리입니다.' },
        { id: 'explanation', label: '설명', type: 'placeholder', title: '설명교재', text: '문법·표현 설명 중심의 교재 모듈을 연결할 자리입니다.' }
      ]
    },
    topik: {
      label: 'TOPIK',
      direct: true,
      items: [
        { id: 'main', label: 'TOPIK', type: 'placeholder', title: 'TOPIK', text: 'TOPIK 학습 및 문제풀이 모듈을 연결할 자리입니다.' }
      ]
    }
  };

  const WIDGETS = {
    word: { code: 'W01', title: '단어', mode: 'multi', scope: 'VIDEO + STUDENT_VIDEO', text: '위에는 자막 추출 단어, 아래에는 학생이 직접 저장한 단어를 표시합니다.' },
    sentence: { code: 'W15', title: '문장', mode: 'multi', scope: 'VIDEO + STUDENT_VIDEO', text: '강의를 듣다가 웹페이지에서 복사하거나 말해서 문장을 저장합니다. 강의실 위젯에서 학생·회차를 선택한 상태에서 사용하세요.' },
    grammar: { code: 'W02', title: '문법', mode: 'multi', scope: 'VIDEO_COMMON', text: '영상에서 학습할 문법·조사를 버튼으로 표시합니다.' },
    questions: { code: 'W03', title: 'QA', mode: 'multi', scope: 'VIDEO_COMMON', text: '자막 기반 질문·답변을 표시하며 타임스탬프로 영상과 연결합니다.' },
    homework: { code: 'W04', title: '복습', mode: 'multi', scope: 'TEACHER_STUDENT_VIDEO', text: '' },
    curriculum: { code: 'W05', title: '강의실', mode: 'multi', scope: 'STUDENT', common: true, text: '' },
    library: { code: 'W08', title: '자료함', mode: 'multi', scope: 'STUDENT', common: true, text: '' },
    dialogue: { code: 'W06', title: '대화', mode: 'multi', scope: 'TEACHER_STUDENT_VIDEO', text: '' },
    memo: { code: 'W16', title: '메모', mode: 'multi', scope: 'TEACHER_STUDENT', text: '' },
    board: { code: 'W09', title: '판서', mode: 'toggle', scope: 'SCREEN', text: '화면 전체에 덮는 필기 오버레이' },
    writing: { code: 'W10', title: '쓰기', mode: 'multi', scope: 'STUDENT', text: '' },
    hangeul1: { code: 'W11', title: '한글1', mode: 'multi', scope: 'STUDENT', text: '' },
    hangeul2: { code: 'W12', title: '한글2', mode: 'multi', scope: 'STUDENT', text: '' },
    lecturelist: { code: 'W13', title: '강의목록', mode: 'multi', scope: 'STUDENT', text: '' },
    videolist: { code: 'W14', title: '영상목록', mode: 'multi', scope: 'STUDENT', text: '' },
    settings: { code: 'W07', title: '설정', mode: 'single', scope: 'USER_LOCAL', text: '오른쪽 작업공간 전체를 사용하는 단독 설정 위젯입니다.' }
  };

  const state = { section: null, item: null, navPreview: null, widget: null, moduleUrl: null, user: null, authMode: 'login', authEmail: '', page: 'home', adminPreview: 'master', widgetMulti: [], widgetSingle: null, widgetWidth: 460, widgetHeights: {}, widgetSizes: {}, widgetRowWeights: {}, widgetColRatios: {}, wordContext: null, wordList: null, wordLoading: false, wordApiConfigured: null, wordMessage: '', wordOccurrenceCursor: {}, savedWordOccurrenceCursor: {}, wordPipeline: {}, wordStageLoading: '', settingsMessage: '', savedStudentWords: [], wordView: 'extracted', wordSourceSelection: { extracted: true, saved: true }, learningLanguage: 'en', wordLanguage: 'en', questionList: null, questionMessage: '', questionStudentAnswers: {}, questionLanguage: 'en', questionSort: '', questionSortDir: 'asc', questionShowAnswer: true, questionShowStudent: true, questionShowTranslation: true, homework: { image: '', comments: [], color: '#e02424', size: 2.4 }, actingAs: false, realUser: null, devUsers: null, curriculum: { student: '', roster: null, board: null, canManage: false, loading: false, error: '', pace: null, syllabus: null, typeFilter: 'all', reviewIncomplete: true, view: 'sessions', collapsed: {}, wordlists: {}, sentences: {}, reviews: {}, boardCaptures: {}, activeReview: null, activeSessionId: '', reviewTab: 'review', _collapsedInit: false, bulkN: 4, bulkYt: true, bulkLec: true, bulkFrom: null, showBulkCfg: false, filterSort: 'session', wordMergeAll: false, wordChecked: {}, wordCollapsed: {}, libList: [], distN: 2, distFrom: 2 }, library: { lectures: null, loading: false, error: '', filter: '' }, curDash: { data: null, loading: false, error: '', openStudent: '', view: '' }, lectureContext: null, grammar: { tags: [], loading: false, sort: 'time', videoId: '', showUnreg: false, selected: '', hideBasic: false, allTags: null, allLoading: false, adminMode: '', adminLessonId: '', adminVideoId: '', adminSeconds: 0, adminSort: 'lesson', adminHideBasic: false }, keepYoutube: false, secretMode: true };
  const REMEMBER_ID_KEY = 'koredu_remembered_login_id';
  const LEARNING_LANG_KEY = 'koredu_learning_language_v1';
  const WORD_LANG_KEY = 'koredu_w01_translation_language_v1'; // 구버전 값 마이그레이션/호환
  const QUESTION_LANG_KEY = 'koredu_w03_translation_language_v1'; // 구버전 값 마이그레이션/호환
  // 강의(KorLecture) 화면마다 따로 있던 번역/읽기속도를 상단 메뉴의 전역 설정으로 통일.
  const READING_XLATE_KEY = 'koredu_reading_translation_on_v1';
  const READING_SPEED_KEY = 'koredu_reading_speed_v1';
  const QUESTION_VIEW_KEY = 'koredu_w03_view_v2';
  const WORD_VIEW_KEY = 'koredu_w01_view_v1';
  const LEARNING_LANGS = {
    en: { code: 'EN', name: 'English' },
    es: { code: 'ES', name: 'Español' },
    zh: { code: 'ZH', name: '中文' },
    ja: { code: 'JA', name: '日本語' },
    de: { code: 'DE', name: 'Deutsch' },
    pt: { code: 'PT', name: 'Português' },
    fr: { code: 'FR', name: 'Français' },
    vi: { code: 'VI', name: 'Tiếng Việt' },
    id: { code: 'ID', name: 'Bahasa Indonesia' },
    th: { code: 'TH', name: 'ไทย' },
    ru: { code: 'RU', name: 'Русский' },
    it: { code: 'IT', name: 'Italiano' },
    pl: { code: 'PL', name: 'Polski' },
    tr: { code: 'TR', name: 'Türkçe' },
    nl: { code: 'NL', name: 'Nederlands' }
  };
  const WORD_LANGS = Object.fromEntries(Object.entries(LEARNING_LANGS).map(([key, item]) => [key, item.code]));
  const normalizeLearningLanguage = value => LEARNING_LANGS[String(value || '').toLowerCase()] ? String(value || '').toLowerCase() : 'en';
  let initialLearningLanguage = 'en';
  try {
    initialLearningLanguage = localStorage.getItem(LEARNING_LANG_KEY)
      || localStorage.getItem(WORD_LANG_KEY)
      || localStorage.getItem(QUESTION_LANG_KEY)
      || 'en';
  } catch (_) {}
  state.learningLanguage = normalizeLearningLanguage(initialLearningLanguage);
  state.wordLanguage = state.learningLanguage;
  state.questionLanguage = state.learningLanguage;
  try { state.readingTranslationOn = localStorage.getItem(READING_XLATE_KEY) === '1'; } catch (_) { state.readingTranslationOn = false; }
  try { state.readingSpeed = [0.6, 0.7, 0.8, 0.9, 1].includes(Number(localStorage.getItem(READING_SPEED_KEY))) ? Number(localStorage.getItem(READING_SPEED_KEY)) : 1; } catch (_) { state.readingSpeed = 1; }
  try {
    const savedQuestionView = JSON.parse(localStorage.getItem(QUESTION_VIEW_KEY) || '{}');
    if (savedQuestionView && typeof savedQuestionView === 'object') {
      state.questionSort = ['question','answer','student'].includes(savedQuestionView.sort) ? savedQuestionView.sort : '';
      state.questionSortDir = savedQuestionView.dir === 'desc' ? 'desc' : 'asc';
      state.questionShowAnswer = savedQuestionView.showAnswer !== false;
      state.questionShowStudent = savedQuestionView.showStudent !== false;
      state.questionShowTranslation = savedQuestionView.showTranslation !== false;
    }
  } catch (_) {}
  try {
    const savedWordView = JSON.parse(localStorage.getItem(WORD_VIEW_KEY) || '{}');
    if (savedWordView && typeof savedWordView === 'object') {
      state.wordView = savedWordView.view === 'saved' ? 'saved' : 'extracted';
      state.wordSourceSelection = {
        extracted: savedWordView.extracted !== false,
        saved: savedWordView.saved !== false
      };
    }
  } catch (_) {}
  try {
    // 종류 필터(전체/유튜브/강의/...)는 저장해서 되살리지 않는다 — 강의실 위젯을 열 때마다
    // 항상 "전체"로 시작해야, 지난번에 다른 필터를 눌러놨어도 다음에 헷갈리지 않는다.
    const cv = localStorage.getItem('koredu_cur_view');
    if (['sessions', 'grid'].includes(cv)) state.curriculum.view = cv;
  } catch (_) {}
  const body = document.body;
  const primaryNav = document.getElementById('primaryNav');
  const homeView = document.getElementById('homeView');
  const classroomView = document.getElementById('classroomView');
  const myPageView = document.getElementById('myPageView');
  const moduleView = document.getElementById('moduleView');
  const adminView = document.getElementById('adminView');
  const adminUserList = document.getElementById('adminUserList');
  const grammarAdminView = document.getElementById('grammarAdminView');
  const headerPageTitle = document.getElementById('headerPageTitle');
  const moduleFrame = document.getElementById('moduleFrame');

  // 위젯 워크스페이스가 붙는 모듈 화면. host 값 = 임베드된 iframe 종류.
  const MODULE_ORIGINS = { youtube: 'http://localhost:8120', lecture: 'http://localhost:8121' };
  const PIPELINE_ORIGIN = 'http://localhost:8123';
  function widgetHost() {
    if (state.page !== 'module') return null;
    if (state.section === 'video' && state.item === 'youtube') return 'youtube';
    if (state.section === 'textbook' && state.item === 'lecture') return 'lecture';
    return null;
  }
  // 위젯 레일은 통일: 위젯을 붙일 수 있는 모듈 화면(영상 YouTube / 교재 강의)이면
  // 모든 위젯을 쓸 수 있고, 켜고 끄기는 레일 버튼(활성화 여부)으로 관리한다.
  // (페이지별 disable/enable 은 추후 별도 설정으로.)
  const WIDGET_HOSTS = {};
  // 지금 메인 화면 자체가 그 내용(영상 목록/교재 목록)을 보여주고 있을 땐, 같은 걸 위젯으로
  // 또 띄우는 건 자기 자신을 중복으로 여는 셈이라 막는다.
  // 단어·문법·QA(word/grammar/questions)는 유튜브 자막 기반 위젯이라 교재(강의) 화면에서는
  // 애초에 동작하지 않으니 — 교재 화면에서는 이 셋도 같이 비활성화한다.
  function widgetAllowedOnHost(widgetId, host = widgetHost()) {
    if (!host) return false;
    if (host === 'youtube' && widgetId === 'videolist') return false;
    if (host === 'lecture') {
      if (widgetId === 'lecturelist') return false;
      if (widgetId === 'word' || widgetId === 'grammar' || widgetId === 'questions') return false;
    }
    return true;
  }
  const placeholderView = document.getElementById('placeholderView');
  const placeholderTitle = document.getElementById('placeholderTitle');
  const placeholderText = document.getElementById('placeholderText');
  const moduleStatusText = document.getElementById('moduleStatusText');
  const openExternal = document.getElementById('openExternal');
  const widgetWorkspace = document.getElementById('widgetWorkspace');
  const widgetMultiGrid = document.getElementById('widgetMultiGrid');
  const widgetSingleStage = document.getElementById('widgetSingleStage');
  const widgetSplitter = document.getElementById('widgetSplitter');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const authLangSelect = document.getElementById('authLangSelect');
  const authTitle = document.getElementById('authTitle');
  const authDescription = document.getElementById('authDescription');
  const authSubmit = document.getElementById('authSubmit');
  const authForm = document.getElementById('authForm');
  const authMessage = document.getElementById('authMessage');
  const accountArea = document.getElementById('accountArea');
  const nameField = document.getElementById('nameField');
  const passwordField = document.getElementById('passwordField');
  const rememberIdField = document.getElementById('rememberIdField');
  const rememberId = document.getElementById('rememberId');
  const passwordConfirmField = document.getElementById('passwordConfirmField');
  const verifyCodeField = document.getElementById('verifyCodeField');
  const newPasswordField = document.getElementById('newPasswordField');
  const loginLinks = document.getElementById('loginLinks');
  const verifyActions = document.getElementById('verifyActions');
  const socialDivider = document.getElementById('socialDivider');
  const googleLogin = document.getElementById('googleLogin');
  const localMailbox = document.getElementById('localMailbox');
  const mailCard = document.getElementById('mailCard');
  const classroomGreeting = document.getElementById('classroomGreeting');
  const classroomBadges = document.getElementById('classroomBadges');
  const profileAvatar = document.getElementById('profileAvatar');
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profileRole = document.getElementById('profileRole');
  const profileLevel = document.getElementById('profileLevel');
  const profileAccess = document.getElementById('profileAccess');
  const profileVerified = document.getElementById('profileVerified');

  async function api(path, options = {}) {
    const response = await fetch(path, {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: 'same-origin'
    });
    let data = {};
    try { data = await response.json(); } catch (_) {}
    // 로그인이 풀렸다(IP가 바뀌어 해제된 경우 등) → 계정 상태를 다시 읽어 안내를 띄우고 로그인 화면으로
    if (response.status === 401 && state.user && !String(path).startsWith('/api/auth/') && !api._reauth) {
      api._reauth = true;
      try { await renderAccount(); } finally { api._reauth = false; }
    }
    if (!response.ok) {
      const err = new Error(data.message || `요청 실패 (${response.status})`);
      err.status = response.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function syncHeaderNav(previewSection = null) {
    // Sub menus are only a hover preview. Selection is represented by the centered header title.
    const visibleSection = previewSection || null;
    document.querySelectorAll('[data-nav-cluster]').forEach(cluster => {
      const sectionId = cluster.dataset.navCluster;
      cluster.classList.toggle('open', sectionId === visibleSection && sectionId !== 'topik');
    });
    document.querySelectorAll('.master-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.masterSection === state.section);
    });
    document.querySelectorAll('.sub-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.subSection === state.section && btn.dataset.subItem === state.item);
    });
  }

  function previewMaster(sectionId) {
    state.navPreview = sectionId;
    syncHeaderNav(sectionId === 'topik' ? null : sectionId);
  }

  function restoreActiveMenu() {
    state.navPreview = null;
    syncHeaderNav();
  }

  function setHeaderTitle(title = '') {
    if (!headerPageTitle) return;
    headerPageTitle.innerHTML = title ? `<span class="header-page-badge">${escapeHtml(title)}</span>` : '';
  }

  function isManager(user = state.user) {
    return !!user && (user.role === 'admin' || user.role === 'teacher');
  }

  function hideMainViews() {
    homeView.hidden = true;
    classroomView.hidden = true;
    myPageView.hidden = true;
    if (adminView) adminView.hidden = true;
    if (grammarAdminView) grammarAdminView.hidden = true;
    moduleView.hidden = true;
  }

  function resetModuleShell() {
    leaveYouTubeWidgetSession();
    state.section = null;
    state.item = null;
    state.moduleUrl = null;
    moduleFrame.src = 'about:blank';
    state.navPreview = null;
    state.curriculum.activeSessionId = '';
    syncHeaderNav();
    suspendWidgetWorkspace();
    showYoutubeForWidgets();
  }

  function roleLabel(role) {
    return ({ admin: '관리자', teacher: '교사', student: '학생', guest: 'Guest' })[role] || role || '학생';
  }

  function accessLabel(access) {
    return ({ free: 'FREE', paid: 'PAID' })[access] || String(access || 'FREE').toUpperCase();
  }

  // Admin 은 sim-select 로 실제 계정에 그대로 들어가 볼 수 있어서, 등급만 흉내내던
  // "Content Level" 미리보기 드롭다운은 더 이상 필요 없다 (제거됨) — admin 은 항상 master.
  function previewContext() {
    if (state.user?.role !== 'admin') {
      return {
        role: state.user?.role || 'student',
        level: Number(state.user?.level || 1),
        contentLevel: String(state.user?.content_level || state.user?.contentLevel || '')
      };
    }
    return { role: 'admin', level: 1, contentLevel: 'master' };
  }

  function syncPreviewShell() {
    const ctx = previewContext();
    body.dataset.contentPreview = '';
    body.dataset.effectiveRole = ctx.role;
    body.dataset.effectiveLevel = String(ctx.level || 1);
  }


  function fillAccountViews() {
    const user = state.user;
    if (!user) return;
    const displayName = user.name || user.email?.split('@')[0] || '사용자';
    if (classroomGreeting) classroomGreeting.textContent = `${displayName}님의 ${user.role === 'admin' ? '관리 강의실' : '강의실'}`;
    if (classroomBadges) classroomBadges.innerHTML = `
      <span>${escapeHtml(roleLabel(user.role))}</span>
      <span>Level ${escapeHtml(user.level ?? 1)}</span>
      <span>${escapeHtml(accessLabel(user.access))}</span>`;
    profileAvatar.textContent = displayName.slice(0, 1).toUpperCase();
    profileName.textContent = displayName;
    profileEmail.textContent = user.email || '-';
    profileRole.textContent = roleLabel(user.role);
    profileLevel.textContent = `Level ${user.level ?? 1}`;
    profileAccess.textContent = accessLabel(user.access);
    profileVerified.textContent = user.email_verified ? '완료' : '미완료';
  }

  function requireLogin(nextPage) {
    if (state.user) return true;
    sessionStorage.setItem('koredu_after_login', nextPage || 'classroom');
    openAuth('login');
    message('로그인 후 이용할 수 있습니다.', 'error');
    return false;
  }

  function showClassroom(push = true) {
    if (!requireLogin('classroom')) return;
    resetModuleShell();
    hideMainViews();
    state.page = 'classroom';
    setHeaderTitle('내강의실');
    fillAccountViews();
    classroomView.hidden = false;
    if (push) { if (location.hash !== '#classroom') history.pushState(null, '', '#classroom'); else history.replaceState(null, '', '#classroom'); }
    if (!state.curDash.openStudent) loadCurriculumDash();
    else { renderCurriculumDash(); loadCurriculumBoard(); }
  }

  function showMyPage(push = true) {
    if (!requireLogin('mypage')) return;
    resetModuleShell();
    hideMainViews();
    state.page = 'mypage';
    setHeaderTitle('마이페이지');
    fillAccountViews();
    myPageView.hidden = false;
    if (push) { if (location.hash !== '#mypage') history.pushState(null, '', '#mypage'); else history.replaceState(null, '', '#mypage'); }
  }

  async function loadAdminUsers() {
    if (!adminUserList) return;
    adminUserList.innerHTML = '<div class="admin-empty">회원정보를 불러오는 중...</div>';
    try {
      const [usersRes, rosterRes] = await Promise.all([
        api('/api/admin/users'),
        api('/api/roster').catch(() => ({ teachers: [], students: [] })),
      ]);
      const users = usersRes.users || [];
      const teachers = (rosterRes.teachers || users.filter(u => u.role === 'teacher'));
      const teacherOpts = who => ['<option value="">— 미배정 —</option>']
        .concat(teachers.map(t => `<option value="${escapeHtml(t.email)}" ${who === t.email ? 'selected' : ''}>${escapeHtml(t.name || t.email)}</option>`))
        .join('');
      const rows = users.map(user => {
        const fixed = user.email === 'ryujel@naver.com';
        const options = ['admin','teacher','student','guest'].map(role => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${escapeHtml(roleLabel(role))}</option>`).join('');
        const rosterCell = user.role === 'student'
          ? `<select class="admin-role-select" data-roster-teacher="${escapeHtml(user.email)}">${teacherOpts(user.teacher || '')}</select>`
          : '<span class="admin-fixed">—</span>';
        return `<div class="admin-user-row" data-admin-email="${escapeHtml(user.email)}">
          <div class="admin-fixed">${escapeHtml(user.member_id || '—')}</div>
          <div class="admin-user-main"><strong>${escapeHtml(user.name || user.email)}</strong><span>${escapeHtml(user.email)}</span>${user.last_ip ? `<span title="마지막 로그인 IP">IP ${escapeHtml(user.last_ip)}</span>` : ''}</div>
          <div>${fixed ? '<span class="admin-fixed">최초 Admin</span>' : `<select class="admin-role-select" data-role-select>${options}</select>`}</div>
          <div class="admin-fixed">${escapeHtml(user.auth_lv ?? '—')}</div>
          <div>${['student', 'guest'].includes(user.role)
            ? `<select class="admin-role-select" data-learning-select>${['초급', '중급', '고급'].map(l => `<option value="${l}" ${(user.learning_level || '초급') === l ? 'selected' : ''}>${l}</option>`).join('')}</select>`
            : '<span class="admin-fixed">—</span>'}</div>
          <div>${rosterCell}</div>
          <div>${fixed ? '' : '<button class="admin-user-save" type="button" data-save-role>저장</button>'}</div>
        </div>`;
      }).join('');
      adminUserList.innerHTML = `<div class="admin-user-row header"><div>회원ID</div><div>회원</div><div>Position</div><div>권한등급</div><div>학습등급</div><div>담당 선생님</div><div></div></div>${rows || '<div class="admin-empty">가입된 회원이 없습니다.</div>'}`;
    } catch (err) {
      adminUserList.innerHTML = `<div class="admin-empty">${escapeHtml(err.message)}</div>`;
    }
  }

  async function applyRosterTeacher(studentEmail, teacherEmail) {
    try {
      if (teacherEmail) await api('/api/roster/link', { method: 'POST', body: { teacher: teacherEmail, student: studentEmail } });
      else await api('/api/roster/unlink', { method: 'POST', body: { student: studentEmail } });
      state.devUsers = null;
      renderSimBar();
    } catch (err) { alert(err.message); loadAdminUsers(); }
  }

  async function showAdmin(push = true) {
    if (!requireLogin('admin')) return;
    if (state.user?.role !== 'admin') return showClassroom(push);
    resetModuleShell();
    hideMainViews();
    state.page = 'admin';
    setHeaderTitle('회원관리');
    adminView.hidden = false;
    await loadAdminUsers();
    if (push) { if (location.hash !== '#admin') history.pushState(null, '', '#admin'); else history.replaceState(null, '', '#admin'); }
  }

  // Admin 전용 "문법리스트": 등록된/안 된 것 가리지 않고, 문법이 붙은 전체 유튜브 영상을
  // 강의번호별로 몰아서 한 줄씩 보여준다("강의 : 유튜브영상ID : 타임스탬프 : 자막").
  async function showGrammarAdmin(push = true) {
    if (!requireLogin('admin')) return;
    if (state.user?.role !== 'admin') return showClassroom(push);
    resetModuleShell();
    hideMainViews();
    state.page = 'grammar-admin';
    setHeaderTitle('문법리스트');
    state.grammar.adminMode = '';
    grammarAdminView.hidden = false;
    await loadGrammarAdminList();
    if (push) { if (location.hash !== '#grammar-admin') history.pushState(null, '', '#grammar-admin'); else history.replaceState(null, '', '#grammar-admin'); }
  }
  // 문법리스트 화면 안에서 강의/유튜브를 화면 전환 없이 옆에 붙여서 보여준다.
  // 강의 배지 → 오른쪽에 강의, 유튜브 타임스탬프 → 왼쪽에 유튜브. 서로 배타적(하나 열면 하나 닫힘).
  function grammarAdminOpenLesson(lessonId) {
    if (!lessonId) return;
    const g = state.grammar;
    g.adminMode = 'lecture';
    g.adminLessonId = lessonId;
    renderGrammarAdminView();
  }
  function grammarAdminOpenVideo(videoId, seconds) {
    if (!videoId) return;
    const g = state.grammar;
    g.adminMode = 'youtube';
    g.adminVideoId = videoId;
    g.adminSeconds = Number(seconds) || 0;
    renderGrammarAdminView();
  }
  function grammarAdminCloseDetail() {
    state.grammar.adminMode = '';
    renderGrammarAdminView();
  }
  function grammarAdminRowsHtml() {
    const g = state.grammar;
    const sortKey = g.adminSort || 'lesson';
    const source = g.adminHideBasic ? (g.allTags || []).filter(m => !GRAMMAR_BASIC.has(m.grammar)) : (g.allTags || []);
    const rows = source.map(m => {
      const text = String(m.text || '');
      const chunk = String(m.chunk || '');
      const idx = chunk ? text.indexOf(chunk) : -1;
      return { m, idx, text, chunk };
    });
    rows.sort((a, b) => {
      if (sortKey === 'video') {
        if (a.m.videoId !== b.m.videoId) return String(a.m.videoId).localeCompare(String(b.m.videoId));
        return (Number(a.m.seconds) || 0) - (Number(b.m.seconds) || 0);
      }
      const ka = a.m.lesson_id || '￿';
      const kb = b.m.lesson_id || '￿';
      if (ka !== kb) return ka < kb ? -1 : 1;
      if (a.m.videoId !== b.m.videoId) return String(a.m.videoId).localeCompare(String(b.m.videoId));
      return (Number(a.m.seconds) || 0) - (Number(b.m.seconds) || 0);
    });
    return rows.map(f => {
      const { m, idx, text, chunk } = f;
      const unregistered = !m.lesson_id;
      const chunkColor = unregistered ? '#94a3b8' : '#dc2626';
      const textHtml = idx >= 0
        ? escapeHtml(text.slice(0, idx)) + `<b class="grammar-chunk${unregistered ? ' grammar-chunk-unreg' : ''}" style="color:${chunkColor}">${escapeHtml(text.slice(idx, idx + chunk.length))}</b>` + escapeHtml(text.slice(idx + chunk.length))
        : escapeHtml(text);
      const openAttr = unregistered ? '' : ` data-grammar-admin-open-lesson="${escapeHtml(m.lesson_id)}"`;
      return `<div class="grammar-flat-row grammar-flat-row-grid">
        <span class="grammar-flat-lesson"${openAttr} title="${unregistered ? '' : '눌러서 이 강의 보기'}">${unregistered ? '미등록' : escapeHtml(m.lesson_id)}</span>
        <span class="grammar-flat-vid" title="${escapeHtml(m.videoTitle || '')}">${escapeHtml(m.videoId || '')}</span>
        <span class="grammar-flat-time" data-grammar-admin-open-video="${escapeHtml(m.videoId || '')}" data-grammar-admin-open-video-seconds="${Number(m.seconds) || 0}" title="눌러서 이 영상의 이 지점으로 이동">${escapeHtml(m.time || '')}</span>
        <span class="grammar-flat-text">${textHtml}</span>
      </div>`;
    }).join('');
  }
  function renderGrammarAdminView() {
    const box = document.getElementById('grammarAdminBody');
    if (!box) return;
    const g = state.grammar;
    if (g.allLoading || g.allTags === null) { box.innerHTML = '<div class="cd-msg">불러오는 중…</div>'; return; }
    const sortKey = g.adminSort || 'lesson';
    // 강의/유튜브ID 칸마다 각자 정렬 화살표 — 누른 칸 기준으로 정렬(지금 기준인 칸만 진하게 표시).
    const lessonArrow = sortKey === 'lesson' ? '↓' : '↕';
    const videoArrow = sortKey === 'video' ? '↓' : '↕';
    const headerHtml = `<div class="grammar-flat-row grammar-flat-row-grid grammar-flat-header">
      <span>강의 <button type="button" class="grammar-admin-sort-arrow${sortKey === 'lesson' ? ' on' : ''}" data-grammar-admin-sort="lesson" title="강의번호순 정렬">${lessonArrow}</button></span>
      <span>유튜브ID <button type="button" class="grammar-admin-sort-arrow${sortKey === 'video' ? ' on' : ''}" data-grammar-admin-sort="video" title="유튜브ID순 정렬">${videoArrow}</button></span>
      <span>타임스탬프</span>
      <span>자막
        <button type="button" class="grammar-admin-basic-btn${g.adminHideBasic ? ' on' : ''}" data-grammar-admin-toggle-basic title="은/는, 이/가, 을/를, 도, 의(소유격) 같은 기초 조사를 빼고 봅니다">기초제외</button>
        <button type="button" class="grammar-admin-update-btn" data-grammar-list-update>업데이트</button>
      </span>
    </div>`;
    const listHtml = `<div class="grammar-flat-list">${headerHtml}${grammarAdminRowsHtml() || '<div class="grammar-msg">표시할 항목이 없습니다.</div>'}</div>`;
    if (g.adminMode === 'lecture' && g.adminLessonId) {
      const ctx = previewContext();
      const q = `embed=1&role=${ctx.role}&level=${ctx.level || 1}&access=${state.user?.access || 'free'}`;
      box.innerHTML = `<div class="grammar-admin-split">
        <div class="grammar-admin-split-list">${listHtml}</div>
        <div class="grammar-admin-split-detail">
          <div class="grammar-admin-detail-head"><span>${escapeHtml(g.adminLessonId)}</span><button type="button" data-grammar-admin-close aria-label="닫기">×</button></div>
          <iframe src="http://localhost:8121/${encodeURIComponent(g.adminLessonId)}/index.html?${q}"></iframe>
        </div>
      </div>`;
    } else if (g.adminMode === 'youtube' && g.adminVideoId) {
      const ctx = previewContext();
      const q = `embed=1&role=${ctx.role}&level=${ctx.level || 1}&access=${state.user?.access || 'free'}`;
      box.innerHTML = `<div class="grammar-admin-split">
        <div class="grammar-admin-split-detail">
          <div class="grammar-admin-detail-head"><span>${escapeHtml(g.adminVideoId)}</span><button type="button" data-grammar-admin-close aria-label="닫기">×</button></div>
          <iframe id="grammarAdminYoutubeFrame" src="http://localhost:8120/player.html?v=${encodeURIComponent(g.adminVideoId)}&${q}"></iframe>
        </div>
        <div class="grammar-admin-split-list">${listHtml}</div>
      </div>`;
      const videoId = g.adminVideoId, seconds = g.adminSeconds;
      setTimeout(() => {
        const frame = document.getElementById('grammarAdminYoutubeFrame');
        try { frame?.contentWindow?.postMessage({ type: 'koredu-seek-subtitle', videoId, seconds }, 'http://localhost:8120'); } catch (_) {}
      }, 900);
    } else {
      box.innerHTML = listHtml;
    }
  }
  async function loadGrammarAdminList() {
    if (state.grammar.allTags === null) await loadGrammarTagsAll();
    renderGrammarAdminView();
  }

  function showHome() {
    resetModuleShell();
    hideMainViews();
    state.page = 'home';
    setHeaderTitle('');
    homeView.hidden = false;
    history.replaceState(null, '', location.pathname);
  }

  function openSection(sectionId) {
    const section = MODULES[sectionId];
    if (!section) return;
    if (section.direct) return openModule(sectionId, section.items[0].id);
    previewMaster(sectionId);
  }

  function openModule(sectionId, itemId, push = true) {
    const section = MODULES[sectionId];
    if (!section) return;
    const nextItem = section.items.find(x => x.id === itemId) || section.items[0];
    const leavingCurrentYouTube = state.page === 'module' && state.section === 'video' && state.item === 'youtube'
      && !(sectionId === 'video' && nextItem?.id === 'youtube');
    if (leavingCurrentYouTube) leaveYouTubeWidgetSession();
    if (!state.user) {
      sessionStorage.setItem('koredu_after_login', `module:${sectionId}:${itemId || section.items[0].id}`);
      openAuth('login');
      message('로그인 후 학습 콘텐츠를 이용할 수 있습니다.', 'error');
      return;
    }
    const item = nextItem;
    state.section = sectionId;
    state.item = item.id;
    state.moduleUrl = item.type === 'iframe' ? item.url : null;
    state.navPreview = null;
    syncHeaderNav();
    hideMainViews();
    state.page = 'module';
    moduleView.hidden = false;
    syncHeaderNav();
    moduleStatusText.textContent = item.label;
    setHeaderTitle(`${section.label} - ${item.label}`);

    if (item.type === 'iframe') {
      placeholderView.hidden = true;
      moduleFrame.hidden = false;
      const targetUrl = new URL(item.url);
      const ctx = previewContext();
      targetUrl.searchParams.set('embed', '1');
      targetUrl.searchParams.set('role', ctx.role);
      targetUrl.searchParams.set('level', String(ctx.level || 1));
      targetUrl.searchParams.set('content_level', ctx.contentLevel || '');
      targetUrl.searchParams.set('access', String(state.user?.access || 'free'));
    targetUrl.searchParams.set('user_id', String(state.user?.email || ''));
    targetUrl.searchParams.set('user_name', String(state.user?.name || state.user?.email || ''));
      state.moduleUrl = targetUrl.toString();
      if (moduleFrame.src !== state.moduleUrl) moduleFrame.src = state.moduleUrl;
      openExternal.hidden = false;
    } else {
      moduleFrame.hidden = true;
      moduleFrame.src = 'about:blank';
      placeholderView.hidden = false;
      placeholderTitle.textContent = item.title || item.label;
      placeholderText.textContent = item.text || '이 영역에 해당 모듈이 연결됩니다.';
      openExternal.hidden = true;
      setHeaderTitle(`${section.label} - ${item.label}`);
    }

    syncWidgetWorkspace();
    const nextHash = `#${sectionId}/${item.id}`;
    if (push && location.hash !== nextHash) history.pushState(null, '', nextHash);
    else history.replaceState(null, '', nextHash);
  }

  const WIDGET_LAYOUT_KEY = 'koredu_widget_layout_v2';

  function widgetLayoutStorageKey() {
    const identity = String(state.user?.email || 'guest').trim().toLowerCase() || 'guest';
    return `${WIDGET_LAYOUT_KEY}:${identity}`;
  }

  function loadWidgetLayout() {
    const fallback = { width: 460, heights: {}, sizes: {} };
    let saved = fallback;
    try {
      saved = { ...fallback, ...(JSON.parse(localStorage.getItem(widgetLayoutStorageKey()) || '{}') || {}) };
    } catch (_) {}
    // 열린 위젯(레일 버튼 활성 상태)은 저장·복원한다 — 페이지 이동/새로고침에도 유지.
    // homework(복습)는 레일에서 뺐으니(강의실에서만 작성) 예전에 저장된 값이 남아 있어도 복원하지 않는다.
    state.widgetMulti = Array.isArray(saved.open) ? saved.open.filter(id => WIDGETS[id]?.mode === 'multi' && id !== 'homework') : [];
    state.widgetSingle = (saved.single && WIDGETS[saved.single]?.mode === 'single') ? saved.single : null;
    state.widgetWidth = Math.max(320, Math.min(Number(saved.width) || 460, Math.floor(window.innerWidth * .62)));
    state.widgetHeights = saved.heights && typeof saved.heights === 'object' ? saved.heights : {};
    // 줄/칸 나누는 비율과 세로 크기는 저장하지 않는다 — 예전 값이 남아있으면 화면이 이상하게
    // 굳어버리는 문제가 있었다. 매번 반반/꽉 채움으로 새로 시작하고, 드래그 조절은 그 화면에
    // 있는 동안만 (state에만) 유지한다.
    state.widgetRowWeights = {};
    state.widgetColRatios = {};
    state.widgetSoloHeights = {};
    const defaults = { word: 'full', grammar: 'half', questions: 'half', homework: 'half', dialogue: 'half', writing: 'full', hangeul1: 'half', hangeul2: 'half', lecturelist: 'half', videolist: 'half' };
    state.widgetSizes = { ...defaults, ...(saved.sizes && typeof saved.sizes === 'object' ? saved.sizes : {}) };
    document.documentElement.style.setProperty('--widget-workspace-w', `${state.widgetWidth}px`);
  }

  function saveWidgetLayout() {
    try {
      localStorage.setItem(widgetLayoutStorageKey(), JSON.stringify({
        open: state.widgetMulti,           // 레일 버튼 활성 상태 유지
        single: state.widgetSingle,
        width: state.widgetWidth,
        heights: state.widgetHeights,
        sizes: state.widgetSizes
        // 줄/칸 비율·세로 크기(rowWeights/colRatios/soloHeights)는 더 이상 저장하지 않는다.
      }));
    } catch (_) {}
  }

  function savedStudentWordStorageKey(videoId = state.wordContext?.videoId || '') {
    const userKey = String(state.user?.public_id || state.user?.publicId || state.user?.user_id || state.user?.id || state.user?.email || 'LOCAL');
    return `koredu_w01_student_words_v1:${userKey}:${String(videoId || '')}`;
  }

  function loadSavedStudentWords(videoId = state.wordContext?.videoId || '') {
    if (!videoId) { state.savedStudentWords = []; return; }
    try {
      const raw = JSON.parse(localStorage.getItem(savedStudentWordStorageKey(videoId)) || '[]');
      state.savedStudentWords = Array.isArray(raw) ? raw.filter(v => v && String(v.text || '').trim()) : [];
    } catch (_) { state.savedStudentWords = []; }
  }

  function persistSavedStudentWords() {
    const videoId = state.wordContext?.videoId || '';
    if (!videoId) return;
    try { localStorage.setItem(savedStudentWordStorageKey(videoId), JSON.stringify(state.savedStudentWords || [])); } catch (_) {}
  }

  /* ── W04 복습(첨삭) 위젯 저장 ──
     내용(이미지·코멘트·이름)은 영상별. 도구 설정(색·글자크기)은 사용자 전역(마지막 값). */
  function homeworkUserKey() {
    return String(state.user?.public_id || state.user?.publicId || state.user?.user_id || state.user?.id || state.user?.email || 'LOCAL');
  }
  // 첨삭 대상 키: 영상(videoId) 또는 커리큘럼 회차(sess id). 임베드 시 state.homework.ref 로 지정.
  // 영상이 안 열려 있으면(위젯 단독 사용) 강의실 복습과 똑같이 "지금 회차"(siCurrentSessionId)를 대상으로
  // 삼는다 — 그래야 메뉴·데이터가 강의실 복습과 완전히 같아진다(같은 ref = 같은 서버 저장소).
  function hwRef() {
    return String(state.homework?.ref || state.wordContext?.videoId || siCurrentSessionId() || '');
  }
  function homeworkStorageKey(ref = hwRef(), student = '') {
    // 선생은 학생별로, 학생 본인은 자기 키로.
    const scope = student || homeworkUserKey();
    return `koredu_w04_homework_v1:${scope}:${String(ref || '')}`;
  }
  function homeworkPrefsKey() { return `koredu_w04_prefs_v1:${homeworkUserKey()}`; }
  function homeworkDefault() { return { image: '', comments: [], color: '#e02424', size: 2.4, zoom: 1, teacherName: '', studentName: '', student: '', ref: '', embedded: false }; }
  function hwClampZoom(z) { return Math.min(6, Math.max(0.2, Number(z) || 1)); }

  async function ensureRoster() {
    if (state.curriculum.roster || !window.CurriculumStore || state.user?.role === 'student') return;
    try { state.curriculum.roster = await CurriculumStore.getRoster(); } catch (_) {}
  }

  // 첨삭 대상 학생: 학생 본인 / 선생은 선택값(없으면 커리큘럼 위젯의 학생 → 로스터 첫번째)
  function homeworkTargetStudent() {
    if (state.user?.role === 'student') return state.user.email || '';
    return state.homework?.student
      || (state.widgetMulti.includes('curriculum') ? curriculumCurrentStudent() : '')
      || state.curriculum.roster?.students?.[0]?.email
      || '';
  }
  function hwApplyPrefs(hw) {
    try {
      const p = JSON.parse(localStorage.getItem(homeworkPrefsKey()) || 'null');
      if (p && typeof p === 'object') {
        if (p.color) hw.color = p.color;
        if (Number(p.size)) hw.size = Number(p.size);
      }
    } catch (_) {}
    return hw;
  }
  function hwFromRaw(raw, student, extra = {}) {
    return {
      image: String(raw?.image || ''),
      comments: Array.isArray(raw?.comments) ? raw.comments : [],
      color: raw?.color || '#e02424', size: Number(raw?.size) || 2.4,
      zoom: hwClampZoom(raw?.zoom),
      teacherName: String(raw?.teacherName || ''), studentName: String(raw?.studentName || ''),
      student: student || '',
      ref: extra.ref || '', embedded: !!extra.embedded,
    };
  }
  let hwLoadToken = 0;
  // ref: 영상 videoId(기본) 또는 커리큘럼 회차 sess id. opts: { student, embedded }
  async function loadHomework(ref = state.wordContext?.videoId || '', opts = {}) {
    if (!ref) { state.homework = homeworkDefault(); return; }
    const student = opts.student || homeworkTargetStudent();
    const extra = { ref, embedded: !!opts.embedded };
    const token = ++hwLoadToken;
    // 로컬 캐시로 먼저 즉시 표시
    let hw;
    try {
      const raw = JSON.parse(localStorage.getItem(homeworkStorageKey(ref, student)) || 'null');
      hw = raw ? hwFromRaw(raw, student, extra) : Object.assign(homeworkDefault(), extra);
    } catch (_) { hw = Object.assign(homeworkDefault(), extra); }
    hw.student = student;
    state.homework = hwApplyPrefs(hw);
    hwRefreshAllHomeworkBodies();
    // 서버가 있으면 서버본으로 덮어씀
    if (!student || !window.CurriculumStore) return;
    try {
      const res = await CurriculumStore.getHomework(student, ref);
      if (token !== hwLoadToken) return; // 그 사이 다른 로드가 시작됨
      if (res.homework) {
        state.homework = hwApplyPrefs(hwFromRaw(res.homework, student, extra));
        try { localStorage.setItem(homeworkStorageKey(ref, student), JSON.stringify(res.homework)); } catch (_) {}
      }
      hwRefreshAllHomeworkBodies();
    } catch (_) {}
  }
  function hwRefreshAllHomeworkBodies() {
    if (state.widgetMulti.includes('homework')) refreshHomeworkWidgetBody();
    if (state.homework?.embedded) refreshHomeworkWidgetBody();
  }
  let hwSaveTimer = null;
  function persistHomework() {
    const ref = hwRef();
    if (!ref || !state.homework) return;
    const student = state.homework.student || homeworkTargetStudent();
    try { localStorage.setItem(homeworkStorageKey(ref, student), JSON.stringify(state.homework)); }
    catch (_) { state.homework._quota = true; }
    try { localStorage.setItem(homeworkPrefsKey(), JSON.stringify({ color: state.homework.color, size: state.homework.size })); } catch (_) {}
    if (!student || !window.CurriculumStore) return;
    clearTimeout(hwSaveTimer);
    hwSaveTimer = setTimeout(async () => {
      try {
        await CurriculumStore.setHomework({
          student, ref,
          homework: {
            image: state.homework.image, comments: state.homework.comments,
            teacherName: state.homework.teacherName, studentName: state.homework.studentName,
            zoom: state.homework.zoom,
          },
        });
        if (state.homework?.embedded && state.curriculum?.reviews) {
          state.curriculum.reviews[`${student}|${ref}`] = {
            image: state.homework.image, comments: state.homework.comments,
          };
        }
      } catch (_) {}
    }, 700);
  }
  function homeworkComment(id) { return (state.homework?.comments || []).find(c => String(c.id) === String(id)); }


  function normalizeWordKey(value) {
    return String(value || '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\s\u00a0]+/g, '')
      .replace(/[.,!?;:'"“”‘’()\[\]{}<>·…~`!@#$%^&*_=+|\\/\-]/g, '')
      .trim();
  }

  function questionStudentAnswerStorageKey(videoId = state.wordContext?.videoId || '') {
    const userKey = String(state.user?.public_id || state.user?.publicId || state.user?.user_id || state.user?.id || state.user?.email || 'LOCAL');
    return `koredu_w03_student_answers_v1:${userKey}:${String(videoId || '')}`;
  }

  function loadQuestionStudentAnswers(videoId = state.wordContext?.videoId || '') {
    if (!videoId) { state.questionStudentAnswers = {}; return; }
    try {
      const raw = JSON.parse(localStorage.getItem(questionStudentAnswerStorageKey(videoId)) || '{}');
      state.questionStudentAnswers = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    } catch (_) { state.questionStudentAnswers = {}; }
  }

  function persistQuestionStudentAnswers() {
    const videoId = state.wordContext?.videoId || '';
    if (!videoId) return;
    try { localStorage.setItem(questionStudentAnswerStorageKey(videoId), JSON.stringify(state.questionStudentAnswers || {})); } catch (_) {}
  }

  function questionAnswerKey(item, index) {
    return String(item?.id || item?.questionId || item?.question_id || `Q${Number(index) + 1}`);
  }

  function visibleExtractedWords() {
    const words = Array.isArray(state.wordList?.words) ? state.wordList.words : [];
    const savedKeys = new Set((state.savedStudentWords || []).map(item => normalizeWordKey(item?.text)).filter(Boolean));
    return words.filter(word => {
      const key = normalizeWordKey(word?.ko);
      return key && !savedKeys.has(key);
    });
  }

  function selectedWordRows() {
    const allWords = Array.isArray(state.wordList?.words) ? state.wordList.words : [];
    const visible = visibleExtractedWords();
    const saved = Array.isArray(state.savedStudentWords) ? state.savedStudentWords : [];
    const translatedByKey = new Map();
    for (const word of allWords) {
      const key = normalizeWordKey(word?.ko);
      if (key) translatedByKey.set(key, String(word?.translations?.[state.wordLanguage] || ''));
    }
    const rows = [];
    const seen = new Set();
    if (state.wordSourceSelection?.saved) {
      for (const item of saved) {
        const ko = String(item?.text || '').trim();
        const key = normalizeWordKey(ko);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        rows.push({ source: 'saved', ko, foreign: String(item?.translations?.[state.wordLanguage] || translatedByKey.get(key) || '') });
      }
    }
    if (state.wordSourceSelection?.extracted) {
      for (const word of visible) {
        const ko = String(word?.ko || '').trim();
        const key = normalizeWordKey(ko);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        rows.push({ source: 'extracted', ko, foreign: String(word?.translations?.[state.wordLanguage] || '') });
      }
    }
    return rows;
  }

  function addSavedStudentWords(items = []) {
    const current = Array.isArray(state.savedStudentWords) ? [...state.savedStudentWords] : [];
    const byKey = new Map();
    current.forEach((item, index) => {
      const key = normalizeWordKey(item?.text);
      if (key && !byKey.has(key)) byKey.set(key, index);
      const baseOccurrence = {
        videoId: String(item?.videoId || state.wordContext?.videoId || ''),
        index: Number.isInteger(Number(item?.index)) ? Number(item.index) : -1,
        seconds: Number.isFinite(Number(item?.seconds)) ? Number(item.seconds) : 0,
        time: String(item?.time || '')
      };
      if (!Array.isArray(item.occurrences)) item.occurrences = baseOccurrence.index >= 0 ? [baseOccurrence] : [];
      if (!item.videoId) item.videoId = baseOccurrence.videoId;
    });

    for (const item of Array.isArray(items) ? items : []) {
      const text = String(item?.text || '').replace(/\s+/g, ' ').trim();
      const key = normalizeWordKey(text);
      if (!text || !key) continue;
      const occurrences = Array.isArray(item?.occurrences) && item.occurrences.length
        ? item.occurrences
        : [{
            videoId: String(item?.videoId || state.wordContext?.videoId || ''),
            index: Number.isInteger(Number(item?.index)) ? Number(item.index) : -1,
            seconds: Number.isFinite(Number(item?.seconds)) ? Number(item.seconds) : 0,
            time: String(item?.time || '')
          }];

      let target;
      if (byKey.has(key)) {
        target = current[byKey.get(key)];
      } else {
        target = {
          text,
          videoId: String(item?.videoId || state.wordContext?.videoId || ''),
          index: Number.isInteger(Number(item?.index)) ? Number(item.index) : -1,
          seconds: Number.isFinite(Number(item?.seconds)) ? Number(item.seconds) : 0,
          time: String(item?.time || ''),
          occurrences: [],
          savedAt: new Date().toISOString()
        };
        current.push(target);
        byKey.set(key, current.length - 1);
      }

      if (!Array.isArray(target.occurrences)) target.occurrences = [];
      for (const occ of occurrences) {
        const normalized = {
          videoId: String(occ?.videoId || item?.videoId || target.videoId || state.wordContext?.videoId || ''),
          index: Number.isInteger(Number(occ?.index)) ? Number(occ.index) : -1,
          seconds: Number.isFinite(Number(occ?.seconds)) ? Number(occ.seconds) : 0,
          time: String(occ?.time || '')
        };
        if (normalized.index < 0) continue;
        const exists = target.occurrences.some(v =>
          String(v?.videoId || '') === normalized.videoId &&
          Number(v?.index) === normalized.index &&
          Number(v?.seconds || 0) === normalized.seconds
        );
        if (!exists) target.occurrences.push(normalized);
      }
      const first = target.occurrences[0];
      if (first) {
        target.videoId = first.videoId;
        target.index = first.index;
        target.seconds = first.seconds;
        target.time = first.time;
      }
    }
    state.savedStudentWords = current;
    persistSavedStudentWords();
    refreshWordWidgetBody();
  }

  function removeSavedStudentWord(index) {
    const i = Number(index);
    if (!Number.isInteger(i) || i < 0 || i >= state.savedStudentWords.length) return;
    state.savedStudentWords.splice(i, 1);
    persistSavedStudentWords();
    refreshWordWidgetBody();
  }

  /* ── TTS 음성: OS 내장(Windows SAPI) 대신 브라우저(Google 등) 음성을 항상 우선 사용 ──
     여러 곳에서 각자 SpeechSynthesisUtterance를 만들던 걸 이 한 곳으로 모음. */
  let _koVoice = null, _koVoiceResolved = false;
  function _resolveKoVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    _koVoiceResolved = true;
    const koVoices = voices.filter(v => /^ko/i.test(v.lang || ''));
    return koVoices.find(v => /google/i.test(v.name || ''))
      || koVoices.find(v => v.localService === false)
      || koVoices[0]
      || null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => { _koVoice = _resolveKoVoice(); };
  }
  // 이 기기에 한국어 음성이 하나도 없을 때(외국 학생 PC 등) — 매번 이상한 목소리로 읽거나 조용히
  // 실패하는 대신, 딱 한 번 짧게 알려준다. 학생이 한국어를 못 읽을 수도 있어 영어도 같이.
  let _koVoiceGuideShown = false;
  function _showKoVoiceGuide() {
    if (_koVoiceGuideShown) return;
    _koVoiceGuideShown = true;
    alert('이 기기는 한국어를 읽을 수 없어요.\nThis device can\'t read Korean aloud.');
  }
  function curduSpeak(text, opts = {}) {
    text = String(text || '').trim();
    if (!text || !('speechSynthesis' in window)) return;
    try {
      if (!_koVoiceResolved) _koVoice = _resolveKoVoice();
      if (!_koVoice) {
        // 한국어 음성이 없으면 영어 등 다른 목소리로 한국어를 읽어봐야 의미가 없다 — 아예 안 읽고 안내만.
        if (_koVoiceResolved) _showKoVoiceGuide();
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.voice = _koVoice;
      if (opts.rate) u.rate = opts.rate;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }
  function curduSpeakCancel() {
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (_) {}
  }

  function speakTextKo(text) {
    curduSpeakCancel();
    curduSpeak(text, { rate: 0.92 });
  }

  function speakAllExtractedWords() {
    const rows = selectedWordRows();
    const text = rows.map(v => String(v?.ko || '').trim()).filter(Boolean).join('. ');
    if (!text) return;
    speakTextKo(text);
  }

  function makeWordBookMp3Placeholder() {
    const rows = selectedWordRows();
    if (!rows.length) {
      alert('MP3로 저장할 대상을 자막/저장에서 체크해 주세요.');
      return;
    }
    const selected = [state.wordSourceSelection?.extracted ? '자막' : '', state.wordSourceSelection?.saved ? '저장' : ''].filter(Boolean).join(' + ');
    alert(`${selected} ${rows.length}개 단어를 한 번에 MP3로 저장하는 대상이 선택되었습니다. 실제 MP3 파일 생성 기능은 다음 단계에서 연결합니다.`);
  }

  function seekSavedStudentWord(index) {
    const item = state.savedStudentWords?.[Number(index)];
    if (!item) return;
    const occurrences = Array.isArray(item.occurrences) && item.occurrences.length
      ? item.occurrences
      : (Number(item.index) >= 0 ? [{ videoId: item.videoId, index: item.index, seconds: item.seconds, time: item.time }] : []);
    if (!occurrences.length) return;
    const key = normalizeWordKey(item.text) || String(index);
    const cursor = Number(state.savedWordOccurrenceCursor[key] || 0) % occurrences.length;
    const occurrence = occurrences[cursor];
    state.savedWordOccurrenceCursor[key] = (cursor + 1) % occurrences.length;
    postToVideoScript({
      type: 'koredu-seek-subtitle',
      videoId: String(occurrence?.videoId || state.wordContext?.videoId || ''),
      index: Number(occurrence?.index),
      seconds: Number(occurrence?.seconds) || 0,
      highlightWord: String(item?.text || '').trim()
    });
  }

  function speakQuestionPart(index, part) {
    const item = state.questionList?.questions?.[Number(index)];
    if (!item) return;
    const key = questionAnswerKey(item, index);
    const text = part === 'answer'
      ? String(item?.answer || '')
      : part === 'student'
        ? String(state.questionStudentAnswers?.[key] || '')
        : String(item?.question || '');
    speakTextKo(text);
  }

  function speakAllQuestions() {
    const questions = Array.isArray(state.questionList?.questions) ? state.questionList.questions : [];
    const parts = [];
    sortedQuestionRows(questions).forEach(({ item, sourceIndex }) => {
      const key = questionAnswerKey(item, sourceIndex);
      const q = String(item?.question || '').trim();
      const a = String(item?.answer || '').trim();
      const s = String(state.questionStudentAnswers?.[key] || '').trim();
      if (q) parts.push(q);
      if (state.questionShowAnswer !== false && a) parts.push(a);
      if (state.questionShowStudent !== false && s) parts.push(s);
    });
    if (parts.length) speakTextKo(parts.join('. '));
  }

  function currentLearningLanguageBadgeHtml() {
    const lang = LEARNING_LANGS[state.learningLanguage] || LEARNING_LANGS.en;
    return `<span class="widget-language-badge" title="W07 설정의 전역 학습 언어">${lang.code}</span>`;
  }

  function wordWidgetHeaderToolsHtml() {
    const inYouTube = state.page === 'module' && state.section === 'video' && state.item === 'youtube';
    const selectedRows = selectedWordRows();
    return `<div class="widget-head-tools word-head-tools">
      <button type="button" class="word-listen-all-btn" data-word-listen-all ${!inYouTube || !selectedRows.length ? 'disabled' : ''}>🔊 전체</button>
      <button type="button" class="word-mp3-btn" data-word-mp3 ${!inYouTube || !selectedRows.length ? 'disabled' : ''}>MP3</button>
      ${currentLearningLanguageBadgeHtml()}
      <button type="button" class="word-excel-btn" data-word-excel ${!inYouTube || !selectedRows.length ? 'disabled' : ''}>Excel</button>
    </div>`;
  }

  function questionsWidgetHeaderToolsHtml() {
    const questions = Array.isArray(state.questionList?.questions) ? state.questionList.questions : [];
    const answerOn = state.questionShowAnswer !== false;
    const studentOn = state.questionShowStudent !== false;
    const translationOn = state.questionShowTranslation !== false;
    return `<div class="widget-head-tools question-head-tools">
      <span class="widget-head-count">${questions.length}개</span>
      <button type="button" class="question-column-toggle ${answerOn ? 'on' : 'off'}" data-question-column-toggle="answer" aria-pressed="${answerOn ? 'true' : 'false'}">답변 ${answerOn ? 'ON' : 'OFF'}</button>
      <button type="button" class="question-column-toggle ${studentOn ? 'on' : 'off'}" data-question-column-toggle="student" aria-pressed="${studentOn ? 'true' : 'false'}">학생답변 ${studentOn ? 'ON' : 'OFF'}</button>
      <button type="button" class="question-column-toggle ${translationOn ? 'on' : 'off'}" data-question-translation-toggle aria-pressed="${translationOn ? 'true' : 'false'}">번역 ${translationOn ? 'ON' : 'OFF'}</button>
      <button type="button" class="question-sort-reset" data-question-sort-reset title="원래 질문 순서로 복원">복원</button>
      ${currentLearningLanguageBadgeHtml()}
      <button type="button" class="word-excel-btn" data-question-excel-export ${questions.length ? '' : 'disabled'}>Excel</button>
      <button type="button" data-questions-listen-all ${questions.length ? '' : 'disabled'}>🔊 전체</button>
    </div>`;
  }

  function homeworkStudentPickerHtml() {
    if (state.user?.role === 'student') return '';
    const students = state.curriculum.roster?.students || [];
    if (!students.length) return '';
    const cur = state.homework?.student || homeworkTargetStudent();
    const opts = students.map(s => `<option value="${escapeHtml(s.email)}" ${s.email === cur ? 'selected' : ''}>${escapeHtml(s.name || s.email)}</option>`).join('');
    return `<label class="hw-name hw-student">학생 <select data-hw-student>${opts}</select></label>`;
  }
  function homeworkWidgetHeaderToolsHtml() {
    const hw = state.homework || {};
    if (!hwRef()) return '';
    const picker = hw.embedded ? '' : homeworkStudentPickerHtml();
    // 이미지가 아직 없어도(강의실 복습과 동일하게) 툴바를 띄운다 — "교체" 버튼이 곧 첫 업로드 버튼이다.
    const colors = ['#e02424', '#1f2328', '#1f5fd0'];
    const swatches = colors.map(c => `<button type="button" class="hw-swatch${hw.color === c ? ' on' : ''}" data-hw-color="${c}" style="background:${c}" aria-label="색상"></button>`).join('');
    const hasCmt = hw.comments && hw.comments.length;
    const curSize = (hwFocusedId && homeworkComment(hwFocusedId)?.size) || hw.size || 2.4;
    return `<div class="widget-head-tools hw-head-tools">
      ${picker}
      <label class="hw-name">선생님<input type="text" data-hw-name="teacher" value="${escapeHtml(hw.teacherName || '')}" placeholder="이름" autocomplete="off"></label>
      <label class="hw-name">학생<input type="text" data-hw-name="student" value="${escapeHtml(hw.studentName || '')}" placeholder="이름" autocomplete="off"></label>
      <label class="hw-btn">교체<input type="file" accept="image/*" data-hw-file hidden></label>
      <span class="hw-swatches">${swatches}</span>
      <label class="hw-range" title="글자 크기 (휠로도 조절)">글자<input type="range" min="1" max="6" step="0.1" value="${Number(curSize).toFixed(1)}" data-hw-size></label>
      <button type="button" class="hw-btn hw-b-undo" data-hw-undo ${hwHistory.length ? '' : 'disabled'} title="되돌리기" aria-label="되돌리기">↶</button>
      <button type="button" class="hw-btn hw-b-redo" data-hw-redo ${hwFuture.length ? '' : 'disabled'} title="다시" aria-label="다시">↷</button>
      <button type="button" class="hw-btn hw-b-clear" data-hw-clear ${hasCmt ? '' : 'disabled'} title="전체 지우기" aria-label="전체 지우기">⌦</button>
      <button type="button" class="hw-btn hw-b-wongo" data-hw-wongo title="원고지 인쇄">원고지</button>
      <button type="button" class="hw-btn hw-b-print" data-hw-print title="첨삭본 인쇄" aria-label="인쇄">🖨</button>
      <button type="button" class="hw-btn hw-b-save" data-hw-save title="이미지 저장" aria-label="이미지 저장">💾</button>
    </div>`;
  }

  function widgetHeaderToolsHtml(widgetId) {
    if (widgetId === 'word') return wordWidgetHeaderToolsHtml();
    if (widgetId === 'questions') return questionsWidgetHeaderToolsHtml();
    if (widgetId === 'homework') return homeworkWidgetHeaderToolsHtml();
    if (widgetId === 'curriculum') return curriculumWidgetHeaderToolsHtml();
    if (widgetId === 'library') return libraryWidgetHeaderToolsHtml();
    if (widgetId === 'sentence') return sentenceWidgetHeaderToolsHtml();
    if (widgetId === 'writing') return writingWidgetHeaderToolsHtml();
    return '';
  }

  // ── W10 쓰기(학습지) 위젯: 실제 화면은 iframe(Tool/04WritingTest) 안에서 그려지므로,
  // 헤더 컨트롤 값은 여기서 들고 있다가 postMessage 로 iframe에 넘겨준다.
  const state_writingCtl = { text: '', font: 'sans', cellSize: 'normal', strokeOrder: true, _loadedKey: '' };
  // 영상/교재 등 지금 보고 있는 맥락과 무관하게, 로그인한 사람 개인 것으로 저장한다.
  // "기본"(admin이 미리 넣어둔 것) 같은 건 없다 — 공통저장(admin) / 개인저장(그 외) 둘뿐이고,
  // 저장한 사람이 각자 지울 수 있다.
  function wrUserSavedKey() {
    return 'koredu_writing_saved_texts:' + (state.user?.email || 'anon');
  }
  function wrLoadSaved() {
    try { return JSON.parse(localStorage.getItem(wrUserSavedKey()) || '[]'); } catch (_) { return []; }
  }
  // 저장 목록은 항상 이름 가나다순으로 정렬해서 보관한다(그래야 드롭다운도 같은 순서로 보인다).
  function wrSortList(list) {
    list.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'ko'));
    return list;
  }
  function wrSaveSavedList(list) {
    wrSortList(list);
    try { localStorage.setItem(wrUserSavedKey(), JSON.stringify(list.slice(0, 40))); } catch (_) {}
  }
  // admin이 저장하면 개인 것이 아니라 다 같이 쓰는 공통 목록에 들어간다(관리자만 지울 수 있음).
  const WR_SHARED_KEY = 'koredu_writing_shared_texts';
  function wrLoadShared() {
    try { return JSON.parse(localStorage.getItem(WR_SHARED_KEY) || '[]'); } catch (_) { return []; }
  }
  function wrSaveSharedList(list) {
    wrSortList(list);
    try { localStorage.setItem(WR_SHARED_KEY, JSON.stringify(list.slice(0, 40))); } catch (_) {}
  }
  function writingWidgetHeaderToolsHtml() {
    const st = state_writingCtl;
    const isAdmin = state.user?.role === 'admin';
    const shared = wrLoadShared();
    const mine = wrLoadSaved();
    const sharedOpts = shared.map((s, i) => `<option value="s:${i}"${st._loadedKey === `s:${i}` ? ' selected' : ''}>${escapeHtml(s.name)}</option>`).join('');
    const mineOpts = mine.map((s, i) => `<option value="u:${i}"${st._loadedKey === `u:${i}` ? ' selected' : ''}>${escapeHtml(s.name)}</option>`).join('');
    const canDelete = st._loadedKey.startsWith('u:') || (isAdmin && st._loadedKey.startsWith('s:'));
    return `<div class="widget-head-tools wr-head-tools">
      <input type="text" class="wr-text" data-wr-text value="${escapeHtml(st.text)}" placeholder="연습할 글자·단어·문장" spellcheck="false">
      <button type="button" data-wr-save title="${isAdmin ? '지금 입력한 글자를 이름 붙여 공통저장에 저장(모두에게 보임)' : '지금 입력한 글자를 이름 붙여 개인저장에 저장'}">💾 저장</button>
      <select data-wr-load title="불러오기 — 기본은 빈 원고지">
        <option value="">원고지</option>
        ${shared.length ? `<optgroup label="공통저장">${sharedOpts}</optgroup>` : ''}
        ${mine.length ? `<optgroup label="개인저장">${mineOpts}</optgroup>` : ''}
      </select>
      <button type="button" data-wr-delete-saved title="불러온 문구 삭제" ${canDelete ? '' : 'disabled'}>🗑</button>
      <select data-wr-font title="글씨체">
        <option value="sans"${st.font === 'sans' ? ' selected' : ''}>또박체</option>
        <option value="serif"${st.font === 'serif' ? ' selected' : ''}>바른체</option>
        <option value="round"${st.font === 'round' ? ' selected' : ''}>둥근체</option>
        <option value="hand"${st.font === 'hand' ? ' selected' : ''}>손글씨</option>
      </select>
      <select data-wr-cellsize title="한 줄 칸 수">
        <option value="small"${st.cellSize === 'small' ? ' selected' : ''}>12칸</option>
        <option value="normal"${st.cellSize === 'normal' ? ' selected' : ''}>10칸</option>
        <option value="large"${st.cellSize === 'large' ? ' selected' : ''}>8칸</option>
      </select>
      <button type="button" data-wr-stroke class="${st.strokeOrder ? 'is-on' : ''}" title="맨 앞 글자에 획순 표시">✎ 획순</button>
      <button type="button" data-wr-print title="인쇄 · PDF 저장">🖨 인쇄</button>
    </div>`;
  }
  function writingHeaderEl() {
    return (widgetMultiGrid || document).querySelector('[data-widget-header-tools="writing"]');
  }
  function writingIframe() {
    return document.querySelector('[data-widget-panel="writing"] iframe');
  }
  function writingPostUpdate() {
    const frame = writingIframe();
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({ type: 'koredu-writing-update', ...state_writingCtl }, location.origin);
  }

  // ── W15 문장 위젯: 학생·회차별로 서버에 저장 (판서 캡처와 같은 방식) ──
  // 녹음(rec)은 아직 이 브라우저 안에서만 유지된다 — 서버 저장은 추후.
  let _sentList = [];
  let _sentCtx = null;           // 마지막으로 불러온 {studentEmail, sessionId}
  let _sentLoading = false;
  let _sentRecordingId = null;   // 지금 녹음 중인 문장 id
  let _sentActiveRecorder = null;
  let _sentDictating = false;    // "말해서 입력"(상단 추가칸) 받아쓰기 중 여부
  let _sentDictateRec = null;
  let _sentTextSaveTimers = {};

  // 지금 강의실 위젯에서 보고 있는 학생·회차 — 판서 캡처(siCaptureContext)와 동일한 기준.
  function sentContext() {
    const pair = curSessionStudentPairInfo();
    const sessionId = siCurrentSessionId();
    if (!pair || !sessionId) return null;
    return { studentEmail: pair.studentEmail, sessionId };
  }
  async function sentFetchList() {
    const ctx = sentContext();
    if (!ctx || !window.CurriculumStore) { _sentList = []; _sentCtx = null; return; }
    _sentLoading = true;
    try {
      const r = await CurriculumStore.getSentences(ctx.studentEmail, ctx.sessionId);
      _sentList = (r.items || []).map(it => ({ ...it, checked: false }));
      _sentCtx = ctx;
    } catch (e) { console.warn('문장 목록 불러오기 실패', e); _sentList = []; _sentCtx = ctx; }
    _sentLoading = false;
  }
  // 이 회차의 강의실 인라인 칸(문장 탭·erow)이 캐시해둔 목록도 지워서 다시 불러오게 한다.
  function sentInvalidateCurriculumCache(sessionId) {
    if (sessionId) delete state.curriculum.sentences[sessionId];
    if (state.widgetMulti.includes('curriculum') || document.querySelector('#curDashBoard')) refreshCurriculumWidgetBody();
  }

  function sentenceWidgetHeaderToolsHtml() {
    const n = _sentList.length;
    const allChecked = n > 0 && _sentList.every(s => s.checked);
    return `<div class="widget-head-tools sent-head-tools">
      <label class="sent-check-all"><input type="checkbox" data-sent-check-all ${allChecked ? 'checked' : ''}> 전체</label>
      <button type="button" class="sent-btn" data-sent-listen-all ${n ? '' : 'disabled'} title="체크한(없으면 전체) 문장을 순서대로 읽어줍니다">🔊 전체듣기</button>
      <button type="button" class="sent-btn sent-del-btn" data-sent-delsel ${n ? '' : 'disabled'} title="체크한 문장 삭제">🗑</button>
      <button type="button" class="sent-btn" data-sent-translate disabled title="학생 모국어 번역 (자리만 — 도입 여부 추후 결정)">🌐 번역</button>
      <button type="button" class="sent-btn" data-sent-mp3 title="녹음한 문장들을 MP3로 만들기 (준비 중)">MP3</button>
    </div>`;
  }

  function sentenceRowHtml(s) {
    return `<div class="sent-row" data-sent-row="${s.id}">
      <div class="sent-row-main">
        <input type="checkbox" class="sent-row-check" data-sent-check="${s.id}" ${s.checked ? 'checked' : ''} aria-label="선택">
        <button type="button" class="sent-mic-btn${s.id === _sentRecordingId ? ' is-rec' : ''}" data-sent-record="${s.id}"
          title="${s.id === _sentRecordingId ? '녹음 끝내기' : (s.rec ? '다시 녹음' : '학생 목소리 녹음')}">${s.id === _sentRecordingId ? '■' : '🎤'}</button>
        <input type="text" class="sent-text" data-sent-text="${s.id}" value="${escapeHtml(s.text)}" placeholder="문장">
        <button type="button" class="sent-btn sent-listen-btn" data-sent-listen="${s.id}" title="한국어로 읽어주기">🔊</button>
        ${s.rec ? `<audio class="sent-audio" controls preload="none" src="${s.rec}"></audio>` : ''}
      </div>
      ${s.translation ? `<div class="sent-translation">${escapeHtml(s.translation)}</div>` : ''}
    </div>`;
  }

  function sentenceWidgetBodyHtml() {
    if (_sentLoading) return `<div class="sent-widget"><div class="sent-empty">불러오는 중…</div></div>`;
    if (!sentContext()) return `<div class="sent-widget"><div class="sent-empty">강의실 위젯에서 학생과 회차를 먼저 선택하세요.</div></div>`;
    const rows = _sentList.map(sentenceRowHtml).join('');
    return `<div class="sent-widget">
      <div class="sent-add">
        <button type="button" class="sent-mic-btn${_sentDictating ? ' is-rec' : ''}" data-sent-dictate title="말해서 입력(받아쓰기)">${_sentDictating ? '■' : '🎤'}</button>
        <input type="text" class="sent-add-input" data-sent-add-input placeholder="여기 붙여넣거나(Ctrl+V) 입력, 또는 마이크로 말하기">
        <button type="button" class="sent-btn" data-sent-add>+ 추가</button>
      </div>
      <div class="sent-list">${rows || '<div class="sent-empty">저장된 문장이 없습니다. 웹페이지에서 복사하거나 마이크로 말해서 추가하세요.</div>'}</div>
    </div>`;
  }

  function refreshSentenceWidgetBody() {
    const bodyEl = widgetMultiGrid?.querySelector('[data-widget-panel="sentence"] .widget-panel-body');
    if (bodyEl) bodyEl.innerHTML = sentenceWidgetBodyHtml();
    const headEl = widgetMultiGrid?.querySelector('[data-widget-header-tools="sentence"]');
    if (headEl) headEl.innerHTML = sentenceWidgetHeaderToolsHtml();
  }
  // 강의실 위젯에서 문장을 열 때(또는 학생/회차가 바뀔 때) 서버에서 다시 불러온다.
  async function ensureSentenceContext() {
    await ensureCurriculumContext();
    await sentFetchList();
    refreshSentenceWidgetBody();
  }

  async function sentAddFromText(text) {
    text = String(text || '').trim();
    if (!text) return;
    const ctx = sentContext();
    if (!ctx) { message('강의실 위젯에서 학생과 회차를 먼저 선택하세요.', 'error'); return; }
    try {
      const r = await CurriculumStore.addSentence(ctx.studentEmail, ctx.sessionId, text);
      _sentList = (r.items || []).map(it => ({ ...it, checked: false }));
      refreshSentenceWidgetBody();
      sentInvalidateCurriculumCache(ctx.sessionId);
    } catch (e) { message('문장 저장 실패: ' + e.message, 'error'); }
  }
  async function sentDeleteChecked() {
    const ctx = sentContext();
    const ids = _sentList.filter(s => s.checked).map(s => s.id);
    if (!ids.length) { message('먼저 삭제할 문장을 체크하세요.', 'error'); return; }
    if (!confirm(`체크한 문장 ${ids.length}개를 삭제할까요?`)) return;
    if (!ctx) return;
    try {
      for (const id of ids) { await CurriculumStore.deleteSentence(ctx.studentEmail, ctx.sessionId, id); }
      await sentFetchList();
      refreshSentenceWidgetBody();
      sentInvalidateCurriculumCache(ctx.sessionId);
    } catch (e) { message('문장 삭제 실패: ' + e.message, 'error'); }
  }
  // 학생 모국어 번역 — 외부 번역 API를 붙이기 전까지는 자리만(눌러도 안내만).
  function sentTranslate(id) {
    message('번역은 아직 준비 중입니다 (번역 API 연결 예정).', 'error');
  }
  // 문장 칸에 입력할 때마다 저장하지 않고, 타이핑이 잠깐 멈추면 한 번만 서버에 반영한다.
  function sentQueueTextSave(id, text) {
    const ctx = sentContext();
    if (!ctx) return;
    clearTimeout(_sentTextSaveTimers[id]);
    _sentTextSaveTimers[id] = setTimeout(async () => {
      try {
        await CurriculumStore.updateSentence(ctx.studentEmail, ctx.sessionId, id, { text });
        sentInvalidateCurriculumCache(ctx.sessionId);
      } catch (e) { console.warn('문장 저장 실패', e); }
    }, 500);
  }

  async function sentToggleRecord(id) {
    if (_sentRecordingId === id) {
      // 이미 이 문장을 녹음 중 → 정지 요청만 (실제 저장은 mediaRecorder.onstop에서)
      _sentActiveRecorder && _sentActiveRecorder.state !== 'inactive' && _sentActiveRecorder.stop();
      return;
    }
    if (_sentRecordingId) return; // 동시에 하나만
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      message('이 브라우저는 마이크 녹음을 지원하지 않습니다.', 'error'); return;
    }
    const s = _sentList.find(x => x.id === id);
    if (!s) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        if (s.rec) { try { URL.revokeObjectURL(s.rec); } catch (_) {} }
        s.rec = URL.createObjectURL(blob);
        _sentRecordingId = null;
        _sentActiveRecorder = null;
        refreshSentenceWidgetBody();
      };
      _sentActiveRecorder = mr;
      mr.start();
      _sentRecordingId = id;
      refreshSentenceWidgetBody();
    } catch (e) { message('마이크 권한이 필요합니다: ' + (e.message || e), 'error'); }
  }

  function sentToggleDictate() {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) { message('이 브라우저는 음성 받아쓰기를 지원하지 않습니다.', 'error'); return; }
    if (_sentDictating) { try { _sentDictateRec && _sentDictateRec.stop(); } catch (_) {} return; }
    const rec = new Ctor();
    rec.lang = 'ko-KR';
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (ev) => {
      // 말하면 입력칸에 채우기만 하는 게 아니라, 바로 아래 목록에 쌓이게(추가 클릭 없이).
      const text = ev.results?.[0]?.[0]?.transcript || '';
      sentAddFromText(text);
    };
    rec.onerror = (ev) => { if (ev.error === 'not-allowed') message('마이크 권한이 필요합니다.', 'error'); };
    rec.onend = () => { _sentDictating = false; _sentDictateRec = null; refreshSentenceWidgetBody(); };
    _sentDictateRec = rec;
    _sentDictating = true;
    refreshSentenceWidgetBody();
    try { rec.start(); } catch (_) { _sentDictating = false; refreshSentenceWidgetBody(); }
  }
  async function sentListenAll() {
    const checked = _sentList.filter(s => s.checked);
    const list = checked.length ? checked : _sentList;
    for (const s of list) {
      await new Promise(resolve => {
        if (!('speechSynthesis' in window)) { resolve(); return; }
        if (!_koVoiceResolved) _koVoice = _resolveKoVoice();
        if (!_koVoice) { if (_koVoiceResolved) _showKoVoiceGuide(); resolve(); return; }
        const u = new SpeechSynthesisUtterance(s.text);
        u.lang = 'ko-KR'; u.voice = _koVoice;
        u.onend = resolve; u.onerror = resolve;
        window.speechSynthesis.speak(u);
      });
    }
  }
  document.addEventListener('click', async e => {
    if (e.target.closest('[data-sent-add]')) {
      const input = document.querySelector('[data-sent-add-input]');
      if (input) { sentAddFromText(input.value); input.value = ''; }
      return;
    }
    if (e.target.closest('[data-sent-dictate]')) { sentToggleDictate(); return; }
    const recBtn = e.target.closest('[data-sent-record]');
    if (recBtn) { sentToggleRecord(recBtn.dataset.sentRecord); return; }
    const listenBtn = e.target.closest('[data-sent-listen]');
    if (listenBtn) {
      const s = _sentList.find(x => x.id === listenBtn.dataset.sentListen);
      if (s) curduSpeak(s.text);
      return;
    }
    if (e.target.closest('[data-sent-listen-all]')) { sentListenAll(); return; }
    if (e.target.closest('[data-sent-mp3]')) { message('MP3 내보내기는 준비 중입니다.', 'error'); return; }
    if (e.target.closest('[data-sent-delsel]')) { sentDeleteChecked(); return; }
    const translateBtn = e.target.closest('[data-sent-translate]');
    if (translateBtn) { sentTranslate(translateBtn.dataset.sentTranslate); return; }
  });
  document.addEventListener('change', e => {
    const cb = e.target.closest('[data-sent-check]');
    if (cb) {
      const s = _sentList.find(x => x.id === cb.dataset.sentCheck);
      if (s) s.checked = !!cb.checked;
      const headEl = widgetMultiGrid?.querySelector('[data-widget-header-tools="sentence"]');
      if (headEl) headEl.innerHTML = sentenceWidgetHeaderToolsHtml();
      return;
    }
    if (e.target.closest('[data-sent-check-all]')) {
      const all = e.target.checked;
      _sentList.forEach(s => { s.checked = all; });
      refreshSentenceWidgetBody();
      return;
    }
  });
  document.addEventListener('input', e => {
    const t = e.target.closest('[data-sent-text]');
    if (t) {
      const s = _sentList.find(x => x.id === t.dataset.sentText);
      if (s) { s.text = t.value; sentQueueTextSave(s.id, s.text); }
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.closest('[data-sent-add-input]')) {
      e.preventDefault();
      sentAddFromText(e.target.value);
      e.target.value = '';
    }
  });
  document.addEventListener('input', e => {
    const t = e.target.closest('[data-wr-text]');
    if (t) { state_writingCtl.text = t.value; state_writingCtl._loadedKey = ''; writingPostUpdate(); }
  });
  document.addEventListener('change', e => {
    const f = e.target.closest('[data-wr-font]');
    if (f) { state_writingCtl.font = f.value; writingPostUpdate(); return; }
    const c = e.target.closest('[data-wr-cellsize]');
    if (c) { state_writingCtl.cellSize = c.value; writingPostUpdate(); return; }
    const load = e.target.closest('[data-wr-load]');
    if (load) {
      const key = load.value;
      if (!key) {
        // "원고지" — 아무것도 안 불러오고 그냥 빈 칸으로 되돌린다.
        state_writingCtl.text = '';
        state_writingCtl._loadedKey = '';
        writingPostUpdate();
        const headEl = writingHeaderEl();
        if (headEl) headEl.innerHTML = writingWidgetHeaderToolsHtml();
        return;
      }
      const [kind, idxStr] = key.split(':');
      const idx = Number(idxStr);
      const item = kind === 's' ? wrLoadShared()[idx] : wrLoadSaved()[idx];
      if (!item) return;
      state_writingCtl.text = item.text;
      if (item.font) state_writingCtl.font = item.font;
      if (item.cellSize) state_writingCtl.cellSize = item.cellSize;
      if (typeof item.strokeOrder === 'boolean') state_writingCtl.strokeOrder = item.strokeOrder;
      state_writingCtl._loadedKey = key;
      writingPostUpdate();
      const headEl = writingHeaderEl();
      if (headEl) headEl.innerHTML = writingWidgetHeaderToolsHtml();
      return;
    }
  });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-wr-print]')) {
      const frame = writingIframe();
      if (frame && frame.contentWindow) frame.contentWindow.postMessage({ type: 'koredu-writing-print' }, location.origin);
      return;
    }
    if (e.target.closest('[data-wr-stroke]')) {
      state_writingCtl.strokeOrder = !state_writingCtl.strokeOrder;
      writingPostUpdate();
      const headEl = writingHeaderEl();
      if (headEl) headEl.innerHTML = writingWidgetHeaderToolsHtml();
      return;
    }
    if (e.target.closest('[data-wr-save]')) {
      const input = document.querySelector('[data-wr-text]');
      const text = (input?.value || '').trim();
      // 글자를 안 넣은 채로도 저장 가능 — 빈 원고지(칸만 있는 학습지)로 쓰기 위함.
      const name = prompt('저장할 이름을 입력하세요', text ? text.slice(0, 10) : '원고지');
      if (!name || !name.trim()) return;
      // admin이 저장하면 개인 목록이 아니라 모두가 보는 공통 목록에 들어간다.
      // 글씨체·칸수·획순 표시 여부도 그때 화면 그대로 같이 저장해서, 불러오면 그대로 재현된다.
      const isAdmin = state.user?.role === 'admin';
      const list = isAdmin ? wrLoadShared() : wrLoadSaved();
      const trimmedName = name.trim();
      const entry = {
        name: trimmedName, text,
        font: state_writingCtl.font, cellSize: state_writingCtl.cellSize, strokeOrder: state_writingCtl.strokeOrder
      };
      // 같은 이름이 이미 있으면 새로 추가하지 않고 그 자리에서 덮어쓴다.
      const dupIdx = list.findIndex(x => x.name === trimmedName);
      if (dupIdx >= 0) list[dupIdx] = entry; else list.push(entry);
      if (isAdmin) wrSaveSharedList(list); else wrSaveSavedList(list);
      // 저장하면서 이름순으로 다시 정렬되므로, 그 뒤에 실제 자리를 다시 찾아서 선택 표시한다.
      const finalIdx = list.findIndex(x => x.name === trimmedName);
      state_writingCtl._loadedKey = (isAdmin ? 's' : 'u') + ':' + Math.max(0, finalIdx);
      const headEl = writingHeaderEl();
      if (headEl) headEl.innerHTML = writingWidgetHeaderToolsHtml();
      return;
    }
    if (e.target.closest('[data-wr-delete-saved]')) {
      const key = state_writingCtl._loadedKey;
      const isAdmin = state.user?.role === 'admin';
      const isMine = key.startsWith('u:');
      const isShared = isAdmin && key.startsWith('s:');
      if (!isMine && !isShared) return;
      const idx = Number(key.split(':')[1]);
      const list = isShared ? wrLoadShared() : wrLoadSaved();
      if (!confirm(`"${list[idx]?.name || ''}" 저장한 문구를 지울까요?`)) return;
      list.splice(idx, 1);
      if (isShared) wrSaveSharedList(list); else wrSaveSavedList(list);
      state_writingCtl._loadedKey = '';
      const headEl = writingHeaderEl();
      if (headEl) headEl.innerHTML = writingWidgetHeaderToolsHtml();
      return;
    }
  });
  window.addEventListener('message', e => {
    if (e.data && e.data.type === 'koredu-writing-ready') writingPostUpdate();
  });

  function wordWidgetBodyHtml() {
    const inYouTube = state.page === 'module' && state.section === 'video' && state.item === 'youtube';
    if (!inYouTube) return `<div class="word-widget-empty"><strong>영상 단어장</strong><p>YouTube 영상을 열면 현재 자막과 연결됩니다.</p></div>`;

    const context = state.wordContext;
    if (!context) return `<div class="word-widget-empty"><strong>현재 영상 확인 중</strong><p>VideoScript에서 영상을 열어 주세요.</p></div>`;

    const entryCount = Number(context.entryCount || context.entries?.length || 0);
    const allWords = Array.isArray(state.wordList?.words) ? state.wordList.words : [];
    const words = visibleExtractedWords();
    const saved = Array.isArray(state.savedStudentWords) ? state.savedStudentWords : [];
    const loading = state.wordStageLoading || '';
    let extractedHtml = '';
    if (!entryCount) {
      extractedHtml = `<div class="word-widget-empty compact"><strong>자막 없음</strong><p>먼저 자막을 적용해 주세요.</p></div>`;
    } else if (loading) {
      const loadingText = loading === 'words' ? '학습 단어 추출 중…' : '15개 언어 번역 중…';
      extractedHtml = `<div class="word-widget-loading"><span></span><strong>${loadingText}</strong></div>`;
    } else if (!words.length) {
      const apiHint = state.wordApiConfigured ? '' : ' W07에서 API Key를 저장하세요.';
      extractedHtml = `<div class="word-widget-empty compact"><strong>자막 단어 없음</strong><p>저장 단어와 중복된 단어는 자막 쪽에서 자동 제외됩니다.${apiHint}</p></div>`;
    } else {
      extractedHtml = `<div class="word-chip-grid compact">${words.map(word => {
        const originalIndex = allWords.indexOf(word);
        const ko = escapeHtml(word?.ko || '');
        const translated = escapeHtml(word?.translations?.[state.wordLanguage] || '');
        return `<div class="word-chip" role="button" tabindex="0" data-word-seek="${originalIndex}" title="관련 자막으로 이동">
          <button class="word-chip-speaker" type="button" data-word-speak="${originalIndex}" aria-label="${ko} 듣기">🔊</button>
          <div class="word-chip-text"><strong>${ko}</strong>${translated ? `<span>${translated}</span>` : ''}</div>
        </div>`;
      }).join('')}</div>`;
    }

    const savedHtml = saved.length ? `<div class="saved-word-chip-grid">${saved.map((item, index) => {
      const text = escapeHtml(item.text || '');
      const occurrences = Array.isArray(item.occurrences) ? item.occurrences : [];
      const linked = occurrences.length || Number(item.index) >= 0;
      const time = escapeHtml(occurrences[0]?.time || item.time || '');
      return `<div class="saved-word-chip" ${linked ? `role="button" tabindex="0" data-saved-word-seek="${index}" title="${time ? `${time} · ` : ''}저장한 자막 위치로 이동"` : ''}>
        <button type="button" class="saved-word-speaker" data-saved-word-speak="${index}" aria-label="${text} 듣기">🔊</button>
        <strong>${text}</strong>
        <button type="button" class="saved-word-remove" data-saved-word-remove="${index}" aria-label="${text} 삭제">×</button>
      </div>`;
    }).join('')}</div>` : `<div class="saved-word-empty">자막에서 모르는 단어를 드래그한 뒤 저장하면 이곳에 들어옵니다.</div>`;

    const activeBody = state.wordView === 'saved' ? savedHtml : extractedHtml;
    return `<div class="word-book-layout">
      <aside class="word-book-source-tabs" aria-label="단어 소스">
        <div class="word-source-tab ${state.wordView === 'extracted' ? 'active' : ''}">
          <input type="checkbox" data-word-source-check="extracted" ${state.wordSourceSelection?.extracted ? 'checked' : ''} aria-label="자막 단어 MP3/Excel 포함" />
          <button type="button" data-word-view="extracted"><strong>자막</strong><span>${words.length}</span></button>
        </div>
        <div class="word-source-tab ${state.wordView === 'saved' ? 'active' : ''}">
          <input type="checkbox" data-word-source-check="saved" ${state.wordSourceSelection?.saved ? 'checked' : ''} aria-label="저장 단어 MP3/Excel 포함" />
          <button type="button" data-word-view="saved"><strong>저장</strong><span>${saved.length}</span></button>
        </div>
      </aside>
      <section class="word-book-single-pane">
        <div class="word-book-pane-body">${activeBody}</div>
      </section>
    </div>`;
  }

  // W02 문법: Admin/선생님이 미리 연결해둔 "자막 구절 ↔ 강의 문법" 목록(모든 학생 공통, 영상별 고정).
  async function loadGrammarTags(videoId) {
    const g = state.grammar;
    g.selected = '';
    if (!videoId) { g.tags = []; g.videoId = ''; refreshGrammarWidgetBody(); return; }
    g.loading = true; g.videoId = videoId;
    refreshGrammarWidgetBody();
    try {
      const res = await fetch(`${PIPELINE_ORIGIN}/api/grammar-tags?videoId=${encodeURIComponent(videoId)}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      g.tags = Array.isArray(data.tags) ? data.tags : [];
    } catch (_) { g.tags = []; }
    g.loading = false;
    refreshGrammarWidgetBody();
  }
  // "강의목록" 보기 전용: 지금 연 영상 하나가 아니라 문법이 붙은 전체 유튜브 영상을 한 번에 모아온다.
  async function loadGrammarTagsAll() {
    const g = state.grammar;
    if (g.allLoading || g.allTags) return;
    g.allLoading = true;
    refreshGrammarWidgetBody();
    try {
      const res = await fetch(`${PIPELINE_ORIGIN}/api/grammar-tags-all`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      g.allTags = Array.isArray(data.items) ? data.items : [];
    } catch (_) { g.allTags = []; }
    g.allLoading = false;
    refreshGrammarWidgetBody();
  }
  // 강의목록 보기에서 다른(지금 안 열려있는) 영상의 타임스탬프를 누르면, 그 영상을 유튜브로 열고 이동한다.
  function grammarSeekAcrossVideo(videoId, seconds) {
    showYoutubeForWidgets();
    if (state.wordContext?.videoId === videoId) {
      postToVideoScript({ type: 'koredu-seek-subtitle', videoId, seconds: Number(seconds) || 0 });
      return;
    }
    const ctx = previewContext();
    const q = `embed=1&role=${ctx.role}&level=${ctx.level || 1}&access=${state.user?.access || 'free'}`;
    const pendingSeek = { videoId, seconds: Number(seconds) || 0 };
    const applySeek = () => postToVideoScript({ type: 'koredu-seek-subtitle', videoId, seconds: pendingSeek.seconds });
    if (!(state.page === 'module' && state.section === 'video' && state.item === 'youtube')) {
      openModule('video', 'youtube');
    }
    setTimeout(() => { if (moduleFrame) moduleFrame.src = `http://localhost:8120/player.html?v=${encodeURIComponent(videoId)}&${q}`; }, 40);
    setTimeout(applySeek, 900);
  }
  // 헤더의 "유튜브유지" 토글: 꺼져 있으면(기본값) 강의를 열 때 유튜브 화면을 치우고
  // 그 공간을 위젯(문법/강의)에 몰아준다. 타임스탬프를 눌러 이동할 때는 토글 상태와
  // 상관없이 항상 유튜브 화면을 다시 보여준다.
  function keepYoutubeOn() { return !!state.keepYoutube; }
  function hideYoutubeForWidgets() { document.body.classList.add('grammar-wide-widgets'); }
  function showYoutubeForWidgets() { document.body.classList.remove('grammar-wide-widgets'); }
  function syncKeepYoutubeButton() {
    const btn = document.getElementById('keepYoutubeToggle');
    if (btn) btn.classList.toggle('on', keepYoutubeOn());
  }
  function toggleKeepYoutube() {
    state.keepYoutube = !state.keepYoutube;
    syncKeepYoutubeButton();
    if (state.keepYoutube) {
      showYoutubeForWidgets();
    } else if (state.widgetMulti.includes('lecturelist')) {
      hideYoutubeForWidgets();
    }
  }
  // 시크릿 모드: 주변에 화면을 보여주기 곤란할 때 쓰는 임시 개발용 토글(정식 오픈 때는 뺄 예정).
  // 영상·섬네일·강의 그림은 완전히 숨기고(각 프레임 쪽 CSS), 메뉴 글자만 여기서 "내목록"으로 바꾼다.
  function broadcastSecretMode() {
    const payload = { type: 'koredu-secret-mode', on: !!state.secretMode };
    document.body.classList.toggle('koredu-secret', !!state.secretMode);
    document.querySelectorAll('iframe').forEach(el => {
      try { el.contentWindow?.postMessage(payload, '*'); } catch (_) {}
    });
  }
  function applySecretModeLabels() {
    const on = !!state.secretMode;
    const btn = document.getElementById('secretModeToggle');
    if (btn) btn.classList.toggle('on', on);
    [document.querySelector('[data-sub-item="youtube"]'), document.querySelector('.brand-text')].forEach(el => {
      if (!el) return;
      if (on) {
        if (el.dataset.secretOrig === undefined) el.dataset.secretOrig = el.textContent;
        el.textContent = '내목록';
      } else if (el.dataset.secretOrig !== undefined) {
        el.textContent = el.dataset.secretOrig;
      }
    });
  }
  function toggleSecretMode() {
    state.secretMode = !state.secretMode;
    applySecretModeLabels();
    broadcastSecretMode();
  }
  function grammarSeek(seconds) {
    const videoId = state.wordContext?.videoId;
    if (!videoId) return;
    showYoutubeForWidgets();
    postToVideoScript({ type: 'koredu-seek-subtitle', videoId, seconds: Number(seconds) || 0 });
  }
  // 문법(자막 구절 / 강의번호)을 누르면 유튜브 이동 대신, 오른쪽에 그 강의를 위젯으로 띄운다.
  // 이미 열려 있으면 그 자리에서 강의만 바꿔치기(다시 눌러도 같은 자리에서 계속 교체됨).
  function grammarOpenLesson(lessonId) {
    if (!lessonId) return;
    const ctx = previewContext();
    const q = `embed=1&role=${ctx.role}&level=${ctx.level || 1}&access=${state.user?.access || 'free'}`;
    const src = `http://localhost:8121/${encodeURIComponent(lessonId)}/index.html?${q}`;
    const applyToFrame = () => {
      const frame = curLibWidgetFrame('lecture');
      if (frame) frame.src = src;
    };
    if (!keepYoutubeOn()) hideYoutubeForWidgets();
    if (!state.widgetMulti.includes('lecturelist')) {
      setMultiWidget('lecturelist', true);
      setTimeout(applyToFrame, 80);
    } else {
      applyToFrame();
    }
  }
  // 너무 자주 나와서 반복되는 기초 조사 — "기초제외" 켜면 안 보이게 뺀다.
  const GRAMMAR_BASIC = new Set(['은/는', '이/가', '을/를', '의(소유격)', '도']);
  // 문법 이름마다 항상 같은 색이 나오게(같은 -(으)면서는 어디서든 같은 색).
  const GRAMMAR_COLORS = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777'];
  // 문법 이름 전체(모든 영상)에 고정색을 주면 문법 종류가 6개보다 훨씬 많아서 자꾸 겹친다.
  // 그 대신 "한 자막(문장) 안에서만" 등장 순서대로 6색을 돌려써서, 같은 문장 안에서는 절대 안 겹치게 한다.
  function grammarColorForIndex(idx) {
    return GRAMMAR_COLORS[idx % GRAMMAR_COLORS.length];
  }
  // 강의 목록 칸은 한 줄로 짧게 — "-는(현재 관형형)"처럼 끝에 붙는 부연설명은 강의 목록
  // 칸에서는 빼고 핵심 형태만 보여준다("-는"). "(으)"처럼 형태 중간에 낀 괄호는 안 건드린다.
  function grammarShortLabel(label) {
    return String(label || '').replace(/\([^)]*\)\s*$/, '').trim();
  }
  function grammarSortbarHtml(sort, showUnreg, colorize, hideBasic) {
    return `<div class="grammar-sortbar">
      <button type="button" class="${sort === 'time' ? 'on' : ''}" data-grammar-sort="time">시간순</button>
      <button type="button" class="${sort === 'lesson' ? 'on' : ''}" data-grammar-sort="lesson">강의순</button>
      <button type="button" class="${sort === 'lessonlist' ? 'on' : ''}" data-grammar-sort="lessonlist">강의목록</button>
      <span class="cur-hsep">|</span>
      <button type="button" class="${showUnreg ? 'on' : ''}" data-grammar-toggle-unreg title="100강에 없는 문법에 밑줄 표시">미등록문법</button>
      ${sort === 'lessonlist' ? '' : `<button type="button" class="${colorize ? 'on' : ''}" data-grammar-toggle-color title="문법마다 다른 색으로 구분할지 정합니다">글색</button>`}
      <button type="button" class="${hideBasic ? 'on' : ''}" data-grammar-toggle-basic title="은/는, 이/가, 을/를, 의(소유격) 같은 기초 조사를 빼고 봅니다">기초제외</button>
    </div>`;
  }
  function grammarWidgetBodyHtml() {
    const g = state.grammar;
    const sort = g.sort || 'time';
    const showUnreg = !!g.showUnreg;
    const colorize = g.colorize !== false;
    const selected = g.selected || '';
    const hideBasic = !!g.hideBasic;
    if (!state.wordContext?.videoId) {
      return `<div class="widget-empty"><strong>문법</strong><p>영상을 먼저 여세요.</p></div>`;
    }
    if (g.loading) return `<div class="grammar-widget"><div class="grammar-msg">불러오는 중…</div></div>`;
    if (!g.tags.length) return `<div class="widget-empty"><strong>문법</strong><p>이 영상에 연결된 문법이 아직 없습니다.</p></div>`;
    const rows = [...g.tags];
    // "강의목록" 보기(이 영상 안에서만): 문장 단위가 아니라 매칭 하나하나를 한 줄씩, 강의번호별로
    // 몰아서 보여준다. 같은 문장이 여러 강의에 걸리면 그만큼 반복해서 나오는데, 그 문장 안에서
    // 해당 문법 부분만 빨갛게 표시한다.
    if (sort === 'lessonlist') {
      const flat = [];
      rows.forEach(t => {
        const text = String(t.text || '');
        (Array.isArray(t.matches) ? t.matches : []).forEach(m => {
          if (hideBasic && GRAMMAR_BASIC.has(m.grammar)) return;
          const chunk = String(m.chunk || '');
          const idx = chunk ? text.indexOf(chunk) : -1;
          flat.push({ t, m, idx, text });
        });
      });
      let fid = 0;
      flat.sort((a, b) => {
        const ka = a.m.lesson_id || '￿';
        const kb = b.m.lesson_id || '￿';
        if (ka !== kb) return ka < kb ? -1 : 1;
        return (Number(a.t.seconds) || 0) - (Number(b.t.seconds) || 0);
      });
      const flatHtml = flat.map(f => {
        const { t, m, idx, text } = f;
        const unregistered = !m.lesson_id;
        const id = 'gf' + (++fid);
        const selCls = id === selected ? ' grammar-selected' : '';
        const chunkColor = unregistered ? '#94a3b8' : '#dc2626';
        let textHtml;
        if (idx >= 0) {
          const chunk = String(m.chunk || '');
          textHtml = escapeHtml(text.slice(0, idx))
            + `<b class="grammar-chunk${unregistered ? ' grammar-chunk-unreg' : ''}" style="color:${chunkColor}">${escapeHtml(text.slice(idx, idx + chunk.length))}</b>`
            + escapeHtml(text.slice(idx + chunk.length));
        } else {
          textHtml = escapeHtml(text);
        }
        const openAttr = unregistered ? '' : ` data-grammar-open-lesson="${escapeHtml(m.lesson_id)}"`;
        return `<div class="grammar-flat-row${selCls}" data-grammar-match="${id}" data-grammar-seek="${Number(t.seconds) || 0}" title="눌러서 이 지점으로 이동">
          <span class="grammar-flat-lesson" data-grammar-match="${id}"${openAttr} title="${unregistered ? '' : '눌러서 이 강의 보기'}">${unregistered ? '미등록' : escapeHtml(m.lesson_id)}</span>
          <span class="grammar-flat-sep">|</span>
          <span class="grammar-flat-time">${escapeHtml(t.time || '')}</span>
          <span class="grammar-flat-text">${textHtml}</span>
        </div>`;
      }).join('');
      return `<div class="grammar-widget${showUnreg ? ' show-unreg' : ''}">
        ${grammarSortbarHtml(sort, showUnreg, colorize, hideBasic)}
        <div class="grammar-flat-list">${flatHtml || '<div class="grammar-msg">표시할 항목이 없습니다.</div>'}</div>
      </div>`;
    }
    rows.sort((a, b) => sort === 'lesson'
      ? String((a.matches || [])[0]?.lesson_id || '').localeCompare(String((b.matches || [])[0]?.lesson_id || ''))
      : (Number(a.seconds) || 0) - (Number(b.seconds) || 0));
    let mid = 0;
    const items = rows.map(t => {
      const text = String(t.text || '');
      const matches = Array.isArray(t.matches) ? t.matches : [];
      // 한 문장 안 여러 구절 위치를 찾아 겹치지 않게 순서대로 색칠한다.
      const spans = [];
      matches.forEach(m => {
        if (hideBasic && GRAMMAR_BASIC.has(m.grammar)) return;
        const chunk = String(m.chunk || '');
        const idx = chunk ? text.indexOf(chunk) : -1;
        if (idx >= 0) spans.push({ start: idx, end: idx + chunk.length, m, id: 'gm' + (++mid) });
      });
      spans.sort((a, b) => a.start - b.start);
      spans.forEach((sp, i) => { sp.colorIdx = i; });   // 문장 안 등장 순서대로 6색 돌려쓰기(왼쪽부터)
      let cursor = 0, textHtml = '';
      spans.forEach(sp => {
        if (sp.start < cursor) return;
        textHtml += escapeHtml(text.slice(cursor, sp.start));
        // 100강 목록에 없는 문법(lesson_id 없음)은 항상 회색+밑줄(글색 토글과 무관). 등록된 건
        // "글색" 켜져 있을 때만 이 문장 안 등장 순서로 색 돌려쓰기, 꺼져 있으면 색 없이 굵게만.
        const unregistered = !sp.m.lesson_id;
        const color = unregistered ? '#94a3b8' : (colorize ? grammarColorForIndex(sp.colorIdx) : '');
        const styleAttr = color ? ` style="color:${color}"` : '';
        const openAttr = unregistered ? '' : ` data-grammar-open-lesson="${escapeHtml(sp.m.lesson_id)}"`;
        const selCls = sp.id === selected ? ' grammar-selected' : '';
        textHtml += `<span class="grammar-chunk${unregistered ? ' grammar-chunk-unreg' : ''}${selCls}" data-grammar-match="${sp.id}"${styleAttr}${openAttr} title="${unregistered ? '' : '눌러서 이 강의 보기'}">${escapeHtml(text.slice(sp.start, sp.end))}</span>`;
        cursor = sp.end;
      });
      textHtml += escapeHtml(text.slice(cursor));
      const lessonHtml = spans.map(sp => {
        const unregistered = !sp.m.lesson_id;
        const color = unregistered ? '#94a3b8' : (colorize ? grammarColorForIndex(sp.colorIdx) : '');
        const styleAttr = color ? ` style="color:${color}"` : '';
        const openAttr = unregistered ? '' : ` data-grammar-open-lesson="${escapeHtml(sp.m.lesson_id)}"`;
        const selCls = sp.id === selected ? ' grammar-selected' : '';
        return `<div class="grammar-row-lesson-item${selCls}" data-grammar-match="${sp.id}"${styleAttr}${openAttr} title="${unregistered ? '' : '눌러서 이 강의 보기'}"><b>${unregistered ? '미등록' : escapeHtml(sp.m.lesson_id || '')}</b><span>${escapeHtml(grammarShortLabel(sp.m.grammar))}</span></div>`;
      }).join('');
      return `<div class="grammar-row" data-grammar-seek="${Number(t.seconds) || 0}" title="눌러서 이 지점으로 이동">
        <div class="grammar-row-time">${escapeHtml(t.time || '')}</div>
        <div class="grammar-row-text">${textHtml}</div>
        <div class="grammar-row-lesson">${lessonHtml || '<span class="cur-cell-empty">—</span>'}</div>
      </div>`;
    }).join('');
    return `<div class="grammar-widget${showUnreg ? ' show-unreg' : ''}">
      ${grammarSortbarHtml(sort, showUnreg, colorize, hideBasic)}
      <div class="grammar-list">${items}</div>
    </div>`;
  }
  function refreshGrammarWidgetBody() {
    const bodyEl = widgetMultiGrid?.querySelector('[data-widget-panel="grammar"] .widget-panel-body');
    if (bodyEl) bodyEl.innerHTML = grammarWidgetBodyHtml();
  }
  document.addEventListener('click', e => {
    const sortBtn = e.target.closest('[data-grammar-sort]');
    if (sortBtn) { state.grammar.sort = sortBtn.dataset.grammarSort; refreshGrammarWidgetBody(); return; }
    const unregBtn = e.target.closest('[data-grammar-toggle-unreg]');
    if (unregBtn) { state.grammar.showUnreg = !state.grammar.showUnreg; refreshGrammarWidgetBody(); return; }
    const colorBtn = e.target.closest('[data-grammar-toggle-color]');
    if (colorBtn) { state.grammar.colorize = state.grammar.colorize === false ? true : false; refreshGrammarWidgetBody(); return; }
    const basicBtn = e.target.closest('[data-grammar-toggle-basic]');
    if (basicBtn) { state.grammar.hideBasic = !state.grammar.hideBasic; refreshGrammarWidgetBody(); return; }
    // 문법 구절/강의번호는 영상 이동 대신 오른쪽에 그 강의를 띄운다 — row 전체 클릭(시간 이동)보다 먼저 확인.
    // 눌러서 연 구절·강의는 계속 하이라이트로 남겨(선택 상태), 지금 오른쪽에 뭐가 떠 있는지 알 수 있게 한다.
    const openLesson = e.target.closest('[data-grammar-open-lesson]');
    if (openLesson) {
      state.grammar.selected = openLesson.dataset.grammarMatch || '';
      grammarOpenLesson(openLesson.dataset.grammarOpenLesson);
      refreshGrammarWidgetBody();
      return;
    }
    const seekVideo = e.target.closest('[data-grammar-seek-video]');
    if (seekVideo) { grammarSeekAcrossVideo(seekVideo.dataset.grammarSeekVideo, seekVideo.dataset.grammarSeek); return; }
    const row = e.target.closest('[data-grammar-seek]');
    if (row) { grammarSeek(row.dataset.grammarSeek); return; }
  });
  // 문장 안 구절에 마우스를 올리면 오른쪽 강의 목록에서 그 짝을 같이 밝혀준다(반대도 마찬가지).
  document.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-grammar-match]');
    if (!el) return;
    document.querySelectorAll(`[data-grammar-match="${el.dataset.grammarMatch}"]`).forEach(x => x.classList.add('grammar-hl'));
  });
  document.addEventListener('mouseout', e => {
    const el = e.target.closest('[data-grammar-match]');
    if (!el) return;
    document.querySelectorAll(`[data-grammar-match="${el.dataset.grammarMatch}"]`).forEach(x => x.classList.remove('grammar-hl'));
  });

  function questionTranslationPart(item, part, ordered = false) {
    const lang = String(state.questionLanguage || 'en').toLowerCase();
    const source = ordered ? item?.orderedTranslations : item?.translations;
    const bucket = source && typeof source === 'object' ? source[lang] : null;
    if (bucket && typeof bucket === 'object') return String(bucket?.[part] || '');

    // 이전 JSON과도 호환한다.
    const upper = lang.toUpperCase();
    const legacyKey = ordered
      ? `${part === 'question' ? 'question' : 'answer'}OrderedTranslations`
      : `${part === 'question' ? 'question' : 'answer'}Translations`;
    const legacy = item?.[legacyKey];
    if (legacy && typeof legacy === 'object') return String(legacy[lang] || legacy[upper] || '');
    return '';
  }

  function questionMatchPairs(item, part) {
    const lang = String(state.questionLanguage || 'en').toLowerCase();
    const source = item?.matchingByLanguage;
    const bucket = source && typeof source === 'object' ? source[lang] : null;
    if (!bucket || typeof bucket !== 'object') return [];
    const pairs = Array.isArray(bucket?.[part]) ? bucket[part] : [];
    return pairs
      .map(pair => ({
        id: String(pair?.id || ''),
        ko: String(pair?.ko || ''),
        tr: String(pair?.tr || pair?.translation || '')
      }))
      .filter(pair => pair.ko || pair.tr);
  }

  function questionMatchGroup(item, part, pair, pairIndex) {
    const qid = String(item?.id || 'q').replace(/[^A-Za-z0-9_-]/g, '_');
    const lang = String(state.questionLanguage || 'en').toLowerCase();
    return `qa-${qid}-${part}-${lang}-${String(pair?.id || pairIndex)}`;
  }

  function questionMatchLineHtml(item, part, side) {
    const pairs = questionMatchPairs(item, part);
    if (!pairs.length) return '';
    return pairs.map((pair, pairIndex) => {
      const group = escapeHtml(questionMatchGroup(item, part, pair, pairIndex));
      const text = escapeHtml(side === 'ko' ? pair.ko : pair.tr);
      return `<span class="question-match-token" data-question-match="${group}">${text}</span>`;
    }).join('<span class="question-match-sep" aria-hidden="true"> | </span>');
  }


  function persistWordView() {
    try {
      localStorage.setItem(WORD_VIEW_KEY, JSON.stringify({
        view: state.wordView === 'saved' ? 'saved' : 'extracted',
        extracted: state.wordSourceSelection?.extracted !== false,
        saved: state.wordSourceSelection?.saved !== false
      }));
    } catch (_) {}
  }

  function persistQuestionView() {
    try {
      localStorage.setItem(QUESTION_VIEW_KEY, JSON.stringify({
        sort: state.questionSort || '',
        dir: state.questionSortDir || 'asc',
        showAnswer: state.questionShowAnswer !== false,
        showStudent: state.questionShowStudent !== false,
        showTranslation: state.questionShowTranslation !== false
      }));
    } catch (_) {}
  }

  function persistWidgetChanges() {
    // 위젯에서 변경된 실제 학습 데이터/환경값은 영상 이탈 전에 한 번 더 확정 저장한다.
    persistSavedStudentWords();
    persistQuestionStudentAnswers();
    persistWordView();
    persistQuestionView();
    try {
      localStorage.setItem(LEARNING_LANG_KEY, state.learningLanguage);
      localStorage.setItem(WORD_LANG_KEY, state.learningLanguage);
      localStorage.setItem(QUESTION_LANG_KEY, state.learningLanguage);
    } catch (_) {}
    saveWidgetLayout();
  }

  function leaveYouTubeWidgetSession() {
    if (!(state.page === 'module' && state.section === 'video' && state.item === 'youtube')) return;
    persistWidgetChanges();
    // VideoScript 내부의 현재 자막/localStorage/persistent state도 페이지가 사라지기 전에 flush 요청한다.
    postToVideoScript({ type: 'koredu-flush-before-leave' });

    // 위젯 열림 상태는 유지한다 (레일 버튼 활성 여부로 관리 · 페이지 통일).
    // 영상 컨텍스트 데이터만 정리한다.
    state.wordContext = null;
    state.wordList = null;
    state.wordMessage = '';
    state.questionList = null;
    state.questionMessage = '';
    state.wordOccurrenceCursor = {};
    state.savedWordOccurrenceCursor = {};
    // W04 복습: 메모리 상태 초기화(로컬 저장본은 유지 — 다음에 열면 다시 불러옴)
    state.homework = homeworkDefault();
    resetHomeworkRuntime();
    suspendWidgetWorkspace();
    syncWidgetRail();
  }

  function isPersonalQuestionAnswer(value) {
    return String(value || '').replace(/\s+/g, '').trim() === '개인답변';
  }

  function questionSortIndicator(key) {
    if (state.questionSort !== key) return '↕';
    return state.questionSortDir === 'desc' ? '↓' : '↑';
  }

  function sortedQuestionRows(questions) {
    const rows = questions.map((item, sourceIndex) => ({ item, sourceIndex }));
    const key = String(state.questionSort || '');
    if (!['question','answer','student'].includes(key)) return rows;
    const dir = state.questionSortDir === 'desc' ? -1 : 1;
    rows.sort((left, right) => {
      const a = left.item || {};
      const b = right.item || {};
      if (key === 'answer') {
        const ap = isPersonalQuestionAnswer(a.answer);
        const bp = isPersonalQuestionAnswer(b.answer);
        // 답변 정렬에서는 개인답변을 항상 가장 위에 둔다.
        if (ap !== bp) return ap ? -1 : 1;
        const cmp = String(a.answer || '').localeCompare(String(b.answer || ''), 'ko');
        return cmp ? cmp * dir : left.sourceIndex - right.sourceIndex;
      }
      if (key === 'student') {
        const ak = questionAnswerKey(a, left.sourceIndex);
        const bk = questionAnswerKey(b, right.sourceIndex);
        const av = String(state.questionStudentAnswers?.[ak] || '').trim();
        const bv = String(state.questionStudentAnswers?.[bk] || '').trim();
        // 작성된 학생답변을 빈 답변보다 먼저 보여준다.
        if (!!av !== !!bv) return av ? -1 : 1;
        const cmp = av.localeCompare(bv, 'ko');
        return cmp ? cmp * dir : left.sourceIndex - right.sourceIndex;
      }
      const cmp = String(a.question || '').localeCompare(String(b.question || ''), 'ko');
      return cmp ? cmp * dir : left.sourceIndex - right.sourceIndex;
    });
    return rows;
  }

  function questionGridClass() {
    const answer = state.questionShowAnswer !== false;
    const student = state.questionShowStudent !== false;
    if (answer && student) return 'cols-qas';
    if (answer) return 'cols-qa';
    if (student) return 'cols-qs';
    return 'cols-q';
  }

  function questionsWidgetBodyHtml() {
    const questions = Array.isArray(state.questionList?.questions) ? state.questionList.questions : [];
    if (!questions.length) {
      return `<div class="questions-widget-empty"><strong>질문 없음</strong><p>결과 ZIP의 질문·답변이 표시됩니다.</p></div>`;
    }
    const showAnswer = state.questionShowAnswer !== false;
    const showStudent = state.questionShowStudent !== false;
    const showTranslation = state.questionShowTranslation !== false;
    const gridClass = questionGridClass();
    const rows = sortedQuestionRows(questions);
    const headQuestion = `<div class="question-head-cell"><button type="button" class="question-sort-btn ${state.questionSort === 'question' ? 'active' : ''}" data-question-sort="question" title="질문 정렬">질문 <span>${questionSortIndicator('question')}</span></button></div>`;
    const headAnswer = showAnswer ? `<div class="question-head-cell"><button type="button" class="question-sort-btn ${state.questionSort === 'answer' ? 'active' : ''}" data-question-sort="answer" title="답변 정렬 · 개인답변 우선">답변 <span>${questionSortIndicator('answer')}</span></button></div>` : '';
    const headStudent = showStudent ? `<div class="question-head-cell"><button type="button" class="question-sort-btn ${state.questionSort === 'student' ? 'active' : ''}" data-question-sort="student" title="학생답변 정렬">학생답변 <span>${questionSortIndicator('student')}</span></button></div>` : '';
    return `<div class="questions-widget-shell ${gridClass}">
      <div class="questions-grid-head ${gridClass}">${headQuestion}${headAnswer}${headStudent}</div>
      <div class="questions-widget-list">${rows.map(({ item, sourceIndex }) => {
        const time = escapeHtml(item?.time || '');
        const q = escapeHtml(item?.question || '');
        const a = escapeHtml(item?.answer || '');
        const qKoMatch = showTranslation ? questionMatchLineHtml(item, 'question', 'ko') : '';
        const aKoMatch = showTranslation ? questionMatchLineHtml(item, 'answer', 'ko') : '';
        // 번역은 자연스러운 번역 하나만 보여준다(직역·매칭용 외국어 줄은 안 씀).
        const qNatural = showTranslation ? escapeHtml(questionTranslationPart(item, 'question', false)) : '';
        const aNatural = showTranslation ? escapeHtml(questionTranslationPart(item, 'answer', false)) : '';
        const key = questionAnswerKey(item, sourceIndex);
        const student = escapeHtml(state.questionStudentAnswers?.[key] || '');
        const linked = Number(item?.index) >= 0 || Number(item?.seconds) >= 0;
        return `<article class="question-row ${gridClass} ${String(item?.type || '').toLowerCase() === 'experience' ? 'experience' : ''}">
          <div class="question-cell question-q-cell" ${linked ? `role="button" tabindex="0" data-question-seek="${sourceIndex}" title="관련 영상·자막으로 이동"` : ''}>
            <div class="question-q-meta">
              ${time ? `<span class="question-time">${time}</span>` : ''}
              <button type="button" class="question-speaker" data-question-speak="${sourceIndex}" data-question-part="question" aria-label="질문 듣기">🔊</button>
            </div>
            <div class="question-copy">
              <div class="question-main-line"><strong title="${q}">${qKoMatch || q}</strong></div>
              ${qNatural ? `<div class="question-ordered">${qNatural}</div>` : ''}
            </div>
          </div>
          ${showAnswer ? `<div class="question-cell question-a-cell">
            <button type="button" class="question-speaker" data-question-speak="${sourceIndex}" data-question-part="answer" aria-label="답변 듣기">🔊</button>
            <div class="question-copy">
              <div class="question-main-line"><span title="${a}">${aKoMatch || a}</span></div>
              ${aNatural ? `<div class="question-ordered">${aNatural}</div>` : ''}
            </div>
          </div>` : ''}
          ${showStudent ? `<div class="question-cell question-student-cell">
            <button type="button" class="question-speaker" data-question-speak="${sourceIndex}" data-question-part="student" aria-label="학생답변 듣기" ${student ? '' : 'disabled'}>🔊</button>
            <input type="text" data-question-student-answer="${sourceIndex}" value="${student}" placeholder="학생답변" autocomplete="off" />
          </div>` : ''}
        </article>`;
      }).join('')}</div>
    </div>`;
  }

  function blankWidgetBodyHtml() {
    return `<div class="widget-empty-blank" aria-hidden="true"></div>`;
  }

  function toolWidgetIframeHtml(src, title) {
    return `<div class="widget-tool-frame"><iframe src="${src}" title="${escapeHtml(title)}" allow="microphone; clipboard-write"></iframe></div>`;
  }
  // 학생이 직접 볼 때 자기 담당 선생님 이메일이 필요한데, 학생 role로는 로스터를 안 불러오므로
  // (ensureRoster()는 학생이면 skip) 여기서만 따로, 한 번 가져와서 캐싱.
  function ensureMyTeacherEmail() {
    if (state.user?.role !== 'student' || state.curriculum.myTeacher || state._myTeacherFetching || !window.CurriculumStore) return;
    state._myTeacherFetching = true;
    CurriculumStore.getRoster().then(r => {
      state.curriculum.myTeacher = r?.teacher || '';
    }).catch(() => {}).finally(() => {
      state._myTeacherFetching = false;
      refreshDialogueWidgetBody();
    });
  }

  // 지금 화면의 "대상 학생"을 (선생님이메일, 학생이메일, 이름)으로 정리 — 대화방 키, 판서 캡처함 등
  // 학생 단위로 나뉘어야 하는 기능들이 공유하는 기준. 학생 본인이면 자기 자신+담당 선생님, 선생님/
  // 관리자면 커리큘럼 위젯에서 선택된 학생. 학생 문맥이 아예 없으면(예: 커리큘럼 위젯도 안 열려
  // 있는 선생님 화면) null.
  function curStudentPairInfo() {
    let studentEmail = '', teacherEmail = '', name = '';
    if (curriculumIsStudent()) {
      studentEmail = state.user?.email || '';
      teacherEmail = state.curriculum.myTeacher || '';
      name = state.user?.name || '';
      ensureMyTeacherEmail();
    } else {
      // curriculumProgressStudent()는 "강의실(커리큘럼) 위젯이 열려 있어야" 학생을 찾는데,
      // 대화 위젯만 따로 열었을 때도(강의실 위젯을 안 열었어도) 같은 학생 방으로 들어가야
      // 하므로 curriculumCurrentStudent()로 바로 찾는다 — 안 그러면 매번 공용 임시방(초기 상태)으로
      // 빠져서 그동안 나눈 대화가 안 보이는 것처럼 보인다.
      const email = curriculumCurrentStudent();
      if (email) {
        studentEmail = email;
        teacherEmail = state.user?.email || '';
        name = (state.curriculum.roster?.students || []).find(x => x.email === email)?.name || email;
      }
    }
    if (!studentEmail) return null;
    return { teacherEmail, studentEmail, name };
  }
  function curSafeKeyPart(v) {
    return String(v || 'x').toLowerCase().replace(/[^a-z0-9.@_-]+/g, '_');
  }
  // curStudentPairInfo()와 같은 모양이지만, "커리큘럼 위젯이 열려 있어야"(curriculumProgressStudent)
  // 하는 제약이 없다 — 회차(세션) 단위 기능(대화방·판서 캡처)은 위젯 패널이든 전체 강의실 보드
  // 페이지("← 목록" 화면)든 이미 특정 학생의 보드를 렌더링하는 중에만 호출되므로,
  // curriculumCurrentStudent()로 바로 판별해도 안전하다. (버그: 전체 보드 페이지에서는 위젯이
  // 안 열려 있어서 curStudentPairInfo가 null을 반환해 대화/판서가 빈 상태로 보이던 문제 수정.)
  function curSessionStudentPairInfo() {
    let studentEmail = '', teacherEmail = '', name = '';
    if (curriculumIsStudent()) {
      studentEmail = state.user?.email || '';
      teacherEmail = state.curriculum.myTeacher || '';
      name = state.user?.name || '';
      ensureMyTeacherEmail();
    } else {
      studentEmail = curriculumCurrentStudent() || '';
      teacherEmail = state.user?.email || '';
      const s = (state.curriculum.roster?.students || []).find(x => x.email === studentEmail);
      name = s?.name || studentEmail;
    }
    if (!studentEmail) return null;
    return { teacherEmail, studentEmail, name };
  }

  // 대화방은 "선생님-학생-날짜" 기준으로 결정된다: 학생이 바뀌거나(선생/관리자가 다른 학생 선택,
  // 또는 시뮬레이션 계정 전환) 날짜가 바뀌면 다른 방(=새 대화창)이 뜬다. 학생 문맥이 없으면(예:
  // 커리큘럼 위젯도 안 열려 있는 선생님) 특정 대상이 없으니 공용 방으로 둔다.
  // 방 ID는 항상 "선생님ID-학생ID-날짜" 형식이어야 한다 — 학생이 정해지지 않았으면
  // 아무 의미 없는 공용 방을 대신 쓰지 않고 null을 돌려줘서, 호출부가 "학생을 먼저 선택하세요"
  // 안내를 보여주게 한다.
  function curDialogueRoomInfo() {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const pair = curStudentPairInfo();
    if (!pair) return null;
    return { room: `koredu-${curSafeKeyPart(pair.teacherEmail)}-${curSafeKeyPart(pair.studentEmail)}-${dateStr}`, name: pair.name };
  }

  // 회차(강의실) 안의 "대화" 탭 전용 — 위젯의 대화(실시간 채팅)를 그대로 쓰되, 오늘 날짜가 아니라
  // 그 회차가 열린(저장된) 날짜로 방을 잡는다. 지난 회차를 펼치면 그날 나눈 대화가 그대로 보인다.
  function curSessionDateOf(sessionId) {
    return (state.curriculum.board?.sessions || []).find(s => s.id === sessionId)?.date || '';
  }
  function curSessionDialogueRoomInfo(sessionId) {
    const pair = curSessionStudentPairInfo();
    const date = curSessionDateOf(sessionId);
    if (!pair || !date) return null;
    return { room: `koredu-${curSafeKeyPart(pair.teacherEmail)}-${curSafeKeyPart(pair.studentEmail)}-${date}`, name: pair.name };
  }
  // 회차 "대화" 탭 본문 — 그 회차 날짜 방으로 실제 대화(Tool/01Chatting) iframe을 띄운다.
  // 학생/날짜 문맥이 없으면(있을 수 없는 경우지만 방어적으로) 예전처럼 텍스트 메모로 대체.
  function curSessionTalkBodyHtml(sessionId) {
    const info = curSessionDialogueRoomInfo(sessionId);
    if (!info) {
      const canM = state.curriculum.canManage;
      return `<div class="hw-embed-body cur-talk-wrap">
        <textarea class="cur-talk" data-cur-note="${escapeHtml(sessionId)}|talk" placeholder="수업 대화 기록" ${canM ? '' : 'readonly'}></textarea>
      </div>`;
    }
    // (대화 위젯과 같은 이유) 콘텐츠 등급용 previewContext().role 대신 teacher/student만 구분.
    const chatRole = curriculumIsStudent() ? 'student' : 'teacher';
    const q = new URLSearchParams({ embed: '1', role: chatRole, name: info.name || state.user?.name || '', room: info.room }).toString();
    return `<div class="hw-embed-body cur-talk-wrap">${toolWidgetIframeHtml(`/Tool/01Chatting/web/index.html?${q}`, '대화 기록')}</div>`;
  }

  function dialogueWidgetBodyHtml() {
    const info = curDialogueRoomInfo();
    state._dialogueRoom = info?.room || '';
    if (!info) return `<div class="widget-empty"><strong>대화</strong><p>강의실 위젯에서 학생을 먼저 선택하세요.</p></div>`;
    // previewContext().role은 콘텐츠 열람 등급 미리보기용이라 admin이면 항상 'admin'을 내려준다.
    // 대화 채팅창은 teacher/student 둘만 구분하므로, admin이 관리자로서 열어도 여기선 '선생님'으로
    // 취급해야 한다 — 안 그러면 admin이 열 때마다 자기 자신이 '학생'으로 잘못 표시된다.
    const chatRole = curriculumIsStudent() ? 'student' : 'teacher';
    const q = new URLSearchParams({
      embed: '1', role: chatRole,
      name: info.name || state.user?.name || '',
      room: info.room,
    }).toString();
    return toolWidgetIframeHtml(`/Tool/01Chatting/web/index.html?${q}`, '대화 (번역 채팅)');
  }

  // 학생/날짜 기준(방)이 실제로 바뀌었을 때만 대화창을 새로 띄운다 (그대로면 입력 중이던 대화 유지).
  function refreshDialogueWidgetBody() {
    if (!state.widgetMulti.includes('dialogue')) return;
    const info = curDialogueRoomInfo();
    if ((info?.room || '') === state._dialogueRoom) return;
    const bodyEl = widgetMultiGrid?.querySelector('[data-widget-panel="dialogue"] .widget-panel-body');
    if (bodyEl) bodyEl.innerHTML = dialogueWidgetBodyHtml();
  }
  // W16 메모: 강의실 회차의 "메모"(학생/선생님 Q·A 칸)를 그대로 재사용 — 지금(마지막/편집 중) 회차 것.
  function memoWidgetBodyHtml() {
    const student = curriculumCurrentStudent();
    if (!student) return `<div class="widget-empty"><strong>메모</strong><p>강의실 위젯에서 학생을 먼저 선택하세요.</p></div>`;
    const sessionId = siCurrentSessionId();
    const sess = (state.curriculum.board?.sessions || []).find(s => s.id === sessionId);
    if (!sess) return `<div class="widget-empty"><strong>메모</strong><p>강의실에서 회차를 먼저 만들어 주세요.</p></div>`;
    return `<div class="wg-memo-body">${curQABodyHtml(sess.id, sess.notes || {})}</div>`;
  }
  function refreshMemoWidgetBody() {
    if (!state.widgetMulti.includes('memo')) return;
    const bodyEl = widgetMultiGrid?.querySelector('[data-widget-panel="memo"] .widget-panel-body');
    if (bodyEl) bodyEl.innerHTML = memoWidgetBodyHtml();
  }
  // 판서 캡처 배경 합성: 영상목록/강의목록 iframe(localhost:8120/8121)은 포털과 다른 오리진이라
  // html2canvas가 그 안을 못 그린다(README의 <iframe> 한계). 그 iframe들에게 postMessage로
  // "네 화면 찍어서 보내줘" 요청해 받은 스냅샷을, 나머지 배경(html2canvas) 위에 직접 합성한다.
  // 상대편 iframe 문서 쪽 리스너는 VideoScript/index.html·Textbook/KorLecture/index.html 에 있다.
  let _siSnapSeq = 0;
  function siRequestIframeSnapshot(iframe, timeoutMs) {
    return new Promise((resolve) => {
      let targetOrigin;
      try { targetOrigin = new URL(iframe.src, location.href).origin; } catch (_) { resolve(null); return; }
      const requestId = 'si' + (++_siSnapSeq) + '_' + Date.now();
      let done = false;
      const onMsg = (e) => {
        if (e.origin !== targetOrigin) return;
        const d = e.data;
        if (!d || d.type !== 'screenink:capture-response' || d.requestId !== requestId) return;
        done = true;
        window.removeEventListener('message', onMsg);
        resolve(d.dataUrl || null);
      };
      window.addEventListener('message', onMsg);
      try { iframe.contentWindow.postMessage({ type: 'screenink:capture-request', requestId }, targetOrigin); }
      catch (_) { window.removeEventListener('message', onMsg); resolve(null); return; }
      setTimeout(() => { if (!done) { window.removeEventListener('message', onMsg); resolve(null); } }, timeoutMs);
    });
  }
  function siLoadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  async function siCaptureBackground(rect) {
    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(rect.w * dpr));
    canvas.height = Math.max(1, Math.round(rect.h * dpr));
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.w, rect.h);
    if (typeof window.html2canvas === 'function') {
      try {
        const base = await window.html2canvas(document.body, {
          x: window.scrollX + rect.x, y: window.scrollY + rect.y,
          width: rect.w, height: rect.h, scale: dpr,
          backgroundColor: '#ffffff', useCORS: true, logging: false,
        });
        ctx.drawImage(base, 0, 0, rect.w, rect.h);
      } catch (_) {}
    }
    // 다른 오리진 iframe(위 html2canvas가 못 채운 영역)만 따로 요청해서 덮어 그린다.
    // moduleFrame = 왼쪽 메인 콘텐츠(영상 플레이어·강의 본문), .widget-tool-frame iframe = 옆 위젯 패널들.
    const candidates = [moduleFrame, ...document.querySelectorAll('.widget-tool-frame iframe')].filter(Boolean);
    const iframes = candidates.filter(ifr => {
      try { return ifr.src && !ifr.hidden && new URL(ifr.src, location.href).origin !== location.origin; }
      catch (_) { return false; }
    });
    await Promise.all(iframes.map(async (ifr) => {
      const box = ifr.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) return;
      if (box.right <= rect.x || box.left >= rect.x + rect.w || box.bottom <= rect.y || box.top >= rect.y + rect.h) return;
      try {
        const dataUrl = await siRequestIframeSnapshot(ifr, 4000);   // 강의 본문처럼 무거운 페이지 감안
        if (!dataUrl) return;
        const img = await siLoadImage(dataUrl);
        ctx.drawImage(img, box.left - rect.x, box.top - rect.y, box.width, box.height);
      } catch (_) {}
    }));
    return canvas;
  }
  // ── 판서(ScreenInk) 캡처 저장 목록 — 서버 저장, 학생·회차별로 여러 장 ──
  // 캡처하는 순간 서버(학생+회차)에 쌓이고, 목록을 펼치면 순서대로 나열된다.
  // 학생 쪽에서도(나중에 강의실 판서 탭이 같은 저장소를 보게 되면) 같은 목록을 보게 된다.
  let _siCaptureCache = [];   // 마지막으로 받아온 목록(동기 렌더용 캐시) — fetch가 끝나면 갱신 후 재렌더
  let _siCaptureCtx = null;   // { studentEmail, sessionId } — 캐시가 어느 학생/회차 것인지
  let _siGallerySelected = new Set();   // 체크박스로 고른 캡처 id들 — "전체보기" 새 탭에 뭘 넣을지
  // 지금 판서를 붙일 "대상 회차": 편집 중인 회차(activeReview)가 있으면 그걸, 없으면 그 학생의 마지막 회차.
  function siCurrentSessionId() {
    const c = state.curriculum;
    if (c.activeReview) return c.activeReview;
    const sessions = c.board?.sessions || [];
    // 강의실에서 특정 회차의 유튜브/강의를 눌러서 들어온 경우, 그 회차를 최우선으로 쓴다
    // (그 회차가 아직 실제로 존재할 때만 — 목록이 바뀌었으면 예전 기억은 버린다).
    if (c.activeSessionId && sessions.some(s => s.id === c.activeSessionId)) return c.activeSessionId;
    return sessions.length ? sessions[sessions.length - 1].id : '';
  }
  function siCaptureContext() {
    const pair = curSessionStudentPairInfo();
    const sessionId = siCurrentSessionId();
    if (!pair || !sessionId) return null;
    return { studentEmail: pair.studentEmail, sessionId };
  }
  async function siFetchCaptures() {
    const ctx = siCaptureContext();
    if (!ctx || !window.CurriculumStore) { _siCaptureCache = []; _siCaptureCtx = null; return; }
    try {
      const r = await CurriculumStore.getBoardCaptures(ctx.studentEmail, ctx.sessionId);
      _siCaptureCache = r.items || [];
      _siCaptureCtx = ctx;
    } catch (e) { console.warn('판서 목록 불러오기 실패', e); _siCaptureCache = []; _siCaptureCtx = ctx; }
    // 지워졌거나 더는 없는 항목의 체크 상태는 정리(다른 사람이 지웠을 수도 있음).
    const live = new Set(_siCaptureCache.map(x => x.id));
    [..._siGallerySelected].forEach(id => { if (!live.has(id)) _siGallerySelected.delete(id); });
  }
  async function siAddCapture(dataUrl) {
    const ctx = siCaptureContext();
    if (!ctx) { message('학생/회차 정보가 없어 판서를 저장하지 못했습니다. (강의실 위젯에서 학생을 먼저 선택하세요)', 'error'); return; }
    try {
      await CurriculumStore.addBoardCapture(ctx.studentEmail, ctx.sessionId, dataUrl);
      await siFetchCaptures();
      await refreshBoardCaptureViews(ctx.sessionId);   // 위젯 목록 + 강의실 인라인 갤러리 전부 같이 갱신
    } catch (e) { message('판서 저장 실패: ' + e.message, 'error'); }
  }
  async function siDeleteCapture(id) {
    const ctx = siCaptureContext();
    if (!ctx) return;
    try {
      await CurriculumStore.deleteBoardCapture(ctx.studentEmail, ctx.sessionId, id);
      await siFetchCaptures();
      await refreshBoardCaptureViews(ctx.sessionId);
    } catch (e) { message('판서 삭제 실패: ' + e.message, 'error'); }
  }
  async function siDeleteCapturesBulk(ids) {
    const ctx = siCaptureContext();
    if (!ctx || !ids.length) return;
    try {
      for (const id of ids) { await CurriculumStore.deleteBoardCapture(ctx.studentEmail, ctx.sessionId, id); }
      _siGallerySelected.clear();
      await siFetchCaptures();
      await refreshBoardCaptureViews(ctx.sessionId);
    } catch (e) { message('판서 삭제 실패: ' + e.message, 'error'); }
  }
  function siBlobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }
  function siGalleryPanelHtml() {
    if (!siCaptureContext()) return `<div class="si-gallery-empty">강의실 위젯에서 학생을 먼저 선택하세요.</div>`;
    if (!_siCaptureCache.length) return `<div class="si-gallery-empty">캡처하면 여기 회차별로 순서대로 쌓입니다.</div>`;
    const studentEmail = _siCaptureCtx?.studentEmail || '';
    const items = _siCaptureCache.map((it, i) => {
      // 라벨 자체가 "선생님-학생-날짜-시간" 이라 누가 찍었는지(교사든 학생이든) 그대로 기록·표시된다.
      const label = curBoardCaptureLabel(it, studentEmail);
      const checked = _siGallerySelected.has(it.id) ? ' checked' : '';
      return `<div class="si-gallery-item">
        <label class="si-gallery-checkwrap"><input type="checkbox" data-si-gallery-check="${escapeHtml(it.id)}"${checked}></label>
        <button type="button" class="si-gallery-view" data-si-gallery-view="${escapeHtml(it.id)}" title="${escapeHtml(label)}">
          <img src="${it.image}" alt="판서 ${label}"><span>${i + 1}</span>
        </button>
        <span class="si-gallery-cap" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
        <button type="button" class="si-gallery-del" data-si-gallery-del="${escapeHtml(it.id)}" title="이 판서 삭제">×</button>
      </div>`;
    }).join('');
    return `<div class="si-gallery-grid">${items}</div>`;
  }
  // 헤더 "전체" 체크박스: 하나도 안 골랐으면 빈 상태, 다 골랐으면 체크, 일부만 골랐으면 반체크.
  function siSyncGalleryCheckAll() {
    const all = document.getElementById('siGalleryCheckAll');
    if (!all) return;
    const n = _siCaptureCache.length, k = _siGallerySelected.size;
    all.checked = n > 0 && k === n;
    all.indeterminate = k > 0 && k < n;
  }
  // "전체보기" — 체크한 것만 순서대로 한 페이지에 쭉 담아 새 탭에 연다(패널을 열면 기본적으로
  // 전부 체크된 상태로 시작하니, 일부만 보고 싶으면 체크를 해제하면 된다).
  // 전부 <img>로 넣는 문서라, 낱장 보기 때와 달리 data: URL 새 탭 차단에도 안 걸린다.
  function siOpenGalleryFull() {
    const items = _siCaptureCache.filter(x => _siGallerySelected.has(x.id));
    if (!items.length) { message('체크한 판서가 없습니다.', 'error'); return; }
    const studentEmail = _siCaptureCtx?.studentEmail || '';
    const title = escapeHtml(siGalleryHeaderLabel());
    const sections = items.map((it, i) => {
      const label = escapeHtml(curBoardCaptureLabel(it, studentEmail));
      return `<section><h2>${i + 1}. ${label}</h2><img src="${it.image}" alt="${label}"></section>`;
    }).join('');
    const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${title} 판서 전체보기</title>
      <style>body{margin:0;background:#f4f6f9;font-family:system-ui,"Malgun Gothic",sans-serif}
      h1{padding:14px 20px;margin:0;font-size:15px;background:#fff;border-bottom:1px solid #e2e6ec;position:sticky;top:0}
      section{padding:14px 20px 0}h2{font-size:12px;font-weight:800;color:#5a6473;margin:0 0 6px}
      img{max-width:100%;display:block;border:1px solid #e2e6ec;border-radius:8px;background:#fff}</style></head>
      <body><h1>${title} · 판서 전체보기 (${items.length}장)</h1>${sections}</body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.open(); win.document.write(html); win.document.close(); }
  }
  // 헤더에 "이 목록이 어느 학생·회차 것인지"(=저장 단위 ID)를 보여준다.
  function siGalleryHeaderLabel() {
    const ctx = _siCaptureCtx || siCaptureContext();
    if (!ctx) return '판서 목록';
    const roster = state.curriculum.roster?.students || [];
    const stu = roster.find(s => s.email === ctx.studentEmail);
    const name = stu?.name || (ctx.studentEmail || '').split('@')[0] || '학생';
    const sess = (state.curriculum.board?.sessions || []).find(s => s.id === ctx.sessionId);
    const dateStr = sess?.date ? String(sess.date).slice(2).replace(/-/g, '.') : '';
    return dateStr ? `${name}-${dateStr}` : name;
  }
  // 판서 도구막대(.si-bar, Shadow DOM 안)에 "판서 목록" 버튼을 직접 끼워 넣는다. 예전엔 별도
  // 요소(#siGalleryHost)로 띄워서, 도구막대가 접히면(판서 시작 상태) 같이 안 접혀 혼자 떨어져 보였다.
  // .si-row 의 자식으로 넣으면 .si-collapsed 규칙을 그대로 받아 도구막대와 같이 접히고 펴진다.
  function siEnsureGalleryButton() {
    const bar = _screenInk && _screenInk.bar;
    const row = bar && bar.querySelector ? bar.querySelector('.si-row') : null;
    if (!row) return null;
    let btn = row.querySelector('#siGalleryBtn');
    if (btn) return btn;
    // 이 버튼은 ScreenInk의 Shadow DOM 안에 들어가서 portal.css가 안 먹는다 — 배지(빨간 동그라미
    // 숫자) 스타일만 그 shadow root 안에 직접 style 태그로 주입해둔다(한 번만).
    if (_screenInk.root && !_screenInk.root.getElementById?.('siGalleryBadgeCss')) {
      const css = document.createElement('style');
      css.id = 'siGalleryBadgeCss';
      css.textContent = '#siGalleryBtn{position:relative}#siGalleryCount:not(:empty){position:absolute;top:-6px;right:-6px;' +
        'background:#e0483b;color:#fff;font-style:normal;font-size:9px;font-weight:800;line-height:1;' +
        'padding:1px 4px;border-radius:999px;min-width:14px;text-align:center}';
      _screenInk.root.appendChild(css);
    }
    btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'siGalleryBtn';
    btn.className = 'si-btn';
    btn.title = '판서 저장 목록';
    btn.innerHTML = '🖼<i id="siGalleryCount"></i>';
    // Shadow DOM 안 요소라 document 위임 클릭으로는 못 잡는다(이벤트가 host로 재타깃됨) — 직접 건다.
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const panel = document.getElementById('siGalleryPanel');
      if (!panel) return;
      panel.hidden = !panel.hidden;
      if (!panel.hidden) {
        siPositionGalleryPanel();
        await siFetchCaptures();
        _siGallerySelected = new Set(_siCaptureCache.map(x => x.id));   // 열면 기본적으로 전체 선택
        const head = document.getElementById('siGalleryHeadLabel');
        if (head) head.textContent = siGalleryHeaderLabel();
        const body = document.getElementById('siGalleryBody');
        if (body) body.innerHTML = siGalleryPanelHtml();
        siSyncGalleryCheckAll();
      }
    });
    const toggleBtn = row.querySelector('.si-toggle');
    row.insertBefore(btn, toggleBtn || null);
    return btn;
  }
  function siRefreshGalleryBadge() {
    const badge = document.getElementById('siGalleryCount');
    if (badge) badge.textContent = _siCaptureCache.length ? String(_siCaptureCache.length) : '';
  }
  // 목록 패널은 버튼과 달리 계속 body 에 떠 있는 일반 DOM(그래야 지우기·보기 클릭이 기존 위임으로 잡힘).
  // 도구막대(.si-bar)는 이미 항상 화면 안에 있으니, 패널의 좌우 끝을 도구막대의 좌우 끝에
  // 그대로 맞춘다 — 따로 화면 밖 안 나가게 계산할 필요가 없어진다.
  function siPositionGalleryPanel() {
    const panel = document.getElementById('siGalleryPanel');
    const bar = _screenInk && _screenInk.bar;
    if (!panel || !bar) return;
    const rect = bar.getBoundingClientRect();
    if (!rect.width) return;
    panel.style.left = `${Math.round(rect.left)}px`;
    panel.style.width = `${Math.round(rect.width)}px`;
    panel.style.right = 'auto';
    const top = Math.round(rect.bottom + 6);
    panel.style.top = `${top}px`;
    panel.style.maxHeight = `${Math.max(120, Math.round(window.innerHeight - top - 12))}px`;
  }
  window.addEventListener('resize', () => {
    const panel = document.getElementById('siGalleryPanel');
    if (panel && !panel.hidden) siPositionGalleryPanel();
  });
  function renderScreenInkGalleryUI() {
    if (!document.getElementById('siGalleryPanel')) {
      const panel = document.createElement('div');
      panel.id = 'siGalleryPanel';
      panel.className = 'si-gallery-panel';
      panel.hidden = true;
      panel.innerHTML = `<div class="si-gallery-head">
          <label class="si-gallery-all" title="전체 선택/해제"><input type="checkbox" id="siGalleryCheckAll" data-si-gallery-check-all> 전체</label>
          <span id="siGalleryHeadLabel">판서 목록</span>
          <button type="button" class="si-gallery-refresh" data-si-gallery-refresh title="지금 다시 불러오기(상대가 방금 저장했을 때)">↻</button>
          <button type="button" class="si-gallery-viewall" data-si-gallery-viewall title="체크한 판서를 순서대로 새 탭에">전체보기</button>
          <button type="button" class="si-gallery-delsel" data-si-gallery-delsel title="체크한 판서 한꺼번에 삭제">🗑</button>
          <button type="button" class="si-gallery-close" data-si-gallery-close title="닫기">×</button>
        </div>
          <div id="siGalleryBody"></div>`;
      document.body.appendChild(panel);
    }
    siEnsureGalleryButton();
    siRefreshGalleryBadge();
  }
  function refreshScreenInkGallery() {
    siRefreshGalleryBadge();
    const panel = document.getElementById('siGalleryPanel');
    const head = document.getElementById('siGalleryHeadLabel');
    if (head) head.textContent = siGalleryHeaderLabel();
    const body = document.getElementById('siGalleryBody');
    if (body && panel && !panel.hidden) body.innerHTML = siGalleryPanelHtml();
    siSyncGalleryCheckAll();
    // 배지 숫자가 바뀌면 버튼 폭도 미세하게 바뀔 수 있어 매번 다시 옆에 붙인다(화면 밖 방지 포함).
    if (panel && !panel.hidden) siPositionGalleryPanel();
  }
  // 판서를 켜둔 동안 목록을 주기적으로 다시 불러온다 — 내가 저장한 걸 상대(교사↔학생)가 이미
  // 판서를 켜놓고 보고 있었다면, 새로고침 없이도 곧 같이 보이게 하려는 것.
  let _siGalleryPollTimer = null;
  function siStartGalleryPoll() {
    if (_siGalleryPollTimer) return;
    _siGalleryPollTimer = setInterval(() => {
      if (!screenInkOn()) return;
      siFetchCaptures().then(refreshScreenInkGallery);
    }, 8000);
  }
  function siStopGalleryPoll() {
    if (_siGalleryPollTimer) { clearInterval(_siGalleryPollTimer); _siGalleryPollTimer = null; }
  }
  function syncScreenInkGalleryVisibility() {
    const on = screenInkOn();
    if (on) renderScreenInkGalleryUI();
    if (on) { siFetchCaptures().then(refreshScreenInkGallery); siStartGalleryPoll(); }
    else { const panel = document.getElementById('siGalleryPanel'); if (panel) panel.hidden = true; siStopGalleryPoll(); }
  }
  document.addEventListener('change', e => {
    const cb = e.target.closest('[data-si-gallery-check]');
    if (cb) {
      const id = cb.dataset.siGalleryCheck;
      if (cb.checked) _siGallerySelected.add(id); else _siGallerySelected.delete(id);
      siSyncGalleryCheckAll();
      return;
    }
    const all = e.target.closest('[data-si-gallery-check-all]');
    if (all) {
      _siGallerySelected.clear();
      if (all.checked) _siCaptureCache.forEach(x => _siGallerySelected.add(x.id));
      const body = document.getElementById('siGalleryBody');
      if (body) body.innerHTML = siGalleryPanelHtml();
      return;
    }
  });
  document.addEventListener('click', async e => {
    const refreshBtn = e.target.closest('[data-si-gallery-refresh]');
    if (refreshBtn) {
      refreshBtn.classList.add('spin');
      await siFetchCaptures();
      refreshScreenInkGallery();
      refreshBtn.classList.remove('spin');
      return;
    }
    if (e.target.closest('[data-si-gallery-viewall]')) { siOpenGalleryFull(); return; }
    if (e.target.closest('[data-si-gallery-delsel]')) {
      const ids = [..._siGallerySelected];
      if (!ids.length) { message('먼저 삭제할 판서를 체크하세요.', 'error'); return; }
      if (!confirm(`체크한 판서 ${ids.length}개를 삭제할까요?`)) return;
      await siDeleteCapturesBulk(ids);
      return;
    }
    if (e.target.closest('[data-si-gallery-close]')) {
      const panel = document.getElementById('siGalleryPanel');
      if (panel) panel.hidden = true;
      return;
    }
    const viewBtn = e.target.closest('[data-si-gallery-view]');
    if (viewBtn) {
      const item = _siCaptureCache.find(x => x.id === viewBtn.dataset.siGalleryView);
      if (item && item.image) {
        // item.image는 data: URL(긴 base64)인데, 크롬은 새 탭을 data: URL로 직접 여는 걸
        // 막아서 빈 탭만 뜨고 그림이 안 나왔다 — blob URL로 바꿔서 그 탭에 넣어준다.
        // window.open은 클릭 직후(await 전에) 바로 호출해야 팝업 차단에 안 걸린다.
        const win = window.open('', '_blank');
        (async () => {
          try {
            const blob = await (await fetch(item.image)).blob();
            const url = URL.createObjectURL(blob);
            if (win) { win.location.href = url; setTimeout(() => URL.revokeObjectURL(url), 60000); }
          } catch (_) { if (win) win.location.href = item.image; }
        })();
      }
      return;
    }
    const delBtn = e.target.closest('[data-si-gallery-del]');
    if (delBtn) {
      if (!confirm('이 판서를 삭제할까요?')) return;
      await siDeleteCapture(delBtn.dataset.siGalleryDel);
      return;
    }
  });

  // 판서 = 화면 전체 필기 오버레이 (ScreenInk). 위젯 패널이 아니라 토글.
  let _screenInk = null;
  function ensureScreenInk() {
    if (_screenInk) return _screenInk;
    if (typeof ScreenInk !== 'function') { message('판서 모듈을 불러오지 못했습니다. (새로고침 필요)', 'error'); return null; }
    _screenInk = new ScreenInk({
      output: { clipboard: true, download: true, callback: true },
      onCapture: async (blob) => {
        try { await siAddCapture(await siBlobToDataUrl(blob)); } catch (e) { console.warn('판서 저장 실패', e); }
      },
      toolbarPosition: { top: 18, right: 14 },   // 로그아웃 있는 헤더 행의 제일 오른쪽 구석
      rememberPosition: false,                   // 드래그해도 새로고침하면 이 자리로 고정
      background: siCaptureBackground,           // 영상목록/강의목록(다른 오리진) iframe까지 합성
      // 칠판 버튼으로 접으면(판서 시작 상태) 목록 버튼도 도구막대 안에 있으니 같이 접혀 사라진다 —
      // 그때 목록 패널이 열려 있으면 트리거를 잃은 채 붕 뜨니 닫아준다.
      onModeChange: (mode) => { if (mode !== 'draw') { const p = document.getElementById('siGalleryPanel'); if (p) p.hidden = true; } },
      // 칠판 버튼을 드래그해서 도구막대를 옮겼을 때 — 저장 목록 창이 열려 있으면 그 옆으로 다시 붙인다.
      onMove: () => { const p = document.getElementById('siGalleryPanel'); if (p && !p.hidden) siPositionGalleryPanel(); },
      // 판서 적용 범위 = 헤더 아래 ~ 뷰포트 하단, 왼쪽끝 ~ 위젯 레일 앞. 이 박스 밖은 원래 마우스 동작.
      region: () => {
        const hdr = document.querySelector('.site-header');
        const sub = document.querySelector('.sub-nav, .secondary-nav, #subNav');
        const rail = document.querySelector('.widget-rail');
        let top = hdr ? hdr.getBoundingClientRect().bottom : 0;
        if (sub && !sub.hidden && sub.getBoundingClientRect().bottom > top) top = sub.getBoundingClientRect().bottom;
        const railLeft = (rail && !rail.hidden && rail.getBoundingClientRect().width)
          ? rail.getBoundingClientRect().left : window.innerWidth;
        return { left: 0, top, width: Math.max(1, railLeft), height: Math.max(1, window.innerHeight - top) };
      },
    });
    return _screenInk;
  }
  // 판서를 켤 때 커리큘럼 학생/회차 맥락이 아직 없으면(커리큘럼 위젯을 한 번도 안 연 상태) 미리 받아둔다.
  // 캡처는 그림을 다 그린 뒤에 일어나므로 이 정도 지연은 보통 캡처 전에 끝난다.
  function ensureBoardCaptureContext() {
    ensureCurriculumContext();
  }
  function toggleScreenInk() {
    try {
      const wasNew = !_screenInk;
      const si = ensureScreenInk();
      if (!si) return;
      // hide()는 도구막대만 접고 그려둔 필기는 화면에 남겨둔다(칠판 버튼용 기본 동작) — 위젯 체크를
      // 꺼서 판서를 완전히 닫을 땐 그림까지 화면에서 사라져야 하니 껍데기(host) 자체를 숨긴다.
      // 필기 내용 자체는 안 지우니, 다시 켜면 그리던 게 그대로 돌아온다.
      if (!wasNew && screenInkOn()) { si.hide(); if (si.host) si.host.style.display = 'none'; }
      else { si.show(); ensureBoardCaptureContext(); }
    } catch (err) { message('판서를 열지 못했습니다: ' + (err.message || err), 'error'); }
    syncWidgetRail();
    syncScreenInkGalleryVisibility();
  }
  // 강의실 "판서 열기" 전용 — 이미 열려 있으면 그대로 두고(토글로 닫아버리지 않음), 닫혀 있을 때만 연다.
  function openScreenInk() {
    try {
      const si = ensureScreenInk();
      if (!si) return;
      if (!(si.isOpen && si.isOpen())) { si.show(); ensureBoardCaptureContext(); }
    } catch (err) { message('판서를 열지 못했습니다: ' + (err.message || err), 'error'); }
    syncWidgetRail();
    syncScreenInkGalleryVisibility();
  }
  // "켜짐" = 도구막대(호스트)가 화면에 떠 있는지 여부. 그림 모드(draw) 중인지가 아니다 —
  // 그림 모드를 벗어나도(패스 모드) 호스트는 원래 계속 떠 있게 설계돼 있어서, isOpen()만 보면
  // 위젯 체크는 꺼졌는데 화면엔 "판서 시작" 버튼이 그대로 남는 문제가 있었다.
  function screenInkOn() {
    try { return !!(_screenInk && _screenInk.host && _screenInk.host.style.display !== 'none'); } catch (_) { return false; }
  }
  function writingWidgetBodyHtml() {
    return toolWidgetIframeHtml('/Tool/04WritingTest/index.html', '쓰기 (한글 학습지)');
  }
  function hangeul1WidgetBodyHtml() {
    return toolWidgetIframeHtml('/Tool/05-1Hangeul/index.html', '한글1');
  }
  function hangeul2WidgetBodyHtml() {
    return toolWidgetIframeHtml('/Tool/05-2Hangeul/index.html', '한글2');
  }
  function lecturelistWidgetBodyHtml() {
    const ctx = previewContext();
    return toolWidgetIframeHtml(`${MODULE_ORIGINS.lecture}/?embed=1&role=${ctx.role}&level=${ctx.level || 1}`, '강의 목록');
  }
  function videolistWidgetBodyHtml() {
    const ctx = previewContext();
    return toolWidgetIframeHtml(`${MODULE_ORIGINS.youtube}/?embed=1&role=${ctx.role}&level=${ctx.level || 1}`, '영상 목록');
  }

  function homeworkWidgetBodyHtml() {
    const hw = state.homework || (state.homework = homeworkDefault());
    const ref = hwRef();
    if (!ref) {
      return `<div class="widget-empty"><strong>복습</strong><p>학생을 선택하거나(담당 학생 없음) 회차를 먼저 만들면 학생 답안 이미지를 올려 첨삭할 수 있습니다.</p></div>`;
    }
    if (!hw.image) {
      return `<div class="hw-root">
        <label class="hw-drop" data-hw-drop>
          <strong>학생 답안 이미지를 놓거나 클릭</strong><br><span>PNG · JPG · WEBP</span>
          <input type="file" accept="image/*" data-hw-file hidden>
        </label>
      </div>`;
    }
    const comments = (hw.comments || []).map(c => {
      const id = escapeHtml(String(c.id));
      const x = Number(c.x) * 100;
      const maxW = Math.max(18, 97 - x);   // 페이지 오른쪽 끝에서 줄바꿈 (A4 너비)
      const bold = c.bold !== false;
      return `<div class="hw-cmt" data-hw-cmt="${id}" style="left:${x.toFixed(2)}%;top:${(Number(c.y) * 100).toFixed(2)}%;max-width:${maxW.toFixed(1)}%">
        <span class="hw-cmt-tools">
          <button type="button" class="hw-grip" data-hw-grip="${id}" title="이동">✥</button>
          <button type="button" class="hw-boldbtn${bold ? ' on' : ''}" data-hw-bold="${id}" title="굵기">B</button>
          <button type="button" data-hw-del="${id}" title="삭제">×</button>
        </span>
        <div class="hw-cmt-text" contenteditable="true" spellcheck="false" data-hw-text="${id}" style="color:${escapeHtml(c.color || hw.color)};font-weight:${bold ? 900 : 500}">${escapeHtml(c.text || '')}</div>
      </div>`;
    }).join('');
    return `<div class="hw-root" data-hw-ready>
      <div class="hw-scroll${hwClampZoom(hw.zoom) > 1.001 ? ' hw-zoomed' : ''}" data-hw-scroll>
        <div class="hw-stage" style="height:${(hwClampZoom(hw.zoom) * 100).toFixed(1)}%">
          <img src="${hw.image}" alt="학생 답안" data-hw-img draggable="false">
          <div class="hw-layer">${comments}</div>
          <div class="hw-resize" data-hw-resize title="끌어서 이미지 크기 조절">⤢</div>
        </div>
      </div>
      <div class="hw-hint">이미지 클릭 → 코멘트 · <b>✥</b>/Ctrl+드래그 이동 · <b>B</b> 굵기 · <b>×</b> 삭제 · <b>휠</b> 글자 크기</div>
    </div>`;
  }

  let hwResizeObserver = null;
  let hwDrag = null, hwDragMoved = false, hwFocusedId = null, hwWheelTimer = null;
  let hwHistory = [], hwFuture = [];  // 되돌리기 / 다시
  let hwEditSnap = null;              // 코멘트 편집 시작 시점 스냅샷(첫 타이핑에 커밋)
  let hwResizeDrag = null;

  function resetHomeworkRuntime() {
    hwHistory = []; hwFuture = [];
    hwFocusedId = null; hwEditSnap = null;
    hwDrag = null; hwResizeDrag = null; hwDragMoved = false;
  }

  function hwState() {
    return { image: state.homework.image, comments: JSON.parse(JSON.stringify(state.homework.comments || [])) };
  }
  function hwSnapshot() {
    hwHistory.push(hwState());
    if (hwHistory.length > 60) hwHistory.shift();
    hwFuture = [];
  }
  function hwApply(snap) {
    state.homework.image = snap.image;
    state.homework.comments = JSON.parse(JSON.stringify(snap.comments || []));
    persistHomework();
    refreshHomeworkWidgetBody();
  }
  function hwUndo() {
    if (!hwHistory.length) return;
    hwFuture.push(hwState());
    hwApply(hwHistory.pop());
  }
  function hwRedo() {
    if (!hwFuture.length) return;
    hwHistory.push(hwState());
    hwApply(hwFuture.pop());
  }

  function homeworkBodyEl() {
    if (state.homework?.embedded) {
      const em = document.querySelector('.hw-embed.is-active [data-hw-body]');
      if (em) return em;
    }
    return widgetMultiGrid?.querySelector('[data-widget-panel="homework"] .widget-panel-body')
      || widgetSingleStage?.querySelector('[data-widget-panel="homework"] .widget-panel-body');
  }
  function hydrateHomeworkWidget() {
    const bodyEl = homeworkBodyEl();
    const img = bodyEl?.querySelector('[data-hw-img]');
    if (window.ResizeObserver && img) {
      if (!hwResizeObserver) hwResizeObserver = new ResizeObserver(() => sizeHomeworkComments());
      hwResizeObserver.disconnect();
      hwResizeObserver.observe(img);
    }
    if (img && !(img.complete && img.naturalWidth)) img.addEventListener('load', sizeHomeworkComments, { once: true });
    sizeHomeworkStageSoon();
  }
  function refreshHomeworkWidgetBody() {
    const bodyEl = homeworkBodyEl();
    if (!bodyEl) return;
    bodyEl.innerHTML = homeworkWidgetBodyHtml();
    const headEl = state.homework?.embedded
      ? document.querySelector('.hw-embed.is-active [data-widget-header-tools="homework"]')
      : (widgetMultiGrid || document).querySelector('[data-widget-header-tools="homework"]');
    if (headEl) headEl.innerHTML = homeworkWidgetHeaderToolsHtml();
    hydrateHomeworkWidget();
  }
  // zoom 1 = 이미지가 창 높이를 꽉 채움(스크롤 없음). zoom>1 = 그보다 크게(스크롤).
  function sizeHomeworkStage() {
    const bodyEl = homeworkBodyEl();
    const stage = bodyEl?.querySelector('.hw-stage');
    const scroll = bodyEl?.querySelector('[data-hw-scroll]');
    if (!stage) return;
    const zoom = hwClampZoom(state.homework.zoom);
    stage.style.height = (zoom * 100).toFixed(1) + '%';
    if (scroll) scroll.classList.toggle('hw-zoomed', zoom > 1.001);
    sizeHomeworkComments();
  }
  function sizeHomeworkStageSoon() {
    requestAnimationFrame(sizeHomeworkStage);
    setTimeout(sizeHomeworkStage, 120);
  }
  function sizeHomeworkComments(_retry) {
    const bodyEl = homeworkBodyEl();
    const img = bodyEl?.querySelector('[data-hw-img]');
    if (!img) return;
    const w = img.clientWidth || img.naturalWidth || 0;
    if (w < 50) {   // 컨테이너/이미지가 아직 폭이 없음 → 잠시 후 재시도 (0px 글자 방지)
      if ((_retry || 0) < 20) setTimeout(() => sizeHomeworkComments((_retry || 0) + 1), 120);
      return;
    }
    bodyEl.querySelectorAll('.hw-cmt-text').forEach(t => {
      const c = homeworkComment(t.dataset.hwText);
      t.style.fontSize = (((c && c.size) || state.homework.size || 2.4) / 100 * w) + 'px';
    });
  }
  function loadHomeworkImageFile(file) {
    if (!file || !file.type || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const im = new Image();
      im.onload = () => {
        const maxDim = 1600;
        const scale = Math.min(1, maxDim / Math.max(im.naturalWidth, im.naturalHeight));
        const w = Math.round(im.naturalWidth * scale), h = Math.round(im.naturalHeight * scale);
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h);
        let url = cv.toDataURL('image/webp', 0.85);
        if (!url.startsWith('data:image/webp')) url = cv.toDataURL('image/jpeg', 0.85);
        hwSnapshot();
        state.homework.image = url;
        state.homework.comments = [];
        state.homework.zoom = 1;
        persistHomework();
        if (state.homework._quota) { delete state.homework._quota; alert('이미지가 너무 커서 이 브라우저에 저장하지 못했습니다. 더 작은 이미지를 사용해 주세요.'); }
        refreshHomeworkWidgetBody();
      };
      im.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
  function addHomeworkCommentAt(clientX, clientY, img) {
    const r = img.getBoundingClientRect();
    const id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    hwSnapshot();
    state.homework.comments.push({
      id, x: (clientX - r.left) / r.width, y: (clientY - r.top) / r.height,
      text: '', color: state.homework.color, size: state.homework.size, bold: true
    });
    persistHomework();
    refreshHomeworkWidgetBody();
    setTimeout(() => {
      const t = homeworkBodyEl()?.querySelector(`[data-hw-text="${CSS.escape(id)}"]`);
      if (t) t.focus();
    }, 0);
  }
  function toggleHomeworkBold(id) {
    const c = homeworkComment(id);
    if (!c) return;
    hwSnapshot();
    c.bold = (c.bold === false);   // undefined/true → false, false → true
    persistHomework();
    const el = homeworkBodyEl()?.querySelector(`.hw-cmt[data-hw-cmt="${CSS.escape(String(id))}"]`);
    if (el) {
      el.querySelector('.hw-cmt-text').style.fontWeight = c.bold ? 900 : 500;
      el.querySelector('[data-hw-bold]')?.classList.toggle('on', !!c.bold);
    }
  }
  function deleteHomeworkComment(id) {
    if (!homeworkComment(id)) return;
    hwSnapshot();
    state.homework.comments = (state.homework.comments || []).filter(c => String(c.id) !== String(id));
    persistHomework();
    refreshHomeworkWidgetBody();
  }
  function clearHomeworkComments() {
    if (!state.homework.comments || !state.homework.comments.length) return;
    if (!confirm('코멘트를 모두 지울까요?')) return;
    hwSnapshot();
    state.homework.comments = [];
    persistHomework();
    refreshHomeworkWidgetBody();
  }
  function homeworkPanelEl() {
    return homeworkBodyEl()?.closest('.widget-panel')
      || (widgetMultiGrid || document).querySelector('[data-widget-panel="homework"]');
  }
  function setHomeworkSize(size) {
    const s = Math.min(6, Math.max(1, Number(size) || 2.4));
    state.homework.size = s;
    const c = hwFocusedId && homeworkComment(hwFocusedId);
    if (c) c.size = s;
    persistHomework();
    sizeHomeworkComments();
  }
  function setHomeworkColor(color) {
    const c = hwFocusedId && homeworkComment(hwFocusedId);
    if (c && c.color !== color) hwSnapshot();
    state.homework.color = color;
    if (c) {
      c.color = color;
      const t = homeworkBodyEl()?.querySelector(`[data-hw-text="${CSS.escape(String(hwFocusedId))}"]`);
      if (t) t.style.color = color;
    }
    persistHomework();
    homeworkPanelEl()?.querySelectorAll('[data-hw-color]').forEach(b => b.classList.toggle('on', b.dataset.hwColor === color));
  }
  function setHomeworkZoomLive(zoom) {
    state.homework.zoom = Math.round(hwClampZoom(zoom) * 1000) / 1000;
    sizeHomeworkStage();
  }
  function composeHomeworkImage(cb) {
    const hw = state.homework;
    if (!hw || !hw.image) return;
    const im = new Image();
    im.onload = () => {
      const W = im.naturalWidth, H = im.naturalHeight;
      const nameLine = [hw.teacherName && ('선생님 ' + hw.teacherName), hw.studentName && ('학생 ' + hw.studentName)].filter(Boolean).join('   ');
      const band = nameLine ? Math.max(28, Math.round(W * 0.032)) : 0;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H + band;
      const ctx = cv.getContext('2d');
      if (band) {
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, band);
        ctx.fillStyle = '#1f2328'; ctx.textBaseline = 'middle';
        ctx.font = `700 ${Math.round(band * 0.52)}px "Malgun Gothic","맑은 고딕",sans-serif`;
        ctx.fillText(nameLine, Math.round(W * 0.02), band / 2);
      }
      ctx.drawImage(im, 0, band, W, H);
      (hw.comments || []).forEach(c => {
        if (!(c.text || '').trim()) return;
        const fs = ((c.size || hw.size || 2.4) / 100) * W;
        ctx.font = `${c.bold ? 900 : 500} ${fs}px "Malgun Gothic","맑은 고딕",sans-serif`;
        ctx.textBaseline = 'top';
        const lines = wrapHomeworkText(ctx, c.text || '', Math.max(W * 0.25, W * (0.97 - c.x)));
        lines.forEach((ln, k) => {
          const x = c.x * W, y = band + c.y * H + k * fs * 1.25;
          ctx.lineWidth = Math.max(2, fs * 0.14); ctx.strokeStyle = 'rgba(255,255,255,.9)';
          ctx.strokeText(ln, x, y);
          ctx.fillStyle = c.color || hw.color || '#e02424';
          ctx.fillText(ln, x, y);
        });
      });
      let url = cv.toDataURL('image/webp', 0.92), ext = 'webp';
      if (!url.startsWith('data:image/webp')) { url = cv.toDataURL('image/png'); ext = 'png'; }
      cb(url, ext);
    };
    im.src = hw.image;
  }
  function exportHomework() {
    composeHomeworkImage((url, ext) => {
      const a = document.createElement('a');
      a.href = url; a.download = `첨삭_${state.wordContext?.videoId || 'homework'}.${ext}`;
      document.body.appendChild(a); a.click(); a.remove();
    });
  }
  function printHomework() {
    composeHomeworkImage(url => {
      const w = window.open('', '_blank');
      if (!w) { alert('팝업이 차단되어 인쇄창을 열 수 없습니다.'); return; }
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>첨삭 인쇄</title>
        <style>@page{size:A4;margin:12mm}html,body{margin:0}img{width:100%;height:auto;display:block}</style>
        </head><body><img src="${url}" onload="setTimeout(function(){window.focus();window.print();},80)"></body></html>`);
      w.document.close();
    });
  }
  function printManuscriptPaper() {
    const w = window.open('', '_blank');
    if (!w) { alert('팝업이 차단되어 원고지 창을 열 수 없습니다.'); return; }
    w.document.write(
      '<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>원고지 인쇄</title><style>' +
      ':root{--c:15mm;--fit:1;--grid:#d23b3b;--cross:#e6bcbc;--rule:#8fa6bd}' +
      '*{box-sizing:border-box}@page{size:A4;margin:10mm}' +
      'html,body{margin:0;height:100%;font-family:"Malgun Gothic","맑은 고딕",sans-serif}' +
      'body{background:#e9edf1;overflow:hidden}' +
      '.bar{position:fixed;top:0;left:0;right:0;height:52px;z-index:2;display:flex;gap:18px;align-items:center;' +
        'padding:0 16px;background:#fff;border-bottom:1px solid #d8dce2;font-size:13px;color:#3a4453}' +
      '.bar label{display:flex;align-items:center;gap:6px}.bar select{font:inherit;padding:3px 6px}' +
      '.bar button{padding:8px 18px;border:1px solid #2f6feb;background:#2f6feb;color:#fff;border-radius:8px;font:inherit;font-weight:700;cursor:pointer}' +
      '.stage{position:absolute;left:0;right:0;top:52px;bottom:0;display:flex;justify-content:center;align-items:flex-start;overflow:hidden}' +
      '.page{width:210mm;height:297mm;padding:10mm;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.18);' +
        'flex:0 0 auto;transform:scale(var(--fit));transform-origin:top center;margin-top:6px}' +
      'table.wg{border-collapse:collapse;table-layout:fixed;margin:0 auto}' +
      'table.wg td{width:var(--c);height:var(--c);border:1px solid var(--grid);position:relative;padding:0}' +
      'table.wg td::before{content:"";position:absolute;left:50%;top:0;bottom:0;border-left:1px dotted var(--cross);transform:translateX(-.5px)}' +
      'table.wg td::after{content:"";position:absolute;top:50%;left:0;right:0;border-top:1px dotted var(--cross);transform:translateY(-.5px)}' +
      'table.wg.lines td{border-color:transparent;border-bottom-color:var(--rule)}' +
      'table.wg.lines td::before,table.wg.lines td::after{display:none}' +
      '@media print{body{background:#fff;overflow:visible}.bar{display:none}' +
        '.stage{position:static;overflow:visible;display:block}' +
        '.page{transform:none;box-shadow:none;padding:0;margin:0;width:auto;height:auto}}' +
      '</style></head><body>' +
      '<div class="bar">' +
      '<label>한 줄 칸 수 <select id="cols"><option>8</option><option>10</option><option selected>12</option><option>14</option><option>16</option></select></label>' +
      '<label>모양 <select id="mode"><option value="grid">원고지(십자 점선)</option><option value="lines">밑줄만</option></select></label>' +
      '<button id="pr">🖨 인쇄</button>' +
      '</div><div class="stage"><div class="page"><table class="wg" id="grid"></table></div></div><script>' +
      'var cols=document.getElementById("cols"),mode=document.getElementById("mode"),grid=document.getElementById("grid"),page=document.querySelector(".page"),stage=document.querySelector(".stage");' +
      'var INW=190;' +
      'function fit(){document.documentElement.style.setProperty("--fit","1");' +
        'var ph=page.getBoundingClientRect().height,pw=page.getBoundingClientRect().width;' +
        'var f=Math.min((stage.clientHeight-12)/ph,(stage.clientWidth-12)/pw);' +
        'document.documentElement.style.setProperty("--fit",(f>0?f:1).toFixed(3));}' +
      'function build(){var c=+cols.value,cell=INW/c;' +
        'document.documentElement.style.setProperty("--c",cell.toFixed(3)+"mm");' +
        'grid.className="wg"+(mode.value==="lines"?" lines":"");' +
        'var rows=Math.max(1,Math.floor(277/cell));' +
        'var h="";for(var r=0;r<rows;r++){h+="<tr>";for(var k=0;k<c;k++)h+="<td><\\/td>";h+="<\\/tr>";}grid.innerHTML=h;fit();}' +
      'cols.addEventListener("change",build);mode.addEventListener("change",build);' +
      'window.addEventListener("resize",fit);' +
      'document.getElementById("pr").addEventListener("click",function(){window.print();});build();' +
      '<\/script></body></html>'
    );
    w.document.close();
  }
  function wrapHomeworkText(ctx, text, maxW) {
    const out = [];
    String(text || '').split('\n').forEach(para => {
      let line = '';
      for (const ch of para) {
        if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; }
        else line += ch;
      }
      out.push(line);
    });
    return out;
  }

  function settingsWidgetBodyHtml() {
    const inYouTube = state.page === 'module' && state.section === 'video' && state.item === 'youtube';
    const current = LEARNING_LANGS[state.learningLanguage] || LEARNING_LANGS.en;
    const languageOptions = Object.entries(LEARNING_LANGS).map(([value, item]) =>
      `<option value="${value}" ${state.learningLanguage === value ? 'selected' : ''}>${item.name} (${item.code})</option>`
    ).join('');
    return `<div class="settings-widget">
      <section class="settings-card learning-language-card">
        <div class="settings-card-head"><div><span>학습 언어</span><strong>${current.name} (${current.code})</strong></div><span class="settings-status ok">현재 적용</span></div>
        <p>선택한 언어가 자막 번역, W01 단어 번역, W03 질문·답변 번역에 동시에 적용됩니다.</p>
        <div class="settings-language-row">
          <label for="koreduLearningLanguageSelect">학습 언어</label>
          <select id="koreduLearningLanguageSelect" data-learning-language aria-label="전역 학습 언어">${languageOptions}</select>
        </div>
        <small>로그인 개인정보의 학습 언어가 연결되기 전까지 이 값을 기본값으로 사용합니다. 이후에는 프로필 언어를 초기값으로 사용하고 여기서 일시적으로 변경할 수 있습니다.</small>
      </section>
      <section class="settings-card">
        <div class="settings-card-head"><div><span>AI API</span><strong>OpenAI</strong></div><span class="settings-status ${state.wordApiConfigured ? 'ok' : ''}">${state.wordApiConfigured ? '설정됨' : '미설정'}</span></div>
        <p>AI 자막 점검, AI 단어 추출·정리, 다국어 번역에 사용하는 공통 API Key입니다.</p>
        <div class="settings-key-row">
          <input type="password" data-openai-key-input placeholder="sk-..." autocomplete="off" ${!inYouTube ? 'disabled' : ''} />
          <button type="button" data-openai-key-save ${!inYouTube ? 'disabled' : ''}>저장</button>
        </div>
        <small>키는 브라우저가 아니라 이 PC의 <b>VideoScript_DATA/settings</b>에 저장됩니다. 기존 키는 화면에 다시 표시하지 않습니다.</small>
        <dl class="settings-info"><div><dt>기본 모델</dt><dd>GPT-5.4 nano</dd></div><div><dt>사용 단계</dt><dd>AI 자막점검 · AI 단어추출 · 15개 언어 번역</dd></div></dl>
        ${state.settingsMessage ? `<div class="settings-message">${escapeHtml(state.settingsMessage)}</div>` : ''}
        ${!inYouTube ? `<div class="settings-message warn">YouTube 화면에서 설정해 주세요.</div>` : ''}
      </section>
    </div>`;
  }

  /* ══════════ W05 커리큘럼 위젯 ══════════ */

  function curriculumIsStudent() { return state.user?.role === 'student'; }

  function curriculumCurrentStudent() {
    if (curriculumIsStudent()) return state.user?.email || '';
    return state.curriculum.student
      || state.curriculum.roster?.students?.[0]?.email
      || '';
  }

  // RMK - Emma Johnson ▾ 처럼 보이는 교사/학생선택 묶음. 급수 배지는 제목 뒤(.cd-lv-slot)로 옮겨서
  // "RMK-Emma▾ | 님의 관리 강의실 | 초급Lev1" 순서가 되도록 분리해뒀다 (curLevelBadgeHtml 참고).
  // 회차 보드 화면(강의실)에서는 이 묶음을 제목("님의 강의실") 옆으로 옮겨서 쓰고,
  // 위젯 패널(사이드 커리큘럼 위젯)에서는 기존처럼 툴바 안에 그대로 둔다.
  function curTeacherPickerHtml() {
    const c = state.curriculum;
    const students = c.roster?.students || [];
    const cur = curriculumCurrentStudent();
    if (!students.length) return '';
    const opts = students.map(s => `<option value="${escapeHtml(s.email)}" title="${escapeHtml(s.name || s.email)}" ${s.email === cur ? 'selected' : ''}>${escapeHtml(shortName(s.name) || s.email)}</option>`).join('');
    const teacherName = `<span class="cur-hpair"><b>${escapeHtml(state.user.name || state.user.email)}</b> <span class="cur-hdash">–</span></span>`;
    return `${teacherName} <select data-cur-student aria-label="학생 선택">${opts}</select>`;
  }
  function curLevelBadgeHtml() {
    const c = state.curriculum;
    const students = c.roster?.students || [];
    const cur = curriculumCurrentStudent();
    if (!students.length) return '';
    const curLv = students.find(s => s.email === cur)?.level;
    return `<span class="cur-hlv" title="학생 급수 (수업자동배치 규칙 기준)">${escapeHtml(curLevelLabel(curLv))}</span>`;
  }

  // 헤더 툴바 + (강의실 보드일 때) 제목 옆 교사/학생/급수 묶음을 함께 새로고침
  function curRefreshHead(headEl) {
    if (!headEl) return;
    const isBoard = headEl.classList.contains('cur-board-head');
    headEl.innerHTML = curriculumWidgetHeaderToolsHtml(isBoard);
    if (isBoard) {
      const picker = document.querySelector('.cd-picker');
      if (picker) picker.innerHTML = curTeacherPickerHtml();
      const lvSlot = document.querySelector('.cd-lv-slot');
      if (lvSlot) lvSlot.innerHTML = curLevelBadgeHtml();
      const collapseSlot = document.querySelector('.cd-collapse-slot');
      if (collapseSlot) collapseSlot.innerHTML = curCollapseAllHtml();
    }
  }

  // 모두 펼치기(+) / 모두 접기(−) 버튼. 고정 폭 아이콘 버튼이라 상태가 바뀌어도 헤더가 안 흔들린다.
  // 강의실 보드 화면에서는 ← 목록 옆(.cd-collapse-slot)에 두고, 사이드 위젯 패널에서는 툴바 안에 인라인으로 둔다.
  function curCollapseAllHtml() {
    return `<button type="button" class="cur-expand-all" data-cur-expand-all title="모두 펼치기">+</button>`
      + `<button type="button" class="cur-collapse-all" data-cur-collapse-all title="모두 접기">−</button>${curSessBulkDelHtml()}`;
  }

  // 회차 목록에서 체크한 회차를 한 번에 삭제하는 버튼. 모두접기와 같은 자리(.cd-collapse-slot / 헤더 인라인)에 둔다.
  // 개수는 우측 상단 작은 배지로만 표시해 버튼 자체 폭은 고정(헤더가 옆으로 안 밀림).
  function curSessBulkDelHtml() {
    const c = state.curriculum;
    if (!c.canManage || !c.board || c.previewAs === 'student') return '';
    const n = Object.values(c.sessDelChecked || {}).filter(Boolean).length;
    return `<button type="button" class="cur-sess-bulkdel" data-cur-sess-bulkdel ${n ? '' : 'disabled'} title="체크한 회차 일괄 삭제">🗑${n ? `<i>${n}</i>` : ''}</button>`;
  }

  // 체크한 회차 개수가 바뀔 때, 화면 곳곳(위젯 패널·보드)에 떠 있는 일괄삭제 버튼을 전부 갱신
  function curRefreshSessBulkDelBtn() {
    const n = Object.values(state.curriculum.sessDelChecked || {}).filter(Boolean).length;
    document.querySelectorAll('.cur-sess-bulkdel').forEach(btn => {
      btn.disabled = !n;
      btn.innerHTML = n ? `🗑<i>${n}</i>` : '🗑';
    });
  }

  function curriculumWidgetHeaderToolsHtml(forBoard) {
    if (!state.user) return '';
    const c = state.curriculum;
    const filter = c.board ? curFilterBarHtml() : '';
    // 보드 화면(forBoard)에서는 "모두 접기"를 여기 안 넣고 ← 목록 옆(.cd-collapse-slot)에 따로 둔다.
    // 위젯 패널에서는 보드 헤더와 같은 순서(모두접기 → 학생선택/급수 → 자동배치 → 필터탭)로 인라인 배치.
    const collapseAll = forBoard ? '' : curCollapseAllHtml();
    if (curriculumIsStudent()) {
      // 보드 화면(forBoard)은 제목("Emma님의 강의실")에 이미 이름이 있으니 여기서 또 안 띄운다.
      const who = forBoard ? '' : `<span class="cur-hsep">|</span><span class="cur-who">${escapeHtml(shortName(state.user.name) || state.user.email)}</span>`;
      return `<div class="widget-head-tools cur-head">${collapseAll}${who}${filter}</div>`;
    }
    const students = c.roster?.students || [];
    const cur = curriculumCurrentStudent();
    if (!students.length) return `<div class="widget-head-tools"><span class="cur-who">담당 학생 없음</span></div>`;
    // 내강의실 카드·강의실 보드 화면과 같은 표기(짧은 이름)로 통일 — 안 그러면 화면마다 이름이 달라 보인다.
    const opts = students.map(s => `<option value="${escapeHtml(s.email)}" title="${escapeHtml(s.name || s.email)}" ${s.email === cur ? 'selected' : ''}>${escapeHtml(shortName(s.name) || s.email)}</option>`).join('');
    const curLv = students.find(s => s.email === cur)?.level;
    const lvBadge = `<span class="cur-hlv" title="학생 급수 (수업자동배치 규칙 기준)">${escapeHtml(curLevelLabel(curLv))}</span>`;
    const teacherName = `<span class="cur-hsep">|</span><span class="cur-hpair"><b>${escapeHtml(state.user.name || state.user.email)}</b> <span class="cur-hdash">–</span></span>`;
    const pickerTail = forBoard ? '' : `${teacherName}\n        <select data-cur-student aria-label="학생 선택">${opts}</select>${lvBadge}`;
    const n = Math.max(1, Number(c.bulkN) || 1);
    const libN = (c.libList || []).length;
    const lastSeq = (c.board?.sessions || []).length ? c.board.sessions[c.board.sessions.length - 1].seq : 0;
    const fromVal = Number(c.bulkFrom) || lastSeq || 0;
    const wantYt = c.bulkYt !== false, wantLec = c.bulkLec !== false;
    const bulk = (c.canManage && c.board)
      ? `<span class="cur-hbulk">
           <label class="cur-bulk-type"><input type="checkbox" data-cur-bulk-yt ${wantYt ? 'checked' : ''}>유튜브</label>
           <label class="cur-bulk-type"><input type="checkbox" data-cur-bulk-lec ${wantLec ? 'checked' : ''}>강의</label>
           <input type="number" class="cur-bulk-from" min="0" max="999" value="${fromVal}" data-cur-bulk-from aria-label="시작 회차"
             title="이 회차 다음부터 배치 · 마지막 회차 번호면 새 회차를 만들고, 그보다 작으면 기존 회차에 다시 배치">회차이후
           <input type="number" class="cur-bulk-n" min="1" max="40" value="${n}" data-cur-bulk-n aria-label="회차 수">차
           <button type="button" class="cur-autofill" data-cur-bulk-run title="지정한 회차 다음부터 체크한 유형(유튜브·강의)을 자동 배치 (조건은 설정)">수업배치</button>
           <button type="button" class="cur-gear" data-cur-bulk-cfg title="자동배치 규칙 설정">⚙</button>
           ${libN ? `<span class="cur-libtag" title="자료함에서 체크한 유튜브">유튜브 ${libN}</span>` : ''}
         </span><span class="cur-hsep">|</span>` : '';
    if (c.previewAs === 'student') {
      return `<div class="widget-head-tools cur-head">${collapseAll}${pickerTail}${filter}</div>`;
    }
    return `<div class="widget-head-tools cur-head">
      ${collapseAll}${pickerTail}${bulk}${filter}
    </div>`;
  }

  function curBar(p) {
    const total = Number(p?.total) || 0;
    const done = Number(p?.max_reached) || 0;
    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    return `<div class="cur-bar" title="${done}/${total}"><i style="width:${pct}%"></i></div>`;
  }
  function curPct(p) {
    const t = Number(p?.total) || 0;
    return t > 0 ? Math.round((Number(p.max_reached) || 0) / t * 100) : 0;
  }
  function curProgAttrs(it, sessionId) {
    const label = it.title || it.ref_id;
    const pr = it.progress || {};
    return ` data-cur-prog-ref="${escapeHtml(it.ref_id)}" data-cur-prog-type="${escapeHtml(it.type)}"`
      + ` data-cur-prog-cur="${Number(pr.marker_index) || 0}" data-cur-prog-total="${Number(pr.total) || 0}"`
      + ` data-cur-prog-label="${escapeHtml(label)}" data-cur-prog-session="${escapeHtml(sessionId || '')}"`;
  }
  /* ── 트리 뷰 (계층 → 유튜브 / 강의교재 / 단어 / 복습 4칸) ── */
  const CUR_TREE_TYPES = [
    { type: 'youtube', label: '유튜브' },
    { type: 'lecture', label: '강의교재' },
    { type: 'word', label: '단어' },
    { type: 'review', label: '복습' },
  ];
  function curCollapsed(key) { return !!state.curriculum.collapsed[key]; }
  function curToggleIcon(key) { return curCollapsed(key) ? '＋' : '－'; }

  // 유튜브·강의교재 = 작은 썸네일 + 제목 + 진도바. 손잡이(⠿)로만 드래그, 카드 클릭 시 이동.
  function curLinkCardHtml(it, deletable, sectionKey, badge) {
    const pct = curPct(it.progress);
    const hasProg = (Number(it.progress?.total) || 0) > 0;
    const title = it.title || it.ref_id;
    const openAttr = `data-cur-open="${escapeHtml(it.type)}|${escapeHtml(it.ref_id)}"`;
    const drag = escapeHtml(JSON.stringify({ id: it.id, type: it.type, ref_id: it.ref_id, title, section: sectionKey || it.section || '' }));
    const head = it.type === 'youtube'
      ? `<span class="cur-it-thumbwrap"><img class="cur-it-thumb" draggable="false" src="https://i.ytimg.com/vi/${escapeHtml(it.ref_id)}/mqdefault.jpg" alt="" loading="lazy" onerror="this.style.visibility='hidden'"></span>`
      : `<span class="cur-it-ref">${escapeHtml(it.ref_id)}</span>`;
    return `<div class="cur-it cur-t-${escapeHtml(it.type)}" draggable="false" data-cur-drag="${drag}" ${openAttr} title="클릭하면 이동 · 손잡이를 끌어 다른 칸으로">
      <span class="cur-it-grip" draggable="true" data-cur-grip aria-label="드래그" title="끌어서 다른 칸으로 이동">⠿</span>
      ${badge ? `<span class="cur-it-badge">${escapeHtml(badge)}</span>` : ''}
      ${deletable ? `<button type="button" class="cur-it-del" data-cur-del="${escapeHtml(it.id)}" aria-label="빼기">×</button>` : ''}
      ${head}
      <span class="cur-it-title" title="${escapeHtml(title)}">${escapeHtml(title)}</span>
      <span class="cur-it-foot">
        <span class="cur-it-pct">${hasProg ? pct + '%' : '0%'}</span>
        <span class="cur-it-bar"><i style="width:${pct}%"></i></span>
      </span>
    </div>`;
  }

  // 한 유형(유튜브/강의/단어)의 내용만. (칸 헤더·토글·개수 없음 — 접기는 계층에만)
  function curTypeBodyHtml(tierKey, type, items, deletable, sessionId, sectionKey) {
    const of = items.filter(it => it.type === type);
    if (type === 'youtube' || type === 'lecture') {
      const grid = type === 'youtube' ? 'cur-grid-yt' : 'cur-grid-lec';
      const cards = of.length ? of.map(it => curLinkCardHtml(it, deletable, sectionKey)).join('') : '<div class="cur-cell-empty">—</div>';
      return `<div class="cur-cell-grid ${grid}" data-cur-drop="${escapeHtml(JSON.stringify({ section: sectionKey || '', type }))}">${cards}</div>`;
    }
    if (!of.length) return '<div class="cur-cell-empty">—</div>';
    if (type === 'word') {
      // 전체듣기·update 버튼은 좌측 라벨 칸(cur-erow-h)으로 이동 → 여기선 목록만.
      // 강의/유튜브가 여러 개 배정되면 단어도 그만큼 여러 묶음이 되니, 어디서 나온
      // 단어인지 구분되게 묶음마다 이름표를 붙인다.
      return of.map(it => `<div class="cur-words" data-cur-wordlist="${escapeHtml(it.ref_id)}" data-cur-chip="${escapeHtml(it.id)}"${curProgAttrs(it, sessionId)}>
        ${of.length > 1 ? `<div class="cur-words-src-label">${escapeHtml(it.title || it.ref_id)}</div>` : ''}
        <div class="cur-words-list">불러오는 중…</div>
      </div>`).join('');
    }
    return '';
  }

  /* ── 음성 입력 (Web Speech API) ── */
  function curSpeechCtor() { return window.SpeechRecognition || window.webkitSpeechRecognition || null; }
  function curSpeechSupported() { return !!curSpeechCtor(); }
  let _curRec = null;
  function curToggleDictation(btn) {
    if (_curRec) { try { _curRec.stop(); } catch (_) {} return; }
    const ta = (btn.closest('.cur-erow') || btn.closest('.cur-note-wrap'))?.querySelector('textarea.cur-note');
    if (!ta || ta.hasAttribute('readonly')) return;
    const SR = curSpeechCtor();
    if (!SR) { alert('이 브라우저는 음성 입력을 지원하지 않습니다.'); return; }
    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.interimResults = true;
    rec.continuous = true;
    let base = ta.value;
    rec.onresult = (ev) => {
      let fin = '', interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) fin += r[0].transcript; else interim += r[0].transcript;
      }
      if (fin) base = (base ? base.trim() + ' ' : '') + fin.trim();
      ta.value = (base + (interim ? ' ' + interim : '')).trim();
    };
    rec.onerror = (ev) => { if (ev.error === 'not-allowed') alert('마이크 사용 권한이 필요합니다.'); };
    rec.onend = () => {
      _curRec = null;
      btn.classList.remove('rec');
      ta.value = base.trim();
      const [sid, k] = (ta.dataset.curNote || '').split('|');
      if (sid && k) CurriculumStore.setSessionNote({ session_id: sid, [k]: ta.value }).catch(() => {});
    };
    _curRec = rec;
    btn.classList.add('rec');
    try { rec.start(); } catch (_) { _curRec = null; btn.classList.remove('rec'); }
  }

  // 단어 번역 (학습 언어 미구현 → 영어 우선)
  function curWordTr(w) {
    const tr = w && w.tr;
    if (!tr) return '';
    if (typeof tr === 'string') return tr;
    return tr.en || tr.ja || tr['zh-Hans'] || tr.es || Object.values(tr)[0] || '';
  }

  /* ── 듣기 (Web Speech · TTS) ── */
  function curSpeak(text) {
    curduSpeakCancel();
    curduSpeak(text);
  }
  function curSpeakAll(list) {
    curduSpeakCancel();
    (list || []).forEach(t => curduSpeak(t, { rate: 0.95 }));
  }

  // Q(질문·학생) : A(답변·선생) — 한 줄에 나란히 (내부만; erow 래핑은 curErowHtml)
  function curQABodyHtml(sid, n = {}, headLabel = '') {
    const canM = state.curriculum.canManage;
    const sup = curSpeechSupported();
    const fld = (key, val, editable, ph) => {
      const ro = editable ? '' : 'readonly';
      const mic = editable && sup
        ? `<button type="button" class="cur-note-mic" data-cur-mic="${escapeHtml(sid)}|${key}" title="음성으로 입력" aria-label="음성으로 입력">🎤</button>`
        : '';
      // Q/A 글자 대신 (유형 필터 목록에서 넘어온) 회차·날짜를 학생 쪽 칸 위에 세로로 쌓고 그 밑에 마이크.
      const label = key === 'q' && headLabel ? headLabel : '';
      return `<div class="cur-qa-fld cur-qa-${key}">
        <span class="cur-qa-lbl">${label}${mic}</span>
        <textarea class="cur-note cur-note-grow" data-cur-note="${escapeHtml(sid)}|${key}" data-cur-grow rows="3" placeholder="${escapeHtml(ph)}" ${ro}>${escapeHtml(val || '')}</textarea>
      </div>`;
    };
    return `<div class="cur-qa-row">
      ${fld('q', n.q, true, '학생')}
      <span class="cur-qa-sep">:</span>
      ${fld('a', n.a, canM, '선생님')}
    </div>`;
  }

  // 회차 아래 항목행(단어/Q&A/복습) — +/- 토글, 접혔는데 내용 있으면 빨간점
  function curErowHtml(sid, key, label, hasContent, bodyHtml, headExtra = '') {
    const ck = `e:${sid}:${key}`;
    const col = curCollapsed(ck);
    return `<div class="cur-erow cur-t-${escapeHtml(key)}${col ? ' is-erow-collapsed' : ''}">
      <div class="cur-erow-h">
        <button type="button" class="cur-erow-tog" data-cur-collapse="${escapeHtml(ck)}" aria-label="접기/펼치기">${col ? '＋' : '－'}</button>
        <span class="cur-erow-name">${label}</span>
        ${col && hasContent ? '<span class="cur-erow-dot" title="내용 있음"></span>' : ''}
        ${col ? '' : headExtra}
      </div>
      ${col ? '' : `<div class="cur-erow-b">${bodyHtml}</div>`}
    </div>`;
  }
  function curReviewHasContent(sid, n = {}) {
    const s = state.curriculum.board?.sessions?.find(x => x.id === sid);
    if (s && (s.has_review || s.has_board || s.has_talk)) return true;
    // 서버 플래그 없을 때(재시작 전) 캐시/notes 폴백
    const student = curriculumCurrentStudent();
    const rv = state.curriculum.reviews || {};
    const hw = h => !!(h && (h.image || (h.comments && h.comments.length)));
    return hw(rv[`${student}|${sid}`]) || hw(rv[`${student}|${sid}__board`]) || !!(n && n.talk);
  }

  // 비활성 회차 복습 = 위젯과 동일한 이미지+코멘트 레이어 (읽기 전용)
  function curReviewStaticHtml(hw) {
    if (!hw || !hw.image) {
      return `<div class="hw-root"><div class="hw-drop hw-drop-static"><strong>이미지가 아직 없어요</strong>
        <span>${state.curriculum.canManage ? '여기를 눌러 이미지를 올리고 첨삭하세요' : '📷 일기장 올리기로 이미지를 올리세요'}</span></div></div>`;
    }
    const comments = (hw.comments || []).map(c => {
      const x = Number(c.x) * 100, y = Number(c.y) * 100;
      const maxW = Math.max(18, 97 - x);
      const bold = c.bold !== false;
      return `<div class="hw-cmt" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;max-width:${maxW.toFixed(1)}%">
        <div class="hw-cmt-text" data-hw-cmt-size="${Number(c.size) || hw.size || 2.4}" style="color:${escapeHtml(c.color || hw.color || '#e02424')};font-weight:${bold ? 900 : 500}">${escapeHtml(c.text || '')}</div>
      </div>`;
    }).join('');
    return `<div class="hw-root"><div class="hw-scroll" data-hw-scroll>
      <div class="hw-stage" style="height:100%">
        <img src="${hw.image}" alt="학생 답안" data-hw-static-img draggable="false">
        <div class="hw-layer">${comments}</div>
      </div></div></div>`;
  }
  function curSizeStaticComments(root) {
    root.querySelectorAll('[data-hw-static-img]').forEach(img => {
      const apply = (retry) => {
        const w = img.clientWidth || img.naturalWidth || 0;
        if (w < 50) { if ((retry || 0) < 20) setTimeout(() => apply((retry || 0) + 1), 120); return; }
        img.closest('.hw-stage')?.querySelectorAll('.hw-cmt-text').forEach(t => {
          t.style.fontSize = ((Number(t.dataset.hwCmtSize) || 2.4) / 100 * w) + 'px';
        });
      };
      if (img.complete && img.naturalWidth) apply();
      else img.addEventListener('load', () => apply(), { once: true });
      if (window.ResizeObserver) { const ro = new ResizeObserver(() => apply()); ro.observe(img); }
    });
  }

  const CUR_REVIEW_TABS = [
    { k: 'talk', label: '대화' },
    { k: 'board', label: '판서' },
    { k: 'review', label: '복습' },
  ];
  function curReviewTabLabel() {
    return (CUR_REVIEW_TABS.find(t => t.k === (state.curriculum.reviewTab || 'review')) || {}).label || '복습';
  }

  // 회차 "판서" 탭 — 위젯의 판서(ScreenInk 캡처 목록)와 완전히 같은 저장소를 그대로 보여준다.
  // 위젯에서 캡처하든 여기서 "판서 열기"로 캡처하든 같은 회차 목록에 쌓이고, 어느 쪽에서 봐도 같다.
  function curBoardCellHtml(sessionId) {
    return `<div class="hw-embed-body cur-board-wrap" data-cur-board-gallery="${escapeHtml(sessionId)}">
      <div class="cur-board-gallery-body">불러오는 중…</div>
    </div>`;
  }
  // 캡처 한 장의 표시용 라벨: "선생님-학생-날짜-시간" (같은 회차에 여러 장이 섞여도 구분되게)
  function curBoardCaptureLabel(item, studentEmail) {
    const roster = state.curriculum.roster?.students || [];
    const stu = roster.find(s => s.email === studentEmail);
    const studentName = stu?.name || (studentEmail || '').split('@')[0] || '학생';
    const teacherEmail = item.created_by || '';
    const teacherName = (state.user?.email && state.user.email === teacherEmail && state.user.name)
      ? state.user.name
      : (teacherEmail.split('@')[0] || '선생님');
    const d = new Date((item.ts || 0) * 1000);
    const dateStr = d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\s/g, '').replace(/\.$/, '');
    const timeStr = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    return `${teacherName}-${studentName}-${dateStr}-${timeStr}`;
  }
  function curBoardGalleryBodyHtml(sessionId, items, canManage, studentEmail) {
    const addBtn = canManage
      ? `<button type="button" class="cur-board-add" data-cur-board-add="${escapeHtml(sessionId)}" title="판서를 열어서 캡처를 추가합니다">✏️ 판서 열기</button>`
      : '';
    if (!items.length) return `${addBtn}<div class="cur-board-empty">저장된 판서가 없습니다.</div>`;
    const grid = items.map((it, i) => {
      const label = curBoardCaptureLabel(it, studentEmail);
      return `<div class="cur-board-item">
        <button type="button" class="cur-board-view" data-cur-board-view="${escapeHtml(it.id)}" data-cur-board-sess="${escapeHtml(sessionId)}" title="${escapeHtml(label)}">
          <img src="${it.image}" alt="판서 ${label}"><span>${i + 1}</span>
        </button>
        <span class="cur-board-cap" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
        ${canManage ? `<button type="button" class="cur-board-del" data-cur-board-del="${escapeHtml(it.id)}" data-cur-board-sess="${escapeHtml(sessionId)}" title="이 판서 삭제">×</button>` : ''}
      </div>`;
    }).join('');
    return `${addBtn}<div class="cur-board-grid">${grid}</div>`;
  }
  // 서버에서 다시 받아와서, 지금 화면에 떠 있는 그 회차의 인라인 갤러리를 전부 갱신한다.
  // (강의실 본문 탭 / 헤더 필터탭 / 위젯 ScreenInk 목록 — 어디서 캡처·삭제하든 나머지가 다 같이 바뀐다.)
  async function refreshBoardCaptureViews(sessionId) {
    refreshScreenInkGallery();
    const cells = document.querySelectorAll(`[data-cur-board-gallery="${CSS.escape(sessionId)}"]`);
    if (!cells.length || !window.CurriculumStore) return;
    try {
      const student = curriculumCurrentStudent();
      const r = await CurriculumStore.getBoardCaptures(student, sessionId);
      state.curriculum.boardCaptures[sessionId] = r.items || [];
      cells.forEach(el => {
        const bodyEl = el.querySelector('.cur-board-gallery-body');
        if (bodyEl) bodyEl.innerHTML = curBoardGalleryBodyHtml(sessionId, r.items || [], !!r.canManage, student);
      });
    } catch (_) {}
  }

  // 복습 영역 = 대화 / 판서 / 복습 탭. 복습은 W04 첨삭 위젯, 대화는 실시간 채팅, 판서는 캡처 목록.
  // 복습(review) 탭은 이미지 유무·activeReview 여부와 상관없이 메뉴(툴바)를 항상 보여준다 — 회차마다
  // 있다 없다 하면 헷갈리니, 이 트리뷰에서는(기본적으로 펼친 회차가 1개뿐이라 부담 적음) 항상 켜둔다.
  // "접기" 버튼은 이제 activeReview를 끄는 게 아니라 이 복습 행 자체를 접는다.
  function curReviewCellHtml(sessionId) {
    const tf = state.curriculum.typeFilter;
    if (tf !== 'all' && tf !== 'review') return '';
    const student = curriculumCurrentStudent();
    const tab = state.curriculum.reviewTab || 'review';
    const isWidget = tab === 'review';
    const active = isWidget || state.curriculum.activeReview === sessionId;
    const hwRefId = tab === 'board' ? `${sessionId}__board` : sessionId;
    const rk = `${student}|${hwRefId}`;
    const tabs = CUR_REVIEW_TABS.map(t =>
      `<button type="button" class="hw-embed-tab ${t.k === tab ? 'on' : ''}" data-cur-review-tab="${t.k}">${t.label}</button>`).join('');
    let head, body;
    if (tab === 'talk') {
      head = `<span class="hw-embed-tabs">${tabs}</span>`;
      body = curSessionTalkBodyHtml(sessionId);
    } else if (tab === 'board') {
      head = `<span class="hw-embed-tabs">${tabs}</span>`;
      body = curBoardCellHtml(sessionId);
    } else {
      // isWidget(review)은 이제 항상 이 분기.
      head = `<span class="hw-embed-tabs">${tabs}</span>
        <div class="hw-embed-tools" data-widget-header-tools="homework"></div>
        <button type="button" class="hw-embed-close" data-cur-review-fold="${escapeHtml(`e:${sessionId}:review`)}" title="이 복습 접기">접기</button>`;
      body = `<div class="hw-embed-body" data-hw-body>불러오는 중…</div>`;
    }
    return `<div class="cur-cell cur-t-review">
      <div class="cur-cell-body">
        <div class="cur-review${active ? ' is-active' : ''}" data-cur-review="${escapeHtml(rk)}" data-cur-review-sess="${escapeHtml(sessionId)}" data-cur-review-tab="${tab}" data-cur-review-active="${active && isWidget ? '1' : ''}">
          <div class="hw-embed${active && isWidget ? ' is-active' : ''}" data-hw-embed data-hw-ref="${escapeHtml(hwRefId)}" data-hw-student="${escapeHtml(student)}">
            <div class="hw-embed-head">${head}</div>
            ${body}
          </div>
        </div>
      </div>
    </div>`;
  }

  // 유형 필터(대화/판서/복습) 목록 전용: 탭 스위처 없이 특정 탭 하나로 고정한 셀.
  // 회차 안 "복습" 탭에서 쓰는 것과 데이터/편집 로직(curFillTreeContent, curActivateReview 등)을 그대로 공유한다.
  function curReviewCellHtmlFor(sessionId, tab) {
    const student = curriculumCurrentStudent();
    const canM = state.curriculum.canManage;
    const active = state.curriculum.activeReview === sessionId && state.curriculum.reviewTab === tab;
    const isWidget = tab === 'review';
    const hwRefId = tab === 'board' ? `${sessionId}__board` : sessionId;
    const rk = `${student}|${hwRefId}`;
    let head = '', body;
    if (tab === 'talk') {
      body = curSessionTalkBodyHtml(sessionId);
    } else if (tab === 'board') {
      body = curBoardCellHtml(sessionId);
    } else if (active) {
      head = `<div class="hw-embed-tools" data-widget-header-tools="homework"></div>
        <button type="button" class="hw-embed-close" data-cur-review-close title="편집 끝">완료</button>`;
      body = `<div class="hw-embed-body" data-hw-body>불러오는 중…</div>`;
    } else {
      head = canM
        ? `<button type="button" class="cur-board-add" data-cur-review-open="${escapeHtml(sessionId)}" title="복습 화면을 열어서 첨삭합니다">✏️ 첨삭 열기</button>`
        : (tab === 'review' ? `<label class="cur-review-up">📷 일기장 올리기<input type="file" accept="image/*" data-cur-review-file="${escapeHtml(rk)}" hidden></label>` : '');
      body = `<div class="hw-embed-body" data-hw-static>불러오는 중…</div>`;
    }
    return `<div class="cur-cell cur-t-review">
      <div class="cur-cell-body">
        <div class="cur-review${active ? ' is-active' : ''}" data-cur-review="${escapeHtml(rk)}" data-cur-review-sess="${escapeHtml(sessionId)}" data-cur-review-tab="${tab}" data-cur-review-active="${active && isWidget ? '1' : ''}">
          <div class="hw-embed${active && isWidget ? ' is-active' : ''}" data-hw-embed data-hw-ref="${escapeHtml(hwRefId)}" data-hw-student="${escapeHtml(student)}">
            ${head ? `<div class="hw-embed-head">${head}</div>` : ''}
            ${body}
          </div>
        </div>
      </div>
    </div>`;
  }

  function curActivateReview(sessionId, tab) {
    if (!sessionId) return;
    state.curriculum.activeReview = sessionId;
    if (tab) state.curriculum.reviewTab = tab;
    refreshCurriculumWidgetBody();
    setTimeout(() => {
      const em = document.querySelector('.cur-review.is-active .hw-embed');
      em?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 60);
  }
  function curCloseActiveReview() {
    if (!state.curriculum.activeReview) return;
    state.curriculum.activeReview = null;
    if (state.homework?.embedded) {
      try { clearTimeout(hwSaveTimer); } catch (_) {}
      state.homework = homeworkDefault();
    }
    refreshCurriculumWidgetBody();
  }

  /* ── 커리큘럼 항목 드래그로 이동/복사 · Ctrl+C/V · 자료함(iframe)에서 끌어오기 ── */
  let _curDrag = null, _curClip = null, _curHoverDrop = null, _curHoverCard = null, _extDrag = null;
  function _activeDrag() { return _curDrag || _extDrag; }
  // 크로스오리진 iframe(자료함) 드래그는 부모창에 네이티브 drop 이벤트를 주지 않는다.
  // → 일반 mousemove 때 화면좌표↔뷰포트좌표 보정값을 기억해 두고, iframe 이 알려준
  //   드롭 지점(screenX/Y)을 뷰포트 좌표로 환산해 elementFromPoint 로 칸을 찾는다.
  let _ptrOffset = { x: 0, y: 0 }, _ptrOffsetSet = false;
  function _calibPtr(e) {
    if (e && typeof e.screenX === 'number' && typeof e.clientX === 'number' && (e.screenX || e.clientX)) {
      _ptrOffset = { x: e.screenX - e.clientX, y: e.screenY - e.clientY };
      _ptrOffsetSet = true;
    }
  }
  ['mousemove', 'pointerdown', 'mouseover', 'dragover'].forEach(t =>
    document.addEventListener(t, _calibPtr, true));
  // 정확히 유튜브/강의 칸에 놓지 않아도, 같은 회차(1일차 등) 영역 안이면 자동으로
  // 그 유형(유튜브면 유튜브 칸, 강의면 강의 칸)에 들어가게 한다 — 어차피 유형이 정해져
  // 있으니 정확한 칸까지 맞출 필요는 없게.
  function _curResolveDropZone(el, dragType) {
    if (!el || !dragType) return null;
    const direct = el.closest && el.closest('[data-cur-drop]');
    if (direct) {
      const t = _curJSON(direct.getAttribute('data-cur-drop'));
      if (t && t.type === dragType) return direct;
    }
    const tier = el.closest && el.closest('.cur-tier');
    if (tier) {
      const zones = tier.querySelectorAll('[data-cur-drop]');
      for (const z of zones) {
        const t = _curJSON(z.getAttribute('data-cur-drop'));
        if (t && t.type === dragType) return z;
      }
    }
    return null;
  }
  async function _extDropAtScreen(sx, sy) {
    if (!_extDrag || sx == null) {
      console.warn('[커리큘럼 드래그] 드롭 시점에 드래그 정보가 없습니다 — 시작 메시지가 안 왔을 수 있어요.');
      return false;
    }
    const cx = sx - _ptrOffset.x, cy = sy - _ptrOffset.y;
    const el = document.elementFromPoint(cx, cy);
    const zone = _curResolveDropZone(el, _extDrag.type);
    if (!zone) {
      message('여기에는 놓을 수 없어요 — 회차(1일차 등)의 유튜브/강의 영역 안에 놓아주세요.', 'error');
      return false;
    }
    const t = _curJSON(zone.getAttribute('data-cur-drop'));
    const student = curriculumCurrentStudent();
    if (!student) {
      message('학생이 선택되지 않아 추가하지 못했습니다 — 강의실 위젯에서 학생을 먼저 선택하세요.', 'error');
      return false;
    }
    const list = _extDrag.items && _extDrag.items.length ? _extDrag.items : [{ ref_id: _extDrag.ref_id, title: _extDrag.title }];
    const have = new Set([...zone.querySelectorAll('.cur-it[data-cur-drag]')]
      .map(c => _curJSON(c.getAttribute('data-cur-drag'))?.ref_id).filter(Boolean));
    let n = 0;
    let failMsg = '';
    for (const it of list) {
      if (have.has(it.ref_id)) continue;
      try { await CurriculumStore.assign({ student, section: t.section, type: _extDrag.type, ref_id: it.ref_id, title: it.title }); n++; }
      catch (err) { failMsg = err?.message || String(err); }
    }
    await loadCurriculumBoard();
    if (n) message(`${_extDrag.type === 'lecture' ? '강의' : '유튜브'} ${n}개 추가`, 'ok');
    else if (failMsg) message('추가 실패: ' + failMsg, 'error');
    else message('이미 추가되어 있는 항목입니다.', 'error');
    return true;
  }
  let _extGhostEl = null;
  function _extGhost(sx, sy) {
    if (sx == null) return;
    if (!_extGhostEl) {
      _extGhostEl = document.createElement('div');
      _extGhostEl.className = 'cur-ext-ghost';
      document.body.appendChild(_extGhostEl);
    }
    const n = (_extDrag?.items?.length) || 1;
    _extGhostEl.textContent = (_extDrag?.type === 'lecture' ? '강의' : '유튜브') + (n > 1 ? ` ${n}개` : ` · ${_extDrag?.title || ''}`.slice(0, 24));
    _extGhostEl.style.left = (sx - _ptrOffset.x + 14) + 'px';
    _extGhostEl.style.top = (sy - _ptrOffset.y + 14) + 'px';
  }
  function _extGhostClear() {
    if (_extGhostEl) { _extGhostEl.remove(); _extGhostEl = null; }
  }
  function _extHintAtScreen(sx, sy) {
    if (!_extDrag || sx == null) return;
    _extGhost(sx, sy);
    const el = document.elementFromPoint(sx - _ptrOffset.x, sy - _ptrOffset.y);
    const zone = _curResolveDropZone(el, _extDrag.type);
    document.querySelectorAll('.cur-drop-hint').forEach(h => { if (h !== zone) h.classList.remove('cur-drop-hint'); });
    if (zone) zone.classList.add('cur-drop-hint');
  }
  const _curJSON = s => { try { return JSON.parse(s); } catch (_) { return null; } };
  // 현재 커리큘럼의 유튜브 ref_id 전체를 "영상목록" 위젯 iframe 에 전달 (배정된 것 표시용).
  // 일반 영상 모듈(moduleFrame, 마스터 목록)에는 보내지 않는다 — 학생과 무관해야 함.
  function curPushAssignedToLib() {
    const b = state.curriculum.board;
    const frame = curLibWidgetFrame('youtube');
    if (!b || !frame) return;
    const ids = new Set();
    const grab = arr => (arr || []).forEach(i => { if (i.type === 'youtube') ids.add(i.ref_id); });
    grab(b.common); grab(b.personal);
    (b.sessions || []).forEach(s => grab(s.items));
    try { frame.contentWindow.postMessage({ type: 'koredu-cur-assigned', videoIds: [...ids] }, 'http://localhost:8120'); } catch (_) {}
  }

  // 영상목록/강의목록 위젯에서 온 메시지 전용 처리 — 드래그배정·이미배정표시만.
  function handleCurLibWidgetMessage(event, libKind) {
    const data = event.data || {};
    if (data.type === 'koredu-lib-drag') {
      const type = data.kind === 'lecture' ? 'lecture' : 'youtube';
      const items = Array.isArray(data.items) && data.items.length
        ? data.items.map(it => ({ ref_id: String(it.ref_id || it.videoId || ''), title: String(it.title || it.ref_id || it.videoId || '') })).filter(it => it.ref_id)
        : [{ ref_id: String(data.ref_id || data.videoId || ''), title: String(data.title || data.ref_id || data.videoId || '') }];
      _extDrag = { type, ref_id: items[0]?.ref_id || '', title: items[0]?.title || '', items, section: '__ext__' };
      if (_extDrag.ref_id) document.body.classList.add('koredu-ext-drag');
      return;
    }
    if (data.type === 'koredu-lib-drag-move') {
      _extHintAtScreen(data.screenX, data.screenY);
      return;
    }
    if (data.type === 'koredu-lib-drag-end') {
      // iframe 이 알려준 드롭 지점에 칸이 있으면 배정 (네이티브 drop 은 크로스오리진에서 안 옴)
      _extGhostClear();
      _extDropAtScreen(data.screenX, data.screenY);
      setTimeout(() => {
        _extDrag = null;
        document.body.classList.remove('koredu-ext-drag');
        document.querySelectorAll('.cur-drop-hint').forEach(el => el.classList.remove('cur-drop-hint'));
      }, 50);
      return;
    }
    if (data.type === 'koredu-request-cur-assigned') {
      if (libKind === 'youtube') curPushAssignedToLib();
      return;
    }
    if (data.type === 'koredu-open-lecture') {
      // 가운데(모듈) 화면은 유튜브 등 다른 걸 보고 있을 수 있으니 건드리지 않는다 — 강의목록
      // 위젯 자기 자리(오른쪽)에서 그 강의를 그대로 연다.
      if (!data.lessonId) return;
      const frame = curLibWidgetFrame('lecture');
      if (frame) {
        const ctx = previewContext();
        const q = `embed=1&role=${ctx.role}&level=${ctx.level || 1}&access=${state.user?.access || 'free'}`;
        frame.src = `http://localhost:8121/${encodeURIComponent(data.lessonId)}/index.html?${q}`;
      }
      return;
    }
    if (data.type === 'koredu-lib-list') {
      state.curriculum.libList = Array.isArray(data.videos) ? data.videos : [];
      if (state.widgetMulti.includes('curriculum') || document.querySelector('#curDashBoard')) {
        const headEl = (widgetMultiGrid || document).querySelector('[data-widget-header-tools="curriculum"]')
          || document.querySelector('#curDashBoard .cur-board-head');
        curRefreshHead(headEl);
      }
      return;
    }
  }

  // 선택된 유튜브를 규칙대로 배치: "매 M회차마다 N개" (윈도우 앞 N개 세션에 1개씩, 나머지는 비움).
  // 학생 레벨 규칙(dist_rules)에서 허용한 영상 레벨만.
  // 강의실 "수업자동배치"는 위젯을 연 적이 없어도 동작해야 한다 — 위젯을 열어 체크해둔 적이
  // 없으면(자료함 iframe이 화면에 있지도 않아 체크 자체가 불가능한 상태) 보이지 않는 iframe을
  // 하나 잠깐 띄워 카탈로그 전체를 받아온다. 위젯에서 드래그로 배정하는 흐름은 그대로 체크 목록을 쓴다.
  function siFetchFullYoutubeLibrary(timeoutMs = 5000) {
    return new Promise((resolve) => {
      const ctx = previewContext();
      const origin = MODULE_ORIGINS.youtube;
      const frame = document.createElement('iframe');
      frame.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;border:0';
      frame.src = `${origin}/?embed=1&role=${ctx.role}&level=${ctx.level || 1}`;
      const requestId = 'lib' + Date.now() + Math.random().toString(36).slice(2);
      let done = false;
      const cleanup = () => { window.removeEventListener('message', onMsg); frame.remove(); };
      const onMsg = (e) => {
        if (e.origin !== origin) return;
        const d = e.data;
        if (!d || d.type !== 'koredu-full-library' || d.requestId !== requestId) return;
        done = true; cleanup();
        resolve(Array.isArray(d.videos) ? d.videos : []);
      };
      window.addEventListener('message', onMsg);
      frame.addEventListener('load', () => {
        try { frame.contentWindow.postMessage({ type: 'koredu-request-full-library', requestId }, origin); } catch (_) {}
      });
      document.body.appendChild(frame);
      setTimeout(() => { if (!done) { cleanup(); resolve([]); } }, timeoutMs);
    });
  }
  async function curDistributeYoutube(_ignored, fromSeq) {
    const sessions = state.curriculum.board?.sessions || [];
    const student = curriculumCurrentStudent();
    const slv = String(state.curriculum.roster?.students?.find(s => s.email === student)?.level ?? '1');
    const rule = curDistRules().youtube[slv] || { every: 1, count: 1, levels: ['0', '1', '2', '3'] };
    const M = Math.max(1, Number(rule.every) || 1);
    const N = Math.max(0, Number(rule.count) || 0);
    if (N <= 0) return;
    const allowed = new Set(rule.levels);
    // 자료함 위젯에서 체크해둔 게 있으면 그걸 쓰고, 없으면(보통 여기 — 강의실에서 바로 누른 경우)
    // 카탈로그 전체를 가져와 레벨 규칙으로만 거른다. (번역 완료 등 추가 필터는 나중에 설정으로.)
    let source = state.curriculum.libList || [];
    let fromWidget = source.length > 0;
    if (!fromWidget) source = await siFetchFullYoutubeLibrary();
    let list = source.filter(v => !v.level || allowed.has(String(v.level)));
    const skipped = source.length - list.length;
    const ytSort = state.curriculum.pace?.yt_sort || 'added';
    if (ytSort === 'name') list = list.slice().sort((a, z) => String(a.title || '').localeCompare(String(z.title || ''), 'ko'));
    else if (ytSort === 'random') list = list.slice().sort(() => Math.random() - 0.5);
    if (!list.length || !sessions.length) { alert('배치할 목록이나 회차가 없습니다.' + (skipped ? ` (레벨 규칙으로 ${skipped}개 제외)` : '')); return; }
    const start = Math.max(0, fromSeq - 1);
    let i = 0, placed = 0;
    for (let s = start; s < sessions.length && i < list.length; s++) {
      if ((s - start) % M >= N) continue;               // 윈도우의 앞 N개 세션만
      const sess = sessions[s];
      const have = new Set((sess.items || []).filter(it => it.type === 'youtube').map(it => it.ref_id));
      while (i < list.length) {
        const v = list[i++];
        if (have.has(v.videoId)) continue;               // 같은 회차 중복 금지
        try {
          await CurriculumStore.assign({ student, section: sess.date, type: 'youtube', ref_id: v.videoId, title: v.title });
          placed++;
        } catch (_) {}
        break;                                           // 세션당 1개
      }
    }
    await loadCurriculumBoard();
    message(`유튜브 ${placed}개 배치 (${fromSeq}회차부터, 매${M}회차 ${N}개)${skipped ? ` · 레벨 제외 ${skipped}` : ''}`, 'ok');
  }

  async function curPlaceItem(item, target, copy) {
    if (!item || !target || item.type !== target.type) return;
    if (String(item.section) === String(target.section)) return;
    const student = curriculumCurrentStudent();
    try {
      await CurriculumStore.assign({ student, section: target.section, type: item.type, ref_id: item.ref_id, title: item.title });
      if (!copy && item.id) { try { await CurriculumStore.unassign(item.id); } catch (_) {} }
      await loadCurriculumBoard();
      message(copy ? '복사됨' : '이동됨', 'ok');
    } catch (err) { alert(err.message); }
  }
  let _curDragEndAt = 0;
  document.addEventListener('dragstart', e => {
    const card = e.target.closest && e.target.closest('.cur-it[data-cur-drag]');
    if (!card) return;
    // 손잡이(⠿)에서 시작한 드래그만 허용 — 카드 본문 드래그는 클릭 이동과 충돌
    if (!e.target.closest('[data-cur-grip]')) { e.preventDefault(); return; }
    _curDrag = _curJSON(card.getAttribute('data-cur-drag'));
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copyMove';
      try { e.dataTransfer.setData('text/plain', _curDrag?.title || ''); } catch (_) {}
      try { e.dataTransfer.setDragImage(card, 16, 16); } catch (_) {}
    }
    card.classList.add('cur-it-dragging');
  });
  document.addEventListener('dragend', () => {
    document.querySelectorAll('.cur-it-dragging').forEach(el => el.classList.remove('cur-it-dragging'));
    document.querySelectorAll('.cur-drop-hint').forEach(el => el.classList.remove('cur-drop-hint'));
    _curDrag = null;
    _curDragEndAt = Date.now();
  });
  document.addEventListener('dragover', e => {
    const drag = _activeDrag();
    const zone = e.target.closest && e.target.closest('[data-cur-drop]');
    if (!zone || !drag) return;
    const t = _curJSON(zone.getAttribute('data-cur-drop'));
    if (!t || t.type !== drag.type || String(t.section) === String(drag.section)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = (_extDrag || e.ctrlKey) ? 'copy' : 'move';
    document.querySelectorAll('.cur-drop-hint').forEach(el => { if (el !== zone) el.classList.remove('cur-drop-hint'); });
    zone.classList.add('cur-drop-hint');
  });
  document.addEventListener('drop', e => {
    const drag = _activeDrag();
    const zone = e.target.closest && e.target.closest('[data-cur-drop]');
    if (!zone || !drag) return;
    e.preventDefault();
    zone.classList.remove('cur-drop-hint');
    const fromExt = !!_extDrag;
    _curDrag = null; _extDrag = null;
    document.body.classList.remove('koredu-ext-drag');
    curPlaceItem(drag, _curJSON(zone.getAttribute('data-cur-drop')), fromExt || e.ctrlKey);
  });
  document.addEventListener('mousemove', e => {
    const t = e.target;
    if (!t || !t.closest) return;
    const zone = t.closest('[data-cur-drop]');
    if (zone) { _curHoverDrop = _curJSON(zone.getAttribute('data-cur-drop')); _curHoverDrop._el = zone; }
    const card = t.closest('.cur-it[data-cur-drag]');
    _curHoverCard = card ? _curJSON(card.getAttribute('data-cur-drag')) : _curHoverCard;
    document.querySelectorAll('.cur-it-clip-src').forEach(el => el.classList.remove('cur-it-clip-src'));
  });
  document.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)) return;
    const k = (e.key || '').toLowerCase();
    if (k === 'c' && _curHoverCard) {
      _curClip = _curHoverCard;
      message(`"${_curClip.title || _curClip.ref_id}" 복사됨 — 다른 칸 위에서 Ctrl+V`, 'ok');
    } else if (k === 'v' && _curClip && _curHoverDrop) {
      curPlaceItem(_curClip, _curHoverDrop, true);
    }
  });

  // 표 프레임: 좌열=계층명(+토글), 우측=유튜브 열 | 강의 열. 회차는 그 아래 단어·Q·A·복습.
  function curTierHtml(tierKey, nameHtml, items, deletable, sessionId, opts = {}) {
    const collapsed = curCollapsed(tierKey);
    const sk = opts.sectionKey || '';
    const cols = collapsed ? '' : `<div class="cur-tier-cols">
        <div class="cur-tcol cur-t-youtube"><button type="button" class="cur-tcol-head" data-cur-src="youtube" data-cur-session="${escapeHtml(sessionId || '')}" title="유튜브 목록 열기 (드래그해서 넣기)">유튜브 <small class="cur-tcol-hint">(영상을 배치하려면 클릭하세요)</small> <span class="cur-tcol-open">＋목록</span></button>
          <div class="cur-tcol-body">${curTypeBodyHtml(tierKey, 'youtube', items, deletable, sessionId, sk)}</div></div>
        <div class="cur-tcol cur-t-lecture"><button type="button" class="cur-tcol-head" data-cur-src="lecture" data-cur-session="${escapeHtml(sessionId || '')}" title="강의 목록 열기 (드래그해서 넣기)">강의 <small class="cur-tcol-hint">(교재를 배치하려면 클릭하세요)</small> <span class="cur-tcol-open">＋목록</span></button>
          <div class="cur-tcol-body">${curTypeBodyHtml(tierKey, 'lecture', items, deletable, sessionId, sk)}</div></div>
      </div>`;
    let extra = '';
    if (opts.session && !collapsed) {
      const n = opts.notes || {};
      const wordRefs = items.filter(it => it.type === 'word').map(it => it.ref_id);
      const wordBtns = wordRefs.length
        ? `<span class="cur-erow-tools">
             <button type="button" class="cur-words-sayall" data-cur-say-all="${escapeHtml(wordRefs[0])}" title="전체 듣기">🔊 전체</button>
             <button type="button" class="cur-words-upd" data-cur-word-update="${escapeHtml(wordRefs[0])}" title="단어 update">↻</button>
           </span>` : '';
      const wordHas = items.some(it => it.type === 'word');
      const qaHas = !!(n.q || n.a);
      extra = `<div class="cur-tier-extra">
        ${curErowHtml(sessionId, 'word', '단어', wordHas, curTypeBodyHtml(tierKey, 'word', items, deletable, sessionId), wordBtns)}
        ${curErowHtml(sessionId, 'qa', '메모', qaHas, curQABodyHtml(sessionId, n))}
        ${curErowHtml(sessionId, 'sentence', '문장', !!state.curriculum.sentences[sessionId]?.length, curSentenceCellHtml(sessionId))}
        ${curErowHtml(sessionId, 'review', curReviewTabLabel(), curReviewHasContent(sessionId, n), curReviewCellHtml(sessionId))}
      </div>`;
    }
    return `<section class="cur-tier${collapsed ? ' is-collapsed' : ''}${opts.locked ? ' cur-locked' : ''}" data-cur-tier="${escapeHtml(tierKey)}">
      <div class="cur-tier-main">
        <div class="cur-tier-name">
          <button type="button" class="cur-tier-tog" data-cur-collapse="${escapeHtml(tierKey)}">
            <span class="cur-tog">${curToggleIcon(tierKey)}</span>
            <span class="cur-tier-name-txt">${nameHtml}</span>
          </button>
          ${opts.xtra ? `<span class="cur-tier-xtra">${opts.xtra}</span>` : ''}
        </div>
        ${cols}
      </div>
      ${opts.locked && !collapsed ? '<div class="cur-lock-note">🔒 아직 시작되지 않은 회차입니다 · 내용만 볼 수 있어요</div>' : ''}
      ${extra}
    </section>`;
  }

  const CUR_TYPE_LABELS = { all: '전체', youtube: '유튜브', lecture: '강의', word: '단어', qa: '메모', sentence: '문장', talk: '대화', board: '판서', review: '복습' };

  // 유형 필터 = 그 유형만 평면 나열 (회차순 / 이름순)
  function curFilterListHtml(b, type) {
    const c = state.curriculum;
    const sort = c.filterSort || 'session';
    let wordAllCollapsed = false;
    if (type === 'word') {
      const wordRefsAll = [...(b.common || []), ...(b.personal || []), ...((b.sessions || []).flatMap(s => s.items || []))]
        .filter(it => it.type === 'word').map(it => it.ref_id);
      wordAllCollapsed = wordRefsAll.length > 0 && wordRefsAll.every(ref => c.wordCollapsed[ref]);
    }
    const sortBar = type === 'word'
      ? `<div class="cur-flsort">
          <button type="button" class="${sort === 'session' && !c.wordMergeAll ? 'on' : ''}" data-cur-flsort="session" ${c.wordMergeAll ? 'disabled' : ''}>회차순</button>
          <button type="button" class="${sort === 'name' && !c.wordMergeAll ? 'on' : ''}" data-cur-flsort="name" ${c.wordMergeAll ? 'disabled' : ''}>이름순</button>
          <span class="cur-hsep">|</span>
          <button type="button" class="${c.wordMergeAll ? 'on' : ''}" data-cur-word-mergeall>전체보기</button>
          <span class="cur-hsep">|</span>
          <button type="button" class="cur-word-collapse-all-btn" data-cur-word-collapse-all title="단어 회차 모두 접기/펼치기" ${c.wordMergeAll ? 'disabled' : ''}>${wordAllCollapsed ? '+' : '−'}</button>
          <span class="cur-hsep">|</span>
          <button type="button" class="cur-words-sayall" data-cur-say-all-checked title="체크한 회차만 순서대로 듣기" ${c.wordMergeAll ? 'disabled' : ''}>🔊 전체듣기</button>
        </div>`
      : `<div class="cur-flsort">
          <button type="button" class="${sort === 'session' ? 'on' : ''}" data-cur-flsort="session">회차순</button>
          <button type="button" class="${sort === 'name' ? 'on' : ''}" data-cur-flsort="name">이름순</button>
        </div>`;
    // Memo(QA) = 회차별 질문·답변. "1차/날짜"는 별도 줄 없이 학생 칸 위(마이크 위)에 세로로 쌓는다.
    if (type === 'qa') {
      const rows = (b.sessions || []).map(s => {
        const dateShort = escapeHtml(String(s.date || '').slice(2).replace(/-/g, '.'));
        const headLabel = `<b class="cur-qa-seq">${s.seq}차</b><span class="cur-qa-date">${dateShort}</span>`;
        return `<div class="cur-fl-qa">${curQABodyHtml(s.id, s.notes || {}, headLabel)}</div>`;
      }).join('');
      return `<div class="cur-fl-body cur-fl-qabody">${rows || '<div class="cur-none" style="padding:16px">회차가 없습니다.</div>'}</div>`;
    }
    // 문장 = 회차별로 저장된 문장을 목록 안에서 바로 보여준다.
    if (type === 'sentence') {
      const rows = (b.sessions || []).map(s => {
        const dateShort = escapeHtml(String(s.date || '').slice(2).replace(/-/g, '.'));
        return `<div class="cur-fl-sentence"><div class="cur-fl-sentence-h"><b>${s.seq}차</b> <span>${dateShort}</span></div>${curSentenceCellHtml(s.id)}</div>`;
      }).join('');
      return `<div class="cur-fl-body cur-fl-sentencelist">${rows || '<div class="cur-none" style="padding:16px">회차가 없습니다.</div>'}</div>`;
    }
    // 대화 / 판서 / 복습 = 회차별로 실제 내용(대화창·판서·복습)을 목록 안에서 바로 보여준다.
    // 회차가 여러 개면 내용이 통째로 다 펼쳐져 너무 길어지니, 회차마다 +/- 로 접고 펼 수 있게 한다.
    if (type === 'talk' || type === 'board' || type === 'review') {
      const rows = (b.sessions || []).map(s => {
        const has = type === 'review' ? curReviewHasContent(s.id, s.notes || {})
          : type === 'talk' ? !!s.has_talk
          : !!s.has_board;
        const dateShort = escapeHtml(String(s.date || '').slice(2).replace(/-/g, '.'));
        const ck = `fl:${type}:${s.id}`;
        const col = curCollapsed(ck);
        return `<div class="cur-fl-talk${col ? ' is-collapsed' : ''}">
          <div class="cur-fl-talk-h">
            <button type="button" class="cur-erow-tog" data-cur-collapse="${escapeHtml(ck)}" aria-label="접기/펼치기">${col ? '＋' : '－'}</button>
            ${has ? '<span class="cur-fl-has has" title="내용 있음">●</span>' : ''}
            <b>${s.seq}차</b> <span>${dateShort}</span>
          </div>
          ${col ? '' : curReviewCellHtmlFor(s.id, type)}
        </div>`;
      }).join('');
      return `<div class="cur-fl-body cur-fl-talklist">${rows || '<div class="cur-none" style="padding:16px">회차가 없습니다.</div>'}</div>`;
    }
    const rows = [];
    (b.common || []).forEach(it => rows.push({ it, src: '공통', order: 0 }));
    (b.personal || []).forEach(it => rows.push({ it, src: '학생', order: 1 }));
    (b.sessions || []).forEach((s, i) => (s.items || []).forEach(it => rows.push({ it, src: `${s.seq}차`, order: 2 + i })));
    let list = rows.filter(r => r.it.type === type);
    if (sort === 'name') list.sort((a, z) => String(a.it.title || a.it.ref_id).localeCompare(String(z.it.title || z.it.ref_id), 'ko'));
    else list.sort((a, z) => a.order - z.order);
    let inner;
    if (!list.length) inner = '<div class="cur-none" style="padding:16px">항목이 없습니다.</div>';
    else if (type === 'youtube' || type === 'lecture') {
      const grid = type === 'youtube' ? 'cur-grid-yt' : 'cur-grid-lec';
      inner = `<div class="cur-cell-grid ${grid}">${list.map(r => curLinkCardHtml(r.it, false, '', r.src)).join('')}</div>`;
    } else if (type === 'word') {
      if (c.wordMergeAll) {
        const refs = list.map(r => r.it.ref_id);
        inner = `<div class="cur-words cur-words-merged" data-cur-wordlist-all="${escapeHtml(refs.join(','))}">
          <div class="cur-words-head"><span class="cur-words-src">전체 단어 (중복 제거 · 이름순)</span>
            <button type="button" class="cur-words-sayall" data-cur-say-all-merged="${escapeHtml(refs.join(','))}">🔊 전체듣기</button></div>
          <div class="cur-words-list">불러오는 중…</div></div>`;
      } else {
        inner = list.map(r => {
          const collapsed = !!c.wordCollapsed[r.it.ref_id];
          const checked = c.wordChecked[r.it.ref_id] !== false;   // 기본값: 전부 체크된 상태로 시작
          return `<div class="cur-words ${collapsed ? 'is-collapsed' : ''}" data-cur-wordlist="${escapeHtml(r.it.ref_id)}">
            <div class="cur-words-head">
              <button type="button" class="cur-words-toggle" data-cur-word-toggle="${escapeHtml(r.it.ref_id)}" title="접기/펼치기">${collapsed ? '+' : '−'}</button>
              <label class="cur-words-check"><input type="checkbox" data-cur-word-check="${escapeHtml(r.it.ref_id)}" ${checked ? 'checked' : ''}><span class="cur-words-src">${escapeHtml(r.src)}</span></label>
            </div>
            <div class="cur-words-list">불러오는 중…</div></div>`;
        }).join('');
      }
    }
    return `${sortBar}<div class="cur-fl-body">${inner}</div>`;
  }

  function curItemVisible(it) {
    const f = state.curriculum.typeFilter;
    if (f !== 'all' && it.type !== f) return false;
    if (f === 'review' && state.curriculum.reviewIncomplete) {
      const p = it.progress || {};
      const total = Number(p.total) || 0;
      if (total > 0 && Number(p.max_reached) >= total) return false; // 100% 는 숨김
    }
    return true;
  }
  function curFilterBarHtml() {
    const c = state.curriculum;
    const f = c.typeFilter;
    const btns = Object.entries(CUR_TYPE_LABELS).map(([k, lbl]) =>
      `<button type="button" class="cur-fbtn ${f === k ? 'on' : ''}" data-cur-filter="${k}">${lbl}</button>`).join('');
    return `<div class="cur-filterbar">${btns}</div>`;
  }

  const CUR_GRID_TYPES = ['youtube', 'lecture', 'word', 'review'];
  const CUR_GRID_HEAD = { youtube: '튜', lecture: '강', word: '단', review: '복' };
  function curGridCell(items, type) {
    const of = items.filter(it => it.type === type);
    if (!of.length) return '<td class="cur-gc"></td>';
    let done = 0, total = 0;
    of.forEach(it => {
      const p = it.progress || {};
      const t = Number(p.total) || 0;
      if (t > 0) { total += t; done += Math.min(t, Number(p.max_reached) || 0); }
    });
    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    return `<td class="cur-gc cur-t-${type}">
      <span class="cur-gc-n">${of.length}</span>
      <span class="cur-gc-bar"><i style="width:${pct}%"></i></span>
    </td>`;
  }
  function curGridRow(label, items, cls = '') {
    return `<tr class="${cls}"><th>${escapeHtml(label)}</th>${CUR_GRID_TYPES.map(t => curGridCell(items, t)).join('')}</tr>`;
  }
  function curriculumGridHtml(b) {
    const rows = [];
    if ((b.common || []).length) rows.push(curGridRow('전체공통', b.common));
    if ((b.personal || []).length) rows.push(curGridRow('학생공통', b.personal));
    (b.sessions || []).forEach(s => {
      const d = String(s.date || '').slice(5).replace('-', '/');
      rows.push(curGridRow(`${s.seq}일차 ${d}`, s.items || [], s.done ? 'done' : 'ongoing'));
    });
    if (!rows.length) return '<div class="cur-none" style="padding:16px">배정된 자료가 없습니다.</div>';
    return `<div class="cur-grid-wrap"><table class="cur-grid">
      <thead><tr><th></th>${CUR_GRID_TYPES.map(t => `<th class="cur-t-${t}">${CUR_GRID_HEAD[t]}</th>`).join('')}</tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table></div>`;
  }
  function curriculumWidgetBodyHtml() {
    if (!state.user) return `<div class="widget-empty"><strong>강의실</strong><p>로그인이 필요합니다.</p></div>`;
    const c = state.curriculum;
    if (c.loading) return `<div class="cur-root"><div class="cur-msg">불러오는 중…</div></div>`;
    if (c.error) return `<div class="cur-root"><div class="cur-msg err">${escapeHtml(c.error)}</div></div>`;
    if (!curriculumIsStudent() && !(c.roster?.students || []).length) {
      return `<div class="widget-empty"><strong>강의실</strong><p>담당 학생이 없습니다. 회원관리에서 학생을 배정하세요.</p></div>`;
    }
    const b = c.board;
    if (!b) return `<div class="cur-root"><div class="cur-msg">학생을 선택하세요.</div></div>`;

    if (c.view === 'grid') {
      return `<div class="cur-root">${curriculumGridHtml(b)}</div>`;
    }
    // 유형 필터가 걸리면 = 그 유형만 평면 나열
    if (c.typeFilter !== 'all') {
      return `<div class="cur-root cur-tree">${curFilterListHtml(b, c.typeFilter)}</div>`;
    }

    // ── 트리 뷰: 표 프레임 (계층 → 유튜브 | 강의 | (회차: 단어·Q·A·복습)) ──
    const tierCommon = curTierHtml('common', '<strong>전체공통</strong>', b.common || [], c.canManage, '', { sectionKey: 'common' });
    const tierPersonal = curTierHtml('personal', '<strong>학생공통</strong>', b.personal || [], c.canManage, '', { sectionKey: 'personal' });

    const asStudent = !c.canManage || c.previewAs === 'student';
    const sessionTiers = (b.sessions || []).map(s => {
      const label = `<strong>${s.seq}일차</strong>`;
      const locked = asStudent && !s.started;
      // 날짜 = 시작 체크한 날 (시작 전엔 표시 안 함)
      const dTxt = s.started && s.started_at
        ? new Date(Number(s.started_at) * 1000).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })
        : '';
      const xtra = (dTxt ? `<span class="cur-tier-date">${escapeHtml(dTxt)}</span>` : '')
        + (c.canManage
          ? `<label class="cur-start-lbl"><input type="checkbox" data-cur-start="${escapeHtml(s.id)}" ${s.started ? 'checked' : ''}> 시작</label>
             <label class="cur-done-lbl"><input type="checkbox" data-cur-done="${escapeHtml(s.id)}" ${s.done ? 'checked' : ''}> 완료</label>
             <span class="cur-sess-delrow">
               <input type="checkbox" class="cur-sess-delchk" data-cur-sess-delchk="${escapeHtml(s.id)}" ${s.done ? 'disabled' : ''} ${(c.sessDelChecked || {})[s.id] ? 'checked' : ''} title="일괄 삭제할 회차로 선택">
               <button type="button" class="cur-sess-del" data-cur-session-del="${escapeHtml(s.id)}" ${s.done ? 'disabled' : ''} title="${s.done ? '완료된 회차는 삭제 불가' : '이 회차 삭제'}">🗑</button>
             </span>`
          : (s.done ? '<span class="cur-done-badge">완료</span>' : (s.started ? '' : '<span class="cur-lock-badge">🔒 대기</span>')));
      return curTierHtml(`sess:${s.id}`, label, s.items || [], c.canManage, s.id, { session: true, notes: s.notes, xtra, sectionKey: s.date, locked });
    }).join('');

    return `<div class="cur-root cur-tree">
      ${c.showBulkCfg && c.canManage ? curBulkCfgHtml() : ''}
      ${tierCommon}
      ${tierPersonal}
      ${sessionTiers || '<div class="cur-none" style="padding:14px">수업일이 아직 없습니다.</div>'}
    </div>`;
  }

  // 수업자동배치 규칙 설정 패널 (⚙)
  // Guest는 급수(Korean Level)가 아니라 role(회원유형)로 관리한다 — 여기서는 뺀다.
  const CUR_LV = [['1', '초급'], ['2', '중급'], ['3', '고급']];
  // 급수 표시: 1→초급, 2→중급, 3→고급
  function curLevelName(lv) {
    const k = String(lv ?? '1');
    return (CUR_LV.find(x => x[0] === k) || CUR_LV[0])[1];
  }
  function curLevelLabel(lv) {
    const k = Number.isFinite(Number(lv)) ? Number(lv) : 1;
    return `${curLevelName(k)} Lev${k}`;
  }
  function curEnsureRules() {
    const p = state.curriculum.pace = state.curriculum.pace || {};
    p.dist_rules = curDistRules();
    return p.dist_rules;
  }
  function curDistRules() {
    const p = state.curriculum.pace || {};
    const r = (p.dist_rules && typeof p.dist_rules === 'object') ? p.dist_rules : {};
    const dflt = { every: 1, count: 1, levels: ['1', '2', '3'] };
    const norm = t => {
      const o = r[t] || {};
      const out = {};
      CUR_LV.forEach(([k]) => {
        const row = o[k] || {};
        out[k] = {
          every: Math.max(1, Number(row.every) || dflt.every),
          // count는 0(=이 레벨엔 배치 안 함)도 유효한 값이라 ||로 기본값 채우면 안 된다.
          // 저장된 적 없을 때(null/undefined)만 기본값, 그 외엔 숫자 그대로(NaN이면 0) 사용.
          count: Math.max(0, row.count == null ? dflt.count : (Number(row.count) || 0)),
          levels: Array.isArray(row.levels) ? row.levels : dflt.levels.slice(),
        };
      });
      return out;
    };
    return { youtube: norm('youtube'), lecture: norm('lecture') };
  }
  function curBulkCfgHtml() {
    const p = state.curriculum.pace || {};
    const rules = curDistRules();
    const ytSort = p.yt_sort || 'added';
    const sortOpt = (v, l) => `<option value="${v}" ${ytSort === v ? 'selected' : ''}>${l}</option>`;
    const cur = curriculumCurrentStudent();
    const curLvKey = String((state.curriculum.roster?.students || []).find(s => s.email === cur)?.level ?? '1');
    const cells = (type, lk, showLevels) => {
      const row = rules[type][lk];
      const chips = showLevels ? CUR_LV.map(([vk, vl]) =>
        `<button type="button" class="cur-lvchip ${row.levels.includes(vk) ? 'on' : ''}" data-cur-rule-lv="${type}|${lk}|${vk}">${vl}</button>`).join('') : '<span class="cur-rt-na">—</span>';
      return `<td class="cur-rt-lv">${CUR_LV.find(x => x[0] === lk)[1]}</td>
        <td class="cur-rt-cnt">
          <input type="number" class="cur-bulk-n" min="1" max="20" value="${row.every}" data-cur-rule-every="${type}|${lk}">회차당
          <input type="number" class="cur-bulk-n" min="0" max="9" value="${row.count}" data-cur-rule-cnt="${type}|${lk}">개</td>
        <td class="cur-rt-lvs">${chips}</td>`;
    };
    const grp = (type, label, showLevels) => CUR_LV.map(([lk], i) => {
      const cls = [i === 0 ? 'cur-rt-grp' : '', lk === curLvKey ? 'cur-rt-active' : ''].filter(Boolean).join(' ');
      return `<tr${cls ? ` class="${cls}"` : ''}>${i === 0 ? `<td rowspan="${CUR_LV.length}">${label}</td>` : ''}${cells(type, lk, showLevels)}</tr>`;
    }).join('');
    return `<div class="cur-bulkcfg">
      <div class="cur-bulkcfg-h">
        <strong>수업자동배치 규칙 (표준 커리큘럼)</strong>
        <span class="cur-rt-cur">현재 학생: ${escapeHtml(curLevelLabel(curLvKey))}</span>
        <label class="cur-rt-int">유튜브 배치 기준
          <select data-cur-pace="yt_sort">${sortOpt('added', '수집일순')}${sortOpt('date', '영상 날짜순')}${sortOpt('name', '이름순')}${sortOpt('random', '랜덤')}</select>
        </label>
        <button type="button" class="cur-rt-savebtn" data-cur-rule-save>저장</button>
        <button type="button" data-cur-bulk-cfg-close>✕</button>
      </div>
      <table class="cur-rt">
        <thead><tr><th></th><th>학생레벨</th><th>몇 회차당 · 몇 개</th><th>학습대상 영상레벨</th></tr></thead>
        <tbody>${grp('youtube', '유튜브', true)}${grp('lecture', '강의', false)}</tbody>
      </table>
    </div>`;
  }

  function curriculumBodyEl() {
    // 대시보드(#curDashBoard)에 있을 땐 그쪽을 채운다 — 예전엔 위젯 그리드 안에 이전에
    // 열어뒀던 강의실 위젯 패널이 (안 보이는 채로) 남아있으면 그쪽이 먼저 잡혀서, 정작
    // 대시보드의 학생 보드 화면은 계속 빈 채로 남는 문제가 있었다.
    return document.querySelector('#curDashBoard .cur-board-body')
      || (widgetMultiGrid || document).querySelector('[data-widget-panel="curriculum"] .widget-panel-body');
  }
  function refreshCurriculumWidgetBody() {
    const bodyEl = curriculumBodyEl();
    if (bodyEl) bodyEl.innerHTML = curriculumWidgetBodyHtml();
    const headEl = document.querySelector('#curDashBoard .cur-board-head')
      || (widgetMultiGrid || document).querySelector('[data-widget-header-tools="curriculum"]');
    curRefreshHead(headEl);
    if (bodyEl) { curFillTreeContent(bodyEl); curAutoGrowAll(bodyEl); }
  }

  function curWordButtonsHtml(words) {
    if (!words || !words.length) return '<span class="cur-cell-empty">단어 없음</span>';
    return words.map(w => {
      const sub = curWordTr(w);
      return `<button type="button" class="cur-word" data-cur-say="${escapeHtml(w.ko)}" title="눌러서 듣기">
        <span class="cur-word-korow">
          <span class="cur-word-audio" aria-hidden="true">🔊</span>
          <span class="cur-word-ko">${escapeHtml(w.ko)}</span>
        </span>
        ${sub ? `<span class="cur-word-sub">${escapeHtml(sub)}</span>` : ''}
      </button>`;
    }).join('');
  }

  // 문장 칸 = 그 회차에 저장된 문장 나열 — 렌더 후 비동기로 채운다.
  function curSentenceCellHtml(sessionId) {
    const student = curriculumCurrentStudent();
    return `<div class="cur-sentences" data-cur-sentences="${escapeHtml(sessionId)}" data-cur-sentences-student="${escapeHtml(student)}">
      <div class="cur-sentences-add">
        <input type="text" class="cur-sentence-add-input" data-cur-sentence-add-input placeholder="문장 추가">
        <button type="button" class="cur-sentence-add-btn" data-cur-sentence-add>+ 추가</button>
      </div>
      <div class="cur-sentences-list">불러오는 중…</div>
    </div>`;
  }
  // 문장을 넣거나 지운 뒤: 이 회차 칸의 캐시를 지워 다시 불러오게 하고, W15 위젯이
  // 마침 같은 회차를 보고 있으면 그쪽도 같이 새로고침한다.
  function curSentenceRefreshAfterChange(sessionId) {
    delete state.curriculum.sentences[sessionId];
    refreshCurriculumWidgetBody();
    if (_sentCtx && _sentCtx.sessionId === sessionId) sentFetchList().then(refreshSentenceWidgetBody);
  }
  async function curSentenceAdd(sessionId, student, text) {
    text = String(text || '').trim();
    if (!text || !sessionId || !student || !window.CurriculumStore) return;
    try {
      await CurriculumStore.addSentence(student, sessionId, text);
      curSentenceRefreshAfterChange(sessionId);
    } catch (e) { message('문장 저장 실패: ' + e.message, 'error'); }
  }
  async function curSentenceDelete(sessionId, student, id) {
    if (!sessionId || !student || !id || !window.CurriculumStore) return;
    try {
      await CurriculumStore.deleteSentence(student, sessionId, id);
      curSentenceRefreshAfterChange(sessionId);
    } catch (e) { message('문장 삭제 실패: ' + e.message, 'error'); }
  }
  document.addEventListener('click', e => {
    const addBtn = e.target.closest('[data-cur-sentence-add]');
    if (addBtn) {
      const wrap = addBtn.closest('.cur-sentences');
      const input = wrap?.querySelector('[data-cur-sentence-add-input]');
      if (wrap && input) { curSentenceAdd(wrap.dataset.curSentences, wrap.dataset.curSentencesStudent, input.value); input.value = ''; }
      return;
    }
    const delBtn = e.target.closest('[data-cur-sentence-del]');
    if (delBtn) {
      const wrap = delBtn.closest('.cur-sentences');
      if (wrap) curSentenceDelete(wrap.dataset.curSentences, wrap.dataset.curSentencesStudent, delBtn.dataset.curSentenceDel);
      return;
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.closest('[data-cur-sentence-add-input]')) {
      e.preventDefault();
      const wrap = e.target.closest('.cur-sentences');
      if (wrap) { curSentenceAdd(wrap.dataset.curSentences, wrap.dataset.curSentencesStudent, e.target.value); e.target.value = ''; }
    }
  });

  // 단어 칸 = 그날 단어 나열 / 복습 칸 = 일기장 첨삭 — 렌더 후 비동기로 채운다.
  async function curFillTreeContent(root) {
    if (!window.CurriculumStore) return;
    root.querySelectorAll('.cur-sentences[data-cur-sentences]').forEach(async el => {
      const sid = el.dataset.curSentences;
      const listEl = el.querySelector('.cur-sentences-list');
      if (!listEl || el.dataset.filled) return;
      el.dataset.filled = '1';
      try {
        let items = state.curriculum.sentences[sid];
        if (!items) {
          const student = curriculumCurrentStudent();
          items = student ? (await CurriculumStore.getSentences(student, sid)).items || [] : [];
          state.curriculum.sentences[sid] = items;
        }
        listEl.innerHTML = items.length
          ? items.map(s => `<div class="cur-sentence-row"><span>${escapeHtml(s.text)}</span><button type="button" class="cur-sentence-del-btn" data-cur-sentence-del="${escapeHtml(s.id)}" title="삭제">×</button></div>`).join('')
          : '<span class="cur-cell-empty">저장된 문장 없음</span>';
      } catch (_) { listEl.innerHTML = '<span class="cur-cell-empty">불러오지 못함</span>'; }
    });
    root.querySelectorAll('.cur-words[data-cur-wordlist]').forEach(async el => {
      const ref = el.dataset.curWordlist;
      const listEl = el.querySelector('.cur-words-list');
      if (!listEl || el.dataset.filled) return;
      el.dataset.filled = '1';
      try {
        let words = state.curriculum.wordlists[ref];
        if (!words) {
          words = (await CurriculumStore.getWordlist(ref)).words || [];
          state.curriculum.wordlists[ref] = words;
        }
        listEl.innerHTML = curWordButtonsHtml(words);
      } catch (_) { listEl.innerHTML = '<span class="cur-cell-empty">불러오지 못함</span>'; }
    });
    root.querySelectorAll('.cur-words[data-cur-wordlist-all]').forEach(async el => {
      const refs = (el.dataset.curWordlistAll || '').split(',').filter(Boolean);
      const listEl = el.querySelector('.cur-words-list');
      if (!listEl || el.dataset.filled) return;
      el.dataset.filled = '1';
      try {
        const perRef = await Promise.all(refs.map(async ref => {
          let words = state.curriculum.wordlists[ref];
          if (!words) {
            words = (await CurriculumStore.getWordlist(ref)).words || [];
            state.curriculum.wordlists[ref] = words;
          }
          return words;
        }));
        const seen = new Set();
        const merged = [];
        perRef.flat().forEach(w => {
          const key = String(w.ko || '').trim();
          if (!key || seen.has(key)) return;
          seen.add(key);
          merged.push(w);
        });
        merged.sort((a, z) => String(a.ko || '').localeCompare(String(z.ko || ''), 'ko'));
        listEl.innerHTML = curWordButtonsHtml(merged);
      } catch (_) { listEl.innerHTML = '<span class="cur-cell-empty">불러오지 못함</span>'; }
    });
    root.querySelectorAll('.cur-talk[data-cur-note]').forEach(ta => {
      if (ta.dataset.filled) return;
      ta.dataset.filled = '1';
      const [sid] = ta.dataset.curNote.split('|');
      const sess = (state.curriculum.board?.sessions || []).find(s => s.id === sid);
      if (sess) ta.value = (sess.notes && sess.notes.talk) || '';
    });
    root.querySelectorAll('[data-cur-board-gallery]').forEach(async el => {
      const sessionId = el.dataset.curBoardGallery;
      if (el.dataset.filled || !sessionId) return;
      el.dataset.filled = '1';
      const bodyEl = el.querySelector('.cur-board-gallery-body');
      if (!bodyEl || !window.CurriculumStore) return;
      try {
        const student = curriculumCurrentStudent();
        const r = await CurriculumStore.getBoardCaptures(student, sessionId);
        state.curriculum.boardCaptures[sessionId] = r.items || [];
        bodyEl.innerHTML = curBoardGalleryBodyHtml(sessionId, r.items || [], !!r.canManage, student);
      } catch (_) { bodyEl.innerHTML = '<div class="cur-cell-empty">불러오지 못함</div>'; }
    });
    root.querySelectorAll('.cur-review[data-cur-review]').forEach(async el => {
      const rk = el.dataset.curReview;
      const [student, hwRefId] = rk.split('|');
      const sess = el.dataset.curReviewSess;
      if (el.dataset.filled || !student) return;
      el.dataset.filled = '1';
      // 활성 = W04 위젯 임베드 (편집 가능)
      if (el.dataset.curReviewActive === '1') {
        state.curriculum.activeReview = sess;
        await loadHomework(hwRefId, { student, embedded: true });
        refreshHomeworkWidgetBody();
        return;
      }
      // 비활성 = 같은 위젯 화면(이미지+코멘트)을 읽기 전용으로
      const staticEl = el.querySelector('[data-hw-static]');
      if (!staticEl) return;
      try {
        const hw = (await CurriculumStore.getHomework(student, hwRefId)).homework || { comments: [] };
        state.curriculum.reviews[rk] = hw;
        staticEl.innerHTML = curReviewStaticHtml(hw);
        curSizeStaticComments(staticEl);
      } catch (_) { staticEl.innerHTML = '<div class="cur-cell-empty" style="padding:10px">불러오지 못함</div>'; }
    });
  }
  async function curSaveReview(rk, patch) {
    const parts = rk.split('|');
    const cur = state.curriculum.reviews[rk] || { comments: [] };
    const hw = { image: cur.image || '', comments: cur.comments || [], teacherName: cur.teacherName || '', studentName: cur.studentName || '', ...patch };
    try {
      const res = await CurriculumStore.setHomework({ student: parts[0], ref: parts[1], homework: hw });
      state.curriculum.reviews[rk] = res.homework;
      const staticEl = document.querySelector(`.cur-review[data-cur-review="${CSS.escape(rk)}"] [data-hw-static]`);
      if (staticEl) { staticEl.innerHTML = curReviewStaticHtml(res.homework); curSizeStaticComments(staticEl); }
    } catch (err) { alert(err.message); }
  }

  // 서버 응답(board)이 없을 때도 UI가 즉시 반영되도록 로컬 board를 패치
  function curPatchSession(sid, patch) {
    const sess = state.curriculum.board?.sessions?.find(s => s.id === sid);
    if (!sess) return;
    Object.assign(sess, patch);
    refreshCurriculumWidgetBody();
  }

  async function loadCurriculumBoard() {
    if (!state.user || !window.CurriculumStore) return;
    const c = state.curriculum;
    c.loading = true; c.error = '';
    refreshCurriculumWidgetBody();
    try {
      if (!curriculumIsStudent() && !c.roster) {
        c.roster = await CurriculumStore.getRoster();
      }
      const student = curriculumCurrentStudent();
      if (!student) { c.board = null; c.loading = false; return refreshCurriculumWidgetBody(); }
      c.student = student;
      const res = await CurriculumStore.getBoard(student);
      c.board = res.board;
      c.canManage = !!res.canManage;
      // 활성 복습이 없거나 사라진 회차면 최신 회차로
      const sessIds = (c.board?.sessions || []).map(s => s.id);
      if (!c.activeReview || !sessIds.includes(c.activeReview)) {
        c.activeReview = sessIds.length ? sessIds[sessIds.length - 1] : null;
      }
      // 첫 로드: 전체공통·학생공통 + 모든 회차는 접고, 마지막 회차만 펼쳐서 시작
      if (!c._collapsedInit) {
        c._collapsedInit = true;
        c.collapsed.common = true;
        c.collapsed.personal = true;
        sessIds.forEach((sid, i) => { c.collapsed[`sess:${sid}`] = i !== sessIds.length - 1; });
      }
      curPushAssignedToLib();
      if (c.canManage) {
        try {
          const [pace, syl] = await Promise.all([
            CurriculumStore.getPace(student),
            c.syllabus ? Promise.resolve(null) : CurriculumStore.getSyllabus(),
          ]);
          c.pace = pace.pace;
          c.paceSuggestion = pace.suggestion || null;
          if (syl) c.syllabus = syl.syllabus || [];
        } catch (_) {}
      } else {
        c.pace = null;
        c.paceSuggestion = null;
      }
    } catch (err) {
      c.error = err.message || '불러오지 못했습니다.';
    } finally {
      c.loading = false;
      refreshCurriculumWidgetBody();
    }
    pushProgressContext();
    pushProgressState();
  }

  /* ══════════ 커리큘럼 대시보드 (내강의실 첫 화면) ══════════ */

  function curDashHostEl() { return document.getElementById('curriculumDash'); }

  function curDashTitle() {
    const u = state.user;
    const name = u?.name || u?.email?.split('@')[0] || '사용자';
    const label = u?.role === 'admin' ? '관리 강의실' : '강의실';
    return `${name}님의 ${label}`;
  }
  // 회차 보드 화면 전용. 교사가 학생 보드를 열 때는 이름이 옆 선택 묶음(.cd-picker)에 표시되므로
  // name 없이 호출해 여기서는 뺀다. 학생 본인 화면은 name(자기 이름)을 넘겨 제목 맨 앞에 붙인다.
  // 표기는 썸네일과 동일하게 shortName(성 뺀 이름)만 쓴다: "Emma님의 강의실"
  function curBoardTitle(name) {
    const label = state.user?.role === 'admin' ? '관리 강의실' : '강의실';
    return name ? `${shortName(name)}님의 ${label}` : `님의 ${label}`;
  }
  function renderCurriculumDash() {
    const host = curDashHostEl();
    if (!host) return;
    const D = state.curDash;

    if (D.openStudent) {
      // 특정 학생 보드 펼침 — 커리큘럼 위젯 본문 재사용
      host.innerHTML = `<div id="curDashBoard">
        <div class="cd-board-top">
          <button type="button" class="cd-back" data-cd-back>← 목록</button>
          <span class="cd-collapse-slot">${curCollapseAllHtml()}</span>
          <span class="cd-picker"></span>
          <span class="cd-title">${escapeHtml(curBoardTitle())}</span>
          <span class="cd-lv-slot"></span>
          <div class="cur-board-head"></div>
        </div>
        <div class="cur-board-body"></div>
      </div>`;
      refreshCurriculumWidgetBody();
      return;
    }
    if (D.loading) { host.innerHTML = '<div class="cd-msg">커리큘럼 상태를 불러오는 중…</div>'; return; }
    if (D.error) { host.innerHTML = `<div class="cd-msg err">${escapeHtml(D.error)}</div>`; return; }
    const d = D.data;
    if (!d) { host.innerHTML = ''; return; }

    if (d.role === 'student' && d.pendingApproval) {
      host.innerHTML = `<div class="cd-msg">선생님 승인 대기 중입니다.<br><span class="cd-msg-sub">담당 선생님이 승인하면 강의실이 열려요.</span></div>`;
      return;
    }
    if (d.role === 'student') {
      // 학생 = 자기 보드(전체공통·학생공통·회차)만 바로. 제목은 "Emma님의 강의실"처럼 이름을 맨 앞에.
      host.innerHTML = `<div id="curDashBoard">
        <div class="cd-board-top cd-board-top-solo">
          <span class="cd-collapse-slot">${curCollapseAllHtml()}</span>
          <span class="cd-title">${escapeHtml(curBoardTitle(state.user.name))}</span>
        </div>
        <div class="cur-board-head"></div>
        <div class="cur-board-body"></div>
      </div>`;
      state.curriculum.student = state.user.email;
      state.curriculum.board = d.board;
      state.curriculum.canManage = false;
      // 첫 진입: 전체공통·학생공통 + 모든 회차는 접고 마지막 회차만 펼쳐서 시작 (loadCurriculumBoard()와 동일 규칙)
      const sessIds = (d.board?.sessions || []).map(s => s.id);
      if (!state.curriculum._collapsedInit) {
        state.curriculum._collapsedInit = true;
        state.curriculum.collapsed.common = true;
        state.curriculum.collapsed.personal = true;
        sessIds.forEach((sid, i) => { state.curriculum.collapsed[`sess:${sid}`] = i !== sessIds.length - 1; });
      }
      refreshCurriculumWidgetBody();
      // 마지막 회차로 포커스 이동
      const lastSid = sessIds[sessIds.length - 1];
      if (lastSid) {
        setTimeout(() => document.querySelector(`[data-cur-tier="sess:${lastSid}"]`)?.scrollIntoView({ block: 'start' }), 60);
      }
      return;
    }

    // 선생/관리자 — 담당 학생 요약 카드
    const students = d.students || [];
    const pending = d.pending || [];
    const pendingHtml = pending.length ? `<div class="cd-pending">
      <div class="cd-pending-head">승인 대기 학생 ${pending.length}명 <span class="cd-pending-hint">승인하면 그 순간 선생님과 자동으로 매칭됩니다</span></div>
      ${pending.map(p => `<div class="cd-pending-row">
        <strong>${escapeHtml(p.name || p.email)}</strong><span>${escapeHtml(p.email)}</span>
        <button type="button" class="cd-pending-approve" data-cd-approve-student="${escapeHtml(p.email)}">승인</button>
      </div>`).join('')}
    </div>` : '';
    const cards = students.map(st => {
      const s = st.summary || {};
      const last = s.last_lesson ? String(s.last_lesson).slice(2).replace(/-/g, '.') : '';
      const sessLabel = `${s.sessions_total || 0}회차${last ? ' · ' + last : ''}`;
      const teacherLabel = curTeacherNameFor(st.teacher);
      const displayName = teacherLabel ? `${teacherLabel}-${shortName(st.name)}` : shortName(st.name);
      return `<button type="button" class="cd-card" data-cd-student="${escapeHtml(st.email)}">
        <div class="cd-card-top">
          <strong title="${escapeHtml(st.name)}">${escapeHtml(displayName)}</strong>
          <span class="cd-sess-inline">${escapeHtml(sessLabel)}</span>
          <span class="cd-lv">${escapeHtml(curLevelLabel(st.level))}</span>
        </div>
      </button>`;
    }).join('');
    const viewToggle = d.canToggleView ? `<button type="button" class="cd-view-toggle" data-cd-view-toggle="${d.viewingAs === 'teacher' ? '' : 'teacher'}">
        ${d.viewingAs === 'teacher' ? '전체보기로' : '내 학생만'}
      </button>` : '';
    host.innerHTML = `${pendingHtml}<div class="cd-grid-head">
        <span class="cd-title">${escapeHtml(curDashTitle())}</span>
        <span class="cd-count">담당 학생 ${students.length}명</span>
        ${viewToggle}
      </div>
      <div class="cd-grid">${cards || '<div class="cd-msg">담당 학생이 없습니다. 회원관리에서 학생을 배정하세요.</div>'}</div>`;
  }

  async function loadCurriculumDash() {
    if (!state.user || !window.CurriculumStore) return;
    const D = state.curDash;
    if (D.loading) return;
    D.loading = true; D.error = ''; D.openStudent = '';
    renderCurriculumDash();
    try {
      D.data = await CurriculumStore.getOverview(D.view);
      // Admin은 학생마다 담당 교사가 다를 수 있어 카드에 "교사-학생" 표시하려면 교사 이름 목록이 필요
      if (D.data?.role === 'admin' && !state.devUsers) {
        try { state.devUsers = (await api('/api/dev/users')).users || []; } catch (_) { state.devUsers = []; }
      }
    } catch (err) {
      D.error = err.message || '불러오지 못했습니다.';
    } finally {
      D.loading = false;
      renderCurriculumDash();
    }
  }

  async function openDashStudent(email) {
    state.curDash.openStudent = email;
    state.curriculum.student = email;
    state.curriculum.activeSessionId = '';
    state.curriculum.board = null;
    state.curriculum.typeFilter = 'all';   // 대시보드에서 열 땐 전체 보기로 시작
    state.curriculum.view = 'sessions';
    state.curriculum.activeReview = null;
    renderCurriculumDash();       // #curDashBoard 컨테이너 생성
    await loadCurriculumBoard();  // 그 안의 .cur-board-body 채움
  }
  function closeDashStudent() {
    state.curDash.openStudent = '';
    state.curriculum.activeReview = null;
    renderCurriculumDash();
    if (!state.curDash.data) loadCurriculumDash();
  }

  // 커리큘럼 항목 클릭 → 해당 콘텐츠 화면으로 이동
  function openCurriculumItem(type, ref) {
    ref = String(ref || '');
    if (!ref) return;
    const ctx = previewContext();
    const q = `embed=1&role=${ctx.role}&level=${ctx.level || 1}&access=${state.user?.access || 'free'}`;
    if (type === 'youtube') {
      openModule('video', 'youtube');
      setTimeout(() => { if (moduleFrame) moduleFrame.src = `http://localhost:8120/player.html?v=${encodeURIComponent(ref)}&${q}`; }, 40);
      return;
    }
    // lecture / word / review → 해당 강의 레슨 열기 (단어·복습 섹션도 그 안에 있음)
    openModule('textbook', 'lecture');
    setTimeout(() => { if (moduleFrame) moduleFrame.src = `http://localhost:8121/${encodeURIComponent(ref)}/index.html?${q}`; }, 40);
  }

  /* ── 진도 마커: 커리큘럼 위젯 ↔ 모듈 iframe(영상 자막 / 교재 섹션) 배관 ── */

  // (대화·메모와 같은 이유) 커리큘럼(강의실) 위젯을 안 열어도 학생 맥락은 있어야 진도 마커가
  // 동작한다 — 예전엔 위젯이 열려 있을 때만 활성화돼서, 강의실을 따로 안 연 채로 영상만 보면
  // 진도 표시줄이 계속 안 뜨는 것처럼 보였다.
  function curriculumProgressStudent() {
    const email = curriculumCurrentStudent();
    if (!email) return null;
    let name = email;
    if (curriculumIsStudent()) {
      name = state.user?.name || email;
    } else {
      const s = (state.curriculum.roster?.students || []).find(x => x.email === email);
      if (s) name = s.name || email;
    }
    return { email, name };
  }

  // 현재 host 의 진도 대상: { type:'youtube'|'lecture', refId } 또는 null.
  function progressRef(overrideRefId) {
    const host = widgetHost();
    if (host === 'youtube') {
      const refId = String(overrideRefId || state.wordContext?.videoId || '');
      return refId ? { type: 'youtube', refId } : null;
    }
    if (host === 'lecture') {
      const refId = String(overrideRefId || state.lectureContext?.lessonId || '');
      return refId ? { type: 'lecture', refId } : null;
    }
    return null;
  }

  // 학생 목록(roster)·회차(board)가 아직 안 불러와져 있으면(강의실 위젯을 한 번도 안 연 상태)
  // 먼저 받아온 뒤에 실행 — 안 그러면 curriculumCurrentStudent()가 계속 빈 값을 돌려준다.
  function ensureCurriculumContext() {
    if (curriculumIsStudent() || state.curriculum.board || state.curriculum.loading) return Promise.resolve();
    return loadCurriculumBoard();
  }

  function pushProgressContext() {
    ensureCurriculumContext().then(() => {
      const s = curriculumProgressStudent();
      postToModuleFrame({
        type: 'koredu-progress-context',
        student: s?.email || '',
        studentName: s?.name || '',
      });
    });
  }

  async function pushProgressState(overrideRefId) {
    await ensureCurriculumContext();
    const s = curriculumProgressStudent();
    const ref = progressRef(overrideRefId);
    if (!s || !ref || !window.CurriculumStore) return;
    try {
      const res = await CurriculumStore.getProgress(s.email, ref.type, ref.refId);
      const p = res.progress || {};
      postToModuleFrame({
        type: 'koredu-progress-state',
        refType: ref.type,
        refId: ref.refId,
        videoId: ref.refId,   // 하위호환 (VideoScript 는 videoId 로도 매칭)
        student: s.email,
        markerIndex: Number(p.marker_index) || 0,
        maxReached: Number(p.max_reached) || 0,
        checkedSections: Array.isArray(p.checked_sections) ? p.checked_sections : [],
        total: Number(p.total) || 0,
        has: !!res.progress,
      });
    } catch (_) {}
  }

  async function handleProgressMark(data) {
    const s = curriculumProgressStudent();
    if (!s || !window.CurriculumStore) return;
    const ref = progressRef(data.refId || data.videoId);
    if (!ref) return;
    try {
      await CurriculumStore.setProgress({
        student: s.email,
        type: ref.type,
        ref_id: ref.refId,
        marker_index: Number(data.markerIndex) || 0,
        total: Number(data.total) || 0,
        clear: !!data.clear,
        checked_sections: Array.isArray(data.checkedSections) ? data.checkedSections : undefined,
      });
      await pushProgressState(ref.refId);
      if (state.widgetMulti.includes('curriculum')) loadCurriculumBoard();
    } catch (err) {
      postToModuleFrame({ type: 'koredu-progress-error', message: err.message || '진도를 저장하지 못했습니다.' });
    }
  }

  /* ══════════ W08 자료함 위젯 (드래그 소스) ══════════ */

  function libraryWidgetHeaderToolsHtml() {
    return `<div class="widget-head-tools"><input type="search" class="lib-search" placeholder="강의 검색"
      value="${escapeHtml(state.library.filter)}" data-lib-filter aria-label="자료 검색"></div>`;
  }

  function libraryWidgetBodyHtml() {
    if (!state.user) return `<div class="widget-empty"><strong>자료함</strong><p>로그인이 필요합니다.</p></div>`;
    const L = state.library;
    if (L.loading) return `<div class="lib-root"><div class="lib-msg">불러오는 중…</div></div>`;
    if (L.error) return `<div class="lib-root"><div class="lib-msg err">${escapeHtml(L.error)}</div></div>`;
    const all = L.lectures || [];
    const q = L.filter.trim().toLowerCase();
    const rows = all.filter(x => x.ready && (!q || (x.unit + ' ' + x.title + ' ' + x.grammar).toLowerCase().includes(q)));
    const chips = rows.map(x => `<div class="lib-chip cur-t-lecture" draggable="false"
        data-lib-chip data-lib-type="lecture" data-lib-ref="${escapeHtml(x.unit)}" data-lib-title="${escapeHtml(x.title)}">
        <span class="lib-chip-unit">${escapeHtml(x.unit)}</span>
        <span class="lib-chip-title">${escapeHtml(x.title)}</span>
      </div>`).join('');
    return `<div class="lib-root">
      <div class="lib-hint">칩을 강의실 위젯의 회차/학생공통으로 끌어다 놓으세요. (강의 = 단어·복습 함께 배정)</div>
      <div class="lib-sec-h">강의교재 <span class="cur-count">${rows.length}</span></div>
      <div class="lib-chips">${chips || '<span class="cur-none">결과 없음</span>'}</div>
    </div>`;
  }

  function libraryBodyEl() {
    return (widgetMultiGrid || document).querySelector('[data-widget-panel="library"] .widget-panel-body');
  }
  function refreshLibraryWidgetBody() {
    const b = libraryBodyEl();
    if (b) b.innerHTML = libraryWidgetBodyHtml();
    const h = (widgetMultiGrid || document).querySelector('[data-widget-header-tools="library"]');
    if (h) h.innerHTML = libraryWidgetHeaderToolsHtml();
  }
  async function loadLibrarySources() {
    if (!state.user || !window.CurriculumStore || state.library.lectures) return refreshLibraryWidgetBody();
    state.library.loading = true; state.library.error = '';
    refreshLibraryWidgetBody();
    try {
      const res = await CurriculumStore.getSources();
      state.library.lectures = res.lectures || [];
    } catch (err) {
      state.library.error = err.message || '자료 목록을 불러오지 못했습니다.';
    } finally {
      state.library.loading = false;
      refreshLibraryWidgetBody();
    }
  }

  /* 포인터 드래그: 자료함 칩 → 커리큘럼 위젯 회차/학생공통 카드 */
  let libDrag = null;
  function libDropTargetAt(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const sess = el.closest?.('.cur-session[data-cur-session]');
    if (sess) return { kind: 'session', el: sess, section: sess.dataset.curDate || sess.getAttribute('data-cur-date') };
    const sec = el.closest?.('.cur-sec');
    if (sec && /학생공통/.test(sec.querySelector('.cur-sec-h')?.textContent || '')) {
      return { kind: 'personal', el: sec, section: 'personal' };
    }
    return null;
  }
  function clearLibDropHint() {
    document.querySelectorAll('.cur-drop-hint').forEach(e => e.classList.remove('cur-drop-hint'));
  }
  document.addEventListener('pointerdown', e => {
    const chip = e.target.closest?.('[data-lib-chip]');
    if (!chip) return;
    e.preventDefault();
    const ghost = document.createElement('div');
    ghost.className = 'lib-ghost';
    ghost.textContent = chip.dataset.libTitle || chip.dataset.libRef;
    document.body.appendChild(ghost);
    libDrag = {
      type: chip.dataset.libType, ref: chip.dataset.libRef, title: chip.dataset.libTitle,
      ghost, moved: false, target: null,
    };
    moveLibGhost(e.clientX, e.clientY);
  });
  function moveLibGhost(x, y) {
    if (!libDrag) return;
    libDrag.ghost.style.left = (x + 12) + 'px';
    libDrag.ghost.style.top = (y + 12) + 'px';
  }
  document.addEventListener('pointermove', e => {
    if (!libDrag) return;
    libDrag.moved = true;
    moveLibGhost(e.clientX, e.clientY);
    clearLibDropHint();
    const t = libDropTargetAt(e.clientX, e.clientY);
    libDrag.target = t;
    if (t) t.el.classList.add('cur-drop-hint');
  });
  document.addEventListener('pointerup', async () => {
    if (!libDrag) return;
    const drag = libDrag;
    libDrag = null;
    drag.ghost.remove();
    clearLibDropHint();
    if (!drag.moved || !drag.target) return;
    const student = curriculumCurrentStudent();
    if (!student) { alert('강의실 위젯에서 학생을 먼저 선택하세요.'); return; }
    // 강의는 단어·복습을 함께 배정 (스펙: 한 단원 = 강의+단어+복습 세트)
    const plan = drag.type === 'lecture'
      ? [['lecture', drag.title], ['word', `${drag.title} · 단어`], ['review', `${drag.title} · 복습`]]
      : [[drag.type, drag.title]];
    try {
      let dup = 0;
      for (const [type, title] of plan) {
        const r = await CurriculumStore.assign({ student, section: drag.target.section, type, ref_id: drag.ref, title });
        if (r.duplicate) dup++;
      }
      await loadCurriculumBoard();
      message(dup === plan.length ? '이미 배정된 자료입니다.' : `"${drag.title}" 배정됨`, dup === plan.length ? '' : 'ok');
    } catch (err) { alert(err.message); }
  });


  function widgetPanelHtml(widgetId, single = false) {
    const item = WIDGETS[widgetId];
    if (!item) return '';
    const scopeLabel = String(item.scope || '').replaceAll('_', ' · ');
    const solo = !single && state.widgetMulti.length <= 1;   // 위젯 하나만 열림 → 최적화(전체 폭·높이)
    const size = (single || solo) ? 'full' : (state.widgetSizes[widgetId] === 'full' ? 'full' : 'half');
    const controls = (single || solo) ? '' : `<button class="widget-panel-drag" type="button" draggable="true" data-widget-drag="${widgetId}" title="드래그해서 순서 바꾸기" aria-label="${item.title} 순서 이동">⋮⋮</button>`;
    const sizeButton = (single || solo) ? '' : `<button class="widget-size-toggle" type="button" data-widget-size="${widgetId}" title="반폭/전체폭 전환">${size === 'full' ? '1' : '½'}</button>`;
    const bodyHtml = widgetId === 'word'
      ? wordWidgetBodyHtml()
      : widgetId === 'grammar'
        ? grammarWidgetBodyHtml()
        : widgetId === 'questions'
          ? questionsWidgetBodyHtml()
          : widgetId === 'homework'
            ? homeworkWidgetBodyHtml()
            : widgetId === 'curriculum'
              ? curriculumWidgetBodyHtml()
            : widgetId === 'library'
              ? libraryWidgetBodyHtml()
            : widgetId === 'dialogue'
              ? dialogueWidgetBodyHtml()
            : widgetId === 'memo'
              ? memoWidgetBodyHtml()
            : widgetId === 'writing'
              ? writingWidgetBodyHtml()
            : widgetId === 'hangeul1'
              ? hangeul1WidgetBodyHtml()
            : widgetId === 'hangeul2'
              ? hangeul2WidgetBodyHtml()
            : widgetId === 'lecturelist'
              ? lecturelistWidgetBodyHtml()
            : widgetId === 'videolist'
              ? videolistWidgetBodyHtml()
            : widgetId === 'sentence'
              ? sentenceWidgetBodyHtml()
              : widgetId === 'settings'
              ? settingsWidgetBodyHtml()
              : `<div class="widget-empty"><strong>${item.title}</strong><p>${item.text}</p><small>Scope · ${scopeLabel}</small></div>`;
    return `<section class="widget-panel ${single ? 'single' : `multi size-${size}`}" data-widget-panel="${widgetId}" data-widget-size-value="${size}">
      <header class="widget-panel-head">
        <div class="widget-panel-title">${controls}<span>${item.code}</span><strong>${item.title}</strong></div>
        <div class="widget-panel-context-tools" data-widget-header-tools="${widgetId}">${widgetHeaderToolsHtml(widgetId)}</div>
        <div class="widget-panel-actions">${sizeButton}<button class="widget-panel-close" type="button" data-widget-panel-close="${widgetId}" aria-label="${item.title} 닫기">×</button></div>
      </header>
      <div class="widget-panel-body">${bodyHtml}</div>
    </section>`;
  }

  function refreshWordWidgetBody() {
    const bodyEl = widgetMultiGrid?.querySelector('[data-widget-panel="word"] .widget-panel-body');
    if (bodyEl) bodyEl.innerHTML = wordWidgetBodyHtml();
    const headEl = widgetMultiGrid?.querySelector('[data-widget-header-tools="word"]');
    if (headEl) headEl.innerHTML = wordWidgetHeaderToolsHtml();
  }

  function refreshQuestionsWidgetBody() {
    const bodyEl = widgetMultiGrid?.querySelector('[data-widget-panel="questions"] .widget-panel-body');
    if (bodyEl) bodyEl.innerHTML = questionsWidgetBodyHtml();
    const headEl = widgetMultiGrid?.querySelector('[data-widget-header-tools="questions"]');
    if (headEl) headEl.innerHTML = questionsWidgetHeaderToolsHtml();
  }

  function refreshSettingsWidgetBody() {
    const bodyEl = widgetSingleStage?.querySelector('[data-widget-panel="settings"] .widget-panel-body');
    if (bodyEl) bodyEl.innerHTML = settingsWidgetBodyHtml();
  }

  function setLearningLanguage(value, notifyVideo = true) {
    const language = normalizeLearningLanguage(value);
    state.learningLanguage = language;
    state.wordLanguage = language;
    state.questionLanguage = language;
    try {
      localStorage.setItem(LEARNING_LANG_KEY, language);
      // 구버전 개별 언어 키도 같은 값으로 맞춰 과거 화면과 충돌하지 않게 한다.
      localStorage.setItem(WORD_LANG_KEY, language);
      localStorage.setItem(QUESTION_LANG_KEY, language);
    } catch (_) {}
    refreshWordWidgetBody();
    refreshQuestionsWidgetBody();
    refreshSettingsWidgetBody();
    refreshReadingPrefsBar();
    if (notifyVideo) syncLearningLanguageToVideoScript();
  }

  function postToVideoScript(payload) {
    if (!(state.page === 'module' && state.section === 'video' && state.item === 'youtube')) return false;
    try {
      moduleFrame?.contentWindow?.postMessage(payload, 'http://localhost:8120');
      return true;
    } catch (_) { return false; }
  }

  // 현재 임베드된 모듈 iframe(영상/교재)로 전송. 진도 배관 공용.
  function postToModuleFrame(payload) {
    const host = widgetHost();
    const origin = MODULE_ORIGINS[host];
    if (!origin) return false;
    try {
      moduleFrame?.contentWindow?.postMessage(payload, origin);
      return true;
    } catch (_) { return false; }
  }

  function syncLearningLanguageToVideoScript() {
    const sentToVideo = postToVideoScript({ type: 'koredu-set-learning-language', language: state.learningLanguage });
    // 강의(KorLecture) 화면이 열려 있으면 번역 언어도 같이 맞춘다 (전역 학습 언어와 통일).
    if (!sentToVideo && widgetHost() === 'lecture') postToModuleFrame({ type: 'koredu-set-learning-language', language: state.learningLanguage });
  }

  function requestVideoWordContext() {
    if (!state.widgetMulti.includes('word') && !state.widgetMulti.includes('questions') && !state.widgetMulti.includes('homework')) return;
    if (state.widgetMulti.includes('word')) {
      state.wordMessage = '현재 영상 자막을 확인하고 있습니다.';
      refreshWordWidgetBody();
    }
    postToVideoScript({ type: 'koredu-request-videoscript-context' });
  }

  function requestSavedWordList() {
    const videoId = state.wordContext?.videoId;
    if (!videoId) return;
    postToVideoScript({ type: 'koredu-load-word-list', videoId });
  }

  function requestQuestionList() {
    const videoId = state.wordContext?.videoId;
    if (!videoId) return;
    postToVideoScript({ type: 'koredu-load-questions', videoId });
  }

  function seekQuestion(index) {
    const item = state.questionList?.questions?.[Number(index)];
    if (!item) return;
    postToVideoScript({
      type: 'koredu-seek-subtitle',
      videoId: state.wordContext?.videoId || '',
      index: Number(item.index),
      seconds: Number(item.seconds) || 0
    });
  }

  function requestWordPipelineStatus() {
    const videoId = state.wordContext?.videoId;
    if (!videoId) return;
    postToVideoScript({ type: 'koredu-request-word-pipeline-status', videoId });
  }

  function runWordPipelineStage(stage) {
    const videoId = state.wordContext?.videoId;
    if (!videoId || state.wordStageLoading) return;
    state.wordStageLoading = stage;
    state.wordMessage = '';
    refreshWordWidgetBody();
    const type = stage === 'words' ? 'koredu-ai-extract-words' : 'koredu-translate-words';
    postToVideoScript({ type, videoId });
  }

  function requestOpenAIKeyStatus() {
    postToVideoScript({ type: 'koredu-request-openai-key-status' });
  }

  function seekWordOccurrence(wordIndex) {
    const word = state.wordList?.words?.[Number(wordIndex)];
    if (!word) return;
    const occurrences = Array.isArray(word.occurrences) ? word.occurrences : [];
    if (!occurrences.length) return;
    const key = word.id || word.ko || String(wordIndex);
    const cursor = Number(state.wordOccurrenceCursor[key] || 0) % occurrences.length;
    const occurrence = occurrences[cursor];
    state.wordOccurrenceCursor[key] = (cursor + 1) % occurrences.length;
    postToVideoScript({
      type: 'koredu-seek-subtitle',
      videoId: state.wordContext?.videoId || '',
      index: Number(occurrence.index),
      seconds: Number(occurrence.seconds),
      highlightWord: String(word?.ko || '').trim()
    });
  }

  function speakWord(wordIndex) {
    const word = state.wordList?.words?.[Number(wordIndex)];
    curduSpeakCancel();
    curduSpeak(word?.ko, { rate: 0.92 });
  }

  function downloadWordExcel() {
    const videoId = String(state.wordContext?.videoId || '').trim();
    const rows = selectedWordRows();
    if (!videoId || !rows.length) {
      alert('Excel로 저장할 대상을 자막/저장에서 체크해 주세요.');
      return;
    }
    const esc = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const tableRows = rows.map((row, index) => `<tr><td>${index + 1}</td><td>${esc(row.ko)}</td><td>${esc(row.foreign)}</td></tr>`).join('');
    const html = `\ufeff<html><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr><th>No</th><th>한국어</th><th>외국어</th></tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${videoId}_words_${WORD_LANGS[state.wordLanguage] || state.wordLanguage}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function saveOpenAIKeyFromSettings() {
    const input = widgetSingleStage?.querySelector('[data-openai-key-input]');
    const key = String(input?.value || '').trim();
    if (!key) {
      state.settingsMessage = 'API Key를 입력해 주세요.';
      refreshSettingsWidgetBody();
      return;
    }
    state.settingsMessage = '저장 중…';
    refreshSettingsWidgetBody();
    postToVideoScript({ type: 'koredu-save-openai-key', apiKey: key });
  }

  // 커리큘럼 배정용 목록 위젯(영상목록/강의목록) — 일반 영상/교재 모듈 화면(moduleFrame, 마스터
  // 목록 조회용)과는 별개. 여기서 온 메시지만 "이미 배정됨" 표시·드래그배정 대상으로 취급한다.
  function curLibWidgetFrame(kind) {
    const el = document.querySelector(`[data-widget-panel="${kind === 'lecture' ? 'lecturelist' : 'videolist'}"] iframe`);
    return el && el.contentWindow ? el : null;
  }
  function curLibWidgetKindOf(win) {
    const vl = curLibWidgetFrame('youtube'), ll = curLibWidgetFrame('lecture');
    if (vl && win === vl.contentWindow) return 'youtube';
    if (ll && win === ll.contentWindow) return 'lecture';
    return null;
  }

  function handleVideoScriptMessage(event) {
    const okOrigin = event.origin === 'http://localhost:8120' || event.origin === 'http://localhost:8121';
    if (!okOrigin) return;
    // 모듈 화면이든 영상목록/강의목록 위젯이든, 어느 프레임에서 왔든 똑같이 지금의 시크릿 모드
    // 상태를 그 프레임에게만 답해준다(다른 프레임과 무관하게 각자 새로 열릴 때마다 물어봄).
    if (event.data?.type === 'koredu-request-secret-mode') {
      try { event.source.postMessage({ type: 'koredu-secret-mode', on: !!state.secretMode }, event.origin); } catch (_) {}
      return;
    }
    const libKind = curLibWidgetKindOf(event.source);
    if (libKind) return handleCurLibWidgetMessage(event, libKind);
    if (event.source !== moduleFrame?.contentWindow) return;
    // 마스터(모듈) 목록에서도 커리큘럼으로 드래그·배정은 되게 하되, "이미 배정됨" 표시(dup)는
    // 학생과 무관한 마스터 화면에 절대 보내지 않는다 — 그 부분만 계속 lib 위젯 전용으로 남긴다.
    const dragMsgType = event.data?.type;
    if (dragMsgType === 'koredu-lib-drag' || dragMsgType === 'koredu-lib-drag-move' || dragMsgType === 'koredu-lib-drag-end') {
      return handleCurLibWidgetMessage(event, null);
    }
    if (dragMsgType === 'koredu-open-lecture') {
      // 교재-강의 마스터 목록(모듈 화면 자체)에서 강의를 클릭했을 때: 이미 그 모듈 안이니
      // openModule()로 목록을 다시 그릴 필요 없이 iframe만 해당 강의로 바꿔치기.
      const lessonId = event.data?.lessonId;
      if (lessonId && moduleFrame) {
        const ctx = previewContext();
        const q = `embed=1&role=${ctx.role}&level=${ctx.level || 1}&access=${state.user?.access || 'free'}`;
        moduleFrame.src = `http://localhost:8121/${encodeURIComponent(lessonId)}/index.html?${q}`;
      }
      return;
    }
    const data = event.data || {};
    if (data.type === 'koredu-request-learning-language') {
      syncLearningLanguageToVideoScript();
      return;
    }
    if (data.type === 'koredu-request-reading-prefs') {
      syncReadingPrefsToModule();
      return;
    }
    if (data.type === 'koredu-request-progress-context') {
      pushProgressContext();
      pushProgressState();
      return;
    }
    if (data.type === 'koredu-progress-mark') {
      handleProgressMark(data);
      return;
    }
    if (data.type === 'koredu-lecture-context') {
      state.lectureContext = {
        lessonId: String(data.lessonId || ''),
        total: Number(data.sectionCount || 0),
        sections: Array.isArray(data.sections) ? data.sections : [],
      };
      pushProgressContext();
      pushProgressState(state.lectureContext.lessonId);
      return;
    }
    if (data.type === 'koredu-videoscript-context') {
      const nextVideoId = String(data.videoId || '');
      const changed = state.wordContext?.videoId !== nextVideoId;
      state.wordContext = {
        videoId: nextVideoId,
        entryCount: Number(data.entryCount || 0),
        entries: Array.isArray(data.entries) ? data.entries : []
      };
      if (changed) {
        state.wordList = null;
        state.questionList = null;
        state.wordOccurrenceCursor = {};
        state.savedWordOccurrenceCursor = {};
        loadSavedStudentWords(nextVideoId);
        loadQuestionStudentAnswers(nextVideoId);
        loadHomework(nextVideoId);
        if (state.widgetMulti.includes('grammar')) loadGrammarTags(nextVideoId);
      }
      pushProgressState(nextVideoId);
      state.wordMessage = state.wordContext.entryCount ? '' : '현재 영상에 적용된 자막이 없습니다.';
      refreshWordWidgetBody();
      refreshQuestionsWidgetBody();
      if (state.widgetMulti.includes('homework')) refreshHomeworkWidgetBody();
      requestWordPipelineStatus();
      requestSavedWordList();
      requestQuestionList();
      return;
    }
    if (data.type === 'koredu-subtitle-derived-reset') {
      const resetVideoId = String(data.videoId || '');
      if (resetVideoId && resetVideoId !== String(state.wordContext?.videoId || '')) return;

      // 새 자동자막/새 자막 업로드를 기준으로 파생 학습데이터는 전부 새로 만든다.
      state.wordList = null;
      state.questionList = null;
      state.wordPipeline = {};
      state.wordLoading = false;
      state.wordStageLoading = '';
      state.wordMessage = '';
      state.questionMessage = '';
      state.wordOccurrenceCursor = {};
      state.savedWordOccurrenceCursor = {};

      // 자막 timestamp에 종속되는 학생 저장 단어도 현재 영상에서는 초기화한다.
      state.savedStudentWords = [];
      try { localStorage.removeItem(savedStudentWordStorageKey(resetVideoId)); } catch (_) {}

      // 기존 질문이 삭제되므로 기존 학생답변도 함께 초기화한다.
      state.questionStudentAnswers = {};
      try { localStorage.removeItem(questionStudentAnswerStorageKey(resetVideoId)); } catch (_) {}

      refreshWordWidgetBody();
      refreshQuestionsWidgetBody();
      refreshSettingsWidgetBody();
      return;
    }

    if (data.type === 'koredu-word-list') {
      state.wordLoading = false;
      state.wordApiConfigured = typeof data.apiKeyConfigured === 'boolean' ? data.apiKeyConfigured : state.wordApiConfigured;
      state.wordList = data.data && Array.isArray(data.data.words) ? data.data : null;
      state.wordMessage = String(data.message || '');
      refreshWordWidgetBody();
      return;
    }
    if (data.type === 'koredu-question-list') {
      if (data.videoId && String(data.videoId) !== String(state.wordContext?.videoId || '')) return;
      state.questionList = data.data && Array.isArray(data.data.questions) ? data.data : null;
      state.questionMessage = String(data.message || '');
      refreshQuestionsWidgetBody();
      return;
    }
    if (data.type === 'koredu-word-list-status') {
      state.wordLoading = !!data.loading;
      if (typeof data.apiKeyConfigured === 'boolean') state.wordApiConfigured = data.apiKeyConfigured;
      if (data.data && Array.isArray(data.data.words)) state.wordList = data.data;
      state.wordMessage = String(data.message || '');
      refreshWordWidgetBody();
      return;
    }
    if (data.type === 'koredu-word-pipeline-status') {
      const status = data.status || {};
      state.wordPipeline = status;
      if (typeof status.apiKeyConfigured === 'boolean') state.wordApiConfigured = status.apiKeyConfigured;
      if (status.wordData && Array.isArray(status.wordData.words) && !status.translated) state.wordList = status.wordData;
      else if (!status.aiWordsExtracted) state.wordList = null;
      refreshWordWidgetBody();
      refreshSettingsWidgetBody();
      return;
    }
    if (data.type === 'koredu-pipeline-stage') {
      state.wordStageLoading = data.loading ? String(data.stage || '') : '';
      if (typeof data.apiKeyConfigured === 'boolean') state.wordApiConfigured = data.apiKeyConfigured;
      state.wordMessage = String(data.message || '');
      if (data.ok && data.data && Array.isArray(data.data.words)) state.wordList = data.data;
      refreshWordWidgetBody();
      refreshSettingsWidgetBody();
      return;
    }
    if (data.type === 'koredu-save-student-words') {
      if (data.videoId && String(data.videoId) !== String(state.wordContext?.videoId || '')) return;
      addSavedStudentWords(Array.isArray(data.terms) ? data.terms : []);
      return;
    }
    if (data.type === 'koredu-openai-key-status') {
      state.wordApiConfigured = !!data.configured;
      state.settingsMessage = String(data.message || (data.configured ? 'API Key가 설정되어 있습니다.' : 'API Key가 아직 설정되지 않았습니다.'));
      state.wordMessage = String(data.message || '');
      refreshWordWidgetBody();
      refreshSettingsWidgetBody();
    }
  }

  window.addEventListener('message', handleVideoScriptMessage);
  moduleFrame?.addEventListener('load', () => {
    setTimeout(syncLearningLanguageToVideoScript, 80);
    if (state.widgetMulti.includes('word') || state.widgetMulti.includes('questions') || state.widgetMulti.includes('homework')) setTimeout(requestVideoWordContext, 180);
  });

  function syncWidgetRail() {
    // 위젯 레일은 위젯 워크스페이스를 붙일 수 있는 모듈 화면에서만 보인다 (영상 YouTube / 교재 강의).
    const host = widgetHost();
    const rail = document.querySelector('.widget-rail');
    if (rail) rail.hidden = !host;
    body.classList.toggle('has-widget-rail', !!host);
    // host 별로 못 여는 위젯(자기 자신 중복, 예: 영상 화면에서 "영상" 위젯)은 숨기지 않고
    // 체크박스만 비활성화한다 — "영상"/"교재" 레일 항목은 페이지 이동 버튼(data-nav-section)과
    // 위젯 열기 체크박스(data-widget-check)가 한 아이템 안에 같이 있어서, data-widget-code가
    // 아니라 체크박스의 data-widget-check 로 위젯 id를 판단해야 한다.
    document.querySelectorAll('[data-widget-check]').forEach(check => {
      const w = check.dataset.widgetCheck;
      check.checked = w === 'board' ? screenInkOn() : state.widgetMulti.includes(w);
      check.disabled = !!host && !widgetAllowedOnHost(w, host);
    });
    // "영상"/"교재"(부모) 자체는 항상 눌려야 한다 — 지금 보고 있는 것과 똑같은 하위 항목
    // (예: 유튜브 화면에서 "유튜브", 강의 화면에서 "강의")만 자기 자신 중복으로 비활성화한다.
    document.querySelectorAll('[data-nav-open]').forEach(btn => {
      const isCurrent = state.page === 'module' && btn.dataset.navOpen === `${state.section}:${state.item}`;
      btn.disabled = isCurrent;
    });
    document.querySelectorAll('.widget-toggle').forEach(btn => {
      const id = btn.dataset.widget;
      if (btn.dataset.navSection) {
        btn.classList.toggle('active', state.page === 'module' && state.section === btn.dataset.navSection);
        return;
      }
      // 이 버튼 자체가 위젯을 여닫는 경우(단어/문법/QA 등)는 못 여는 상태면 버튼도 같이
      // 비활성화 — 회색 처리 + 클릭/호버 반응 없음(native disabled).
      btn.disabled = !!host && !!id && !widgetAllowedOnHost(id, host);
      if (id === 'board') { btn.classList.toggle('active', screenInkOn()); return; }
      const active = WIDGETS[id]?.mode === 'multi' ? state.widgetMulti.includes(id) : state.widgetSingle === id;
      btn.classList.toggle('active', active);
    });
  }

  function saveVisibleWidgetHeights() {
    // v3 split-pane에서는 개별 패널 픽셀 높이를 저장하지 않는다.
    state.widgetHeights = {};
    saveWidgetLayout();
  }

  function multiWidgetRows() {
    const rows = [];
    state.widgetMulti.forEach(id => {
      const isFull = state.widgetSizes[id] === 'full';
      if (isFull) {
        rows.push([id]);
        return;
      }
      const last = rows[rows.length - 1];
      if (last && last.length === 1 && state.widgetSizes[last[0]] !== 'full') last.push(id);
      else rows.push([id]);
    });
    return rows;
  }

  function widgetRowKey(ids) {
    return ids.join('+');
  }

  function renderMultiWidgets() {
    if (!widgetMultiGrid) return;
    const rows = multiWidgetRows();
    const solo = rows.length === 1;
    widgetMultiGrid.innerHTML = rows.map((ids, rowIndex) => {
      const key = widgetRowKey(ids);
      // 위젯 하나만 떠 있을 땐 항상 세로로 꽉 채운다 — 예전에 드래그로 줄여놓은 값이 남아있어도
      // (테스트하면서 이것저것 줄여본 게 계정에 저장돼 있을 수 있음) 무시하고 매번 꽉 채운 채로 시작한다.
      // 그 자리의 손잡이(⋮)로 드래그하면 그 화면에 있는 동안만 줄일 수 있다.
      const soloH = 0;
      // 새로 열리거나 새로고침될 때는 항상 줄마다 똑같이(반반) 나눠서 시작한다 — 예전에 저장된
      // 비율값을 그대로 쓰면(특히 1보다 많이 작은 값) 브라우저에서 그 줄이 여백을 못 채우고
      // 비정상적으로 작게 굳어버리는 걸 확인했다. 세로 크기를 사람이 직접 조절하고 싶으면
      // 줄 사이의 드래그 막대(.widget-pane-splitter)로 그 자리에서 바로 조절하면 된다 —
      // 그건 이 값을 안 거치고 화면에 바로 반영되니 계속 잘 동작한다.
      const rowStyle = soloH > 0 ? `flex:0 0 ${soloH}px` : `flex-grow:1`;
      // 좌우 반반도 마찬가지 이유로 저장된 값을 안 쓰고 항상 반반에서 시작한다.
      const ratio = 0.5;
      const panes = ids.map((id, paneIndex) => {
        const basis = ids.length === 2 ? (paneIndex === 0 ? ratio : 1 - ratio) * 100 : 100;
        const pane = `<div class="widget-split-pane" data-widget-pane="${id}" style="flex:0 1 ${basis}%">${widgetPanelHtml(id, false)}</div>`;
        if (paneIndex === 0 && ids.length === 2) {
          return pane + `<div class="widget-pane-splitter vertical" data-widget-col-split="${key}" role="separator" aria-orientation="vertical" title="좌우 창 크기 조절"></div>`;
        }
        return pane;
      }).join('');
      const row = `<div class="widget-split-row" data-widget-row="${key}" style="${rowStyle}">${panes}</div>`;
      if (solo) {
        // 위젯 하나만 열려 있을 때: 기본은 프레임 끝까지 꽉 채우되, 이 핸들을 드래그하면 세로 크기를 직접 줄일 수 있다.
        return row + `<div class="widget-solo-resize${soloH > 0 ? ' is-custom' : ''}" data-widget-solo-resize="${key}" role="separator" aria-orientation="horizontal" title="세로 크기 조절 (더블클릭: 꽉 채우기)"><i></i></div>`;
      }
      if (rowIndex < rows.length - 1) {
        const nextKey = widgetRowKey(rows[rowIndex + 1]);
        return row + `<div class="widget-pane-splitter horizontal" data-widget-row-split="${key}|${nextKey}" role="separator" aria-orientation="horizontal" title="상하 창 크기 조절"></div>`;
      }
      return row;
    }).join('');
    // 강의실 패널 안의 "단어/문장" 등은 렌더 후 비동기로 채워지는데(curFillTreeContent),
    // 이 함수는 HTML만 새로 꽂고 끝나서(위에서 innerHTML만 교체) 그 채우기가 한 번도
    // 안 불리는 경우가 있었다 — 그럴 때 "불러오는 중…"에서 영영 안 바뀌는 문제였다.
    if (state.widgetMulti.includes('curriculum')) {
      const bodyEl = widgetMultiGrid.querySelector('[data-widget-panel="curriculum"] .widget-panel-body');
      if (bodyEl) { curFillTreeContent(bodyEl); curAutoGrowAll(bodyEl); }
    }
  }

  function toggleWidgetSize(widgetId) {
    if (WIDGETS[widgetId]?.mode !== 'multi') return;
    state.widgetSizes[widgetId] = state.widgetSizes[widgetId] === 'full' ? 'half' : 'full';
    saveVisibleWidgetHeights();
    saveWidgetLayout();
    renderMultiWidgets();
  }

  function reorderMultiWidget(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const from = state.widgetMulti.indexOf(sourceId);
    const to = state.widgetMulti.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const next = [...state.widgetMulti];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    state.widgetMulti = next;
    saveWidgetLayout();
    renderMultiWidgets();
  }

  function renderSingleWidget() {
    if (!widgetSingleStage) return;
    if (!state.widgetSingle) {
      widgetSingleStage.hidden = true;
      widgetSingleStage.innerHTML = '';
      return;
    }
    widgetSingleStage.hidden = false;
    widgetSingleStage.innerHTML = widgetPanelHtml(state.widgetSingle, true);
  }

  function syncWidgetWorkspace() {
    const host = widgetHost();
    // 현재 host 에서 못 여는 위젯은 목록에서 정리 (예: 교재 화면으로 이동 시 영상 전용 위젯) —
    // 단, 영상목록/강의목록(videolist/lecturelist)은 강의실 위젯의 "배치용 목록 열기" 버튼으로도
    // 똑같이 여닫히므로, 지금 보는 화면과 같은 host라는 이유로 여기서 강제로 닫아버리면
    // 그 버튼을 눌러서 연 목록이 바로 다시 닫히는 것처럼 보인다 — 이 둘은 자동 정리 대상에서 뺀다.
    if (host) {
      const keep = state.widgetMulti.filter(id => id === 'videolist' || id === 'lecturelist' || widgetAllowedOnHost(id, host));
      if (keep.length !== state.widgetMulti.length) { state.widgetMulti = keep; saveWidgetLayout(); }
      if (state.widgetSingle && state.widgetSingle !== 'videolist' && state.widgetSingle !== 'lecturelist' && !widgetAllowedOnHost(state.widgetSingle, host)) state.widgetSingle = null;
    }
    const hasWidgets = !!state.widgetSingle || state.widgetMulti.length > 0;
    const open = !!host && hasWidgets;
    body.classList.toggle('widget-workspace-open', open);
    if (widgetWorkspace) {
      widgetWorkspace.setAttribute('aria-hidden', open ? 'false' : 'true');
      widgetWorkspace.hidden = !open;
    }
    if (widgetSplitter) widgetSplitter.hidden = !open;
    if (!open) {
      syncWidgetRail();
      return;
    }
    if (state.widgetSingle) {
      if (widgetMultiGrid) widgetMultiGrid.hidden = true;
      renderSingleWidget();
    } else {
      if (widgetMultiGrid) widgetMultiGrid.hidden = false;
      renderSingleWidget();
      renderMultiWidgets();
    }
    if (state.widgetMulti.includes('homework')) { hydrateHomeworkWidget(); if (!state.curriculum.roster) ensureRoster().then(() => refreshHomeworkWidgetBody()); }
    if (state.widgetMulti.includes('curriculum') && !state.curriculum.board && !state.curriculum.loading) {
      setTimeout(() => { loadCurriculumBoard().then(refreshDialogueWidgetBody); }, 40);
    }
    if (state.widgetMulti.includes('library') && !state.library.lectures && !state.library.loading) {
      setTimeout(loadLibrarySources, 40);
    }
    syncWidgetRail();
  }

  function suspendWidgetWorkspace() {
    body.classList.remove('widget-workspace-open');
    if (widgetWorkspace) {
      widgetWorkspace.hidden = true;
      widgetWorkspace.setAttribute('aria-hidden', 'true');
    }
    if (widgetSplitter) widgetSplitter.hidden = true;
    syncWidgetRail();
  }

  function setMultiWidget(widgetId, enabled) {
    const item = WIDGETS[widgetId];
    if (!item || item.mode !== 'multi') return;
    const exists = state.widgetMulti.includes(widgetId);
    const changed = (enabled && !exists) || (!enabled && exists);
    if (enabled && !exists) state.widgetMulti.push(widgetId);
    if (!enabled && exists) state.widgetMulti = state.widgetMulti.filter(id => id !== widgetId);
    state.widgetSingle = null;
    // 열린 위젯 구성이 바뀌면(추가/제거) 이전에 손으로 줄여둔 세로 크기는 잊고 항상 다시 꽉 채운다.
    if (changed) state.widgetSoloHeights = {};
    saveWidgetLayout();
    syncWidgetWorkspace();
    if (widgetId === 'word' && enabled) setTimeout(requestVideoWordContext, 60);
    if (widgetId === 'questions' && enabled) setTimeout(() => { requestVideoWordContext(); requestQuestionList(); }, 80);
    if (widgetId === 'sentence' && enabled) ensureSentenceContext();
    if (widgetId === 'grammar' && enabled) setTimeout(() => { requestVideoWordContext(); if (state.wordContext?.videoId) loadGrammarTags(state.wordContext.videoId); }, 80);
    if (widgetId === 'lecturelist' && !enabled) showYoutubeForWidgets();
    if (widgetId === 'homework' && enabled) {
      ensureRoster().then(async () => {
        // 영상이 안 열려 있으면 hwRef()가 "지금 회차"로 대체하는데, 그러려면 그 학생의 회차 목록이
        // 먼저 있어야 한다 — 커리큘럼 위젯을 따로 안 열어도 여기서 한 번 보장해둔다.
        if (!state.wordContext?.videoId && !state.curriculum.board && window.CurriculumStore) {
          try { await loadCurriculumBoard(); } catch (_) {}
        }
        loadHomework();
        refreshHomeworkWidgetBody();
      });
      setTimeout(() => { requestVideoWordContext(); refreshHomeworkWidgetBody(); }, 60);
    }
    if (widgetId === 'curriculum') {
      // 열릴 때 보드를 새로 불러와야 하면 syncWidgetWorkspace()가 이미 loadCurriculumBoard()를
      // 걸어준다(대화방 갱신도 같이). 여기서는 이미 불러온 보드가 있는 경우(학생 유지)만 바로 갱신.
      if (enabled && state.curriculum.board) refreshDialogueWidgetBody();
      else if (!enabled) setTimeout(pushProgressContext, 0); // 위젯 닫으면 마커 UI만 비활성 (대화방은 유지)
    }
    // 판서·진도마커(ensureCurriculumContext)와 마찬가지로, 대화/메모 위젯만 따로 열었을 때도
    // (강의실 위젯을 한 번도 안 연 상태) 학생 맥락을 미리 받아둔다 — 안 그러면 대화는 그 학생
    // 방이 아니라 공용 임시방으로 열리고, 메모는 "학생을 먼저 선택하세요"만 보인다.
    if (widgetId === 'dialogue' && enabled) ensureCurriculumContext().then(refreshDialogueWidgetBody);
    if (widgetId === 'memo' && enabled) ensureCurriculumContext().then(refreshMemoWidgetBody);
    if (widgetId === 'library' && enabled) setTimeout(loadLibrarySources, 60);
  }

  function openSingleWidget(widgetId) {
    const item = WIDGETS[widgetId];
    if (!item || item.mode !== 'single') return;
    state.widgetSingle = state.widgetSingle === widgetId ? null : widgetId;
    saveWidgetLayout();
    syncWidgetWorkspace();
    if (state.widgetSingle === 'settings') setTimeout(requestOpenAIKeyStatus, 60);
  }

  function openWidget(widgetId) {
    if (!widgetAllowedOnHost(widgetId)) return;
    const item = WIDGETS[widgetId];
    if (!item) return;
    if (item.mode === 'multi') return setMultiWidget(widgetId, !state.widgetMulti.includes(widgetId));
    return openSingleWidget(widgetId);
  }

  function closeWidget(widgetId = null) {
    const hadCurriculum = state.widgetMulti.includes('curriculum');
    // 강의(강의목록) 위젯을 직접 닫으면, 유튜브유지 때문에 치워뒀던 유튜브 화면을 다시 보여준다.
    if (widgetId === 'lecturelist' || (!widgetId && state.widgetMulti.includes('lecturelist'))) showYoutubeForWidgets();
    if (widgetId && WIDGETS[widgetId]?.mode === 'multi') {
      state.widgetMulti = state.widgetMulti.filter(id => id !== widgetId);
    } else if (widgetId && WIDGETS[widgetId]?.mode === 'single') {
      if (state.widgetSingle === widgetId) state.widgetSingle = null;
    } else if (state.widgetSingle) {
      state.widgetSingle = null;
    } else {
      state.widgetMulti = [];
    }
    // 열린 위젯 구성이 바뀌었으니 손으로 줄여둔 세로 크기는 잊고 항상 다시 꽉 채운다.
    state.widgetSoloHeights = {};
    saveWidgetLayout();
    syncWidgetWorkspace();
    if (hadCurriculum && !state.widgetMulti.includes('curriculum')) {
      setTimeout(pushProgressContext, 0); // 위젯 닫으면 마커 UI 비활성
    }
  }

  function message(text = '', type = '') {
    if (!text) {
      authMessage.hidden = true;
      authMessage.textContent = '';
      authMessage.className = 'auth-message';
      return;
    }
    authMessage.hidden = false;
    authMessage.textContent = text;
    authMessage.className = `auth-message ${type}`.trim();
  }

  function setHidden(el, hidden) { el.hidden = !!hidden; }

  function getRememberedId() {
    try { return (localStorage.getItem(REMEMBER_ID_KEY) || '').trim().toLowerCase(); } catch (_) { return ''; }
  }

  function setRememberedId(email, enabled) {
    try {
      if (enabled && email) localStorage.setItem(REMEMBER_ID_KEY, email.trim().toLowerCase());
      else localStorage.removeItem(REMEMBER_ID_KEY);
    } catch (_) {}
  }

  function setAuthMode(mode, presetEmail = '') {
    state.authMode = mode;
    if (presetEmail) state.authEmail = presetEmail;
    authForm.dataset.mode = mode;
    message();
    localMailbox.hidden = true;
    authForm.reset();
    const rememberedId = getRememberedId();
    if (!state.authEmail && mode === 'login' && rememberedId) state.authEmail = rememberedId;
    if (state.authEmail) document.getElementById('authEmail').value = state.authEmail;
    if (rememberId) rememberId.checked = !!rememberedId || mode === 'login';

    setHidden(nameField, mode !== 'signup');
    setHidden(rememberIdField, mode !== 'login');
    setHidden(passwordField, !['login', 'signup'].includes(mode));
    setHidden(passwordConfirmField, mode !== 'signup');
    setHidden(verifyCodeField, !['verify', 'reset'].includes(mode));
    setHidden(newPasswordField, mode !== 'reset');
    setHidden(loginLinks, mode !== 'login');
    setHidden(verifyActions, !['verify', 'forgot', 'reset'].includes(mode));
    setHidden(socialDivider, mode !== 'login');
    setHidden(googleLogin, mode !== 'login');

    if (mode === 'login') {
      authTitle.textContent = '로그인';
      authDescription.textContent = '이메일(ID)과 비밀번호로 로그인하세요.';
      authSubmit.textContent = '로그인';
      document.getElementById('authPassword').autocomplete = 'current-password';
    } else if (mode === 'signup') {
      authTitle.textContent = '회원가입';
      authDescription.textContent = '가입 후 이메일 인증을 완료해야 로그인할 수 있습니다.';
      authSubmit.textContent = '가입하고 인증코드 받기';
      document.getElementById('authPassword').autocomplete = 'new-password';
    } else if (mode === 'verify') {
      authTitle.textContent = '이메일 인증';
      authDescription.textContent = `${state.authEmail || '가입 이메일'}로 발급된 6자리 인증코드를 입력하세요.`;
      authSubmit.textContent = '이메일 인증 완료';
    } else if (mode === 'forgot') {
      authTitle.textContent = '비밀번호 찾기';
      authDescription.textContent = '가입한 이메일(ID)을 입력하면 LOCAL 재설정 인증코드를 발급합니다.';
      authSubmit.textContent = '재설정 인증코드 받기';
    } else if (mode === 'reset') {
      authTitle.textContent = '비밀번호 재설정';
      authDescription.textContent = `${state.authEmail || '가입 이메일'}로 발급된 코드를 입력하고 새 비밀번호를 설정하세요.`;
      authSubmit.textContent = '새 비밀번호 저장';
    }
    setTimeout(() => {
      let target;
      if (mode === 'verify' || mode === 'reset') target = document.getElementById('authCode');
      else if (mode === 'login' && document.getElementById('authEmail').value) target = document.getElementById('authPassword');
      else target = document.getElementById('authEmail');
      target?.focus();
    }, 30);
  }

  function syncAuthLangSelect() {
    if (!authLangSelect) return;
    authLangSelect.innerHTML = Object.entries(LEARNING_LANGS)
      .map(([value, item]) => `<option value="${value}" ${state.learningLanguage === value ? 'selected' : ''}>${item.name}</option>`)
      .join('');
  }
  function openAuth(mode = 'login', email = '') {
    modalBackdrop.hidden = false;
    syncAuthLangSelect();
    if (email) state.authEmail = email;
    else if (mode === 'login' && !state.authEmail) state.authEmail = getRememberedId();
    setAuthMode(mode, email || state.authEmail);
  }

  function closeAuth() {
    modalBackdrop.hidden = true;
    authForm.reset();
    message();
    localMailbox.hidden = true;
  }

  function closeMypageMenu() {
    const menu = document.querySelector('[data-mypage-menu]');
    if (menu) menu.hidden = true;
  }

  async function renderAccount() {
    try {
      const result = await api('/api/auth/me');
      state.user = result.user;
      state.actingAs = !!result.actingAs;
      state.realUser = result.realUser || null;
      if (result.reason === 'ip_changed') alert(result.message || '접속 IP가 바뀌어 로그인이 해제되었습니다. 다시 로그인해 주세요.');
    } catch (_) {
      state.user = null;
      state.actingAs = false;
      state.realUser = null;
    }
    const user = state.user;
    if (!user) {
      accountArea.innerHTML = '<button class="link-button" type="button" data-modal="login">로그인</button><button class="signup-button" type="button" data-modal="signup">회원가입</button>';
      loadWidgetLayout();
      suspendWidgetWorkspace();
      return;
    }
    syncPreviewShell();
    const initial = (user.name || user.email || 'U').slice(0, 1).toUpperCase();
    accountArea.innerHTML = `
      <span id="simBarSlot"></span>
      <span id="readingPrefsSlot">${readingPrefsBarHtml()}</span>
      <div class="mypage-dropdown" data-mypage-dropdown>
        <button class="mypage-trigger" type="button" data-mypage-toggle title="${escapeHtml(user.email)}"><span class="avatar-mini">${escapeHtml(initial)}</span>Mypage</button>
        <div class="mypage-menu" data-mypage-menu hidden>
          <button type="button" data-account-page="classroom">강의실</button>
          <button type="button" data-account-page="mypage">Myinfo</button>
          <button type="button" data-logout>로그아웃</button>
          ${user.role === 'admin' ? '<button type="button" data-account-page="grammar-admin">문법리스트</button>' : ''}
          ${user.role === 'admin' ? '<button type="button" data-account-page="admin">회원관리</button>' : ''}
        </div>
      </div>
      <button class="link-button" type="button" data-hard-refresh title="화면이 캐시 때문에 안 바뀌는 것 같을 때 눌러주세요 (임시 버튼)">🔄 새로고침</button>`;
    renderSimBar();
    fillAccountViews();
    loadWidgetLayout();
    syncWidgetWorkspace();
    // 새로고침으로 "대화"/"메모"가 이미 열린 상태로 복원될 때도(사용자가 직접 켠 게 아니라
    // 저장된 레이아웃이라 setMultiWidget()을 안 거침) 학생 맥락을 미리 받아온다.
    if (state.widgetMulti.includes('dialogue')) ensureCurriculumContext().then(refreshDialogueWidgetBody);
    if (state.widgetMulti.includes('memo')) ensureCurriculumContext().then(refreshMemoWidgetBody);
    if (state.widgetMulti.includes('sentence')) ensureSentenceContext();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }

  // 화면에 이름 표시할 때 성/뒷이름 빼고 앞 단어만 (전체 이름은 title 툴팁으로)
  function shortName(full) {
    return String(full || '').trim().split(/\s+/)[0] || full;
  }

  // 학생 카드에 "선생님-학생" 형태로 쓸 담당 교사 이름 (이메일만 있을 때는 devUsers에서 찾음)
  function curTeacherNameFor(teacherEmail) {
    if (!teacherEmail) return '';
    if (teacherEmail === state.user?.email) return shortName(state.user.name || state.user.email);
    const u = (state.devUsers || []).find(x => x.email === teacherEmail);
    return shortName(u?.name || teacherEmail);
  }

  /* ── LOCAL 시뮬레이션 스위처 (admin 전용) ── */
  async function renderSimBar() {
    const slot = document.getElementById('simBarSlot');
    const isAdminReal = state.user?.role === 'admin' || state.actingAs;
    if (!slot) return;
    if (!isAdminReal) { slot.innerHTML = ''; return; }
    if (!state.devUsers) {
      try { state.devUsers = (await api('/api/dev/users')).users || []; } catch (_) { state.devUsers = []; }
    }
    const effective = state.user?.email || '';
    const opts = (state.devUsers || []).map(u => {
      const full = u.name || u.email;
      const teacherOf = u.teacher ? (state.devUsers.find(x => x.email === u.teacher) || {}).name || u.teacher : '';
      const label = teacherOf ? `${shortName(teacherOf)}-${shortName(full)}` : full;
      return `<option value="${escapeHtml(u.email)}" title="${escapeHtml(full)} · ${escapeHtml(roleLabel(u.role))}" ${u.email === effective ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    }).join('');
    slot.innerHTML = `<select id="simSelect" class="sim-select" aria-label="사용자 전환" title="계정 전환해서 다른 사용자 화면 테스트">${opts}</select>`;
  }

  // 강의(KorLecture) 화면마다 따로 있던 번역/번역언어/읽기속도를 상단 메뉴의 전역 설정으로 옮긴 것.
  // 강의 하나에만 적용되는 게 아니라, 로그인 상태 전체에서 항상 같은 값을 쓰고 postToModuleFrame으로
  // 지금 열려 있는 강의(또는 영상, 언어는 자막에도)에 실시간 반영된다.
  function readingPrefsBarHtml() {
    const speeds = [0.6, 0.7, 0.8, 0.9, 1];
    const speedOptions = speeds.map(s => `<option value="${s}" ${state.readingSpeed === s ? 'selected' : ''}>${Math.round(s * 100)}%</option>`).join('');
    const langOptions = Object.entries(LEARNING_LANGS).map(([value, item]) =>
      `<option value="${value}" ${state.learningLanguage === value ? 'selected' : ''}>${item.name}</option>`
    ).join('');
    return `<span class="reading-prefs-bar" title="번역 · 번역 언어 · 읽기 속도 — 강의 전체에 공통 적용">
      <button type="button" class="reading-xlate-toggle${state.readingTranslationOn ? ' on' : ''}" data-reading-translation-toggle title="번역 표시 켜기/끄기">번역</button>
      <select class="reading-lang-select" data-learning-language aria-label="번역 언어">${langOptions}</select>
      <select class="reading-speed-select" data-reading-speed aria-label="읽기 속도">${speedOptions}</select>
    </span>`;
  }
  function refreshReadingPrefsBar() {
    const slot = document.getElementById('readingPrefsSlot');
    if (slot) slot.innerHTML = readingPrefsBarHtml();
  }
  function syncReadingPrefsToModule() {
    return postToModuleFrame({ type: 'koredu-set-reading-prefs', translationOn: state.readingTranslationOn, speed: state.readingSpeed });
  }

  async function actAs(email) {
    try {
      await api('/api/dev/act-as', { method: 'POST', body: email ? { email } : { clear: true } });
      location.reload();
    } catch (err) { message(err.message, 'error'); }
  }

  async function openMailbox() {
    const email = (document.getElementById('authEmail').value || state.authEmail).trim().toLowerCase();
    if (!email) return message('먼저 이메일(ID)을 입력하세요.', 'error');
    state.authEmail = email;
    localMailbox.hidden = false;
    mailCard.textContent = '메일함 확인 중...';
    try {
      const result = await api(`/api/auth/mailbox?email=${encodeURIComponent(email)}`);
      if (!result.mail) {
        mailCard.textContent = '아직 발급된 인증메일이 없습니다.';
        return;
      }
      const kind = result.mail.kind === 'reset' ? '비밀번호 재설정' : '회원가입 이메일 인증';
      mailCard.innerHTML = `<strong>${escapeHtml(kind)}</strong><div class="mail-code">${escapeHtml(result.mail.code)}</div><div>${escapeHtml(email)}</div><div class="mail-meta">LOCAL 개발용 인증코드 · ${CODE_MINUTES_TEXT}</div>`;
      const codeInput = document.getElementById('authCode');
      if (codeInput && !codeInput.value) codeInput.value = result.mail.code;
    } catch (err) {
      mailCard.textContent = err.message;
    }
  }

  const CODE_MINUTES_TEXT = '약 15분 동안 유효';

  async function submitAuth() {
    const mode = state.authMode;
    const email = document.getElementById('authEmail').value.trim().toLowerCase();
    const password = document.getElementById('authPassword').value;
    const passwordConfirm = document.getElementById('authPasswordConfirm').value;
    const code = document.getElementById('authCode').value.trim();
    const newPassword = document.getElementById('authNewPassword').value;
    const name = document.getElementById('authName').value.trim();
    state.authEmail = email || state.authEmail;
    authSubmit.disabled = true;

    try {
      if (mode === 'login') {
        const result = await api('/api/auth/login', { method: 'POST', body: { email, password } });
        setRememberedId(email, !!rememberId?.checked);
        state.authEmail = email;
        state.user = result.user;
        closeAuth();
        await renderAccount();
        const nextPage = sessionStorage.getItem('koredu_after_login') || 'classroom';
        sessionStorage.removeItem('koredu_after_login');
        if (nextPage.startsWith('module:')) {
          const [, sectionId, itemId] = nextPage.split(':');
          openModule(sectionId, itemId);
        } else if (nextPage === 'mypage') showMyPage();
        else showClassroom();
      } else if (mode === 'signup') {
        if (password !== passwordConfirm) throw new Error('비밀번호 확인이 일치하지 않습니다.');
        const result = await api('/api/auth/signup', { method: 'POST', body: { email, password, name } });
        state.authEmail = result.email;
        setAuthMode('verify', result.email);
        message('가입정보를 저장했습니다. LOCAL 인증메일함에서 코드를 확인한 뒤 인증하세요.', 'success');
      } else if (mode === 'verify') {
        const result = await api('/api/auth/verify', { method: 'POST', body: { email: state.authEmail || email, code } });
        setAuthMode('login', state.authEmail || email);
        message(result.message, 'success');
      } else if (mode === 'forgot') {
        const result = await api('/api/auth/forgot', { method: 'POST', body: { email } });
        state.authEmail = email;
        setAuthMode('reset', email);
        message(result.message + ' LOCAL 인증메일함을 확인하세요.', 'success');
      } else if (mode === 'reset') {
        const result = await api('/api/auth/reset', { method: 'POST', body: { email: state.authEmail || email, code, password: newPassword } });
        setAuthMode('login', state.authEmail || email);
        message(result.message, 'success');
      }
    } catch (err) {
      if (err.data?.code === 'EMAIL_NOT_VERIFIED') {
        state.authEmail = err.data.email || email;
        setAuthMode('verify', state.authEmail);
        message(err.message, 'error');
      } else {
        message(err.message, 'error');
      }
    } finally {
      authSubmit.disabled = false;
    }
  }

  document.addEventListener('change', async e => {
    if (e.target?.id === 'authLangSelect') {
      setLearningLanguage(e.target.value, false);
      return;
    }
    if (e.target?.id === 'simSelect') {
      const email = e.target.value;
      return actAs((state.realUser?.email || state.user?.email) === email ? null : email);
    }
    const rosterSel = e.target?.closest?.('[data-roster-teacher]');
    if (rosterSel) return applyRosterTeacher(rosterSel.dataset.rosterTeacher, rosterSel.value);
    if (e.target?.closest?.('[data-cur-student]')) {
      state.curriculum.student = e.target.value;
      state.curriculum.activeSessionId = '';
      state.curriculum.board = null;
      state.curriculum.activeReview = null;
      state.curriculum.sentences = {};
      refreshDialogueWidgetBody();   // 학생이 바뀌었으니 대화방도 그 학생 것으로 갱신
      if (state.widgetMulti.includes('sentence')) sentFetchList().then(refreshSentenceWidgetBody);
      return loadCurriculumBoard();
    }
    if (e.target?.closest?.('[data-cur-bulk-n]')) {
      state.curriculum.bulkN = Math.max(1, Math.min(40, Number(e.target.value) || 1));
      refreshCurriculumWidgetBody();
      return;
    }
    if (e.target?.closest?.('[data-cur-bulk-from]')) {
      state.curriculum.bulkFrom = Math.max(0, Math.min(999, Number(e.target.value) || 0));
      refreshCurriculumWidgetBody();
      return;
    }
    if (e.target?.closest?.('[data-cur-bulk-yt]')) {
      state.curriculum.bulkYt = !!e.target.checked;
      return;
    }
    if (e.target?.closest?.('[data-cur-bulk-lec]')) {
      state.curriculum.bulkLec = !!e.target.checked;
      return;
    }
    const wordCheck = e.target?.closest?.('[data-cur-word-check]');
    if (wordCheck) {
      state.curriculum.wordChecked[wordCheck.dataset.curWordCheck] = !!wordCheck.checked;
      return;
    }
    const sessDelChk = e.target?.closest?.('[data-cur-sess-delchk]');
    if (sessDelChk) {
      const c = state.curriculum;
      c.sessDelChecked = c.sessDelChecked || {};
      c.sessDelChecked[sessDelChk.dataset.curSessDelchk] = !!sessDelChk.checked;
      curRefreshSessBulkDelBtn();
      return;
    }
    const rcnt = e.target?.closest?.('[data-cur-rule-cnt]');
    if (rcnt) {
      const [type, lk] = rcnt.dataset.curRuleCnt.split('|');
      curEnsureRules()[type][lk].count = Math.max(0, Math.min(9, Number(rcnt.value) || 0));
      return;
    }
    const revy = e.target?.closest?.('[data-cur-rule-every]');
    if (revy) {
      const [type, lk] = revy.dataset.curRuleEvery.split('|');
      curEnsureRules()[type][lk].every = Math.max(1, Math.min(20, Number(revy.value) || 1));
      return;
    }
    if (e.target?.closest?.('[data-cur-dist-n]')) { state.curriculum.distN = Math.max(1, Math.min(9, Number(e.target.value) || 2)); return; }
    if (e.target?.closest?.('[data-cur-dist-from]')) { state.curriculum.distFrom = Math.max(1, Math.min(40, Number(e.target.value) || 2)); return; }
    if (e.target?.closest?.('[data-cur-review-incomplete]')) {
      state.curriculum.reviewIncomplete = !!e.target.checked;
      refreshCurriculumWidgetBody();
      return;
    }
    const curName = e.target?.closest?.('[data-cur-name]');
    if (curName) {
      try {
        const res = await CurriculumStore.setNames({ student: curriculumCurrentStudent(), [curName.dataset.curName]: curName.value });
        if (state.curriculum.board) state.curriculum.board.names = res.names;
      } catch (err) { alert(err.message); }
      return;
    }
    const curNote = e.target?.closest?.('[data-cur-note]');
    if (curNote) {
      const [sid, k] = curNote.dataset.curNote.split('|');
      try { await CurriculumStore.setSessionNote({ session_id: sid, [k]: curNote.value }); }
      catch (err) { alert(err.message); }
      return;
    }
    const curRevFile = e.target?.closest?.('[data-cur-review-file]');
    if (curRevFile && curRevFile.files && curRevFile.files[0]) {
      const rk = curRevFile.dataset.curReviewFile;
      const file = curRevFile.files[0];
      curRevFile.value = '';
      if (file.size > 6 * 1024 * 1024) { alert('이미지는 6MB 이하만 올릴 수 있습니다.'); return; }
      const reader = new FileReader();
      reader.onload = () => curSaveReview(rk, { image: String(reader.result || '') });
      reader.readAsDataURL(file);
      return;
    }
    const curPace = e.target?.closest?.('[data-cur-pace]');
    if (curPace) {
      const field = curPace.dataset.curPace;
      const val = field === 'yt_sort' ? String(curPace.value) : Math.max(0, Number(curPace.value) || 0);
      state.curriculum.pace = state.curriculum.pace || {};
      state.curriculum.pace[field] = val;
      try {
        await CurriculumStore.setPace({ student: curriculumCurrentStudent(), [field]: val });
        await loadCurriculumBoard();
      } catch (err) { alert(err.message); loadCurriculumBoard(); }
      return;
    }
    const curDone = e.target?.closest?.('[data-cur-done]');
    if (curDone) {
      const sid = curDone.dataset.curDone, val = curDone.checked;
      curPatchSession(sid, { done: val });
      try {
        const r = await CurriculumStore.setSessionDone(sid, val);
        if (r.board) { state.curriculum.board = r.board; refreshCurriculumWidgetBody(); }
      } catch (err) { alert(err.message); loadCurriculumBoard(); }
      return;
    }
    const curStart = e.target?.closest?.('[data-cur-start]');
    if (curStart) {
      const sid = curStart.dataset.curStart, val = curStart.checked;
      curPatchSession(sid, { started: val, started_at: val ? Math.floor(Date.now() / 1000) : 0 });
      try {
        const r = await CurriculumStore.setSessionStart(sid, val);
        if (r.board) { state.curriculum.board = r.board; refreshCurriculumWidgetBody(); }
      } catch (err) { alert(err.message); loadCurriculumBoard(); }
      return;
    }
    const learningLanguage = e.target?.closest?.('[data-learning-language]');
    if (learningLanguage) {
      setLearningLanguage(learningLanguage.value, true);
      return;
    }
    const readingSpeedSel = e.target?.closest?.('[data-reading-speed]');
    if (readingSpeedSel) {
      state.readingSpeed = Number(readingSpeedSel.value) || 1;
      try { localStorage.setItem(READING_SPEED_KEY, String(state.readingSpeed)); } catch (_) {}
      syncReadingPrefsToModule();
      return;
    }
    // 구버전 DOM이 남아 있어도 전역 언어 하나로 흡수한다.
    const wordLanguage = e.target?.closest?.('[data-word-language]');
    if (wordLanguage) {
      setLearningLanguage(wordLanguage.value, true);
      return;
    }
    const questionLanguage = e.target?.closest?.('[data-question-language]');
    if (questionLanguage) {
      setLearningLanguage(questionLanguage.value, true);
      return;
    }
    const wordSourceCheck = e.target?.closest?.('[data-word-source-check]');
    if (wordSourceCheck) {
      const key = wordSourceCheck.dataset.wordSourceCheck;
      if (key === 'extracted' || key === 'saved') state.wordSourceSelection[key] = !!wordSourceCheck.checked;
      persistWordView();
      refreshWordWidgetBody();
      return;
    }
    const widgetCheck = e.target?.closest?.('[data-widget-check]');
    if (widgetCheck) {
      const wid = widgetCheck.dataset.widgetCheck;
      if (wid === 'board') { if (screenInkOn() !== !!widgetCheck.checked) toggleScreenInk(); return; }
      if (!widgetAllowedOnHost(wid)) { widgetCheck.checked = false; return; }
      return setMultiWidget(wid, !!widgetCheck.checked);
    }
    const hwFile = e.target?.closest?.('[data-hw-file]');
    if (hwFile && hwFile.files && hwFile.files[0]) { loadHomeworkImageFile(hwFile.files[0]); hwFile.value = ''; return; }
    const hwStudent = e.target?.closest?.('[data-hw-student]');
    if (hwStudent) {
      if (state.homework) state.homework.student = hwStudent.value;
      loadHomework();
      return;
    }
  });

  // 질문/답변 칸: 3줄로 시작 → 내용 따라 최대 10줄까지 늘어남 → 그 후 스크롤
  function curAutoGrow(el) {
    if (!el) return;
    const cs = getComputedStyle(el);
    const line = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) * 1.35) || 15;
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    const max = Math.round(line * 10 + pad);
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, max) + 'px';
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }
  function curAutoGrowAll(root) {
    (root || document).querySelectorAll('textarea[data-cur-grow]').forEach(curAutoGrow);
  }

  document.addEventListener('input', e => {
    const grow = e.target?.closest?.('textarea[data-cur-grow]');
    if (grow) curAutoGrow(grow);
    const libFilter = e.target?.closest?.('[data-lib-filter]');
    if (libFilter) {
      state.library.filter = libFilter.value;
      const b = libraryBodyEl();
      if (b) b.innerHTML = libraryWidgetBodyHtml();
      return;
    }
    const hwText = e.target?.closest?.('[data-hw-text]');
    if (hwText) {
      if (hwEditSnap) { hwHistory.push(hwEditSnap); if (hwHistory.length > 60) hwHistory.shift(); hwFuture = []; hwEditSnap = null; }
      const c = homeworkComment(hwText.dataset.hwText);
      if (c) { c.text = hwText.textContent; persistHomework(); }
      return;
    }
    const hwSize = e.target?.closest?.('[data-hw-size]');
    if (hwSize) return setHomeworkSize(parseFloat(hwSize.value));
    const hwName = e.target?.closest?.('[data-hw-name]');
    if (hwName) {
      const key = hwName.dataset.hwName === 'student' ? 'studentName' : 'teacherName';
      state.homework[key] = hwName.value;
      persistHomework();
      return;
    }

    const studentAnswer = e.target?.closest?.('[data-question-student-answer]');
    if (!studentAnswer) return;
    const index = Number(studentAnswer.dataset.questionStudentAnswer);
    const item = state.questionList?.questions?.[index];
    if (!item) return;
    const key = questionAnswerKey(item, index);
    state.questionStudentAnswers[key] = String(studentAnswer.value || '');
    persistQuestionStudentAnswers();
    const row = studentAnswer.closest('.question-row');
    const speak = row?.querySelector('[data-question-part="student"]');
    if (speak) speak.disabled = !String(studentAnswer.value || '').trim();
  });

  function setQuestionMatchHighlight(group, on) {
    if (!group) return;
    document.querySelectorAll(`[data-question-match="${CSS.escape(group)}"]`)
      .forEach(node => node.classList.toggle('hit', !!on));
  }

  document.addEventListener('pointerover', e => {
    const token = e.target?.closest?.('[data-question-match]');
    if (!token) return;
    setQuestionMatchHighlight(token.dataset.questionMatch, true);
  });

  document.addEventListener('pointerout', e => {
    const token = e.target?.closest?.('[data-question-match]');
    if (!token) return;
    const related = e.relatedTarget?.closest?.('[data-question-match]');
    if (related?.dataset?.questionMatch === token.dataset.questionMatch) return;
    setQuestionMatchHighlight(token.dataset.questionMatch, false);
  });

  // 영상/교재 레일의 서브메뉴: 버튼↔플라이아웃 사이를 지나갈 때 살짝 벗어나도
  // 바로 닫히지 않게 유예시간을 둔다 (마우스 롤오버 경로가 완벽히 직선이 아니어도 됨).
  let _navFlyoutCloseT = null;
  document.addEventListener('pointerover', e => {
    const item = e.target?.closest?.('.widget-nav-item');
    if (item) {
      if (_navFlyoutCloseT) { clearTimeout(_navFlyoutCloseT); _navFlyoutCloseT = null; }
      document.querySelectorAll('.widget-nav-item.nav-open').forEach(el => { if (el !== item) el.classList.remove('nav-open'); });
      item.classList.add('nav-open');
    }
  });
  document.addEventListener('pointerout', e => {
    const item = e.target?.closest?.('.widget-nav-item');
    if (!item) return;
    const related = e.relatedTarget?.closest?.('.widget-nav-item');
    if (related === item) return;   // 같은 항목(버튼↔플라이아웃) 안에서 이동 — 무시
    if (_navFlyoutCloseT) clearTimeout(_navFlyoutCloseT);
    _navFlyoutCloseT = setTimeout(() => {
      document.querySelectorAll('.widget-nav-item.nav-open').forEach(el => el.classList.remove('nav-open'));
      _navFlyoutCloseT = null;
    }, 320);
  });

  /* ── W04 복습 위젯: 코멘트 드래그 · 크기조절 · 포커스 · 붙여넣기 ── */
  document.addEventListener('focusin', e => {
    const t = e.target?.closest?.('[data-hw-text]');
    if (t) { hwFocusedId = t.dataset.hwText; hwEditSnap = hwState(); }
  });
  document.addEventListener('focusout', e => {
    if (e.target?.closest?.('[data-hw-text]')) hwEditSnap = null;
  });
  document.addEventListener('pointerdown', e => {
    // 이미지 크기 조절 핸들
    const rz = e.target?.closest?.('[data-hw-resize]');
    if (rz) {
      const img = homeworkBodyEl()?.querySelector('[data-hw-img]');
      hwResizeDrag = { sx: e.clientX, sy: e.clientY,
        sz: hwClampZoom(state.homework.zoom),
        baseH: (img?.clientHeight || 300) };
      rz.setPointerCapture?.(e.pointerId);
      e.preventDefault();
      return;
    }
    const grip = e.target?.closest?.('[data-hw-grip]');
    const textEl = e.target?.closest?.('[data-hw-text]');
    let id = null, stage = null;
    if (grip) { id = grip.dataset.hwGrip; stage = grip.closest('.hw-stage'); }
    else if (textEl && (e.ctrlKey || e.metaKey)) { id = textEl.dataset.hwText; stage = textEl.closest('.hw-stage'); }
    if (id == null) return;
    const img = stage?.querySelector('[data-hw-img]');
    const c = homeworkComment(id);
    if (!img || !c) return;
    if (grip || e.ctrlKey || e.metaKey) hwSnapshot();
    const r = img.getBoundingClientRect();
    hwDrag = { id, sx: e.clientX, sy: e.clientY, ox: Number(c.x), oy: Number(c.y), w: r.width, h: r.height };
    hwDragMoved = false;
    e.preventDefault();
  });
  document.addEventListener('pointermove', e => {
    if (hwResizeDrag) {
      const d = ((e.clientX - hwResizeDrag.sx) + (e.clientY - hwResizeDrag.sy)) / 2;
      const factor = 1 + d / Math.max(60, hwResizeDrag.baseH);
      setHomeworkZoomLive(hwResizeDrag.sz * factor);
      return;
    }
    if (!hwDrag) return;
    hwDragMoved = true;
    const c = homeworkComment(hwDrag.id);
    if (!c) return;
    c.x = Math.min(1, Math.max(0, hwDrag.ox + (e.clientX - hwDrag.sx) / hwDrag.w));
    c.y = Math.min(1, Math.max(0, hwDrag.oy + (e.clientY - hwDrag.sy) / hwDrag.h));
    const el = homeworkBodyEl()?.querySelector(`.hw-cmt[data-hw-cmt="${CSS.escape(String(hwDrag.id))}"]`);
    if (el) {
      el.style.left = (c.x * 100) + '%';
      el.style.top = (c.y * 100) + '%';
      el.style.maxWidth = Math.max(18, 97 - c.x * 100).toFixed(1) + '%';
    }
  });
  document.addEventListener('pointerup', () => {
    if (hwResizeDrag) { hwResizeDrag = null; persistHomework(); return; }
    if (!hwDrag) return;
    persistHomework();
    hwDrag = null;
    setTimeout(() => { hwDragMoved = false; }, 60);
  });
  // 코멘트 안에 붙여넣기는 "순수 텍스트"만 — 이미지/HTML 유입 차단
  document.addEventListener('paste', e => {
    const t = e.target?.closest?.('[data-hw-text]');
    if (!t) return;
    e.preventDefault();
    const txt = (e.clipboardData || window.clipboardData)?.getData?.('text/plain') || '';
    if (txt) document.execCommand && document.execCommand('insertText', false, txt);
  });
  document.addEventListener('dragover', e => {
    const root = e.target?.closest?.('.hw-root');
    if (!root) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    root.classList.add('hw-over');
  });
  document.addEventListener('dragleave', e => {
    const root = e.target?.closest?.('.hw-root');
    if (root && !root.contains(e.relatedTarget)) root.classList.remove('hw-over');
  });
  document.addEventListener('drop', e => {
    const root = e.target?.closest?.('.hw-root');
    if (!root) return;
    e.preventDefault();
    root.classList.remove('hw-over');
    const file = e.dataTransfer?.files && e.dataTransfer.files[0];
    if (!file || !file.type || !file.type.startsWith('image/')) return;
    if (state.homework?.image && (state.homework.comments || []).length
      && !confirm('현재 첨삭을 지우고 새 이미지로 교체할까요?')) return;
    loadHomeworkImageFile(file);
  });
  window.addEventListener('resize', () => { if (state.widgetMulti.includes('homework')) sizeHomeworkStage(); });
  // 마우스 휠 = 코멘트 글자 크기 확대/축소
  document.addEventListener('wheel', e => {
    const cmt = e.target?.closest?.('.hw-cmt');
    if (!cmt || !state.homework?.image) return;
    const c = homeworkComment(cmt.dataset.hwCmt);
    if (!c) return;
    e.preventDefault();
    const cur = Number(c.size) || state.homework.size || 2.4;
    // 아래로 돌리면 확대(deltaY>0), 위로 돌리면 축소
    const next = Math.min(6, Math.max(1, cur * (e.deltaY > 0 ? 1.1 : 0.909)));
    c.size = Math.round(next * 100) / 100;
    state.homework.size = c.size;
    sizeHomeworkComments();
    const slider = homeworkPanelEl()?.querySelector('[data-hw-size]');
    if (slider) slider.value = c.size;
    clearTimeout(hwWheelTimer);
    hwWheelTimer = setTimeout(persistHomework, 220);
  }, { passive: false });

  document.addEventListener('click', async e => {
    if (e.target.closest('[data-reading-translation-toggle]')) {
      state.readingTranslationOn = !state.readingTranslationOn;
      try { localStorage.setItem(READING_XLATE_KEY, state.readingTranslationOn ? '1' : '0'); } catch (_) {}
      refreshReadingPrefsBar();
      syncReadingPrefsToModule();
      return;
    }
    const subBtn = e.target.closest('[data-sub-section][data-sub-item]');
    if (subBtn) return openModule(subBtn.dataset.subSection, subBtn.dataset.subItem);

    const masterBtn = e.target.closest('[data-master-section]');
    if (masterBtn) {
      const sectionId = masterBtn.dataset.masterSection;
      if (sectionId === 'topik') return openModule('topik', 'main');
      return previewMaster(sectionId);
    }

    const homeBtn = e.target.closest('[data-action="home"]');
    if (homeBtn) {
      // 로고 = "내 강의실 홈"으로 — 이전에 특정 학생 보드를 펼쳐본 채로 다른 화면에 갔다가
      // 로고를 누르면, 그 학생 보드가 빈 화면으로 다시 뜨는 문제가 있어 목록으로 되돌린다.
      state.curDash.openStudent = '';
      return showClassroom();   // 미로그인 시 requireLogin 이 로그인창
    }

    const openBtn = e.target.closest('[data-open]');
    if (openBtn) {
      const [sectionId, itemId] = openBtn.dataset.open.split(':');
      return openModule(sectionId, itemId);
    }

    const cdStudent = e.target.closest('[data-cd-student]');
    if (cdStudent) return openDashStudent(cdStudent.dataset.cdStudent);
    if (e.target.closest('[data-cd-back]')) return closeDashStudent();

    const approveBtn = e.target.closest('[data-cd-approve-student]');
    if (approveBtn) {
      approveBtn.disabled = true;
      try {
        const res = await api('/api/roster/approve-student', { method: 'POST', body: { student: approveBtn.dataset.cdApproveStudent } });
        message(res.message || '승인했습니다.', 'ok');
        await loadCurriculumDash();
      } catch (err) { alert(err.message); approveBtn.disabled = false; }
      return;
    }

    const viewToggleBtn = e.target.closest('[data-cd-view-toggle]');
    if (viewToggleBtn) {
      state.curDash.view = viewToggleBtn.dataset.cdViewToggle || '';
      await loadCurriculumDash();
      return;
    }

    const questionSort = e.target.closest('[data-question-sort]');
    if (questionSort) {
      const key = questionSort.dataset.questionSort;
      if (['question','answer','student'].includes(key)) {
        if (state.questionSort === key) state.questionSortDir = state.questionSortDir === 'asc' ? 'desc' : 'asc';
        else {
          state.questionSort = key;
          state.questionSortDir = 'asc';
        }
        persistQuestionView();
        refreshQuestionsWidgetBody();
      }
      return;
    }

    const questionSortReset = e.target.closest('[data-question-sort-reset]');
    if (questionSortReset) {
      state.questionSort = '';
      state.questionSortDir = 'asc';
      persistQuestionView();
      refreshQuestionsWidgetBody();
      return;
    }

    const questionColumnToggle = e.target.closest('[data-question-column-toggle]');
    if (questionColumnToggle) {
      const key = questionColumnToggle.dataset.questionColumnToggle;
      if (key === 'answer') state.questionShowAnswer = !(state.questionShowAnswer !== false);
      if (key === 'student') state.questionShowStudent = !(state.questionShowStudent !== false);
      persistQuestionView();
      refreshQuestionsWidgetBody();
      return;
    }

    const questionTranslationToggle = e.target.closest('[data-question-translation-toggle]');
    if (questionTranslationToggle) {
      state.questionShowTranslation = !(state.questionShowTranslation !== false);
      persistQuestionView();
      refreshQuestionsWidgetBody();
      return;
    }

    const questionSpeaker = e.target.closest('[data-question-speak]');
    if (questionSpeaker) {
      e.stopPropagation();
      return speakQuestionPart(questionSpeaker.dataset.questionSpeak, questionSpeaker.dataset.questionPart);
    }
    if (e.target.closest('[data-questions-listen-all]')) return speakAllQuestions();

    const questionSeek = e.target.closest('[data-question-seek]');
    if (questionSeek) return seekQuestion(questionSeek.dataset.questionSeek);

    const wordView = e.target.closest('[data-word-view]');
    if (wordView) {
      const view = wordView.dataset.wordView;
      if (view === 'extracted' || view === 'saved') state.wordView = view;
      persistWordView();
      refreshWordWidgetBody();
      return;
    }

    const savedSpeaker = e.target.closest('[data-saved-word-speak]');
    if (savedSpeaker) {
      e.stopPropagation();
      return speakTextKo(state.savedStudentWords?.[Number(savedSpeaker.dataset.savedWordSpeak)]?.text || '');
    }

    const savedRemove = e.target.closest('[data-saved-word-remove]');
    if (savedRemove) {
      e.stopPropagation();
      return removeSavedStudentWord(savedRemove.dataset.savedWordRemove);
    }

    const savedSeek = e.target.closest('[data-saved-word-seek]');
    if (savedSeek) return seekSavedStudentWord(savedSeek.dataset.savedWordSeek);

    const wordSpeaker = e.target.closest('[data-word-speak]');
    if (wordSpeaker) return speakWord(wordSpeaker.dataset.wordSpeak);

    const wordSeek = e.target.closest('[data-word-seek]');
    if (wordSeek) return seekWordOccurrence(wordSeek.dataset.wordSeek);

    if (e.target.closest('[data-word-listen-all]')) return speakAllExtractedWords();
    if (e.target.closest('[data-word-mp3]')) return makeWordBookMp3Placeholder();
    if (e.target.closest('[data-word-ai-extract]')) return runWordPipelineStage('words');
    if (e.target.closest('[data-word-translate]')) return runWordPipelineStage('translate');
    if (e.target.closest('[data-word-excel]')) return downloadWordExcel();
    if (e.target.closest('[data-openai-key-save]')) return saveOpenAIKeyFromSettings();

    const hwColorBtn = e.target.closest('[data-hw-color]');
    if (hwColorBtn) return setHomeworkColor(hwColorBtn.dataset.hwColor);
    const hwDelBtn = e.target.closest('[data-hw-del]');
    if (hwDelBtn) { e.stopPropagation(); return deleteHomeworkComment(hwDelBtn.dataset.hwDel); }
    const hwBoldBtn = e.target.closest('[data-hw-bold]');
    if (hwBoldBtn) { e.stopPropagation(); return toggleHomeworkBold(hwBoldBtn.dataset.hwBold); }
    if (e.target.closest('[data-hw-undo]')) return hwUndo();
    if (e.target.closest('[data-hw-redo]')) return hwRedo();
    if (e.target.closest('[data-hw-clear]')) return clearHomeworkComments();
    if (e.target.closest('[data-hw-save]')) return exportHomework();
    if (e.target.closest('[data-hw-print]')) return printHomework();
    if (e.target.closest('[data-hw-wongo]')) return printManuscriptPaper();

    const curDel = e.target.closest('[data-cur-del]');
    if (curDel) {
      if (!confirm('이 항목을 목록에서 삭제할까요?')) return;
      try { await CurriculumStore.unassign(curDel.dataset.curDel); await loadCurriculumBoard(); }
      catch (err) { alert(err.message); }
      return;
    }
    const curMic = e.target.closest('[data-cur-mic]');
    if (curMic) { curToggleDictation(curMic); return; }
    const curSay = e.target.closest('[data-cur-say]');
    if (curSay) { curSpeak(curSay.dataset.curSay); return; }
    const curSayAll = e.target.closest('[data-cur-say-all]');
    if (curSayAll) {
      const ref = curSayAll.dataset.curSayAll;
      const checkedRefs = Object.keys(state.curriculum.wordChecked).filter(r => state.curriculum.wordChecked[r]);
      const refsToRead = checkedRefs.length ? checkedRefs : [ref];
      const words = refsToRead.flatMap(r => (state.curriculum.wordlists[r] || []).map(w => w.ko)).filter(Boolean);
      curSpeakAll(words);
      return;
    }
    const curSayAllChecked = e.target.closest('[data-cur-say-all-checked]');
    if (curSayAllChecked) {
      // 헤더의 단일 "전체듣기" — 화면에 그려진 회차들 중 체크박스가 켜진 것만, 보이는 순서대로
      const groups = [...document.querySelectorAll('.cur-fl-body [data-cur-wordlist]')];
      const checkedRefs = groups
        .filter(el => el.querySelector('[data-cur-word-check]')?.checked)
        .map(el => el.dataset.curWordlist);
      if (!checkedRefs.length) { message('체크된 회차가 없습니다.', 'error'); return; }
      const words = checkedRefs.flatMap(r => (state.curriculum.wordlists[r] || []).map(w => w.ko)).filter(Boolean);
      curSpeakAll(words);
      return;
    }
    const curSayAllMerged = e.target.closest('[data-cur-say-all-merged]');
    if (curSayAllMerged) {
      const refs = curSayAllMerged.dataset.curSayAllMerged.split(',').filter(Boolean);
      const seen = new Set();
      const words = [];
      refs.forEach(r => (state.curriculum.wordlists[r] || []).forEach(w => {
        const key = String(w.ko || '').trim();
        if (!key || seen.has(key)) return;
        seen.add(key);
        words.push(key);
      }));
      words.sort((a, z) => a.localeCompare(z, 'ko'));
      curSpeakAll(words);
      return;
    }
    const curRevOpen = e.target.closest('[data-cur-review-open]');
    if (curRevOpen) {
      if (state.curriculum.canManage) curActivateReview(curRevOpen.dataset.curReviewOpen);
      return;
    }
    // 비활성 복습 화면 아무 데나 클릭 → 편집 시작 (선생만)
    const staticReview = e.target.closest('.cur-review:not(.is-active) [data-hw-static]');
    if (staticReview && state.curriculum.canManage) {
      const revEl = staticReview.closest('[data-cur-review-sess]');
      const sess = revEl?.dataset.curReviewSess;
      if (sess) curActivateReview(sess, revEl?.dataset.curReviewTab);
      return;
    }
    if (e.target.closest('[data-cur-review-close]')) {
      curCloseActiveReview();
      return;
    }
    const revFold = e.target.closest('[data-cur-review-fold]');
    if (revFold) {
      // 복습 메뉴가 항상 켜져 있는 트리뷰 쪽 "접기" — activeReview를 끄는 게 아니라 이 행 자체를 접는다.
      state.curriculum.collapsed[revFold.dataset.curReviewFold] = true;
      refreshCurriculumWidgetBody();
      return;
    }
    const boardAdd = e.target.closest('[data-cur-board-add]');
    if (boardAdd) {
      // 이 회차를 "지금 판서 캡처가 붙을 대상"으로 확정한 뒤, 위젯과 똑같은 판서(ScreenInk)를 연다.
      // 여기서 캡처하든 위젯 레일의 판서로 캡처하든 같은 회차 목록에 그대로 쌓인다.
      state.curriculum.activeReview = boardAdd.dataset.curBoardAdd;
      openScreenInk();
      return;
    }
    const boardView = e.target.closest('[data-cur-board-view]');
    if (boardView) {
      const sessionId = boardView.dataset.curBoardSess;
      const item = (state.curriculum.boardCaptures[sessionId] || []).find(x => x.id === boardView.dataset.curBoardView);
      if (item) window.open(item.image, '_blank');
      return;
    }
    const boardDel = e.target.closest('[data-cur-board-del]');
    if (boardDel) {
      if (!confirm('이 판서를 삭제할까요?')) return;
      const sessionId = boardDel.dataset.curBoardSess;
      const student = curriculumCurrentStudent();
      try {
        await CurriculumStore.deleteBoardCapture(student, sessionId, boardDel.dataset.curBoardDel);
        await refreshBoardCaptureViews(sessionId);
      } catch (err) { alert(err.message); }
      return;
    }
    const curProg = e.target.closest('[data-cur-prog]');
    if (curProg) {
      const chip = curProg.closest('[data-cur-chip]');
      const type = chip.dataset.curProgType;
      const ref = chip.dataset.curProgRef;
      const cur = Number(chip.dataset.curProgCur) || 0;
      const total = Number(chip.dataset.curProgTotal) || 0;
      const kind = type === 'word' ? '단어' : '복습';
      const raw = prompt(`${kind} 리스트 "${chip.dataset.curProgLabel}" 진도\n"현재/총" 형식으로 입력  (예: 5/12)`, `${cur}/${total || ''}`);
      if (raw == null) return;
      const m = String(raw).match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
      if (!m) { alert('형식이 올바르지 않습니다. 예: 5/12'); return; }
      const marker = Math.min(+m[1], +m[2]);
      try {
        await CurriculumStore.setProgress({
          student: curriculumCurrentStudent(), type, ref_id: ref,
          marker_index: marker, total: +m[2],
          session_id: chip.dataset.curProgSession || undefined,
          clear: marker === 0,
        });
        await loadCurriculumBoard();
      } catch (err) { alert(err.message); }
      return;
    }
    if (e.target.closest('[data-cur-add-session]')) {
      // 날짜는 넣지 않는다 — 회차만 추가하고 순서열대로 자동 배정. 시작 체크하면 그때가 날짜.
      const student = curriculumCurrentStudent();
      try {
        const s = await CurriculumStore.createSession(student);
        const r = await CurriculumStore.autofill(student, s.session.date);
        await loadCurriculumBoard();
        if (r.exhausted) alert(r.message);
        else message(`${s.session.seq}일차 추가 · 자동 배정 ${r.added}개`, 'ok');
      } catch (err) { alert(err.message); loadCurriculumBoard(); }
      return;
    }
    const curAutofill = e.target.closest('[data-cur-autofill]');
    if (curAutofill) {
      const student = curriculumCurrentStudent();
      try {
        const r = await CurriculumStore.autofill(student, curAutofill.dataset.curAutofill);
        await loadCurriculumBoard();
        if (r.exhausted) alert(r.message);
        else message(`단원 ${(r.units || []).join(', ')} 배정 (${r.added}개)`, 'ok');
      } catch (err) { alert(err.message); }
      return;
    }
    const curView = e.target.closest('[data-cur-view]');
    if (curView) {
      state.curriculum.view = curView.dataset.curView;
      try { localStorage.setItem('koredu_cur_view', state.curriculum.view); } catch (_) {}
      refreshCurriculumWidgetBody();
      return;
    }
    const curFilter = e.target.closest('[data-cur-filter]');
    if (curFilter) {
      state.curriculum.typeFilter = curFilter.dataset.curFilter;
      try { localStorage.setItem('koredu_cur_typefilter', state.curriculum.typeFilter); } catch (_) {}
      refreshCurriculumWidgetBody();
      return;
    }
    const flSort = e.target.closest('[data-cur-flsort]');
    if (flSort) { if (flSort.disabled) return; state.curriculum.filterSort = flSort.dataset.curFlsort; refreshCurriculumWidgetBody(); return; }
    const wordMergeAll = e.target.closest('[data-cur-word-mergeall]');
    if (wordMergeAll) { state.curriculum.wordMergeAll = !state.curriculum.wordMergeAll; refreshCurriculumWidgetBody(); return; }
    const wordToggle = e.target.closest('[data-cur-word-toggle]');
    if (wordToggle) {
      const ref = wordToggle.dataset.curWordToggle;
      state.curriculum.wordCollapsed[ref] = !state.curriculum.wordCollapsed[ref];
      refreshCurriculumWidgetBody();
      return;
    }
    const wordCollapseAll = e.target.closest('[data-cur-word-collapse-all]');
    if (wordCollapseAll) {
      if (wordCollapseAll.disabled) return;
      const c = state.curriculum;
      const allRefs = [...document.querySelectorAll('[data-cur-wordlist]')].map(el => el.dataset.curWordlist);
      const allCollapsedNow = allRefs.length && allRefs.every(ref => c.wordCollapsed[ref]);
      allRefs.forEach(ref => { c.wordCollapsed[ref] = !allCollapsedNow; });
      refreshCurriculumWidgetBody();
      return;
    }
    const pvBtn = e.target.closest('[data-cur-preview]');
    if (pvBtn) {
      const mode = pvBtn.dataset.curPreview;
      state.curriculum.previewAs = mode;
      state.curriculum.activeReview = null;
      document.querySelectorAll('.cur-preview button').forEach(b => b.classList.toggle('on', b.dataset.curPreview === mode));
      if (mode === 'student') {
        state.curriculum.canManage = false;
        state.curriculum.collapsed = { common: true, personal: true };
        refreshCurriculumWidgetBody();
      } else {
        loadCurriculumBoard();   // 서버본으로 canManage 복구
      }
      return;
    }
    if (e.target.closest('[data-cur-bulk-cfg]')) { state.curriculum.showBulkCfg = !state.curriculum.showBulkCfg; refreshCurriculumWidgetBody(); return; }
    if (e.target.closest('[data-cur-bulk-cfg-close]')) { state.curriculum.showBulkCfg = false; refreshCurriculumWidgetBody(); return; }
    const rlv = e.target.closest('[data-cur-rule-lv]');
    if (rlv) {
      const [type, lk, vk] = rlv.dataset.curRuleLv.split('|');
      const r = curEnsureRules();
      const set = new Set(r[type][lk].levels);
      set.has(vk) ? set.delete(vk) : set.add(vk);
      r[type][lk].levels = CUR_LV.map(x => x[0]).filter(k => set.has(k));
      refreshCurriculumWidgetBody();
      return;
    }
    if (e.target.closest('[data-cur-rule-save]')) {
      try {
        await CurriculumStore.setPace({
          student: curriculumCurrentStudent(),
          dist_rules: curEnsureRules(),
          interval_days: Number(state.curriculum.pace?.interval_days) || 7,
        });
        state.curriculum.showBulkCfg = false;
        refreshCurriculumWidgetBody();
        message('규칙 저장됨', 'ok');
      } catch (err) { alert(err.message); }
      return;
    }
    const bulkRun = e.target.closest('[data-cur-bulk-run]');
    if (bulkRun) {
      const c = state.curriculum;
      const sessions = c.board?.sessions || [];
      const lastSeq = sessions.length ? sessions[sessions.length - 1].seq : 0;
      const fromSeq = Math.max(0, Number(c.bulkFrom) || lastSeq);
      const wantYt = c.bulkYt !== false, wantLec = c.bulkLec !== false;
      const extending = fromSeq >= lastSeq;   // 마지막 회차(그 이후) = 새 회차를 만들어서 확장
      bulkRun.disabled = true;
      try {
        if (extending) {
          const n = Math.max(1, Number(c.bulkN) || 1);
          if (!confirm(`${fromSeq}회차 다음부터 ${n}개 회차를 만들고${wantLec ? ' 강의를' : ''}${wantLec && wantYt ? ' ·' : ''}${wantYt ? ' 유튜브를' : ''} 자동 배치할까요?`)) { bulkRun.disabled = false; return; }
          const r = await CurriculumStore.bulkAutofill(curriculumCurrentStudent(), n, wantLec);
          await loadCurriculumBoard();
          if (wantYt) {
            // 자료함 위젯에서 체크해둔 게 있으면 그걸, 없으면 카탈로그 전체를 레벨 규칙으로 걸러서 씀
            // (curDistributeYoutube 내부 처리) — 자체적으로 결과 메시지도 표시.
            await curDistributeYoutube(null, fromSeq + 1);
          } else {
            message(`${(r.made || []).length}개 회차 생성 · 자동 배치`, 'ok');
          }
        } else {
          // 마지막 회차보다 앞/중간 — 새 회차를 만들지 않고 기존 회차에 유튜브만 다시 배치
          if (!wantYt) { alert('중간 회차부터는 유튜브만 다시 배치할 수 있어요. "유튜브"를 체크해 주세요.'); bulkRun.disabled = false; return; }
          if (!confirm(`${fromSeq}회차 다음부터 기존 회차에 유튜브를 다시 배치할까요?`)) { bulkRun.disabled = false; return; }
          await curDistributeYoutube(null, fromSeq + 1);   // 자체적으로 결과 메시지 표시
        }
      } catch (err) { alert(err.message); }
      bulkRun.disabled = false;
      return;
    }
    const wordUpd = e.target.closest('[data-cur-word-update]');
    if (wordUpd) {
      const ref = wordUpd.dataset.curWordUpdate;
      wordUpd.classList.add('spin');
      try {
        const words = (await CurriculumStore.getWordlist(ref, true)).words || [];
        state.curriculum.wordlists[ref] = words;
      } catch (_) {}
      wordUpd.classList.remove('spin');
      document.querySelectorAll(`.cur-words[data-cur-wordlist="${CSS.escape(ref)}"]`).forEach(el => {
        el.dataset.filled = '';
        const l = el.querySelector('.cur-words-list'); if (l) l.textContent = '불러오는 중…';
      });
      curFillTreeContent(curriculumBodyEl() || document);
      return;
    }
    const revTab = e.target.closest('button[data-cur-review-tab]');
    if (revTab) {
      const nextTab = revTab.dataset.curReviewTab;
      state.curriculum.reviewTab = nextTab;
      if (state.homework?.embedded) { try { clearTimeout(hwSaveTimer); } catch (_) {} state.homework = homeworkDefault(); }
      // 복습·판서 탭은 곧바로 편집 위젯(툴바 포함)이 뜨게
      const sess = revTab.closest('[data-cur-review-sess]')?.dataset.curReviewSess;
      state.curriculum.activeReview = (state.curriculum.canManage && sess && (nextTab === 'review' || nextTab === 'board')) ? sess : null;
      refreshCurriculumWidgetBody();
      return;
    }
    if (e.target.closest('[data-cur-expand-all]')) {
      const c = state.curriculum;
      const sessions = c.board?.sessions || [];
      const keys = ['common', 'personal', ...sessions.map(s => `sess:${s.id}`)];
      keys.forEach(k => { c.collapsed[k] = false; });
      // 대화/판서/복습 유형 목록에서는 내용 없는 회차까지 펼치면 빈 칸만 늘어나니 건너뛴다.
      const t = c.typeFilter;
      if (t === 'talk' || t === 'board' || t === 'review') {
        sessions.forEach(s => {
          const has = t === 'review' ? curReviewHasContent(s.id, s.notes || {}) : t === 'talk' ? !!s.has_talk : !!s.has_board;
          if (has) c.collapsed[`fl:${t}:${s.id}`] = false;
        });
      }
      refreshCurriculumWidgetBody();
      return;
    }
    if (e.target.closest('[data-cur-collapse-all]')) {
      const c = state.curriculum;
      const sessions = c.board?.sessions || [];
      const keys = ['common', 'personal', ...sessions.map(s => `sess:${s.id}`)];
      keys.forEach(k => { c.collapsed[k] = true; });
      const t = c.typeFilter;
      if (t === 'talk' || t === 'board' || t === 'review') {
        sessions.forEach(s => { c.collapsed[`fl:${t}:${s.id}`] = true; });
      }
      refreshCurriculumWidgetBody();
      return;
    }
    const curSessDel = e.target.closest('[data-cur-session-del]');
    if (curSessDel) {
      if (!confirm('이 회차를 삭제할까요? 배정된 항목도 함께 삭제됩니다.')) return;
      try { await CurriculumStore.deleteSession(curSessDel.dataset.curSessionDel); await loadCurriculumBoard(); }
      catch (err) { alert(err.message); loadCurriculumBoard(); }
      return;
    }
    const curSessBulkDel = e.target.closest('[data-cur-sess-bulkdel]');
    if (curSessBulkDel) {
      const c = state.curriculum;
      const ids = Object.keys(c.sessDelChecked || {}).filter(id => c.sessDelChecked[id]);
      if (!ids.length) return;
      if (!confirm(`체크한 ${ids.length}개 회차를 삭제할까요? 배정된 항목도 함께 삭제됩니다.`)) return;
      curSessBulkDel.disabled = true;
      try {
        for (const id of ids) { await CurriculumStore.deleteSession(id); }
      } catch (err) { alert(err.message); }
      c.sessDelChecked = {};
      await loadCurriculumBoard();
      return;
    }
    const curCollapse = e.target.closest('[data-cur-collapse]');
    if (curCollapse) {
      const k = curCollapse.dataset.curCollapse;
      state.curriculum.collapsed[k] = !state.curriculum.collapsed[k];
      refreshCurriculumWidgetBody();
      return;
    }
    const curSrc = e.target.closest('[data-cur-src]');
    if (curSrc) {
      // 유튜브 누르면: 왼쪽 = 유튜브 모듈, 오른쪽 = 강의목록 위젯.
      // 강의 누르면: 왼쪽 = 강의 모듈, 오른쪽 = 영상목록 위젯. 항상 반대쪽을 오른쪽 위젯으로 붙인다.
      // 지금 누른 유튜브/강의 버튼이 몇 회차 줄에 있었는지 기억해둔다 — 이후 열리는 단어/문장/판서
      // 같은 회차-단위 위젯들이 (마지막 회차가 아니라) 이 회차 것으로 저장·표시되게 하기 위함.
      // 같은 영상·강의가 다른 회차에도 있어도, 어느 줄을 눌러서 들어왔는지로 구분되어 안 겹친다.
      state.curriculum.activeSessionId = curSrc.dataset.curSession || '';
      const onDash = !!document.querySelector('#curDashBoard');
      const clickedYoutube = curSrc.dataset.curSrc === 'youtube';
      const leftSection = clickedYoutube ? 'video' : 'textbook';
      const leftItem = clickedYoutube ? 'youtube' : 'lecture';
      const leftWid = clickedYoutube ? 'videolist' : 'lecturelist';   // 왼쪽 모듈과 같은 내용이라 위젯으론 불필요
      const rightWid = clickedYoutube ? 'lecturelist' : 'videolist';  // 반대쪽을 오른쪽 위젯으로
      if (!(state.page === 'module' && state.section === leftSection && state.item === leftItem)) {
        openModule(leftSection, leftItem);
        if (onDash && !state.widgetMulti.includes('curriculum')) setMultiWidget('curriculum', true);
      }
      if (state.widgetMulti.includes(leftWid)) setMultiWidget(leftWid, false);
      if (!state.widgetMulti.includes(rightWid)) setMultiWidget(rightWid, true);
      return;
    }
    const curOpen = e.target.closest('[data-cur-open]');
    if (curOpen) {
      if (e.target.closest('[data-cur-grip]') || e.target.closest('[data-cur-del]')) return;
      if (Date.now() - _curDragEndAt < 250) return;   // 드래그 직후 잔여 click 무시
      const [type, ref] = curOpen.dataset.curOpen.split('|');
      return openCurriculumItem(type, ref);
    }
    const paceApply = e.target.closest('[data-cur-pace-apply]');
    if (paceApply) {
      try {
        await CurriculumStore.setPace({ student: curriculumCurrentStudent(), units_per_session: Number(paceApply.dataset.curPaceApply) });
        await loadCurriculumBoard();
      } catch (err) { alert(err.message); }
      return;
    }
    if (e.target.closest('[data-cur-regen]')) {
      if (!confirm('미래·미완료 회차의 자동 배정을 지우고 순서열대로 다시 채웁니다.\n(수동 추가 항목·완료 회차·과거 회차는 그대로)')) return;
      try {
        const r = await CurriculumStore.regenerate(curriculumCurrentStudent());
        await loadCurriculumBoard();
        message(`재생성: ${r.removed}개 제거, ${(r.refilled || []).length}개 회차 재배정`, 'ok');
      } catch (err) { alert(err.message); }
      return;
    }
    const hwImg = e.target.closest('[data-hw-img]');
    if (hwImg) {
      if (hwDragMoved) return;
      addHomeworkCommentAt(e.clientX, e.clientY, hwImg);
      return;
    }

    const widgetSizeBtn = e.target.closest('[data-widget-size]');
    if (widgetSizeBtn) return toggleWidgetSize(widgetSizeBtn.dataset.widgetSize);

    const widgetPanelClose = e.target.closest('[data-widget-panel-close]');
    if (widgetPanelClose) return closeWidget(widgetPanelClose.dataset.widgetPanelClose);

    // 위젯 레일의 영상/교재 이동 버튼 + 서브메뉴
    const navOpen = e.target.closest('[data-nav-open]');
    if (navOpen) {
      document.querySelectorAll('.widget-nav-item.nav-open').forEach(el => el.classList.remove('nav-open'));
      const [sec, item] = navOpen.dataset.navOpen.split(':');
      // 다른 모듈(영상 ↔ 교재)을 보고 있는 중에 반대쪽 목록을 누르면 화면을 이동(대체)하지 않고
      // 그 목록을 위젯으로 열어서 양분한다 (예: 유튜브 모듈 보면서 "교재-강의" 누르면 강의목록 위젯이 옆에 뜸)
      if (state.page === 'module' && state.section && state.section !== sec) {
        if (sec === 'textbook' && item === 'lecture') { setMultiWidget('lecturelist', true); return; }
        if (sec === 'video' && item === 'youtube') { setMultiWidget('videolist', true); return; }
      }
      return openModule(sec, item);
    }
    const navSection = e.target.closest('button[data-nav-section]');
    if (navSection) {
      const sec = navSection.dataset.navSection;
      const first = (MODULES[sec]?.items || [])[0];
      if (!first) return;
      if (state.page === 'module' && state.section && state.section !== sec) {
        if (sec === 'textbook' && first.id === 'lecture') { setMultiWidget('lecturelist', true); return; }
        if (sec === 'video' && first.id === 'youtube') { setMultiWidget('videolist', true); return; }
      }
      return openModule(sec, first.id);
    }

    const widgetBtn = e.target.closest('[data-widget]');
    if (widgetBtn) {
      if (widgetBtn.dataset.widget === 'board') return toggleScreenInk();
      return openWidget(widgetBtn.dataset.widget);
    }

    const modalBtn = e.target.closest('[data-modal]');
    if (modalBtn) return openAuth(modalBtn.dataset.modal);

    const authModeBtn = e.target.closest('[data-auth-mode]');
    if (authModeBtn) return setAuthMode(authModeBtn.dataset.authMode, state.authEmail || document.getElementById('authEmail').value);

    if (e.target.closest('[data-close-modal]')) return closeAuth();

    const accountPageBtn = e.target.closest('[data-account-page]');
    if (accountPageBtn) {
      const page = accountPageBtn.dataset.accountPage;
      closeMypageMenu();
      if (page === 'mypage') return showMyPage();
      if (page === 'admin') return showAdmin();
      if (page === 'grammar-admin') return showGrammarAdmin();
      return showClassroom();
    }

    const mypageToggle = e.target.closest('[data-mypage-toggle]');
    if (mypageToggle) {
      const menu = document.querySelector('[data-mypage-menu]');
      if (menu) menu.hidden = !menu.hidden;
      return;
    }
    if (!e.target.closest('[data-mypage-dropdown]')) closeMypageMenu();

    if (e.target.closest('#simReset')) return actAs(null);

    const roleSaveBtn = e.target.closest('[data-save-role]');
    if (roleSaveBtn) {
      const row = roleSaveBtn.closest('[data-admin-email]');
      const email = row?.dataset.adminEmail;
      const role = row?.querySelector('[data-role-select]')?.value;
      if (!email || !role) return;
      roleSaveBtn.disabled = true;
      try {
        const learning_level = row?.querySelector('[data-learning-select]')?.value || '';
        await api('/api/admin/set-role', { method: 'POST', body: { email, role, learning_level } });
        roleSaveBtn.textContent = '완료';
        state.devUsers = null;
        setTimeout(() => { roleSaveBtn.textContent = '저장'; roleSaveBtn.disabled = false; loadAdminUsers(); }, 800);
      } catch (err) {
        alert(err.message);
        roleSaveBtn.disabled = false;
      }
      return;
    }


    if (e.target.closest('#adminReloadUsers')) return loadAdminUsers();
    if (e.target.closest('[data-grammar-list-update]')) {
      state.grammar.allTags = null;   // 캐시해둔 전체 영상 문법도 다음에 열 때 새로 받아오게 비운다
      if (state.page === 'grammar-admin') await loadGrammarAdminList();
      message('문법리스트를 새로 불러왔습니다.', 'ok');
      return;
    }
    const adminOpenLesson = e.target.closest('[data-grammar-admin-open-lesson]');
    if (adminOpenLesson) { grammarAdminOpenLesson(adminOpenLesson.dataset.grammarAdminOpenLesson); return; }
    const adminOpenVideo = e.target.closest('[data-grammar-admin-open-video]');
    if (adminOpenVideo) { grammarAdminOpenVideo(adminOpenVideo.dataset.grammarAdminOpenVideo, adminOpenVideo.dataset.grammarAdminOpenVideoSeconds); return; }
    if (e.target.closest('[data-grammar-admin-close]')) return grammarAdminCloseDetail();
    const adminSortBtn = e.target.closest('[data-grammar-admin-sort]');
    if (adminSortBtn) { state.grammar.adminSort = adminSortBtn.dataset.grammarAdminSort; renderGrammarAdminView(); return; }
    if (e.target.closest('[data-grammar-admin-toggle-basic]')) {
      state.grammar.adminHideBasic = !state.grammar.adminHideBasic;
      renderGrammarAdminView();
      return;
    }
    if (e.target.closest('[data-keep-youtube-toggle]')) return toggleKeepYoutube();
    if (e.target.closest('[data-secret-mode-toggle]')) return toggleSecretMode();

    // 임시 버튼: 캐시 때문에 방금 고친 게 안 보일 때, 그냥 새로고침이 아니라 매번 다른 주소로
    // 다시 이동시켜서(브라우저 캐시/뒤로가기 캐시를 못 쓰게) 서버에서 완전히 새로 받아오게 한다.
    if (e.target.closest('[data-hard-refresh]')) {
      location.href = `${location.pathname}?kb=${Date.now()}${location.hash || ''}`;
      return;
    }

    if (e.target.closest('[data-logout]')) {
      try { await api('/api/auth/logout', { method: 'POST' }); } catch (_) {}
      // 로그아웃(=나가기) 하면 위젯 배치(열려 있던 위젯·크기)는 초기화 — 다음에 들어오면
      // 항상 기본 상태로 새로 시작한다. 크기 비율은 이제 저장하지도 않지만, 어떤 위젯이
      // 열려 있었는지까지 포함해서 완전히 깨끗하게 지운다.
      try { localStorage.removeItem(widgetLayoutStorageKey()); } catch (_) {}
      state.user = null;
      state.authEmail = getRememberedId();
      sessionStorage.removeItem('koredu_after_login');
      await renderAccount();
      return showHome();
    }
  });

  document.querySelectorAll('[data-nav-cluster]').forEach(cluster => {
    cluster.addEventListener('mouseenter', () => previewMaster(cluster.dataset.navCluster));
  });
  primaryNav?.addEventListener('mouseleave', restoreActiveMenu);

  if (widgetSplitter) {
    let splitDragging = false;
    const onSplitMove = e => {
      if (!splitDragging) return;
      const rail = 54;
      const raw = window.innerWidth - e.clientX - rail;
      state.widgetWidth = Math.max(320, Math.min(raw, Math.floor(window.innerWidth * .62)));
      document.documentElement.style.setProperty('--widget-workspace-w', `${state.widgetWidth}px`);
    };
    const onSplitUp = () => {
      if (!splitDragging) return;
      splitDragging = false;
      body.classList.remove('widget-resizing');
      saveWidgetLayout();
    };
    widgetSplitter.addEventListener('pointerdown', e => {
      splitDragging = true;
      body.classList.add('widget-resizing');
      widgetSplitter.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });
    window.addEventListener('pointermove', onSplitMove);
    window.addEventListener('pointerup', onSplitUp);
  }
  // 위젯 하나만 열려 있을 때: 아래쪽 핸들을 드래그하면 세로 크기를 직접 줄이거나(꽉 채움 해제) 늘릴 수 있다.
  widgetMultiGrid?.addEventListener('dblclick', e => {
    const soloHandle = e.target.closest('[data-widget-solo-resize]');
    if (!soloHandle) return;
    const key = soloHandle.dataset.widgetSoloResize;
    delete state.widgetSoloHeights[key];
    renderMultiWidgets();
    saveWidgetLayout();
  });
  widgetMultiGrid?.addEventListener('pointerdown', e => {
    const soloHandle = e.target.closest('[data-widget-solo-resize]');
    if (soloHandle) {
      e.preventDefault();
      const key = soloHandle.dataset.widgetSoloResize;
      const row = widgetMultiGrid.querySelector(`.widget-split-row[data-widget-row="${CSS.escape(key)}"]`);
      if (!row) return;
      const gridRect = widgetMultiGrid.getBoundingClientRect();
      const startY = e.clientY;
      const startH = row.getBoundingClientRect().height;
      body.classList.add('widget-pane-resizing', 'widget-pane-resizing-row');
      soloHandle.setPointerCapture?.(e.pointerId);
      const handleH = soloHandle.getBoundingClientRect().height;
      const maxH = Math.max(140, gridRect.height - handleH);
      const move = ev => {
        const h = Math.max(140, Math.min(maxH, startH + (ev.clientY - startY)));
        row.style.flex = `0 0 ${h}px`;
        state.widgetSoloHeights[key] = h;
        soloHandle.classList.add('is-custom');
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        body.classList.remove('widget-pane-resizing', 'widget-pane-resizing-row');
        saveWidgetLayout();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up, { once: true });
      return;
    }
    const colSplitter = e.target.closest('[data-widget-col-split]');
    const rowSplitter = e.target.closest('[data-widget-row-split]');
    if (!colSplitter && !rowSplitter) return;
    e.preventDefault();
    e.stopPropagation();

    if (colSplitter) {
      const key = colSplitter.dataset.widgetColSplit;
      const row = colSplitter.closest('.widget-split-row');
      const panes = row ? [...row.querySelectorAll(':scope > .widget-split-pane')] : [];
      if (panes.length !== 2) return;
      const rect = row.getBoundingClientRect();
      const startX = e.clientX;
      const startRatio = Math.max(.22, Math.min(.78, panes[0].getBoundingClientRect().width / Math.max(1, rect.width)));
      body.classList.add('widget-pane-resizing','widget-pane-resizing-col');
      colSplitter.setPointerCapture?.(e.pointerId);
      const move = ev => {
        const ratio = Math.max(.22, Math.min(.78, startRatio + (ev.clientX - startX) / Math.max(1, rect.width)));
        panes[0].style.flex = `0 1 ${ratio * 100}%`;
        panes[1].style.flex = `0 1 ${(1 - ratio) * 100}%`;
        state.widgetColRatios[key] = ratio;
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        body.classList.remove('widget-pane-resizing','widget-pane-resizing-col');
        saveWidgetLayout();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up, { once: true });
      return;
    }

    const pair = String(rowSplitter.dataset.widgetRowSplit || '').split('|');
    if (pair.length !== 2) return;
    const rowA = widgetMultiGrid.querySelector(`[data-widget-row="${CSS.escape(pair[0])}"]`);
    const rowB = widgetMultiGrid.querySelector(`[data-widget-row="${CSS.escape(pair[1])}"]`);
    if (!rowA || !rowB) return;
    const hA = rowA.getBoundingClientRect().height;
    const hB = rowB.getBoundingClientRect().height;
    const combined = Math.max(1, hA + hB);
    const startY = e.clientY;
    const wA = Math.max(.2, Number(state.widgetRowWeights[pair[0]]) || 1);
    const wB = Math.max(.2, Number(state.widgetRowWeights[pair[1]]) || 1);
    const totalWeight = wA + wB;
    body.classList.add('widget-pane-resizing','widget-pane-resizing-row');
    rowSplitter.setPointerCapture?.(e.pointerId);
    const move = ev => {
      const minPx = 118;
      const targetA = Math.max(minPx, Math.min(combined - minPx, hA + (ev.clientY - startY)));
      const ratio = targetA / combined;
      const nextWA = Math.max(.2, totalWeight * ratio);
      const nextWB = Math.max(.2, totalWeight - nextWA);
      state.widgetRowWeights[pair[0]] = nextWA;
      state.widgetRowWeights[pair[1]] = nextWB;
      rowA.style.flexGrow = String(nextWA);
      rowB.style.flexGrow = String(nextWB);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      body.classList.remove('widget-pane-resizing','widget-pane-resizing-row');
      saveWidgetLayout();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  });

  widgetMultiGrid?.addEventListener('pointerup', () => setTimeout(saveVisibleWidgetHeights, 0));
  let draggingWidgetId = null;
  widgetMultiGrid?.addEventListener('dragstart', e => {
    const handle = e.target.closest('[data-widget-drag]');
    if (!handle) return e.preventDefault();
    draggingWidgetId = handle.dataset.widgetDrag;
    const panel = handle.closest('[data-widget-panel]');
    panel?.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', draggingWidgetId); } catch (_) {}
  });
  widgetMultiGrid?.addEventListener('dragover', e => {
    if (!draggingWidgetId) return;
    const panel = e.target.closest('.widget-panel.multi[data-widget-panel]');
    if (!panel || panel.dataset.widgetPanel === draggingWidgetId) return;
    e.preventDefault();
    widgetMultiGrid.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    panel.classList.add('drag-over');
  });
  widgetMultiGrid?.addEventListener('drop', e => {
    const panel = e.target.closest('.widget-panel.multi[data-widget-panel]');
    if (!draggingWidgetId || !panel) return;
    e.preventDefault();
    reorderMultiWidget(draggingWidgetId, panel.dataset.widgetPanel);
  });
  widgetMultiGrid?.addEventListener('dragend', () => {
    widgetMultiGrid.querySelectorAll('.dragging,.drag-over').forEach(el => el.classList.remove('dragging','drag-over'));
    draggingWidgetId = null;
  });
  openExternal.addEventListener('click', () => state.moduleUrl && window.open(state.moduleUrl, '_blank', 'noopener'));
  modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeAuth(); });
  window.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target?.matches?.('[data-word-seek]')) {
      e.preventDefault();
      seekWordOccurrence(e.target.dataset.wordSeek);
      return;
    }
    if (e.key === 'Escape') { if (state.widgetSingle) closeWidget(state.widgetSingle); if (!modalBackdrop.hidden) closeAuth(); closeMypageMenu(); }
  });
  authForm.addEventListener('submit', e => { e.preventDefault(); submitAuth(); });

  document.getElementById('openMailbox').addEventListener('click', openMailbox);
  document.getElementById('mailboxClose').addEventListener('click', () => { localMailbox.hidden = true; });
  document.getElementById('resendCode').addEventListener('click', async () => {
    const email = (state.authEmail || document.getElementById('authEmail').value).trim().toLowerCase();
    if (!email) return message('이메일(ID)을 입력하세요.', 'error');
    try {
      const result = await api('/api/auth/resend', { method: 'POST', body: { email } });
      message(result.message + ' LOCAL 인증메일함을 확인하세요.', 'success');
    } catch (err) { message(err.message, 'error'); }
  });
  googleLogin.addEventListener('click', async () => {
    try {
      await api('/api/auth/google', { method: 'POST' });
    } catch (err) {
      message(err.message, 'error');
    }
  });

  window.addEventListener('pagehide', () => {
    // 브라우저 새로고침/종료에서도 학습 데이터만 보존한다.
    persistWidgetChanges();
    if (state.page === 'module' && state.section === 'video' && state.item === 'youtube') {
      postToVideoScript({ type: 'koredu-flush-before-leave' });
    }
  });

  function restoreRoute() {
    // 홈(영상/교재 버튼 페이지)은 더 이상 쓰지 않음 — 항상 강의실로. 미로그인 시 showClassroom 이 로그인창을 띄운다.
    const route = location.hash.replace(/^#/, '');
    if (route === 'mypage' && state.user) return showMyPage(false);
    if (route === 'admin' && state.user?.role === 'admin') return showAdmin(false);
    const [sectionId, itemId] = route.split('/');
    if (state.user && MODULES[sectionId]) return openModule(sectionId, itemId, false);
    return showClassroom(false);
  }
  // 뒤로/앞으로 가기 버튼 — 주소창 해시 변화에 맞춰 화면을 다시 그린다 (히스토리에 새로 쌓지 않음)
  window.addEventListener('popstate', () => restoreRoute());

  function startLocalLifecycleHeartbeat() {
    const host = location.hostname;
    if (host !== '127.0.0.1' && host !== 'localhost') return;

    const key = 'koredu_local_client_id';
    let clientId = '';
    try { clientId = sessionStorage.getItem(key) || ''; } catch (_) {}
    if (!clientId) {
      clientId = (globalThis.crypto?.randomUUID?.() || (`tab-${Date.now()}-${Math.random().toString(36).slice(2)}`));
      try { sessionStorage.setItem(key, clientId); } catch (_) {}
    }

    const heartbeat = () => {
      fetch('/api/local/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
        credentials: 'same-origin',
        cache: 'no-store',
        keepalive: true
      }).catch(() => {});
    };

    heartbeat();
    const timer = setInterval(heartbeat, 5000);

    const goodbye = () => {
      clearInterval(timer);
      const payload = JSON.stringify({ client_id: clientId });
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/local/goodbye', new Blob([payload], { type: 'application/json' }));
        } else {
          fetch('/api/local/goodbye', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            credentials: 'same-origin',
            keepalive: true
          }).catch(() => {});
        }
      } catch (_) {}
    };

    window.addEventListener('pagehide', goodbye, { once: true });
  }

  async function init() {
    startLocalLifecycleHeartbeat();
    state.authEmail = getRememberedId();
    await renderAccount();
    restoreRoute();
    applySecretModeLabels();
    broadcastSecretMode();
  }

  init();

})();
