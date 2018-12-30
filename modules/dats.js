const Dat = require('dat-node');
const JP = require('path').join;
const FS = require('fs');

global.Dat_map = {};

global.Dats = {
  dir: JP(require('os').homedir(), '.dats'),
  search: dir => {

  },

  init(){
    this.setupFolder(Cfg.dats_folder || this.dir);
  },

  setupFolder(dir){
    this.dir = dir;
    this.loadDir(dir);
  },

  loadDir(dir){
    dir = dir || Dats.dir;
    if(FS.existsSync(dir)){
      var dirs = [];
      FS.readdirSync(dir).filter(
        f => FS.statSync(JP(dir, f)).isDirectory()
      ).forEach(folder => {
        dirs.push(JP(dir, folder));
      });
      this.load(dirs);
    }
    else
      FS.mkdirSync(dir);
  },

  get: function(hash){
    return new Promise((resolve, reject) => {
      if(this[hash]) return resolve(this[hash]);

      Dat(JP(this.dir, hash), {key: hash, sparse: true}, (err, dat) => {
        if(err) return reject();

        dat.joinNetwork();

        var key = dat.key.toString('hex');
        Dats[key] = dat;
        resolve(dat);
      });
    });
  },

  load(folders){
    if(typeof folders == 'string') folders = [folders];
    folders.forEach(folder => {
      this.open(folder);
    });
  },

  key(folder){
    var key_file = JP(folder, '.dat', 'metadata.key');
    var key = FS.readFileSync(key_file).toString('hex');
    Dat_map[key] = folder;
    return key;
  },

  open(folder){
    return new Promise((resolve, reject) => {
      Dat(folder, (err, dat) => {
        if(err) return reject(err);

        var key = dat.key.toString('hex');
        Dats[key] = dat;

        if(dat.writable)
          dat.importFiles({watch: true});

        dat.joinNetwork();

        resolve(dat);
      });
    });
  }
};

process.on('modules_ready', ev => {
  Http.GET['dat'] = function(q){
    var prot = q.p.shift(),
        hash = q.p.shift();

    if(Dat_map[hash]){
      var cfg = {
        path: JP(Dat_map[hash], q.p.join('/'))
      };

      query.pump(q, cfg);
    } else
      Dats.get(hash).then(dat => {
        var cfg = {
          path: JP(dat.path, q.p.join('/'))
        };

        query.pump(q, cfg);
      });
  };
});


/*
$(document).on('pref', ev => {

});

$(document).on('connected', ev => {
  W({cmd: 'load', path: 'dats.log'}, r => {
    if(r.item && r.item.length)
      Dats.load(r.item);
  });
});
*/
