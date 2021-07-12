const cors = require("cors");
const express = require("express");
const axios = require("axios");
const config = require("./server-conf.json");
const { instance, execPromise } = require("./config-server");
const { BUSY, FREE } = require("./constants.js");
const { startBuildByApi, finishBuildByApi } = require("./yandexApi");

class Storage {
    constructor() {
        this.settings = {
            repoName: null,
            buildCommand: null,
            mainBranch: null,
            period: null,
            lastCommitHash: null,
        };
        this.builds = [];
        // Убрать данные из this.agents
        this.agents = [
            {
                url: "http://127.0.0.1:3000",
                status: "FREE",
                buildId: null,
                start: null,
            },
        ];
    }

    getAgentByBuildId(buildId) {
        console.log(this.agents);
        return this.agents.find((agent) => agent.buildId === buildId);
    }

    registerAgent = (host, port) => {
        const url = `${host}:${port}`;

        if (this.agents.some((agent) => agent.url === url)) return;

        console.log(`the new agent is working ${url}`);
        //Вернуть!
        // this.agents.push({
        //     url,
        //     status: FREE,
        //     buildId: null,
        //     start: null,
        // });
    };

    searchWaitingBuilds = async (builds) => {
        this.builds = builds.filter((build) => build.status === "Waiting");
        console.log(this.builds);
        if (this.builds.length !== 0) {
            await this.searchFreeAgent();
        }
    };

    searchFreeAgent = async () => {
        const freeAgents = this.agents.filter((agent) => agent.status === FREE);
        if (freeAgents.length) {
            console.log("a free agent was found");
            await this.sendBuildToAgent(freeAgents[0]);
        } else {
            console.log("there is no free agent yet");
            setTimeout(this.searchFreeAgent, 10000);
        }
    };

    sendBuildToAgent = async (agent) => {
        const build = this.builds[0];
        const params = {
            repoName: this.settings.repoName,
            buildCommand: this.settings.buildCommand,
            buildId: build.id,
            commitHash: build.commitHash,
        };

        this.changeAgentStatus(agent, BUSY, build.id, new Date());

        await startBuildByApi(agent, params);
    };

    changeAgentStatus(agent, status, buildId = null, start = null) {
        agent.status = status;
        agent.buildId = buildId;
        agent.start = start;
    }

    buildFinish = async (buildId, success, buildLog) => {
        const agent = this.getAgentByBuildId(buildId);
        console.log(`agent has successfully completed work ${agent.url}`);
        await finishBuildByApi(buildId, agent.start, success, buildLog);

        this.changeAgentStatus(agent, FREE);
    };
}

module.exports = { Storage };
