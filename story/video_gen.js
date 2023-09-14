const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const outputVideo = 'output.mp4';

const command = ffmpeg();

let videoPath;
let audioPath;
let imagePath;



async function generateVideo(videoName, videoId) {
    videoPath = path.join(`../movies/${videoId}/${videoName}.mp4`);
    audioPath = path.join(`../movies/${videoId}/audio/`);
    imagePath = path.join(`../movies/${videoId}/images/`);
    // read files in order to get the number of files

    // order them

    let audiosFiles = fs.readdirSync(audioPath).map(fileNum => {
        let num =  parseInt(fileNum.split('.')[0]);
        return num;
    }).sort((a, b) => a - b);

    let imagesFiles = fs.readdirSync(imagePath).map(fileNum => {
        let num = parseInt(fileNum.split('.')[0]);
        return num;
    }).sort((a, b) => a - b);

    const audioImageMapping = {};

    diff = 0

    imagesFiles.forEach((imageNum, index) => {
        console.log("using image: " + imageNum);
        
        if (index + 1 < imagesFiles.length) {
          const start = audiosFiles.indexOf(imageNum);
          const end = audiosFiles.indexOf(imagesFiles[index + 1]);
          
          if (start !== -1 && end !== -1) {
            for (let i = start; i < end; i++) {
                const audioFile = audiosFiles[i];

                if (audioImageMapping[imageNum] === undefined) {
                    audioImageMapping[imageNum] = [];
                }

                audioImageMapping[imageNum].push(audioFile);
            }
          } else {
            console.log("Audio files not found for this image range.");
          }
        } else {
          // Handle the last image differently
          const start = audiosFiles.indexOf(imageNum);
          
          if (start !== -1) {
            for (let i = start; i < audiosFiles.length; i++) {
                const audioFile = audiosFiles[i];

                if (audioImageMapping[imageNum] === undefined) {
                    audioImageMapping[imageNum] = [];
                }
                audioImageMapping[imageNum].push(audioFile);
            }
          } else {
            console.log("Audio files not found for the last image.");
          }
        }
      });

      console.log(audioImageMapping);

      CombineAudioAndImage(2, [1, 2, 3]);
}


async function CombineAudioAndImage(imageFile, audioArray) {
  const audioFiles = audioArray.map(audio => path.join(audioPath, audio + '.mp3'));
  const image = path.join(imagePath, imageFile + '.png');

  console.log("audio: " + audioFiles);

  // Calculate the total duration of audio files
  let totalAudioDuration = 0;

  // Use Promise.all to probe each audio file asynchronously
  await Promise.all(audioFiles.map(async audio => {
      return new Promise((resolve, reject) => {
          ffmpeg.ffprobe(audio, (err, metadata) => {
              if (err) {
                  reject(err);
              } else {
                  totalAudioDuration += parseFloat(metadata.format.duration);
                  resolve();
              }
          });
      });
  }));

  // Add the image as the video stream and loop it until the audio finishes
  command.input(image)
      .inputOptions('-loop 1')
      .videoCodec('libx264') // Video codec (you can use other codecs as well)
      .duration(totalAudioDuration); // Set the output duration to match total audio duration

  // Add the audio files as audio streams
  audioFiles.forEach(audio => {
      command.input(audio);
  });

  // Combine the streams and set the output file format and path
  command.output('output.mp4')
      .audioCodec('libfdk_aac') // Audio codec (you can use other codecs as well)
      .on('start', function (commandLine) {
          console.log('Spawned Ffmpeg with command: ' + commandLine);
      })
      .on('end', function () {
          console.log('Finished processing');
      })
      .on('error', function (err) {
          console.log('An error happened: ' + err.message);
      });

  // Run the FFmpeg command
  command.run();
}




generateVideo("abc", "chatcmpl-7yFBtd6hBFIk83Lk3olyO2Fdpnl2c");

module.exports = generateVideo;

