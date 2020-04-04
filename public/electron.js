const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
/* eslint-disable-next-line */
} = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const uuid = require('uuid/v4');
const { stopWatch, watchFolder } = require('../src/utils/watch');

const userData = app.getPath('userData');
const processesPath = `${userData}/processes.json`;
let processes;

const myWindow = null;

const shouldQuit = app.makeSingleInstance(() => {
  if (myWindow) {
    if (myWindow.isMinimized()) myWindow.restore();
    myWindow.focus();
  }
});

if (shouldQuit) {
  app.quit();
}

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    height: 750,
    width: 1220,
    minHeight: 750,
    minWidth: 1220,
  });
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(`${__dirname}/../build/index.html`),
    protocol: 'file:',
    slashes: true,
  });

  mainWindow.loadURL(startUrl);
  function fixFile() {
    fs.exists(processesPath, (exists) => {
      if (!exists) {
        fs.writeFile(processesPath, JSON.stringify({ processes: [] }));
      } else {
        fs.readFile(processesPath, (err, data) => {
          if (data) {
            const fetchedProcesses = JSON.parse(data);
            if (!fetchedProcesses.processes || !Array.isArray(fetchedProcesses.processes)) {
              fs.writeFile(processesPath, JSON.stringify({ processes: [] }));
            }
          } else {
            fs.writeFile(processesPath, JSON.stringify({ processes: [] }));
          }
        });
      }
    });
  }

  function startProcesses(data) {
    const processesToStart = processes.processes.filter(item => data.includes(item.id));
    processesToStart.forEach(async (singleProcess) => {
      try {
        watchFolder(singleProcess);
        mainWindow.webContents.send('startProcesses', 'successStartingWatch');
      } catch (err) {
        mainWindow.webContents.send('startProcesses', 'errorStartingWatch');
      }
    });
    const updatedProcesses = processes.processes.map((item) => {
      if (data.includes(item.id)) {
        /* eslint-disable-next-line */
        item.status = true;
      }
      return item;
    });
    processes = { processes: updatedProcesses };
  }

  fixFile();

  ipcMain.on('directoryWatchSelect', () => {
    const directories = dialog.showOpenDialog({ properties: ['openDirectory'] });
    mainWindow.webContents.send('directoryWatchSelect', directories);
  });

  ipcMain.on('directoryOutputSelect', () => {
    const directories = dialog.showOpenDialog({ properties: ['openDirectory'] });
    mainWindow.webContents.send('directoryOutputReceived', directories);
  });

  ipcMain.on('mp4Select', () => {
    const files = dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Movies', extensions: ['mp4'] }] });
    mainWindow.webContents.send('fileReceived', files);
  });

  ipcMain.on('saveProcess', async (event, {
    autoStartService,
    directoryOutput,
    directoryWatch,
    fileName,
    introVideoPath,
    outroVideoPath,
  }) => {
    const processData = {
      id: uuid(),
      status: autoStartService,
      directoryOutput,
      directoryWatch,
      fileName,
      introVideoPath,
      outroVideoPath,
    };
    processes.processes.push(processData);
    try {
      await fs.writeFile(processesPath, JSON.stringify(processes));
      if (autoStartService) {
        startProcesses([processData.id]);
      }
      mainWindow.webContents.send('saveProcess', 'success');
      mainWindow.webContents.send('getProcesses', processes.processes);
    } catch (err) {
      mainWindow.webContents.send('getProcesses', 'errorSavingProcess');
    }
  });

  ipcMain.on('getProcesses', () => {
    try {
      fs.readFile(processesPath, (err, data) => {
        processes = JSON.parse(data);
        mainWindow.webContents.send('getProcesses', processes.processes);
      });
    } catch (err) {
      mainWindow.webContents.send('getProcesses', 'errorSavingProcess');
    }
  });

  ipcMain.on('deleteProcesses', async (event, data) => {
    const filteredProcesses = processes.processes.filter(item => !data.includes(item.id));
    processes = { processes: filteredProcesses };
    try {
      await fs.writeFile(processesPath, JSON.stringify(processes));
      mainWindow.webContents.send('deleteProcesses', processes.processes);
    } catch (err) {
      mainWindow.webContents.send('deleteProcesses', 'errorDeletingProcess');
    }
  });

  ipcMain.on('startProcesses', async (event, data) => {
    startProcesses(data);
    try {
      await fs.writeFile(processesPath, JSON.stringify(processes));
      mainWindow.webContents.send('getProcesses', processes.processes);
    } catch (err) {
      mainWindow.webContents.send('getProcesses', 'errorDeletingProcess');
    }
  });

  ipcMain.on('stopProcesses', async (event, data) => {
    const processesToStop = processes.processes.filter(item => data.includes(item.id));
    processesToStop.forEach(async (singleProcess) => {
      try {
        await stopWatch(singleProcess);
        mainWindow.webContents.send('stopProcesses', 'successStoppingWatch');
      } catch (err) {
        mainWindow.webContents.send('stopProcesses', 'errorStoppingWatch');
      }
    });
    const updatedProcesses = processes.processes.map((item) => {
      if (data.includes(item.id)) {
        /* eslint-disable-next-line */
        item.status = false;
      }
      return item;
    });
    processes = { processes: updatedProcesses };
    try {
      await fs.writeFile(processesPath, JSON.stringify(processes));
      mainWindow.webContents.send('getProcesses', processes.processes);
    } catch (err) {
      mainWindow.webContents.send('getProcesses', 'errorChangingStatusToFalse');
    }
  });
});

app.on('will-quit', async () => {
  processes.processes.forEach(async (singleProcess) => {
    await stopWatch(singleProcess);
  });
  const updatedProcesses = processes.processes.map((item) => {
    /* eslint-disable-next-line */
    item.status = false;
    return item;
  });
  processes = { processes: updatedProcesses };
  try {
    await fs.writeFile(processesPath, JSON.stringify(processes));
  } catch (err) {
    console.log(err);
  }
});
