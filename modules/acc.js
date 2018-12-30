window.acc = window.Acc = {
	user: false,
	avatar: new Image,
	onAvatar: [],
	u: {},
	uN: {},
	users: function(ids, cb){
		if(typeof ids != 'object') return false;
		
		var find = [],
			 fNames = [];
		ids.forEach(function(id, i){
			if(isNaN(id)){
				if(!acc.uN[id])
					fNames.push(id);
			}
			else{
				if(!acc.u[id])
					find.push(id);
			}
		});
		
		if(find.length || fNames.length)
			ws.send({
				cmd: 'load',
				collection: 'acc',
				filter: {
					$or: [
						{id: {$in: find}},
						{name: {$in: fNames}}
					]
				}
			}, function(r){
				(r.items || []).forEach(function(u){
					acc.u[u.id] = u;
					acc.uN[u.name] = u;
				});
				cb(acc.u);
			});
		else cb(acc.u);
	},
	
	updateList: function(users){
		users.forEach(function(u){
			acc.u[u.id] = u;
			acc.uN[u.name] = u;
		});
	},
	
	on: [],
	ok: function(user){
		if($('#authentication').is(':visible'))
			ui.closeModals();
		
		if(user) acc.user = user;
		$('#auth, #registration').hide();

		$('#acc').show();
		$('#fullName').text(acc.user.fullName || acc.user.name);
		if(acc.user.avatar)
			$('#avatar').css('background-image', "url('/"+acc.user.avatar+"')");

		$('.a').show();
		$('.na').hide();
		tip.hide();

		if(user.super)
			$('.super').show();

		acc.u[acc.user.id] = acc.user;
		acc.uN[acc.user.name] = acc.user;
		acc.on.forEach(function(f){
			f(acc.user);
		});
	},

	off: [],
	out: function(){
		console.log('out');
		$('.na').show();
		$('.a').hide();
		acc.user = false;
		$.cookie('sid', null, {path: '/'});

		$('.super').hide();

		acc.off.forEach(function(f){
			f();
		});
	}
}


Site.on.session = function(p){
	$.cookie('sid', p[1], {path: '/'});
	
	location.href = 'http://'+location.host+'#changePassword';
	location.reload();
};

Site.on.changePassword = function(){
	UI.modal('#changePassword');
};


$(function(){
	$('.a,.super').hide();
	
	if(acc.user) acc.ok();

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

	var auth = function(ev){
		$.post("acc/login", {
				"a" : $('#auth-username').val(), 
				"pass" : $('#auth-password').val()
			}, 
			function(r){
				if(r.err){
					if(r.err == "not exist")
						$('#auth-username').blink();
					else if(r.err == 'wrong password'){
						$('#auth-password').blink();
						//acc.tipPassword();
					}
				}
				else if(r.user){
					/*
					var cookie = {domain: '.'+host};
					if($('#auth-remember').hasClass('v'))
						cookie.expires = 60;
					*/
					//$.cookie('auth', r.acc.id+'-'+r.acc.key, cookie);
					
					$.cookie('sid', r.sid, {path: '/'});
					acc.ok(r.user);
				}
			}
		);
	};

	var auth = function(ev){
		ws.send({
			cmd: 'auth',
			name: $('#auth-username').val(),
			password: $('#auth-password').val()
		});
	};

	S.error.auth = function(m){
		if(m.msg == 'user not found') $('#auth-username').blink('red');
		else if(m.msg == 'wrong password' || m.msg == 'no password') $('#auth-password').blink('red');
		else $('#auth-submit').blink('red');
	}
	
	ws.on.acc = function(m){
		acc.ok(m.user);
		tip.hide();
	}


	$('#auth-submit').click(auth);
	$('#auth-username, #auth-password').bindEnter(auth);
	
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

	$('.a').hide();
	
	ws.on.updateProfile = function(m){
		if(m.profile && acc.user)
			acc.user = m.profile;
	}
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