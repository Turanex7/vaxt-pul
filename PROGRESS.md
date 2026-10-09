# PROGRESS.md — PayPulse

## 2026-10-09 — Radar, xülasə və header düzəlişləri
- Pul kartının başlığı “Bu ayın qalan ödənişləri” oldu və cəm Math.round olmadan `formatAmount` ilə göstərilir; təqvim cəmi ilə eyni `559,77 AZN` alınır.
- Radar ağır həftə artıq növbəti 30 gün daxilində hər başlanğıc günü üçün sürüşən 7 günlük pəncərəni hesablayır, pəncərəni 30 günlük sərhəddə kəsir. Cari seed-də literal 30 günlük qayda üzrə ən böyük pəncərə `31 oktyabr – 6 noyabr, 545 AZN` olur (Kirayə 400 + Taksit 85 + zal 60). Göstərilən gözlənti `15–21 oktyabr, 447,80 AZN` həmin qayda ilə uyğun gəlmir; bu aralıqda cəm doğrudan 447,80 AZN-dir, amma sonrakı 30 günlük pəncərələrdə daha böyük cəm var.
- Netflix duplicate cütü silindi; Spotify Premium + YouTube Premium cütü saxlanır və illik qənaət cəm − maksimum məbləğdən hesablanır. Dəyişkən ödəniş kartı sarı xəbərdarlıq tonu, “Dəyişib” etiketi və “Elektrik ödənişi artıb” başlığını alır. Radar-dan təkrarlanan Növbəti 7 gün kartı çıxarıldı.
- Həftəlik xülasənin lokal mətni və Gemini promptundakı başlıq “Növbəti 7 gündə…” oldu. What-if siyahısına sağ padding və Switch-ə `shrink-0` verildi. Eyni provider adı cədvəldə təkrarlanmır. Header loqosu 52×46-dan 62×55-ə böyüdü; header və main konteynerdə `mx-auto` / `max-w-6xl` artıq mövcud idi və saxlanıldı.
- Brauzer DOM-da yeni Radar başlığı/etiketləri, 7 günlük Radar kartının yoxluğu, pul/təqvim cəmi və həftəlik başlıq yoxlanıldı; konsol error-u boş idi. `npm run build` Turbopack-in sandbox port bind xətası ilə dayandı; `npm run build -- --webpack` və `npx tsc --noEmit` uğurlu oldu.

## 2026-10-09 — Hydration audit və sabit tarix/məbləğlər
- Axtarış nəticələri: render zamanı `Math.random`, `Date.now`, `crypto.randomUUID`, `Intl.*`, `toLocaleString/DateString/TimeString`, `typeof window`, `sessionStorage` tapılmadı. `new Date` işlənən UI yerləri `today`-dən törəyən təqvim/xülasə hesablarıdır; cari saat oxunuşu yalnız `startOfToday()`-dədir və UI onu Dashboard-dan sonrakı effect vasitəsilə alır. UUID yalnız ödəniş/API/ICS əməliyyatlarında yaranır; localStorage Dashboard effect-ində və reset handler-indədir; clipboard `navigator` yalnız düymə handler-indədir.
- `toLocaleString()` chart tooltip-ində idi, `toLocaleLowerCase()` isə ay və Radar/mətn normallaşdırmasında idi. Chart məbləği indi `formatAmount`-dan keçir; ay adları sabit Azərbaycan massivindən, lower-case isə locale-siz `toLowerCase()` ilə alınır.
- `useToday` artıq yalnız Dashboard-da çağırılır; eyni `today` Hero, Radar, təqvim, status siyahısı və həftəlik xülasəyə ötürülür. Həftəlik request key-də gün də var. İlkin tarix sabit `2026-10-09`; real gün mount-dan sonra təyin olunur. Payments ilk state-i həmişə sabit seed-dir, localStorage yalnız effect-də oxunur və JSON/Storage xətasında seed qalır; yazma `paymentsLoaded` flag-dən sonra başlayır.
- `sumOccurrences` occurrence-ları qəpiklə toplayır, təqvim gün/ay və kateqoriya cəmləri də qəpik sərhədində yuvarlaqlanır. Seed-in cari ay üzrə xam cəmi `559.77 AZN`-dir (test sətri yoxdur); Pul xülasəsində gözlənilən tam AZN göstərmək üçün yekun ən yaxın AZN-ə yuvarlaq göstərilir (`560 AZN`). Ödəniş sətrləri və təqvim dəqiq qəpikləri saxlayır.
- IAB brauzerində konsol boş oldu. Ödəniş əlavə edib yeniləmədən sonra saxlandığını yoxladım, Demo sıfırlama ilə test sətrini sildim və iki dəfə yenilədim; seed bərpa olundu, hydration xətası görünmədi. `npm run build` Turbopack sandbox port bind məhdudiyyəti ilə dayanır; `npm run build -- --webpack` tamamlandı. Build tipləri yoxlamadığı üçün ayrıca `npx tsc --noEmit` də işlədildi.

