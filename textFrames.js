var textFrames = {
	monoW: {
		8: 5,
		9: 5,
		10: 6,
		11: 7,
		12: 7,
		13: 8,
		14: 8,
		15: 9
	},

	// give segments and prepare them to use in html game area
	syllabify: function(seg, timings){
		var lines = seg.split(/\n/g);

		var tims = Tx.findTimings(lines);

		var txt = lines.join(' ').replace(/\s/g, "</i><i class='skip'>&nbsp;</i><i>").replace(/\-/g, "</i><i>");
		txt = txt.replace(/\n/g, '<br/>');
		$('#game').html('<i>'+txt+'</i>');

		console.log('syllabify');

		Tx.setTimings(tims.length?tims:timings);

		Tx.resize();
		Site.resize();

		$('#save').show();
	},

	// split words into html
	splitWords: function(){
		$('#game > i:not(.skip)').each(function(){
			var $i = $(this),
				text = $i.text();

			if(text.indexOf(' ')+1){
				var words = text.split(' '),
					time = $i.data('time');

				var $words = $('<div></div>');
				words.forEach(function(word, i){
					if(i) $words.append("<i class='skip'>&nbsp;</i>");
					console.log(word);
					$('<i>'+word+'</i>').appendTo($words).data('time', time);
					time += 0.8;
				});
				C.log($words);
				$i.replaceWith($words.children());
			}
		});
	},

	//set timings onto syllables in game area
	setTimings: function(timings){
		var $syllables = $('#game > i:not(.skip)'),
			prev = 0;

		if(typeof timings == 'string') timings = timings.split(/[ ,]+/);
		(timings || []).forEach(function(t, i){
			var time = parseFloat(t);

			$syllables.eq(i).data({
				time: time,
				gap: time - prev,
				prev: prev,
				next: timings[i+1] || 0
			});
			prev = time;
		});
	},

	// make html code from syllables
	format: function(h){
		h = h.replace('>', '').trim();
		h = h.replace(/\s/g, "</i><i class='skip'>&nbsp;</i><i>").replace(/\-/g, "</i><i>");
		h = h.replace(/\n/g, '<br/>');
		h = '<i>'+h+'</i>';

		return h;
	},

	//save timings and segments on server from game area
	compile: function(){
		var lines = [];
		$('#twext > div').each(function(){
			lines.push($(this).text());
		});

		var timings = Tx.findTimings(lines);

		var h = "";
		lines.forEach(function(line, i){
			h += Tx.format(line) + ' ';
		});

		$('#game').html(h);

		ws.send({
			cmd: 'update',
			collection: Cfg.collection,
			id: Tx.id,
			set: {
				timings: timings,
				segments: lines.join(' ').replace('>', '').trim()
			}
		});

		Tx.setTimings(timings);
	},

	findSegments: function(){

	},

	// read timings from game area
	findTimings: function(lines){
		if(!lines || !lines.length) return [];

		var dur = $('#twext').hasClass('durations'),
			tim = 0;

		var timings = [];
		lines.some(function(line, i){
			var ts = line.split(/\s+/g);
			if(!ts.length) return;

			var tims = [];
			if(!ts.some(function(t){
				if(isNaN(t)) return true;

				if(dur)
					tims.push(parseFloat((tim+=t/100).toFixed(2)));
				else
					tims.push(parseFloat((parseFloat(t)).toFixed(2)));
			}) && tims.length){
				Array.prototype.push.apply(timings, tims);
				lines.splice(i, 1);
			}
		});

		return timings;
	},

	// find separate syllables from word
	syllabifyWord: function($w){
		var text = $w.text();
		if(!text) return;

		Tx.syllabifier.syllabifyText(text, function(word){
			var n = (word || '').split('-').length;
			if(n>1){
				var time = $w.data('time');
				var $m = $('<i>'+word.replace(/\-/g, '</i><i>')+'</i>');
				$w.replaceWith($m);

				$m.each(function(){
					$(this).data('time', time);
					time += 0.1;
				});
			}
		});
	},

	syllabifier: new Syllabifier,

	// load segments and timings from server
	checkWatson: function(cb){
		var filter = {
			yid: Tx.yid()
		};

		var startTime = Tx.timeStart(),
			lengthTime = parseFloat(document.getElementById('gif-youtube_length').value);

		if(startTime) filter.startTime = startTime;
		if(lengthTime) filter.duration = lengthTime;

		ws.send({
			cmd: 'get',
			collection: Cfg.collection,
			filter: filter
		}, function(m){
			if(!m.item){
				Tx.restart();
				return $('#game').addClass('game-transcribe');
			}

			Tx.id = m.item.id;

			if(m.item.timings && m.item.segments){
				Tx.syllabify(m.item.segments, m.item.timings);
			}
			else
			if(m.item.watson)
				Tx.compileWatson(m.item.watson);

			//Tx.restart();

			var title = $('#game').text();
			$('title, #pix8-title').text(title);
			$('#pix8-title').val(title);

			//Ggame.syllabify();

			if(cb) cb();
		});
	},

	// from object provided by watson get timings and segments
	compileWatson: function(w){
		var seg = '',
			tim = [];

		(w || []).forEach(function(result){
			(result.alternatives || []).forEach(function(alternative){
				(alternative.timestamps || []).forEach(function(stamp){
					var word = stamp[0];
					tim.push(parseFloat(stamp[1]));
					seg += word + ' ';
				});
			});
		});

		Tx.syllabify(seg, tim);

		$('#game > i:not(.skip)').each(function(){
			Tx.syllabifyWord($(this));
		});
	},

	// save stuff that came from watson
	saveWatson: function(skipSeg){
		var set = {timings: []};

		if(!skipSeg){
			set.segments = Tx.getText();
			set.text = $('#game').text();
		}

		$('#game > i:not(.skip)').each(function(){
			set.timings.push(parseFloat($(this).data('time')));
		});

		if(Tx.id){
			ws.send({
				cmd: 'update',
				collection: Cfg.collection,
				id: Tx.id,
				set: set
			});
		}
		else{
			$.extend(set, {
				yid: Tx.yid(),
				owner: User.id,
				type: 'twext',
				startTime: Tx.timeStart(),
				duration: parseFloat(document.getElementById('gif-youtube_length').value)
			});

			var req = {
				cmd: 'save',
				collection: Cfg.collection,
				item: set
			};

			ws.send(req, function(r){
				if(!r.item) return;
				Tx.id = r.item.id;
			});
		}
	},

	readWatson: function(w){
		var seg = '';

		(w || []).forEach(function(result){
			(result.alternatives || []).forEach(function(alternative){
				(alternative.timestamps || []).forEach(function(stamp){
					var word = stamp[0];
					seg += word + ' ';
				});
			});
		});

		return seg;
	},

	cfgWatson: {
		'content-type': 'audio/ogg;codecs=opus',
	},

	// fetch audio from youtube video using server's help
	getAudio: function(cb){
		var startTime = Tx.timeStart(),
			lengthTime = parseFloat(document.getElementById('gif-youtube_length').value);

		var srcAudio = 'http://'+Cfg.server+'/youtube/'+Tx.yid()+'/opus';
		if(startTime) srcAudio += '/'+(startTime);
		if(lengthTime) srcAudio += '/'+lengthTime;

		var request = new XMLHttpRequest();
		request.open('GET', srcAudio, true);
		request.responseType = 'arraybuffer';

		$('#resize').addClass('loading-youtube');
		request.onload = function(){
			$('#resize').removeClass('loading-youtube');

			Tx.audio = request.response;
			cb(request.response);
		}
		request.send();
	},

	// react on watson result
	onWatson: function(results){
		$('#resize').removeClass('loading-watson');

		if($('#youtube').is(':visible')){
			Tx.compileWatson(results);
			Tx.saveWatson();
		}
	},

	// make gif image from all the stuff we have
	makeGif: function(){
		var req = {
		   cmd: 's2t.dlYoutube',
		   yid: Tx.yid()
		};

		var startTime, lengthTime;
		if(startTime = Tx.timeStart())
			req.startTime = startTime;
		if(lengthTime = document.getElementById('gif-youtube_length').value)
			req.duration = lengthTime;

		$('#resize').addClass('loading-gif');
		ws.send(req, function(r){

		});
	},

	parseURL: function(url){
		if(!url) return {};

	 	function getParm(url, base){
		var re = new RegExp("(\\?|&)" + base + "\\=([^&]*)(&|$)");
		var matches = url.match(re);

		if(matches)
			return(matches[2]);
		else
			return("");
		}

		var retVal = {};
		var matches;
		var success = false;

		if(url.match('http(s)?://(www.)?youtube|youtu\.be')){
			if(url.match('embed'))
				retVal.id = url.split(/embed\//)[1].split('"')[0];
			else
				retVal.id = (url.split(/v\/|v=|youtu\.be\//)[1] || '').split(/[?&]/)[0];

			retVal.provider = "youtube";
			var videoUrl = 'https://www.youtube.com/embed/' + retVal.id + '?rel=0';
			success = true;
		} else if (matches = url.match(/vimeo.com\/(\d+)/)){
			retVal.provider = "vimeo";
			retVal.id = matches[1];
			var videoUrl = 'http://player.vimeo.com/video/' + retVal.id;
			success = true;
		}

		return retVal;
	},

	// create gif from all the stuff we need
	makeGgif: function(){
		if($('#resize').hasClass('loading-ggif')) return;

		if($('#gg').is(':visible'))
			return Ggif.make();

		var startTime = Tx.timeStart(),
			lengthTime = parseFloat(document.getElementById('gif-youtube_length').value);

		var src = '/youtube/'+Tx.yid()+'/gif';
		if(startTime) src += '/'+(startTime);
		if(lengthTime) src += '/'+lengthTime;

		$('#resize').addClass('loading-ggif');
		console.info('makeGif: '+src);
		Ggif.loadBuf(src, function(buf){
			console.info('loadBuf');
			delete Ggif.seg;
			delete Ggif.tim;
			Ggif.read(buf);
			console.info('read gif');
			Ggif.loadFrames();
		});
	}
}


window.firebaseHandler = new FirebaseHandler();

window.onhashchange = function(){
	Tx.checkHash();
};

Site.ready.push(function(){
	Tx.checkHash();
});
