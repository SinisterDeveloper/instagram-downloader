const express = require('express');
const {readdirSync, createWriteStream, unlink} = require("fs");
const ffmpeg = require("ffmpeg");
const instagramGetUrl = require("instagram-url-direct");
const {join} = require("path");
const https = require("https");
const reelRouter = express.Router();

let isRunning = false;
const attempts = new Map();

reelRouter.get('/', function (req, res) {
	return res.sendFile(join(__dirname, 'reel.html'));
});

reelRouter.get('/video/:id', (req, res) => {
	const { id } = req.params;
	if (!id) return res.sendStatus(400);

	const video =  readdirSync('./reels').filter(e => e === `${id}.mp4`);
	if (!video) return res.sendStatus(404);
	isRunning = false;
	return res.download(`./reels/${video[0]}`);
});

reelRouter.get('/audio/:id', (req, res) => {
	const { id } = req.params;
	if (!id) return res.sendStatus(400);

	const audio =  readdirSync('./reels').filter(e => e === `${id}.mp3`);
	if (!audio) return res.sendStatus(404);
	isRunning = false;
	return res.download(`./reels/${audio[0]}`);
});

reelRouter.post('/audio/:id', async (req, res) => {
	const { id } = req.params;
	let video =  readdirSync('./reels').filter(e => e === `${id}.mp4`);
	if (!video.length) return res.sendStatus(404);
	video = video[0];

	try {
		console.log('Video File: ', video);
		const process = new ffmpeg(`./reels/${video}`);
		process.then(function (video) {
			video.fnExtractSoundToMP3(`./reels/${id}.mp3`, function (error) {
				if (error) {
					console.log(error);
					return res.sendStatus(500);
				}
				else
					return res.sendStatus(200);

			});
		}, function (err) {
			console.log(err);
			return res.sendStatus(500);
		});
	} catch (e) {
		console.log(e.code);
		console.log(e.msg);
	}
});

reelRouter.post('/video', async (req, res) => {
	const { link } = req.body;
	if (!link) return res.status(400).send('Link is required');
	if (attempts.get(req.ip) === 10) return res.status(429).send('Too many attempts');

	if (attempts.has(req.ip))
		attempts.set(req.ip, attempts.get(req.ip) + 1);
	else
		attempts.set(req.ip, 1);

	const fileId = Date.now().toString();
	try {
		let links = await instagramGetUrl(link);
		if (!links || links['results_number'] === 0) return res.status(404).send('No video found');

		const downloadLink = links['url_list'][0];
		const filePath = join(__dirname, 'reels', `${fileId}.mp4`);

		const file = createWriteStream(filePath);

		https.get(downloadLink, (response) => {
			if (response.statusCode !== 200) {
				console.error('Failed to download the video, status code:', response.statusCode);
				return res.status(500).send('Failed to download video');
			}
			response.pipe(file);

			file.on('finish', () => {
				file.close(() => {
					isRunning = true;
					const attemptClear = setInterval(() => {
						if (!attempts.has(req.ip) || attempts.get(req.ip) === 0) {
							return clearInterval(attemptClear);
						}
						attempts.set(req.ip, attempts.get(req.ip) - 1);
					}, 1000 * 60);

					return res.json({
						id: fileId,
					});
				});
			});

			file.on('error', (fileErr) => {
				console.error('Error writing file:', fileErr);
				res.status(500).send('Error saving the video');
				unlink(filePath, () => {}); s
			});
		}).on('error', (err) => {
			console.error('Error downloading the video:', err.message);
			res.status(500).send('Error downloading video');
			unlink(filePath, () => {});
		});

	} catch (err) {
		console.error('Error processing request:', err.message);
		res.status(500).send('Internal server error');
	}
});

setInterval(() => {
	if(!isRunning) {
		const files = readdirSync('./reels');
		for (const file of files)
			unlink(`./reels/${file}`, () => {});

	}
}, 1000 * 60 * 5);

module.exports = reelRouter;