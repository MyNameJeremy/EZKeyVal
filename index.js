const { readFileSync, writeFile, existsSync, lstatSync } = require('fs');

const { App, buildRes, serveFromFS, getBodyJSON } = require('@peter-schweitzer/ezserver');

const { port, route, dataPath, logging = false, aggressiveSync = false, syncInterval = 900000 } = require('./config.json');

const LOG = console.log;
const WARN = console.warn;
const ERR = console.error;

let values = {};

/** @returns {void} */
function writeToFS() {
  try {
    writeFile(dataPath, JSON.stringify(values), { encoding: 'utf8', flag: 'w' }).catch;
  } catch (err) {
    ERR('unable to sync to FS', err);
  }
}

/** @returns {Object<string, any>} */
function readFromFS() {
  try {
    values = !existsSync(dataPath)
      ? ERR("path doesn't exist", dataPath)
      : !lstatSync(dataPath).isFile()
      ? ERR('path is not a file', dataPath)
      : JSON.parse(readFileSync(dataPath));
  } catch (error) {
    values = ERR(`error while parsing ${dataPath}`, dataPath) || values;
  }
}

function logInteraction(a, m, k, v, n = null) {
  LOG(`ip: ${a} | method: ${m} | key: ${k} | value: ${v}${n !== null ? ` | [new value]: ${n}` : ''}`);
}

readFromFS();
if (!aggressiveSync) setInterval(readFromFS, syncInterval);

const app = new App(port);

app.addResolver('/', (req, res) => {
  serveFromFS(res, './EZServer/html/home.html');
});

app.endpoints.add(route, (req, res) => {
  buildRes(res, 'Bad Request\nmight use unsupported method', { code: 400, mime: 'text/plain' });
});

app.rest.get(route, (req, res) => {
  const val = values[key] || null;
  const key = req.url.substring(route.length + 1);

  if (aggressiveSync) values = readFromFS();

  buildRes(res, JSON.stringify({ value: val }), { code: 200, mime: 'application/json' });

  logging && logInteraction(log_msg, req.socket.remoteAddress, 'GET', key, val);
});

app.rest.put(route, async (req, res) => {
  const old_val = values[key];

  const key = req.url.substring(route.length + 1);
  const { json, http_code } = await getBodyJSON(req);

  values[key] = json.value || old_val;
  res.writeHead(http_code).end();

  writeToFS();
  logging && logInteraction(log_msg, req.socket.remoteAddress, 'PUT', key, old_val, values[key]);
});

