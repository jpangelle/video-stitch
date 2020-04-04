const chokidar = require('chokidar');
const stitchVideos = require('./stitch.js');

const runningProcesses = [];

function watchFolder({
  directoryOutput,
  directoryWatch,
  fileName,
  id,
  introVideoPath,
  outroVideoPath,
}) {
  const watchedProcess = chokidar.watch(directoryWatch, {
    ignoreInitial: true,
  }).on('add', async (addedFileName) => {
    await new Promise(resolve => setTimeout(resolve, 120 * 1000));
    const aviMp4RegEx = /^.*\.(mp4|avi)$/gmi;
    if (aviMp4RegEx.test(addedFileName)) {
      stitchVideos(`${addedFileName}`, directoryOutput, introVideoPath, fileName, outroVideoPath);
    }
  });

  const processes = {
    id,
    watch: watchedProcess,
  };
  runningProcesses.push(processes);
}

function stopWatch({ id }) {
  const { watch } = runningProcesses.filter(item => item.id === id)[0];
  if (watch) {
    const index = runningProcesses.findIndex(item => item.id === id);
    runningProcesses[0].watch.close();
    runningProcesses.splice(index, 1);
  }
}

module.exports = { stopWatch, watchFolder };
