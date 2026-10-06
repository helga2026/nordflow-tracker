/* ========== Приложение: роутер, оболочка, модальные окна ========== */
(function (global) {
  'use strict';

  var lastRoute = '';
  var searchOpen = false;

  /* ---------- Тосты ---------- */
  function toast(msg, kind) {
    var root = H.qs('#toast-root');
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(function () { el.remove(); }, 320);
    }, 3200);
  }

  /* ---------- Модальные окна ---------- */
  function modal(opts) {
    var root = H.qs('#modal-root');
    root.innerHTML =
      '<div class="modal-backdrop"><div class="modal ' + (opts.size || '') + '" role="dialog" aria-modal="true">' +
      '<div class="modal-head"><h3>' + H.esc(opts.title || '') + '</h3>' +
      '<button class="icon-btn" data-modal-close>' + H.icon('x') + '</button></div>' +
      '<div class="modal-body">' + (opts.body || '') + '</div>' +
      '<div class="modal-foot">' +
      (opts.hideCancel ? '' : '<button class="btn btn-ghost" data-modal-close>' + H.esc(opts.cancelText || 'Отмена') + '</button>') +
      (opts.confirmText === null ? '' : '<button class="btn btn-cta modal-confirm">' + H.esc(opts.confirmText || 'OK') + '</button>') +
      '</div></div></div>';

    var backdrop = root.querySelector('.modal-backdrop');
    function close() {
      root.innerHTML = '';
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    backdrop.addEventListener('mousedown', function (e) { if (e.target === backdrop) close(); });
    H.qsa('[data-modal-close]', root).forEach(function (b) { b.addEventListener('click', close); });
    H.hydrateIcons(root);

    var body = root.querySelector('.modal-body');
    var dialog = root.querySelector('.modal');
    if (opts.onMount) opts.onMount(dialog, close);
    var f = body.querySelector('input,select,textarea,button');
    if (f) setTimeout(function () { f.focus(); }, 60);
    return close;
  }

  function confirmDlg(title, text, onOk) {
    modal({
      title: title,
      body: '<p>' + H.esc(text) + '</p>',
      confirmText: 'Подтвердить',
      cancelText: 'Отмена',
      size: 'sm',
      onMount: function (root, close) {
        root.querySelector('.modal-confirm').addEventListener('click', function () {
          close();
          onOk();
        });
      }
    });
  }

  /* ---------- Тема ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    var b = H.qs('#theme-btn');
    if (b) b.innerHTML = H.icon(theme === 'dark' ? 'sun' : 'moon');
    try { localStorage.setItem('nordflow_theme', theme); } catch (e) {}
  }

  function setTheme(theme) {
    var u = Store.currentUser();
    if (u) Store.updateProfile({ theme: theme });
    applyTheme(theme);
    if (location.hash.indexOf('#/settings') !== -1) render();
    toast(theme === 'dark' ? 'Тёмная тема включена' : 'Светлая тема включена', 'ok');
  }

  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme');
    setTheme(cur === 'dark' ? 'light' : 'dark');
  }

  /* ---------- Оболочка ---------- */
  function updateChrome() {
    var u = Store.currentUser();
    if (!u) return;
    var route = parseHash().name;

    H.qsa('#main-nav a').forEach(function (a) {
      a.classList.toggle('active', a.dataset.route === route ||
        (route === 'project' && a.dataset.route === 'projects') ||
        (route === 'task' && a.dataset.route === 'my-tasks'));
    });

    var unread = Store.unreadCount();
    var badge = H.qs('#nav-badge');
    badge.textContent = unread > 99 ? '99+' : unread;
    badge.classList.toggle('hidden', !unread);
    H.qs('#bell-dot').classList.toggle('hidden', !unread);
    H.qs('#bell-btn').classList.toggle('with-dot', !!unread);

    H.qs('#nav-users').classList.toggle('hidden', u.role !== 'admin');

    H.qs('#sidebar-user').innerHTML =
      '<div class="side-user">' + H.avatarHTML(u) +
      '<div class="meta"><div class="nm">' + H.esc(H.fullName(u)) + '</div>' +
      '<div class="rl">' + H.esc(Store.ROLE_LABELS[u.role]) + '</div></div>' +
      '<button class="icon-btn logout-btn" id="side-logout" title="Выйти">' + H.icon('logout') + '</button></div>';
    H.qs('#side-logout').addEventListener('click', function () {
      confirmDlg('Выйти из аккаунта?', 'Вы сможете войти снова с теми же данными.', logout);
    });

    H.qs('#profile-btn').innerHTML = H.avatarHTML(u, 'sm');
  }

  function openSidebar(open) {
    var sb = H.qs('#sidebar'), ov = H.qs('#sidebar-overlay');
    var next = open === undefined ? !sb.classList.contains('open') : open;
    sb.classList.toggle('open', next);
    ov.classList.toggle('show', next);
  }

  /* ---------- Роутер ---------- */
  function parseHash() {
    var h = (location.hash || '#/dashboard').replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    if (!parts.length) return { name: 'dashboard' };
    if (parts[0] === 'projects') return parts[1] ? { name: 'project', id: parts[1] } : { name: 'projects' };
    if (parts[0] === 'tasks' && parts[1]) return { name: 'task', id: parts[1] };
    return { name: parts[0] };
  }

  function render() {
    var u = Store.currentUser();
    if (!u) { VAuth.show(); return; }

    var route = parseHash();
    var view = H.qs('#view');
    var html = '';
    var after = null;
    var needBoardClicks = false;

    switch (route.name) {
      case 'dashboard':
        html = VMain.dashboard(); needBoardClicks = true; break;
      case 'my-tasks':
        html = VTasks.myTasks();
        after = function (root) { VTasks.bindMyTasks(root); };
        break;
      case 'projects':
        html = VProjects.projectsPage();
        after = function (root) { VProjects.bindProjects(root); };
        break;
      case 'project':
        if (VProjects.lastId !== route.id) { VProjects.setTab('board'); VProjects.lastId = route.id; }
        html = VProjects.projectPage(route.id);
        after = function (root) { VProjects.bindProjectPage(root, route.id); };
        break;
      case 'task':
        html = VTasks.taskPage(route.id);
        after = function (root) { VTasks.bindTaskPage(root, route.id); };
        needBoardClicks = true;
        break;
      case 'team':
        html = VPeople.teamPage();
        after = function (root) { VPeople.bindTeam(root); };
        break;
      case 'notifications':
        html = VMain.notifications();
        after = function (root) { VMain.bindNotifications(root); };
        break;
      case 'settings':
        html = VPeople.settingsPage();
        after = function (root) { VPeople.bindSettings(root); };
        break;
      case 'users':
        html = Store.isAdmin() ? VPeople.usersPage() : '<div class="empty"><p>Недостаточно прав</p></div>';
        after = function (root) { if (Store.isAdmin()) VPeople.bindUsers(root); };
        break;
      default:
        location.hash = '#/dashboard';
        return;
    }

    view.innerHTML = html;
    H.hydrateIcons(view);
    if (after) after(view);
    if (needBoardClicks) VTasks.bindTaskClicks(view);
    updateChrome();

    var key = route.name + '/' + (route.id || '');
    if (key !== lastRoute) {
      lastRoute = key;
      window.scrollTo(0, 0);
      view.focus({ preventScroll: true });
    }
    document.title = 'NordFlow Tasks';
  }

  /* ---------- Глобальный поиск ---------- */
  function search(q) {
    q = q.trim().toLowerCase();
    var box = H.qs('#search-results');
    if (!q) { box.classList.add('hidden'); box.innerHTML = ''; return; }

    var projects = Store.visibleProjects().filter(function (p) {
      return p.name.toLowerCase().indexOf(q) !== -1 || (p.description || '').toLowerCase().indexOf(q) !== -1;
    }).slice(0, 5);

    var tasks = Store.visibleTasks().filter(function (t) {
      return t.title.toLowerCase().indexOf(q) !== -1 || t.key.toLowerCase().indexOf(q) !== -1;
    }).slice(0, 6);

    var people = Store.users().filter(function (u) {
      return H.fullName(u).toLowerCase().indexOf(q) !== -1 ||
        u.email.toLowerCase().indexOf(q) !== -1 ||
        (u.position || '').toLowerCase().indexOf(q) !== -1;
    }).slice(0, 5);

    var html = '';
    if (projects.length) {
      html += '<div class="sr-group">Проекты</div>' + projects.map(function (p) {
        return '<div class="sr-item" data-goto-project="' + p.id + '">' + H.icon('folder', 17) +
          '<div><div class="t">' + H.esc(p.name) + '</div><div class="s">' + H.esc(Store.projectStatus(p.status).label) + '</div></div></div>';
      }).join('');
    }
    if (tasks.length) {
      html += '<div class="sr-group">Задачи</div>' + tasks.map(function (t) {
        return '<div class="sr-item" data-goto-task="' + t.id + '">' + H.icon('check', 17) +
          '<div><div class="t">' + H.esc(t.title) + '</div><div class="s">' + H.esc(t.key) + ' · ' +
          H.esc((Store.project(t.projectId) || {}).name || '') + '</div></div></div>';
      }).join('');
    }
    if (people.length) {
      html += '<div class="sr-group">Сотрудники</div>' + people.map(function (u) {
        return '<div class="sr-item" data-person="' + u.id + '">' + H.avatarHTML(u, 'sm') +
          '<div><div class="t">' + H.esc(H.fullName(u)) + '</div><div class="s">' + H.esc(u.position) + '</div></div></div>';
      }).join('');
    }
    if (!html) html = '<div class="sr-empty">Ничего не найдено по запросу «' + H.esc(q) + '»</div>';

    box.innerHTML = html;
    box.classList.remove('hidden');
    searchOpen = true;

    H.qsa('[data-goto-task]', box).forEach(function (el) {
      el.addEventListener('mousedown', function (e) { e.preventDefault(); closeSearch(); location.hash = '#/tasks/' + el.dataset.gotoTask; });
    });
    H.qsa('[data-goto-project]', box).forEach(function (el) {
      el.addEventListener('mousedown', function (e) { e.preventDefault(); closeSearch(); location.hash = '#/projects/' + el.dataset.gotoProject; });
    });
    H.qsa('[data-person]', box).forEach(function (el) {
      el.addEventListener('mousedown', function (e) {
        e.preventDefault(); closeSearch();
        if (Store.isManager() || Store.isAdmin()) VPeople.memberModal(el.dataset.person, null);
        else location.hash = '#/team';
      });
    });
  }

  function closeSearch() {
    var box = H.qs('#search-results');
    box.classList.add('hidden');
    H.qs('#global-search').value = '';
    searchOpen = false;
  }

  /* ---------- Сессия ---------- */
  function enterApp() {
    VAuth.hide();
    var u = Store.currentUser();
    applyTheme(u.theme || 'light');
    Store.checkDeadlines();
    Store.flush();
    lastRoute = '';
    if (!location.hash || location.hash === '#/') location.hash = '#/dashboard';
    render();
    toast('Добро пожаловать, ' + u.firstName + '!', 'ok');
  }

  function logout() {
    Store.logout();
    closeSearch();
    VAuth.show();
  }

  /* ---------- Инициализация ---------- */
  function init() {
    Store.load();
    var savedTheme = null;
    try { savedTheme = localStorage.getItem('nordflow_theme'); } catch (e) {}
    applyTheme(savedTheme || 'light');

    VAuth.init();
    H.hydrateIcons(document);

    H.qs('#menu-btn').addEventListener('click', function () { openSidebar(); });
    H.qs('#sidebar-overlay').addEventListener('click', function () { openSidebar(false); });
    H.qsa('#main-nav a').forEach(function (a) {
      a.addEventListener('click', function () { openSidebar(false); });
    });

    H.qs('#theme-btn').addEventListener('click', toggleTheme);
    H.qs('#bell-btn').addEventListener('click', function () { location.hash = '#/notifications'; });
    H.qs('#profile-btn').addEventListener('click', function () { location.hash = '#/settings'; });

    var g = H.qs('#global-search');
    g.addEventListener('input', H.debounce(function () { search(g.value); }, 180));
    g.addEventListener('focus', function () { if (g.value) search(g.value); });
    g.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSearch(); });
    document.addEventListener('click', function (e) {
      if (searchOpen && !e.target.closest('.search-wrap')) closeSearch();
    });

    window.addEventListener('hashchange', function () {
      if (!Store.currentUser()) return;
      openSidebar(false);
      render();
    });

    Store.subscribe(function () {
      if (Store.currentUser()) render(); else VAuth.show();
    });

    if (Store.currentUser()) enterApp(); else VAuth.show();
  }

  global.App = {
    init: init, render: render, modal: modal, confirm: confirmDlg, toast: toast,
    enterApp: enterApp, logout: logout, setTheme: setTheme, toggleTheme: toggleTheme,
    openSidebar: openSidebar, updateChrome: updateChrome, closeSearch: closeSearch
  };

  document.addEventListener('DOMContentLoaded', init);
})(window);
