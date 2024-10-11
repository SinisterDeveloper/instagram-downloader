window.onload = async () => {
	const downloadForm = document.getElementById('download');
	downloadForm.addEventListener('submit', async (e) => {
		e.preventDefault();

		const formData = new FormData(downloadForm);

		const isAudioChecked = document.getElementById('audio').checked;

		const link = formData.get('link');
		if(!link.trim().startsWith('https://www.instagram.com/reel/')) return alert('Enter a valid Instagram reel link!');
		document.getElementById('status').textContent = 'Download request sent! Server is extracting the content...';
		document.getElementById('downloader').disabled = true;

		let res = await fetch(
			`${window.location.protocol}//${window.location.host}/reel/video`,
			{
				method: 'POST',
				headers: {
					'Content-type':
						'application/json; charset=UTF-8',
				},
				body: JSON.stringify({
					link: link
				})
			},
		);

		if (!res.ok) {
			switch (res.status) {
				case 400:
					alert('You need to enter a link!');
					break;
				case 429:
					alert('Too many requests! Try again later');
					break;
				default:
					alert('Unexpected Server Error: The media may be private. If not, please try again later or check server console for error logs');
					break;
			}
			return;
		}
		res = await res.json();
		if (isAudioChecked) {
			document.getElementById('status').textContent = 'Extracting Audio from the Video file...';

			await fetch(`${window.location.protocol}//${window.location.host}/reel/audio/${res.id}/`, {
				method: 'POST'
			});
			window.location.assign(`${window.location.protocol}//${window.location.host}/reel/audio/${res.id}`);
		}
		else {
			document.getElementById('status').textContent = 'Received File! Downloading...';
			window.location.assign(`${window.location.protocol}//${window.location.host}/reel/video/${res.id}`);
		}
		document.getElementById('status').textContent = 'Downloaded!';
		document.getElementById('downloader').disabled = false;
		document.getElementById('link').value = '';
	});
}
