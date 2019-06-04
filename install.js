console.log('Check if installable');
window.addEventListener('beforeinstallprompt', evt => {
	// CODELAB: Add code to save event & show the install button.
	let deferredInstallPrompt = evt;

	console.log('Can be installed', evt);

	let installButton = document.getElementById('install');
	if(installButton) installButton.addEventListener("click", evt => {
		// CODELAB: Add code show install prompt & hide the install button.
		deferredInstallPrompt.prompt();
		// Hide the install button, it can't be called twice.
		evt.srcElement.setAttribute('hidden', true);
	});

	installButton.removeAttribute('hidden');

	deferredInstallPrompt.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt', choice);
      } else {
        console.log('User dismissed the A2HS prompt', choice);
      }
      deferredInstallPrompt = null;
    });
});

window.addEventListener('appinstalled', evt => {
	console.log('App installed');
});
