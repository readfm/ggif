var play = (url) => {
  var xhr = new XMLHttpRequest();

  // Use JSFiddle logo as a sample image to avoid complicating
  // this example with cross-domain issues.
  xhr.open( "GET", url, true);

  // Ask for the result as an ArrayBuffer.
  xhr.responseType = "arraybuffer";

  xhr.onload = function( e ) {
      // Obtain a blob: URL for the image data.
      var buf = new Uint8Array( this.response );

      var gif = new GifReader(buf);

      var sound = gif.buf.subarray(gif.p);
      var mime = 'audio/ogg;base64';

      var blob = new Blob([sound], {type: mime});
      var au = new Audio(URL.createObjectURL(blob));

      au.play();
  };

  xhr.send();
}


/**
 * Create a context menu which will only show up for images.
 */

window.addEventListener('click', ev => {
	if(!ev.altKey) return;
	console.log(ev.target);
	if(
		ev.target.nodeName == 'IMG' || 
		ev.target.nodeName == 'img' || 
		ev.target.nodeName == 'image'
	)
  		play(
  			ev.target.src || 
  			(typeof ev.target.href == 'object'?
  				ev.target.href.animVal:
  				ev.target.href
  			)
  		);
}, false);
