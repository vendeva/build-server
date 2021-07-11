const cors = require("cors");
const express = require("express");
const axios = require("axios");
const config = require("./server-conf.json");
const { instance, execPromise } = require("./config-server");
const { BUSY, FREE } = require("./constants.js");
const { startBuild, finishBuild } = require("./yandexApi");

class Storage {
    constructor() {
        this.settings = {
            repoName: null,
            buildCommand: null,
            mainBranch: null,
            period: null,
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

        await startBuild(agent, params);
    };

    changeAgentStatus(agent, status, buildId, start = null) {
        agent.status = status;
        agent.buildId = buildId;
        agent.start = start;
    }

    buildStart = async (buildId, repoName, commitHash, buildCommand) => {
        console.log(buildId, repoName, commitHash, buildCommand);
    };
}

module.exports = { Storage };
