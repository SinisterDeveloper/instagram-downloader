const ffmpeg = require('ffmpeg');

try {
	const process = new ffmpeg('process.mp4');
	process.then(function (video) {
		video.fnExtractSoundToMP3('processed.mp3', function (error, file) {
			if (!error)
				console.log('Audio file: ' + file);
		});
	}, function (err) {
		console.log('Error: ' + err);
	});
} catch (e) {
	console.log(e.code);
	console.log(e.msg);
}