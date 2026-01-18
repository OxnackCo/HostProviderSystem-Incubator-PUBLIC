Документация была написана при помощи БЯМ, могут быть неточности, уточняйте support@oxnack.com или в поддержку https://t.me/OxnackSupport_bot

# Точечная документация: используемые эндпоинты и схема БД

Этот файл содержит строгое перечисление того, что используется в коде (входные точки и таблицы PostgreSQL). Все конфигурации находятся в `config.py` внутри сервисов и их можно редактировать при необходимости.

Внимание: в документ не включены секреты, тестовые файлы и прочие неиспользуемые вспомогательные скрипты.

**Сервисы и используемые входные точки (entry files и их эндпоинты)**

- `Bot-Api-OxnMarket/BotAddServices/api.py`:
  - GET `/services` — возвращает записи из таблицы `services` (фильтр по `enabled`).

- `HostProviderSystem/Authorization/main.py` (Flask):
  - POST `/register` — регистрация (использует функции в `Authorization/defs.py`, пишет в таблицу `users`).
  - POST `/register/code` — подтверждение кода (работа с `users`).
  - POST `/login` — аутентификация (чтение `users`, обновление поля `cookie`).

- `HostProviderSystem/MailSendAPI/main.py` (Flask):
  - POST `/send_mail` — пересылка письма через SMTP и проксирование к внутреннему почтовому API.

- `HostProviderSystem/TakeServerSystem/take_server_api/main.py` (Flask):
  - POST `/create_machine` — логика создания/списки серверов, обновления баланса и записи в таблицы `servers`, `transactions`, `users`.
  - GET `/get_balance` — возвращает поле `balance` из `users`.
  - GET `/countries` — возвращает статический список стран (в коде переменная `Countries`).
  - GET `/osystems` — возвращает поддерживаемые ОС (переменная `OSS`).
  - GET `/parametrs` — возвращает параметры ценообразования и лимитов (переменные `pr_*`, `mx_*`, `min_*`).
  - POST `/calc_price` — расчёт стоимости на основе параметров.
  - GET `/user_services` — список записей из `servers` для пользователя.
  - GET `/get_mail` — возвращает `mail` из `users` по куке.

- `PaymentAPI/main.py` (FastAPI):
  - POST `/create_invoice` — создание инвойса (либо внешняя плательщик-логика), в коде сохраняется транзакция в кэше и вызываются функции сохранения в БД (`save_invoice_to_db`, `update_invoice_status_in_db`) — реализации в коде помечены TODO, но структура предполагает таблицу `transactions`/`invoices`.
  - GET `/health` — статус сервиса.
  - GET `/debug/cache` — отладочная информация по кэшу транзакций.

**PostgreSQL: обнаруженные таблицы и используемые поля (согласно коду)**

Ниже — таблицы, которые явно используются в коде, и поля, к которым обращаются скрипты.

- **`users`** — наиболее используемая таблица
  - Применяется в `Authorization`, `TakeServerSystem`, `PaymentAPI` и др.
  - Поля (используемые в коде): `id`, `username`, `mail` (или `email`), `passwd_hash`, `is_verified`, `cookie`, `tg_id`, `tg_username`, `balance`, `use`, `date_start`, `date_stop`, `token`, `ref_id`, `sub`, `expires_at`, `name`.

- **`transactions`**
  - Используется в `PaymentAPI` и `TakeServerSystem`.
  - Поля: `id` (возможно), `username` или `tg_id`, `type`, `amount`, `date`, `discription` (описание), `status`, `transaction_id`.

- **`services`**
  - Используется в `BotAddServices`.
  - Поля: `id`, `name_ru`, `description_ru`, `name_en`, `description_en`, `price_usd`, `price_rub`, `image_link`, `enabled`.

- **`servers`**
  - Используется в `TakeServerSystem` для выдачи/редактирования виртуальных машин.
  - Поля: `id`, `ram`, `cores`, `hdd`, `ips` (или `ip`), `os`, `status`, `passwd`, `mac`, `name`, `discription` (описание), `busy`, `username`.

- **`promocodes`**
  - Поля: `promo`, `discount`.

