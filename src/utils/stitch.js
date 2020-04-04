const { concat: videoConcat } = require('video-stitch');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('ffmpeg-static').path.replace('app.asar', 'app.asar.unpacked');
const hbjs = require('handbrake-js');
const uuidv4 = require('uuid/v4');

process.env.PATH = ffmpeg;

const videosToStitch = [];

function convertVideo(video, outputPath, outputName) {
  return new Promise((resolve, reject) => {
    const fileName = outputName.split('/').pop();
    const dir = `${outputPath}/ConvertedFiles`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    const convertedOutputPath = `${outputPath}/ConvertedFiles/${fileName}`;

    hbjs.spawn(
      {
        input: video,
        preset: 'General/Fast 1080p30',
        output: convertedOutputPath,
      },
    )
      .on('error', (err) => {
        reject(err);
      })
      .on('complete', () => {
        resolve();
      });
  });
}

module.exports = function stitchVideos(
  addedFileName,
  outputPath,
  introVideoPath,
  stitchedVideoName,
  outroVideoPath,
) {
  const timeStamp = moment().format('MMM-DD-YYYY-HH.mm.ss');
  const videos = [introVideoPath, addedFileName];

  if (outroVideoPath) {
    videos.push(outroVideoPath);
  }

  videos.forEach((video) => {
    const fileName = video.split('/').pop();
    videosToStitch.push({
      video,
      outputPath,
      outputFileName: `${outputPath}/ConvertedFiles/${fileName.split('.mp4')[0]}_${uuidv4()}_converted.mp4`,
    });
  });

  const conversions = videosToStitch.map(video => convertVideo(
    video.video, video.outputPath, video.outputFileName,
  ));

  Promise.all(conversions).then(() => {
    const convertedIntroVideo = videosToStitch[0].outputFileName;
    const convertedReactionVideo = videosToStitch[1].outputFileName;
    const convertedOutroVideo = videosToStitch[2] ? videosToStitch[2].outputFileName : '';

    return videoConcat({
      silent: true,
      overwrite: false,
    })
      .clips([
        {
          fileName: convertedIntroVideo,
        },
        {
          fileName: convertedReactionVideo,
        },
        {
          fileName: convertedOutroVideo,
        },
      ])
      .output(path.join(outputPath, `${stitchedVideoName}_${timeStamp}.mp4`))
      .concat()
      .then((outputFileName) => {
        console.log('SUCCESS', outputFileName);
      });
  })
    .catch((err) => {
      console.log(err);
    });
};
