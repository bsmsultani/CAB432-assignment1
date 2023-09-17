const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');


// Combine the audio files in the folder into one file
// the audio files are fragmented because of the way the audio is generated, each sentence is saved to a 
    //separate file because they come from different voices
// each file is named with a number, and the files are combined in order
// the combined file is saved to the output path
// the fragmented audio files are deleted


function CombineAudio(FolderPath, outputPath) {
    console.log("Combining audio files...")
    
    // Read the audio files from the folder
    let audioFiles = fs.readdirSync(FolderPath)
        .filter((file) => file.endsWith('.mp3'))
        .map((file) => {
            const num = parseInt(path.basename(file, '.mp3'));
            return { num, path: path.join(FolderPath, file) };
        })
        .sort((a, b) => a.num - b.num);
    
    // Combine the audio files

    const combinedAudio = ffmpeg();
    audioFiles.forEach((audioFile) => {
        combinedAudio.input(audioFile.path);
    });

    combinedAudio.on('error', (err) => {
        console.log('An error occurred: ' + err.message);
    });

    combinedAudio.on('end', () => {
        // delete the fragmented audio files
        audioFiles.forEach((audioFile) => {
            fs.unlinkSync(audioFile.path);
        });
        
        console.log('Audio files combined successfully!');
    });

    combinedAudio.mergeToFile(outputPath);
}

module.exports = CombineAudio;