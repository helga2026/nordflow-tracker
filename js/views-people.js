/* ========== Команда, профиль, пользователи ========== */
(function (global) {
  'use strict';

  /* ---------- Команда ---------- */
  function teamPage() {
    var list = Store.users();
    var canSeeTasks = Store.isManager() || Store.isAdmin();

    var html =
      '<div class="page-head"><div><h2>Команда</h2>' +
      '<p class="sub">Сотрудников: ' + list.length + '</p></div>' +
      (Store.isAdmin() ? '<div class="page-actions"><a class="btn btn-primary" href="#/users">' + H.icon('plus') + 'Управление пользователями</a></div>' : '') +
      '</div><div class="grid grid-2">';

    html += list.map(function (u) {
      var w = Store.workload(u.id);
      var me = Store.currentUser().id === u.id;
      return '<article class="member-card" data-member="' + u.id + '" data-project="">' +
        H.avatarHTML(u, 'lg') +
        '<div class="info"><div class="nm">' + H.esc(H.fullName(u)) +
        (me ? ' <span class="pill plain pj-planned">это вы</span>' : '') +
        ' <span class="pill plain ' + (u.role === 'admin' ? 'pj-active' : (u.role === 'manager' ? 'st-planned' : 'st-backlog')) + '">' +
        H.esc(Store.ROLE_LABELS[u.role]) + '</span></div>' +
        '<div class="ps">' + H.esc(u.position) + '</div>' +
        '<div class="em">' + H.esc(u.email) + '</div>' +
        '<div class="mini-stats" style="margin-top:8px">' +
        '<span>Активных: <b>' + w.active + '</b></span>' +
        '<span class="bad">Просрочено: <b>' + w.overdue + '</b></span></div>' +
        '<div class="load"><div class="load-bar"><i class="' + w.cls + '" style="width:' + w.pct + '%"></i></div>' +
        '<div class="load-txt"><span>Текущая загрузка</span><span>' + w.pct + '%</span></div></div>' +
        '</div>' +
        (canSeeTasks ? '<span class="icon-btn" title="Открыть карточку">' + H.icon('arrow') + '</span>' : '') +
        '</article>';
    }).join('');

    html += '</div>';
    if (!canSeeTasks) {
      html += '<p class="small muted" style="margin-top:14px">Карточки сотрудников с активными задачами доступны руководителям и администратору.</p>';
    }
    return html;
  }

  function bindTeam(root) {
    H.qsa('[data-member]', root).forEach(function (el) {
      el.addEventListener('click', function () { memberModal(el.dataset.member, el.dataset.project || null); });
    });
  }

  function memberModal(userId, projectId) {
    var u = Store.user(userId);
    if (!u) return;
    var w = Store.workload(u.id);
    var canSee = Store.isManager() || Store.isAdmin();
    var tasks = canSee
      ? Store.visibleTasks().filter(function (t) { return t.assigneeId === u.id && t.status !== 'done'; })
      : [];

    var body =
      '<div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">' + H.avatarHTML(u, 'lg') +
      '<div><div style="font-size:18px;font-weight:650">' + H.esc(H.fullName(u)) + '</div>' +
      '<div class="muted small">' + H.esc(u.position) + ' · ' + H.esc(Store.ROLE_LABELS[u.role]) + '</div>' +
      '<div class="muted small">' + H.esc(u.email) + '</div></div></div>' +
      '<div class="kv-row"><span class="k">Активных задач</span><b>' + w.active + '</b></div>' +
      '<div class="kv-row"><span class="k">Просроченных задач</span><b class="' + (w.overdue ? 'overdue-mark' : '') + '">' + w.overdue + '</b></div>' +
      '<div class="load" style="margin:8px 0 4px"><div class="load-bar"><i class="' + w.cls + '" style="width:' + w.pct + '%"></i></div>' +
      '<div class="load-txt"><span>Загрузка</span><span>' + w.pct + '%</span></div></div>';

    if (canSee) {
      body += '<div class="sep"></div><h4 style="margin-bottom:10px">Активные задачи</h4>' +
        (tasks.length
          ? '<div class="list">' + tasks.map(function (t) {
              var over = Store.isOverdue(t);
              return '<div class="list-item" data-goto-task="' + t.id + '">' +
                '<span class="pill plain ' + Store.status(t.status).cls + '">' + Store.status(t.status).label + '</span>' +
                '<div class="grow"><div class="t">' + H.esc(t.title) + '</div>' +
                '<div class="s">' + H.esc(t.key) + ' · ' + H.esc((Store.project(t.projectId) || {}).name || '') + '</div></div>' +
                '<span class="small ' + (over ? 'overdue-mark' : 'muted') + '">' + (t.deadline ? H.fmtDate(t.deadline) : '—') + '</span></div>';
            }).join('') + '</div>'
          : '<p class="small muted">Активных задач нет</p>');
    }

    App.modal({
      title: 'Карточка сотрудника',
      body: body,
      confirmText: 'Закрыть',
      hideCancel: true,
      onMount: function (root, close) {
        H.qsa('[data-goto-task]', root).forEach(function (el) {
          el.addEventListener('click', function () { close(); location.hash = '#/tasks/' + el.dataset.gotoTask; });
        });
      }
    });
  }

  /* ---------- Настройки профиля ---------- */
  function settingsPage() {
    var u = Store.currentUser();
    var isAdmin_ = Store.isAdmin();
    return '<div class="page-head"><div><h2>Настройки профиля</h2>' +
      '<p class="sub">Управление личными данными и темой интерфейса</p></div></div>' +
      '<div class="grid grid-2" style="align-items:start">' +

      '<div class="card"><h3>' + H.icon('user', 17) + ' Личные данные</h3>' +
      '<div style="display:flex;gap:16px;align-items:center;margin-bottom:16px">' +
      '<label class="avatar lg" style="cursor:pointer;position:relative" title="Загрузить фотографию">' +
      (u.avatar ? '<img src="' + u.avatar + '" alt="">' : H.esc(H.initials(u).toUpperCase())) +
      '<input type="file" id="avatar-file" accept="image/*" style="display:none"></label>' +
      '<div><button class="btn btn-ghost btn-sm" id="avatar-pick">Загрузить фотографию</button> ' +
      (u.avatar ? '<button class="btn btn-ghost btn-sm" id="avatar-reset">Убрать</button>' : '') +
      '<p class="small muted" style="margin-top:6px">JPG или PNG, до 300 КБ</p></div></div>' +

      '<div class="form-row">' +
      '<label class="field"><span>Имя</span><input type="text" id="pf-first" value="' + H.esc(u.firstName) + '"></label>' +
      '<label class="field"><span>Фамилия</span><input type="text" id="pf-last" value="' + H.esc(u.lastName) + '"></label>' +
      '</div>' +
      '<label class="field"><span>Должность</span><input type="text" id="pf-position" value="' + H.esc(u.position) + '"></label>' +
      '<div class="form-row">' +
      '<label class="field"><span>Электронная почта</span><input type="email" value="' + H.esc(u.email) + '" disabled></label>' +
      '<label class="field"><span>Роль</span><input type="text" value="' + H.esc(Store.ROLE_LABELS[u.role]) + '" disabled></label>' +
      '</div>' +
      (isAdmin_ ? '' : '<p class="small muted">Почту и роль может изменять только администратор.</p>') +
      '<button class="btn btn-primary" id="pf-save" style="margin-top:8px">Сохранить изменения</button></div>' +

      '<div>' +
      '<div class="card"><h3>' + H.icon('shield', 17) + ' Смена пароля</h3>' +
      '<label class="field"><span>Текущий пароль</span><input type="password" id="pw-old"></label>' +
      '<label class="field"><span>Новый пароль</span><input type="password" id="pw-new" placeholder="минимум 5 символов"></label>' +
      '<label class="field"><span>Повторите новый пароль</span><input type="password" id="pw-new2"></label>' +
      '<button class="btn btn-primary" id="pw-save">Сменить пароль</button></div>' +

      '<div class="card" style="margin-top:16px"><h3>' + H.icon('sun', 17) + ' Тема оформления</h3>' +
      '<div class="chips" id="theme-choice">' +
      '<button class="btn ' + (u.theme !== 'dark' ? 'btn-primary' : 'btn-ghost') + '" data-theme-pick="light">Светлая тема</button>' +
      '<button class="btn ' + (u.theme === 'dark' ? 'btn-primary' : 'btn-ghost') + '" data-theme-pick="dark">Тёмная тема</button>' +
      '</div></div>' +

      '<div class="card" style="margin-top:16px"><h3>Сессия</h3>' +
      '<p class="small muted" style="margin-bottom:12px">Вы вошли как <b>' + H.esc(u.email) + '</b></p>' +
      '<div class="chips">' +
      '<button class="btn btn-ghost" id="logout-btn">' + H.icon('logout') + 'Выйти из аккаунта</button>' +
      (Store.isAdmin() ? '<button class="btn btn-danger" id="reset-demo">Сбросить демо-данные</button>' : '') +
      '</div></div>' +
      '</div></div>';
  }

  function bindSettings(root) {
    var u = Store.currentUser();

    var pick = H.qs('#avatar-pick', root);
    if (pick) pick.addEventListener('click', function () { H.qs('#avatar-file', root).click(); });
    var file = H.qs('#avatar-file', root);
    if (file) file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      if (f.size > 300 * 1024) { App.toast('Фото должно быть меньше 300 КБ', 'err'); return; }
      var r = new FileReader();
      r.onload = function () { Store.updateProfile({ avatar: r.result }); App.toast('Фото обновлено', 'ok'); };
      r.readAsDataURL(f);
    });
    var reset = H.qs('#avatar-reset', root);
    if (reset) reset.addEventListener('click', function () { Store.updateProfile({ avatar: null }); });

    var save = H.qs('#pf-save', root);
    if (save) save.addEventListener('click', function () {
      var first = H.qs('#pf-first', root).value.trim();
      var last = H.qs('#pf-last', root).value.trim();
      if (!first || !last) { App.toast('Имя и фамилия обязательны', 'err'); return; }
      Store.updateProfile({ firstName: first, lastName: last, position: H.qs('#pf-position', root).value.trim() });
      App.toast('Профиль сохранён', 'ok');
    });

    var pw = H.qs('#pw-save', root);
    if (pw) pw.addEventListener('click', function () {
      var oldP = H.qs('#pw-old', root).value, n1 = H.qs('#pw-new', root).value, n2 = H.qs('#pw-new2', root).value;
      if (n1 !== n2) { App.toast('Пароли не совпадают', 'err'); return; }
      if (Store.changePassword(oldP, n1)) {
        App.toast('Пароль изменён', 'ok');
        H.qs('#pw-old', root).value = H.qs('#pw-new', root).value = H.qs('#pw-new2', root).value = '';
      } else App.toast('Текущий пароль неверен или новый слишком короткий', 'err');
    });

    H.qsa('[data-theme-pick]', root).forEach(function (b) {
      b.addEventListener('click', function () { App.setTheme(b.dataset.themePick); });
    });

    var out = H.qs('#logout-btn', root);
    if (out) out.addEventListener('click', function () {
      App.confirm('Выйти из аккаунта?', 'Вы сможете войти снова с теми же данными.', function () { App.logout(); });
    });

    var resetDemo = H.qs('#reset-demo', root);
    if (resetDemo) resetDemo.addEventListener('click', function () {
      App.confirm('Сбросить демо-данные?', 'Все изменения будут удалены, вернётся исходный набор данных.', function () {
        Store.resetAll();
        App.toast('Данные сброшены', 'ok');
        App.logout();
      });
    });
  }

  /* ---------- Управление пользователями ---------- */
  function usersPage() {
    if (!Store.isAdmin()) return '<div class="empty"><p>Недостаточно прав</p></div>';
    var list = Store.users();
    return '<div class="page-head"><div><h2>Управление пользователями</h2>' +
      '<p class="sub">Пользователей: ' + list.length + ' · создаёт только администратор</p></div>' +
      '<div class="page-actions"><button class="btn btn-cta" id="user-new">' + H.icon('plus') + 'Добавить пользователя</button></div></div>' +

      '<div class="table-wrap"><table><thead><tr>' +
      '<th>Сотрудник</th><th>Почта</th><th>Должность</th><th>Роль</th><th>Активных</th><th></th>' +
      '</tr></thead><tbody>' +
      list.map(function (u) {
        var w = Store.workload(u.id);
        return '<tr>' +
          '<td><div style="display:flex;gap:10px;align-items:center">' + H.avatarHTML(u, 'sm') +
          '<div><b>' + H.esc(H.fullName(u)) + '</b>' + (u.id === Store.currentUser().id ? ' <span class="small muted">(вы)</span>' : '') +
          '<div class="small muted">' + H.fmtDate(u.createdAt) + '</div></div></div></td>' +
          '<td>' + H.esc(u.email) + '</td>' +
          '<td>' + H.esc(u.position) + '</td>' +
          '<td><span class="pill plain ' + (u.role === 'admin' ? 'pj-active' : (u.role === 'manager' ? 'st-planned' : 'st-backlog')) + '">' +
          H.esc(Store.ROLE_LABELS[u.role]) + '</span></td>' +
          '<td>' + w.active + (w.overdue ? ' <span class="overdue-mark">(' + w.overdue + ' просроч.)</span>' : '') + '</td>' +
          '<td style="text-align:right;white-space:nowrap">' +
          '<button class="btn btn-ghost btn-sm" data-user-edit="' + u.id + '">Изменить</button> ' +
          '<button class="btn btn-danger btn-sm" data-user-del="' + u.id + '">Удалить</button></td>' +
          '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  function bindUsers(root) {
    var nw = H.qs('#user-new', root);
    if (nw) nw.addEventListener('click', function () { userForm(null); });
    H.qsa('[data-user-edit]', root).forEach(function (b) {
      b.addEventListener('click', function () { userForm(Store.user(b.dataset.userEdit)); });
    });
    H.qsa('[data-user-del]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var u = Store.user(b.dataset.userDel);
        App.confirm('Удалить пользователя?', H.fullName(u) + ' будет удалён, его задачи переназначатся.', function () {
          try { Store.deleteUser(u.id); App.toast('Пользователь удалён', 'ok'); }
          catch (e) { App.toast(e.message, 'err'); }
        });
      });
    });
  }

  function userForm(u) {
    var editing = !!u;
    var cur = u || { firstName: '', lastName: '', position: '', email: '', role: 'employee' };
    var body =
      '<div class="form-error hidden" id="uf-error"></div>' +
      '<div class="form-row">' +
      '<label class="field"><span>Имя <b class="req">*</b></span><input type="text" id="uf-first" value="' + H.esc(cur.firstName) + '"></label>' +
      '<label class="field"><span>Фамилия <b class="req">*</b></span><input type="text" id="uf-last" value="' + H.esc(cur.lastName) + '"></label>' +
      '</div>' +
      '<label class="field"><span>Должность</span><input type="text" id="uf-pos" value="' + H.esc(cur.position) + '" placeholder="Frontend-разработчик"></label>' +
      '<label class="field"><span>Электронная почта <b class="req">*</b></span><input type="email" id="uf-email" value="' + H.esc(cur.email) + '" placeholder="name@nordflow.ru"></label>' +
      '<label class="field"><span>Роль</span><select id="uf-role">' +
      Object.keys(Store.ROLE_LABELS).map(function (r) {
        return '<option value="' + r + '"' + (cur.role === r ? ' selected' : '') + '>' + Store.ROLE_LABELS[r] + '</option>';
      }).join('') + '</select></label>' +
      '<label class="field"><span>' + (editing ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль <b class="req">*</b>') + '</span>' +
      '<input type="text" id="uf-pass" placeholder="минимум 5 символов"></label>';

    App.modal({
      title: editing ? 'Редактирование пользователя' : 'Новый пользователь',
      body: body,
      confirmText: editing ? 'Сохранить' : 'Создать',
      onMount: function (root, close) {
        root.querySelector('.modal-confirm').addEventListener('click', function () {
          var data = {
            firstName: H.qs('#uf-first', root).value.trim(),
            lastName: H.qs('#uf-last', root).value.trim(),
            position: H.qs('#uf-pos', root).value.trim() || 'Сотрудник',
            email: H.qs('#uf-email', root).value.trim(),
            role: H.qs('#uf-role', root).value,
            password: H.qs('#uf-pass', root).value
          };
          var errEl = H.qs('#uf-error', root);
          try {
            if (editing) {
              if (!data.password) delete data.password;
              if (!data.email) throw new Error('Введите почту');
              Store.updateUser(u.id, data);
              App.toast('Пользователь обновлён', 'ok');
            } else {
              if (!data.password || data.password.length < 5) throw new Error('Пароль — минимум 5 символов');
              Store.createUser(data);
              App.toast('Пользователь создан', 'ok');
            }
            close();
          } catch (e) {
            errEl.textContent = e.message;
            errEl.classList.remove('hidden');
          }
        });
      }
    });
  }

  global.VPeople = {
    teamPage: teamPage, bindTeam: bindTeam, memberModal: memberModal,
    settingsPage: settingsPage, bindSettings: bindSettings,
    usersPage: usersPage, bindUsers: bindUsers
  };
})(window);
