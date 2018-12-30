const YAML = require('js-yaml');
const _ = require('underscore');
const FS = require('fs');
const JP = require('path').join;

global.Links = {};
global.Link = class Link{
  constructor(url){
    this.url = this.link = url;

    if(url.indexOf('://')){
      var [protocol, way] = url.split('://');
      this.protocol = protocol;

      if(!way) return;

      var sep = way.indexOf('/');
      this.domain = this.hash = this.key = (sep == -1)?way:way.substr(0, sep);
      this.path = way.substr(sep+1) || '/';

      this.ext = this.path.split('.').pop();
    }

    Links[url] = this;
  }

  setup(then){
    this.act = 'setup';
    if(this.protocol == 'dat' || this.protocol == 'ipfs'){
      var sep = this.path.indexOf('/');
      var hash = this.path.substr(0, sep),
          path = this.path.substr(sep+1);
    }

    if(this.protocol == 'dat'){
      this.getDat(then);
    }
  }

  getDat(then){
    this.act = 'getData';
    if(this.dat) then(this.dat);
    else{
      this.forDat();
      then();
      return;
      Dats.get(this.hash).then(dat => {
        this.act = 'getDat';
        this.dat = dat;
        this.forDat();
        then(dat);
      });
    }
  }

  forDat(){
    this.read = () => {
      return new Promise((ok, no) => {
        try{
          var path = JP(Dat_map[this.key], this.path);
          var content = FS.readFileSync(path);
        }
        catch(err){
          if(err) return no(err);
        }

        this.content = content;
        ok(content);
      });
    }

    this.write = content => {
      return new Promise((ok, no) => {
        //if(!this.dat.writable) return no();

        var path = JP(Dat_map[this.key], this.path);
        FS.writeFile(path, content || this.content, err => {
          if(err) return no(err);
          ok();
        });
      });
    }

    /*
    this.write = content => {
      return new Promise((ok, no) => {
        if(!this.dat.writable) return no();

        this.dat.archive.writeFile(this.path, content || this.content, err => {
          if(err) return no(err);
          ok();
        });
      });
    }
    */

    this.log = line => {
      return new Promise((ok, no) => {
        //if(!this.dat.writable) return no();

        var path = JP(Dat_map[this.key], this.path);
        if(!FS.existsSync(path))
          FS.writeFileSync(path, line);
        else
          FS.appendFileSync(path, "\r\n"+line);

        ok();
      });
    }
  }

  update(set){
    return new Promise((ok, no) => {
      this.load(item => {
        _.extend(item, set);
        this.save(item).then(()=>{
          ok(item);
        });
      });
    });
  }

  save(item){
    this.act = 'save';

    var content;
    if(this.ext == 'json')
      this.content = JSON.stringify(item);
    else
    if(this.ext == 'yaml')
      this.content = YAML.safeDump(item);

    return new Promise((ok, no) => {
      this.setup(() => {
        this.write(this.content || item).then(() => {
          ok(item)
        }, () => {
          console.log('failed');
          no();
        });
      });
    });
  }

  load(cb){
    this.act = 'load';
    this.setup(() => {
      this.read(this.path).then(content => {
        let item;
        if(this.ext == 'json')
          item = JSON.parse(String(this.content));

        if(this.ext == 'yaml')
          item = YAML.safeLoad(String(this.content));

        if(this.ext == 'log')
          item = String(this.content).split(/\r?\n/);

        this.item = item;
        cb(item || content);
      }, err => {
        cb();
      });
    });
  }

  list(cb){
    this.act = 'list';
    this.setup(() => {
      var path = JP(Dat_map[this.key], this.path);
      FS.readdir(path, function (err, list){
        if(err) console.log(err);
        if(err) return cb([]);
        cb(list);
      });
    });
  }
}

Links.create = url => {
  return new Link(url);
};

API['save'] = API['load'] = (m, q, cb) => {
  var link = new Link(m.link);

  if(m.cmd == 'save'){
    if(m.item)
      link.save(m.item).then(item => cb({done: true}));

    if(m.item)
      link.setup(engine => {
        link.log(m.line).then(() => cb({done: true}));
      });

    if(m.set)
      link.update(m.set).then(item => cb({item}));
  }

  if(m.cmd == 'load')
    link.load(item => cb({item}));
};

API['list'] = (m, q, cb) => {
  var link = new Link(m.link);

  link.list(list => cb({list}));
}



API['download'] = function(m, q, re){
	if(typeof m.url !== 'string') return re({error: 'no url'});

  console.log('Dowload: ',m.url);

  var link = new Link(m.link);
  link.setup(dat => {
    var path = JP(Dat_map[link.key], link.path),
		    stream = FS.createWriteStream(path, {flags: 'w'});

  	var mod = require(m.url.indexOf('https:')==0?'https':'http');
  	var request = mod.get(m.url, function(response){
  		response.pipe(stream);
  		stream.on('finish', function(){
  			stream.close(ev => {
          re({done: true});
        });
  		});
  	});
  });
};

API.createStream = (m, ws, re) => {
  var link = new Link(m.link);

  link.setup(dat => {
    var path = JP(Dat_map[link.key], link.path);
    		stream = FS.createWriteStream(path, {flags: 'w'});

  	ws.stream = stream;

  	re({});
  });
}


API.saveStream = function(m, ws, re){
	if(!ws.stream) return ws.json({error: 'no stream'});

	ws.stream.end();
	if(m.cb) re({});

  return;
	var tmpName = ws.stream.path.split('/').pop();

	var user = ws.session.user;

	if(m.id){
		var file = Data.loadSync(m.id);
		if(file.owner && (!Me || Me.id != file.owner))
			return ws.json({error: 'access denied'});

		var set = {
			updated: (new Date()).getTime(),
			size: ws.stream.bytesWritten
		};

		_.extend(file, set);

		FS.renameSync(ws.stream.path, file.path || Path.join(Data.dir, file.id));
    Data.save(file).then(item => {
			if(m.cb) re({file: item, name: tmpName});
		});
	}

	var file = {
		id: Data.generate_id(),
		size: ws.stream.bytesWritten,
		time: (new Date()).getTime(),
    owner: '123' || Me.id
	};

	if(typeof m.name == 'string')
		file.name = m.name;

	if(typeof m.mime == 'string')
		file.mime = m.mime;

  Data.save(file).then(item => {
		FS.renameSync(ws.stream.path, file.path || Path.join(Data.dir, file.id));
		delete ws.stream;

		if(m.cb) re({file: item, name: tmpName});
	});
}
