const express = require('express');
const archiver = require('archiver');
const {readdirSync, createWriteStream, unlink, mkdirSync, rmSync} = require("fs");
const instagramGetUrl = require("instagram-url-direct");
const {join} = require("path");
const https = require("https");
const postRouter = express.Router();

let isRunning = false;
const attempts = new Map();

postRouter.get('/', function (req, res) {
	return res.sendFile(join(__dirname, 'post.html'));
});

postRouter.get('/media/:id', (req, res) => {
	const { id } = req.params;
	if (!id) return res.sendStatus(400);

	const media =  readdirSync('./posts').filter(e => e === `${id}.zip`);
	if (!media.length) return res.sendStatus(404);
	isRunning = false;
	return res.download(`./posts/${media[0]}`);
});

postRouter.post('/media', async (req, res) => {
	const { link } = req.body;
	if (!link) return res.status(400).send('Link is required');
	if (attempts.get(req.ip) === 10) return res.status(429).send('Too many attempts');

	if (attempts.has(req.ip))
		attempts.set(req.ip, attempts.get(req.ip) + 1);
	else
		attempts.set(req.ip, 1);

	const timestamp = Date.now().toString();
	try {
		let links = await instagramGetUrl(link);
		if (!links || links['results_number'] === 0) return res.status(404).send('No media found');

		mkdirSync(`./posts/${timestamp}`);
		const promises = links['url_list'].map((link, i) => downloadMedia(link, i, timestamp));
		await Promise.all(promises);

		const directoryPath = join(__dirname, 'posts', timestamp);

		const archive = archiver('zip', {
			zlib: { level: 9 }
		});
		archive.pipe(createWriteStream(`./posts/${timestamp}.zip`));

		archive.directory(directoryPath, false);
		await archive.finalize();

		await res.json({
			id: timestamp,
		});

		rmSync(`./posts/${timestamp}`, {
			force: true,
			recursive: true
		});
	} catch (err) {
		console.error('Error processing request:', err.message);
		res.status(500).send('Internal server error');
	}
});

async function downloadMedia(link, i, timestamp) {
	const filePath = join(__dirname, 'posts', timestamp, `${i + 1}.${link.includes('mp4') ? 'mp4' : 'jpg'}`);
	const file = createWriteStream(filePath);
	return new Promise((resolve, reject) => {
		https.get(link, (response) => {
			if (response.statusCode !== 200) {
				console.error('Failed to download the media, status code:', response.statusCode);
				return reject(new Error('Failed to download media'));
			}
			response.pipe(file);
			file.on('finish', () => {
				file.close(() => {
					resolve();
				});
			});
			file.on('error', (fileErr) => {
				console.error('Error writing file:', fileErr);
				reject(new Error('Error saving the media'));
			});
		});
	});
}

setInterval(() => {
	if(!isRunning) {
		const files = readdirSync('./posts');
		for (const file of files)
			unlink(`./posts/${file}`, () => {});

	}
}, 1000 * 60 * 5);

module.exports = postRouter;