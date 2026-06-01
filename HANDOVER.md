# RECOVA — Project Handover

> Полный snapshot проекта для продолжения разработки в новом чате.
> Если ты Claude и читаешь это в начале чата — прочти весь файл перед тем как что-то делать.

**Last updated:** 2026-05-31, after commit `7040086`, при сборке v10
**Working APK:** `recova-v10.apk` (тестируется пользователем сейчас)

---

## 🎯 Что это за приложение

**RECOVA** — мобильное приложение для восстановления после травм / операций. AI-генерация персонализированного rehab-плана + AI Physio чат + ежедневный трекер прогресса.

**Платформа:** Android (iOS на потом)
**Бизнес-модель:** Freemium с подпиской через Apple/Google IAP (RevenueCat — отложено до публикации)

---

## 👤 Владелец / контакты

- **Пользователь:** Артур (`i.arturcompany@gmail.com`)
- **EAS-аккаунт:** `airo33` (бесплатный)
- **Регион:** Россия (важно для VPN/блокировок)
- **Телефон тестирования:** Xiaomi на MIUI/HyperOS, периодически с VPN
- **Язык общения:** Русский

---

## 📚 Технологический стек

### Frontend (Mobile)
- **Expo SDK 56** (TypeScript) — `expo@~56.0.5`
- **React 19.2.3** + **React Native 0.85.3**
- **React Navigation v7** (native stack + bottom tabs)
- **Zustand 5** для state, persist через AsyncStorage
- **Lucide React Native 1.16.0** (закреплено) для иконок
- **react-native-svg 15.15.4** для логотипа и графиков
- **react-native-reanimated 4.3.1** + **react-native-worklets 0.8.3** (обязательно вместе)
- **react-native-gesture-handler ~2.31.1**
- **@supabase/supabase-js ^2.106.2**

### Backend
- **Supabase** (Postgres + Auth + Edge Functions + Storage)
- **Groq** для LLM (`llama-3.3-70b-versatile` для плана, `llama-3.1-8b-instant` для чата) — **не Anthropic** (в РФ блокируется)

### Build/Deploy
- **EAS Build** (managed workflow, no native folders)
- Profile **preview** для standalone APK без Metro
- Profile **development** для dev-client с Metro

---

## 🔐 Credentials (всё public, безопасно)

| Что | Значение |
|---|---|
| Supabase Project ID | `vzprhzwoeaycqemxofgk` |
| Supabase URL | `https://vzprhzwoeaycqemxofgk.supabase.co` |
| Supabase anon key | в `.env` + EAS env vars |
| Supabase region | Frankfurt (eu-central-1) |
| EAS Project ID | `f0075acb-c789-4793-883f-3d3d99a92b51` |
| Android package | `com.airo33.recova` |
| iOS bundle | `com.airo33.recova` (готово, не публиковали) |

**Секреты (приватные, лежат на серверах):**
- `GROQ_API_KEY` — Supabase Edge Functions secret (через `supabase secrets set`)
- `ANTHROPIC_API_KEY` — НЕ используется (переключились на Groq)
- RevenueCat API keys — НЕ настроены (mock mode)

---

## ⚠️ КРИТИЧЕСКИ ВАЖНЫЕ УРОКИ

### 1. EAS Build env vars (вызвало 5+ неудачных билдов)

**EAS Build НЕ читает локальный `.env`** — это security feature. Env vars надо:
1. Залить через `eas env:create --name X --value Y --environment preview --visibility plaintext`
2. **И** в коде использовать **литеральный** доступ: `process.env.EXPO_PUBLIC_SUPABASE_URL`, НЕ `process.env[`EXPO_PUBLIC_${key}`]` — Metro инлайнит только литеральные.

В этом проекте оба условия теперь выполнены (см. `src/lib/supabase.ts` коммит `7040086`).

### 2. react-native-reanimated 4.x + worklets

Reanimated 4 требует **отдельный peer пакет** `react-native-worklets`. Без него краш до маунта React. Установлен в коммите `73f3a6c`.

### 3. Xiaomi/HyperOS quirk

После переустановки APK иногда нужно **полностью удалить + перезагрузить телефон**. Иначе MIUI кэширует старый код подписи и приложение крашится тихо. Не developer mode — обычное удаление через настройки.

### 4. Российский регион

- Anthropic API заблокирован → используем Groq
- Apple/Google IAP покупки требуют Play Console + Apple Dev — отложено
- VPN часто включён у пользователя, это ломает LAN-связь с Metro
- Provider может тротлить интернет до 7-17 КБ/с

### 5. Hot-reload + native modules

JS-изменения hot-reloadятся в dev APK. Изменения нативных модулей (например установка/удаление `react-native-purchases`) требуют **нового EAS Build**.

### 6. Lucide иконки 1.16.0+

