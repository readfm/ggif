var fs = require('fs'),
	ytdl = require('ytdl-core'),
	ffmpeg = require('fluent-ffmpeg');


// Node.js class to manage youtube video downloads
class YoutubeDL{
  constructor(){

  }

	recognize: function(){

	},

	youtube: 'http://www.youtube.com/watch?v=',

	// initiate download task
	downloadYoutube(id, cf, cb){
		var opt = {
			filter: 'audioonly',
		};
		_.extend(opt, cf);

		if(opt.startTime) opt.startTime = parseFloat(opt.startTime);
		if(opt.duration) opt.duration = parseFloat(opt.duration);

		// get all information about video
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

					// save downloaded stuff into our files path
					audio.saveToFile(query.pathFiles+r.id).on('end', function(){
    					fs.unlink(tmpFile);
						if(cb) cb(r)
					});
				});
			});
		})
	},

	// ping youtube srv.
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

	// downloads full
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

	// use ffmpeg codecs to save video file as gif image
	makeGif: function(source, cb, start, duration){
		var stream = ffmpeg(source).toFormat('gif');
		if(start) stream = stream.seek(start);
		if(duration) stream = stream.duration(duration);

		// save gif in temporar folder for later use.
		var path = query.tmp+randomString(5)+'.gif'
		stream.saveToFile(path).on('end', function(){
			if(cb) cb(path)
		});
	}
}

// link executable of codecs
ffmpeg.setFfmpegPath(cfg.path.ffmpeg);
ffmpeg.setFfprobePath(cfg.path.ffprobe);
