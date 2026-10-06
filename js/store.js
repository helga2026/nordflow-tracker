/* ========== Хранилище данных, права, уведомления ========== */
(function (global) {
  'use strict';

  var KEY = 'nordflow_tasks_v1';

  var STATUSES = [
    { id: 'backlog', label: 'Бэклог', cls: 'st-backlog' },
    { id: 'planned', label: 'Запланировано', cls: 'st-planned' },
    { id: 'in_progress', label: 'В работе', cls: 'st-in_progress' },
    { id: 'review', label: 'На проверке', cls: 'st-review' },
    { id: 'done', label: 'Выполнено', cls: 'st-done' }
  ];

  var PRIORITIES = [
    { id: 'low', label: 'Низкий', cls: 'pr-low', rank: 0 },
    { id: 'medium', label: 'Средний', cls: 'pr-medium', rank: 1 },
    { id: 'high', label: 'Высокий', cls: 'pr-high', rank: 2 },
    { id: 'critical', label: 'Критический', cls: 'pr-critical', rank: 3 }
  ];

  var PROJECT_STATUSES = [
    { id: 'planned', label: 'Планируется', cls: 'pj-planned' },
    { id: 'active', label: 'Активный', cls: 'pj-active' },
    { id: 'paused', label: 'Приостановлен', cls: 'pj-paused' },
    { id: 'done', label: 'Завершён', cls: 'pj-done' },
    { id: 'archived', label: 'Архивный', cls: 'pj-archived' }
  ];

  var ROLE_LABELS = { admin: 'Администратор', manager: 'Руководитель проекта', employee: 'Сотрудник' };

  var state = null;
  var listeners = [];
  var saveTimer = null;

  /* ---------- Базовое ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.users && parsed.users.length) { state = parsed; return state; }
      }
    } catch (e) { console.warn('Не удалось прочитать данные', e); }
    state = Seed.create();
    save();
    return state;
  }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 120);
  }

  function flush() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Не удалось сохранить данные', e);
      toast('Не удалось сохранить данные: хранилище переполнено', 'err');
    }
  }

  function emit() {
    listeners.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
  }

  function commit(quiet) {
    save();
    if (!quiet) emit();
  }

  function subscribe(fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; }

  /* ---------- Справочники ---------- */
  function status(id) { return STATUSES.filter(function (s) { return s.id === id; })[0] || STATUSES[0]; }
  function priority(id) { return PRIORITIES.filter(function (s) { return s.id === id; })[0] || PRIORITIES[1]; }
  function projectStatus(id) { return PROJECT_STATUSES.filter(function (s) { return s.id === id; })[0] || PROJECT_STATUSES[0]; }

  /* ---------- Пользователи ---------- */
  function currentUser() {
    if (!state.sessionUserId) return null;
    return user(state.sessionUserId);
  }
  function user(id) { return state.users.filter(function (u) { return u.id === id; })[0] || null; }
  function users() { return state.users.slice(); }

  function login(email, password) {
    var u = state.users.filter(function (x) {
      return x.email.toLowerCase() === String(email || '').trim().toLowerCase();
    })[0];
    if (!u || u.password !== password) return null;
    state.sessionUserId = u.id;
    u.lastActive = new Date().toISOString();
    checkDeadlines();
    commit();
    return u;
  }

  function logout() {
    state.sessionUserId = null;
    commit();
  }

  function isAdmin(u) { u = u || currentUser(); return !!u && u.role === 'admin'; }
  function isManager(u) { u = u || currentUser(); return !!u && u.role === 'manager'; }

  function updateProfile(patch) {
    var u = currentUser();
    if (!u) return;
    ['firstName', 'lastName', 'position', 'avatar'].forEach(function (k) {
      if (patch[k] !== undefined) u[k] = patch[k];
    });
    commit();
  }

  function changePassword(oldP, newP) {
    var u = currentUser();
    if (!u || u.password !== oldP) return false;
    if (!newP || newP.length < 5) return false;
    u.password = newP;
    commit();
    return true;
  }

  function createUser(data) {
    if (!isAdmin()) throw new Error('Недостаточно прав');
    if (!data.email || !data.password) throw new Error('Укажите почту и пароль');
    if (state.users.some(function (u) { return u.email.toLowerCase() === data.email.toLowerCase(); })) {
      throw new Error('Пользователь с такой почтой уже существует');
    }
    var u = {
      id: H.uid('u'),
      email: data.email.trim(),
      password: data.password,
      firstName: data.firstName || 'Новый',
      lastName: data.lastName || 'сотрудник',
      position: data.position || 'Сотрудник',
      role: data.role || 'employee',
      avatar: null,
      theme: 'light',
      createdAt: new Date().toISOString(),
      lastActive: null
    };
    state.users.push(u);
    commit();
    return u;
  }

  function updateUser(id, patch) {
    if (!isAdmin()) throw new Error('Недостаточно прав');
    var u = user(id);
    if (!u) return;
    if (patch.email && state.users.some(function (x) { return x.id !== id && x.email.toLowerCase() === patch.email.toLowerCase(); })) {
      throw new Error('Почта уже используется');
    }
    ['firstName', 'lastName', 'position', 'email', 'role'].forEach(function (k) {
      if (patch[k] !== undefined && patch[k] !== '') u[k] = patch[k];
    });
    if (patch.password) u.password = patch.password;
    commit();
  }

  function deleteUser(id) {
    if (!isAdmin()) throw new Error('Недостаточно прав');
    if (id === state.sessionUserId) throw new Error('Нельзя удалить текущего пользователя');
    var fallback = state.users.filter(function (u) { return u.role === 'admin' && u.id !== id; })[0];
    if (!fallback) throw new Error('Нельзя удалить последнего администратора');
    state.users = state.users.filter(function (u) { return u.id !== id; });
    state.projects.forEach(function (p) {
      p.memberIds = p.memberIds.filter(function (m) { return m !== id; });
      if (p.leaderId === id) p.leaderId = fallback.id;
    });
    state.tasks.forEach(function (t) {
      if (t.assigneeId === id) t.assigneeId = fallback.id;
      if (t.reporterId === id) t.reporterId = fallback.id;
      (t.comments || []).forEach(function (c) { if (c.authorId === id) c.authorId = fallback.id; });
    });
    state.notifications = state.notifications.filter(function (n) { return n.userId !== id; });
    commit();
  }

  /* ---------- Проекты ---------- */
  function project(id) { return state.projects.filter(function (p) { return p.id === id; })[0] || null; }

  function visibleProjects() {
    var u = currentUser();
    if (!u) return [];
    if (u.role === 'admin') return state.projects.slice();
    return state.projects.filter(function (p) { return p.memberIds.indexOf(u.id) !== -1; });
  }

  function canViewProject(p, u) {
    u = u || currentUser();
    if (!u || !p) return false;
    if (u.role === 'admin') return true;
    return p.memberIds.indexOf(u.id) !== -1;
  }

  function canManageProject(p, u) {
    u = u || currentUser();
    if (!u || !p) return false;
    if (u.role === 'admin') return true;
    return u.role === 'manager' && p.leaderId === u.id;
  }

  function canCreateProject() { return isAdmin(); }

  function createProject(data) {
    if (!canCreateProject()) throw new Error('Недостаточно прав');
    var p = {
      id: H.uid('p'),
      name: (data.name || '').trim(),
      description: (data.description || '').trim(),
      leaderId: data.leaderId,
      memberIds: dedupe([].concat(data.memberIds || [], [data.leaderId])),
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || null,
      status: data.status || 'planned',
      allowEmployeeCreateTasks: !!data.allowEmployeeCreateTasks,
      createdBy: state.sessionUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!p.name) throw new Error('Введите название проекта');
    if (!p.leaderId) throw new Error('Выберите руководителя');
    state.projects.push(p);
    commit();
    return p;
  }

  function updateProject(id, patch) {
    var p = project(id);
    if (!p) throw new Error('Проект не найден');
    var isAdmin_ = isAdmin();
    var isLeader = currentUser() && p.leaderId === currentUser().id;
    if (!isAdmin_ && !(isLeader && currentUser().role === 'manager')) throw new Error('Недостаточно прав');

    if (patch.name !== undefined) { if (!patch.name.trim()) throw new Error('Введите название'); p.name = patch.name.trim(); }
    if (patch.description !== undefined) p.description = patch.description;
    if (isAdmin_) {
      if (patch.leaderId) p.leaderId = patch.leaderId;
      if (patch.status) p.status = patch.status;
      if (patch.memberIds) p.memberIds = dedupe([].concat(patch.memberIds, [p.leaderId]));
      if (patch.startDate !== undefined) p.startDate = patch.startDate;
      if (patch.endDate !== undefined) p.endDate = patch.endDate;
    } else if (patch.memberIds) {
      p.memberIds = dedupe([].concat(patch.memberIds, [p.leaderId]));
    }
    if (patch.allowEmployeeCreateTasks !== undefined) p.allowEmployeeCreateTasks = !!patch.allowEmployeeCreateTasks;
    p.updatedAt = new Date().toISOString();
    commit();
    return p;
  }

  function archiveProject(id) {
    var p = project(id);
    if (!p) return;
    if (!isAdmin()) throw new Error('Недостаточно прав');
    p.status = p.status === 'archived' ? 'active' : 'archived';
    p.updatedAt = new Date().toISOString();
    commit();
  }

  /* ---------- Задачи ---------- */
  function task(id) { return state.tasks.filter(function (t) { return t.id === id; })[0] || null; }

  function projectTasks(projectId) {
    return state.tasks.filter(function (t) { return t.projectId === projectId; });
  }

  function myTasks() {
    var u = currentUser();
    if (!u) return [];
    return state.tasks.filter(function (t) { return t.assigneeId === u.id; });
  }

  function visibleTasks() {
    var ids = visibleProjects().map(function (p) { return p.id; });
    return state.tasks.filter(function (t) { return ids.indexOf(t.projectId) !== -1; });
  }

  function isOverdue(t) {
    if (!t.deadline || t.status === 'done') return false;
    return new Date(t.deadline) < new Date();
  }

  function canCreateTask(p, u) {
    u = u || currentUser();
    if (!u || !p) return false;
    if (u.role === 'admin') return true;
    if (p.memberIds.indexOf(u.id) === -1) return false;
    if (u.role === 'manager' && p.leaderId === u.id) return true;
    return !!p.allowEmployeeCreateTasks;
  }

  function canEditTask(t, u) {
    u = u || currentUser();
    var p = project(t.projectId);
    if (!u || !p) return false;
    if (u.role === 'admin') return true;
    if (u.role === 'manager') return p.leaderId === u.id || p.memberIds.indexOf(u.id) !== -1;
    return false;
  }

  function canChangeStatus(t, u) {
    u = u || currentUser();
    if (!u) return false;
    if (canEditTask(t, u)) return true;
    return t.assigneeId === u.id;
  }

  function canComment(t, u) {
    u = u || currentUser();
    if (!u) return false;
    var p = project(t.projectId);
    return p && canViewProject(p, u);
  }

  function nextKey() {
    state.counter = (state.counter || 130) + 1;
    return 'NDF-' + state.counter;
  }

  function addHistory(t, text, userId) {
    t.history = t.history || [];
    t.history.push({ id: H.uid('h'), at: new Date().toISOString(), userId: userId || state.sessionUserId, text: text });
  }

  function createTask(data) {
    var p = project(data.projectId);
    if (!p) throw new Error('Выберите проект');
    if (!canCreateTask(p)) throw new Error('Недостаточно прав для создания задачи');
    if (!data.title || !data.title.trim()) throw new Error('Введите название задачи');
    if (!data.assigneeId) throw new Error('Выберите исполнителя');
    if (!data.priority) throw new Error('Выберите приоритет');

    var t = {
      id: H.uid('t'),
      key: nextKey(),
      title: data.title.trim(),
      description: (data.description || '').trim(),
      projectId: p.id,
      status: data.status || 'backlog',
      priority: data.priority,
      assigneeId: data.assigneeId,
      reporterId: state.sessionUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: data.deadline || null,
      tags: data.tags || [],
      attachments: data.attachments || [],
      comments: [],
      history: [],
      notifDueSoon: false,
      notifOverdue: false
    };
    addHistory(t, 'создал(а) задачу');
    state.tasks.push(t);

    if (t.assigneeId !== state.sessionUserId) {
      notify(t.assigneeId, 'assign', 'Вам назначена задача «' + t.title + '» (' + t.key + ')', t.id, p.id);
    }
    commit();
    return t;
  }

  function updateTask(id, patch, opts) {
    var t = task(id);
    if (!t) throw new Error('Задача не найдена');
    opts = opts || {};
    var actor = currentUser();
    var full = canEditTask(t, actor);
    var statusOnly = !full && canChangeStatus(t, actor);

    if (!full && !statusOnly) throw new Error('Недостаточно прав');
    if (!full) {
      if (Object.keys(patch).some(function (k) { return k !== 'status'; })) {
        throw new Error('Можно изменить только статус');
      }
    }

    var p = project(t.projectId);

    if (patch.title !== undefined && patch.title.trim()) t.title = patch.title.trim();
    if (patch.description !== undefined) t.description = patch.description;
    if (patch.status !== undefined && patch.status !== t.status) {
      var from = status(t.status).label, to = status(patch.status).label;
      t.status = patch.status;
      addHistory(t, 'перевёл(а) задачу из «' + from + '» в «' + to + '»');
      if (patch.status === 'done') t.completedAt = new Date().toISOString();
      if (!opts.silent) {
        notifyChanged(t, 'status', 'Статус задачи «' + t.title + '» изменён: ' + from + ' → ' + to);
      }
    }
    if (patch.priority !== undefined && patch.priority !== t.priority) {
      addHistory(t, 'изменил(а) приоритет: ' + priority(t.priority).label + ' → ' + priority(patch.priority).label);
      t.priority = patch.priority;
    }
    if (patch.assigneeId !== undefined && patch.assigneeId !== t.assigneeId) {
      var newA = user(patch.assigneeId);
      addHistory(t, 'изменил(а) исполнителя: ' + H.fullName(user(t.assigneeId)) + ' → ' + H.fullName(newA));
      t.assigneeId = patch.assigneeId;
      if (newA && newA.id !== actor.id) {
        notify(newA.id, 'assign', 'Вас назначили исполнителем задачи «' + t.title + '» (' + t.key + ')', t.id, p.id);
      }
    }
    if (patch.deadline !== undefined) {
      var oldD = t.deadline;
      t.deadline = patch.deadline;
      if (oldD !== patch.deadline) {
        addHistory(t, 'изменил(а) дедлайн: ' + (oldD ? H.fmtDate(oldD) : '—') + ' → ' + (patch.deadline ? H.fmtDate(patch.deadline) : '—'));
        t.notifDueSoon = false; t.notifOverdue = false;
        if (t.assigneeId && t.assigneeId !== actor.id) {
          notify(t.assigneeId, 'deadline', 'Изменён срок задачи «' + t.title + '»: ' + (patch.deadline ? 'до ' + H.fmtDate(patch.deadline) : 'срок снят'), t.id, p.id);
        }
      }
    }
    if (patch.reporterId !== undefined && isAdmin()) t.reporterId = patch.reporterId;
    if (patch.projectId !== undefined) t.projectId = patch.projectId;
    if (patch.tags !== undefined) t.tags = patch.tags;
    if (patch.attachments !== undefined) t.attachments = patch.attachments;

    t.updatedAt = new Date().toISOString();
    commit();
    return t;
  }

  function deleteTask(id) {
    var t = task(id);
    if (!t) return;
    if (!isAdmin() && !canEditTask(t)) throw new Error('Недостаточно прав');
    state.tasks = state.tasks.filter(function (x) { return x.id !== id; });
    state.notifications = state.notifications.filter(function (n) { return n.taskId !== id; });
    commit();
  }

  function moveTask(id, statusId) {
    return updateTask(id, { status: statusId });
  }

  /* ---------- Комментарии ---------- */
  function addComment(taskId, text) {
    var t = task(taskId);
    if (!t) throw new Error('Задача не найдена');
    if (!canComment(t)) throw new Error('Недостаточно прав');
    if (!text || !text.trim()) throw new Error('Комментарий пуст');
    var c = { id: H.uid('c'), authorId: state.sessionUserId, text: text.trim(), createdAt: new Date().toISOString(), editedAt: null };
    t.comments = t.comments || [];
    t.comments.push(c);
    t.updatedAt = new Date().toISOString();
    addHistory(t, 'добавил(а) комментарий');
    notifyChanged(t, 'comment', H.fullName(currentUser()) + ' оставил(а) комментарий в задаче «' + t.title + '» (' + t.key + ')', state.sessionUserId);
    commit();
    return c;
  }

  function updateComment(taskId, commentId, text) {
    var t = task(taskId);
    if (!t) return;
    var c = (t.comments || []).filter(function (x) { return x.id === commentId; })[0];
    if (!c) throw new Error('Комментарий не найден');
    if (c.authorId !== state.sessionUserId && !isAdmin()) throw new Error('Можно редактировать только свои комментарии');
    if (!text.trim()) throw new Error('Комментарий пуст');
    c.text = text.trim();
    c.editedAt = new Date().toISOString();
    commit();
  }

  function deleteComment(taskId, commentId) {
    var t = task(taskId);
    if (!t) return;
    var c = (t.comments || []).filter(function (x) { return x.id === commentId; })[0];
    if (!c) return;
    if (c.authorId !== state.sessionUserId && !isAdmin()) throw new Error('Можно удалять только свои комментарии');
    t.comments = t.comments.filter(function (x) { return x.id !== commentId; });
    commit();
  }

  /* ---------- Вложения ---------- */
  function addAttachment(taskId, att) {
    var t = task(taskId);
    if (!t) throw new Error('Задача не найдена');
    if (!canEditTask(t) && t.assigneeId !== state.sessionUserId) throw new Error('Недостаточно прав');
    t.attachments = t.attachments || [];
    att.id = H.uid('a');
    t.attachments.push(att);
    addHistory(t, 'прикрепил(а): ' + att.name);
    t.updatedAt = new Date().toISOString();
    commit();
  }

  function removeAttachment(taskId, attId) {
    var t = task(taskId);
    if (!t) return;
    if (!canEditTask(t)) throw new Error('Недостаточно прав');
    t.attachments = (t.attachments || []).filter(function (a) { return a.id !== attId; });
    commit();
  }

  /* ---------- Уведомления ---------- */
  function notify(userId, type, text, taskId, projectId) {
    if (!userId) return;
    state.notifications.unshift({
      id: H.uid('n'), userId: userId, type: type, text: text,
      taskId: taskId || null, projectId: projectId || null,
      read: false, createdAt: new Date().toISOString()
    });
    if (state.notifications.length > 300) state.notifications.length = 300;
  }

  /* уведомления о смене статуса/комментарии — адресатам задачи, кроме автора */
  function notifyChanged(t, type, text, excludeId) {
    var targets = dedupe([t.assigneeId, t.reporterId].filter(Boolean));
    targets.forEach(function (id) {
      if (id === excludeId) return;
      notify(id, type, text, t.id, t.projectId);
    });
  }

  function myNotifications() {
    var u = currentUser();
    if (!u) return [];
    return state.notifications.filter(function (n) { return n.userId === u.id; });
  }

  function unreadCount() {
    return myNotifications().filter(function (n) { return !n.read; }).length;
  }

  function markRead(id) {
    var n = state.notifications.filter(function (x) { return x.id === id; })[0];
    if (n) { n.read = true; commit(); }
  }

  function markAllRead() {
    myNotifications().forEach(function (n) { n.read = true; });
    commit();
  }

  function clearNotifications() {
    var u = currentUser();
    if (!u) return;
    state.notifications = state.notifications.filter(function (n) { return n.userId !== u.id; });
    commit();
  }

  /* приближающиеся дедлайны и просрочки — один раз на задачу */
  function checkDeadlines() {
    var changed = false;
    state.tasks.forEach(function (t) {
      if (t.status === 'done' || !t.deadline) return;
      var diff = H.daysDiff(t.deadline);
      if (diff !== null && diff >= 0 && diff <= 2 && !t.notifDueSoon) {
        t.notifDueSoon = true;
        notify(t.assigneeId, 'due', 'Приближается дедлайн задачи «' + t.title + '» — ' + H.fmtDate(t.deadline), t.id, t.projectId);
        changed = true;
      }
      if (isOverdue(t) && !t.notifOverdue) {
        t.notifOverdue = true;
        notify(t.assigneeId, 'overdue', 'Задача просрочена: «' + t.title + '» (срок ' + H.fmtDate(t.deadline) + ')', t.id, t.projectId);
        changed = true;
      }
    });
    if (changed) save();
    return changed;
  }

  /* ---------- Статистика ---------- */
  function statsFor(userId) {
    var list = state.tasks.filter(function (t) { return t.assigneeId === userId; });
    var open = list.filter(function (t) { return t.status !== 'done'; });
    var weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
    return {
      total: list.length,
      active: open.length,
      overdue: open.filter(isOverdue).length,
      week: open.filter(function (t) {
        if (!t.deadline) return false;
        var d = new Date(t.deadline);
        return d <= weekEnd && d >= H.startOfDay(new Date());
      }).length,
      done: list.filter(function (t) { return t.status === 'done'; }).length
    };
  }

  function workload(userId) {
    var s = statsFor(userId);
    var cap = 8;
    var pct = Math.min(100, Math.round(s.active / cap * 100));
    return { active: s.active, overdue: s.overdue, pct: pct, cls: pct >= 85 ? 'high' : (pct >= 55 ? 'mid' : '') };
  }

  function dedupe(arr) {
    var out = [];
    (arr || []).forEach(function (x) { if (x && out.indexOf(x) === -1) out.push(x); });
    return out;
  }

  function toast(msg, kind) {
    if (global.App && App.toast) App.toast(msg, kind);
  }

  function resetAll() {
    localStorage.removeItem(KEY);
    state = null;
    load();
    emit();
  }

  global.Store = {
    KEY: KEY,
    STATUSES: STATUSES, PRIORITIES: PRIORITIES, PROJECT_STATUSES: PROJECT_STATUSES, ROLE_LABELS: ROLE_LABELS,
    load: load, save: save, flush: flush, subscribe: subscribe, emit: emit,
    state: function () { return state; },
    status: status, priority: priority, projectStatus: projectStatus,
    currentUser: currentUser, user: user, users: users, login: login, logout: logout,
    isAdmin: isAdmin, isManager: isManager, updateProfile: updateProfile, changePassword: changePassword,
    createUser: createUser, updateUser: updateUser, deleteUser: deleteUser,
    project: project, visibleProjects: visibleProjects, canViewProject: canViewProject,
    canManageProject: canManageProject, canCreateProject: canCreateProject,
    createProject: createProject, updateProject: updateProject, archiveProject: archiveProject,
    task: task, projectTasks: projectTasks, myTasks: myTasks, visibleTasks: visibleTasks,
    isOverdue: isOverdue, canCreateTask: canCreateTask, canEditTask: canEditTask,
    canChangeStatus: canChangeStatus, canComment: canComment,
    createTask: createTask, updateTask: updateTask, deleteTask: deleteTask, moveTask: moveTask,
    addComment: addComment, updateComment: updateComment, deleteComment: deleteComment,
    addAttachment: addAttachment, removeAttachment: removeAttachment,
    myNotifications: myNotifications, unreadCount: unreadCount, markRead: markRead,
    markAllRead: markAllRead, clearNotifications: clearNotifications, checkDeadlines: checkDeadlines,
    statsFor: statsFor, workload: workload, resetAll: resetAll, notify: notify
  };
})(window);
