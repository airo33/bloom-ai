# BLOOM AI (recova) — Project Handover

> Полный snapshot проекта для продолжения разработки в новом чате.
> Если ты Claude и читаешь это в начале чата — прочти весь файл перед тем как что-то делать.

**Last updated:** 2026-09-27, after commit `5f785ff` (Node.js only что установлен на новом ноутбуке, ветка `master` на 4 коммита впереди origin — нужно `git push`)
**App version:** `1.9.0` (app.json) — репозиторий/slug всё ещё называется `recova`, но продукт и bundle name — **Bloom AI**

---

## 🎯 Что это за приложение

**Bloom AI** (бывший Mend AI, бывший RECOVA) — мобильное приложение для восстановления после травм / операций. AI-генерация персонализированного rehab-плана + AI Physio чат (с поддержкой фото травмы) + ежедневный трекер прогресса + Recovery Score + шеринг прогресса.

**Платформа:** Android (тестируется через Expo Go), iOS — не собирали
**Бизнес-модель:** Freemium с подпиской (сейчас **mock-only** IAP — см. секцию про react-native-purchases ниже)

---

## 👤 Владелец / контакты

- **Пользователь:** Артур (`i.arturcompany@gmail.com`), git author `timur <i.arturcompany@gmail.com>`
- **EAS-аккаунт:** `airo33` (бесплатный)
- **GitHub:** `airo33/bloom-ai` (remote `origin`, ветка по умолчанию `master`)
- **Ноутбук:** сменился в сентябре 2026 — текущий путь проекта: `C:\Users\iartu\OneDrive\Desktop\recova` (репозиторий живёт в OneDrive)
- **Язык общения:** Русский

---

## 📚 Технологический стек

### Frontend (Mobile)
- **Expo SDK 57** (TypeScript) — `expo@~57.0.20` (актуальные версии сейчас чуть отстают от `~57.0.25` набора — `npx expo install --check` покажет патч-обновления; некритично, но стоит подтянуть перед следующим EAS-билдом)
- **React 19.2.3** + **React Native 0.86.3**
- **React Navigation v7** (native stack + bottom tabs)
- **Zustand 5** для state, persist через AsyncStorage
- **Lucide React Native 1.16.0** (закреплено, без `^`) для иконок
- **react-native-svg 15.15.4** для логотипа и графиков
- **react-native-reanimated 4.5.1** + **react-native-worklets 0.10.1** (обязательно вместе)
- **react-native-gesture-handler ~2.32.0**
- **i18next + react-i18next** — 4 языка: en/es/pt/de, автодетект локали устройства + ручной переключатель
- **@supabase/supabase-js ^2.106.2**
- **posthog-react-native** — product analytics подключена

### Backend
- **Supabase** (Postgres + Auth + Edge Functions + Storage)
- **Groq** для LLM — **не Anthropic** (в РФ блокируется)
  - `llama-3.3-70b-versatile` — генерация плана (`generate-plan`) и корректировка плана (`adjust-plan`)
  - `llama-3.1-8b-instant` — обычный чат (`chat-physio`)
  - `meta-llama/llama-4-scout-17b-16e-instruct` (или значение секрета `GROQ_VISION_MODEL`) — чат-сообщения с фото травмы

### Build/Deploy
- **EAS Build** (managed workflow, no native folders)
- Profile **preview** для standalone APK без Metro
- Profile **development** для dev-client с Metro
- Тестирование сейчас идёт через **Expo Go** (не dev-client APK)

---

## 🔐 Credentials (всё public, безопасно)

| Что | Значение |
|---|---|
| Supabase Project ID | `vzprhzwoeaycqemxofgk` |
| Supabase URL | `https://vzprhzwoeaycqemxofgk.supabase.co` |
| Supabase anon key | в `.env` (закоммичен, публичный) |
| Supabase region | Frankfurt (eu-central-1) |
| EAS Project ID | `f0075acb-c789-4793-883f-3d3d99a92b51` |
| Android package | `com.airo33.recova` |
| iOS bundle | `com.airo33.recova` (готово, не публиковали) |

