# PROGRESS.md — PayPulse

## B. HAZIRKI VƏZİYYƏT

**İndi nə üzərində işlənir:** Bu tapşırıq **tamamlandı** (dinamik Radar + PayPulse). `npm run build` uğurlu.

**Ən son tamamlanan addım:** `buildRadarInsights(payments)` Radar data mənbəyidir; header/title PayPulse.

**Yarımçıq qalan iş:** Yoxdur (bu tapşırıq üçün). `RadarSection` UI dəyişməyib. `mockInsights` `lib/mock-data.ts`-də qalıb, artıq oxunmur.

**Növbəti addımlar (istəyə bağlı):**
1. Dashboard-da ödəniş əlavə/sil — Radar kartları `useMemo` ilə yenilənməlidir.
2. `getWeeklySummary` hələ stub-dur.

**Radar qaydaları (`lib/radar.ts` → `buildRadarInsights`):**
1. Deadline: `daysUntil(nextDate) <= 14` (sigorta/`isDeadline` → «bitir», digər → «ödənilir»). N<=3 `urgent`, else `warning`.
2. Duplicate abunə: Netflix+YouTube Premium (YouTube Music çıxılır); Spotify+YouTube Music. 2+ item, illik qənaət = cəm − max.
3. 30 gün: 5×7 günlük pəncərə, ən böyük cəm; `count>=2` və ya cəm>=200 AZN → «Bu həftə X AZN lazım olacaq» (`forecast`).
4. Növbəti 7 gün: unikal gün sayı + ödəniş sayı + cəm (`forecast`).
5. `dashboard.tsx`: `const insights = useMemo(() => buildRadarInsights(payments), [payments])`.

**Ən son tamamlanan addım:** `getOccurrences` geriyə occurrence yaratmır; `addDrafts` təsdiq pəncərəsinin `nextDate`-ini olduğu kimi yazır. `npm run build` uğurlu.

**Tapılan səbəb:** `addDrafts` tarixi əvəz etmirdi. «Növbəti 7 gün» (`HeroSummary`) `getOccurrences(payments, today, in7)` istifadə edir; `k=-24` ilə `nextDate=2026-11-09` üçün `k=-1` → 2026-10-09 həftə kartına və təqvimə düşürdü. Siyahı `p.nextDate` oxuyur (eyni sahə). Radar `insights` mock-dur, ödəniş `nextDate` oxumur.

**Yarımçıq qalan iş:** Yoxdur (bu tapşırıq üçün).

**Növbəti addımlar (istəyə bağlı):**
1. Əlavə et → aylıq, təsdiqdə 09.11.2026 → siyahıda 9 noyabr, «Növbəti 7 gün»-də olmamalı.
2. `getWeeklySummary` hələ stub-dur.

**`nextDueDate` davranışı (`lib/api.ts`):**
- `repeat === 'once'` və ya `date > today` → eyni ISO qayıdır.
- `monthly` / `yearly` və `date <= today` → +1 ay / +1 il (ayın son günü clamp), `date > today` olana qədər (maks 120 addım).
- Çağırılır: `mapParseItems`, `fallbackParseText`, `fallbackParseQuick`. Mock receipt/Bolt nümunələri artıq gələcəkdir, toxunulmayıb.

**Qısa texniki xülasə (növbəti AI üçün):**
- `lib/gemini.ts` — `generateGeminiJson(parts)`; açar yalnız `process.env.GEMINI_API_KEY`; URL `gemini-2.5-flash:generateContent`; `generationConfig.responseMimeType = application/json`, `temperature: 0.1`. Şəkil part: `{ inline_data: { mime_type, data } }`.
- `app/api/parse/route.ts` POST body: `{ text?, imageBase64?, mimeType? }`. Cavab `{ items }` — hər item-ə `crypto.randomUUID()` `id`.
- `app/api/cancel/route.ts` POST body: `{ name, amount, category }`. Cavab `{ steps, letter }`.
- `lib/api.ts`: `parseText`/`parseQuick` → POST `/api/parse` `{ text }`; `parseReceipt` faylı `btoa` chunk-ları ilə base64 edib `{ imageBase64, mimeType }`; `generateCancelHelp` → POST `/api/cancel`. Uğursuz HTTP/şəbəkə → köhnə mock (`fallbackParseText` və s.). Boş `items` xəta sayılmır (UI "tapılmadı" göstərir).
- Client `PaymentDraft` qaytarır (`name, amount, category, nextDate, repeat`). Dashboard təsdiqdə ayrıca `id` verir.
- UI komponentləri və `lib/mock-data.ts` tipləri dəyişməyib.

