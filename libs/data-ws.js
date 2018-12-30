window.Data = {
  items: {},

  init: function(cfg){
    //this.init_ipfs();
    if(!FS.existsSync(this.dir))
      FS.mkdirSync(this.dir);

    this.serve(Cfg.Data.port);

    console.log('Module data was initiated');
  },

  init_ipfs: function(){

  },

  generate_id: () => randomString(8),

  save: function(item){
    return new Promise((resolve, reject) => {
      console.log(item);
      W({
        cmd: 'save',
        item: item
      }, r => {
        console.log(r.item);
        if(r.item){
          Data.items[r.item.id] = r.item;
          resolve(r.item);
        }
        else
          reject();
      });
    });
  },


  saveFile: function(buf){
    return new Promise((resolve, reject) => ws.upload(buf, resolve));
  },

  update: function(id, set){
    return new Promise((resolve, reject) => {
      W({
        cmd: 'update',
        set: set,
        id
      }, r => {
        console.log(r);
        if(r.item){
          Data.items[r.item.id] = r.item;
          resolve(r.item);
        }
        else
          resolve({error: true});
      });
    });
  },

  log: function(line, id){
    console.log(line);
    return new Promise((resolve, reject) => {
      W({
        cmd: 'log',
        line,
        id
      }, r => {
        if(r.id){
          if(Data.items[id])
            Data.items[id].push(line);
          else
            Data.items[id] = [line];

          resolve(r.id);
        }
        else
          resolve({error: true});
      });
    });
  },

  download: function(url, id){
    return new Promise((resolve, reject) => {
      W({
        cmd: 'save',
        url,
      }, r => {
        resolve(r.id);
      })
    });
  },

  load: function(id){
    return new Promise((resolve, reject) => {
      W({
        cmd: 'load',
        id: id
      }, r => {
        if(r.item){
          if(r.item.length && typeof id == 'object' && id.length)
            r.item.forEach(item => {
              if(item)
                Data.items[item.id] = item;
            });
          else
            Data.items[id] = r.item;

          resolve(r.item);
        }
        else
          resolve();
      });
    });
  },

  share: function(){

  },

  loadSync: function(id){
    var ids = [];
    if(typeof id == 'object'){
      if(id.length)
        ids = id;
      else return;
    }
    else if(typeof id == 'string'){
      ids = [id];
    }
    else return;

    var items = [];
    ids.forEach(ida => {
      if(typeof this.items[ida] == 'object'){
        var item = this.items[ida];
      }
      else
        var item = this.items[ida] = this.read(ida);

      items.push(item);
    });

    return (typeof id == 'string' || typeof id == 'number')?items[0]:items;
  },

  read: function(id){
    var path = Path.join(this.dir, id);

    if(FS.existsSync(path+'.json')){
      var content = FS.readFileSync(path+'.json');
      var item = JSON.parse(content);
    }
    else
    if(FS.existsSync(path+'.yaml')){
      var content = FS.readFileSync(path+'.yaml');
      var item = YAML.safeLoad(content);
    }
    else
    if(FS.existsSync(path+'.log')){
      var content = FS.readFileSync(path+'.log');
      var item = content.split("\n");
    }
    else return;

    return item
  },

	pump: function(res){

	},
};
