window.ui = window.UI = {
	modal: function(selector){
		ui.closeModals();
		$('#modal').show();
		if(selector)
			ui.resizeModal(selector);
		console.log(selector);
	},

	closeModals: function(){
		$('#modal').css('opacity', 0.7).hide();
		$('.modal').hide();
		console.trace();
	},

	resizeModal: function(selector){
		var $box = $(selector).show(),
			 $cont = $box.children('.cont');
		
		if($cont.length>0){
			$box.height($cont.outerHeight());
			$box.width($cont.outerWidth());
		}
	},

	side: function(selector, right){
		var $side = $(selector);

		//ui.closeSides();
		setTimeout(function(){
			$side.show().css({
				right: right || 0
			}).trigger('open');
		}, 50);

		return $side;
	},

	closeSides: function(sel){
		if(!sel) sel = '.side';
		$(sel).each(function(){
			var $side = $(this);
			$side.css($side.hasClass('right')?'right':'left', -($side.outerWidth()+10));
			
			setTimeout(function(){
				if(parseInt($side.css('right')) < -100)
					$side.trigger('close');
			}, 700);
		});
	},

	openApp: function(selector){
		$('.app').hide();
		return $(selector).show();
	}
}

$(function(){
	ui.closeModals();

	$('#modal').click(function(){
		ui.closeModals();
	});

	ui.closeSides();
	$('.side > .x').click(function(){
		ui.closeSides(this.parentNode);
	});

	$(document).on('click', '.x', function(event){
		if($(event.target).parents('.slide').length)
			$(event.target).parents('.slide').slideUp();
	});

	$(document).ajaxSend(function(){
		$('#logo').addClass('spin');
	})
	.ajaxStop(function(){
		$('#logo').removeClass('spin');
	});

	$(document).click(function(ev){
		//console.log(ev.target);
		if(
			!$(ev.target).parents('.side').length && 
			!$(ev.target).hasClass('side') &&
			$(ev.target).is(':visible') &&
			!$(ev.target).parents('.tip').length && 
			!$(ev.target).hasClass('tip') &&
			!$(ev.target).parents('.modal').length && 
			!$(ev.target).parents('.options').length && 
			!$(ev.target).parents('.stay').length && 
			$(ev.target).attr('id') != 'modal'
		){
			ui.closeSides();
		}
	});

	document.addEventListener('dragover', q.p, false);

	
	$('.slider>.sl').drag("start", function(ev,dd){
		dd.limit = $(this).parent().outerWidth() - $(this).outerWidth() - 3;
		dd.fp = this.offsetLeft;
	}).drag(function(ev,dd){
		var l = Math.min(dd.limit, Math.max(0, dd.fp + dd.deltaX));
		$(this).trigger('updateValue', l);
	}).on('updateValue', function(ev, l){
		var $sl = $(this);
		this.style.left = l+'px';
		//$sl.parent().data('prec', (l-1) / (dd.limit - 1));
		$sl.parent().trigger('updateTube');
	});

	$('.slider').on('updateTube', function(){
		var $tube = $(this).children('.tube');
		if(!$tube.length) return;

		if($tube.prev().hasClass('sl'))
			$tube.css('left', $tube.prev().position().left);
		else $tube.css('left', 0);

		if($tube.next().hasClass('sl'))
			$tube.css('right', $tube.parent().width() - $tube.next().position().left);
		else $tube.css('right', 0);
	}).trigger('updateTube');
	
	$('.slider').on('reset', function(){
		var $tube = $(this).children('.tube');
		$(this).children('.sl:nth-of-type(1)').css('left', 0).text('');
		var $sl2 = $(this).children('.sl:nth-of-type(2)').text('');
		$sl2.css('left', $(this).innerWidth()-$sl2.innerWidth());
		$sl.parent().trigger('updateTube');
	});
	
	$(document).on('click', '.check, .bub', function(ev){
		ev.preventDefault();
		var $bub = $(this);
		ev.stopPropagation();
		if($bub.hasClass('disabled')) return;
		$bub.toggleClass('v');
		return false;
	});

	$('.tip.options > div').click(function(){
		$('.fcs').val($(this).data('value') || $(this).text());
	});

	window.tip = {
		active: false,
		hide: function(selector){
			//if(tip.active){
				$(selector || '.tip:not(.static)').hide();
				$('.fcs').removeClass('fcs');
				tip.active = false;
			//}
		}
	};

	$(document).click(function(ev){
		if(!$(ev.target).parents('.tip:not(.options)').length && !$(ev.target).hasClass('tip'))
			tip.hide();
	});

	$('.tip > .choose').click(function(){
		if($(this).hasClass('disabled')) return;
		$(this).toggleClass('v');
		return false;
	});

	$('.tip > .option').click(function(){
		$(this).parent('.tip:not(.static)').fadeOut(100);
	});




	$(".range").tip({
		pos: 't',
		id: 'range'
	});

	var $sl = $('#range > .slider').children('.sl');
	$sl.drag(function(ev, dd){
		var $input = $('input.fcs');
		var multiply = $input.data('multiply') || 1;
		var r1 = ($sl.eq(0).position().left || 0) * multiply;
		var r2 = $sl.eq(1).position().left * multiply;
		$sl.eq(0).text(r1);
		$sl.eq(1).text(r2);

		$('input.fcs').val(r1+' - '+r2);
	});
});


