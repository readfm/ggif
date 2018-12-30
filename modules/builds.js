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
				collection: Cfg.collection
			}, function(r){
				(r.items || []).forEach(function(item){
					Builder.items[item.id] = item;
				});

				resolve(r.items);
			});
		});
	},

	item: function(item){
		if(typeof item == 'string' || typeof item == 'number')
			item = Builder.items[item];
		if(!item || !item.id) return;

		var $thumb = $('<span>', {id: 'image-'+item.id, class: 'item'});
		$thumb.data(item);

		if(item.src){
			var u = item.src.split('://');
			var thumb = Cfg.thumb+u[0]+'/'+u[1];
			$thumb.css('background-image', 'url('+thumb+')');
		}
		else
		if(item.file)
			item.src = Cfg.files + item.file;

		if(item.src && item.src.indexOf('ggif.co')+1){
			Builder.ggif(item, $thumb);
		}
		else{
			var image = new Image,
				$image = $(image).appendTo($thumb);

			if(item.fid)
				image.src = '/'+item.fid;
			else
			if(item.src)
				image.src = item.src;
			else return;
		}

		/*
		if(item.width && item.height){
			$thumb.css({
				width: parseInt($thumb.css('height'))*item.width/item.height
			});
		};
		*/

		$thumb.sortable(function(){
			Images.dragged($thumb);
		});


		$thumb.drag("start", function(ev, dd){
			$('#remove').fadeIn('fast');
		}).drag("end", function(){
			$('#remove').fadeOut('fast');
		});

		return $thumb;
	},

	youtube: function(){

	},

	ggif: function(item, $thumb){
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
		//$thumb.append("<div class='iframe-cover'></div>");

		return $thumb;
	}
}