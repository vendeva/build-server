const cors = require("cors");
const express = require("express");
const axios = require("axios");
const config = require("./agent-conf.json");
const {
    instance,
    execPromise,
    execFilePromise,
    useLocalPath,
    useLogsPath,
} = require("./config-agent");

class Helper {
    constructor() {
        this.isRegistered = false;
        // this.buildId = null;
        // this.success = null;
        // this.buildLog = null;
    }

    buildStart = async (buildId, repoName, commitHash, buildCommand) => {
        console.log(buildId, repoName, commitHash, buildCommand);
        await execFilePromise("rm", ["-rf", "localRepository/"]);
        await execFilePromise("git", ["clone", repoName, "localRepository"]);
        await execFilePromise("git", ["checkout", commitHash], {
            cwd: useLocalPath,
        });
        const { error, stdout, stderr } = await execPromise(`${buildCommand}`, {
            cwd: useLocalPath,
        });
        console.log(error, stdout, stderr);
    };
}

module.exports = { Helper };
