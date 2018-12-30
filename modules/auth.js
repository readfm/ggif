$(function(){
	$('#acc-openMenu').tip({
		pos: 'b',
		id: 'acc-menu',
		event: 'click',
		fix: 'c',
		ba: function($el){

		}
	});

	$('#auth-menu').tip({
		pos: 'b',
		id: 'auth-tip',
		event: 'click',
		fix: 'c',
		ba: function($el){

		}
	});

	$('#auth-open').click(function(){
		ui.modal('#authentication');
	});

	$('#avatar').click(function(){
		$('#uplAvatar').click();
	});


	var auth = function(){
		var a = $('#auth-username').val();
			o = {
			cmd: 'auth',
			password: $('#auth-password').val()
		};

		if(a.indexOf('@')+1)
			o.email = a;
		else
			o.name = a;

		ws.send(o);
	};

	S.error.auth = function(m){
		if(m.msg == 'user not found') $('#auth-username').blink('red');
		else if(m.msg == 'wrong password' || m.msg == 'no password') $('#auth-password').blink('red');
		else $('#auth-submit').blink('red');
	}


	$('#auth-submit').click(function(ev){
		auth();

		ev.preventDefault();
		return false;
	});

	$('#auth-username, #auth-password').bindEnter(function(){
		//$('#auth-submit').click();
	});

	$(auth.password).tip({
		pos: 'b',
		id: 'tipPassword',
		event: false,
		on: function(cfg){
			acc.tipPassword = cfg.func;
		}
	});

	$('#auth-resetPassword').click(function(){
		UI.modal('#resetPassword');
	});

	$('#resetPassword-submit').click(function(){
		var $email = $('#resetPassword-email');

		ws.send({
			cmd: 'sendSession',
			email: $email.val(),
		}, function(r){
			if(r.error) $email.blink();
			if(r.user) UI.modal('#resetPassword-sent');
		});
	});

	$(auth.password).add(auth.username).bindEnter(auth.onsubmit);

	$('#nav > * > .ev').hide();

	$('#auth-registration').click(function(){
		if(!$('#registration').slideDown().length)
			$.get('./parts/registration.htm', function(r){
				$("<div class='slide' id='registration'>"+r+"</div>").insertAfter('#auth').slideDown();
			});
	});


	$('#auth-openRegistration').click(function(){
		tip.hide();
		if($('#signup').length)
			ui.modal('#signup');
		else
			$.get('/parts/registration.htm', function(r){
				$('body').append(r);
				ui.modal('#signup');
			})
	});

	$('#acc-logOut').click(function(){
		acc.out();
	});


	$('#acc-edit, #fullName').click(function(){
		Site.openApp('editProfile');
	});

	$('#acc-password').click(function(){
		UI.modal('#changePassword');
	});

	$('#changePassword-submit').click(function(){
		var $password = $('#changePassword-password');

		$('#changePassword .err').removeClass('err');

		if($password.val() < 4) $password.err('Too short');
		if($password.val() != $('#changePassword-password_re').val()) $('#changePassword-password_re').err('Both should match');

		if(!$('#changePassword .err').length){
			ws.send({cmd: 'changePassword', password: $password.val()});
			UI.modal('#changePassword-done');
		}
	});
});

window.addEventListener('login', function(ev, d){
	console.log(ev);
	console.log(d);
}, false);


Acc.on.push(function(user){
	var sid = location.hash.replace('#', '');
	if(!sid) return;

	ws.send({
		cmd: 'grant',
		sid: sid
	}, function(r){
		//if(r.ok) window.close();
		if(r.error) console.error(error);
	});
});

$(function(){
	$('#auth-make').click(function(ev){
		alert('account creation soon, send questions to duke@th.ai, thanks');
	});
});


//social networks
$(function(){
	var cb = randomString(9);
	$('#auth-social > .i-reddit').attr('href', 'http://pix8.0a.lt:81/auth/reddit?cb='+cb).click(function(){
		ws.send({
			cb: cb
		}, function(r){
			if(r.user){
				$.cookie('sid', r.sid, {path: '/'});
				ws.send({cmd: 'setSession', sid: r.sid});
				acc.ok(r.user);
			}
		});
	});

	$('#auth-social > a').click(function(){
		var service = $(this).data('service');

		if(service)
			window.open('http://'+domain+'/auth/'+service, '_blank', {
				height: 200,
				width: 300,
				status: false
			});
	});
});

Acc.on.push(function(){
	if(location.host.indexOf('auth')<0)
		location.reload();
});
