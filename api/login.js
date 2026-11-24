// POST /api/login — admin parolini tekshirish
const S = require('../lib/store');

module.exports = async function handler(req, res) {
  S.cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (!process.env.ADMIN_PASSWORD) return S.send(res, 500, { error: 'ADMIN_PASSWORD Vercel sozlamalarida belgilanmagan' });
  if (!S.checkPassword(req)) return S.send(res, 401, { error: 'Parol noto‘g‘ri' });
  return S.send(res, 200, { ok: true });
};