**Секреты (приватные, лежат на серверах Supabase Edge Functions):**
- `GROQ_API_KEY` — обязателен
- `GROQ_VISION_MODEL` — опционален, оверрайд модели для фото-чата (Groq ротирует "preview" vision-модели)
- `ANTHROPIC_API_KEY` — НЕ используется приложением (заблокирован в РФ; переключились на Groq ещё в мае 2026)
- RevenueCat API keys — НЕ настроены (mock mode, см. ниже)

---

## ⚠️ КРИТИЧЕСКИ ВАЖНЫЕ УРОКИ

### 1. Новый ноутбук (сентябрь 2026) — на нём НЕ было Node.js
Свежая Windows-машина: пришлось ставить Node.js LTS через `winget install --id OpenJS.NodeJS.LTS`. `node_modules` был скопирован вместе с проектом (через OneDrive) и после установки Node прошёл `npm ls` и `tsc --noEmit` без ошибок — переустанавливать не потребовалось. Если на очередном новом компе `node`/`npm`/`eas`/`supabase`/`adb` не найдены — это норма, ставить заново.

### 2. EAS Build env vars
**EAS Build НЕ читает локальный `.env`** — security feature. Env vars:
1. Заливать через `eas env:create --name X --value Y --environment preview --visibility plaintext`
2. В коде — **литеральный** доступ: `process.env.EXPO_PUBLIC_SUPABASE_URL`, НЕ через динамический ключ — Metro инлайнит только литералы.

### 3. react-native-reanimated 4.x + worklets
Требует отдельный peer-пакет `react-native-worklets` (сейчас `0.10.1`, синхронно с reanimated `4.5.1`). Без него — краш до маунта React.

### 4. Xiaomi/HyperOS quirk (для APK-тестирования, не Expo Go)
После переустановки APK иногда нужно **полностью удалить + перезагрузить телефон** — иначе MIUI кэширует старую подпись и приложение тихо крашится.

### 5. Российский регион
- Anthropic API заблокирован → используем Groq
- Apple/Google IAP покупки требуют Play Console + Apple Dev — отложено, IAP пока mock-only
- VPN у пользователя часто включён — ломает LAN-связь с Metro, может душить скорость интернета

### 6. Lucide иконки 1.16.0+
Иконки переименованы: `Home → House`, `BarChart3 → ChartColumn`, `AlertTriangle → TriangleAlert`. Старые имена — алиасы. Закреплено на `1.16.0` без `^`.

### 7. IAP — react-native-purchases убран
Крашил Android-устройства без Google Mobile Services ("Error loading app"). Сейчас `src/lib/iap.ts` — чистый mock: тапнул тир → локально считается что купил. Когда будет готов реальный Google Play billing — переустановить `react-native-purchases`, реальный путь есть в истории git (коммит `31f1a34`).

### 8. Фото травмы в чате — фича готова локально, но НЕ задеплоена
`chat-physio` Edge Function теперь принимает `image` (base64 JPEG) и роутит на vision-модель. Код закоммичен (`edd8e6e`), но **функция не задеплоена** — после git push нужно:
```
supabase functions deploy chat-physio
```
Фото никогда не сохраняется — используется только для одного запроса, на клиенте хранится лишь локальный `file uri` для превью в транскрипте.

---

## 🗂 Структура проекта (актуально на сентябрь 2026)

