# Деплой на Vercel + Neon

Пошаговая инструкция: как поднять все 5 микросервисов и фронтенд в облаке **бесплатно** (в пределах лимитов Vercel и Neon).

**Итого нужно:**
- аккаунт [GitHub](https://github.com)
- аккаунт [Vercel](https://vercel.com) (вход через GitHub)
- аккаунт [Neon](https://neon.tech) (можно через Vercel — см. ниже)
- **6 проектов** на Vercel (5 API + 1 фронт) из одного репозитория

---

## Схема

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel: dnd-frontend.vercel.app                            │
│  (статический HTML/JS)                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS + JWT
     ┌─────────────────────┼─────────────────────┐
     ▼                     ▼                     ▼
 dnd-auth            dnd-races            dnd-characters
 .vercel.app         .vercel.app          .vercel.app
     │                     │                     │
     ▼                     ▼                     ▼
 Neon: auth          Neon: races          Neon: characters
 (+ spells, feats — отдельные проекты Vercel + БД Neon)
```

---

## Часть 1. Подготовка репозитория

### 1.1. Залить код на GitHub

1. Создайте репозиторий на GitHub (например `dnd-microservices`).
2. В папке проекта выполните:

```powershell
cd "d:\Новая папка (6)\ДляТЕмы"
git init
git add .
git commit -m "Initial: D&D microservices"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/dnd-microservices.git
git push -u origin main
```

> Файлы `.env` в git не попадают (они в `.gitignore`). Секреты задаются только в Vercel.

### 1.2. Сгенерировать JWT-секрет

Один секрет для **всех** сервисов (минимум 32 символа). Пример в PowerShell:

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})
```

Сохраните строку — это `JWT_SECRET`.

---

## Часть 2. Базы данных в Neon

У каждого микросервиса **своя** база. Удобнее всего — **один проект Neon** и **5 баз данных** внутри него.

### 2.1. Создать проект Neon

1. Откройте [console.neon.tech](https://console.neon.tech).
2. **New Project** → имя, например `dnd-app`.
3. Регион выберите ближайший (например `Frankfurt`).

### 2.2. Создать 5 баз данных

В проекте Neon: **Databases** → **New database** — создайте:

| Имя базы в Neon | SQL-скрипт из репозитория |
|-----------------|---------------------------|
| `dnd_auth` | `docs/sql/auth.sql` |
| `dnd_races` | `docs/sql/races.sql` |
| `dnd_spells` | `docs/sql/spells.sql` |
| `dnd_feats` | `docs/sql/feats.sql` |
| `dnd_characters` | `docs/sql/characters.sql` |

> Если в интерфейсе только одна база `neondb` — можно создать **5 отдельных проектов** Neon (по одному на сервис). Логика та же: у каждого сервиса свой connection string.

### 2.3. Выполнить SQL

Для **каждой** базы:

1. Neon Console → выберите базу → **SQL Editor**.
2. Скопируйте содержимое нужного файла из `docs/sql/`.
3. **Run** — должны создаться таблицы (и начальные расы/заклинания/фокусы, где есть seed).

### 2.4. Скопировать строки подключения

Для каждой базы: **Connection details** → **Connection string** (режим **Pooled** подходит для Vercel).

Пример формата:

```
postgresql://user:password@ep-xxxx.eu-central-1.aws.neon.tech/dnd_auth?sslmode=require
```

Запишите 5 строк — они понадобятся как переменные окружения:

| Переменная | База Neon |
|------------|-----------|
| `AUTH_DATABASE_URL` | `dnd_auth` |
| `RACES_DATABASE_URL` | `dnd_races` |
| `SPELLS_DATABASE_URL` | `dnd_spells` |
| `FEATS_DATABASE_URL` | `dnd_feats` |
| `CHARACTERS_DATABASE_URL` | `dnd_characters` |

---

## Часть 2 (альтернатива). Neon через интеграцию Vercel

Можно подключить Neon к каждому проекту Vercel отдельно:

1. [vercel.com/integrations/neon](https://vercel.com/integrations/neon) → **Add Integration**.
2. Выберите Vercel-проект (создадите его на шаге 3) → Neon создаст БД и добавит переменную `DATABASE_URL`.
3. В настройках сервиса **переименуйте** переменную в нужную, например `AUTH_DATABASE_URL` (см. таблицу ниже), либо добавьте вручную вторую переменную с тем же значением.

Для **5 микросервисов** интеграцию обычно делают **5 раз** (по одной БД на проект Vercel) или один раз вручную копируют connection string из Neon Console — так проще контролировать имена баз.

---

## Один репозиторий → несколько проектов Vercel

Это главный вопрос при монорепо. Ответ: **один GitHub-репозиторий импортируете в Vercel много раз**, каждый раз с **другим именем проекта** и **другой Root Directory**.

```
GitHub: ваш-логин/dnd-microservices  (ОДИН репозиторий)
         │
         ├── Vercel проект "dnd-auth"       → Root: services/auth-service
         ├── Vercel проект "dnd-races"      → Root: services/races-service
         ├── Vercel проект "dnd-spells"     → Root: services/spells-service
         ├── Vercel проект "dnd-feats"      → Root: services/feats-service
         ├── Vercel проект "dnd-characters" → Root: services/characters-service
         └── Vercel проект "dnd-frontend"   → Root: frontend
```

Vercel **не** требует отдельный репозиторий на каждый микросервис. Все проекты смотрят на **один и тот же** `git push`, но собирают **разную папку**.

### Пошагово (первый проект — auth)

1. [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → выберите `dnd-microservices` (тот же репо, что и всегда).
3. На экране настройки:
   - **Project Name:** `dnd-auth` (уникальное — от него зависит URL).
   - Раскройте **Root Directory** → **Edit** → выберите `services/auth-service` → **Continue**.
   - Остальное можно не трогать → **Deploy**.

### Второй, третий… проект (тот же репо!)

1. Снова [vercel.com/new](https://vercel.com/new) — **не** создавайте новый репозиторий на GitHub.
2. Снова выберите **тот же** репозиторий `dnd-microservices`.
3. Vercel может спросить: *«This repository is already connected to project dnd-auth. Create a new project?»* → **Create a new project** / **Да**.
4. **Project Name:** `dnd-races` (другое имя!).
5. **Root Directory:** `services/races-service`.
6. Deploy → добавьте переменные `RACES_DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`.

Повторите ещё 4 раза для spells, feats, characters и frontend (`frontend`).

### Если Root Directory забыли при импорте

Уже созданный проект можно исправить:

1. Vercel → проект `dnd-auth` → **Settings** → **General**.
2. **Root Directory** → **Edit** → `services/auth-service` → **Save**.
3. **Deployments** → последний деплой → **Redeploy**.

### Как это работает при `git push`

Вы пушите **один** коммит в `main`. Vercel запускает сборку **во всех** подключённых проектах, но:

- в `dnd-auth` собирается только `services/auth-service`;
- в `dnd-races` — только `services/races-service`;
- и т.д.

Если изменили только фронт — пересоберётся в основном проект `dnd-frontend` (остальные могут пройти «пустую» сборку — это нормально).

### Частая ошибка

| Неправильно | Правильно |
|-------------|-----------|
| 6 репозиториев на GitHub | 1 репозиторий, 6 проектов Vercel |
| Один проект Vercel, корень = `/` | У каждого API свой Root Directory |
| Одинаковые Project Name | Уникальные имена: `dnd-auth`, `dnd-races`, … |

---

## Часть 3. Деплой микросервисов на Vercel

Повторите импорт **5 раз** (плюс 1 раз для фронта) — см. раздел выше. Порядок: auth → races → spells → feats → characters → frontend.

### 3.1. Создать проект Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import** вашего GitHub-репозитория (каждый раз **тот же** репо).
2. **Project Name** — уникальное имя (оно станет частью URL).

| Сервис | Project Name (пример) | Root Directory |
|--------|----------------------|----------------|
| Auth | `dnd-auth` | `services/auth-service` |
| Races | `dnd-races` | `services/races-service` |
| Spells | `dnd-spells` | `services/spells-service` |
| Feats | `dnd-feats` | `services/feats-service` |
| Characters | `dnd-characters` | `services/characters-service` |

3. **Framework Preset:** Other (или Vercel определит сам).
4. **Root Directory:** нажмите **Edit** → укажите папку из таблицы (важно!).
5. Пока **не** нажимайте Deploy — сначала переменные окружения.

### 3.2. Переменные окружения (Environment Variables)

Вкладка **Environment Variables** → добавьте для **Production** (и при желании Preview/Development).

#### Auth (`services/auth-service`)

| Имя | Значение |
|-----|----------|
| `AUTH_DATABASE_URL` | connection string базы `dnd_auth` |
| `JWT_SECRET` | ваш общий секрет |
| `FRONTEND_URL` | пока `*` или URL фронта после деплоя, например `https://dnd-frontend.vercel.app` |

#### Races (`services/races-service`)

| Имя | Значение |
|-----|----------|
| `RACES_DATABASE_URL` | connection string `dnd_races` |
| `JWT_SECRET` | **тот же**, что у auth |
| `FRONTEND_URL` | URL фронтенда |

#### Spells (`services/spells-service`)

| Имя | Значение |
|-----|----------|
| `SPELLS_DATABASE_URL` | connection string `dnd_spells` |
| `JWT_SECRET` | тот же |
| `FRONTEND_URL` | URL фронтенда |

#### Feats (`services/feats-service`)

| Имя | Значение |
|-----|----------|
| `FEATS_DATABASE_URL` | connection string `dnd_feats` |
| `JWT_SECRET` | тот же |
| `FRONTEND_URL` | URL фронтенда |

#### Characters (`services/characters-service`)

| Имя | Значение |
|-----|----------|
| `CHARACTERS_DATABASE_URL` | connection string `dnd_characters` |
| `JWT_SECRET` | тот же |
| `FRONTEND_URL` | URL фронтенда |
| `RACES_SERVICE_URL` | `https://dnd-races.vercel.app` (ваш URL races) |
| `SPELLS_SERVICE_URL` | `https://dnd-spells.vercel.app` |
| `FEATS_SERVICE_URL` | `https://dnd-feats.vercel.app` |

> **Без** `https://` и **без** `/api` в конце — только origin, как в таблице.

### 3.3. Deploy

Нажмите **Deploy**. Дождитесь статуса **Ready**.

Проверка auth-сервиса в браузере (должен вернуть JSON, не 404):

```
https://dnd-auth.vercel.app/api/me
```

Ожидаемо: `{"user":null}` без токена.

Запишите **фактические URL** всех 5 сервисов (Settings → Domains).

---

## Часть 4. Деплой фронтенда на Vercel

Фронт — это **шестой** проект Vercel. Логика та же, что у API: **тот же GitHub-репозиторий**, но **Root Directory = `frontend`**.

Фронт — обычный статический сайт (HTML/CSS/JS), без Node-сборки. Переменные окружения в Vercel для него **не нужны** — адреса API прописываются в `frontend/js/config.js`.

### 4.1. Создать проект (пошагово)

1. Откройте [vercel.com/new](https://vercel.com/new) (или Dashboard → **Add New…** → **Project**).
2. Выберите **тот же репозиторий**, что и для `dnd-auth`, `dnd-races`, …
3. Если спросит *«Create a new project?»* → **Yes** / **Создать новый проект**.
4. На экране настройки импорта:

| Поле | Что указать |
|------|-------------|
| **Project Name** | `dnd-frontend` (любое уникальное имя → будет `https://dnd-frontend.vercel.app`) |
| **Framework Preset** | **Other** (не Next.js, не React — у нас чистый HTML) |
| **Root Directory** | **Edit** → выберите папку **`frontend`** → Continue |
| **Build Command** | оставить **пустым** (собирать нечего) |
| **Output Directory** | `.` или оставить по умолчанию (корень = папка `frontend`) |
| **Install Command** | можно пустым (нет `package.json` во фронте) |

5. **Environment Variables** — **ничего не добавляйте** для фронта.
6. Нажмите **Deploy**.

Через ~30 секунд статус **Ready**. Откройте URL проекта — должна открыться страница входа (`login.html` или редирект с `index.html`).

### 4.2. Проверка, что Root Directory верный

В проекте `dnd-frontend` → **Settings** → **General**:

- **Root Directory** = `frontend`
- В **Deployments** → **Source** должны фигурировать файлы вроде `frontend/index.html`, а не корень всего репо.

Если открывается 404 или пустая страница — почти всегда Root Directory стоит `/` вместо `frontend`. Исправьте и сделайте **Redeploy**.

### 4.3. Что лежит в папке `frontend` (для справки)

```
frontend/
├── index.html      ← список персонажей
├── login.html
├── register.html
├── create.html     ← создание персонажа
├── sheet.html      ← просмотр листа
├── css/main.css
├── js/
│   ├── config.js   ← URL ваших API (обязательно настроить!)
│   ├── api.js
│   └── ...
└── vercel.json
```

Vercel отдаёт эти файлы как статику. `vercel.json` во фронте уже есть — дополнительно ничего настраивать не нужно.

### 4.4. Прописать URL API в коде

Откройте `frontend/js/config.js` и замените production-URL на **ваши** домены Vercel:

```js
  : {
      auth: 'https://dnd-auth.vercel.app/api',
      races: 'https://dnd-races.vercel.app/api',
      spells: 'https://dnd-spells.vercel.app/api',
      feats: 'https://dnd-feats.vercel.app/api',
      characters: 'https://dnd-characters.vercel.app/api',
    }
```

Закоммитьте и запушьте — Vercel пересоберёт фронт автоматически:

```powershell
git add frontend/js/config.js
git commit -m "Update production API URLs"
git push
```

### 4.5. Обновить CORS на всех API-сервисах

В **каждом** из 5 API-проектов Vercel → **Settings → Environment Variables**:

- `FRONTEND_URL` = `https://dnd-frontend.vercel.app` (ваш реальный URL фронта, **без** слэша в конце)

**Redeploy** каждый сервис: Deployments → ⋮ → **Redeploy** (чтобы подтянулись переменные).

---

## Часть 5. Деплой через Vercel CLI (опционально)

Если удобнее терминал:

```powershell
npm i -g vercel
cd "d:\Новая папка (6)\ДляТЕмы"

cd services\auth-service
vercel link
vercel env add AUTH_DATABASE_URL
vercel env add JWT_SECRET
vercel env add FRONTEND_URL
vercel --prod

# Повторить для races, spells, feats, characters с их переменными

cd ..\..\frontend
vercel link
vercel --prod
```

При `vercel link` выберите или создайте отдельный проект для каждой папки.

---

## Часть 6. Проверка после деплоя

### Чеклист

| # | Действие | Ожидание |
|---|----------|----------|
| 1 | Открыть `https://ВАШ-frontend.vercel.app` | Редирект / страница входа |
| 2 | Регистрация | Успех, редирект на список персонажей |
| 3 | Создать персонажа | В списке рас есть Человек, Эльф… |
| 4 | Выбрать заклинания и фокусы | Чекбоксы заполнены |
| 5 | Сохранить | Открывается лист персонажа |
| 6 | Обновить страницу листа | Данные на месте |

### Проверка API вручную

**Регистрация:**

```http
POST https://dnd-auth.vercel.app/api/register
Content-Type: application/json

{"username":"test","password":"test1234"}
```

**Список рас (с токеном):**

```http
GET https://dnd-races.vercel.app/api/races
Authorization: Bearer ВАШ_ТОКЕН
```

---

## Часть 7. Частые проблемы

### CORS / «Failed to fetch»

- `FRONTEND_URL` на всех 5 API должен **точно** совпадать с URL фронта (с `https://`, без `/` в конце).
- После смены переменных — **Redeploy** сервисов.

### 500 при регистрации / пустые списки

- Проверьте `AUTH_DATABASE_URL` (и остальные) в Vercel → **Settings → Environment Variables**.
- Убедитесь, что SQL из `docs/sql/` выполнен в **правильной** базе.
- Логи: Vercel → проект → **Deployments** → последний деплой → **Functions** → выберите функцию → **Logs**.

### Characters: «races service unavailable»

- В `characters-service` проверьте `RACES_SERVICE_URL`, `SPELLS_SERVICE_URL`, `FEATS_SERVICE_URL`.
- URL должны быть доступны из интернета (деплой races/spells/feats уже **Ready**).

### JWT / «Unauthorized» везде

- `JWT_SECRET` должен быть **одинаковым** во всех 5 API-проектах.
- После смены секрета пользователям нужно войти заново.

### Neon: connection timeout

- Используйте строку подключения с **pooler** (в Neon: *Pooled connection*).
- В строке должно быть `?sslmode=require`.

---

## Чеклист перед push (обязательно после правок кода)

В репозитории должны быть импорты **`../../lib/...`** в файлах `api/*/[id].ts` (не `../lib`).

```powershell
cd "d:\Новая папка (6)\ДляТЕмы"
git add .
git status
git commit -m "fix: [id] imports, api errors, config URLs"
git push
```

После push — **Redeploy** на Vercel: dnd-races, dnd-spells, dnd-feats, dnd-characters, dnd-frontend.

В **dnd-characters** проверьте переменные (без `/api`):

- `RACES_SERVICE_URL=https://dnd-races.vercel.app`
- `SPELLS_SERVICE_URL=https://dnd-spells-beige.vercel.app`
- `FEATS_SERVICE_URL=https://dnd-feats.vercel.app`

---

## Часть 8. Обновление проекта

1. Меняете код локально.
2. `git push` в `main`.
3. Vercel автоматически пересобирает **тот** проект, чья папка изменилась (если Root Directory настроен верно).

При изменении схемы БД — снова выполните нужный SQL в Neon SQL Editor.

---

## Краткая шпаргалка

| Что | Где |
|-----|-----|
| 5 connection strings | Neon Console → каждая база |
| 1 JWT_SECRET | все 5 API на Vercel |
| FRONTEND_URL | все 5 API = URL фронта |
| URL API для браузера | `frontend/js/config.js` |
| URL других сервисов | только `characters-service` |
| SQL | `docs/sql/*.sql` |
| Root Directory | `services/...` или `frontend` |

---

## Ссылки

- [Vercel — Import Git Repository](https://vercel.com/docs/getting-started-with-vercel/import)
- [Vercel — Root Directory](https://vercel.com/docs/deployments/configure-a-build#root-directory)
- [Vercel + Neon Integration](https://vercel.com/integrations/neon)
- [Neon — SQL Editor](https://neon.tech/docs/get-started/query-with-neon-sql-editor)
