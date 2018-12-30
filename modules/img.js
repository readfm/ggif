var img = window.Img = {
	w: 380,
	h: 308,
	build: function(item){
		if(typeof item == 'string')
			name = item;


		var $el = $("<span class='thumb' name='"+name+"'></span>");
		
		$el.click(function(){
			if(img.drag) delete img.drag
			else img.show($(this));
		});
		
		$el.css('background-image', "url(/thumb/"+name+")");
			
		return $el;
	},

	w: 240,
	h: 180,
	build: function(inf){
		var $el = $("<span class='thumb' title='"+(inf.name || '')+" #"+inf._id+"'></span>")
			.css('background-image', "url("+inf.file+((!inf.w || (inf.w > img.w && inf.h > img.h))?"?thumb":'')+")")
			.data(inf)
			.click(function(){
				if(img.drag) delete img.drag
				else img.show($(this));
			});

		if(inf.w < img.w) $el.css('width', inf.w);
		if(inf.h < img.h) $el.css('height', inf.h);
			
		return $el;
	},

	generateThumb: function(image, cb){
		var ctx = document.createElement('canvas').getContext('2d');
		ctx.canvas.width = img.w,
		ctx.canvas.height = img.h;

		var w = img.w,
			h = img.h;
		
		/*
		ctx.fillStyle = color || "rgba(0,0,0,0.5)";
		ctx.beginPath();
		var o = wh/2;

		ctx.arc(o, o, o, 0, Math.PI*2, false);
		ctx.fill();
		ctx.clip();
		*/
		

		var ratio = image.width/image.height;
		if(w/h > ratio)
			var height = Math.round(w/ratio),
				width = w;
		else
			var width = Math.round(h*ratio),
				height = h;

		ctx.drawImage(image, (w-width)/2, (h-height)/2, width, height);
		
		if(cb) ctx.canvas.toBlob(cb);
		else{
			var im = new Image;
			im.src = ctx.canvas.toDataURL("image/png");
			return image;
		}
	},

	toBlob: function(image, type){
		var str = image.toDataURL("image/"+type, 1);

		var binary = atob(str.split(',')[1]);
		var array = [];
		for(var i = 0; i < binary.length; i++){
			array.push(binary.charCodeAt(i));
		}
		return new Blob([new Uint8Array(array)], {type: 'image/'+type});
	},
	
	saveImage: function(url, cb){
		$.query('/fs/download', {url: url}, function(r){
			if(!r.file) return;

			var im = new Image;
			im.onload = function(){
				img.saveThumb(im, function(){
					if(cb) cb(r.file);
				}, r.file.id);
			};
			im.onerror = function(){
				cb();
			} 
			im.src = '/'+r.file.id;
		});
	},

	saveThumb: function(image, cb, thumbName){
		if(!thumbName) thumbName = randomString(8);
		img.generateThumb(image, function(blob){
			$.ajax('/thumb/'+thumbName, {
				data: blob,
				processData: false,
				success: function(r){
					cb(r.name);
				},
				complete: function(){
				},
				type: 'PUT'
			});
		});
	},

	generateImage: function(blob, cb){
		var image = new Image();
		image.onload = function(){
			cb(this);
		}

		var reader = new FileReader();
		reader.onload = function(ev){
			image.src = ev.target.result;
		};
		reader.readAsDataURL(blob);
	},
	
	collapse: function(list){
		img.$cont.empty();
		if(list && list.length > 0)
			list.forEach(function(inf){
				var $img = img.build(inf);
				$img[0].addEventListener('dragstart', img.dragStart, false);
				img.$cont.append($img);
			});
	},
	
	dragStart: function(){
		this.addEventListener('dragstart', drag.start, false);
	},
	
	sel: '.img, .thumb',
	
	show: function(el){
		var $el = $(el);
		if(!$el.length) return;
		
		var item = $el.data();
		
		img.$ = $el;
		var $img = $('#img'+item.file);
		if($img[0])
			img.load($img);
		else{
			var image = new Image();
			//image.onload = image.onerror = img.load;
			image.id = 'img'+item.file;
			image.src = '/'+item.file;
			image.onload = function(){
				var $img = $(image).appendTo('#imgs');
				img.load($img);
			};
		}
	},

	load: function($img){
		$img = $($img);
		var width = $img[0].width,
			height = $img[0].height,
			ratio = width/height;
			 
		var w = Math.round($(window).width() - 80),
			h = Math.round($(window).height() - 70);
		
		if(w < width || h < height)
			if (w/h < ratio)
				var height = Math.round(w/ratio),
					width = w;
			else
				var width = Math.round(h*ratio),
					height = h;
		
		var wh = {width: width, height: height};
		
		$('#imgs > img, .addon').hide();
		$('#image .on').removeClass('on');
		
		$img.show().attr(wh);
		$('#image').css(wh);
		$('#mask').attr({width: wh.width, height: wh.height});
		ui.modal('#image');
		$('#image').triggerHandler('loaded');
	},
	
	next: function(){
		if(!img.$ || $('#image').is(':hidden')) return;
		var $next = img.$.nextAll(img.sel);
		img.show($next.length?$next:img.$.siblings(img.sel).first());
	},
	
	prev: function(){
		if(!img.$ || $('#image').is(':hidden')) return;
		var $prev = img.$.prev(img.sel);
		img.show($prev.length?$prev:img.$.siblings(img.sel).last());
	},
	
	move: function(){
		var fp = drag.fp,
			inf = {
				id: drag.$.data('id'),
				pos: drag.$.index()
			};
		
		$.post('/tree/move', inf);
	},

	allowUpload: function(){
		var t = this;
		function cancel(e){
			if (e.preventDefault) e.preventDefault(); // required by FF + Safari
			e.dataTransfer.dropEffect = 'copy'; // tells the browser what drop effect is allowed here
			return false; // required by IE
		}
		
		
		this.$t[0].addEventListener('dragover', cancel);
		this.$t[0].addEventListener('dragenter', cancel);
		this.$t[0].addEventListener('drop', function(ev){
			if(ev.dataTransfer.files.length)
				return t.upload(ev);
			
			return;
			var url = ev.dataTransfer.getData('Text');
			
			var qs = parseQS(decodeURIComponent(url));
			if(qs && qs.imgurl) 
				url = qs.imgurl;
			
			$.post('/tacks/add', {src: url, name: t.name}, function(r){
				if(r.tack){
					t.add(r.tack);
					
					//carousel.resize();
				}
			});
			ev.preventDefault();
			return false
		}, false);
	},
	
	queue: [],
	
	upload: function(evt){
		evt.preventDefault();
		
		var files = (evt.target.files || evt.dataTransfer.files);
		if(!files) return false;
		
		for (var i = 0, f; f = files[i]; i++){
			if(!f.type.match('image.*')) continue;
			img.queue.push(f);
		}
		
		img.send();

		return false;
	},
	
	uploading: false,
	send: function(){
		var t = this;
		if(t.uploading || !t.queue.length) return;

		var f = t.queue.shift();
		t.uploading = true;
		console.dir(f);
		
		//var $img = img.build({title: 'uploading'}).appendTo(img.$cont).cc('good',0.4);

		$.ajax('/', {
			data: f,
			processData: false,
			type: 'PUT',
			success: function(r){
				if(r.file){
					img.generateImage(f, function(image){
						img.saveThumb(image, function(thumbName){
							$.query('/tree/add', {
								tid: img.$cont.data('tid'),
								file: parseInt(r.file.id),
								thumb: thumbName,
								name: thumbName
							}, function(r){
								img.$cont.append(Img.build(r.item));
								$('#gallery-upload').blink('green');
								//carousel.$sThumbs.hide();
							});
						});
					});
				}
				else
					$('#gallery-upload').blink('red');
			},

			complete: function(){
				t.uploading = false;
				if(t.queue.length > 0)
					t.send();
			}
		});
	},
}

