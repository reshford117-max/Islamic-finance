// GET    /api/videos            — barcha videolar (ilova uchun, ochiq)
// POST   /api/videos            — yangi video qo'shish        (admin paroli kerak)
// PUT    /api/videos            — tahrirlash yoki tartiblash   (admin paroli kerak)
// DELETE /api/videos?id=...     — o'chirish                   (admin paroli kerak)
const S = require('../lib/store');

const SECTIONS = ['isl', 'eco'];

module.exports = async function handler(req, res) {
  S.cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }

  try {
    if (req.method === 'GET') {
      const list = await S.readVideos();
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300');
      return S.send(res, 200, { videos: list });
    }

    if (!S.checkPassword(req)) return S.send(res, 401, { error: 'Parol noto‘g‘ri' });
    const body = await S.readBody(req);
    let list = await S.readVideos();

    if (req.method === 'POST') {
      const yt = S.youtubeId(body.url || body.yt);
      if (!yt) return S.send(res, 400, { error: 'YouTube havolasi noto‘g‘ri' });
      if (list.some(v => v.yt === yt && v.tp === body.tp)) return S.send(res, 409, { error: 'Bu video shu mavzuda allaqachon bor' });
      const info = await S.youtubeInfo(yt);
      const video = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        yt,
        title: String(body.title || (info && info.title) || 'Video').slice(0, 200),
        author: (info && info.author) || '',
        sec: SECTIONS.includes(body.sec) ? body.sec : 'isl',
        tp: String(body.tp || '').slice(0, 60),
        tpName: String(body.tpName || '').slice(0, 80),
        createdAt: new Date().toISOString()
      };
      list.unshift(video);
      await S.writeVideos(list);
      return S.send(res, 201, { video, videos: list });
    }

    if (req.method === 'PUT') {
      if (Array.isArray(body.order)) {
        const byId = new Map(list.map(v => [v.id, v]));
        const next = body.order.map(id => byId.get(id)).filter(Boolean);
        list.forEach(v => { if (!body.order.includes(v.id)) next.push(v); });
        list = next;
      } else {
        const v = list.find(x => x.id === body.id);
        if (!v) return S.send(res, 404, { error: 'Video topilmadi' });
        if (body.title != null) v.title = String(body.title).slice(0, 200);
        if (SECTIONS.includes(body.sec)) v.sec = body.sec;
        if (body.tp != null) v.tp = String(body.tp).slice(0, 60);
        if (body.tpName != null) v.tpName = String(body.tpName).slice(0, 80);
      }
      await S.writeVideos(list);
      return S.send(res, 200, { videos: list });
    }

    if (req.method === 'DELETE') {
      const id = (req.query && req.query.id) || new URL(req.url, 'http://x').searchParams.get('id') || body.id;
      const next = list.filter(v => v.id !== id);
      if (next.length === list.length) return S.send(res, 404, { error: 'Video topilmadi' });
      await S.writeVideos(next);
      return S.send(res, 200, { videos: next });
    }

    return S.send(res, 405, { error: 'Ruxsat etilmagan so‘rov' });
  } catch (e) {
    return S.send(res, 500, { error: e.message || 'Server xatosi' });
  }
};
