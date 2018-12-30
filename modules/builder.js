window.Builder = {
	items: {},
	collect: function(ids){
		var newIds = [];
		ids.forEach(function(id){
			if(!Builder.items[id])
				newIds.push(id);
		});

		return new Promise(function(resolve, reject){
			if(!newIds.length) return resolve();

			ws.send({
				cmd: 'load',
				filter: {
					id: {$in: newIds},
				},
				collection: Builder.collection
			}, function(r){
				(r.items || []).forEach(function(item){
					Builder.items[item.id] = item;
				});

				resolve(r.items);
			});
		});
	},


	collectAll: function(path){
		var fltr = {
			path: path
		};

		return new Promise(function(resolve, reject){
			ws.send({
				cmd: 'load',
				filter: fltr,
				sort: {time: -1},
				collection: Builder.collection
			}, function(r){
				var ids = [];
				(r.items || []).forEach(function(item){
					Builder.items[item.id] = item;
					ids.push(item.id);
				});

				resolve(ids);
			});
		});
	},

	fileDomains: [
		'http://f.io.cx/',
		'https://f.io.cx/',
		'http://files.mp3gif.com/'
	],

	item: function(item, mod){
		if(typeof item == 'string' || typeof item == 'number')
			item = Builder.items[item];
		if(!item) return;

		if(!mod) mod = {
			noSort: true
		};

		var file = item.file;
		if(!file && item.src){
			Builder.fileDomains.forEach(function(f){
				if(item.src.indexOf(f) === 0)
					file = item.src.substr(f.length);
			});
		}

		var $thumb = $('<span>', {id: 'image-'+(item.id || 'uploading'), class: 'thumb'});
		$thumb.data(item);

		if(item.type == 'view'){
				if(!item.owner) return false;
				Builder.view($thumb, item);
		}
		else
		if(item.type == 'image'){
			if(item.src)
				Builder.thumbnail($thumb, item);
			else
			if(item.file)
				item.src = Cfg.files + item.file;


			if(Builder.youtube($thumb, item)){}
			else
			if(item.src && item.src.indexOf('ggif.co')+1)
				Builder.ggifFrame($thumb, item);
			else
			if(file){
				$thumb.addClass('file');
				$thumb.css({'background-image': "url("+Cfg.thumber+item.src.replace('://', '/')+")"});
				Builder.loadFile(file, $thumb);
			}
			else
				Builder.image($thumb, item);
		}

		/*
		if(item.width && item.height){
			$thumb.css({
				width: parseInt($thumb.css('height'))*item.width/item.height
			});
		};
		*/

		if(!mod.noSort)
			$thumb.sortable(function(){
				Images.dragged($thumb);
			});

		if(!mod.noRemove)
			$thumb.drag("start", function(ev, dd){
				$('#remove').fadeIn('fast');
			}).drag("end", function(){
				$('#remove').fadeOut('fast');
			});

		return $thumb;
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

	thumbnail: function($thumb, item){
		var thumb;


		if(item.src){
			if(item.src.indexOf('data:image')==0) return;

			var video = Builder.parseVideoURL(item.src);
		}

		if(video && video.provider == 'youtube')
			thumb = 'http://img.youtube.com/vi/'+video.id+'/sddefault.jpg';
		else{
			var u = item.src.split('://');
			thumb = Cfg.thumb+u[0]+'/'+u[1];
		}

		$thumb.css('background-image', 'url('+thumb+')');

		return $thumb;
	},

	image: function($thumb, item){
		var image = new Image,
			$image = $(image).appendTo($thumb);

		if(item.file){
			image.src = Cfg.files+item.file;

			$(image).dblclick(function(){
				Builder.playAudio(image);
			});
		}
		else
		if(item.src)
			image.src = item.src;


		return image;
	},

	youtube: function($thumb, item){
		if(item.src){
			var video = Builder.parseVideoURL(item.src),
				vid = video.provider;
		}

		if(!video || video.provider != 'youtube') return;

		var frame = document.createElement("iframe");
			frame.src = 'https://www.youtube.com/embed/'+video.id;
		$thumb.addClass('youtube').append(frame);
		$thumb.append("<div class='iframe-cover'></div>");

		return frame;
	},

	ggifFrame: function($thumb, item){
		var p = item.src.replace('http://', '').split(/[\/]+/);
		//var thumb = 'http://'+p[0]+'/'+p[1]+'/'+p[1]+'.gif';

		var frame = document.createElement("iframe");
		frame.onload = function(){

		}
		frame.onerror = function(){
			$thumb.parent().children('span[href="'+item.src+'"]').remove();
		}

		//frame.width = h;
		//frame.height = h;
		frame.src = item.src.replace('http://', 'https://');
		$thumb.addClass('ggif').append(frame);
		$thumb.append("<div class='iframe-cover'></div>");
		//$thumb.append("<div class='iframe-cover'></div>");

		return $thumb;
	},

	loadFile: function(fid, $thumb){
		var image = new Image;
		image.onload = function(){
			$thumb.append(image);
			Builder.resize($thumb);


			var gif = new Gif(image.src, function(){
				if(!gif.segments)
					return;

				$(image).remove();

				var carousel = $thumb.parent()[0].carousel;
				$thumb.append(gif.canvas);
				Builder.resize($thumb);
				gif.fade = true;
				$(gif.canvas).click(function(){
					gif.audio.volume = 1;
					gif.play(0);
				});
			});

			$thumb.append(image);
		};

		image.src = Cfg.files + fid;
	},


	view: function($thumb, item){
		$thumb.addClass('item-user');

		if(item.owner)
			Builder.getGPicture(item.owner, function(url){
				if(url)	$thumb.css({
					'background-image': 'url('+url+')'
				});
			});

		$thumb.attr('title', item.owner || item.gid);
	},


	gPictures: {},
	getGPicture: function(gName, cb){
		var url = Builder.gPictures[gName];
		if(url) return cb(url);
		else if(url === false) return;

		$.getJSON('http://picasaweb.google.com/data/entry/api/user/'+gName+'?alt=json', function(r){
			if(!r || !r.entry) return;

			var url = r.entry.gphoto$thumbnail.$t.replace('/s64-c/', '/s300-c/');

			Builder.gPictures[gName] = url;
			cb(url);
		}).fail(function(){
			Builder.gPictures[gName] = false;
		});
	},

	/*
		will resize the thumbnail to fit into carousel's height
		if no $thumb given, then it will check them all.
	*/
	resize: function($thumb){
		var $carousel = $thumb.parent();
		if(!$carousel.hasClass('carousel')) return;
		var carousel = $carousel[0].carousel;


		var h = carousel.$t.height();
		var d = $thumb.data();

		var iframe = $thumb.children('iframe')[0];
		if(iframe){
			var h = this.$t.height();

			var image = new Image;
			image.onload = function(){
				var w = h*image.width/image.height;

				$thumb.css({
					width: w,
					height: h
				}).data({
					width: image.width,
					height: image.height
				});
			}

			var url = iframe.src;
			if(url.indexOf('ggif.co')+1){
				var p = url.replace('http://', '').replace('https://', '').split(/[\/]+/);
				var thumb = 'http://'+p[0]+'/'+p[1]+'/'+p[1]+'.gif';

				image.src = thumb || url;
			}
			else{
				var video = pix.parseVideoURL(url),
					vid = video.provider;

				if(video.provider == 'youtube')
					image.src = 'http://img.youtube.com/vi/'+video.id+'/sddefault.jpg';
			}

			return;
		}


		var canvas = $thumb.children('canvas')[0];
		if(canvas){
			$thumb.children('canvas').css({
				height: h
			});
		};

		var set = function(){
			var w;
			if(image)
				w = h*image.width/image.height;

			if(!image || !image.width || !image.height)
				w = h*d.width/d.height;

			$thumb.css({
				width: w,
				height: h
			}).children('img').css({
				width: w,
				height: h
			});
		};

		var image = $thumb.children('img')[0];
		if(!image) return set();

		set();
		image.onload = set;
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
}

$(function(){
	$(document).on('mouseleave', '.ggif,.youtube', function(ev){
		$(this).children('.iframe-cover').show();
	});

	$(document).on('click', '.iframe-cover', function(ev){
		$(this).hide();
	});
});