## 2026-10-09 — Hydration və məbləğ yoxlaması
- Dashboard ilk renderdə statik tarixli seed ödənişlərini göstərir; cari gün `useToday` hook-u ilə yalnız mount-dan sonrakı effect-də yenilənir. `localStorage` oxunuşu Dashboard effect-indədir, render və state initializer zamanı deyil.
- Hero xülasəsi, Radar, həftəlik xülasə, təqvim və ödəniş siyahısında cari gün hook-dan ötürülür; server və ilkin client renderində eyni tarix işlənir.
- `formatAmount` Intl formatlamasından çıxarıldı; `toFixed(2)` və regex ilə minlik boşluq/onluq vergül istifadə olunur.
- Seed məlumatında test adlı əlavə ödəniş yoxdur. Bu ayın cəmi `559.77 AZN`: məbləğlər cəmlənəndə `9.99 + 11.99 + 9.99 + 15 + 5 + 20 + 37.80 + 22 + 8 + 210 + 180 + 30 = 559.77`; buna görə əvvəlki `.77` əlavə ödəniş deyil, real onluq məbləğlərdəndir. Göstəriş 560 AZN-ə yuvarlaqlaşdırılmadı, çünki məbləğ formatı qəpikləri saxlayır.
- IAB brauzerində səhifəni yenidən açıb konsol yoxlanıldı: hydration xətası yoxdur. `npm run build` Turbopack sandbox-da port bind məhdudiyyəti ilə dayandı; `npm run build -- --webpack` uğurla tamamlandı.

## 2026-10-09 — Amount formatı, “Ödənildi” və təqvim ixracı
- `lib/format.ts`-də locale parametrli `formatAmount` əlavə edildi; bütün məbləğ görünüşləri (xülasələr, Radar, cədvəl, simulator, təqvim, diaqram) minlik boşluq və vergüllü onluq formatına keçirildi.
- “Nə olar əgər?” switch-i yoxlanıldı: `shrink-0`, kəsən overflow yoxdur; toxunulmadı. Fallback nümunəsi `borodo 29azn 19 oktyabr` → `borodo` kimi yoxlanıldı.
- Ödəniş menyusuna “Ödənildi” əlavə edildi: birdəfəlik ödəniş silinir, təkrarlanan ödənişin tarixi bir dövr irəli çəkilir və ayın son gününə uyğunlaşdırılır. Payments state update-i Radar, Vaxt, təqvim və localStorage-ə yayılır.
- `lib/ics.ts` və menyudakı “Təqvimə əlavə et” ilə .ics ixracı; CRLF, unikal UID, all-day tarixlər, təkrar qaydaları və 1/7 günlük xatırlatmalar daxildir.
- Header loqosu bir qədər böyüdü. `npm run build -- --webpack` uğurlu, `npx tsc --noEmit` uğurlu; standart Turbopack build port bind məhdudiyyəti ilə dayandı.

## 2026-10-09 — PayPulse loqosunun yenilənməsi
- İstifadəçinin göndərdiyi loqonun təqvim/xatırlatma nişanı təmiz fondan ayrıldı və `public/paypulse-mark.png` kimi header-də tətbiq edildi.
- Yeni nişan `public/paypulse-icon.png` və Apple ikonunda da istifadə olunur; `app/layout.tsx` metadata ikonları yeniləndi.