$.fn.tip = function(conf){
	$(this).each(function(){
		var cfg = {
			$t: $(this),
			id: 'tip',
			fix: false,
			pos: 'b',
			context: false,
			event: 'click',
			fadeOutSpeed: 10,
			fadeInSpeed: 10,
			stay: false
		}
		$.extend(cfg, conf);

		if(cfg.beforeAppear)
			cfg.ba = cfg.beforeAppear;
		
		if(cfg.context)
			var $ctx = $(this);

		var $cont = cfg.$tip = $('#'+cfg.id);

		function showTip(){
			if($cont.is(':visible'))
				tip.hide($cont);

			var $el = (cfg.context || cfg.bind)?$(this):cfg.$t;

			if(cfg.ba)
				if(cfg.ba($el) === false) return false;

			if(!cfg.$t.parents('.tip').length)
				$('.tip:not(.notRelated)').fadeOut(cfg.fadeOutSpeed);

			if(cfg.pos != 'last')
				$('.fcs').removeClass('fcs');

			
			if($cont.length){
				$cont[0].init = $el[0];
				var w = $cont.outerWidth(),
					h = $cont.outerHeight(),
					ew = $el.outerWidth(),
					eh = $el.outerHeight(),
					et = $el.offset().top,
					el = $el.offset().left;
					 
				var css = {}
				
				if(typeof cfg.pos == 'function')
					css = cfg.pos($el, $cont);
				else if(cfg.pos == 't' || cfg.pos == 'b'){
					var tp = (et-h),
						bp = (et + eh);

					css.top = (cfg.pos == 'b')?((($(window).height()) < (bp+h))?tp:bp):bp;
					
					if(cfg.pos == 't')
						css.top = tp>0?tp:bp;
					
					if(cfg.fix == 'w'){
						css.width = ew;
						css.left = el;
					}
					else
					if(cfg.fix == 'h'){
						css.height = eh;
						css.top = et;
					}
					else
					if(cfg.fix == 'c'){
						css.left = el + (ew-w)/2;
					}
					else{
						//var pl = el + (ew - w)/2
						//css.left = pl<0?(el + 2):pl;
						css.left = el;
					}
				}
				else if(cfg.pos == 'r'){
					css.left = el + ew;
					css.top = et + (eh - h)/2;
				}
				else if(cfg.pos == 'l'){
					css.left = el - w;
					css.top = et + (eh - h)/2;
				}
				else if(cfg.pos == 'last'){
					var $lastTip = $('.tip:visible');
					css.top = $lastTip.css('top');
					css.left = $lastTip.css('left');
				}

				var width = css.width || w,
					right = css.left + width;

				if(right > $(document).width()){
					css.left = $(document).width() - width - 1;
				}

				if(css.left < 0)
					css.left = 0;
				
				if(cfg.pos != 'last' && cfg.event != 'hover')
					$el.addClass('fcs');

				tip.active = true;

				var classPos = {
					t: 'tip-top',
					r: 'tip-right',
					l: 'tip-left',
					b: 'tip-bottom'
				};

				var $tri = $cont.children('.tri');
				if($tri.length && cfg.fix == 'c')
					$tri.css('left', el - css.left + ew/2 - 5);

				$cont.removeClass('tip-left tip-right tip-top tip-bottom').addClass(classPos[cfg.pos])
				.css(css).fadeIn(cfg.fadeInSpeed, function(){
					if(cfg.afterAppear)
						cfg.afterAppear(cfg);
				});
			}
			return false;
		};
		
		cfg.func = showTip;
		
		if(cfg.on)
			cfg.on(cfg);

		if(typeof cfg.onEdit == 'function')
			cfg.$t.on('keyup', function(ev){
				cfg.onEdit(ev, cfg);
			});
		else
		if(cfg.context)
			$ctx.on('contextmenu', cfg.context, showTip);
		else if(cfg.bind){
			cfg.$t.on(cfg.event, cfg.bind, showTip);
		}
		else{
			if(cfg.event) cfg.$t[cfg.event](showTip);
			if(cfg.event == 'hover')
				cfg.$t.mouseout(function(){
					$('#'+cfg.id).fadeOut(100);
				});
		}

	});
	return this;
};


