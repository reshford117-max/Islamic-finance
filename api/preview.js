// GET /api/preview?url=...  — admin panel uchun: havoladan video nomi va rasmini olish
const S = require('../lib/store');

module.exports = async function handler(req, res) {
  S.cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (!S.checkPassword(req)) return S.send(res, 401, { error: 'Parol noto‘g‘ri' });
  const url = (req.query && req.query.url) || new URL(req.url, 'http://x').searchParams.get('url');
  const yt = S.youtubeId(url);
  if (!yt) return S.send(res, 400, { error: 'YouTube havolasi noto‘g‘ri' });
  const info = await S.youtubeInfo(yt);
  return S.send(res, 200, { yt, title: info ? info.title : '', author: info ? info.author : '' });
};
