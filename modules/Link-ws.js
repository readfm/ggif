window.Items = {
  load(list){
    return new Promise((ok, no) => {
      var left = list.length;
      var items = [];
      (list || []).forEach(function(url){
        if(Items[url]){
          left--;
          items.push(Items[url]);

          if(!left) ok(items);
          return;
        };

        var link = new Link(url);
        var item = Items[url] = link.load(item => {
          left--;

          items.push(item);

          if(!left) ok(items);
        });
      });
    });
  }
};

window.Links = {

}

window.Link = class Link{
  constructor(url){
    this.url = this.link = url;

    if(url.indexOf('://')){
      var [protocol, way] = url.split('://');
      this.protocol = protocol;

      if(way){
        var sep = way.indexOf('/');
        this.domain = this.hash = way.substr(0, sep);
        this.path = way.substr(sep+1);

        this.ext = this.path.split('.').pop();
      }
    }

    this.http = 'http://'+Cfg.host+':'+Cfg.port+'/'+protocol+'/'+way;
  }

  update(set){
    return new Promise((ok, no) => {
      W({cmd: 'save', link: this.link, set}, r => {
        Items[this.link] = r.item;
        r.item?ok(r.item):no();
      });
    });
  }

  download(url){
    return new Promise((ok, no) => {
      W({cmd: 'download', link: this.link, url}, r => {
        r.done?ok():no();
      });
    });
  }

  save(item){
    return new Promise((ok, no) => {
      if(item instanceof ArrayBuffer){
        ws.upload(item, file => {
          ok();

        }, {link: this.url});
      }
      else
        W({cmd: 'save', link: this.link, item}, r => {
          Items[this.link] = item;
          ok();
        });
    });
  }

  log(line){
    W({cmd: 'save', link: this.link, line}, r => {
      ok();
    });
  }

  load(cb){
    W({cmd: 'load', link: this.link}, r => {
      Items[this.link] = r.item;
      cb(r.item);
    });
  }

  load2Promise(cb){
    return new Promise((ok, no) => {
      this.load(item => {
        item?ok(item):no();
      });
    });
  }

  list(cb){
    W({cmd: 'list', link: this.link}, r => {
      cb(r.list);
    });
  }
}
