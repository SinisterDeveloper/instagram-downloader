const express = require('express');
const compression = require("compression");
const {join} = require("path");
const reelRouter = require("./reel");
const postRouter = require("./post");

const app = express();

app.use(compression());
app.use(express.json());
app.use('/reel', reelRouter);
app.use('/post', postRouter);

app.get('/', function (req, res) {
	return res.sendFile(join(__dirname, 'index.html'));
});

app.get('/scripts/*', (req, res) => {
	let fileName = req.path.split('/');
	fileName = fileName[fileName.length - 1];
	return res.sendFile(join(__dirname, 'scripts', fileName));
});

app.listen(6969, () => console.log('Server running on http://localhost:6969'));
