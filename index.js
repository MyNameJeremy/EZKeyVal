const { readFileSync, writeFile, existsSync, lstatSync } = require('fs');
const { App, buildRes, serveFromFS, getBodyJSON } = require('@peter-schweitzer/ezserver');

const {
  port = '1337',
  route = '/ezkv',
  dataPath = './data.json',
  logging = false,
  DEBUG_ROUTS_ENABLED = false,
  aggressiveSync = false,
  noSync = false,
  syncInterval = 900000,
} = require('./config.json');

const LOG = console.log;
const WARN = console.warn;
const ERR = console.error;

let values = {};

/** @returns {void} */
function writeToFS() {
  try {
    writeFile(dataPath, JSON.stringify(values), { encoding: 'utf8', flag: 'w' });
  } catch (err) {
    ERR('unable to sync to FS', err);
  }
}

function readFromFS() {
  readFile(dataPath, (err, data) => {
    if (err) {
      ERR('error while reading from FS', err);
      existsSync(dataPath) || lstatSync(dataPath).isFile() || writeToFS();
    } else
      try {
        let vals = JSON.parse(data);
        values = vals;
      } catch (err) {
        ERR('error while parsing data', err);
      }
  });
}

function logInteraction(a, m, k, o, n = null) {
  LOG(`address: ${a} | method: ${m} | key: ${k} | (old) value: ${o}` + `${n === null ? '' : ` | new value: ${n}`}`);
}

readFromFS();
if (!aggressiveSync && !noSync) setInterval(readFromFS, syncInterval);


const app = new App();
app.listen(port);

app.add('/', (req, res) => {
  serveFromFS(res, './html/home.html');
});

if (DEBUG_ROUTS_ENABLED) {
  app.add('/debug/load', (req, res) => {
    buildRes(res, 'resyncing data', { code: 200, mime: 'text/plain' });
    readFromFS();
  });

  app.add('/debug/data', (req, res) => {
    serveFromFS(res, dataPath);
  });

  app.add('/debug/dump', (req, res) => {
    WARN('dump', values);
    buildRes(res, JSON.stringify(values), { code: 200, mime: 'application/json' });
  });

  app.add('/debug/reset', (req, res) => {
    WARN('reset', values);
    values = {};
    readFromFS();
    buildRes(res, 'resetting data', { code: 200, mime: 'text/plain' });
  });
}

app.addRoute(route, (req, res) => {
  buildRes(res, 'Bad Request\nmight use unsupported method', { code: 400, mime: 'text/plain' });
});

app.get(route, (req, res) => {
  const val = values[req.url];

  if (aggressiveSync) values = readFromFS();

  buildRes(res, JSON.stringify({ value: val }), { code: 200, mime: 'application/json' });

  logging && logInteraction(req.socket.remoteAddress, 'GET', req.url, val);
});

app.put(route, async (req, res) => {
  const { json, http_code } = await getBodyJSON(req);

  values[req.url] = !validation ? json.value : validator.validate(req.url, json.value) || values[req.url];
  res.writeHead(http_code).end();

  writeToFS();
  logging && logInteraction(req.socket.remoteAddress, 'PUT', req.url, old_val, values[req.url]);
});

