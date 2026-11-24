# Mizon — sayt, admin panel va videolar

| Manzil | Nima |
|---|---|
| `/` | Mizon sayti (o‘zgarmagan) |
| `/admin` | Admin panel — YouTube videolarini qo‘shish, tahrirlash, o‘chirish, tartiblash |
| `/api/videos` | Videolar ro‘yxati (ilova shu yerdan oladi) |
| `/app/mizon-videos.js` | Ilovaga ulanadigan video moduli |

## 1. GitHub’ga yuklash

Shu papkadagi barcha fayllarni `reshford117-max/Islamic-finance` repozitoriyasiga yuklang
(GitHub → repo → **Add file → Upload files** → hammasini sudrab tashlang → **Commit changes**).

## 2. Vercel’ga ulash

1. vercel.com → **Add New… → Project** → `Islamic-finance` repozitoriyasini tanlang → **Deploy**.
2. Loyiha ichida **Storage → Create Database → Upstash (Redis)** → bepul tarifni tanlang → loyihaga ulang.
   Bu `KV_REST_API_URL` va `KV_REST_API_TOKEN` sozlamalarini avtomatik qo‘shadi.
3. **Settings → Environment Variables** → `ADMIN_PASSWORD` nomli o‘zgaruvchi qo‘shing, qiymati — admin paroli
   (kamida 10 belgi, oddiy so‘z bo‘lmasin).
4. **Deployments → Redeploy** (sozlamalar kuchga kirishi uchun).

## 3. Admin panel

`https://SIZNING-SAYT.vercel.app/admin` → parolni kiriting →
YouTube havolasini qo‘ying → bo‘lim va mavzuni tanlang → **Videoni qo‘shish**.

## 4. Ilovaga ulash

Mizon ilovasining HTML faylida eng oxirgi `</body>` dan oldin bitta qator qo‘shing:

```html
<script src="https://SIZNING-SAYT.vercel.app/app/mizon-videos.js"></script>
```

Shundan keyin ilovaning **Menyu → Videolar** va **Video darslar** bo‘limlarida faqat admin panelda qo‘shilgan
YouTube videolari chiqadi: bo‘lim (Islom moliyasi / Iqtisodiyot) va mavzu bo‘yicha guruhlangan.
Videoni bosganda u ilovaning o‘zida to‘liq ekranda ochiladi; «YouTube ilovasida ochish» tugmasi ham bor.
Ilova internet bo‘lmasa, oxirgi yuklangan ro‘yxatni ko‘rsatadi.
