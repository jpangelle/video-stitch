const net = require('net');
const { spawn } = require('child_process');

const port = process.env.PORT ? (process.env.PORT - 100) : 3000;

process.env.ELECTRON_START_URL = `http://localhost:${port}`;

const client = new net.Socket();

let startedElectron = false;
const tryConnection = () => client.connect({ port }, () => {
  client.end();
  if (!startedElectron) {
    console.log('starting electron');
    startedElectron = true;
    const child = spawn('npm', ['run', 'electron']);
    child.stdout.on('data', (data) => {
      console.log(`child stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`child stderr: ${data}`);
    });
    child.on('exit', (code, signal) => {
      console.log(`child process exited with code ${code} and signal ${signal}`);
    });
  }
});

tryConnection();

client.on('error', () => {
  setTimeout(tryConnection, 1000);
});
