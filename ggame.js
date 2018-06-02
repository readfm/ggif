window.Ggame = {
	keyCodes: [
		81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 65, 83, 68, 70, 74, 75,
		76, 186, 222, 71, 72, 90, 88, 67, 86, 66, 78, 77, 188, 190, 191,
		219, 221, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57
	],

	tap: function(){
		var $active = $('#game > .mark'),
			$mark = $active.nextAll('i:not(.skip)').eq(0);

		if($mark.length)
			$mark.addClass(0?'red':'green');
		else
		if($active.length){
			$mark = $();
			//Ggame.finish();
		}
		else{
			$mark = $('#game>i:not(.skip)').eq(0);
			//Ggame.start();
		}
		console.log('tap');

		Ggame.tapTime = (new Date()).getTime();

		$('#game > i:not(.skip)').removeClass('mark green red');
		$mark.addClass('mark').siblings().removeClass('red green');
		if(!$mark.length) $('#game > i').removeClass('red green');

		if(
			!$mark.prevAll('i:not(.skip)').slice(0,3).filter('.tap').length &&
			!$mark.nextAll('i.tap').length &&
			!$mark.hasClass('tap')
		)
			Tx.finishTap();
	},

	timings: [],
	start: function(){
		delete Ggame.tapTime;
		console.log('Ggame.start');
		//$('#game > .mark').removeClass('mark');
		Ggame.startTime = (new Date()).getTime();
		console.log('Ggame.start');
	},

	dontSave: false,
	finish: function(){
		var active = Ggame.getActive();
		if(!active) return;
	},

	delay: 200,
	compare: function(result, average){
		var score = 0,
			my = 0,
			av= 0;

		//if(average && average.length == result.length)
			for (i = 0; i < result.length; i++){
				my += result[i];
				av += average[i];

				var dif = av?Math.abs(my - av):0;
				console.log(my +'-'+ av +'='+ (my - av));
				score -= Math.min(Ggame.delay, dif - Ggame.delay);
			};

		return parseInt(score);
	},

	getActive: function(){
		return $('#carousel > span[name='+Ggif.hash+']').data();
	},

	buildScore: function(item){
		var $item = Ggame.$score.clone();
		$item.data(item);

		if(item.user){
			var user = item.user;
			$item.find('.score-userName').text(user.fullName || user.name);
			if(user.avatar)
				$item.find('.user-avatar').css('background-image', "url('/"+user.avatar+"')");
		}

		$item.find('.score-duration').text((item.duration/1000)+'s');
		$item.find('.score-time').date(item.time);

		$item.find('.score-num').text(item.score);
		//$item.find('.score-timings').text((item.timings || []).join(','));

		return $item;
	},

	loadScores: function(cb){
		var active = Ggame.getActive();
		ws.send({
			cmd: 'load',
			collection: 'scores',
			filter: {
				tid: active.id
			},
			sort: {time: -1}
		}, function(r){
			var $list = $('#scores-list').empty();
			$list.data('tid', active.id);

			var uids = [];
			(r.items || []).forEach(function(item){
				if(item.owner)
					uids.push(item.owner);
			});

			Acc.users(uids, function(users){
				(r.items || []).forEach(function(item){
					if(item.owner) item.user = users[item.owner];

					var $score = Ggame.buildScore(item);
					$list.append($score);
				});

				if(cb) cb()
			});
		});
	},

	loadAverges: function(cb){
		var active = Ggame.getActive();
		if(!active) return;
		ws.send({
			cmd: 'averages',
            field: 'timings',
			collection: 'scores',
			filter: {tid: active.id}
		}, function(r){
			Ggame.averages = r.list;
			if(r.list && cb)
				cb(r.list);
		});
	},

	playTimeouts: [],
	play: function(timings){
		Ggame.stopPlaying();

		Ggame.start();
		Ggame.dontSave = true;
		//Ggame.tap();
		$('#ggame').show();

		var $syllables = $('#ggame > i:not(.skip)'),
			l = $syllables.length;

		timings.splice(l-1);
		var time = 0;//(new Date()).getTime();
		//Ggame.tap();
		(timings || []).forEach(function(t, i){
			time += parseFloat(t);

			$syllables.eq(i).attr('data-time', time);

			var tO = setTimeout(function(){
				Ggame.tap();

				if(timings.length == i+1)
					Ggame.tap();
			}, time);
			Ggame.playTimeouts.push(tO);
		});
	},

	formatAverages: function(tim){
		var av = (tim || '').split(' ');
		//av.reverse();
		var averages = [],
			sum = 0;
		av.forEach(function(a){
			var num = parseFloat(a);
			if(!num) return;

			var t = num - sum;
			averages.push(t * 1000);
			sum += t;
		});

		return averages;
	},

	stop: function(){
		if(Ggif.youtube){
			Ggif.youtube.stopVideo();
		}
		Tx.stopPlaying();
	}
};

/*
window.syllabifier = new Syllabifier();
window.firebaseHandler = new FirebaseHandler();
*/

Site.ready.push(function(){
	ws.on.onSave = function(m){
		var $list = $('#scores-list');
		if(m.item && $list.data('tid') == m.item.tid){
			var $score = Ggame.buildScore(m.item);
			$list.prepend($score);
		}
	};

	ws.send({
		cmd: 'onSave',
		collection: 'scores',
		filter: {}
	});
});


$(function(){
	Ggame.$ = $('#ggame');
	Ggame.$score = $('#scores-list > .score').clone();

	$('#ggif').bind('ready', function(e){
		var syl = tickertape.syllabify(Ggif.seg);
		$('#ggame').html(syl);
	});

	$('#ggame').focus(function(){
		Ggame.stop();
	});

	$('#scores-open').click(function(){
		Ggame.loadScores(function(){
			UI.side('#scores');
		});
	});

	/*
	$('#ggame').click(function(){
		var active = Ggame.getActive();
		if(active){
			Ggame.loadAverges(function(averages){
				Ggame.play(averages);
			});
		}
		else{
			Ggame.averages = Ggame.formatAverages(Ggif.tim);
			Ggame.play(Ggame.averages);
		}
	});
	*/

	$('#scores-list').on('click', '.score', function(){
		var item = $(this).data();

		Ggame.play(item.timings);
	});
});
