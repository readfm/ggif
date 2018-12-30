$(function(){
	var newH = 0;Cookies.get('home-hApps');
	//resize(parseInt(newH) || 375);

	var $control = Site.$control = $('#control');
	$('#resize').drag("start",function(ev, dd){
		dd.done = 0;
		dd.$view = $('#view');
		Pix.$cover.show();
	}, {click: true}).drag(function(ev, dd){
		var dif = dd.deltaY - dd.done;
		
		if(dif > 0)
			Site.resizeNext(dd.$view, dif);
		else
			Site.resizePrev(TextData.$, dif);

		dd.done = dd.deltaY;
	}).drag("end", function(ev, dd){
		//Cookies.set('home-hApps', $('#home-apps').height());
		Pix.$cover.hide();
	});;

	$('#auth-google').click(function(){
		window.open(Cfg.auth.google, '_blank', {
			height: 200,
			width: 300,
			status: false
		});
	});
});