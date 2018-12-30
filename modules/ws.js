window.WebSocket = window.WebSocket || window.MozWebSocket;

var Sockets = window.Sockets = {};
var extend = window.$?window.$.extend:_.extend;

window.WS = function(cfg){
	var t = this;

	if(typeof cfg == 'string')
		cfg = {server: cfg};

	extend(t, {
		autoReconnect: false,
		reconnect_timeout: 25000
	}, cfg);

	this.on = {
		alert: function(msg){
			alert(msg.text);
		},

		progress: function(msg){
			var stream = t.stream;
			if(msg.b){
				if(stream.buffer.byteLength > msg.b){
					var perc = Math.round(100 * msg.b / stream.buffer.byteLength);
					//$('#progress').show();
					//$('#progress-label').text(perc+'%');

					stream.pumped = msg.b;
					t.pump();
				}
				else{
					var d = {
						cmd: 'saveStream',
					};

					extend(d, stream);
					delete d.callback;
					delete d.buffer;
					delete d.pumped;

					t.send(d, function(r){
						//$('#progress').hide();

						t.uploading = false;

						if(typeof stream.callback == 'function')
							stream.callback(r.file);
						//delete t.stream;

						var task = t.tasks.shift();
						if(typeof task == 'function')
							task();
					});
				}
			}
		}
	};


	if(t.autoReconnect) setInterval(function(){
		if(!t.connection || t.connection.readyState > 1)
			t.connect();
	}, t.reconnect_timeout);

	t.connect();

	this.ready = [];
};


WS.prototype = {
	online: {},
	cbs: {},

	connect: function(){
		var t = this;

		var path = t.server;
		if(t.sid) path += '?sid=' + t.sid;

		this.connection = new WebSocket('ws://'+path);
		this.connection.binaryType = "arraybuffer";

		this.connection.onmessage = function(msg){
			t.message(msg);
		};
		this.connection.onclose = function(){
			delete Sockets[t.name || t.server];
		};

		this.connection.onerror = function(error){
			//console.error(error);
			return false;
		};

		this.connection.onopen = function(){
			Sockets[t.name || t.server] = t;
		};

		return this.connection;
	},

	send: function(msg, cb){
		if(!msg) return;

		if(cb){
			if(!msg.cb) msg.cb = randomString(15);
			this.cbs[msg.cb] = cb;
		}
		this.connection.send(JSON.stringify(msg));

		return msg.cb;
	},

	download: function(id){
		var ws = this;
		var chunks = [],
			length = 0;

		ws.onBuf = function(data){
			length += data.byteLength;
			chunks.push(new Uint8Array(data));
		};

		return new Promise(function(resolve, reject){
			ws.send({cmd: 'download', id: id}, function(r){
				if(r.error) return reject(Error(r.error));

				var data = new Uint8Array(length),
					cur = 0;

				for(i = 0; i < chunks.length; i++){
					data.set(chunks[i], cur);
					cur += chunks[i].byteLength;
				}

				resolve(data, r.file);
			});
		});
	},

	move: function(x,y){
		var buf = new ArrayBuffer(5),
			arr = new Uint8Array(buf);

		arr[0] = ws.id;
		arr[1] = ((x & 0xff00) >> 8);
		arr[2] = (x & 0x00ff);
		arr[3] = ((y & 0xff00) >> 8);
		arr[4] = (y & 0x00ff);

		this.connection.send(buf);
	},

	tasks: [],
	buffers: [],
	bufLength: 5000,
	uploading: false,

	upload: function(buffer, cb, info){
		var ws = this;

		var numTasks = this.tasks.length;
		this.tasks.push(function(){
			ws.uploading = true;
			var q = {
				cmd: 'createStream'
			};
			extend(q, info);
			ws.send(q, function(r){
				var stream = ws.stream = extend({
					pumped: 0
				}, info);

				/*
				$('#progress').attr('title', info?(info.name || ''):'');
				$('#progress-tasks').text('~'+ws.tasks.length);
				*/

				if(typeof cb == 'function')
					stream.callback = cb;

				if(typeof buffer == 'string')
					buffer = new Blob([buffer], { type: "text/plain" });

				if(buffer instanceof Blob){
        	var fileReader = new FileReader();
       		fileReader.onload = function(){
						stream.buffer = this.result;
						ws.pump();
       		}
       		fileReader.readAsArrayBuffer(buffer);
				}
				else{
					stream.buffer = buffer;
					ws.pump();
				}
			});
		});

		if(!ws.uploading)
			ws.tasks.shift()();
	},

	pump: function(){
		var ws = this;

		var buf = ws.stream.buffer.slice(ws.stream.pumped, ws.stream.pumped + ws.bufLength);
		ws.connection.send(buf);
	},

	str2ab: function(str) {
		var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
		var bufView = new Uint16Array(buf);
		for (var i=0, strLen=str.length; i<strLen; i++) {
			bufView[i] = str.charCodeAt(i);
		}
		return buf;
	},

	onBuf: function(data){},

	message: function(msg){
		if(msg.data instanceof ArrayBuffer){
			this.onBuf(msg.data);
			return;
		};

		msg = JSON.parse(msg.data);

		var cb;
		if(msg.cb && (cb = this.cbs[msg.cb])) cb(msg);

		if(this.on[msg.cmd])
			this.on[msg.cmd](msg);
	},

	registered: {},
	register: function(cmd, fn){
		var cmds = this.registered;
		if(typeof cmds[cmd] != 'object')
			cmds[cmd] = [];

		cmds.push(fn);
	},

	onCoords: function(msg){
		var arr = new Uint8Array(msg.data);
		this.draw(arr[0], (arr[1] << 8) + arr[2], (arr[3] << 8) + arr[4]);
	}
};