Примечание: названия некоторых полей в коде написаны с опечатками (`discription` вместо `description`), это отражено в перечне — чтобы совпадать с тем, как их ожидает код.

**Переменные подключения к Postgres по сервисам (из кода)**

- В `Bot-Api-OxnMarket/BotAddServices/*` и в `HostProviderSystem/Authorization/*`, `PaymentAPI/UseDB.py` — используются переменные: `host`, `database`, `user`, `password`.
- В `HostProviderSystem/TakeServerSystem/take_server_api/defs.py` — используются переменные: `db_host`, `db_database`, `db_user`, `db_password`.

Это значит, что в `config.py` каждого сервиса могут быть разные имена переменных подключения — проверьте конкретный файл `config.py` сервиса.

**Политика конфигурации**

- Разрешается редактировать `config.py` в каждом сервисе (файлы в репозитории служат шаблонами). Поддерживаемая практика: хранить реальные секреты вне VCS и помещать их в защищённый менеджер секретов, но по вашему запросу `config.py` можно менять прямо в репозитории/окружении.
- Важное изменение: в документации больше не упоминаются виртуальные окружения как обязательные шаги — используйте удобный для вас способ управления зависимостями (контейнеры, системные пакеты, pipx и т.д.).

**Дополнительно — соответствие main/entry файлам**

- Вплотную ориентируйтесь на файлы-точки входа:
  - `Bot-Api-OxnMarket/BotAddServices/api.py` — запуск Flask на порту (в коде `7001`).
  - `HostProviderSystem/Authorization/main.py` — Flask (порт `7004` в коде).
  - `HostProviderSystem/MailSendAPI/main.py` — Flask (порт `7003` в коде).
  - `HostProviderSystem/TakeServerSystem/take_server_api/main.py` — Flask (порт `7002`).
  - `PaymentAPI/main.py` — FastAPI/uvicorn (порт `8000`).

Эти файлы содержат активные вызовы к базе и формируют текущую «живую» поверхность API — именно их и нужно считать источником правды при изменениях схемы БД.

**Если нужно сделать автоматически**

- Могу сгенерировать `ENDPOINTS.md` рядом с каждым entry-файлом с перечислением путей и используемых полей/параметров (на основе текущего кода).
- Могу также пройтись и создать файлы `config.example.py` с полями подключения и шаблонами переменных, или подготовить простые `Dockerfile` для каждого сервиса — скажите, что хотите автоматически получить.

---
Документация сгенерирована на основании текущего кода в корне репозитория — если требуется расширить секцию конкретного сервиса (например, точные форматы запросов/ответов), укажите сервис и я добавлю детали.
# Инкубатор: Описание микросервисной платформы

Кратко: этот репозиторий содержит набор независимых сервисов и фронтенд-частей, предназначенных для развёртывания в инфраструктуре провайдера. Каждый компонент — отдельный микросервис или статический сайт и запускается на нашей инфраструктуре (контейнеры, виртуальные машины или сервисы оркестрации).

**Структура (основные папки):**
- **Bot-Api-OxnMarket**: Маркетплейс бэкенд, .
  - Ключевые файлы: BotAddServices/api.py, BotAddServices/bot.py, BotAddServices/requirements.txt
- **HostProviderSystem**: набор внутренних сервисов провайдера.
  - Подсистемы: `Authorization/`, `MailSendAPI/`, `CryptoPaymentSystem/` (платёжная подсистема), `TakeServerSystem/`.
  - Типичные файлы в подсистемах: `config.py`, `defs.py`, `main.py`.
- **Oxnack_site**: статический фронтенд сайта.
  - HTML / CSS / JS: `index.html`, `host.html`, `css/`, `js/`, `partials/`, `site_files/`.
- **PaymentAPI**: отдельный API для платёжной логики.
  - Ключевые файлы: `PlategaAPI.py`, `main.py`, `UseDB.py`, `config.py`, `requirements.txt`.
- **PortfolioSite**: статический пример сайта/портфолио (`index.html`, `images/`, `scripts/`, `styles/`).
- **Proxy_bot**: прокси-бот (скрипт): `main.py`, `data.csv`.

