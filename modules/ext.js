chrome.runtime.onMessage.addListener(function(d, sender, sendResponse){
		console.log(d);
  	if(d.cmd == 'carousel'){
  		if(d.do) Pix8.$pic[d.do]();
  		sendResponse({
  			visible: Pix8.$pic.is(':visible'),
  			height: Pix.height()
  		});

  		if(Pix8.$pic.is(':visible'))
  			Pix.leaveGap();
  		else
  			Pix.restoreGap();
  	}
  	else
  	if(d.cmd == 'transformed'){
  		//onScroll();
  	}
  	else
  	if(d.cmd == 'carousel.update'){
		    if(carousel.getPath() == d.path)
			     Pix8.carousel.$tag.change();
  	}
  	else
  	if(d.cmd == 'auth'){
  		Pix.user = d.user;
  	}
  	if(d.cmd == 'files'){
  		carousel.files = d.files;
  	}
  	else
  	if(d.cmd == 'shot' || d.cmd == 'push'){
			var file = d.src.split('/').pop();
			var carousel = $('#mainCarousel')[0].carousel;

			if(d.skip){

				Pix.send({
					cmd: 'update',
					id: carousel.view.id,
					set: {
						image: file
					},
					collection: Cfg.collection
				});
			}
			else{
  			var $thumbOn = carousel.$t.children().eq(0);
  			carousel.include(Pix.parseURL(d.src), $thumbOn);
			}
  	}
  	else
  	if(d.cmd == 'hideCarousel'){
  		Pix8.$pic.hide();
  		sendResponse({visible: Pix8.$pic.is(':visible')});
  		//sendResponse({pong: true});
  	}
  	else
  	if(d.cmd == 'checkCarousel'){
  		sendResponse({visible: Pix8.$pic.is(':visible')});
  	}
  /* Content script action */
});
