/* ========== Экран входа ========== */
(function (global) {
  'use strict';

  function renderDemoAccounts() {
    var ul = H.qs('#demo-accounts');
    if (!ul) return;
    var samples = [
      { role: 'Администратор', i: 0 },
      { role: 'Руководитель проекта', i: 1 },
      { role: 'Сотрудник', i: 3 }
    ];
    ul.innerHTML = samples.map(function (s) {
      var u = Store.state().users[s.i];
      if (!u) return '';
      return '<li data-email="' + H.esc(u.email) + '" data-pass="' + H.esc(u.password) + '">' +
        '<b>' + H.esc(u.role === 'admin' ? 'Админ' : (u.role === 'manager' ? 'Рук' : 'Сотр')) + '</b>' +
        '<span>' + H.esc(u.position) + '</span>' +
        '<code>' + H.esc(u.email) + '</code><code>' + H.esc(u.password) + '</code></li>';
    }).join('');
    H.qsa('#demo-accounts li').forEach(function (li) {
      li.addEventListener('click', function () {
        H.qs('#login-email').value = li.dataset.email;
        H.qs('#login-password').value = li.dataset.pass;
        H.qs('#login-error').classList.add('hidden');
      });
    });
  }

  function init() {
    var toggle = H.qs('#toggle-password');
    var pass = H.qs('#login-password');
    toggle.innerHTML = H.icon('eye');
    toggle.addEventListener('click', function () {
      var show = pass.type === 'password';
      pass.type = show ? 'text' : 'password';
      toggle.innerHTML = H.icon(show ? 'eyeOff' : 'eye');
      toggle.title = show ? 'Скрыть пароль' : 'Показать пароль';
    });

    H.qs('#login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = H.qs('#login-email').value;
      var password = H.qs('#login-password').value;
      var err = H.qs('#login-error');
      var user = Store.login(email, password);
      if (!user) {
        err.textContent = 'Неверная электронная почта или пароль';
        err.classList.remove('hidden');
        return;
      }
      err.classList.add('hidden');
      global.App.enterApp();
    });
  }

  function show() {
    renderDemoAccounts();
    H.qs('#login-screen').classList.remove('hidden');
    H.qs('#app').classList.add('hidden');
    H.qs('#login-error').classList.add('hidden');
    H.qs('#login-form').reset();
    H.qs('#toggle-password').innerHTML = H.icon('eye');
    H.qs('#login-password').type = 'password';
  }

  function hide() {
    H.qs('#login-screen').classList.add('hidden');
    H.qs('#app').classList.remove('hidden');
  }

  global.VAuth = { init: init, show: show, hide: hide, renderDemoAccounts: renderDemoAccounts };
})(window);
