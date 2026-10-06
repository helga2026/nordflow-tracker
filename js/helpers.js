/* ========== Вспомогательные функции ========== */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function toDate(v) { return v instanceof Date ? v : new Date(v); }

  function fmtDate(v) {
    if (!v) return '—';
    var d = toDate(v);
    return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  function fmtDateTime(v) {
    if (!v) return '—';
    var d = toDate(v);
    return fmtDate(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function fmtRel(v) {
    var d = toDate(v), now = new Date(), diff = (now - d) / 1000;
    if (diff < 60) return 'только что';
    if (diff < 3600) return Math.floor(diff / 60) + ' мин назад';
    if (diff < 86400) return Math.floor(diff / 3600) + ' ч назад';
    if (diff < 604800) return Math.floor(diff / 86400) + ' дн назад';
    return fmtDate(d);
  }

  function startOfDay(d) { var x = toDate(d); x.setHours(0, 0, 0, 0); return x; }
  function endOfDay(d) { var x = toDate(d); x.setHours(23, 59, 59, 999); return x; }

  function daysDiff(v) {
    if (!v) return null;
    return Math.round((startOfDay(v) - startOfDay(new Date())) / 86400000);
  }

  function toDateInput(v) {
    if (!v) return '';
    var d = toDate(v);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function initials(user) {
    if (!user) return '?';
    return ((user.firstName || '')[0] || '') + ((user.lastName || '')[0] || '');
  }

  function fullName(user) {
    if (!user) return 'Не назначен';
    return (user.firstName + ' ' + user.lastName).trim();
  }

  function avatarHTML(user, cls) {
    cls = cls || '';
    if (!user) return '<span class="avatar ' + cls + '">?</span>';
    if (user.avatar) return '<span class="avatar ' + cls + '"><img src="' + user.avatar + '" alt="' + esc(fullName(user)) + '"></span>';
    return '<span class="avatar ' + cls + '" title="' + esc(fullName(user)) + '">' + esc(initials(user).toUpperCase()) + '</span>';
  }

  var ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    check: '<path d="M9 11.5 11 14l4.5-5"/><rect x="3.5" y="3.5" width="17" height="17" rx="4"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.5a3 3 0 0 1 0 5.6M17.5 14.6c2 .8 3.5 2.6 3.5 5.4"/>',
    bell: '<path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.9 19.4l-.1.1A2 2 0 1 1 5 16.7l.1-.1A1.6 1.6 0 0 0 4 13.9H4a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 5.2 7.2l-.1-.1A2 2 0 1 1 7.9 4.3l.1.1a1.6 1.6 0 0 0 1.8.3H10a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1A2 2 0 1 1 20.6 7l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    shield: '<path d="M12 3 5 6v5.5c0 4.3 3 8.1 7 9.5 4-1.4 7-5.2 7-9.5V6z"/><path d="M9.5 12.2l1.8 1.8 3.5-3.7"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    moon: '<path d="M20 14.5A8.2 8.2 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="m4 4 16 16"/><path d="M9.9 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.3 4.1M6.4 7.9A16.7 16.7 0 0 0 2.5 12S6 18.5 12 18.5c1 0 1.9-.2 2.7-.5"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>',
    msg: '<path d="M21 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.6A8 8 0 1 1 21 11.5z"/>',
    clip: '<path d="M20 11.5 12.3 19a4.6 4.6 0 0 1-6.5-6.5l7.9-7.8a3 3 0 1 1 4.3 4.3l-7.9 7.8a1.5 1.5 0 0 1-2.1-2.1l7.2-7.2"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 8 6 12l4 4M6 12h9"/>',
    edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m14.5 6.5 3 3"/>',
    trash: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/><path d="M10 11v5M14 11v5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    flag: '<path d="M6 21V4M6 4h11l-2 3.5L17 11H6"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>',
    brief: '<rect x="3.5" y="7.5" width="17" height="12" rx="2.5"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17"/>',
    bolt: '<path d="M13 3 5 13.5h6L11 21l8-10.5h-6z"/>',
    inbox: '<path d="M3.5 13h4l1.5 3h6l1.5-3h4"/><path d="M5.6 5.5h12.8l3.1 7.5v5a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2v-5z"/>',
    archive: '<rect x="3.5" y="4.5" width="17" height="4.5" rx="1.5"/><path d="M5 9v9.5A2 2 0 0 0 7 20.5h10a2 2 0 0 0 2-2V9M10 13h4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    check2: '<path d="m5 12.5 4.5 4.5L19 7"/>'
  };

  function icon(name, size) {
    var p = ICONS[name] || '';
    size = size || 20;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  function hydrateIcons(root) {
    (root || document).querySelectorAll('[data-ico]').forEach(function (n) {
      if (n.dataset.done) return;
      n.innerHTML = icon(n.dataset.ico);
      n.dataset.done = '1';
    });
  }

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms || 200);
    };
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  global.H = {
    esc: esc, uid: uid, pad: pad, fmtDate: fmtDate, fmtDateTime: fmtDateTime, fmtRel: fmtRel,
    daysDiff: daysDiff, toDateInput: toDateInput, startOfDay: startOfDay, endOfDay: endOfDay,
    initials: initials, fullName: fullName, avatarHTML: avatarHTML, icon: icon, hydrateIcons: hydrateIcons,
    plural: plural, qs: qs, qsa: qsa, debounce: debounce, clone: clone, toDate: toDate
  };
})(window);
