/* ========== Демонстрационные данные ========== */
(function (global) {
  'use strict';

  var DAY = 86400000;

  function ago(days, hours) {
    var d = new Date();
    d.setDate(d.getDate() - days);
    if (hours != null) d.setHours(hours, 15, 0, 0);
    return d.toISOString();
  }

  function ahead(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(18, 0, 0, 0);
    return d.toISOString();
  }

  var USERS = [
    { email: 'anna@nordflow.ru', password: 'admin123', firstName: 'Анна', lastName: 'Волкова', position: 'Операционный директор', role: 'admin' },
    { email: 'maxim@nordflow.ru', password: 'manager123', firstName: 'Максим', lastName: 'Орлов', position: 'Руководитель проекта', role: 'manager' },
    { email: 'elena@nordflow.ru', password: 'demo123', firstName: 'Елена', lastName: 'Соколова', position: 'Дизайнер', role: 'employee' },
    { email: 'ilya@nordflow.ru', password: 'demo123', firstName: 'Илья', lastName: 'Морозов', position: 'Frontend-разработчик', role: 'employee' },
    { email: 'victor@nordflow.ru', password: 'demo123', firstName: 'Виктор', lastName: 'Лебедев', position: 'Backend-разработчик', role: 'employee' },
    { email: 'olga@nordflow.ru', password: 'demo123', firstName: 'Ольга', lastName: 'Крылова', position: 'Маркетолог', role: 'employee' },
    { email: 'dmitry@nordflow.ru', password: 'demo123', firstName: 'Дмитрий', lastName: 'Фролов', position: 'Тестировщик', role: 'employee' },
    { email: 'maria@nordflow.ru', password: 'demo123', firstName: 'Мария', lastName: 'Белова', position: 'Аналитик', role: 'employee' }
  ];

  var PROJECTS = [
    {
      name: 'Разработка сайта для клиента «GreenStone»',
      description: 'Корпоративный сайт с каталогом продукции, формой заявки и адаптивной вёрсткой.',
      leader: 1, members: [1, 2, 3, 4, 6, 7],
      start: ago(48), end: ahead(21), status: 'active', allowEmployeeCreateTasks: true
    },
    {
      name: 'Запуск рекламной кампании NordFlow',
      description: 'Промо-кампания продукта: лендинг, баннеры, посты в соцсетях и аналитика.',
      leader: 0, members: [0, 2, 5, 7],
      start: ago(30), end: ahead(12), status: 'active', allowEmployeeCreateTasks: true
    },
    {
      name: 'Внутренняя автоматизация отдела продаж',
      description: 'Сквозная автоматизация заявок, отчётов и напоминаний для отдела продаж.',
      leader: 1, members: [1, 3, 4, 6],
      start: ago(10), end: ahead(60), status: 'planned', allowEmployeeCreateTasks: false
    }
  ];

  /* p — индекс проекта, a/r — индекс исполнителя/постановщика */
  var TASKS = [
    // --- GreenStone ---
    { p: 0, key: 'NDF-101', t: 'Собрать технические требования к сайту', s: 'done', pr: 'high', a: 7, r: 1, d: -21, created: -46, upd: -20 },
    { p: 0, key: 'NDF-102', t: 'Нарисовать прототип главной страницы', s: 'done', pr: 'medium', a: 2, r: 1, d: -14, created: -40, upd: -13 },
    { p: 0, key: 'NDF-103', t: 'Утвердить дизайн-концепцию с клиентом', s: 'review', pr: 'high', a: 2, r: 1, d: 1, created: -34, upd: -2 },
    { p: 0, key: 'NDF-104', t: 'Верстка каталога продукции (адаптив)', s: 'in_progress', pr: 'critical', a: 3, r: 1, d: -2, created: -30, upd: -1,
      desc: 'Реализовать сетку карточек товаров, фильтры по категориям и пагинацию. Проверить на ширинах 320/768/1280.' },
    { p: 0, key: 'NDF-105', t: 'Подключить форму заявки к CRM', s: 'in_progress', pr: 'high', a: 4, r: 1, d: 3, created: -26, upd: -3 },
    { p: 0, key: 'NDF-106', t: 'Интеграция с системой платежей', s: 'planned', pr: 'medium', a: 4, r: 1, d: 9, created: -22, upd: -8 },
    { p: 0, key: 'NDF-107', t: 'Подготовить тексты для разделов сайта', s: 'in_progress', pr: 'medium', a: 5, r: 1, d: 2, created: -20, upd: -4 },
    { p: 0, key: 'NDF-108', t: 'Настроить аналитику и события', s: 'backlog', pr: 'low', a: 7, r: 1, d: 14, created: -18, upd: -18 },
    { p: 0, key: 'NDF-109', t: 'Написать тесты на форму обратной связи', s: 'planned', pr: 'medium', a: 6, r: 1, d: 6, created: -16, upd: -6 },
    { p: 0, key: 'NDF-110', t: 'Оптимизировать изображения каталога', s: 'backlog', pr: 'low', a: 3, r: 2, d: 11, created: -14, upd: -14 },
    { p: 0, key: 'NDF-111', t: 'Исправить переполнение блока на iPhone SE', s: 'review', pr: 'critical', a: 3, r: 6, d: -1, created: -12, upd: -1 },
    { p: 0, key: 'NDF-112', t: 'Перенести сайт на тестовый сервер', s: 'done', pr: 'medium', a: 4, r: 1, d: -5, created: -15, upd: -5 },
    { p: 0, key: 'NDF-113', t: 'Проверить сайт на разных браузерах', s: 'planned', pr: 'high', a: 6, r: 1, d: 5, created: -10, upd: -5 },
    // --- Рекламная кампания ---
    { p: 1, key: 'NDF-114', t: 'Сформировать медиаплан кампании', s: 'done', pr: 'high', a: 5, r: 0, d: -9, created: -28, upd: -9 },
    { p: 1, key: 'NDF-115', t: 'Собрать семантическое ядро', s: 'done', pr: 'medium', a: 7, r: 5, d: -6, created: -25, upd: -7 },
    { p: 1, key: 'NDF-116', t: 'Сделать баннеры для сетей (3 размера)', s: 'in_progress', pr: 'high', a: 2, r: 5, d: 0, created: -21, upd: -2,
      desc: 'Нужны форматы 300x250, 728x90 и 1080x1080. Логотип и оффер «Автоматизируйте процессы за 2 недели».' },
    { p: 1, key: 'NDF-117', t: 'Написать тексты объявлений для контекста', s: 'in_progress', pr: 'medium', a: 5, r: 0, d: 4, created: -19, upd: -3 },
    { p: 1, key: 'NDF-118', t: 'Запустить рекламный кабинет', s: 'planned', pr: 'critical', a: 0, r: 5, d: 7, created: -17, upd: -7 },
    { p: 1, key: 'NDF-119', t: 'Настроить цели и конверсии в аналитике', s: 'planned', pr: 'high', a: 7, r: 0, d: 8, created: -15, upd: -8 },
    { p: 1, key: 'NDF-120', t: 'Сделать лендинг для кампании', s: 'in_progress', pr: 'critical', a: 3, r: 5, d: -3, created: -24, upd: -2,
      desc: 'Лендинг с формой захвата, интеграцией с CRM и A/B-вариантами заголовка.' },
    { p: 1, key: 'NDF-121', t: 'Подготовить посты для соцсетей на неделю', s: 'review', pr: 'medium', a: 5, r: 0, d: 2, created: -12, upd: -1 },
    { p: 1, key: 'NDF-122', t: 'СобратьUTM-метки для всех каналов', s: 'done', pr: 'low', a: 7, r: 5, d: -4, created: -13, upd: -4 },
    { p: 1, key: 'NDF-123', t: 'Анализ результатов первой недели', s: 'backlog', pr: 'medium', a: 7, r: 0, d: 13, created: -8, upd: -8 },
    { p: 1, key: 'NDF-124', t: 'Обновить креативы по CTR', s: 'backlog', pr: 'low', a: 2, r: 5, d: 16, created: -6, upd: -6 },
    // --- Автоматизация продаж ---
    { p: 2, key: 'NDF-125', t: 'Спроектировать схему данных лидов', s: 'in_progress', pr: 'high', a: 4, r: 1, d: 4, created: -9, upd: -2,
      desc: 'Описать сущности: лид, источник, статус, ответственный. Согласовать с отделом продаж.' },
    { p: 2, key: 'NDF-126', t: 'Создать интеграцию с почтовым ящиком продаж', s: 'planned', pr: 'critical', a: 3, r: 1, d: 10, created: -8, upd: -8 },
    { p: 2, key: 'NDF-127', t: 'Сделать отчёт по конверсии воронки', s: 'backlog', pr: 'medium', a: 7, r: 1, d: 20, created: -7, upd: -7 },
    { p: 2, key: 'NDF-128', t: 'Протестировать сценарий автоназначения лида', s: 'backlog', pr: 'medium', a: 6, r: 1, d: 24, created: -5, upd: -5 },
    { p: 2, key: 'NDF-129', t: 'Список требований от отдела продаж', s: 'done', pr: 'high', a: 7, r: 1, d: -3, created: -10, upd: -3 },
    { p: 2, key: 'NDF-130', t: 'Настроить окружение для разработки', s: 'done', pr: 'low', a: 4, r: 1, d: -1, created: -9, upd: -1 }
  ];

  var DESCS = {
    'NDF-103': 'Клиент должен подтвердить палитру, типографику и структуру страниц. Отправить макеты в Figma и получить письменное согласование.',
    'NDF-111': 'На iPhone SE нижнее меню перекрывает кнопку «Оставить заявку». Исправить отступы и проверить safe-area.',
    'NDF-116': 'Баннеры должны содержать логотип, оффер и призыв к действию. Форматы: 300x250, 728x90, 1080x1080.',
    'NDF-120': 'Единый лендинг под рекламную кампанию: оффер, тарифы, форма заявки, отзывы.',
    'NDF-104': 'Реализовать адаптивную сетку каталога, фильтры и пагинацию.',
    'NDF-125': 'Схема данных для CRM-воронки отдела продаж.'
  };

  var COMMENTS = {
    'NDF-104': [
      { a: 1, t: 'Сетка готова на 70%, осталась пагинация. Дедлайн под угрозой из-за правок клиента.', d: 2 },
      { a: 3, t: 'Принял. Пагинацию доделаю сегодня, завтра покажу на стендапе.', d: 1 },
      { a: 6, t: 'Проверил в Chrome и Safari — карточки товаров отображаются корректно.', d: 1 }
    ],
    'NDF-111': [
      { a: 6, t: 'Баг воспроизводится только на 320px. Добавил в чек-лист регресса.', d: 2 },
      { a: 3, t: 'Поправил отступы, выкладываю на тестовый стенд.', d: 0 }
    ],
    'NDF-120': [
      { a: 5, t: 'Нужен вариант заголовка покороче — влезает только одна строка в баннере.', d: 3 },
      { a: 3, t: 'Сделаю два варианта, пришлю сегодня.', d: 2 }
    ],
    'NDF-116': [
      { a: 2, t: 'Баннеры 300x250 и 728x90 готовы, дорабатываю квадрат.', d: 1 }
    ],
    'NDF-125': [
      { a: 4, t: 'Схему набросал в черновике, жду комментарии по полям ответственного.', d: 2 },
      { a: 1, t: 'Добавьте поле «источник лида» — без него аналитика не сходится.', d: 1 }
    ],
    'NDF-103': [
      { a: 2, t: 'Отправил вторую версию концепции клиенту, ждём ответа до пятницы.', d: 4 },
      { a: 1, t: 'Напомню клиенту в понедельник, если ответа не будет.', d: 2 }
    ]
  };

  var HISTORY_EXTRA = {
    'NDF-104': [
      { d: 6, u: 1, x: 'изменил приоритет: Средний → Критический' },
      { d: 1, u: 3, x: 'перевёл задачу в статус «В работе»' }
    ],
    'NDF-111': [{ d: 1, u: 3, x: 'перевёл задачу в статус «На проверке»' }],
    'NDF-120': [{ d: 5, u: 3, x: 'изменил дедлайн: — → ' + new Date(Date.now() - 3 * DAY).toLocaleDateString('ru-RU') }]
  };

  function create() {
    var users = USERS.map(function (u, i) {
      return {
        id: 'u' + (i + 1),
        email: u.email, password: u.password,
        firstName: u.firstName, lastName: u.lastName, position: u.position,
        role: u.role, avatar: null, theme: 'light',
        createdAt: ago(60), lastActive: ago(0, 9)
      };
    });

    var projects = PROJECTS.map(function (p, i) {
      var memberIds = p.members.map(function (m) { return 'u' + (m + 1); });
      if (memberIds.indexOf('u' + (p.leader + 1)) === -1) memberIds.unshift('u' + (p.leader + 1));
      return {
        id: 'p' + (i + 1),
        name: p.name, description: p.description,
        leaderId: 'u' + (p.leader + 1),
        memberIds: memberIds,
        startDate: p.start, endDate: p.end,
        status: p.status,
        allowEmployeeCreateTasks: !!p.allowEmployeeCreateTasks,
        createdBy: 'u' + (p.leader + 1),
        createdAt: p.start, updatedAt: ago(1)
      };
    });

    var tasks = TASKS.map(function (x) {
      var created = ago(Math.abs(x.created), 10);
      var updated = ago(Math.abs(x.upd), 16);
      var task = {
        id: x.key,
        key: x.key,
        title: x.t,
        description: x.desc || DESCS[x.key] || '',
        projectId: 'p' + (x.p + 1),
        status: x.s,
        priority: x.pr,
        assigneeId: 'u' + (x.a + 1),
        reporterId: 'u' + (x.r + 1),
        createdAt: created,
        updatedAt: updated,
        deadline: x.d === null || x.d === undefined ? null : ahead(x.d),
        tags: [],
        attachments: [],
        comments: [],
        history: []
      };
      if (x.s === 'done') task.completedAt = updated;

      if (x.p === 0) task.tags = ['вёрстка', 'сайт'];
      if (x.p === 1) task.tags = ['маркетинг'];
      if (x.p === 2) task.tags = ['внутренний проект'];

      task.history.push({ id: H.uid('h'), at: created, userId: 'u' + (x.r + 1), text: 'создал(а) задачу' });
      var extras = HISTORY_EXTRA[x.key] || [];
      extras.forEach(function (e) {
        task.history.push({ id: H.uid('h'), at: ago(e.d, 12), userId: 'u' + (e.u + 1), text: e.x });
      });
      var cs = COMMENTS[x.key] || [];
      cs.forEach(function (c) {
        task.comments.push({
          id: H.uid('c'), authorId: 'u' + (c.a + 1), text: c.t,
          createdAt: ago(c.d, 11), editedAt: null
        });
      });
      return task;
    });

    // теги и вложения для некоторых задач
    var t104 = tasks.filter(function (t) { return t.key === 'NDF-104'; })[0];
    t104.attachments.push({ id: H.uid('a'), type: 'link', name: 'Макет каталога (Figma)', url: 'https://www.figma.com/' });
    t104.attachments.push({ id: H.uid('a'), type: 'file', name: 'checklist-responsive.pdf', size: 184320 });
    var t120 = tasks.filter(function (t) { return t.key === 'NDF-120'; })[0];
    t120.attachments.push({ id: H.uid('a'), type: 'link', name: 'Прототип лендинга', url: 'https://www.figma.com/' });

    return {
      version: 1,
      users: users,
      projects: projects,
      tasks: tasks,
      notifications: [],
      sessionUserId: null,
      counter: 130,
      seededAt: new Date().toISOString()
    };
  }

  global.Seed = { create: create, users: USERS, projects: PROJECTS };
})(window);
