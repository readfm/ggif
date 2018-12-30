$(function(ev){
	let sid = Cookies.get('sid');
  let path = Cfg.host;
  let port = Cfg.port;
  if(port) path += ':' + port;
	if(sid) path += '?sid=' + sid;

	var ws = window.ws = new WS({
    server: path,
    autoReconnect: true
  });
	window.S = ws.on;
  window.W = (m, cb) => ws.send(m, cb);

	S.session = m => {
		Cookies.set('sid', m.sid);
		//if(m.user) acc.ok(m.user);


		W({cmd: 'app'}, r => {
			window.App = r;
			User.id = Me.link = r.home_link;

			window.Pref = r || {};

			$(document).trigger('loaded');
			$(document).trigger('pref');
		});

		$(document).trigger('connected');
	}
});

$(document).on('loaded', ev => {
  console.log('loadeeed');
  var link = new Link(App.items_link + window.location.hash.substr(1) + '.yaml');
  link.load(item => {
    console.log(item.video || item.src);
    var linkVideo = new Link(item.video || item.src);
    $('#video').attr('src', linkVideo.http);
  })
});
