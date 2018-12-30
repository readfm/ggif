window.Gif = function(source, cb){
	var t = this;
	//var id = img.src.split('/').pop();

	this.create();
	this.load(source).then(function(){
		t.resize();

		t.frame(0);

		t.extract();

		t.extractAudio();

		if(cb) cb()
	});
};

$.extend(Gif.prototype, {
	create: function(){
		this.canvas = document.createElement('canvas');
		this.$canvas = $(this.canvas);
		this.canvas.gif = this;
		this.ctx = this.canvas.getContext('2d');
		this.$canvas.addClass('gif');
	},

	load: function(source){
		var t = this;
		return new Promise(function(resolve, reject){
			if(typeof source == 'string' && (source.indexOf('http://') === 0 || source.indexOf('https://') === 0))
				t.image(source, resolve);
			else
				t.download(source, resolve);
		});
	},

	image: function(src, cb){
		var t = this;

		var xhr = new XMLHttpRequest();
		xhr.open("GET", src, true);
		xhr.responseType = "arraybuffer";
		xhr.onload = function(e){
			var bytes = new Uint8Array(this.response);
			t.g = new GifReader(bytes);
			cb(t.g);
		};
		xhr.send();
	},

	download: function(id, cb){
		Pix.download(id, function(file){
			var buf = file.data;
			if(!buf) return reject();

			var g = t.g = new GifReader(buf);
			cb(g);
		});
	},

	resize: function(){
		this.canvas.width = this.g.width;
		this.canvas.height = this.g.height;
	},

	speed: 1,
	play: function(from){
		var t = this;
		var time = 0;
		if(!from) from = 0;

		t.clearTimeouts();
		for(var i = 0; i < this.g.numFrames(); i++){
			(function(i){
				var frame = t.g.frameInfo(i);
				var to = setTimeout(function(){
					t.frame(i);
	    			//	if(t.g.numFrames() == i+1) t.play(0);
				}, time);
				t.timeouts.push(to);
				var delay = frame.delay * 10 / t.speed;
				time += (time >= from)?delay:1;
			})(i);
    	};

    	if(t.audio){
    		t.audio.playbackRate = t.speed;
    		t.audio.currentTime = from/10;
			t.audio.play();
		}
	},

	frame: function(i){
		var pixels = this.ctx.getImageData(0,0, this.g.width, this.g.height);
	    this.g.decodeAndBlitFrameBGRA(i, pixels.data);
	    this.ctx.putImageData(pixels, 0, 0);
	},

	pause: function(){
		this.audio.pause();
		this.clearTimeouts();
	},

	timeouts: [],
	clearTimeouts: function(){
		this.timeouts.forEach(function(to){
			clearTimeout(to);
		});
		this.timeouts = [];
	},

	frames: [],

	extract: function(){
		var g = this.g;

		var extC = g.extensions[0xfe];
		if(extC && extC.length){
			var c = extC[0];
			var bufC = g.buf.subarray(c.start+1, c.start+1 + c.sizes[0]);
			this.comment = ab2str(bufC);
		}

		var ext = g.extensions[240];
		if(ext && ext.length){
			var c = ext[0];
			this.segments = ab2str(g.buf.subarray(c.start+1, c.start+1 + c.sizes[0]));
		}

		var ext = g.extensions[241];
		if(ext && ext.length){
			var c = ext[0];
			this.timings = ab2str(g.buf.subarray(c.start+1, c.start+1 + c.sizes[0]));
		}

		var ext = g.extensions[243];
		if(ext && ext.length){
			var c = ext[0];
			this.audioFormat = ab2str(g.buf.subarray(c.start+1, c.start+1 + c.sizes[0]));
		}
		else
			this.audioFormat = 'ogg';
	},

	fade: 0,
	extractAudio: function(){
		var t = this;
		var sound = t.g.buf.subarray(t.g.p);
		if(sound.length){
			var mime = 'audio/'+(t.audioFormat || 'ogg') + ";base64"

			var blob = new Blob([sound], {type: mime});

			t.audio = new Audio;
	    	t.audio.src = URL.createObjectURL(blob);

	    	t.audio.addEventListener('ended', function(){
					(t.onEnd || function(){})();
			    this.currentTime = 0;
			    if(this.volume <= 0.07) return false;

					console.log(this.volume);
					if(t.fade === true)
						this.volume = this.volume/2;
					else
						this.volume -= t.fade;

					console.log(this.volume);

					t.play(0);
			}, false);
		}

		return sound;
	},
});

/*
$(function(){
	$(document).bind("keydown", function(ev){
		if(ev.keyCode == 27){
			$('canvas.gif').each(function(){
				console.log(this);
				if(!this.gif) return;
				this.gif.pause();
			});
		}
	});
})
*/
