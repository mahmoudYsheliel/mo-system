// Lightweight Navbar utility
// Usage options:
//   1) Auto-mount: Add <div id="navbar"></div> anywhere and include this script
//   2) Manual: window.Navbar.init({ mount: HTMLElement, pageName, fullName, avatarUrl, onSettings, onLogout, onNotifications })
// If no mount is provided and no #navbar exists, the bar is prepended to <body>.

(function(){
  function ensureStyles(){
    if(document.getElementById('navbar-base-styles')) return;
    const style = document.createElement('style');
    style.id = 'navbar-base-styles';
    style.textContent = `
      .nb-root{position:sticky;top:0;z-index:1000;background:#ffffff;border-bottom:1px solid #e5e7eb}
      .nb-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:10px 16px}
      .nb-left{font-weight:700;color:#111827}
      .nb-right{display:flex;align-items:center;gap:10px}
      .nb-icon-btn{background:#ffffff;border:1px solid #e5e7eb;width:34px;height:34px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
      .nb-icon-btn:hover{background:#f9fafb}
      .nb-avatar-btn{display:inline-flex;align-items:center;gap:8px;background:#ffffff;border:1px solid #e5e7eb;border-radius:999px;padding:4px 6px;cursor:pointer}
      .nb-avatar-btn:hover{background:#f9fafb}
      .nb-caret{display:inline-flex;width:16px;height:16px;color:#6b7280}
      .nb-avatar{width:28px;height:28px;border-radius:999px;object-fit:cover;background:#e5e7eb;display:block}
      .nb-dd{position:absolute;right:0;top:calc(100% + 8px);background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;min-width:260px;box-shadow:0 12px 30px rgba(0,0,0,.12);padding:8px;display:none}
      .nb-dd.open{display:block}
      .nb-dd-header{display:flex;align-items:center;gap:12px;padding:10px 10px}
      .nb-dd-name{font-weight:700;color:#111827;font-size:14px}
      .nb-dd-sub{color:#6b7280;font-size:12px}
      .nb-sep{height:1px;background:#e5e7eb;margin:6px 0}
      .nb-dd-item{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;cursor:pointer;color:#111827}
      .nb-dd-item:hover{background:#f3f4f6}
      .nb-ic{display:inline-flex;width:18px;height:18px;color:#6b7280}
      .nb-rel{position:relative}
      .nb-badge{position:absolute;top:-4px;right:-4px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:#ef4444;color:#ffffff;font-size:10px;line-height:16px;text-align:center;border:2px solid #ffffff}
      .nb-notifs{max-height:340px;overflow:auto}
      .nb-note{display:flex;flex-direction:column;gap:2px;padding:8px;border-radius:8px;cursor:pointer}
      .nb-note:hover{background:#f3f4f6}
      .nb-note-row{display:flex;align-items:flex-start;gap:10px}
      .nb-note-avatar{width:28px;height:28px;border-radius:999px;object-fit:cover;background:#e5e7eb;flex:0 0 auto}
      .nb-note-col{display:flex;flex-direction:column;gap:2px;min-width:0}
      .nb-note-name{font-size:13px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .nb-note-body{font-size:12px;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px}
      .nb-empty{font-size:12px;color:#6b7280;padding:8px;text-align:center}
    `;
    document.head.appendChild(style);
  }

  function createSvgBell(){
    const span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
    return span;
  }

  function el(html){
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function mountNavbar(opts){
    ensureStyles();
    const options = opts || {};
    const pageName = options.pageName || document.querySelector('meta[name="page"]')?.getAttribute('content') || document.title || location.pathname.replace(/^.*\//,'') || 'Page';
    const fullName = options.fullName || 'Account Name';
    const avatarUrl = options.avatarUrl || '';
    let notifications = Array.isArray(options.notifications) ? options.notifications.slice() : [];

    const root = el('<div class="nb-root"><div class="nb-inner"></div></div>');
    const inner = root.firstElementChild;

    const left = el('<div class="nb-left"></div>');
    left.textContent = pageName;

    const right = el('<div class="nb-right"></div>');

    // Notification button
    const notifWrap = el('<div class="nb-rel"></div>');
    const notifBtn = el('<button class="nb-icon-btn" type="button" aria-label="Notifications"></button>');
    notifBtn.appendChild(createSvgBell());
    const notifBadge = el('<span class="nb-badge" hidden>0</span>');
    const notifDd = el('<div class="nb-dd" role="menu" aria-label="Notifications"></div>');

    function unseenCount(){ return notifications.filter(function(n){ return !n || n.seen ? false : true; }).length; }
    function updateNotifBadge(){
      const c = unseenCount();
      if(c > 0){
        notifBadge.textContent = String(c > 99 ? '99+' : c);
        notifBadge.hidden = false;
      } else {
        notifBadge.hidden = true;
      }
    }
    function renderNotifications(){
      notifDd.innerHTML = '';
      const header = el('<div class="nb-dd-header" style="justify-content:space-between;width:100%"></div>');
      const title = el('<div class="nb-dd-name">Notifications</div>');
      const clearBtn = el('<button class="nb-icon-btn" title="Mark all as seen" aria-label="Mark all as seen" style="width:auto;height:auto;padding:4px 8px;border-radius:8px">Mark all</button>');
      clearBtn.addEventListener('click', function(){ markAllSeen(); closeNotifMenu(); });
      header.appendChild(title);
      header.appendChild(clearBtn);
      notifDd.appendChild(header);
      notifDd.appendChild(el('<div class="nb-sep"></div>'));

      if(!notifications.length){
        notifDd.appendChild(el('<div class="nb-empty">No notifications</div>'));
      } else {
        const list = el('<div class="nb-notifs"></div>');
        notifications.forEach(function(n){
          const item = el('<div class="nb-note" role="menuitem" tabindex="0"></div>');
          const row = el('<div class="nb-note-row"></div>');
          const avatar = document.createElement('img');
          avatar.className = 'nb-note-avatar';
          if(n && n.senderAvatar){
            avatar.src = n.senderAvatar;
            avatar.alt = n.senderName || 'Sender';
          } else {
            const letter = ((n && (n.senderName || n.title)) || 'N').trim().charAt(0).toUpperCase();
            avatar.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI, Arial" font-size="12" fill="#6b7280">${letter}</text></svg>`);
            avatar.alt = 'Sender';
          }
          const col = el('<div class="nb-note-col"></div>');
          const name = el('<div class="nb-note-name"></div>');
          const body = el('<div class="nb-note-body"></div>');
          name.textContent = (n && (n.senderName || n.title)) || 'Notification';
          body.textContent = n && n.body ? n.body : '';
          if(!n || n.seen){ item.style.opacity = '0.7'; }
          col.appendChild(name);
          col.appendChild(body);
          row.appendChild(avatar);
          row.appendChild(col);
          item.appendChild(row);
          item.addEventListener('click', function(){
            if(n) n.seen = true;
            updateNotifBadge();
            if(typeof options.onNotificationClick === 'function') options.onNotificationClick(n);
            closeNotifMenu();
          });
          list.appendChild(item);
        });
        notifDd.appendChild(list);
      }
    }
    function openNotifMenu(){ closeAccountMenu(); renderNotifications(); notifDd.classList.add('open'); notifBtn.setAttribute('aria-expanded','true'); if(typeof options.onNotifications === 'function') options.onNotifications(); markAllSeen(); }
    function closeNotifMenu(){ notifDd.classList.remove('open'); notifBtn.setAttribute('aria-expanded','false'); }
    function toggleNotifMenu(){ if(notifDd.classList.contains('open')) closeNotifMenu(); else openNotifMenu(); }
    function markAllSeen(){
      var changed = false;
      notifications.forEach(function(n){ if(n && !n.seen){ n.seen = true; changed = true; } });
      if(changed) updateNotifBadge();
    }
    notifBtn.addEventListener('click', toggleNotifMenu);

    notifWrap.appendChild(notifBtn);
    notifWrap.appendChild(notifBadge);
    notifWrap.appendChild(notifDd);

    // Avatar and dropdown
    const avatarBtn = el('<button class="nb-avatar-btn" type="button" aria-haspopup="menu" aria-expanded="false"></button>');
    const avatarImg = document.createElement('img');
    avatarImg.className = 'nb-avatar';
    if(avatarUrl){ avatarImg.src = avatarUrl; avatarImg.alt = fullName; }
    else { avatarImg.alt = fullName; avatarImg.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI, Arial" font-size="12" fill="#6b7280">${(fullName||'A').trim().charAt(0).toUpperCase()}</text></svg>`); }
    const avatarName = el('<span style="font-size:13px;color:#374151;max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></span>');
    const caret = el('<span class="nb-caret" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"/></svg></span>');
    avatarName.textContent = fullName;
    avatarBtn.appendChild(avatarImg);
    avatarBtn.appendChild(avatarName);
    avatarBtn.appendChild(caret);

    const dd = el('<div class="nb-dd" role="menu" aria-label="Account menu"></div>');
    const ddHeader = el('<div class="nb-dd-header"></div>');
    const ddAvatar = avatarImg.cloneNode(true);
    const ddName = el('<div style="display:flex;flex-direction:column;gap:2px"></div>');
    const ddNameTop = el('<div class="nb-dd-name"></div>');
    const ddNameSub = el('<div class="nb-dd-sub">' + (fullName || '') + '</div>');
    ddNameTop.textContent = 'Account';
    ddName.appendChild(ddNameTop);
    ddName.appendChild(ddNameSub);
    ddHeader.appendChild(ddAvatar);
    ddHeader.appendChild(ddName);
    const sep = el('<div class="nb-sep"></div>');
    const itemSettings = el('<div class="nb-dd-item" role="menuitem" tabindex="0"></div>');
    itemSettings.innerHTML = '<span class="nb-ic" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 20.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.4 15a1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 3.4 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 3.6a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09c0 .67.39 1.28 1 1.51a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.47.45-.6 1.14-.33 1.82.27.68.99 1.13 1.73 1.13H22a2 2 0 1 1 0 4h-.09c-.74 0-1.46.45-1.73 1.13z"></path></svg></span><span>Settings</span>';
    const itemLogout = el('<div class="nb-dd-item" role="menuitem" tabindex="0"></div>');
    itemLogout.innerHTML = '<span class="nb-ic" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></span><span>Logout</span>';
    itemSettings.addEventListener('click', function(){ closeMenu(); if(typeof options.onSettings === 'function') options.onSettings(); });
    itemLogout.addEventListener('click', function(){ closeMenu(); if(typeof options.onLogout === 'function') options.onLogout(); });
    dd.appendChild(ddHeader);
    dd.appendChild(sep);
    dd.appendChild(itemSettings);
    dd.appendChild(itemLogout);

    function openMenu(){ closeNotifMenu(); dd.classList.add('open'); avatarBtn.setAttribute('aria-expanded','true'); }
    function closeMenu(){ dd.classList.remove('open'); avatarBtn.setAttribute('aria-expanded','false'); }
    function toggleMenu(){ if(dd.classList.contains('open')) closeMenu(); else openMenu(); }

    avatarBtn.addEventListener('click', toggleMenu);
    document.addEventListener('click', function(e){
      if(!dd.classList.contains('open')) return;
      const target = e.target;
      if(!right.contains(target)) closeMenu();
    });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeMenu(); });

    updateNotifBadge();
    right.appendChild(notifWrap);
    right.appendChild(avatarBtn);
    right.appendChild(dd);
    inner.appendChild(left);
    inner.appendChild(right);

    const mountPoint = options.mount || document.getElementById('navbar');
    if(mountPoint){
      mountPoint.innerHTML = '';
      mountPoint.appendChild(root);
    } else {
      document.body.prepend(root);
    }

    // Expose small runtime API for notifications updates
    window.Navbar.setNotifications = function(list){
      notifications = Array.isArray(list) ? list.slice() : [];
      updateNotifBadge();
    };
    window.Navbar.markAllNotificationsSeen = function(){ markAllSeen(); };

    return root;
  }

  window.Navbar = {
    init: mountNavbar
  };

  // Auto-mount if #navbar exists
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      const el = document.getElementById('navbar');
      if(el) window.Navbar.init({ mount: el });
    });
  } else {
    const el = document.getElementById('navbar');
    if(el) window.Navbar.init({ mount: el });
  }
})();


