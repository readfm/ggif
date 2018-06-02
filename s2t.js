var fs = require('fs'),
	ytdl = require('ytdl-core'),
	ffmpeg = require('fluent-ffmpeg');

global.s2t = {
	path: cfg.files+'youtube/',
	credentials: {
		url: 'https://stream.watsonplatform.net/speech-to-text/api',
		username: '582be268-8c1b-4e8a-908d-3cf1174a71ef',
		password: 'yhTZLaksW5Eh',
		version: 'v1'
	},

	recognize: function(){

	},

	youtube: 'http://www.youtube.com/watch?v=',
	downloadYoutube: function(id, cf, cb){
		var opt = {
			filter: 'audioonly',
		};
		_.extend(opt, cf);

		if(opt.startTime) opt.startTime = parseFloat(opt.startTime);
		if(opt.duration) opt.duration = parseFloat(opt.duration);

		ytdl.getInfo(s2t.youtube+id, opt, (err, info)=>{
        	var tmpFile = query.tmp + randomString(6) + '.mp3',
    			ws = fs.createWriteStream(tmpFile);

			var reader = ytdl.downloadFromInfo(info, opt)
			reader.pipe(ws);
			reader.on('end', () => {
				var file = {
					mime: 'audio/opus',
					yid: id
				};
				_.extend(file, _.pick(opt, 'startTime', 'duration'));

				FS.save(file, function(r){
					var audio = ffmpeg(tmpFile).toFormat('opus');
					if(opt.startTime) audio = audio.seek(opt.startTime);
					if(opt.duration) audio = audio.duration(opt.duration);
					audio.saveToFile(query.pathFiles+r.id).on('end', function(){
    					fs.unlink(tmpFile);
						if(cb) cb(r)
					});
				});
			});
		})
	},

	queryYoutube: function(q){
		if(typeof q.p[1] !== 'string') return;
		var yid = q.p[1],
			format = q.p[2];

		var source = s2t.path+yid;

		var make = function(){
			var fileName = yid;
			if(q.p[3]) fileName += '-'+q.p[3];
			if(q.p[4]) fileName += '-'+q.p[4];
			if(format) fileName += '.'+format;
			var path = format?(query.tmp + fileName):source;


			var pump = function(){
				query.pump(q, {
					path: path,
					filename: fileName,
					download: false
				});
			};

			try{
				fs.statSync(path);
			}catch(err){
				var stream = ffmpeg(source).toFormat(format);
				if(format == 'gif') stream = stream.size('320x?');
				if(format == 'gif') stream = stream.fps(7);
				if(q.p[3]) stream = stream.seek(parseFloat(q.p[3]));
				if(q.p[4]) stream = stream.duration(parseFloat(q.p[4]));

				stream.saveToFile(path).on('end', function(){
					pump();
				});
				return false;
			}

			pump();
		}

		try{
			fs.statSync(source);
		}catch(err){
			s2t.saveYoutube(yid, (path) => {
				make();
			});
			return false;
		}

		make();
	},

	saveYoutube: function(id, cb){
		var opt = {};
		console.log(id);
		ytdl.getInfo(s2t.youtube+id, opt, (err, info)=>{
			console.log(info);
        	var path = s2t.path + id,
    			ws = fs.createWriteStream(path);

			var reader = ytdl.downloadFromInfo(info, opt)
			reader.pipe(ws);
			reader.on('end', () => {
				cb(path);
			});

			reader.on('error', (event) => {
				console.error(event);
			});
		});
	},

	downloadVideo: function(id, cf, cb){
		if(typeof cf != 'object') cf = {};

		var opt = {
			filter: 'videoonly',
		};

		ytdl.getInfo(s2t.youtube+id, opt, (err, info) => {
        	var tmpFile = cfg.files + randomString(6) + '.mp4',
    			ws = fs.createWriteStream(tmpFile);

    		log(tmpFile);

			var reader = ytdl.downloadFromInfo(info, opt);
			reader.pipe(ws);
			reader.on('end', () => {
				var path = query.tmp+randomString(5)+'.gif'

				var stream = ffmpeg(tmpFile).toFormat('gif');
				if(cf.start) stream = stream.seek(cf.start);
				if(cf.duration) stream = stream.duration(cf.duration);
				stream.saveToFile(path).on('end', function(){
					if(cb) cb(path)
				});
				return;
				require('gify')(tmpFile, path, cf, function(err){
					if(err) throw err;
					else cb(path);
				});
			});
		})
	},

	makeGif: function(source, cb, start, duration){
		var stream = ffmpeg(source).toFormat('gif');
		if(start) stream = stream.seek(start);
		if(duration) stream = stream.duration(duration);

		var path = query.tmp+randomString(5)+'.gif'
		stream.saveToFile(path).on('end', function(){
			if(cb) cb(path)
		});
	}
}

ffmpeg.setFfmpegPath(cfg.path.ffmpeg);
ffmpeg.setFfprobePath(cfg.path.ffprobe);

S['s2t.fromYoutube'] = function(m, ws){
	if(typeof m.yid !== 'string') return;

	var cf = {};
	_.extend(cf, _.pick(m, 'startTime', 'duration'));
	s2t.downloadYoutube(m.yid, cf, (file) => {
		(RE[m.cb] || fake)({file: file});
	});
};

S['s2t.saveYoutube'] = function(m, ws){
	if(typeof m.yid !== 'string') return;

	s2t.saveYoutube(m.yid, (path) => {
		(RE[m.cb] || fake)({done: !!path});
	});
};

S['s2t.checkYoutube'] = function(m, ws){
	if(typeof m.yid !== 'string') return;

	var source = s2t.path+m.yid;

	try{
		fs.statSync(source);
	}catch(err){
		(RE[m.cb] || fake)({exists: false});
		return false;
	}
	(RE[m.cb] || fake)({exists: true});
};

S['watson.token'] = function(m, ws){
	//if(s2t.token) return (RE[m.cb] || fake)({token: s2t.token});

	var host = 'stream.watsonplatform.net/authorization/api/v1/token',
		auth = s2t.credentials.username+':'+s2t.credentials.password,
		url = 'https://'+auth+'@'+host+'?url='+s2t.credentials.url;

	require('https').get(url, (res) => {
	  res.on('data', (d) => {
	  	s2t.token = d.toString();
	    (RE[m.cb] || fake)({token: s2t.token});
	  });
	}).on('error', (e) => {
	  console.error(e);
	});
}

if(typeof SAVE == 'object'){
	SAVE.gif = (m, ws) => {
		var tmpName = ws.stream.path.split('/').pop();

		fs.renameSync(ws.stream.path, cfg.files + 'gif/' + m.name);

		if(m.cb) RE[m.cb]({file: {
			name: m.name
		}, name: tmpName});
	}
}


S['s2t.transcribe'] = function(m, ws){
	if(typeof m.fid !== 'number') return;

	var cf = {};
	s2t.transcribe(m.fid, (r) => {
		(RE[m.cb] || fake)({watson: r});
	});
};

S['s2t.update'] = function(m, ws){
	if(typeof m.fid !== 'number') return;

	var set = _.pick(m, 'twext', 'syllables', 'segments', 'timings');
	db.collection('files').update({id: parseInt(m.fid)},{$set: set});
};
//s2t.downloadYoutube('a7xtsvj93qE');
