window.onload = async () => {
	const downloadForm = document.getElementById('download');
	downloadForm.addEventListener('submit', async (e) => {
		e.preventDefault();

		const formData = new FormData(downloadForm);
		// https://www.instagram.com/p/C_8Z5mqIYJP/?igsh=Zm1mM2dxdGh4N21l
		const link = formData.get('link');
		if(!link.trim().startsWith('https://www.instagram.com/p/')) return alert('Enter a valid Instagram Post link');
		document.getElementById('status').textContent = 'Download request sent! Server is extracting the content...';
		document.getElementById('downloader').disabled = true;

		let res = await fetch(
			`${window.location.protocol}//${window.location.host}/post/media`,
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
					alert('Unexpected error: The post may be private. If not, please try again later.');
					break;
			}
			return;
		}
		res = await res.json();

		document.getElementById('status').textContent = 'Received File! Downloading...';
		window.location.assign(`${window.location.protocol}//${window.location.host}/post/media/${res.id}`);

		document.getElementById('status').textContent = 'Downloaded!';
		document.getElementById('downloader').disabled = false;
		document.getElementById('link').value = '';
	});
}