const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

function CombineAudio(FolderPath) {
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

    combinedAudio.mergeToFile(path.join(FolderPath, 'output.mp3'));
}

module.exports = CombineAudio;