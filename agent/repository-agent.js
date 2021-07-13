const path = require("path");
const {
    instance,
    execPromise,
    execFilePromise,
    useLocalPath,
    useAgentPath,
    port,
} = require("./config-agent");

class Helper {
    constructor() {
        this.isRegistered = false;
        this.work = false;
    }

    buildStart = async (buildId, repoName, commitHash, buildCommand) => {
        console.log("Параметры для сборки:");
        console.log({ buildId, repoName, commitHash, buildCommand });
        await execFilePromise("rm", ["-rf", `Agent_${port}/`], {
            cwd: useLocalPath,
        });
        await execFilePromise("git", ["clone", repoName, `Agent_${port}/`], {
            cwd: useLocalPath,
        });
        await execFilePromise("git", ["checkout", commitHash], {
            cwd: useAgentPath,
        });
        console.log("Началась сборка...");
        await execPromise("npm ci", {
            cwd: useAgentPath,
        });
        console.log("Установлены зависимости...");
        const { stdout, stderr } = await execPromise(`${buildCommand}`, {
            cwd: useAgentPath,
        });
        const buildLog = `${stdout} ${stderr}`;

        await this.sendResultServer(buildId, true, buildLog);
    };

    async sendResultServer(buildId, success, buildLog) {
        console.log("Send results on build server...");

        try {
            await instance.post("/notify-build-result", {
                buildId,
                success,
                buildLog,
            });

            console.log("The data was sent successfully");
        } catch (e) {
            console.log(e.message);
        }
    }
}

module.exports = { Helper };