**Как читать код и где смотреть:**
- По каждому сервису ищите `requirements.txt` (если есть) и `config.py`. Пример путей: `Bot-Api-OxnMarket/BotAddServices/requirements.txt`, `PaymentAPI/requirements.txt`, `HostProviderSystem/Authorization/config.py`.
- Точка входа для большинства сервисов — `main.py` или скрипты с очевидными названиями (`bot.py`, `api.py`, `PlategaAPI.py`).

**Общие рекомендации по развёртыванию (на нашей инфраструктуре):**
- Рекомендуемый подход: контейнеризация (Docker) и оркестрация (например, Kubernetes) — каждый сервис в собственном контейнере.
- Универсальный локальный запуск для разработки:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt   # выполнить в каталоге сервиса, если есть
python main.py                    # или соответствующий стартовый скрипт
```

- Конфигурация: не редактируйте репозиторные `config.py` с секретами. Используйте шаблоны или переменные окружения. Пример переменных (шаблон):

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
SERVICE_PORT=8000
SMTP_HOST=smtp.example.com
SMTP_USER=mailer@example.com
SMTP_PASSWORD=PLACEHOLDER
JWT_SECRET=PLACEHOLDER
```

Подключение секретов в инфраструктуре должно происходить через защищённый менеджер секретов или CI/CD переменные.

**Запуск в продакшн (рекомендации):**
- Собрать контейнер с приложением, установить переменные окружения и секреты на уровне оркестрации.
- Конфигурировать healthchecks и логирование. Использовать рестарт-политику и мониторинг.
- Сетевые правила: каждому сервису выделять внутренний порт и при необходимости проксировать через API-gateway или reverse-proxy.

**Карточки по сервисам (кратко, где что найти):**
- `Bot-Api-OxnMarket/` — боты и API-утилиты; смотрите `BotAddServices/api.py` и `BotAddServices/bot.py`.
- `HostProviderSystem/Authorization/` — модуль авторизации: `config.py`, `defs.py`, `main.py`.
- `HostProviderSystem/MailSendAPI/` — отправка почты: `config.py`, `defs.py`, `main.py`.
- `HostProviderSystem/CryptoPaymentSystem/` — платёжная подсистема (интерфейсы и логика): `config.py`, `defs.py`, `main.py`.
- `HostProviderSystem/TakeServerSystem/take_server_api/` — API для оформления/взятия серверов: `config.py`, `defs.py`, `main.py`.
- `Oxnack_site/` — публичная веб-часть; файлы для статической сборки/раздачи: `index.html`, `css/`, `js/`, `site_files/`.
- `PaymentAPI/` — вспомогательный платёжный API: `PlategaAPI.py`, `main.py`, `UseDB.py`, `config.py`.
- `PortfolioSite/` — пример статического сайта (для демонстрации или маркетинга).
- `Proxy_bot/` — утилитный бот/прокси: `main.py`.

**Зависимости и окружение:**
- По каждому сервису смотрите локальный `requirements.txt` и используйте виртуальные окружения или контейнеры. Для общих зависимостей — создавайте образ с предустановленными пакетами.

**Безопасность и секреты:**
- Никогда не коммитьте реальные токены, пароли или ключи.
- Для примера в репозитории могут быть пустые `config.py` или примеры `config.example.py`. Заполняйте их через CI/CD или защищённый vault.

**Тестирование и развёртывание:**
- Локальное тестирование: запускать сервисы по-отдельности (см. инструкции в каждом каталоге). Для интеграции организовать окружение с необходимыми зависимостями (БД, SMTP и т.д.).
- Продакшн: использовать контейнеры, применять healthchecks, централизованное логирование и мониторинг.

**Где смотреть код:**
- Файлы с бизнес-логикой обычно находятся в каталогах подсистем: `Authorization/`, `MailSendAPI/`, `TakeServerSystem/`, `PaymentAPI/`, `Bot-Api-OxnMarket/BotAddServices/`.

Если хотите — могу:
- добавить шаблоны `config.example` для каждого сервиса;
- сгенерировать простые Dockerfile для каждого сервиса;
- или собрать единый docker-compose файл для локальной отладки.

---
Документация составлена автоматически по структуре репозитория. Сообщите, если нужно расширить разделы для конкретного сервиса (например, `PaymentAPI` или `BotAddServices`).
