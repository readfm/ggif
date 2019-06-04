const CACHE_NAME = 'static-cache-v1';

const FILES_TO_CACHE = [
  '/index.html',
'/lib/gif.js',
'/lib/download.js',
'/lib/binary.js',
'/lib/utils.js',
'/lib/refs.js',
'/lib/classy.js',
'/lib/firebaseHandler.js',
'/lib/Hyphenator.js',
'/lib/en-us.js',
'/lib/syllabifier.js',
'/design/interface.css',
'/design/layout.css',
'/design/progress.css',
'/design/game.css',
'/gif.js',
'/config.js',
'/modules/core.js',
'/modules/catalog.js',
'/modules/site.js',
'/modules/interface.js',
'/modules/watson.js',
'/modules/data.js',
'/modules/ipfs.js',
'/modules/layout.js',
'/modules/wysiwyg.js',
'/modules/ggif.js',
'/modules/ggame.js',
'/modules/tx.js',
'/modules/textdata.js',
'/modules/impose.js',
'/modules/builder.js',
'/pix8/carousel.js',
'/pix8/carousel.css',
'/pix8/pix.js',
'/pix8/GG.css',
'/pix8/GG.js',
'/pix8/run.js',
'/pix8/pix8list.js',
'/pix8/context.js',
'/pix8/acc.js',
'/modules/catalog.js',
'/pix8/acc.css',
'/design/x.png',
'/design/logo48.png',
'/design/user.png',
'/design/resize.png'
];

self.addEventListener('install', (evt) => {

	// CODELAB: Precache static resources here.
	evt.waitUntil(
	    caches.open(CACHE_NAME).then((cache) => {
	      console.log('[ServiceWorker] Pre-caching offline page');
	      return cache.addAll(FILES_TO_CACHE);
	    })
	);


});

self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install');
  // CODELAB: Precache static resources here.

  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');
  // CODELAB: Remove previous cached dat


	// CODELAB: Remove previous cached data from disk.
	evt.waitUntil(
	    caches.keys().then((keyList) => {
	      return Promise.all(keyList.map((key) => {
	        if (key !== CACHE_NAME) {
	          console.log('[ServiceWorker] Removing old cache', key);
	          return caches.delete(key);
	        }
	      }));
	    })
	);


  return self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  //console.log(evt.request.url);
  // CODELAB: Add fetch event handler here.


	// CODELAB: Add fetch event handler here.
	if (evt.request.mode !== 'navigate') {
	  // Not a page navigation, bail.
	  return;
	}
	evt.respondWith(
	    fetch(evt.request)
	        .catch(() => {
	          return caches.open(CACHE_NAME)
	              .then((cache) => {
	                return cache.match('index.html');
	              });
	        })
	);

});