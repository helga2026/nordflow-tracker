/* ========== Проекты ========== */
(function (global) {
  'use strict';

  var tab = 'board';

  function projectsPage() {
    var list = Store.visibleProjects();
    var archived = list.filter(function (p) { return p.status === 'archived'; });
    var active = list.filter(function (p) { return p.status !== 'archived'; });

    var html =
      '<div class="page-head"><div><h2>Проекты</h2>' +
      '<p class="sub">Доступно проектов: ' + list.length + '</p></div>' +
      '<div class="page-actions">' +
      (Store.canCreateProject() ? '<button class="btn btn-cta" id="project-new">' + H.icon('plus') + 'Создать проект</button>' : '') +
      '</div></div>';

    if (!list.length) {
      return html + '<div class="empty"><div class="big">' + H.icon('folder', 36) + '</div>' +
        '<p>Нет доступных проектов</p>' +
        (Store.canCreateProject() ? '<button class="btn btn-cta" id="project-new2">Создать проект</button>' : '') + '</div>';
    }

    function card(p) {
      var st = Store.projectStatus(p.status);
      var tasks = Store.projectTasks(p.id);
      var open = tasks.filter(function (t) { return t.status !== 'done'; }).length;
      var over = tasks.filter(Store.isOverdue).length;
      return '<article class="project-card" data-goto-project="' + p.id + '">' +
        '<div class="top"><h3>' + H.esc(p.name) + '</h3><span class="pill ' + st.cls + '">' + st.label + '</span></div>' +
        '<p class="desc">' + H.esc(p.description || 'Описание отсутствует') + '</p>' +
        '<div class="project-meta">' +
        '<span>Открытых задач: <b>' + open + '</b>' + (over ? ' <span class="overdue-mark">(' + over + ' просроч.)</span>' : '') + '</span>' +
        '<span>Участников: <b>' + p.memberIds.length + '</b></span>' +
        '</div>' +
        '<div class="project-foot">' +
        '<span class="avatar-stack">' + p.memberIds.slice(0, 5).map(function (id) { return H.avatarHTML(Store.user(id), 'sm'); }).join('') + '</span>' +
        '<span class="small muted">Рук.: ' + H.esc(H.fullName(Store.user(p.leaderId))) + '</span>' +
        '<span class="spacer"></span>' +
        '<span class="small ' + (p.endDate && new Date(p.endDate) < new Date() && p.status !== 'done' ? 'overdue-mark' : 'muted') + '">' +
        H.icon('calendar', 13) + ' ' + (p.endDate ? 'до ' + H.fmtDate(p.endDate) : 'без срока') + '</span>' +
        '</div></article>';
    }

    html += '<div class="grid grid-3">' + active.map(card).join('') + '</div>';
    if (archived.length) {
      html += '<div class="section-title"><h3>Архив</h3></div><div class="grid grid-3">' + archived.map(card).join('') + '</div>';
    }
    return html;
  }

  function bindProjects(root) {
    VTasks.bindTaskClicks(root);
    ['project-new', 'project-new2'].forEach(function (id) {
      var b = H.qs('#' + id, root);
      if (b) b.addEventListener('click', function () { openProjectForm(null); });
    });
  }

  /* ---------- Форма проекта ---------- */
  function openProjectForm(project) {
    var editing = !!project;
    if (!editing && !Store.canCreateProject()) { App.toast('Недостаточно прав', 'err'); return; }
    if (editing && !Store.canManageProject(project)) { App.toast('Недостаточно прав', 'err'); return; }

    var users = Store.users();
    var isAdmin_ = Store.isAdmin();
    var current = project || {
      name: '', description: '', leaderId: isAdmin_ ? Store.currentUser().id : Store.currentUser().id,
      memberIds: [Store.currentUser().id], startDate: new Date().toISOString(),
      endDate: '', status: 'planned', allowEmployeeCreateTasks: true
    };

    var body =
      '<div class="form-error hidden" id="pf-error"></div>' +
      '<label class="field"><span>Название проекта <b class="req">*</b></span>' +
      '<input type="text" id="pf-name" value="' + H.esc(current.name) + '" placeholder="Например, Разработка сайта"></label>' +
      '<label class="field"><span>Описание</span>' +
      '<textarea id="pf-desc" placeholder="Кратко о задачах проекта">' + H.esc(current.description) + '</textarea></label>' +
      '<div class="form-row">' +
      '<label class="field"><span>Руководитель проекта <b class="req">*</b></span><select id="pf-leader"' + (isAdmin_ ? '' : ' disabled') + '>' +
      users.filter(function (u) { return u.role !== 'employee' || isAdmin_; }).map(function (u) {
        return '<option value="' + u.id + '"' + (u.id === current.leaderId ? ' selected' : '') + '>' +
          H.esc(H.fullName(u)) + ' — ' + H.esc(Store.ROLE_LABELS[u.role]) + '</option>';
      }).join('') + '</select></label>' +
      '<label class="field"><span>Статус' + (isAdmin_ ? ' <b class="req">*</b>' : '') + '</span><select id="pf-status"' + (isAdmin_ ? '' : ' disabled') + '>' +
      Store.PROJECT_STATUSES.map(function (s) {
        if (!isAdmin_ && s.id === 'archived') return '';
        return '<option value="' + s.id + '"' + ((current.status || 'planned') === s.id ? ' selected' : '') + '>' + s.label + '</option>';
      }).join('') + '</select></label>' +
      '<label class="field"><span>Дата начала</span><input type="date" id="pf-start" value="' + H.toDateInput(current.startDate) + '"' + (isAdmin_ ? '' : ' disabled') + '></label>' +
      '<label class="field"><span>Плановая дата завершения</span><input type="date" id="pf-end" value="' + H.toDateInput(current.endDate) + '"' + (isAdmin_ ? '' : ' disabled') + '></label>' +
      '</div>' +
      '<div class="field"><span>Участники</span><div class="checks" id="pf-members">' +
      users.map(function (u) {
        var checked = (current.memberIds || []).indexOf(u.id) !== -1;
        return '<label><input type="checkbox" value="' + u.id + '"' + (checked ? ' checked' : '') + '>' +
          H.avatarHTML(u, 'sm') + H.esc(H.fullName(u)) + '</label>';
      }).join('') + '</div></div>' +
      '<label class="switch"><input type="checkbox" id="pf-empcreate"' + (current.allowEmployeeCreateTasks ? ' checked' : '') + '>' +
      'Разрешить сотрудникам создавать задачи в проекте</label>';

    App.modal({
      title: editing ? 'Редактирование проекта' : 'Создание проекта',
      body: body,
      confirmText: editing ? 'Сохранить' : 'Создать',
      onMount: function (root, close) {
        root.querySelector('.modal-confirm').addEventListener('click', function () {
          var memberIds = H.qsa('#pf-members input:checked', root).map(function (i) { return i.value; });
          var data = {
            name: H.qs('#pf-name', root).value,
            description: H.qs('#pf-desc', root).value,
            leaderId: H.qs('#pf-leader', root).value,
            memberIds: memberIds,
            status: H.qs('#pf-status', root).value,
            startDate: H.qs('#pf-start', root).value ? new Date(H.qs('#pf-start', root).value + 'T10:00:00').toISOString() : null,
            endDate: H.qs('#pf-end', root).value ? new Date(H.qs('#pf-end', root).value + 'T18:00:00').toISOString() : null,
            allowEmployeeCreateTasks: H.qs('#pf-empcreate', root).checked
          };
          var errEl = H.qs('#pf-error', root);
          try {
            if (editing) {
              Store.updateProject(project.id, data);
              App.toast('Проект обновлён', 'ok');
            } else {
              var p = Store.createProject(data);
              App.toast('Проект создан', 'ok');
              close();
              location.hash = '#/projects/' + p.id;
              return;
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

  /* ---------- Страница проекта ---------- */
  function projectPage(id) {
    var p = Store.project(id);
    if (!p) return '<div class="empty"><div class="big">404</div><p>Проект не найден</p><a class="btn btn-ghost" href="#/projects">К проектам</a></div>';
    if (!Store.canViewProject(p)) {
      return '<div class="empty"><div class="big">' + H.icon('shield', 34) + '</div>' +
        '<p>У вас нет доступа к этому проекту</p><a class="btn btn-ghost" href="#/projects">К проектам</a></div>';
    }

    var st = Store.projectStatus(p.status);
    var tasks = Store.projectTasks(p.id);
    var canCreate = Store.canCreateTask(p);
    var canManage = Store.canManageProject(p);

    var html =
      '<div class="page-head"><div>' +
      '<div class="chips" style="margin-bottom:8px"><span class="pill ' + st.cls + '">' + st.label + '</span>' +
      (p.endDate ? '<span class="pill plain pj-planned">' + H.icon('calendar', 13) + ' до ' + H.fmtDate(p.endDate) + '</span>' : '') + '</div>' +
      '<h2>' + H.esc(p.name) + '</h2>' +
      '<p class="sub">Руководитель: ' + H.esc(H.fullName(Store.user(p.leaderId))) + ' · участников: ' + p.memberIds.length + '</p></div>' +
      '<div class="page-actions">' +
        (canCreate ? '<button class="btn btn-cta" data-new-task>' + H.icon('plus') + 'Создать задачу</button>' : '') +
      (canManage ? '<button class="btn btn-ghost" id="project-edit">' + H.icon('edit') + 'Редактировать</button>' : '') +
      (Store.isAdmin() ? '<button class="btn btn-ghost" id="project-archive">' + H.icon('archive') +
        (p.status === 'archived' ? 'Разархивировать' : 'Архивировать') + '</button>' : '') +
      '</div></div>' +

      '<div class="tabs" id="project-tabs">' +
      '<button data-tab="board" class="' + (tab === 'board' ? 'active' : '') + '">Доска</button>' +
      '<button data-tab="list" class="' + (tab === 'list' ? 'active' : '') + '">Список задач (' + tasks.length + ')</button>' +
      '<button data-tab="members" class="' + (tab === 'members' ? 'active' : '') + '">Участники</button>' +
      '<button data-tab="info" class="' + (tab === 'info' ? 'active' : '') + '">Информация о проекте</button>' +
      '</div><div id="tab-content"></div>';

    return html;
  }

  function renderTab(root, p) {
    var box = H.qs('#tab-content', root);
    var tasks = Store.projectTasks(p.id);
    if (tab === 'board') {
      box.innerHTML = VTasks.boardHTML(tasks);
      VTasks.bindBoard(box);
    } else if (tab === 'list') {
      box.innerHTML = VTasks.listHTML(tasks.slice().sort(function (a, b) {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }));
      VTasks.bindTaskClicks(box);
    } else if (tab === 'members') {
      box.innerHTML = membersHTML(p);
      bindMembers(root, box, p);
    } else {
      box.innerHTML = infoHTML(p);
      bindInfo(root, p);
    }
  }

  function membersHTML(p) {
    var rows = p.memberIds.map(function (id) {
      var u = Store.user(id);
      if (!u) return '';
      var w = Store.workload(id);
      var lead = p.leaderId === id;
      return '<div class="member-card" data-member="' + u.id + '">' + H.avatarHTML(u, 'lg') +
        '<div class="info"><div class="nm">' + H.esc(H.fullName(u)) +
        (lead ? ' <span class="pill plain pj-active">Руководитель</span>' : '') + '</div>' +
        '<div class="ps">' + H.esc(u.position) + ' · ' + H.esc(Store.ROLE_LABELS[u.role]) + '</div>' +
        '<div class="em">' + H.esc(u.email) + '</div>' +
        '<div class="load"><div class="load-bar"><i class="' + w.cls + '" style="width:' + w.pct + '%"></i></div>' +
        '<div class="load-txt"><span>Загрузка: ' + w.active + ' активных задач</span><span>' + w.pct + '%' +
        (w.overdue ? ' · <b class="overdue-mark">' + w.overdue + ' просроч.</b>' : '') + '</span></div></div></div>' +
        (!lead && Store.canManageProject(p) ? '<button class="icon-btn" data-member-del="' + u.id + '" title="Исключить">' + H.icon('x') + '</button>' : '') +
        '</div>';
    }).join('');

    var canAdd = Store.canManageProject(p);
    var rest = Store.users().filter(function (u) { return p.memberIds.indexOf(u.id) === -1; });

    return '<div class="grid grid-2">' + rows + '</div>' +
      (canAdd && rest.length ? '<div class="card" style="margin-top:16px"><h3>Добавить участника</h3>' +
        '<div class="inline-form"><label class="field"><span>Сотрудник</span><select id="member-add">' +
        rest.map(function (u) { return '<option value="' + u.id + '">' + H.esc(H.fullName(u)) + ' — ' + H.esc(u.position) + '</option>'; }).join('') +
        '</select></label><button class="btn btn-primary" id="member-add-btn">Добавить</button></div></div>' : '');
  }

  function bindMembers(root, box, p) {
    var add = H.qs('#member-add-btn', box);
    if (add) add.addEventListener('click', function () {
      var id = H.qs('#member-add', box).value;
      try {
        Store.updateProject(p.id, { memberIds: p.memberIds.concat([id]) });
        App.toast('Участник добавлен', 'ok');
      } catch (e) { App.toast(e.message, 'err'); }
    });
    H.qsa('[data-member-del]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.dataset.memberDel;
        App.confirm('Исключить участника?', H.fullName(Store.user(id)) + ' потеряет доступ к проекту.', function () {
          try {
            Store.updateProject(p.id, { memberIds: p.memberIds.filter(function (m) { return m !== id; }) });
            App.toast('Участник исключён', 'ok');
          } catch (e) { App.toast(e.message, 'err'); }
        });
      });
    });
    H.qsa('[data-member]', box).forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('[data-member-del]')) return;
        VPeople.memberModal(el.dataset.member, p.id);
      });
    });
  }

  function infoHTML(p) {
    var tasks = Store.projectTasks(p.id);
    var done = tasks.filter(function (t) { return t.status === 'done'; }).length;
    var over = tasks.filter(Store.isOverdue).length;
    var st = Store.projectStatus(p.status);
    return '<div class="grid grid-2">' +
      '<div class="card"><h3>Описание</h3><div class="desc-block">' +
      (p.description ? H.esc(p.description) : '<span class="muted">Описание не заполнено</span>') + '</div>' +
      '<div style="margin-top:14px">' +
      '<div class="kv-row"><span class="k">Статус</span><span class="pill ' + st.cls + '">' + st.label + '</span></div>' +
      '<div class="kv-row"><span class="k">Руководитель</span><b>' + H.esc(H.fullName(Store.user(p.leaderId))) + '</b></div>' +
      '<div class="kv-row"><span class="k">Дата начала</span><span>' + (p.startDate ? H.fmtDate(p.startDate) : '—') + '</span></div>' +
      '<div class="kv-row"><span class="k">Плановое завершение</span><span class="' + (p.endDate && new Date(p.endDate) < new Date() ? 'overdue-mark' : '') + '">' +
      (p.endDate ? H.fmtDate(p.endDate) : '—') + '</span></div>' +
      '<div class="kv-row"><span class="k">Создано</span><span>' + H.fmtDate(p.createdAt) + '</span></div>' +
      '<div class="kv-row"><span class="k">Создание задач сотрудниками</span><span>' + (p.allowEmployeeCreateTasks ? 'разрешено' : 'запрещено') + '</span></div>' +
      '</div></div>' +
      '<div class="card"><h3>Прогресс</h3>' +
      '<div class="kv-row"><span class="k">Всего задач</span><b>' + tasks.length + '</b></div>' +
      '<div class="kv-row"><span class="k">Выполнено</span><b>' + done + '</b></div>' +
      '<div class="kv-row"><span class="k">Просрочено</span><b class="' + (over ? 'overdue-mark' : '') + '">' + over + '</b></div>' +
      '<div class="kv-row"><span class="k">Участников</span><b>' + p.memberIds.length + '</b></div>' +
      '<div class="load" style="margin-top:14px"><div class="load-bar">' +
      '<i style="width:' + (tasks.length ? Math.round(done / tasks.length * 100) : 0) + '%"></i></div>' +
      '<div class="load-txt"><span>Выполнение</span><span>' + (tasks.length ? Math.round(done / tasks.length * 100) : 0) + '%</span></div></div>' +
      '</div></div>';
  }

  function bindInfo(root, p) {}

  function bindProjectPage(root, id) {
    var p = Store.project(id);
    if (!p) return;
    var content = H.qs('#tab-content', root);
    renderTab(root, p);

    H.qsa('#project-tabs button', root).forEach(function (b) {
      b.addEventListener('click', function () {
        tab = b.dataset.tab;
        H.qsa('#project-tabs button', root).forEach(function (x) { x.classList.toggle('active', x === b); });
        renderTab(root, p);
      });
    });

    var edit = H.qs('#project-edit', root);
    if (edit) edit.addEventListener('click', function () { openProjectForm(p); });

    var arch = H.qs('#project-archive', root);
    if (arch) arch.addEventListener('click', function () {
      App.confirm(p.status === 'archived' ? 'Разархивировать проект?' : 'Архивировать проект?',
        p.status === 'archived' ? 'Проект снова станет активным.' : 'Проект переместится в архив.',
        function () {
          try { Store.archiveProject(p.id); App.toast('Готово', 'ok'); }
          catch (e) { App.toast(e.message, 'err'); }
        });
    });

    var nt = H.qs('[data-new-task]', root);
    if (nt) nt.addEventListener('click', function () { VTasks.openTaskForm(null, p.id); });

    if (content) VTasks.bindTaskClicks(content);
  }

  global.VProjects = {
    projectsPage: projectsPage, bindProjects: bindProjects,
    projectPage: projectPage, bindProjectPage: bindProjectPage,
    openProjectForm: openProjectForm,
    setTab: function (t) { tab = t; },
    getTab: function () { return tab; }
  };
})(window);
