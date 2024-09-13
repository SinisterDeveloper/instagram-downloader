const express = require('express');
const compression = require("compression");
const {join} = require("path");
const { readdirSync, createWriteStream, unlink } = require('fs');
const instagramGetUrl = require("instagram-url-direct")
const path = require("node:path");
const https = require('https');

const app = express();

app.use(compression());
app.use(express.json());
const attempts = new Map();

app.get('/', function (req, res) {
	return res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/download/:id', (req, res) => {
	const { id } = req.params;
	if (!id) return res.sendStatus(400);

	const video =  readdirSync('./downloads').filter(e => e === `${id}.mp4`);
	if (!video) return res.sendStatus(404);

	return res.download(`./downloads/${video}`);
});

app.post('/insta', async (req, res) => {
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
		const filePath = path.join(__dirname, 'downloads', `${fileId}.mp4`);

		const file = createWriteStream(filePath);

		https.get(downloadLink, (response) => {
			if (response.statusCode !== 200) {
				console.error('Failed to download the video, status code:', response.statusCode);
				return res.status(500).send('Failed to download video');
			}
			response.pipe(file);

			file.on('finish', () => {
				file.close(() => {
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

app.listen(6969, () => console.log('Listening!'));