## 2026-10-09 — Weekly AI xülasəsi, fallback xəbərdarlığı və mərkəzləmə
- `app/api/weekly/route.ts`: POST `{ stats }` qəbul edib `generateGeminiJson` ilə Azərbaycan dilində `{ title, body }` yaradır; prompt Gemini-yə statistikanı yenidən hesablamağı qadağan edir.
- `lib/api.ts`: `getWeeklySummary` `getNext7DaysStats`-dan count/total/deadline, ən böyük ödəniş və ən yaxın son tarix məlumatını yığır; API xətasında eyni faktlardan lokal xülasə qurur.
- `WeeklySummary`-də request 600ms debounce ilə gedir və SWR `keepPreviousData` əvvəlki xülasəni yeni cavab gələnədək saxlayır.
- Parse və ləğv fallback-ləri `getLastAiStatus()` ilə görünür; iki dialoqda fallback olduqda sarı bildiriş əlavə olunur. Mövcud PaymentDraft və WeeklySummary tipləri dəyişməyib.
- Dashboard və header konteynerlərinə `w-full` əlavə edildi; `mx-auto` və `max-w-6xl` saxlanıldı.
- Build: standart `npm run build` Turbopack port bind xətası ilə dayanır; `npm run build -- --webpack` uğurla tamamlandı və `/api/weekly` marşrutu daxil olmaqla build edildi.

## 2026-10-09 — Ödəniş state-i localStorage-də saxlama
- Dashboard ilk renderdə seed ödənişlərindən başlayır, mount-dan sonra `paypulse:payments` açarını `useEffect` ilə oxuyur; oxu/yazı/silmə əməliyyatları `try/catch`-dədir.
- Ödəniş əlavə etmə, redaktə və silmə dəyişiklikləri localStorage-ə yazılır. “Demo datasını sıfırla” təsdiqdən sonra açarı silir və seed ödənişləri bərpa edir.
- “Nə olar əgər?” keçidlərinin state-i saxlanmır. Seed ödənişlərində “blabla”/“borodo” adı yoxdur; parse nümunəsində Borodo Gym Sport Life Gym olaraq dəyişdirildi.
- Build nəticəsi: `npm run build -- --webpack` uğurlu. Standart Turbopack build sandbox-da port bind xətası ilə dayanır.

## 2026-10-09 — 7 günlük statistikanı vahidləşdirmə
- `lib/format.ts`: əlavə edilən `getNext7DaysStats(payments, today)` bütün occurrence-ları (deadline daxil) sayır və cəm, deadline sayı, elementləri qaytarır.
- `HeroSummary`, Radar növbəti 7 gün kartı və `WeeklySummary` eyni helper-in nəticəsini oxuyur; HeroSummary siyahısı bütün elementləri göstərir.
- `lib/radar.ts`: yük həftələrinin hamısı tam 7 gündür; son gün başlanğıcdan 6 gün sonradır, cəm də həmin pəncərədən hesablanır.
- Build: `npm run build -- --webpack` uğurlu. Sadə `npm run build` Turbopack sandbox-da port bind xətası ilə dayanır; webpack variantı build-i tamamladı.

## B. HAZIRKI VƏZİYYƏT

**İndi nə üzərində işlənir:** Bu tapşırıq **tamamlandı** (dinamik Radar + PayPulse). `npm run build` uğurlu.

**Ən son tamamlanan addım:** `buildRadarInsights(payments)` Radar data mənbəyidir; header/title PayPulse.

**Yarımçıq qalan iş:** Yoxdur (bu tapşırıq üçün). `RadarSection` UI dəyişməyib. `mockInsights` `lib/mock-data.ts`-də qalıb, artıq oxunmur.

**Növbəti addımlar (istəyə bağlı):**
1. Dashboard-da ödəniş əlavə/sil — Radar kartları `useMemo` ilə yenilənməlidir.
2. Canlı Gemini cavabını real açarla yoxlamaq.

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
- `getWeeklySummary` `/api/weekly`-yə qoşuldu; Gemini əlçatmaz olsa rəqəmlərdən lokal xülasə qaytarır.
- `npm audit` 7 high vulnerability göstərdi; bu tapşırıqda toxunulmayıb.
- Layihə `packageManager: pnpm` elan edir, amma bu sessiyada `npm install` işlədildi (istifadəçi `npm run build` istədi). İkili lockfile ehtimalı: yoxla `package-lock.json` vs `pnpm-lock.yaml`.
