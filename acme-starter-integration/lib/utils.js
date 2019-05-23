const fs = require("mz/fs");
const childProcess = require("child_process");
const fetch = require("@zeit/fetch")(require("node-fetch"));
const uid = require("uid-promise");
const { quote } = require("shell-quote");

module.exports = {
  getTarball,
  extractTarball,
  getNowJson,
  fetchAndDeploy
};

const BASE_URL = "https://api.github.com";
const { GITHUB_TOKEN } = process.env;

async function exec(cmd, opts) {
  opts.maxBuffer = opts.maxBuffer || 1024 * 1024 * 10;
  return new Promise((resolve, reject) => {
    childProcess.exec(cmd, opts, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function getTarball() {
  const res = await fetch(`${BASE_URL}/repos/zeit/acme-starter/tarball`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`
    }
  });

  if (res.status !== 200) {
    throw new Error(`downloading tarball failed - ${await res.text()}`);
  }

  const filepath = `/tmp/${await uid(24)}.tar.gz`;
  const out = fs.createWriteStream(filepath);
  const final = res.body.pipe(out);

  await new Promise((resolve, reject) => {
    final.on("finish", resolve);
    res.body.on("error", reject);
    final.on("error", reject);
  });

  return filepath;
}

async function extractTarball(tarballPath) {
  const outDir = tarballPath.replace(".tar.gz", "");
  await fs.mkdir(outDir);
  await exec(`tar xzf ${quote([tarballPath])}`, {
    cwd: outDir
  });
  await exec(`mv * repo`, { cwd: outDir });
  return outDir;
}

async function getNowJson() {
  const res = await fetch(
    `${BASE_URL}/repos/zeit/acme-starter/contents/now.json`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`
      }
    }
  );

  if (res.status === 404) {
    return {};
  }

  if (res.status !== 200) {
    throw new Error("couldn't get now.json contents");
  }

  try {
    const { content } = await res.json();
    return JSON.parse(Buffer.from(content, "base64"));
  } catch (e) {
    const error = new Error(
      `Content of the now.json file does not contain valid JSON: ${e.stack}`
    );
    error.bail = true;
    return error;
  }
}

async function deploy({ nowJson, userZeitToken, extractedPath, currentDir }) {
  let name = nowJson.name;
  let nowCmd = `
    ${currentDir}/node_modules/.bin/now 
    --debug 
    --token=${userZeitToken}
    --name=${quote([name])}
  `;

  let stdout = "";
  let stderr = "";
  let deployPromise = null;

  function createError({ code, signal }) {
    const message = `
      App ${stdout ? `with url: ${stdout}` : ""}
      closed with code: ${code}, signal: ${signal} 
      ${stderr}
    `;
    const error = new Error(message);
    error.stdout = stdout;
    error.stderr = stderr;
    error.code = code;
    error.singal = signal;
    return error;
  }

  const shell = childProcess.spawn("/bin/sh", ["-c", nowCmd], {
    cwd: `${extractedPath}/repo`
  });

  shell.stdout.on("data", data => {
    stdout += data.toString();
    stdout = stdout.slice(-1000 * 10);
    if (/https/.test(stdout) && mainPromise) {
      const url = stdout
        .split("\n")
        .filter(l => /https/.test(l))
        .join("\n")
        .trim();

      mainPromise.resolve({
        url
      });
      mainPromise = null;
      shell.kill("SIGKILL");
    }
  });

  shell.stderr.on("data", data => {
    stderr += data.toString();
    stderr = stderr.slice(-1000 * 10);
  });

  shell.on("close", (code, signal) => {
    if (!mainPromise) {
      return;
    }
    mainPromise.reject(createError({ code, signal }));
  });

  return new Promise((resolve, reject) => {
    mainPromise = { resolve, reject };
  });
}

async function fetchAndDeploy(userZeitToken, currentDir) {
  const tarballPath = await getTarball();
  const extractedPath = await extractTarball(tarballPath);
  let nowJson = await getNowJson();
  const deployment = await deploy({
    nowJson,
    extractedPath,
    userZeitToken,
    currentDir
  });
  return deployment;
}
