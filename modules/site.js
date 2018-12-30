var meta = {};
var domain = document.domain.toLowerCase(),
	host = domain.match(/[^.]+\.[^.]+$/);

window.site = window.Site = {
	on: {},
	ready: [],
	page: function(selector){
		$('.page').hide();
		return $(selector).show();
	},

	apps: {},

	states: {
		editProfile: {
			title: 'Edit Profile',
			needAuth: true
		}
	},

	hash: function(){
		return location.hash.replace('#','').replace(/^\/|\/$/g, '');
	},

	p: function(url){
		url = (url || window.location.pathname).replace(/^\/|\/$/g, '');
		var p = (url || '').split(/[\/]+/);
		return p;
	},

	setState: function(url){
		var p = site.p(url);
		var state = site.states[p[0]];

		history.pushState(_.pick(state, function(v){return typeof v != 'function'}), state.title,  '/'+url);
		site.openState(p);
	},

	openState: function(){

	},

	resize: ev => {
		window.resizeTo(window.outerWidth, $('#pic').outerHeight() /* + window.outerHeight - window.innerHeight*/);
		$('.carousel').last()[0].carousel.resize();
	},

	resizeNext: h => {
		console.log(h);
		Site.resize()
	},

	connect: q => {
		var ws = window.ws = new WS({
			server: /*window.isElectron?'localhost:81':*/Cfg.server,
			sid: Cookies.get(Cfg.sidCookie),
			name: 'main'
		});

		window.S = ws.on;
		window.W = (msg, cb) => {ws.send(msg, cb)};

		S.session = function(m){
			Cookies.set(Cfg.sidCookie, m.sid);
			//if(m.user) acc.ok(m.user);
			Site.session = m;

			Site.ready.forEach(function(f){
				f();
			});

			site.openState(site.p(window.location.pathname));
		}

		S.error = function(m){
			if(m.ofCmd && S.error[m.ofCmd])
				S.error[m.ofCmd](m);
		}
	}
};

$(document).ready(function(){
	$(window).resize(function(event){
	});

	$body = $('body');

	$('.x').click(ui.closeModals);

	//Site.connect();
	Site.ready.forEach(function(f){
		f();
	});

	$('#auth-open').click(function(){
		window.open('http://auth.taitis.com/#'+Cookies.get('sid'), '_blank', {
			height: 200,
			width: 300,
			status: false
		});
	});
});
