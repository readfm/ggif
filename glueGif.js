var glueGif = {

	// from array buffer create objectURL to represent in img=src
	objectURL: function(arrayBufferView){
	    var blob = new Blob([arrayBufferView], {type: "image/gif"});
	    return URL.createObjectURL(blob);
	},

	// play audio from given buffer
	playBuf: function(buf){
		var ggif = new GifReader(buf);
		var sound = buf.slice(ggif.p)
		if(sound.length){
			var blob = new Blob([sound], {type: "audio/ogg;base64"});
			audio.src = URL.createObjectURL(blob);
			audio.play();
			//Ggif.audio.src = 'data:audio/ogg;base64,'+Ggif.Uint8ToBase64(sound);
		}
	},

	// from array buffer create objectURL to represent in img=src
	encode64: function(buffer) {
		var binary = '',
			len = buffer.byteLength;

		for (var i = 0; i < len; i++) {
			binary += String.fromCharCode(buffer[i]);
		}

		return window.btoa( binary );
	},

	Uint8ToBase64: function(u8Arr){
		var CHUNK_SIZE = 0x8000; //arbitrary number
		var index = 0;
		var length = u8Arr.length;
		var result = '';
		var slice;
		while (index < length) {
			slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
			result += String.fromCharCode.apply(null, slice);
			index += CHUNK_SIZE;
		}
		return btoa(result);
	},


	upload: function(evt){
		evt.preventDefault();

		var files = (evt.target.files || evt.dataTransfer.files);
		if(!files) return false;

		for (var i = 0, f; f = files[i]; i++){
			console.log(f.type);
			if(f.type.match('image.*')){
				Ggif.read2arr(f, function(r){
					Ggif.read(r);
				});

				Ggif.read2url(f, function(r){
					Ggif.image.src = r;
				});
			}
			else
			if(f.type.match('audio.*')){
				Ggif.read2arr(f, function(r){
					Ggif.sound = r;
				});

				Ggif.read2url(f, function(r){
					Ggif.audio.src = r;
				});
			};
		}

		return false;
	},

	// read uploadable file object into buffer
	read2arr: function(f, cb){
		var reader = new FileReader();
		reader.onload = function(){
			cb(new Uint8Array(reader.result));
		};
		reader.readAsArrayBuffer(f)
	},

	read2url: function(f, cb){
		var reader = new FileReader();
		reader.onload = function(){
			cb(reader.result);
		};
		reader.readAsDataURL(f)
	},

	cutEnd: function(buf){

	},


	audioFormat: Cfg.ggif.audioFormat || 'ogg',

	// make ggif with all the stuff inside it: gif, audio, segments, timings, comment
	make: function(){
		var add = [];

		var comment = $('#gif-comment').val();
		if(comment)
			add.push(Ggif.bufComment(comment));

		/*
		if(Ggif.sound)
			add.push(Ggif.bufMake(Ggif.sound));
		*/

		if($('#gif-includeTwext').hasClass('v')){
			if(Ggif.seg) add.push(Ggif.bufString(Ggif.seg, 240));
			if(Ggif.tim) add.push(Ggif.bufString(Ggif.tim, 241));
		}

		var youtube = $('#gif-youtube').val();
		if(youtube.length)
			add.push(Ggif.bufString(youtube, 242));

		var incSound = $('#gif-includeSound').hasClass('v');
		var buf = Ggif.recompile(add, incSound?Ggif.sound:false);

		return buf;
	},

	// make ggif with all the stuff inside it: gif, audio, segments, timings, comment
	make: function(buf){
		if(!buf) buf = Ggif.buf;
		if(!buf) return;

		$('#resize').addClass('loading-ggif');

		//Ggif.read(buf);

		var timings = [];
		$('#game > i:not(.skip)').each(function(){
			var s = parseFloat($(this).data('time'));
			if(s) timings.push(s);
		});

		var add = [];
		add.push(Ggif.bufString(Tx.getText(), 240));
		add.push(Ggif.bufString(timings.join(','), 241));

		add.push(Ggif.bufString(Tx.yid(), 242));

		add.push(Ggif.bufString(Ggif.audioFormat, 243));


		var audio;
		if($('#gg').is(':visible'))
			audio = Ggif.sound || false;
		else
			audio = Tx.audio?(new Uint8Array(Tx.audio)):false

		//var buf = Ggif.recompile(add, audio);


		console.log('uploading');
		ws.upload(buf, function(file){
			if(!file) return;

			var item = {
				path: carousel.getPath(),
				src: 'http://'+window.location.hostname+'/'+file.id,
				fid: file.id,
				gid: User.id,
				width: Ggif.g.width,
				height: Ggif.g.height
			};

			Pix.send({
				cmd: 'save',
				item: item,
				collection: 'pix8'
			}, function(r){
				if(r.item){
					Pix.items[r.item.id] = r.item;
					var $thumb = carousel.push(r.item.id);
					$('#resize').removeClass('loading-ggif');
					carousel.updateView();
				}
			});
		});
	},

	audio: function(cb){

	},

	// compile it but also add some items inside it and append audio to the end
	recompile: function(add, appendix){
		var parts = [];

		var nextCut = 0;
		Ggif.g.exts.forEach(function(ext){
			var part = Ggif.buf.slice(nextCut, ext.index);
			parts.push(part);
			nextCut = ext.index + 2 + ext.size;
		});

		parts.push(Ggif.buf.slice(nextCut, Ggif.g.p-1));

		if(typeof add == 'object' && add.length)
			parts.push.apply(parts, add);

		var size = 0;
		parts.forEach(function(part){
			size += part.length;
		});

		size++; // for trailer 0x3b
		if(appendix) size += appendix.length;
		var buf = new Uint8Array(size), p = 0;
		parts.forEach(function(part){
			buf.set(part, p);
			p += part.length;
		});

		buf[buf.length-1-(appendix?appendix.length:0)] = 59;

		if(appendix && appendix.length)
			buf.set(appendix, buf.length-appendix.length);

		return buf;
	},

	save: function(){
		//if()
	},

	// get what was inserted to the end of the gif, usually audio
	getAppendix: function(){
		return Ggif.buf.slice(Ggif.g.p);
	},

	bufComment: function(str){
		// 0x21: Extension Block + 0xfe: Comment Extension + length byte & string && 0x00: end
		var buf = new Uint8Array(3+str.length+1);
		buf[0] = 33;
		buf[1] = 254;
		buf[2] = str.length;
		for (var i=0; i<str.length; i++){
			buf[3+i] = str.charCodeAt(i);
		}

		return buf;
	},

	// convert string into buffer and prepare it to be inserted into gif with selected type int
	bufString: function(str, type){
		// 0x21: Extension Block + 0xfe: Comment Extension + length byte & string && 0x00: end
		var buf = new Uint8Array(3+str.length+1);
		buf[0] = 33;
		buf[1] = type || 254;
		buf[2] = str.length;
		for (var i=0; i<str.length; i++){
			buf[3+i] = str.charCodeAt(i);
		}

		return buf;
	},

	// prepare buffer to be inserted into gif with selected type int
	bufMake: function(bu, type){
		// 0x21: Extension Block + 0xfe: Comment Extension + length byte & string && 0x00: end
		var buf = new Uint8Array(3+bu.length+1);
		buf[0] = 33;
		buf[1] = type || 241;
		buf[2] = bu.length;

		buf.set(bu, 4);

		return buf;
	},

	// load Uint8Array from given address
	loadBuf: function(url, cb){
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.responseType = "arraybuffer";

		xhr.onload = function(e){
			var buf = new Uint8Array(this.response);
			cb(buf);
		}
		xhr.send();
	},

	parseHtml: function(url){
		var p = url.replace('http://', '').split('/'),
			path = 'http://'+p[0]+'/'+p[1]+'/';

		Ggif.newHash = p[1];
		var xhr = new XMLHttpRequest();
		xhr.open("GET", path+'a.html', true);
		xhr.responseType = "text";

		xhr.onload = function(e){
			var patText = 'var hText = "',
				patTimings = 'var timings = "';

			var index = this.response.indexOf(patText);
			if(index+1){
				var start = index + patText.length,
					end = this.response.indexOf('"', start);
				Ggif.seg = this.response.substr(start, end-start);
			}

			var index = this.response.indexOf(patTimings);
			if(index+1){
				var start = index + patTimings.length,
					end = this.response.indexOf('"', start);
				Ggif.tim = this.response.substr(start, end-start);
			}

			Ggif.tickBuild();
		}
		xhr.onerror = function(e){
			console.log(e);
		};
		xhr.send();

		var pathMp3 = path+p[1]+'.mp3';
		Ggif.loadBuf(pathMp3, function(buf){
			Ggif.audio.src = pathMp3;
			Ggif.sound = buf;
		});

		Ggif.prepare(path+p[1]+'.gif');

		var xhr = new XMLHttpRequest();
		xhr.open("GET", path+'index.html', true);
		xhr.responseType = "text";

		xhr.onload = function(e){
			console.log(xhr.response);
			var pl = 'https://www.youtube.com/watch',
				pat = '<a href='+pl;

			var index = xhr.response.indexOf(pat);
			if(index+1){
				var start = index + pat.length,
					end = xhr.response.indexOf('</a>', start);
				$('#gif-youtube').val(pl+xhr.response.substr(start, end-start));
			}
		}
		xhr.onerror = function(e){
			//alert('Unable to yotube url');
		};
		xhr.send();
	},

	// load Uint8Array from given address
	load: function(url, cb){
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.responseType = "arraybuffer";

		xhr.onload = function(e){
			var buf = new Uint8Array(this.response);
			cb(buf);
		}
		xhr.send();
	},

	loadFile: function(){

	},

	sound: function(){

	},

	tickBuild: function(){
		return;
		if(Ggif.seg || Ggif.tim)
			tickertape.build(Ggif.seg || '', Ggif.fixTim(Ggif.tim));
	},

	// fix timings
	fixTim: function(tim){
		var ts = (tim || '').split(/\s+/g) || [],
			t = [];

		//ts.unshift(0);

		var prev = 0;
		ts.forEach(function(s){
			t.push(s-prev);
			prev = s;
		});

		ts.unshift(0);
		console.log(t);

		return t;
	},

	// restart ggif or youtube video - which currently displayed
	restart: function(){
		if($('#ggif > img').is(':visible')){
			Ggif.image.src = Ggif.image.src;

			Ggif.audio.pause()
			Ggif.audio.currentTime = 0;
			Ggif.audio.play();

			Ggif.tick();
		}
		else
		if($('#ggif-youtube').is(':visible')){
			//console.trace('restart');
			Ggif.youtube.seekTo(document.getElementById('gif-youtube_start').value || 0);
			Ggif.youtube.playVideo();

		}
	},

	tick: function(){
		//tickertape.reset();
	},

	// create ArrayBuffer from img
	getBuffer: function(image){
		var str = image.toDataURL("image/gif", 1);
		var binary = atob(str.split(',')[1]);

		var length = bin.length;
		var buf = new ArrayBuffer(length);
		var arr = new Uint8Array(buf);
		for (var i = 0; i < length; i++) {
			arr[i] = bin.charCodeAt(i);
		}
		return buf;
	},

	//give url and return exact playable iframe
	parseURL: function(url){
		if(!url) return {};

	 	function getParm(url, base){
		      var re = new RegExp("(\\?|&)" + base + "\\=([^&]*)(&|$)");
		      var matches = url.match(re);
		      if (matches) {
		          return(matches[2]);
		      } else {
		          return("");
		      }
		  }

		  var retVal = {};
		  var matches;
		  var success = false;

		  if( url.match('http(s)?://(www.)?youtube|youtu\.be') ){
		    if (url.match('embed')) { retVal.id = url.split(/embed\//)[1].split('"')[0]; }
		      else { retVal.id = (url.split(/v\/|v=|youtu\.be\//)[1] || '').split(/[?&]/)[0]; }
		      retVal.provider = "youtube";
		      var videoUrl = 'https://www.youtube.com/embed/' + retVal.id + '?rel=0';
		      success = true;
		  } else if (matches = url.match(/vimeo.com\/(\d+)/)) {
		      retVal.provider = "vimeo";
		      retVal.id = matches[1];
		      var videoUrl = 'http://player.vimeo.com/video/' + retVal.id;
		      success = true;
		  }

		 return retVal;
	},

	radyYT: false,

	// return youtube id
	yid: function(){
		if(!Ggif.youtube) return;
		return Ggif.parseURL(Ggif.youtube.getVideoUrl()).id;
	},

	print: function(){
		if(Ggif.printTimeout)
			clearTimeout(Ggif.printTimeout);

		Ggif.canvas.width = Ggif.g.width;
		Ggif.canvas.height = Ggif.g.height;
		var pixels = Ggif.ctx.createImageData(Ggif.g.width, Ggif.g.height);

    	//Ggif.canvas.drawCanvas(paint, pixels, 0, 0, Ggif.g.width, Ggif.g.height);

    	var i = 0;
    	var paint = function(){
			var pixels = Ggif.ctx.createImageData(Ggif.g.width, Ggif.g.height);

    		var frame = Ggif.g.frameInfo(i);
			Ggif.g.decodeAndBlitFrameBGRA(i++, pixels.pixels || pixels.data || pixels);
    		Ggif.ctx.putImageData(pixels, 0, 0);

    		if(i >= Ggif.g.numFrames())
    			i = 0;

    		Ggif.printTimeout = setTimeout(paint, frame.delay*10);
    	};
    	paint();
	},

	// put text over canvas
	printText: function(text){
		var canvas = Ggif.canvas,
			ctx = Ggif.canvas.getContext("2d"),
			size = 30;

		ctx.font = size+"px Comic Sans MS";
		ctx.fillStyle = "red";
		ctx.textAlign = "center";
		ctx.fillText(text, canvas.width/2, canvas.height - size - 8);
	},

	// slit gif into canvas frames and lay them down
	loadFrames: function(){
		var $frames = $('#frames').empty(),
			height = $frames.height(),
			width = parseInt(height * Ggif.g.width / Ggif.g.height);

		for(var i = 0; i < Ggif.g.numFrames(); i++){
			var $canvas = $('<canvas>'),
				canvas = $canvas[0],
				ctx = canvas.getContext("2d");

    		var frame = Ggif.g.frameInfo(i);

			$canvas.data(frame);
			$canvas.attr({width: Ggif.g.width, height: Ggif.g.height});

    		$frames.append($canvas);

			var pixels = ($canvas.prev().length)?
				$canvas.prev()[0].getContext("2d").getImageData(0,0, Ggif.g.width, Ggif.g.height):
				ctx.createImageData(Ggif.g.width, Ggif.g.height);

			Ggif.g.decodeAndBlitFrameBGRA(i, pixels.data);
    		ctx.putImageData(pixels, 0, 0);

			//$canvas.css({width: width, height: height});
		}

		console.info('loadFrames');
		this.glueUpText(Cfg.ggif.color);
		//return;
		this.collect();
	},

	// on those frames put some text into one line
	glueText: function(color){
		var time = 0;

		if(typeof color == 'number')
			color = rgb2hex(color>>16 & 0xff, color >> 8 & 0xff, color & 0xff)

		$('#frames > canvas').each(function(){
			var $canvas = $(this),
				canvas = $canvas[0],
				ctx = canvas.getContext("2d"),
				frame = $canvas.data();

			var font = 'Monospace',
				size = 35,
				text = Ggif.getText(time);

			ctx.fillStyle = color;
			ctx.font = size+"px "+font;

			ctx.fillText(text, 8, canvas.height - size - 2);

			time += frame.delay/100;
		});
	},

	// on those frames put some text into many lines
	glueUpText: function(color){
		var time = 0;

		if(typeof color == 'number')
			color = rgb2hex(color>>16 & 0xff, color >> 8 & 0xff, color & 0xff)

		$('#frames > canvas').each(function(){
			var $canvas = $(this),
				canvas = $canvas[0],
				ctx = canvas.getContext("2d"),
				frame = $canvas.data();


			var font = Cfg.ggif.font,
				size = Cfg.ggif.size,
				text = Ggif.getUpText(time);

			ctx.textBaseline = "top";
			ctx.fillStyle = color;
			ctx.font = size+"px "+font;
			var height = ctx.wrapText(text, 0, 0, canvas.width, size, true) - 1;

			var inMem = document.createElement('canvas');
			inMem.width = canvas.width;
			inMem.height = canvas.height;
			var inMemCtx = inMem.getContext('2d');
			inMemCtx.drawImage(canvas, 0, 0);

			canvas.height = canvas.height + height;
			ctx.drawImage(inMem, 0, height);

			ctx.shadowColor = Cfg.ggif.shadowColor;
			ctx.shadowOffsetX = Cfg.ggif.shadowOffsetX;
			ctx.shadowOffsetY = Cfg.ggif.shadowOffsetX;
			ctx.shadowBlur = Cfg.ggif.shadowBlur;

			var grV = ctx.createLinearGradient(0, 0, 0, height);
		  grV.addColorStop(0, Cfg.ggif.gradient1);
		  grV.addColorStop(1, Cfg.ggif.gradient2);
		  ctx.fillStyle = grV;
			ctx.fillRect(0,0, canvas.width, height + 2);

			ctx.textBaseline = "top";
			ctx.fillStyle = color;
			ctx.font = size+"px "+font;
			ctx.textAlign = "center";
			ctx.wrapText(text, parseInt(canvas.width / 2), 2, canvas.width, size);

			time += frame.delay/100;
		});
	},

	// collect canvas frames and send their data to server
	collect: function(){
		var ids = [];
		var numFrames = $('#frames > canvas').each(function(index){
			var $canvas = $(this),
				canvas = $canvas[0],
				ctx = canvas.getContext("2d"),
				frame = $canvas.data();

			var mime = "image/jpeg";
			canvas.toBlob(function(blob){
				(Sockets.local || Sockets.main).upload(blob, function(file){
					if(file){
						ids.push(file.id);

						if(ids.length == numFrames) Ggif.printGif();
					}
				}, {
					mime: mime,
					location: 'gif',
					name: Ggif.getName() + '_' + index + '.jpg'
				});
			}, mime, 0.95);
		}).length;
		console.info('collect');
	},

	// get name to use in building ggif
	getName: function(){
		return Tx.yid() + '-' + Tx.timeStart() + '-' + Tx.duration();
	},

	// ask server to glue those jpeg files into gif // uses ffmpeg
	printGif: function(){
		console.info('printGif');
		(Sockets.local || Sockets.main).send({
			cmd: 'makeGif',
			name: Ggif.getName()
		}, function(r){
			if(!r.file) return;

			Ggif.prepare(r.file.id, function(){
				Ggif.compile();
			});
		});
	},

	// save loaded ggif into ipfs and put it into current carousel
	saveCompiled: function(id){
		var item = {
			path: carousel.getPath(),
			gid: User.id,
			width: Ggif.g.width,
			height: Ggif.g.height,
			type: 'image',

			timings: Ggif.timings,
			segments: Tx.getText(),
			text: $('#game').text(),
			youtube_id: Tx.yid()
		};

		if(id.length == 46)
			$.extend(item, {
				src: 'ipfs://'+id,
				ipfs: id
			});
		else
			$.extend(item, {
				file: id
			});

		Pix.send({
			cmd: 'save',
			item: item,
			collection: 'pix8'
		}, function(r){
			if(r.item){
				Pix.items[r.item.id] = r.item;
				var $thumb = carousel.push(r.item.id);
				$('#resize').removeClass('loading-ggif');
				carousel.updateView();
			}
		});
	},

	// compule prepared Ggif.
	compile: function(){
		var buf = Ggif.buf;
		if(!buf) return;

		$('#resize').addClass('loading-ggif');

		var timings = [];
		$('#game > i:not(.skip)').each(function(){
			var s = parseFloat($(this).data('time'));
			if(s) timings.push(s);
		});

		Ggif.timings = timings;

		var add = [];
		add.push(Ggif.bufString(Tx.getText(), 240));
		add.push(Ggif.bufString(timings.join(','), 241));

		add.push(Ggif.bufString(Tx.yid(), 242));
		add.push(Ggif.bufString(Ggif.audioFormat, 243));

		Ggif.fetchAudio(function(res){
			var audio = new Uint8Array(res);

			var buf = Ggif.recompile(add, audio);

			$('#resize').removeClass('loading-ggif');

			ws.upload(buf, function(file){
				if(!file) return;

				Ggif.saveCompiled(file.id);
			});

			return;
			ipfs.add(Buffer.from(buf)).then(function(r){
				if(!r || !r.length) return;
				var id = r[0].path;
				Ggif.saveCompiled(id);
				Ggif.image.src = ipfs.url(id);
				Ggif.fromIpfs(id);
			});
		});
	},


	// fetch audio from youtube video using server's help
	fetchAudio: function(cb){
		var startTime = Tx.timeStart(),
			lengthTime = parseFloat(document.getElementById('gif-youtube_length').value);

		var audioFormat = Ggif.audioFormat;
		if(audioFormat == 'ogg') audioFormat = 'opus';

		var srcAudio = 'http://'+Cfg.server+'/youtube/'+Tx.yid()+'/'+audioFormat;
		if(startTime) srcAudio += '/'+(startTime);
		if(lengthTime) srcAudio += '/'+lengthTime;

		var request = new XMLHttpRequest();
		request.open('GET', srcAudio, true);
		request.responseType = 'arraybuffer';

		console.log('Fetch audio: '+srcAudio);
		request.onload = function(){
			cb(request.response);
		}
		request.send();
	},

	// get an array of all colors that canvas iframe contains
	getColors: function(ctx){
		var pixels = ctx.getImageData(0,0, Ggif.g.width, Ggif.g.height).data;

		var colors = [];

		for(var i=0; i < pixels.length/4; i++){
			var color = pixels[i*4] << 16 | pixels[i*4+1] << 8 | pixels[i*4+2],
				index = colors.indexOf(color);

			if(index<0) colors.push(color);
		}

		return colors;
	},

	combinePixels: function(pixels, palette){
		var dots = new Uint8ClampedArray(pixels.length/4),
			pal = [];

		for(var i=0; i < pixels.length/4; i++){
			var color = pixels[i*4] << 16 | pixels[i*4+1] << 8 | pixels[i*4+2],
				index = palette.indexOf(color);

			dots[i] = (index+1)?index:0;
			if(index<0) pal.push(color);
		}

		console.log(pal);

		return dots;
	},

	// get text shown in twext are
	getText: function(time){
		var text = '';
		$('#game > i').each(function(){
			var $i = $(this),
				tm = $i.data('time');

			if($i.html() == '&nbsp;' && text)
				text += ' ';

			if(tm < (time || 0)) return;

			var t = $i.text();

			if(t) text += t.trim();
		});

		return text.trim();
	},

	// get text shown in twext with upper case where required
	getUpText: function(time){
		var text = '', up = false, prev = 0;

		var $is = $('#game > i');
		$is.each(function(i){
			var $i = $(this),
				tm = $i.data('time');

			if($i.html() == '&nbsp;' && text)
				return text += ' ';
			if(!tm) return;

			var t = $i.text();

			// need to fix with last syllable to make uppercase
			if(tm && $i.data('next') > time && !up){
				t = t.toUpperCase();
				up = true;
			}
			prev = tm;

			if(t) text += t.trim();
		});

		return text.trim();
	},

	// get colors pallette from loaded Ggif.
	getPalette: function(){
		var palette = [];

	    for (var i = Ggif.g.colors_index; i < Ggif.g.colors_index + Ggif.g.colors_length; i+=3)
	      palette.push(Ggif.buf[i] << 16 | Ggif.buf[i+1] << 8 | Ggif.buf[i+2]);

	  	return palette;
	},

	// load data from canvas context and send all stuff to server for future use
	compileFrames: function(){
		var buf = new Uint8Array(5000000);

		var palette = Ggif.getPalette();

		//var w  = new GifWriter(buf, Ggif.g.width, Ggif.g.height, {palette: palette});
		var w = new GifWriter(buf, Ggif.g.width, Ggif.g.height, {
			palette: palette,
			background: 1, loop: 999
		});

		$('#frames > canvas').each(function(){
			var $canvas = $(this),
				canvas = $canvas[0],
				ctx = canvas.getContext("2d"),
				frame = $canvas.data();

			var pixels = ctx.getImageData(0,0, Ggif.g.width, Ggif.g.height);
			var dots = Ggif.combinePixels(pixels.data, palette);

			w.addFrame(0,0, Ggif.g.width, Ggif.g.height, dots, {
				delay: frame.delay,
				disposal: 1
			});
		});
		var size = w.end();

		ws.upload(buf.slice(0, size), function(file){
			if(!file) return;

			var item = {
				path: carousel.getPath(),
				src: 'http://'+window.location.hostname+'/'+file.id,
				fid: file.id,
				gid: User.id,
				width: Ggif.g.width,
				height: Ggif.g.height
			};

			Pix.send({
				cmd: 'save',
				item: item,
				collection: 'pix8'
			}, function(r){
				if(r.item){
					console.log(r.item.file);
					Pix.items[r.item.id] = r.item;
					var $thumb = carousel.push(r.item.id);
					carousel.updateView();
				}
			});
		});
	}
}

$(function(){
	Ggif.image = $('#gg')[0];

	Ggif.canvas = $('#ggif-frame')[0];
	Ggif.ctx = Ggif.canvas.getContext('2d');


	Ggif.audio = new Audio;
	Ggif.audio.addEventListener("loadeddata", function(){
		//$img.data('_audio', audio);
	});

	Ggif.audio.addEventListener("ended", function(){
		Ggif.play();
	});


	$('#upload-gif').bind('change', Ggif.upload);
	$('#gif-upload').click(function(){
		$('#upload-gif').click();
	});


	/*
	Ggif.load('/sounds/18v.mp3', function(buf){
		Ggif.sound = buf;
		//console.log(Ggif.bufMake(Ggif.sound));
	});
	*/

	$('#gif-save').click(function(){
		var $thumb = carousel.$t.children('span[name='+Ggif.hash+']');
		Ggif.resend($thumb.data('file'));
	});

	$('#gif-create').click(function(){
		Ggif.send();
	});

	$('#gif-download').click(function(){
		var $img = $('#ggif > img:visible'),
			image = $img[0];

		var name = image.src.split('/').pop();

		var buf = Ggif.make();
		download(buf, name, 'image/gif');
	});

	$('#gif-toggleFull').click(function(){
		$('#ggif').toggleClass('full');
		Cookies.set('ggif-small', !$('#ggif').hasClass('full'));
	});

	if(Cookies.get('ggif-small') != 'true')
		$('#gif-toggleFull').click();


	var $gg = Ggif.$gg = $('#gg');
});