---

## A. Layihə haqqında

**Məqsəd:** Azərbaycanca UI — ödənişlər, abunələr, kommunal, kredit, sığorta/sənəd son tarixləri, ləğv köməkçisi. İstifadəçi SMS/qəbz/sürətli mətnlə ödəniş əlavə edir; AI tanıyır.

**Əsas tələblər (bu tapşırıq):**
- Ayrı backend server yoxdur; yalnız Next.js Route Handler.
- Gemini 2.5 Flash REST: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
- `generationConfig`: `{ responseMimeType: "application/json", temperature: 0.1 }`
- Şəkil varsa `inline_data` part.
- Promptlar Azərbaycanca.
- API açarı yalnız serverdə `process.env.GEMINI_API_KEY`.
- Mövcud tipləri və UI komponentlərini dəyişmə.
- Xəta olsa köhnə mock cavaba fallback.
- Sonda `npm run build`.

**Texnologiyalar:** Next.js 16.4 App Router, React 19, TypeScript, Tailwind 4, pnpm (`packageManager`: pnpm@12.3.4). Skriptlər: `npm run dev` / `npm run build` / `npm run start` (və ya pnpm eyni skriptlər).

**Qovluq (əsas):**
- `app/` — `page.tsx`, `layout.tsx`, `globals.css`; API yox idi.
- `components/dashboard/` — UI (dəyişmə).
- `lib/api.ts` — client API stub-ları.
- `lib/mock-data.ts` — `CategoryId`, `Repeat`, `Payment`, `PaymentDraft`.
- `lib/format.ts` — `CATEGORIES` label-ləri (Abunələr, Telekom, …).
- `.env.local` — gitignore-dadır (`.env*.local`).

**Kateqoriya map (Gemini label → `CategoryId`):**
- Abunələr → `abune`
- Telekom → `telekom`
- Kommunal → `kommunal`
- Kredit → `kredit`
- Sığorta və sənədlər → `sigorta`
- Müqavilələr → `muqavile`

**Repeat map:** aylıq → `monthly`, illik → `yearly`, birdəfəlik → `once`.

**Gemini item sahələri:** `name`, `amount` (AZN), `date` (YYYY-MM-DD) → `PaymentDraft.nextDate`, `category`, `repeat`.

**UI qaydası:** `parse*` `PaymentDraft[]` qaytarır; unikal `id` dashboard-da `crypto.randomUUID()` ilə təsdiqdə verilir (`components/dashboard/dashboard.tsx`). Adapterdə də id generasiya oluna bilər, amma `PaymentDraft` tipinə `id` əlavə edilməməlidir.

**Vacib qaydalar:**
- UI və mövcud tipləri dəyişmə.
- Şifrə/API açarını PROGRESS.md-yə yazma.
- Browser ilə UI dəyişikliyi yoxlanmalıdır; bu tapşırıq backend + client fetch-dir; build mütləqdir.

---

## C. İş jurnalı

### 2026-10-09 ~15:21 — Dinamik Radar + PayPulse
- **Nə / niyə:** Radar mock mətnləri `payments` state-indən hesablanmalı idi; sayt adı PayPulse.
- **Yaradıldı/dəyişdi:**
  - `/Users/turan/Desktop/vaxt-and-pul-web-app/lib/radar.ts` — `buildRadarInsights` (deadline, duplicate cütlər, 30 gün yükü, növbəti 7 gün). AI yoxdur.
  - `/Users/turan/Desktop/vaxt-and-pul-web-app/components/dashboard/dashboard.tsx` — `useMemo(() => buildRadarInsights(payments), [payments])`; `RadarSection` eyni qalıb.
  - `/Users/turan/Desktop/vaxt-and-pul-web-app/components/dashboard/app-header.tsx` — «PayPulse».
  - `/Users/turan/Desktop/vaxt-and-pul-web-app/app/layout.tsx` — `title: PayPulse — ödənişlər və son tarixlər`.
