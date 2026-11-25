// Mizon — videolar ombori (Upstash Redis, REST orqali, qo'shimcha paketsiz)
// Vercel'da Upstash Redis ulanganda KV_REST_API_URL va KV_REST_API_TOKEN avtomatik qo'shiladi.
const crypto = require('crypto');

const KEY = 'mizon:videos';

function redisConf() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Baza ulanmagan: Vercel sozlamalarida Upstash Redis ni ulang.');
  return { url, token };
}

async function redis(cmd) {
  const { url, token } = redisConf();
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || ('Redis xatosi: ' + r.status));
  return j.result;
}

async function readVideos() {
  const raw = await redis(['GET', KEY]);
  if (!raw) return [];
  try { const a = JSON.parse(raw); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}

async function writeVideos(list) {
  await redis(['SET', KEY, JSON.stringify(list)]);
}

// YouTube havolasidan 11 belgili video ID ni ajratib olish
function youtubeId(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  let u;
  try { u = new URL(s.startsWith('http') ? s : 'https://' + s); } catch (e) { return null; }
  const host = u.hostname.replace(/^www\.|^m\.|^music\./, '');
  let id = null;
  if (host === 'youtu.be') id = u.pathname.split('/')[1];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.searchParams.get('v')) id = u.searchParams.get('v');
    else {
      const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/);
      if (m) id = m[1];
    }
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

async function youtubeInfo(id) {
  try {
    const r = await fetch('https://www.youtube.com/oembed?format=json&url=' +
      encodeURIComponent('https://www.youtube.com/watch?v=' + id));
    if (!r.ok) return null;
    const j = await r.json();
    return { title: j.title || '', author: j.author_name || '' };
  } catch (e) { return null; }
}

function checkPassword(req) {
  const want = String(process.env.ADMIN_PASSWORD || '').trim();
  const got = String(req.headers['x-admin-password'] || '').trim();
  if (!want) return false;
  const a = crypto.createHash('sha256').update(got).digest();
  const b = crypto.createHash('sha256').update(want).digest();
  return crypto.timingSafeEqual(a, b);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch (e) { return {}; }
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-password');
}

module.exports = { redis, readVideos, writeVideos, youtubeId, youtubeInfo, checkPassword, readBody, send, cors };
