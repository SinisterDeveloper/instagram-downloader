# Instagram Downloader

### Download Instagram Reels and Posts easily and freely while at the same time, maintaining the same media quality as originally seen in Instagram. 
### Completely Ad-Free. 
### Optional 'Audio-Only' mode for Instagram Reels (10x lesser file size)

## Architecture

The application uses NodeJS-Express on the backend and Plain Javascript on the frontend. The server fetches the Instagram Media CDN link of the respective media(reel/post) and downloads the resource using HTTPS and FFMPEG, and then signals to the client to download the file on the device. Pretty simple and straightforward.

## Pre-Requisites

#### - NodeJS

#### - FFMPEG ((including all necessary encoding libraries like libmp3lame or libx264)

## Installation

#### Clone the repository using Github Desktop, or using Git on the command line:

```bash
git clone https://github.com/SinisterDeveloper/instagram-downloader.git
```

#### Navigate to the cloned repository

```bash
cd instagram-downloader
```

#### Install the Project Dependencies

```bash
npm install
```

#### Run the Application

```bash
npm start
```

You'll now be able to access the webpage at `http://localhost:5000`. If you have changed the PORT settings, it'll be available at `http://localhost:<PORT>`.


## Additional Configuration

#### PORT - You may change the PORT (defaulted to 5000) on which the application will run on. To do so, open the `index.js` file and modify the variable on the first line of the file to any valid PORT

## Support

If you face any issues, you may open an issue in the repository or email me at `thesinisterdev@gmail.com` and I will respond to your help ASAP

Have a great day!

