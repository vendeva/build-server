const { instance } = require("./config-server");
const axios = require("axios");

const getSettings = async (storage) => {
    try {
        const { data } = await instance.get("/conf");
        storage.settings = data.data;
        //console.log("get settings: ", data);
    } catch (e) {
        console.log(`Request to YandexApi '/conf' fail with ${e.message}`);
        return;
    }
};

const getBuilds = async () => {
    try {
        const { data } = await instance.get("/build/list");
        return data;
    } catch (e) {
        console.log(`Request to YandexApi 'build/list' fail with ${e.message}`);
        return;
    }
};
// Поставить коммит на сборку
const startNewBuild = async (commitMessage, commitHash, branchName, authorName) => {
    try {
        await instance.post("/build/request", {
            commitMessage,
            commitHash,
            branchName,
            authorName,
        });
    } catch (e) {
        console.log(`Request to YandexApi 'build/request' fail with ${e.message}`);
        return;
    }
};

const startBuildByApi = async (agent, params) => {
    console.log(`Start build on agent ${agent.url}`);
    // Проверка работает ли билд агент
    try {
        const { data } = await axios.get(`${agent.url}`);
        console.log(`The agent ${agent.url} answer`, data);
    } catch (e) {
        console.log(`The agent ${agent.url} did not work`, e.message);
        return;
    }
    // Отправка данных в базу Яндекса о начале сборки
    try {
        await instance.post("/build/start", {
            buildId: params.buildId,
            dateTime: agent.start.toISOString(),
        });
    } catch (e) {
        console.log(`Request to YandexApi 'build/start' fail with ${e.message}`);
        return;
    }
    // Отправка данных билдагенту начать сборку, получить логи
    try {
        const { data } = await axios.post(`${agent.url}/build`, params);
        console.log(`Build agent ${agent.url} end build with answer: ${data}`);
    } catch (e) {
        console.log("The agent did not take the build to work", e.message);
        return;
    }
};
// Отправка данных в базу Яндекса о результатах сборки
const finishBuildByApi = async (buildId, start, success, buildLog) => {
    const end = new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 60000);
    console.log("Send data about the results of the build to the database");
    try {
        await instance.post("/build/finish", {
            buildId,
            duration,
            success,
            buildLog: JSON.stringify(buildLog),
        });
    } catch (e) {
        console.log(`Request to YandexApi 'build/finish' fail with ${e.message}`);
        return;
    }
};

module.exports = {
    getSettings,
    getBuilds,
    startNewBuild,
    startBuildByApi,
    finishBuildByApi,
};