$.fn.img = function(list){
	img.$cont = this.empty();
	if(list && list.length > 0)
		list.forEach(function(inf){
			img.$cont.append(img.build(inf));
		});
}

$(function(){

	$('#img *').click(q.p);
	$('#img').bind("selectstart",  q.f);
	
	$(document).bind('keyup', 'left', img.prev).bind('keyup', 'right', img.next);
	//$('#imgs').click(img.next);
	
	
	$('#image-up').click(function(){
		$('.pg').hide();
		$('#gallery').show();
	});
	
	img.$cont = $('#gallery-images');
	
	$('#image-download').click(function(){
		document.location =  '/'+img.$.data('file');
	});
	
	$('#image-delete').click(function(){
		UI.closeModals();
		$.post('/tree/remove', {id: img.$.data('id')},
			function(r){
				if(r.ok>0)img.$.fadeOut('fast', function(){
					if(img.$.index() == 0  && $('#item').is(':visible'))
						catalog.change({_img: img.$.next().data('_id')});
					img.$.remove();
					delete img.$;
				});
			}
		);
	});

});

$.fn.placeThumbs = function(list){
	return $(this).each(function(){
		var $space = $(this).empty();

		list.forEach(function(id){
			var $thumb = img.build(id);
			$space.append($thumb);
		});

		if($space.hasClass('carousel')){
			$(this).css('margin-left', 0);

			var w = $space.innerWidth(),
				tw = $space.children().outerWidth(true),
				m = tw - $space.children().outerWidth();
			
			$space[0].scrollLeft = 0;
			$space.off().drag("start", function(ev, dd){
				dd.limit = $space.children().length * $space.children().outerWidth(true) - w - m;
				dd.start = this.scrollLeft;

			}).drag(function(ev, dd){
				if(dd.deltaX && dd.deltaY)
					img.drag = this;

				var x = dd.start - dd.deltaX;
				if(x > dd.limit) x = dd.limit;

				this.scrollLeft = Math.max(x, 0);
				$space.trigger('scrollCarousel');
			}).drag("end", function(ev, dd){
				setTimeout(function(){
					delete img.drag;
				},100);
			});
		}
	});
}

//Gallery
$(function(){
	$('#upl-img').bind('change', img.upload);

	$('#gallery-upload').click(function(){
		$('#upl-img').click();
	});
	
	$('#image-next').click(img.next);
	$('#image-prev').click(img.prev);
});