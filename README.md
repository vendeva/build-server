## Build-server and several build-agents

-   Версия Node: 14.7.0,
-   Добавить в папку server .env с содержанием:
    API_TOKEN=...(ваш токен),
    PORT_SERVER=...(необходимый порт, по умолчанию 12345),
-   В папке server записывается agents.json с агентами и их статусами, по нему информация восстанавливается при запуске сервера, если агент не отвечает, он игнорируется.
-   Агент стучится на сервер в течение 10 мин через каждые 10 сек, если он не отвечает.
-   При запуске сервер ставит в очередь последний коммит на ветке из настроек, проверяет новые коммиты с периодом из настроек, если появляется новый коммит ставит в очередь сборок.
-   Агенты ставятся в очередь по сборкам в статусе Waiting, сервер обновляет информацию о сборках каждые 30 сек, если изменились настройки, ставит в очередь новую сборку по последнему коммиту.

### Запуск Build-server:

cd server && npm ci && npm start

### Запуск Build-agent:

cd agent && npm ci && PORT=.../установить порт, по умолчанию 8080/ npm start
