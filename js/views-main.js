/* ========== Главная и уведомления ========== */
(function (global) {
  'use strict';

  function statCard(label, val, ico, cls) {
    return '<div class="stat ' + (cls || '') + '"><div class="ic">' + H.icon(ico, 22) + '</div>' +
      '<div class="lbl">' + label + '</div><div class="val">' + val + '</div></div>';
  }

  function deadlineRow(t) {
    var p = Store.project(t.projectId);
    var diff = H.daysDiff(t.deadline);
    var over = Store.isOverdue(t);
    var when = over ? 'Просрочено ' + H.fmtDate(t.deadline)
      : (diff === 0 ? 'Сегодня' : (diff === 1 ? 'Завтра' : H.fmtDate(t.deadline)));
    return '<div class="list-item" data-goto-task="' + t.id + '">' +
      '<span class="pill plain ' + Store.priority(t.priority).cls + '">' + Store.priority(t.priority).label + '</span>' +
      '<div class="grow"><div class="t">' + H.esc(t.title) + '</div>' +
      '<div class="s">' + H.esc(t.key) + ' · ' + H.esc(p ? p.name : '') + '</div></div>' +
      '<span class="' + (over ? 'overdue-mark' : 'muted') + ' small">' + when + '</span></div>';
  }

  function updateRow(u) {
    var t = Store.task(u.taskId);
    if (!t) return '';
    var who = Store.user(u.userId);
    return '<div class="list-item" data-goto-task="' + t.id + '">' +
      H.avatarHTML(who, 'sm') +
      '<div class="grow"><div class="t" style="font-weight:500">' + H.esc(H.fullName(who)) + ' ' + H.esc(u.text) + '</div>' +
      '<div class="s">' + H.esc(t.key) + ' · ' + H.fmtRel(u.at) + '</div></div></div>';
  }

  function projectMini(p) {
    var tasks = Store.projectTasks(p.id);
    var open = tasks.filter(function (t) { return t.status !== 'done'; }).length;
    var st = Store.projectStatus(p.status);
    return '<div class="list-item" data-goto-project="' + p.id + '">' +
      '<div class="grow"><div class="t">' + H.esc(p.name) + '</div>' +
      '<div class="s">Открытых задач: ' + open + ' · руководитель ' + H.esc(H.fullName(Store.user(p.leaderId))) + '</div></div>' +
      '<span class="pill ' + st.cls + '">' + st.label + '</span></div>';
  }

  function teamSummary() {
    var projects = Store.visibleProjects();
    var memberIds = {};
    projects.forEach(function (p) {
      if (Store.canManageProject(p)) p.memberIds.forEach(function (m) { memberIds[m] = 1; });
    });
    var ids = Object.keys(memberIds);
    if (!ids.length) return '';
    var teamTasks = Store.visibleTasks().filter(function (t) {
      return ids.indexOf(t.assigneeId) !== -1;
    });
    var open = teamTasks.filter(function (t) { return t.status !== 'done'; });
    var over = open.filter(Store.isOverdue);
    var loaded = ids.map(function (id) {
      var w = Store.workload(id);
      return { u: Store.user(id), w: w };
    }).filter(function (x) { return x.u; }).sort(function (a, b) { return b.w.active - a.w.active; }).slice(0, 3);

    return '<div class="card" style="margin-top:16px">' +
      '<h3>' + H.icon('chart', 18) + ' Сводка по задачам команды</h3>' +
      '<div class="kv-row"><span class="k">Активных задач команды</span><b>' + open.length + '</b></div>' +
      '<div class="kv-row"><span class="k">Просрочено</span><b class="overdue-mark">' + over.length + '</b></div>' +
      '<div class="kv-row"><span class="k">Сотрудников в проектах</span><b>' + ids.length + '</b></div>' +
      '<div class="sep"></div>' +
      '<p class="small muted" style="margin-bottom:8px">Самая высокая загрузка:</p>' +
      loaded.map(function (x) {
        return '<div class="kv-row"><span class="k">' + H.esc(H.fullName(x.u)) + '</span>' +
          '<span>' + x.w.active + ' задач · ' + x.w.pct + '%' +
          (x.w.overdue ? ' · <span class="overdue-mark">' + x.w.overdue + ' просроч.</span>' : '') + '</span></div>';
      }).join('') +
      '<div style="margin-top:10px"><a href="#/team">Открыть раздел «Команда» →</a></div></div>';
  }

  function dashboard() {
    var u = Store.currentUser();
    var s = Store.statsFor(u.id);
    var projects = Store.visibleProjects();
    var mine = Store.myTasks();

    var upcoming = mine.filter(function (t) { return t.status !== 'done' && t.deadline; })
      .sort(function (a, b) { return new Date(a.deadline) - new Date(b.deadline); }).slice(0, 6);

    var updates = [];
    Store.visibleTasks().forEach(function (t) {
      (t.history || []).slice(-3).forEach(function (h) {
        updates.push({ taskId: t.id, key: t.key, userId: h.userId, text: h.text, at: h.at });
      });
      if ((t.comments || []).length) {
        var c = t.comments[t.comments.length - 1];
        updates.push({ taskId: t.id, key: t.key, userId: c.authorId, text: 'прокомментировал(а) задачу', at: c.createdAt });
      }
    });
    updates.sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
    updates = updates.slice(0, 7);

    var html =
      '<div class="page-head"><div><h2>Главная</h2>' +
      '<p class="sub">Привет, ' + H.esc(u.firstName) + '! Сводка по вашей работе</p></div>' +
      '<div class="page-actions"><a class="btn btn-primary" href="#/my-tasks">' + H.icon('plus') + 'Мои задачи</a></div></div>' +

      '<div class="grid grid-4">' +
      statCard('Активных задач', s.active, 'bolt', '') +
      statCard('Просроченных', s.overdue, 'clock', s.overdue ? 'danger' : '') +
      statCard('На этой неделе', s.week, 'calendar', 'warn') +
      statCard('Выполнено всего', s.done, 'check2', 'ok') +
      '</div>' +

      '<div class="grid grid-2" style="margin-top:18px;align-items:start">' +
      '<div>' +
      '<div class="card"><h3>' + H.icon('clock', 18) + ' Ближайшие дедлайны</h3>' +
      (upcoming.length ? '<div class="list">' + upcoming.map(deadlineRow).join('') + '</div>'
        : '<div class="empty" style="border:none;padding:22px"><p>Ближайших дедлайнов нет</p></div>') +
      '</div>' +

      '<div class="section-title"><h3>Последние обновления в проектах</h3></div>' +
      '<div class="card" style="padding:8px 14px">' +
      (updates.length ? '<div class="list">' + updates.map(updateRow).join('') + '</div>'
        : '<div class="empty" style="border:none"><p>Пока нет обновлений</p></div>') +
      '</div></div>' +

      '<div>' +
      '<div class="card"><h3>' + H.icon('folder', 18) + ' Мои проекты</h3>' +
      (projects.length ? '<div class="list">' + projects.slice(0, 6).map(projectMini).join('') + '</div>'
        : '<div class="empty" style="border:none;padding:20px"><p>Нет доступных проектов</p></div>') +
      (projects.length > 6 ? '<div style="margin-top:10px"><a href="#/projects">Все проекты →</a></div>' : '') +
      '</div>' +
      ((Store.isManager() || Store.isAdmin()) ? teamSummary() : '') +
      '</div></div>';

    return html;
  }

  /* ---------- Уведомления ---------- */
  var NOTIF_ICONS = { assign: 'user', deadline: 'calendar', status: 'arrow', comment: 'msg', due: 'clock', overdue: 'bolt' };

  function notifications() {
    var list = Store.myNotifications();
    var unread = list.filter(function (n) { return !n.read; }).length;

    var html =
      '<div class="page-head"><div><h2>Уведомления</h2>' +
      '<p class="sub">' + (unread ? 'Непрочитанных: ' + unread : 'Все прочитаны') + '</p></div>' +
      '<div class="page-actions">' +
      (list.length ? '<button class="btn btn-ghost" id="notif-read-all">Прочитать все</button>' +
        '<button class="btn btn-ghost" id="notif-clear">Очистить</button>' : '') +
      '</div></div>';

    if (!list.length) {
      html += '<div class="empty"><div class="big">' + H.icon('bell', 38) + '</div><p>Уведомлений пока нет</p></div>';
      return html;
    }

    html += '<div class="list">' + list.map(function (n) {
      return '<div class="notif ' + (n.read ? '' : 'unread') + '" data-notif="' + n.id + '" data-task="' + (n.taskId || '') + '">' +
        '<div class="ico">' + H.icon(NOTIF_ICONS[n.type] || 'bell', 18) + '</div>' +
        '<div class="tx">' + H.esc(n.text) + '<div class="dt">' + H.fmtDateTime(n.createdAt) + '</div></div>' +
        (n.read ? '' : '<span class="pill plain st-planned">новое</span>') +
        '</div>';
    }).join('') + '</div>';

    return html;
  }

  function bindNotifications(root) {
    var all = H.qs('#notif-read-all', root);
    if (all) all.addEventListener('click', function () { Store.markAllRead(); });
    var clear = H.qs('#notif-clear', root);
    if (clear) clear.addEventListener('click', function () {
      App.confirm('Очистить уведомления?', 'Список уведомлений будет очищен.', function () { Store.clearNotifications(); });
    });
    H.qsa('[data-notif]', root).forEach(function (el) {
      el.addEventListener('click', function () {
        Store.markRead(el.dataset.notif);
        if (el.dataset.task) location.hash = '#/tasks/' + el.dataset.task;
      });
    });
  }

  global.VMain = { dashboard: dashboard, notifications: notifications, bindNotifications: bindNotifications };
})(window);
