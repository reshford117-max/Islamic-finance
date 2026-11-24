/*
 * Mizon — YouTube videolari moduli
 * Ilovaga ulash: ilova HTML faylining eng oxiriga (</body> dan oldin) shu qatorni qo'shing:
 *   <script src="https://SIZNING-SAYT.vercel.app/app/mizon-videos.js"></script>
 * Videolar admin panelda (/admin) qo'shiladi va ilovaning "Videolar" bo'limida chiqadi.
 */
(function () {
  'use strict';
  var me = document.currentScript;
  var API = (window.MIZON_API || (me && me.src ? new URL(me.src).origin : '')).replace(/\/$/, '');
  var CACHE = 'mizon-yt-videos';
  var data = null, loading = false, failed = false;

  try { var c = localStorage.getItem(CACHE); if (c) data = JSON.parse(c); } catch (e) {}

  function load(force) {
    if (loading || (data && !force && load.done)) return;
    loading = true;
    fetch(API + '/api/videos', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        data = j.videos || []; failed = false; load.done = true;
        try { localStorage.setItem(CACHE, JSON.stringify(data)); } catch (e) {}
      })
      .catch(function () { failed = true; })
      .then(function () { loading = false; refresh(); });
  }

  function refresh() {
    if (typeof state === 'undefined' || typeof render !== 'function') return;
    if (state.view === 'videos' || (state.view === 'list' && state.type === 'videos') || state.view === 'topic') {
      var y = window.scrollY; render(); window.scrollTo(0, y);
    }
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function topicName(sec, id) {
    if (id === 'umumiy' || !id) { try { return secName(sec); } catch (e) { return sec === 'eco' ? 'Iqtisodiyot' : 'Islom moliyasi'; } }
    try { var tp = (TOPICS[sec] || []).filter(function (x) { return x.id === id; })[0]; return tp ? tr(tp.n) : ''; } catch (e) { return ''; }
  }
  function L(uz, ru, en) { try { return [uz, ru, en][LANGS.indexOf(lang)] || uz; } catch (e) { return uz; } }

  var PLAYI = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';

  function card(v) {
    return '<button class="vcard myt" data-act="ytplay" data-y="' + esc(v.yt) + '" data-t="' + esc(v.title) + '" data-s="' + esc(topicName(v.sec, v.tp) || v.tpName || '') + '">' +
      '<span class="thumb ' + (v.sec === 'eco' ? 'eco' : 'isl') + ' myt-th"><img src="https://i.ytimg.com/vi/' + esc(v.yt) + '/hqdefault.jpg" alt="" loading="lazy" onerror="this.remove()">' +
      '<span class="play">' + PLAYI + '</span></span>' +
      '<b>' + esc(v.title) + '</b><small>' + esc(topicName(v.sec, v.tp) || v.tpName || v.author || '') + '</small></button>';
  }

  function statusBox() {
    if (data && data.length) return '';
    if (!data && (loading || !failed)) return '<div class="myt-load">' + L('Videolar yuklanmoqda…', 'Загрузка видео…', 'Loading videos…') + '</div>';
    if (failed && !data) return '<div class="empty">' + L('Videolarni yuklab bo‘lmadi. Internetni tekshiring.', 'Не удалось загрузить видео. Проверьте интернет.', 'Could not load videos. Check your connection.') + '</div>';
    return '<div class="empty">' + L('Hozircha video qo‘shilmagan.', 'Видео пока не добавлены.', 'No videos yet.') + '</div>';
  }

  function grouped(sec, onlyTopic) {
    var list = (data || []).filter(function (v) { return v.sec === sec && (!onlyTopic || v.tp === onlyTopic); });
    if (!list.length) return '';
    var order = ['umumiy', '_'].concat((TOPICS[sec] || []).map(function (t) { return t.id; }));
    var groups = {};
    list.forEach(function (v) { (groups[v.tp || '_'] = groups[v.tp || '_'] || []).push(v); });
    var keys = Object.keys(groups).sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b); return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
    return keys.map(function (k) {
      var name = topicName(sec, k) || groups[k][0].tpName || L('Boshqa videolar', 'Другие видео', 'Other videos');
      return '<div class="sechead"><h2>' + esc(name) + '</h2></div><div class="rail">' + groups[k].map(card).join('') + '</div>';
    }).join('');
  }

  // Menyu → Videolar
  window.videosView = function () {
    load();
    var s = state.vseg === 'eco' ? 'eco' : 'isl';
    var h = backBar(t('vd_title')) + '<p class="lead" style="margin:0 0 10px">' + t('vd_lead') + '</p>' +
      '<div class="seg"><button data-act="vseg" data-s="isl" aria-pressed="' + (s === 'isl') + '">' + secName('isl') + '</button>' +
      '<button data-act="vseg" data-s="eco" aria-pressed="' + (s === 'eco') + '">' + secName('eco') + '</button></div>';
    var body = grouped(s);
    if (!body && data && data.length) body = '<div class="empty">' + L('Bu bo‘limda hozircha video yo‘q.', 'В этом разделе пока нет видео.', 'No videos in this section yet.') + '</div>';
    return h + statusBox() + body;
  };

  // Bo'lim → "Video darslar"
  var _list = window.listView;
  window.listView = function (s, ty) {
    if (ty !== 'videos') return _list.apply(this, arguments);
    load();
    var h = backBar(t('t_videos')) + '<p class="lead" style="margin:0 0 10px">' + secName(s) + '</p>';
    return h + statusBox() + (grouped(s) || (data && data.length ? '<div class="empty">' + L('Bu bo‘limda hozircha video yo‘q.', 'В этом разделе пока нет видео.', 'No videos in this section yet.') + '</div>' : ''));
  };

  // Mavzu sahifasi: shu mavzuga tegishli videolar
  var _topic = window.topicView;
  window.topicView = function (s, id) {
    load();
    var h = _topic.apply(this, arguments);
    var v = grouped(s, id);
    if (v) h += '<div class="label">' + t('t_videos') + '</div>' + v.replace(/<div class="sechead">[\s\S]*?<\/div>/, '');
    return h;
  };

  // Video ijrochisi (to'liq ekran oyna)
  function openPlayer(id, title, sub) {
    closePlayer();
    var o = document.createElement('div');
    o.id = 'mytp'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', title || 'Video');
    var src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&playsinline=1&modestbranding=1';
    o.innerHTML =
      '<div class="mytp-top"><button type="button" class="mytp-x" aria-label="' + L('Yopish', 'Закрыть', 'Close') + '">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<span>' + L('Videolar', 'Видео', 'Videos') + '</span></div>' +
      '<div class="mytp-frame"><iframe src="' + src + '" title="' + esc(title) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>' +
      '<div class="mytp-info">' + (sub ? '<span class="mytp-tp">' + esc(sub) + '</span>' : '') + '<h2>' + esc(title) + '</h2>' +
      '<a class="mytp-yt" href="https://www.youtube.com/watch?v=' + encodeURIComponent(id) + '" target="_blank" rel="noopener">' +
      L('YouTube ilovasida ochish', 'Открыть в YouTube', 'Open in YouTube') + '</a></div>';
    document.body.appendChild(o);
    document.documentElement.style.overflow = 'hidden';
    o.querySelector('.mytp-x').addEventListener('click', closePlayer);
    o.querySelector('.mytp-x').focus();
    history.pushState && history.pushState({ mytp: 1 }, '');
  }
  function closePlayer() {
    var o = document.getElementById('mytp');
    if (o) { o.remove(); document.documentElement.style.overflow = ''; }
  }
  window.addEventListener('popstate', function () { closePlayer(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePlayer(); });

  var _pa = window.profileAct;
  window.profileAct = function (a, el) {
    if (a === 'ytplay') { openPlayer(el.dataset.y, el.dataset.t, el.dataset.s); return true; }
    return _pa.apply(this, arguments);
  };

  var css = document.createElement('style');
  css.textContent =
    '.vcard.myt{display:block;text-align:left;padding:0;background:none;border:0}' +
    '.myt-th{display:grid}.myt-th img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}' +
    '.myt-th .play{z-index:1}' +
    '.myt-load{padding:28px 12px;text-align:center;color:var(--muted)}' +
    '#mytp{position:fixed;inset:0;z-index:2000;background:#06140F;color:#fff;display:flex;flex-direction:column;overflow:auto;padding:env(safe-area-inset-top,0) 0 env(safe-area-inset-bottom,0)}' +
    '.mytp-top{display:flex;align-items:center;gap:10px;padding:12px 14px;font-weight:600}' +
    '.mytp-x{width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,.12);color:#fff;display:grid;place-items:center}' +
    '.mytp-frame{position:relative;width:100%;aspect-ratio:16/9;background:#000}' +
    '.mytp-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}' +
    '.mytp-info{padding:16px 18px 28px;max-width:720px}' +
    '.mytp-tp{display:inline-block;font-size:12px;font-weight:700;color:#0A4F3A;background:#BCE6D0;border-radius:999px;padding:3px 10px}' +
    '.mytp-info h2{font-size:20px;line-height:1.3;margin:10px 0 16px;color:#fff}' +
    '.mytp-yt{display:inline-flex;align-items:center;min-height:44px;padding:10px 16px;border-radius:12px;border:1.5px solid rgba(255,255,255,.35);color:#fff;text-decoration:none;font-weight:600}';
  document.head.appendChild(css);

  load(true);
  if (typeof render === 'function' && typeof state !== 'undefined') refresh();
})();