```
recova/
├── App.tsx                    # Root + ErrorBoundary + bootstrap hooks
├── index.ts                   # registerRootComponent
├── app.json                   # Expo config (name=Bloom AI, package=com.airo33.recova, v1.9.0)
├── eas.json                   # 3 build profiles: development, preview, production
├── .env                       # Public Supabase URL + anon key (закоммичено)
├── AGENTS.md                  # "Expo HAS CHANGED" — держать версию докс в актуальном SDK (сейчас v57)
│
├── docs/                      # Лендинг Bloom AI для GitHub Pages (index/privacy/terms.html + иконки)
├── legal/                     # privacy-policy.md, terms-of-service.md (источник для docs/ и in-app Legal)
│
├── supabase/
│   ├── config.toml            # project_id = vzprhzwoeaycqemxofgk
│   ├── functions/
│   │   ├── _shared/           # cors.ts, llm.ts (Groq wrapper, теперь + vision content parts)
│   │   ├── generate-plan/     # Llama 3.3 70B — первичная генерация плана
│   │   ├── adjust-plan/       # Llama 3.3 70B — корректировка существующего плана по запросу юзера
│   │   ├── chat-physio/       # Llama 3.1 8B (+ vision-модель при фото) — чат
│   │   └── delete-account/    # Удаление аккаунта, каскадом чистит все таблицы юзера
│   └── migrations/
│       ├── 20260529000000_initial_schema.sql
│       ├── 20260602000000_journal_extra_fields_and_chat_sync.sql
│       └── 20260619000000_feedback_and_plan_history.sql
│
└── src/
    ├── theme/                 # Bloom "Garden" дизайн-система, light+dark
    ├── store/useAppStore.ts   # Zustand store (persist через AsyncStorage)
    ├── lib/
    │   ├── supabase.ts        # Client init с 25s timeout
    │   ├── auth.ts            # useAuth + signIn/signUp/signOut (+ show/hide password toggle в UI)
    │   ├── api.ts             # generatePlan, chatPhysio (теперь + опциональное image), adjustPlan
    │   ├── sync.ts            # Cloud sync (pull/push)
    │   ├── useSyncBootstrap.ts# Авто-sync hook (debounced)
    │   ├── notifications.ts   # Напоминания — время теперь настраивается юзером (Profile)
    │   ├── recoveryScore.ts   # Recovery Score 0..100 = 50% pain + 30% consistency + 20% momentum
    │   ├── planAdaptation.ts  # Логика подсказок "адаптировать план"
    │   ├── injuryPhoto.ts     # NEW: pick+compress фото травмы для чата (expo-image-picker/-manipulator)
    │   ├── i18n.ts            # i18next bootstrap, 4 языка, автодетект локали
    │   └── iap.ts             # RevenueCat — MOCK ONLY
    ├── navigation/             # RootNavigator (auth gate), MainTabs, types
    ├── data/                   # moods, fitnessLevels, subscriptionTiers, fallbackPlan, legalText
    ├── locales/                # en.json, es.json, pt.json, de.json — полностью переведены (i18n завершён)
    ├── components/             # ~25 переиспользуемых: Button, Card, Logo, RecoveryScoreCard,
    │                           # ShareProgressModal/ShareableCard, HydrationTracker, PainChart,
    │                           # AnimatedFlame, Confetti/StreakReward/PhaseTransition/celebration-компоненты,
    │                           # OnboardingTutorial, TimeInput, MedicalDisclaimer, ...
    └── screens/                # 16+ экранов (см. ниже)
```

---

## 📱 Экраны

1. **Auth** — Sign up / Sign in, теперь с show/hide password toggle
2. **Welcome** — брендинг Bloom AI, AI Spark логотип
3. **Onboarding 1/2** — Name, Age, Fitness Level, Injury description
4. **Language** — выбор языка (en/es/pt/de)
5. **Loading** — AI генерация плана, fallback на static
6. **Plan** — обзор сгенерированного протокола
7. **Subscription** — Weekly/Monthly/Annual тиры (mock IAP), с trial на всех тирах
8. **Home** — Recovery Score card + Hydration + Today's tasks + AI chat CTA + adaptation suggestions
9. **Schedule** — недельный вид с фазами и прогрессом
10. **Exercise** — детали упражнения, шаги, red flags
11. **Journal** — pain scale (gesture slider) + hero pain card + mood + заметки
12. **Progress** — статистика + pain chart + история + **Share Progress** (карточка-скриншот для соцсетей)
13. **Chat** — AI Physio, стримит с Groq, **теперь поддерживает фото травмы** (камера/галерея)
14. **Feedback** — экран сбора обратной связи от пользователя
15. **Plan History** — архив предыдущих планов (после Reset)
16. **Profile** — тема, кастомизируемые времена напоминаний, About, Reset, Sign out, удаление аккаунта
17. **Legal** — markdown-рендерер Privacy/Terms

