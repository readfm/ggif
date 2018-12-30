var module = window.Elem = function(item, cfg){
	var t = this;
	//var id = img.src.split('/').pop();

  $.extend(t, {
		noSort: true
  }, cfg);

  this.build(item);
};

$.extend(module.prototype, {
	fileDomains: [
		'http://f.io.cx/',
		'https://f.io.cx/',
		'http://files.mp3gif.com/'
	],

	build: function(item){
		var t = this;

		if(typeof item == 'string' || typeof item == 'number')
			item = Data.items[item];
		if(!item) return;

		t.item = item;

		var file = item.file;
		if(!file && item.src){
			this.fileDomains.forEach(function(f){
				if(item.src.indexOf(f) === 0)
					file = item.src.substr(f.length);
			});
		}

		this.file = file;

		var $item = t.$item = $('<span>', {name: this.url, class: 'thumb'});
		$item.data(item);

		$item[0].elem = this;

		if(item.type == 'view'){
				if(!item.owner) return false;
				t.view();
		}
		else
		if(item.type == 'video'){
			t.video();
		}
		else
		if(item.type == 'image'){
			if(item.ipfs){

			}
			else
			if(item.src && item.src.indexOf('127.0.0.1')<0)
				t.thumbnail();
			else
			if(item.file)
				item.src = Cfg.files + item.file;


			if(item.video)
				t.video();
			else
			if(t.youtube()){}
			else
			if(item.src && item.src.indexOf('ggif.co')+1)
				t.ggifFrame();
			else
			if(item.ipfs){
				$item.addClass('file');
				t.fromIpfs(item.ipfs);
			}
			else
			if(file){
				$item.addClass('file');

				/*
				if(item.src && item.src.indexOf('127.0.0.1')<0)
					$item.css({'background-image': "url("+Cfg.thumber+item.src.replace('://', '/')+")"});
				*/

				t.loadFile(file);
			}
			else
				t.image();
		}
		else
		if(item.type == 'link'){
			t.thumbnail();
			t.image();

			if(item.title)
				$('<article>').text(item.title).css({
					opacity: 1,
					color: 'white',
					'box-shadow': 'none'
				}).appendTo($item);

			$item.attr('title', item.link);
		}

		if(window.Context)
			Context.for(t.$item);

		/*
		if(item.width && item.height){
			$thumb.css({
				width: parseInt($thumb.css('height'))*item.width/item.height
			});
		};
		*/

		if(!this.noSort)
			$item.sortable(function(){
				Images.dragged($item);
			});

		if(!this.noRemove)
			$item.drag("start", function(ev, dd){
				$('#remove').fadeIn('fast');
			}).drag("end", function(){
				$('#remove').fadeOut('fast');
			});

		return $item;
	},

	// give an URL and return direct address to that video iframe
	parseVideoURL: function(url){
		if(typeof url !== 'string') return;
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

		  if(url.match('http(s)?://(www.)?youtube|youtu\.be') ){
		    if (url.match('embed')) { retVal.id = url.split(/embed\//)[1].split('"')[0]; }
		      else { retVal.id = url.split(/v\/|v=|youtu\.be\//)[1].split(/[?&]/)[0]; }
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

	thumbnail: function(){
		var thumb;


		if(this.item.src){
			if(this.item.src.indexOf('data:image')==0) return;

			var video = this.parseVideoURL(this.item.src);
		}

		if(video && video.provider == 'youtube')
			thumb = 'http://img.youtube.com/vi/'+video.id+'/sddefault.jpg';
		else{
			var u = this.item.src.split('://');
			//thumb = Cfg.thumb+u[0]+'/'+u[1];
			thumb = this.item.src;
		}

		//this.$item.css('background-image', 'url('+thumb+')');

		return this.$thumb;
	},

	image: function(){
		var image = new Image,
			$image = $(image).appendTo(this.$item);

		var t = this;

		if(this.item.file){
			image.src = Cfg.files+this.item.file;

			$(image).dblclick(function(){
				t.playAudio(image);
			});
		}
		else
		if(this.item.src)
			image.src = this.item.src;


		return image;
	},

	youtube: function(){
		if(this.item.src){
			var video = this.parseVideoURL(this.item.src),
				vid = video.provider;
		}

		if(!video || video.provider != 'youtube') return;

		var frame = document.createElement("iframe");
				frame.src = 'https://www.youtube.com/embed/'+video.id;
		this.$item.addClass('youtube').append(frame);
		this.$item.append("<div class='iframe-cover'></div>");

		return frame;
	},

	video: function(){
		var src = this.item.video || this.item.src;
		var video = document.createElement("video");
		video.src = (src.indexOf('dat://') + 1)?(new Link(src)).http:src;
		video.controls = true;
		video.autoplay = false;
		this.$item.append("<div class='iframe-cover'></div>");

		this.$item.addClass('video').append(video);

		return video;
	},

	ggifFrame: function($thumb, item){
		var p = this.item.src.replace('http://', '').split(/[\/]+/);
		//var thumb = 'http://'+p[0]+'/'+p[1]+'/'+p[1]+'.gif';

		var frame = document.createElement("iframe");
		frame.onload = function(){

		}
		frame.onerror = function(){
			this.$item.parent().children('span[href="'+this.item.src+'"]').remove();
		}

		//frame.width = h;
		//frame.height = h;
		frame.src = this.item.src.replace('http://', 'https://');
		this.$item.addClass('ggif').append(frame);
		this.$item.append("<div class='iframe-cover'></div>");
		//$thumb.append("<div class='iframe-cover'></div>");

		return this.$item;
	},

	loadFile: function(url){
		var t = this;



		var link = new Link(url);

		var image = new Image;
		image.onload = function(){
			t.$item.append(image);
			//t.resize(this.$item);

			var carousel = t.$item.parent()[0].carousel;

			if(typeof carousel == 'object')
				carousel.resize(t.$item);

			var gif = new Gif(image.src, function(){
				if(!gif.segments)
					return;

				$(image).remove();

				t.$item.append(gif.canvas);

				if(typeof carousel == 'object')
					carousel.resize(t.$item);

				if(window.Context)
					Context.for(t.$item);

				gif.fade = true;
				$(gif.canvas).click(function(){
					gif.audio.volume = 1;
					gif.play(0);
				});
			});

			if(window.Context)
				Context.for(t.$item);

			t.$item.append(image);
		};

		image.src = link.http;
	},


	fromIpfs: function(hash){
		var t = this;

		if(window.ipfs && window.ipfs.isReady)
			ipfs.cat(hash).then(function(r){
				var gif = new Gif(r.url, function(){
					if(!gif.segments)
						return;

					var carousel = t.$item.parent()[0].carousel;
					t.$item.append(gif.canvas);

					if(typeof carousel == 'object')
						carousel.resize(t.$item);

					gif.fade = true;
					$(gif.canvas).click(function(){
						gif.audio.volume = 1;
						gif.play(0);
					});
				});
			});
		else{
			var url = 'https://gateway.ipfs.io/ipfs/'+hash;
			var gif = new Gif(url, function(){
				if(!gif.segments)
					return;

				var carousel = t.$item.parent()[0].carousel;
				t.$item.append(gif.canvas);

				if(typeof carousel == 'object')
					carousel.resize(t.$item);

				gif.fade = true;
				$(gif.canvas).click(function(){
					gif.audio.volume = 1;
					gif.play(0);
				});
			});
		}
	},


	view: function(){
		this.$item.addClass('item-user');
		var t = this;

		if(item.owner)
			this.getGPicture(item.owner, function(url){
				if(url)	t.$item.css({
					'background-image': 'url('+url+')'
				});
			});

		this.$item.attr('title', this.item.owner || this.item.gid);
	},


	gPictures: {},
	getGPicture: function(gName, cb){
		var t= this;
		var url = this.gPictures[gName];
		if(url) return cb(url);
		else if(url === false) return;

		$.getJSON('http://picasaweb.google.com/data/entry/api/user/'+gName+'?alt=json', function(r){
			if(!r || !r.entry) return;

			var url = r.entry.gphoto$thumbnail.$t.replace('/s64-c/', '/s300-c/');

			t.gPictures[gName] = url;
			cb(url);
		}).fail(function(){
			t.gPictures[gName] = false;
		});
	},

	// preload ggif, extract and play that audio.
	playAudio: function(img){
		var id = img.src.split('/').pop();

		if(img.audio){
			img.src = img.src;
			img.audio.currentTime = 0;
			img.audio.play();
			img.audio.volume = 1;
		}
		else
			ws.download(id).then(function(buf){
				var ggif = new GifReader(buf);
				var sound = buf.slice(ggif.p)
				if(sound.length){
					var blob = new Blob([sound], {type: "audio/ogg;base64"});
					img.audio = new Audio;
			    	img.audio.src = URL.createObjectURL(blob);
					img.src = img.src;

			    	img.audio.addEventListener('ended', function() {
					    this.currentTime = 0;
					    if(this.volume <= 0.25) return false;
					    this.volume = this.volume - 0.25;
					    this.play();
					}, false);

					img.audio.currentTime = 0;
			    	img.audio.play();
				}
			});
	}
});

$(function(){
	$(document).on('mouseleave', '.ggif,.youtube, .video', function(ev){
		$(this).children('.iframe-cover').show();
	});

	$(document).on('click', '.iframe-cover', function(ev){
		$(this).hide();
	});
});
