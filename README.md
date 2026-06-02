# D&D — лист персонажа (микросервисы)

Хобби-проект: **создание и хранение листа персонажа D&D**. Пять независимых микросервисов на Vercel Serverless + Neon PostgreSQL + статический фронтенд.

## Архитектура

```
Фронтенд (HTML/CSS/JS)
    │  HTTP + JWT
    ├── Auth Service      :3001  → auth_db
    ├── Races Service     :3002  → races_db
    ├── Spells Service    :3003  → spells_db
    ├── Feats Service     :3004  → feats_db
    └── Characters Service :3005 → characters_db
              │
              └── HTTP-валидация рас/заклинаний/фокусов при создании персонажа
```

| Сервис | Порт | Назначение |
|--------|------|------------|
| auth-service | 3001 | Регистрация, вход, JWT |
| races-service | 3002 | Расы (системные + свои) |
| spells-service | 3003 | Заклинания |
| feats-service | 3004 | Фокусы |
| characters-service | 3005 | Персонажи + связи |

## Быстрый старт

### 1. Neon — 5 баз данных

В [Neon](https://neon.tech) создайте 5 БД (или 5 connection string в одном проекте) и выполните SQL из `docs/sql/`:

- `auth.sql` → `AUTH_DATABASE_URL`
- `races.sql` → `RACES_DATABASE_URL` (включает seed рас)
- `spells.sql` → `SPELLS_DATABASE_URL`
- `feats.sql` → `FEATS_DATABASE_URL`
- `characters.sql` → `CHARACTERS_DATABASE_URL`

**JWT_SECRET** — один и тот же во всех сервисах.

### 2. Переменные окружения

Скопируйте `.env.example` в `.env` в каждом сервисе:

```powershell
copy services\auth-service\.env.example services\auth-service\.env
# … и так для остальных
```

### 3. Установка и запуск

```powershell
npm run install:all

# Вручную — 5 терминалов + фронт:
cd services\auth-service && npm run dev
cd services\races-service && npm run dev
# … spells, feats, characters

cd frontend
npx serve -l 5500
```

Или скрипт:

```powershell
.\scripts\start-dev.ps1
```

Откройте: http://localhost:5500

## Структура

```
├── services/
│   ├── auth-service/
│   ├── races-service/
│   ├── spells-service/
│   ├── feats-service/
│   └── characters-service/
├── frontend/
├── docs/sql/
└── scripts/start-dev.ps1
```

## Деплой на Vercel + Neon

**Подробная пошаговая инструкция:** [docs/DEPLOY_VERCEL_NEON.md](docs/DEPLOY_VERCEL_NEON.md)

Кратко:

1. GitHub → залить репозиторий.
2. Neon → 5 баз + SQL из `docs/sql/`.
3. Vercel → 6 проектов (5× API + frontend), у каждого свой **Root Directory**.
4. Переменные окружения — см. инструкцию и `.env.example` в сервисах.
5. `frontend/js/config.js` — URL ваших деплоев + `FRONTEND_URL` на всех API.

## API

| Сервис | Эндпоинты |
|--------|-----------|
| Auth | `POST /api/register`, `POST /api/login`, `GET /api/me` |
| Races | `GET/POST /api/races`, `GET/DELETE /api/races/:id` |
| Spells | `GET/POST /api/spells`, `GET/DELETE /api/spells/:id` |
| Feats | `GET/POST /api/feats`, `GET/DELETE /api/feats/:id` |
| Characters | `GET/POST /api/characters`, `GET /api/characters/:id` |

## Особенности

- Микросервисы общаются только по **HTTP** (без Kafka/RabbitMQ).
- У каждого сервиса **своя БД** — без FK между сервисами.
- Characters Service при чтении персонажа подтягивает расу/магию через API других сервисов.
- Системные расы/заклинания/фокусы + пользовательские (после входа).