---

## ✅ Что работает

- Auth (sign-up/sign-in, show/hide password)
- Генерация и адаптация плана через Groq Llama 3.3 70B
- AI Physio чат через Groq Llama 3.1 8B, включая **фото травмы** через vision-модель (код готов, функция ждёт деплоя — см. урок №8)
- Cloud sync (profile, plan, logs, water, completions, chat)
- Локальные напоминания с настраиваемым временем
- Pain logging + Recovery Score + adaptation suggestions
- Hydration tracker
- Progress sharing (скриншот-карточка через ViewShot + Sharing)
- Dark/light theme
- Полная локализация: en/es/pt/de
- Privacy Policy + Terms (in-app + отдельный лендинг в `docs/` на GitHub Pages)
- Error boundary, feedback screen, plan history, account deletion
- Analytics через PostHog

## ⏳ Что НЕ работает / отложено

- **Real IAP покупки** — нужен Google Play Console ($25) + RC API key + переустановка `react-native-purchases`
- **iOS** — никогда не собирали, нужен Apple Dev Account ($99/год)
- **Push notifications с сервера** — только локальные
- **Деплой `chat-physio` с поддержкой фото** — код готов локально, нужно `supabase functions deploy chat-physio`
- **Push в origin** — 4 локальных коммита ждут `git push` (см. "Текущее состояние" ниже)

---

## 🛠 Полезные команды

```powershell
# Dev сервер (Expo Go)
cd "C:\Users\iartu\OneDrive\Desktop\recova"
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
supabase secrets set GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct   # опционально
supabase functions deploy chat-physio
supabase functions deploy generate-plan
supabase functions deploy adjust-plan
supabase functions deploy delete-account
```

---

## 🌐 URL'ы дашбордов

- **EAS Build:** https://expo.dev/accounts/airo33/projects/recova
- **GitHub:** https://github.com/airo33/bloom-ai
- **Supabase:** https://supabase.com/dashboard/project/vzprhzwoeaycqemxofgk
- **Supabase Functions:** https://supabase.com/dashboard/project/vzprhzwoeaycqemxofgk/functions
- **Supabase Auth settings:** https://supabase.com/dashboard/project/vzprhzwoeaycqemxofgk/auth/providers
- **Supabase Env vars (Edge):** https://supabase.com/dashboard/project/vzprhzwoeaycqemxofgk/settings/functions
- **Groq:** https://console.groq.com/

---

## 🤝 Тон работы с пользователем

- **Русский язык**, плотный, без эмодзи кроме редких акцентов
- **Конкретные шаги**, без воды
- Пользователь **не разработчик** — нельзя слать в "режим разработчика" и т.п. без необходимости
- Когда что-то не работает: **сначала диагностика по факту** (логи, expo-doctor), **потом** изменения
- Всегда `tsc --noEmit` перед коммитом
- Коммиты с подробными body-сообщениями (см. `git log`)

---

## 📦 Текущее состояние (2026-09-27)

- Ветка `master` — **4 локальных коммита впереди `origin/master`**, нужен `git push origin master`:
  - `b8b5900` chore(deps): upgrade Expo SDK 56 -> 57
  - `daecb75` feat(i18n): translate remaining hardcoded strings
  - `edd8e6e` feat(chat): injury photo attachment for AI Physio chat
  - `5f785ff` chore(data): update university-selection spreadsheet + add reddit research drafts
- `node_modules` соответствует `package.json` (`npm ls` чисто), `tsc --noEmit` проходит без ошибок
- `npx expo install --check` показывает ~12 Expo-пакетов на пару патч-версий позади — не критично, но стоит подтянуть перед следующим билдом
- `.env` — закоммичен (public URL + anon key — безопасно)
- `.gitignore` — игнорит `*.apk`, `.claude/settings.local.json`, supabase `.temp`
- `.claude/launch.json` — 4 dev-server конфига (Metro, Tunnel, Web, Supabase local)
- Локальные APK-файлы (`*.apk`) в корне репо — старые тестовые сборки, гитом игнорятся, можно удалить вручную с диска для экономии места