- **Qərar:** Duplicate: YouTube Premium video qrupunda (Netflix ilə), YouTube Music musiqi qrupunda (Spotify ilə) — əvvəlki kod YouTube Premium-u Spotify ilə də cütləyirdi.
- **Build:** `npm run build` exit 0.


### 2026-10-09 ~15:00 — Təsdiqdən sonra köhnə tarix
- **Nə tapıldı:** Təsdiq `d.nextDate`-i dəyişmirdi. «Növbəti 7 gün» `getOccurrences`-də `k=-24`-dən geriyə gedirdi → növbəti ayın ödənişi bu gün kimi görünürdü.
- **Dəyişdi:**
  - `/Users/turan/Desktop/vaxt-and-pul-web-app/lib/format.ts` — `getOccurrences` döngüsü `k = 0` (yalnız `nextDate` və sonrası).
  - `/Users/turan/Desktop/vaxt-and-pul-web-app/components/dashboard/dashboard.tsx` — `addDrafts`/`savePayment` `nextDate: d.nextDate` açıq map (yenidən hesab yox).
- **Radar:** `mockInsights`, ödəniş `nextDate` oxumur. Siyahı və həftə kartı eyni `nextDate` / ondan törəmə occurrence.
- **Build:** `npm run build` exit 0.

### 2026-10-09 ~14:28 — nextDueDate post-process
- **Nə / niyə:** Mətndəki tarix tez-tez artıq ödənilmiş gündür; UI növbəti ödənişi göstərməlidir.
- **Dəyişdi:**
  - `/Users/turan/Desktop/vaxt-and-pul-web-app/lib/api.ts` — `nextDueDate`, `addCalendarMonths`; `mapParseItems` və fallback parse `nextDate`-i bu helperdən keçirir. `parseISO` `format.ts`-dən import.
  - `/Users/turan/Desktop/vaxt-and-pul-web-app/app/api/parse/route.ts` — date qaydasına: "Mətndəki tarix adətən ödənişin edildiyi gündür; təkrarlanan ödənişlər üçün növbəti ödəniş tarixini hesabla."
- **Qərar:** Döngü şərtı `date <= today` (bu gün də irəli çəkilir), nəticə ciddi şəkildə bu gündən sonra. Gələcək tarix və `once` dəyişmir. Gemini gələcək növbəti tarix versə, ikinci dəfə irəli çəkilmir.

### 2026-10-09 ~14:20 — Parse prompt və fallback name təmizliyi
- **Nə / niyə:** Gemini və fallback bəzən `name`-ə "60azn 9 oktyabr" kimi məbləğ/tarix qoyurdu. Prompt dəqiqləşdirildi; fallback `cleanPaymentName` ilə təmizlənir.
- **Dəyişdi:**
  - `/Users/turan/Desktop/vaxt-and-pul-web-app/app/api/parse/route.ts` — `PARSE_PROMPT`: qısa ad qadağaları, kateqoriya (idman/kirayə/üzvlük → Müqavilələr və s.), few-shot `Borodo Gym 60azn 9 oktyabr 2026`.
  - `/Users/turan/Desktop/vaxt-and-pul-web-app/lib/api.ts` — `cleanPaymentName`; `fallbackParseText`/`fallbackParseQuick`; `mapParseItems` də eyni təmizliyi Gemini nəticəsinə tətbiq edir; `parseAzDate` il və ISO/dotted tarix; `gym|üzvlük` → `muqavile`.
- **Müşahidə:** `npm run dev` zamanı `POST /api/parse 500` olmuşdu — client fallback işləyir, ona görə name təmizliyi fallback-də vacibdir.
- **Qərar:** UI dəyişmədi.

