/* ========== Задачи: список, доска, карточка, форма ========== */
(function (global) {
  'use strict';

  var filters = { status: '', project: '', priority: '', due: '', overdueOnly: false, q: '', view: 'list' };

  /* ---------- Карточка задачи ---------- */
  function taskCard(t) {
    var over = Store.isOverdue(t);
    var p = Store.project(t.projectId);
    var a = Store.user(t.assigneeId);
    var pr = Store.priority(t.priority);
    var st = Store.status(t.status);
    var comments = (t.comments || []).length;
    var files = (t.attachments || []).length;

    return '<article class="task-card' + (over ? ' is-overdue' : '') + '" draggable="true" data-task-card="' + t.id + '" tabindex="0">' +
      '<div class="key">' + H.esc(t.key) + '</div>' +
      '<div class="tt">' + H.esc(t.title) + '</div>' +
      '<div class="row"><span class="pill plain ' + pr.cls + '">' + pr.label + '</span>' +
      '<span class="pill plain ' + st.cls + '">' + st.label + '</span></div>' +
      '<div class="foot">' +
      H.avatarHTML(a, 'sm') +
      '<span class="' + (over ? 'overdue-mark' : '') + '">' + H.icon('calendar', 13) +
      ' ' + (t.deadline ? H.fmtDate(t.deadline) : 'без срока') + '</span>' +
      '<span class="r">' +
      (comments ? '<span class="mini">' + H.icon('msg', 13) + comments + '</span>' : '') +
      (files ? '<span class="mini">' + H.icon('clip', 13) + files + '</span>' : '') +
      '</span></div>' +
      '<div class="key" style="margin-top:6px;color:var(--text-3);font-weight:500">' + H.esc(p ? p.name : '') + '</div>' +
      '</article>';
  }

  /* ---------- Kanban ---------- */
  function boardHTML(tasks) {
    return '<div class="board" id="board">' + Store.STATUSES.map(function (s) {
      var list = tasks.filter(function (t) { return t.status === s.id; });
      return '<section class="board-col" data-col="' + s.id + '">' +
        '<header class="board-col-head"><span class="pill ' + s.cls + '">' + s.label + '</span>' +
        '<span class="count">' + list.length + '</span></header>' +
        '<div class="board-col-body">' +
        (list.length ? list.map(taskCard).join('') : '<div class="board-empty">Перетащите задачу сюда</div>') +
        '</div></section>';
    }).join('') + '</div>';
  }

  function bindBoard(root) {
    var dragged = null;
    H.qsa('[data-task-card]', root).forEach(function (card) {
      card.addEventListener('dragstart', function (e) {
        dragged = card;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', card.dataset.taskCard); } catch (err) {}
      });
      card.addEventListener('dragend', function () {
        card.classList.remove('dragging');
        H.qsa('.board-col', root).forEach(function (c) { c.classList.remove('drop-over'); });
        dragged = null;
      });
      card.addEventListener('click', function () { location.hash = '#/tasks/' + card.dataset.taskCard; });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') location.hash = '#/tasks/' + card.dataset.taskCard;
      });
    });

    H.qsa('.board-col', root).forEach(function (col) {
      col.addEventListener('dragover', function (e) { e.preventDefault(); col.classList.add('drop-over'); });
      col.addEventListener('dragleave', function () { col.classList.remove('drop-over'); });
      col.addEventListener('drop', function (e) {
        e.preventDefault();
        col.classList.remove('drop-over');
        var id = null;
        try { id = e.dataTransfer.getData('text/plain'); } catch (err) {}
        if (!id && dragged) id = dragged.dataset.taskCard;
        if (!id) return;
        var t = Store.task(id);
        if (!t || t.status === col.dataset.col) return;
        if (!Store.canChangeStatus(t)) { App.toast('Недостаточно прав для смены статуса', 'err'); return; }
        try {
          Store.moveTask(id, col.dataset.col);
          App.toast('Статус изменён: ' + Store.status(col.dataset.col).label, 'ok');
        } catch (err) { App.toast(err.message, 'err'); }
      });
    });
  }

  /* ---------- Фильтры ---------- */
  function applyFilters(list) {
    var q = filters.q.trim().toLowerCase();
    return list.filter(function (t) {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.project && t.projectId !== filters.project) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.overdueOnly && !Store.isOverdue(t)) return false;
      if (filters.due) {
        if (!t.deadline) return false;
        var diff = H.daysDiff(t.deadline);
        if (filters.due === 'overdue' && !Store.isOverdue(t)) return false;
        if (filters.due === 'today' && diff !== 0) return false;
        if (filters.due === 'week' && (diff === null || diff < 0 || diff > 7)) return false;
        if (filters.due === 'month' && (diff === null || diff < 0 || diff > 31)) return false;
      }
      if (q && t.title.toLowerCase().indexOf(q) === -1 && t.key.toLowerCase().indexOf(q) === -1) return false;
      return true;
    }).sort(function (a, b) {
      var ad = a.deadline ? new Date(a.deadline) : null, bd = b.deadline ? new Date(b.deadline) : null;
      if (Store.isOverdue(a) !== Store.isOverdue(b)) return Store.isOverdue(a) ? -1 : 1;
      if (ad && bd) return ad - bd;
      if (ad) return -1;
      if (bd) return 1;
      return 0;
    });
  }

  function filtersHTML(projects) {
    function opts(list, sel, labelFn) {
      return list.map(function (o) {
        return '<option value="' + o.id + '"' + (sel === o.id ? ' selected' : '') + '>' + labelFn(o) + '</option>';
      }).join('');
    }
    return '<div class="filters">' +
      '<label class="field grow"><span>Поиск</span><input type="search" id="f-q" placeholder="Название или номер задачи" value="' + H.esc(filters.q) + '"></label>' +
      '<label class="field"><span>Статус</span><select id="f-status"><option value="">Все</option>' +
      opts(Store.STATUSES, filters.status, function (s) { return s.label; }) + '</select></label>' +
      '<label class="field"><span>Проект</span><select id="f-project"><option value="">Все</option>' +
      opts(projects, filters.project, function (p) { return p.name; }) + '</select></label>' +
      '<label class="field"><span>Приоритет</span><select id="f-priority"><option value="">Все</option>' +
      opts(Store.PRIORITIES, filters.priority, function (p) { return p.label; }) + '</select></label>' +
      '<label class="field"><span>Срок</span><select id="f-due">' +
      '<option value=""' + (filters.due === '' ? ' selected' : '') + '>Любой</option>' +
      '<option value="today"' + (filters.due === 'today' ? ' selected' : '') + '>Сегодня</option>' +
      '<option value="week"' + (filters.due === 'week' ? ' selected' : '') + '>Ближайшая неделя</option>' +
      '<option value="month"' + (filters.due === 'month' ? ' selected' : '') + '>Ближайший месяц</option>' +
      '<option value="overdue"' + (filters.due === 'overdue' ? ' selected' : '') + '>Просроченные</option>' +
      '</select></label>' +
      '<label class="switch" style="margin-bottom:10px"><input type="checkbox" id="f-overdue"' + (filters.overdueOnly ? ' checked' : '') + '>Только просроченные</label>' +
      '<div class="view-toggle" id="f-view">' +
      '<button type="button" data-view="list" class="' + (filters.view === 'list' ? 'active' : '') + '">Список</button>' +
      '<button type="button" data-view="board" class="' + (filters.view === 'board' ? 'active' : '') + '">Доска</button>' +
      '</div></div>';
  }

  function listHTML(tasks) {
    if (!tasks.length) {
      return '<div class="empty"><div class="big">' + H.icon('inbox', 36) + '</div><p>Задачи не найдены</p>' +
        '<p class="small">Измените фильтры или создайте новую задачу</p></div>';
    }
    return '<div class="table-wrap"><table><thead><tr>' +
      '<th>Задача</th><th>Проект</th><th>Статус</th><th>Приоритет</th><th>Срок</th><th>Постановщик</th>' +
      '</tr></thead><tbody>' +
      tasks.map(function (t) {
        var p = Store.project(t.projectId);
        var over = Store.isOverdue(t);
        var st = Store.status(t.status), pr = Store.priority(t.priority);
        return '<tr data-goto-task="' + t.id + '" style="cursor:pointer">' +
          '<td><b>' + H.esc(t.title) + '</b><div class="small muted">' + H.esc(t.key) +
          ((t.comments || []).length ? ' · ' + H.icon('msg', 12) + ' ' + t.comments.length : '') +
          ((t.attachments || []).length ? ' · ' + H.icon('clip', 12) : '') + '</div></td>' +
          '<td>' + H.esc(p ? p.name : '—') + '</td>' +
          '<td><span class="pill ' + st.cls + '">' + st.label + '</span></td>' +
          '<td><span class="pill ' + pr.cls + '">' + pr.label + '</span></td>' +
          '<td class="' + (over ? 'overdue-mark' : '') + '">' + (t.deadline ? H.fmtDate(t.deadline) : '—') + '</td>' +
          '<td>' + H.esc(H.fullName(Store.user(t.reporterId))) + '</td></tr>';
      }).join('') +
      '</tbody></table></div>';
  }

  /* ---------- Раздел «Мои задачи» ---------- */
  function myTasks() {
    var projects = Store.visibleProjects();
    var all = Store.myTasks();
    var tasks = applyFilters(all);

    var html =
      '<div class="page-head"><div><h2>Мои задачи</h2>' +
      '<p class="sub">Всего: ' + all.length + ' · показано: ' + tasks.length + '</p></div>' +
      '<div class="page-actions"><button class="btn btn-cta" data-new-task>' + H.icon('plus') + 'Создать задачу</button></div></div>' +
      filtersHTML(projects) +
      (filters.view === 'board' ? boardHTML(tasks) : listHTML(tasks));
    return html;
  }

  function bindMyTasks(root) {
    bindFilters(root);
    bindBoard(root);
    bindTaskClicks(root);
    var nb = H.qs('[data-new-task]', root);
    if (nb) nb.addEventListener('click', function () { openTaskForm(null); });
  }

  function bindFilters(root) {
    var q = H.qs('#f-q', root);
    if (q) {
      q.addEventListener('input', H.debounce(function () { filters.q = q.value; rerender(); }, 250));
    }
    ['status:status', 'project:project', 'priority:priority', 'due:due'].forEach(function (pair) {
      var parts = pair.split(':');
      var el = H.qs('#f-' + parts[0], root);
      if (el) el.addEventListener('change', function () { filters[parts[1]] = el.value; rerender(); });
    });
    var ov = H.qs('#f-overdue', root);
    if (ov) ov.addEventListener('change', function () { filters.overdueOnly = ov.checked; rerender(); });
    H.qsa('#f-view button', root).forEach(function (b) {
      b.addEventListener('click', function () { filters.view = b.dataset.view; rerender(); });
    });
    function rerender() {
      App.render();
      var q2 = H.qs('#f-q');
      if (q2 && document.activeElement !== q2) {
        q2.focus();
        var v = q2.value; q2.value = ''; q2.value = v;
      }
    }
  }

  function bindTaskClicks(root) {
    H.qsa('[data-goto-task]', root).forEach(function (el) {
      el.addEventListener('click', function () { location.hash = '#/tasks/' + el.dataset.gotoTask; });
    });
    H.qsa('[data-goto-project]', root).forEach(function (el) {
      el.addEventListener('click', function () { location.hash = '#/projects/' + el.dataset.gotoProject; });
    });
  }

  /* ---------- Страница задачи ---------- */
  function propRow(k, v) {
    return '<div class="prop"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>';
  }

  function taskPage(id) {
    var t = Store.task(id);
    if (!t) return '<div class="empty"><div class="big">404</div><p>Задача не найдена</p><a class="btn btn-ghost" href="#/my-tasks">К списку задач</a></div>';
    var p = Store.project(t.projectId);
    if (!p || !Store.canViewProject(p)) {
      return '<div class="empty"><div class="big">' + H.icon('shield', 34) + '</div><p>У вас нет доступа к этой задаче</p>' +
        '<a class="btn btn-ghost" href="#/dashboard">На главную</a></div>';
    }

    var st = Store.status(t.status), pr = Store.priority(t.priority);
    var over = Store.isOverdue(t);
    var canEdit = Store.canEditTask(t);
    var canStatus = Store.canChangeStatus(t);

    var statusControl = canStatus
      ? '<select id="task-status" class="mini-select">' + Store.STATUSES.map(function (s) {
          return '<option value="' + s.id + '"' + (t.status === s.id ? ' selected' : '') + '>' + s.label + '</option>';
        }).join('') + '</select>'
      : '<span class="pill ' + st.cls + '">' + st.label + '</span>';

    var html =
      '<div class="page-head"><div>' +
      '<div class="chips" style="margin-bottom:8px"><a class="task-key" href="#/projects/' + t.projectId + '">' + H.esc(t.key) + '</a>' +
      '<span class="pill ' + pr.cls + '">' + pr.label + '</span>' +
      (over ? '<span class="pill pr-critical">Просрочено</span>' : '') + '</div>' +
      '<h2>' + H.esc(t.title) + '</h2>' +
      '<p class="sub">' + H.esc(p.name) + '</p></div>' +
      '<div class="page-actions">' +
      (canEdit ? '<button class="btn btn-ghost" id="task-edit">' + H.icon('edit') + 'Редактировать</button>' : '') +
      (canEdit || Store.isAdmin() ? '<button class="btn btn-danger" id="task-delete">' + H.icon('trash') + 'Удалить</button>' : '') +
      '</div></div>' +

      '<div class="task-layout">' +
      '<div>' +
      '<div class="card"><h3>Описание</h3>' +
      '<div class="desc-block">' + (t.description ? H.esc(t.description) : '<span class="muted">Описание не заполнено</span>') + '</div>' +
      (t.tags && t.tags.length ? '<div style="margin-top:12px">' + t.tags.map(function (x) { return '<span class="tag">#' + H.esc(x) + '</span>'; }).join('') + '</div>' : '') +
      '</div>' +

      '<div class="card" style="margin-top:16px"><h3>' + H.icon('clip', 17) + ' Вложения и ссылки</h3>' +
      '<div class="attachments" id="attach-list">' + attachHTML(t) + '</div>' +
      '<div class="inline-form" style="margin-top:12px">' +
      '<label class="field"><span>Ссылка</span><input type="url" id="att-url" placeholder="https://..."></label>' +
      '<label class="field"><span>Название</span><input type="text" id="att-name" placeholder="Например, макет"></label>' +
      '<button class="btn btn-ghost" id="att-add-link">Добавить ссылку</button>' +
      '<label class="btn btn-ghost" style="margin:0">Прикрепить файл<input type="file" id="att-file" style="display:none"></label>' +
      '</div></div>' +

      '<div class="card" style="margin-top:16px"><h3>' + H.icon('msg', 17) + ' Комментарии <span class="muted small">(' + (t.comments || []).length + ')</span></h3>' +
      (Store.canComment(t) ? '<div class="comment-form">' + H.avatarHTML(Store.currentUser(), '') +
        '<textarea id="comment-text" placeholder="Напишите комментарий..."></textarea></div>' +
        '<div style="display:flex;justify-content:flex-end;margin-top:8px"><button class="btn btn-primary" id="comment-send">Отправить</button></div>' : '') +
      '<div id="comment-list" style="margin-top:10px">' + commentsHTML(t) + '</div>' +
      '</div>' +
      '</div>' +

      '<div>' +
      '<div class="card"><h3>Свойства</h3><div class="props">' +
      propRow('Статус', statusControl) +
      propRow('Приоритет', '<span class="pill ' + pr.cls + '">' + pr.label + '</span>') +
      propRow('Исполнитель', H.avatarHTML(Store.user(t.assigneeId), 'sm') + H.esc(H.fullName(Store.user(t.assigneeId)))) +
      propRow('Постановщик', H.avatarHTML(Store.user(t.reporterId), 'sm') + H.esc(H.fullName(Store.user(t.reporterId)))) +
      propRow('Проект', '<a href="#/projects/' + t.projectId + '">' + H.esc(p.name) + '</a>') +
      propRow('Создано', H.fmtDateTime(t.createdAt)) +
      propRow('Дедлайн', '<span class="' + (over ? 'overdue-mark' : '') + '">' + (t.deadline ? H.fmtDate(t.deadline) : '—') + '</span>') +
      propRow('Обновлено', H.fmtRel(t.updatedAt)) +
      '</div></div>' +

      '<div class="card" style="margin-top:16px"><h3>' + H.icon('clock', 17) + ' История изменений</h3>' +
      '<ul class="history">' + (t.history || []).slice().reverse().map(function (h) {
        var who = Store.user(h.userId);
        return '<li><span class="when">' + H.fmtRel(h.at) + '</span><span>' +
          H.avatarHTML(who, 'sm') + ' <b>' + H.esc(H.fullName(who)) + '</b> ' + H.esc(h.text) + '</span></li>';
      }).join('') + '</ul></div>' +
      '</div></div>';

    return html;
  }

  function attachHTML(t) {
    if (!t.attachments || !t.attachments.length) {
      return '<p class="small muted">Вложений нет</p>';
    }
    return t.attachments.map(function (a) {
      var inner = a.type === 'link'
        ? H.icon('arrow', 15)
        : H.icon('clip', 15);
      var label = a.type === 'link'
        ? '<a href="' + H.esc(a.url) + '" target="_blank" rel="noopener" class="nm">' + H.esc(a.name) + '</a>'
        : '<span class="nm">' + H.esc(a.name) + '</span>';
      var meta = a.type === 'file' && a.size ? '<span class="small muted">' + Math.round(a.size / 1024) + ' КБ</span>' : '';
      return '<div class="attach">' + inner + label + meta +
        '<button class="icon-btn" data-att-del="' + a.id + '" title="Удалить">' + H.icon('x', 16) + '</button></div>';
    }).join('');
  }

  function commentsHTML(t) {
    var list = (t.comments || []);
    if (!list.length) return '<p class="small muted">Комментариев пока нет — станьте первым.</p>';
    var me = Store.currentUser();
    return list.slice().sort(function (a, b) { return new Date(a.createdAt) - new Date(b.createdAt); }).map(function (c) {
      var a = Store.user(c.authorId);
      var own = c.authorId === me.id;
      var canDel = own || Store.isAdmin();
      return '<div class="comment">' + H.avatarHTML(a) +
        '<div class="body"><div class="head"><span class="nm">' + H.esc(H.fullName(a)) + '</span>' +
        '<span class="pill plain pj-planned">' + H.esc(Store.ROLE_LABELS[a.role]) + '</span>' +
        '<span class="dt">' + H.fmtDateTime(c.createdAt) + (c.editedAt ? ' · изменено' : '') + '</span>' +
        '<span class="spacer"></span>' +
        (own ? '<button class="link-btn" data-c-edit="' + c.id + '">Редактировать</button>' : '') +
        (canDel ? '<button class="link-btn danger" data-c-del="' + c.id + '">Удалить</button>' : '') +
        '</div><div class="txt" data-c-text="' + c.id + '">' + H.esc(c.text) + '</div></div></div>';
    }).join('');
  }

  function bindTaskPage(root, id) {
    var t = Store.task(id);
    if (!t) return;

    var statusSel = H.qs('#task-status', root);
    if (statusSel) statusSel.addEventListener('change', function () {
      try { Store.moveTask(t.id, statusSel.value); App.toast('Статус обновлён', 'ok'); }
      catch (e) { App.toast(e.message, 'err'); }
    });

    var edit = H.qs('#task-edit', root);
    if (edit) edit.addEventListener('click', function () { openTaskForm(t); });

    var del = H.qs('#task-delete', root);
    if (del) del.addEventListener('click', function () {
      App.confirm('Удалить задачу?', 'Задача ' + t.key + ' и её комментарии будут удалены безвозвратно.', function () {
        Store.deleteTask(t.id);
        App.toast('Задача удалена');
        location.hash = '#/projects/' + t.projectId;
      });
    });

    var send = H.qs('#comment-send', root);
    if (send) send.addEventListener('click', function () {
      var ta = H.qs('#comment-text', root);
      try { Store.addComment(t.id, ta.value); ta.value = ''; App.toast('Комментарий добавлен', 'ok'); }
      catch (e) { App.toast(e.message, 'err'); }
    });

    H.qsa('[data-c-del]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        App.confirm('Удалить комментарий?', 'Действие нельзя отменить.', function () {
          try { Store.deleteComment(t.id, b.dataset.cDel); } catch (e) { App.toast(e.message, 'err'); }
        });
      });
    });

    H.qsa('[data-c-edit]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var cid = b.dataset.cEdit;
        var txtEl = H.qs('[data-c-text="' + cid + '"]', root);
        var cur = (t.comments || []).filter(function (c) { return c.id === cid; })[0];
        if (!cur || !txtEl) return;
        if (txtEl.querySelector('textarea')) return;
        txtEl.innerHTML = '<textarea style="width:100%;min-height:80px;padding:8px;border:1px solid var(--border);border-radius:10px;background:var(--surface)"></textarea>' +
          '<div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-primary btn-sm" data-c-save>Сохранить</button>' +
          '<button class="btn btn-ghost btn-sm" data-c-cancel>Отмена</button></div>';
        var ta = txtEl.querySelector('textarea');
        ta.value = cur.text;
        ta.focus();
        txtEl.querySelector('[data-c-save]').addEventListener('click', function () {
          try { Store.updateComment(t.id, cid, ta.value); } catch (e) { App.toast(e.message, 'err'); }
        });
        txtEl.querySelector('[data-c-cancel]').addEventListener('click', function () { App.render(); });
      });
    });

    var addLink = H.qs('#att-add-link', root);
    if (addLink) addLink.addEventListener('click', function () {
      var url = H.qs('#att-url', root).value.trim();
      var name = H.qs('#att-name', root).value.trim() || url;
      if (!url) { App.toast('Введите адрес ссылки', 'err'); return; }
      try { Store.addAttachment(t.id, { type: 'link', name: name, url: url }); App.toast('Ссылка добавлена', 'ok'); }
      catch (e) { App.toast(e.message, 'err'); }
    });

    var file = H.qs('#att-file', root);
    if (file) file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      try {
        Store.addAttachment(t.id, { type: 'file', name: f.name, size: f.size });
        App.toast('Файл прикреплён', 'ok');
      } catch (e) { App.toast(e.message, 'err'); }
      file.value = '';
    });

    H.qsa('[data-att-del]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        try { Store.removeAttachment(t.id, b.dataset.attDel); } catch (e) { App.toast(e.message, 'err'); }
      });
    });
  }

  /* ---------- Форма задачи ---------- */
  function openTaskForm(task, presetProjectId) {
    var editing = !!task;
    var projects = Store.visibleProjects().filter(function (p) {
      if (!editing && !Store.canCreateTask(p)) return false;
      if (editing && !Store.canEditTask(task)) return false;
      return true;
    });
    if (!projects.length) {
      App.toast('Нет проектов, в которых можно создавать задачи', 'err');
      return;
    }
    var current = task || {};
    var pid = current.projectId || presetProjectId || projects[0].id;

    function membersOptions(projectId, selId) {
      var p = Store.project(projectId);
      if (!p) return '';
      return p.memberIds.map(function (id) {
        var u = Store.user(id);
        if (!u) return '';
        return '<option value="' + u.id + '"' + (id === selId ? ' selected' : '') + '>' + H.esc(H.fullName(u)) + ' — ' + H.esc(u.position) + '</option>';
      }).join('');
    }

    var body =
      '<div class="form-error hidden" id="tf-error"></div>' +
      '<label class="field"><span>Название <b class="req">*</b></span>' +
      '<input type="text" id="tf-title" value="' + H.esc(current.title || '') + '" placeholder="Что нужно сделать"></label>' +
      '<label class="field"><span>Подробное описание</span>' +
      '<textarea id="tf-desc" placeholder="Детали, ссылки, критерии готовности">' + H.esc(current.description || '') + '</textarea></label>' +
      '<div class="form-row">' +
      '<label class="field"><span>Проект <b class="req">*</b></span><select id="tf-project">' +
      projects.map(function (p) {
        return '<option value="' + p.id + '"' + (p.id === pid ? ' selected' : '') + '>' + H.esc(p.name) + '</option>';
      }).join('') + '</select></label>' +
      '<label class="field"><span>Статус <b class="req">*</b></span><select id="tf-status">' +
      Store.STATUSES.map(function (s) {
        return '<option value="' + s.id + '"' + ((current.status || 'backlog') === s.id ? ' selected' : '') + '>' + s.label + '</option>';
      }).join('') + '</select></label>' +
      '<label class="field"><span>Исполнитель <b class="req">*</b></span><select id="tf-assignee">' +
      membersOptions(pid, current.assigneeId) + '</select></label>' +
      '<label class="field"><span>Приоритет <b class="req">*</b></span><select id="tf-priority">' +
      Store.PRIORITIES.map(function (p) {
        return '<option value="' + p.id + '"' + ((current.priority || 'medium') === p.id ? ' selected' : '') + '>' + p.label + '</option>';
      }).join('') + '</select></label>' +
      '<label class="field"><span>Дедлайн</span><input type="date" id="tf-deadline" value="' + H.toDateInput(current.deadline) + '"></label>' +
      '<label class="field"><span>Постановщик</span><input type="text" id="tf-reporter" value="' +
      H.esc(H.fullName(Store.user(current.reporterId || Store.currentUser().id))) + '" disabled></label>' +
      '<label class="field"><span>Дата создания</span><input type="text" value="' +
      H.esc(current.createdAt ? H.fmtDateTime(current.createdAt) : H.fmtDateTime(new Date())) + '" disabled></label>' +
      '</div>' +
      '<label class="field"><span>Теги (через запятую)</span>' +
      '<input type="text" id="tf-tags" value="' + H.esc((current.tags || []).join(', ')) + '" placeholder="вёрстка, срочно"></label>';

    App.modal({
      title: editing ? 'Редактирование задачи ' + (task.key || '') : 'Новая задача',
      body: body,
      confirmText: editing ? 'Сохранить' : 'Создать задачу',
      onMount: function (root, close) {
        var projSel = H.qs('#tf-project', root);
        projSel.addEventListener('change', function () {
          var sel = H.qs('#tf-assignee', root);
          sel.innerHTML = membersOptions(projSel.value, null);
        });

        root.querySelector('.modal-confirm').addEventListener('click', function () {
          var data = {
            title: H.qs('#tf-title', root).value,
            description: H.qs('#tf-desc', root).value,
            projectId: projSel.value,
            status: H.qs('#tf-status', root).value,
            assigneeId: H.qs('#tf-assignee', root).value,
            priority: H.qs('#tf-priority', root).value,
            deadline: H.qs('#tf-deadline', root).value ? new Date(H.qs('#tf-deadline', root).value + 'T18:00:00').toISOString() : null,
            tags: H.qs('#tf-tags', root).value.split(',').map(function (s) { return s.trim(); }).filter(Boolean)
          };
          var errEl = H.qs('#tf-error', root);
          try {
            if (editing) {
              Store.updateTask(task.id, data);
              App.toast('Задача сохранена', 'ok');
            } else {
              var t = Store.createTask(data);
              App.toast('Задача ' + t.key + ' создана', 'ok');
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

  global.VTasks = {
    taskCard: taskCard, boardHTML: boardHTML, bindBoard: bindBoard,
    myTasks: myTasks, bindMyTasks: bindMyTasks,
    taskPage: taskPage, bindTaskPage: bindTaskPage, listHTML: listHTML,
    openTaskForm: openTaskForm, bindTaskClicks: bindTaskClicks, applyFilters: applyFilters,
    filters: filters
  };
})(window);
