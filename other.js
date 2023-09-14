

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



generateVideo("abc", "chatcmpl-7yFBtd6hBFIk83Lk3olyO2Fdpnl2c");

module.exports = generateVideo;