### 2026-10-09 ~14:11 UTC — npm install + build uğurlu
- **Nə / niyə:** İlk `npm run build` `next: command not found` verdi çünki `node_modules` yox idi. `npm install` (393 paket) sonra `npm run build` exit 0.
- **Dəyişdi:** `node_modules/` (gitignore), lockfile npm tərəfindən yaranmış ola bilər.
- **Nəticə:** Compiled successfully. Dynamic: `/api/parse`, `/api/cancel`. Typecheck skip (`next.config.mjs` `typescript.ignoreBuildErrors: true` — əvvəldən belə idi).
- **Qeyd:** `.env.local` build zamanı oxunur; açar dəyəri placeholder ola bilər — runtime Gemini çağırışı fail olsa client fallback edir.

### 2026-10-09 ~14:20 — Gemini route-ları və client adapter
- **Nə / niyə:** Ayrı server olmadan Gemini parse/cancel. UI eyni qaldı.
- **Yaradıldı:**
  - `/Users/turan/Desktop/vaxt-and-pul-web-app/lib/gemini.ts`
  - `/Users/turan/Desktop/vaxt-and-pul-web-app/app/api/parse/route.ts`
  - `/Users/turan/Desktop/vaxt-and-pul-web-app/app/api/cancel/route.ts`
- **Dəyişdi:** `/Users/turan/Desktop/vaxt-and-pul-web-app/lib/api.ts` — stub-lar `fetch` + `fallbackParse*` / `fallbackCancelHelp`. `getWeeklySummary` mock qaldı.
- **Qərarlar:**
  - Shared helper `lib/gemini.ts` (açar yalnız server env).
  - Fallback yalnız `catch`-də (şəbəkə/HTTP xətası); boş `items` mock-a düşmür.
  - Kateqoriya/repeat Azərbaycan label → `CategoryId`/`Repeat`; `date` → `nextDate`.
  - `id` parse JSON item-lərində `crypto.randomUUID()`; `PaymentDraft` tipinə `id` əlavə edilmədi (UI `dashboard.tsx`-də təsdiqdə id verir).
  - `parseReceipt` client-də `arrayBuffer` + chunked `btoa` (böyük şəkil spread limitindən qaçmaq).
- **Xəta:** `npm run build` → `next: command not found` (node_modules yoxdur). Növbəti: `npm install` sonra yenidən build.

### 2026-10-09 ~14:05 — PROGRESS.md yaradıldı
- **Nə / niyə:** Tapşırıq tələb edir ki, handoff faylı həmişə aktual olsun. Fayl yox idi.
- **Fayllar:** yaradıldı `/Users/turan/Desktop/vaxt-and-pul-web-app/PROGRESS.md`
- **Qərar:** Shared Gemini helper `lib/gemini.ts` olacaq ki, parse və cancel route-ları təkrar etməsin. Client-də FileReader/arrayBuffer ilə base64. Köhnə `lib/api.ts` parse/heuristic funksiyaları fallback üçün saxlanılacaq.
- **Kəşf:** `parseText`/`parseReceipt`/`parseQuick` yalnız `add-payment-dialog.tsx`-dən; `generateCancelHelp` — `cancel-assistant-dialog.tsx` (SWR). `getWeeklySummary` bu tapşırıqda deyil, mock qalır.

---

## D. Açıq suallar və problemlər

- `GEMINI_API_KEY` `.env.local`-də var, amma dəyər real açar kimi görünmür (placeholder). Canlı parse/cancel üçün istifadəçi real açar qoymalıdır. Açar səhvdirsə UI mock fallback istifadə edir — səssiz fallback istifadəçiyə “AI işləmədi” demir.
- `getWeeklySummary` hələ stub-dur — bu tapşırığın dairəsindən kənar.
- `npm audit` 7 high vulnerability göstərdi; bu tapşırıqda toxunulmayıb.
- Layihə `packageManager: pnpm` elan edir, amma bu sessiyada `npm install` işlədildi (istifadəçi `npm run build` istədi). İkili lockfile ehtimalı: yoxla `package-lock.json` vs `pnpm-lock.yaml`.