$.fn.slider = function(conf){
	$(this).each(function(){
		var $slider = $(this),
			limit = $slider.outerWidth() - $slider.children('.sl').outerWidth() - 3;
		$slider.data('prec', ($slider.children('.sl').position().left-1) / (limit - 1))
		.children('.sl').drag("start", function(ev,dd){
			dd.limit = $(this).parent().outerWidth() - $(this).outerWidth() - 3;
			dd.fp = this.offsetLeft;
		}).drag(function(ev,dd){
			var l = Math.min(dd.limit, Math.max(1, dd.fp + dd.deltaX));
			this.style.left = l+'px';
			$(this).parent().data('prec', (l-1) / (dd.limit - 1));

			console.log(l);
		});
		console.log($slider.children('.sl').position().left);
	});
};

$.fn.date = function(time){
	var date = new Date(time);
	var $t = this;

	var intr = $t.data('_interval');
	if(intr) clearInterval(intr)

	var upd = function(){
		$t.text(date.pretty());
	}
	$t.data('_interval', setInterval(upd, 60000));
	upd();

	return $t;
}

$.fn.cc = function(c, speed){
	if(!speed) speed = 600;
	if(c)
		this.data('_c', c).each(function(){
			var $el = $(this);
			if($(this).data('_cc')) clearInterval($(this).data('_cc'));
			$el.data('_cc',setInterval(function(){$el.toggleClass(c);},speed));
		});
	else this.each(function(){
		if($(this).data('_cc')){
			$(this).removeClass($(this).data('_c'));
			clearInterval($(this).data('_cc'));
			$(this).data({_c: null, _cc:null});
		}
	});
	return this;
};

$.fn.inp = function(clean){
	var data = {};
	this.find('input.changed, .inp.changed, textarea.changed, .ap').each(function (i){
		var $el = $(this);
		data[$el.attr('name')] = $el.hasClass('check')?($el.hasClass('v')?1:0):$el.val();
		if(clean)$el.removeClass('changed').val('');
	});
	return data;
};

$.fn.blink = function(cls, time, cb){
	cls = cls || 'wrong';
	time = time || 1200;
	var $el = this.addClass(cls);
	setTimeout(function(){
		$el.removeClass(cls);
		if(cb)cb();
	},time);
	return this;
};

$.fn.err = function(msg){
	if(msg){
		$(this).addClass('err');
		if(typeof msg == 'string') $(this).attr('title',msg);
	}
	else if($(this).hasClass('err'))$(this).removeClass('err').removeAttr('title');
	return this;
}



$(function(){
	var $nextSlide;
	$('.slides > .navigator').on('click', 'span', function(){
		var index = $(this).prevAll('span').length,
			back = $(this).nextAll('span.on').length;
		
		$nextSlide = $(this).parent().siblings('.slide').eq(index);
		$(this).siblings('.to'+(back?'Left':'Right')).click();
	});
	
	$('.slides > .slide:first-of-type, .slides > .navigator > span:first-of-type').addClass('on');
	
	$('.slides .toLeft, .slides .toRight').click(function(){
		var $slide = $(this).parent().siblings('.slide.on'), $next,
			back = $(this).hasClass('toLeft');;

		if(parseInt($slide.css('left')))return;
		
		if($nextSlide){
			$next = $nextSlide;
			$nextSlide = null;
		}
		else{
			$next = $slide[back?'prev':'next']('.slide');
			if(!$next.length) $next = $slide.siblings('.slide')[back?'last':'first']();
		}

		$slide.show().css('left', 0).animate({left: (back?'':'-')+'100%'}).removeClass('on');

		$next.css('left', (back?'-':'')+'100%').show().animate({left: 0}, function(){
			$slide.fadeOut();
		}).addClass('on');

		var index = $next.prevAll('.slide').length;
		$(this).siblings('span').eq(index).addClass('on').siblings().removeClass('on');
		//$slide.next().addClass('slideRight').show().removeClass('slideRight');
	});
});