Иконки переименованы: `Home → House`, `BarChart3 → ChartColumn`, `AlertTriangle → TriangleAlert`. Старые имена работают как алиасы. **Закреплено на 1.16.0** в `package.json`, не использовать `^`.

---

## 🗂 Структура проекта

```
recova/
├── App.tsx                    # Root + ErrorBoundary + bootstrap hooks
├── index.ts                   # registerRootComponent
├── app.json                   # Expo config (package=com.airo33.recova)
├── eas.json                   # 3 build profiles: development, preview, production
├── .env                       # Public Supabase URL + anon key (закоммичено)
│
├── legal/
│   ├── privacy-policy.md      # 7KB GDPR/CCPA-compliant
│   └── terms-of-service.md    # 10KB с medical disclaimer
│
├── supabase/
│   ├── config.toml            # project_id = vzprhzwoeaycqemxofgk
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── cors.ts        # CORS headers helper
│   │   │   └── llm.ts         # Groq API wrapper (был anthropic.ts)
│   │   ├── generate-plan/index.ts   # Llama 3.3 70B, structured JSON
│   │   └── chat-physio/index.ts     # Llama 3.1 8B, fast
│   └── migrations/
│       └── 20260529000000_initial_schema.sql  # 5 таблиц + RLS
│
└── src/
    ├── theme/                 # Light + dark palette (Kalo-style)
    ├── store/useAppStore.ts   # Zustand store (persist через AsyncStorage)
    ├── lib/
    │   ├── supabase.ts        # Client init с 25s timeout
    │   ├── auth.ts            # useAuth + signIn/signUp/signOut
    │   ├── api.ts             # generatePlan, chatPhysio wrappers
    │   ├── sync.ts            # Cloud sync (pull/push)
    │   ├── useSyncBootstrap.ts # Auto-sync hook (debounced)
    │   ├── notifications.ts   # expo-notifications scheduling
    │   └── iap.ts             # RevenueCat — MOCK ONLY (пока)
    ├── navigation/
    │   ├── RootNavigator.tsx  # Auth gate, key={user.id}
    │   ├── MainTabs.tsx       # Home/Schedule/+/Progress/Profile
    │   └── types.ts           # ParamList
    ├── data/
    │   ├── moods.ts           # Mood picker с Lucide иконками
    │   ├── fitnessLevels.ts   # Sofa/Bike/Trophy
    │   ├── subscriptionTiers.ts # Weekly/Monthly/Annual data
    │   ├── fallbackPlan.ts    # Static план если AI недоступен
    │   └── legalText.ts       # Embedded markdown (auto-gen)
    ├── components/            # 12 reusable: Button, Card, Logo, etc.
    └── screens/               # 14 экранов
```

---

## 📱 Экраны (14 штук — все работают)

1. **Auth** — Sign up / Sign in (с anti rate-limit)
2. **Welcome** — Брендинг, R-логотип, CTA
3. **Onboarding 1** — Name, Age, Fitness Level (Lucide picker)
4. **Onboarding 2** — Injury description textarea
5. **Loading** — AI генерация плана, fallback на static
6. **Plan** — Generated protocol overview
7. **Subscription** — Weekly/Monthly/Annual tiers (mock IAP)
8. **Home** — Progress ring + Hydration + Today's tasks + AI chat CTA
9. **Schedule** — Weekly view с фазами и progress
10. **Exercise** — Detail с шагами и red flags
11. **Journal** — Pain scale (custom JS) + Mood + Notes
12. **Progress** — Stats + Pain chart + Log history
13. **Chat** — AI Physio (стримит с Groq)
14. **Profile** — Theme toggle, notifications, About (Privacy/Terms), Reset, Sign out
15. **Legal** — Markdown renderer для Privacy/Terms

---

## ✅ Что работает

- Auth (sign-up/sign-in)
- Plan generation через Groq Llama 3.3 70B
- AI Physio chat через Groq Llama 3.1 8B
- Cloud sync (profile, plan, logs, water, completions)
- Local notifications (Exercise/Water/Journal)
- Pain logging
- Hydration tracker
- Schedule с фазами
- Dark/light theme
- Modern design с R-логотипом и Lucide
- Privacy Policy + Terms (in-app)
- Error boundary с понятными ошибками

## ⏳ Что НЕ работает / отложено

- **Real IAP покупки** — нужен Google Play Console ($25) + RC API key + установка `react-native-purchases` обратно
- **iOS** — никогда не собирали, нужен Apple Dev Account ($99/год)
- **Push notifications с сервера** — только локальные есть
- **Splash screen + custom app icon PNG** — используют Expo defaults

---

## 🛠 Полезные команды

