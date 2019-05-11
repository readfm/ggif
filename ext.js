var audios = {};

var getAudio = (url) => {
	return new Promise((ok, no) => {
		if(audios[url])
			ok(audios[url]);
		else{
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


		      audios[url] = au;

		      ok(au);
		  };

		  xhr.send();
		}
	});
}


/**
 * Create a context menu which will only show up for images.
 */

 let click = ev => {
 	console.dir('Clicked');
	if(!ev.altKey && !ev.ctrlKey) return;

 	console.dir('Alt + ' + ev.target.nodeName);
	if(!(
		ev.target.nodeName == 'IMG' || 
		ev.target.nodeName == 'img' || 
		ev.target.nodeName == 'image' || 
		ev.target.nodeName == 'IMAGE'
	)) return;

  	
  	if(ev.target.src){
  		getAudio(ev.target.src).then(audio => {
  			ev.target.src = '';
  			audio.pause();
	        audio.currentTime = 0;
  			audio.play();
  			ev.target.src = ev.target.src;
  		});
  	}
  	else 
  	if(ev.target.href){
  		let src = (typeof ev.target.href == 'object')?
  			ev.target.href.animVal:
  			ev.target.href;

  		console.log('get audio ' + src);
  		getAudio(src).then(audio => {
  			ev.target.href = '';
  			audio.pause();
    	    audio.currentTime = 0
  			audio.play();
  			console.log('loaded audio' + src);
  			ev.target.setAttribute('href', src);
  			ev.target.href = src;
  		});
  	}

  	console.log(ev.target);

  	ev.preventDefault();
    ev.stopPropagation();
    return false;
};

//window.addEventListener('click', click, false);


function reselectImages(){
	var x = document.querySelectorAll("image,img");
	var i;
	for (i = 0; i < x.length; i++){
		console.dir(x[i]);
	  x[i].removeEventListener('click', click, false);
	  x[i].addEventListener('click', click, false);
	}
};


window.document.addEventListener('DOMSubtreeModified', ev => {
	console.log('DOMSubtreeModified');
	reselectImages();
}, false);

reselectImages();