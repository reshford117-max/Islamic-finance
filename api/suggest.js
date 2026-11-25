// POST /api/suggest — saytdagi "Takliflar" shakli: bazaga saqlaydi va email'ga yuboradi
// GET  /api/suggest — admin panel uchun takliflar ro'yxati (admin paroli kerak)
const S = require('../lib/store');

const KEY = 'mizon:suggestions';
const TO = process.env.SUGGEST_EMAIL || 'reshford117@gmail.com';

function clean(v, max) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max); }

module.exports = async function handler(req, res) {
  S.cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }

  try {
    if (req.method === 'GET') {
      if (!S.checkPassword(req)) return S.send(res, 401, { error: 'Parol noto‘g‘ri' });
      const raw = await S.redis(['LRANGE', KEY, '0', '199']);
      const list = (raw || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
      return S.send(res, 200, { suggestions: list });
    }

    if (req.method !== 'POST') return S.send(res, 405, { error: 'Ruxsat etilmagan so‘rov' });

    const b = await S.readBody(req);
    if (b.website) return S.send(res, 200, { ok: true }); // spam-bot tuzog'i
    const message = String(b.message || '').trim().slice(0, 3000);
    if (message.length < 5) return S.send(res, 400, { error: 'Taklifingizni yozing' });
    const name = clean(b.name, 80), contact = clean(b.contact, 120);

    // bitta manzildan soatiga ko'pi bilan 5 ta taklif
    const ip = clean((req.headers['x-forwarded-for'] || '').split(',')[0] || 'x', 60);
    const rk = 'mizon:rl:' + ip + ':' + new Date().toISOString().slice(0, 13);
    const n = await S.redis(['INCR', rk]);
    if (n === 1) await S.redis(['EXPIRE', rk, '3600']);
    if (n > 5) return S.send(res, 429, { error: 'Juda ko‘p urinish. Birozdan keyin qayta yuboring.' });

    const item = { id: Date.now().toString(36), name, contact, message, at: new Date().toISOString() };
    await S.redis(['LPUSH', KEY, JSON.stringify(item)]);
    await S.redis(['LTRIM', KEY, '0', '999']);

    let mailed = false;
    try {
      const host = req.headers.host ? 'https://' + req.headers.host : '';
      const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(TO), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: host, Referer: host + '/' },
        body: JSON.stringify({
          _subject: 'Islom moliyasi — yangi taklif',
          _template: 'table',
          _captcha: 'false',
          Ism: name || '—',
          Aloqa: contact || '—',
          Taklif: message
        })
      });
      mailed = r.ok;
    } catch (e) { mailed = false; }

    return S.send(res, 200, { ok: true, mailed });
  } catch (e) {
    return S.send(res, 500, { error: e.message || 'Server xatosi' });
  }
};