```powershell
# Dev сервер
cd "C:\Users\timur\OneDrive\Рабочий стол\recova"
$env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.31.39"  # LAN IP
npx expo start

# Type check
npx tsc --noEmit

# Build standalone APK (preview)
npx eas-cli build --platform android --profile preview --non-interactive --no-wait

# Управление EAS env vars
npx eas-cli env:list --environment preview
npx eas-cli env:create --name X --value Y --environment preview --visibility plaintext

# Supabase
supabase login
supabase link --project-ref vzprhzwoeaycqemxofgk
supabase secrets set GROQ_API_KEY=gsk_...
supabase functions deploy generate-plan
supabase functions deploy chat-physio

# Применить миграцию (через Dashboard SQL Editor проще)
# https://supabase.com/dashboard/project/vzprhzwoeaycqemxofgk/sql/new
```

---

## 🌐 URL'ы дашбордов

- **EAS Build:** https://expo.dev/accounts/airo33/projects/recova
- **Supabase:** https://supabase.com/dashboard/project/vzprhzwoeaycqemxofgk
- **Supabase Functions:** https://supabase.com/dashboard/project/vzprhzwoeaycqemxofgk/functions
- **Supabase Auth settings:** https://supabase.com/dashboard/project/vzprhzwoeaycqemxofgk/auth/providers (Email confirmation **выключен** для тестирования)
- **Supabase Env vars (Edge):** https://supabase.com/dashboard/project/vzprhzwoeaycqemxofgk/settings/functions
- **Groq:** https://console.groq.com/

---

## 📜 История развития (29 коммитов)

```
7040086 fix(supabase): literal process.env access (Metro inlining) ← KEY FIX
73f3a6c fix: install react-native-worklets ← KEY FIX
995f7cf fix: Lucide icon renames (был холостой выстрел, но коммит остался)
10479de fix: ErrorBoundary + lazy-safe supabase init
9778e64 fix(iap): drop react-native-purchases — go mock-only
8217830 fix(iap): skip native module load
e1242ba feat(legal): Privacy + Terms (docs + in-app)
b026b3e feat(design): custom logo + Lucide-only pickers
cd6b676 fix(polish): 7 bugs (setSubscription, advanceDay, signOut, etc.)
31f1a34 feat(iap): RevenueCat integration (mock-fallback)
66ad7c7 fix(network): 25s timeouts + 6s session ceiling
54e3d40 feat(ai): senior-physio prompt + quality gate
180b17b fix(auth): humanize rate-limit
648cfe4 feat(auth): Supabase Auth + cloud sync + DB schema
dcc8c4f feat(notifications): real local reminders
635a34c feat(chat): full AI Physio chat UI
a75396e fix(journal): pure-JS PainScale (был slider)
6c8de36 feat(ai): Anthropic → Groq (РФ блокирует Anthropic)
b93125d refactor(design): Phase 2 — every screen Kalo aesthetic
073dac1 refactor(design): Phase 1 — Lucide + lime + near-black dark
8ed610a feat: HomeScreen
8234383 chore: scaffold Expo TypeScript
```

---

## 🎯 Логичные следующие шаги

1. **Доделать env vars / финализировать v10** — если bundle инлайнит реальный URL и регистрация работает на телефоне, это финал debugging
2. **Splash screen + app icon PNG** — сейчас Expo defaults
3. **Хостинг Privacy Policy URL** (для App Store ревью обязательно) — Vercel/Cloudflare Pages, бесплатно
4. **Подумать про iOS** — но это $99/год Apple Dev + другая инфра
5. **Реальные IAP** — нужен Google Play Console ($25), Play app entry, RC dashboard setup → вернуть `react-native-purchases`
6. **Тюнинг AI промптов** — есть quality gate в `generate-plan/index.ts`, можно докрутить
7. **Onboarding улучшения** — например автокомплит травм
8. **Analytics** — PostHog или Mixpanel для product analytics

---

## 🤝 Тон работы с пользователем

- **Русский язык**, плотный, без эмодзи кроме редких акцентов
- **Конкретные шаги**, без воды
- Пользователь **не разработчик** — нельзя слать в "режим разработчика" и т.п. без необходимости
- Когда что-то не работает: **сначала диагностика по факту** (логи, MD5 хэши, expo-doctor), **потом** изменения. Я угадывал 5 раз — это было плохо.
- Всегда `tsc --noEmit` перед коммитом
- Коммиты с подробными body-сообщениями (см. примеры в git log)

---

## 📦 Текущее состояние файлов

- `.env` — закоммичен (public URL + anon key — безопасно)
- `.gitignore` — игнорит `*.apk`, `.claude/settings.local.json`, supabase `.temp`
- `tsconfig.json` — `strict: true`, исключает `supabase/`
- `eas.json` — 3 profiles готовы
- `app.json` — package + bundle + icons + plugins
- `package.json` — версии закреплены где надо (lucide, expo-modules)
- `.claude/launch.json` — 4 dev-server configs (Metro, Tunnel, Web, Supabase)

Все рабочие APK на компе: `recova-v2.apk`, `v3.apk`, `v4.apk`, `v6.apk`, `v7.apk`, `v8.apk` + последний v10 когда дойдёт.
