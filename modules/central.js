window.Central = {
  connect: q => {
		var ws = Central.ws = new WS({
			server: /*window.isElectron?'localhost:81':*/Cfg.central.server,
			sid: Cookies.get(Cfg.sidCookie),
			name: 'main'
		});

		var S = ws.on;
		Central.W = (msg, cb) => {ws.send(msg, cb)};

		S.session = function(m){
			Cookies.set(Cfg.sidCookie, m.sid);
			//if(m.user) acc.ok(m.user);
			Central.session = m;
		}

		S.error = function(m){
			if(m.ofCmd && S.error[m.ofCmd])
				S.error[m.ofCmd](m);
		}
	},

  fetchView: function(path){
    return new Promise((resolve, reject) => {
      Central.W({
        cmd: 'load',
        filter: {path, type: 'view', owner: 'dukecr'},
        sort: {updated: -1},
        collection: 'pix8'
      }, function(r){
        if(Pix8.items[path] === true)
          delete Pix8.items[path];

        if(!r.items || !r.items.length){
          return resolve();
        }

        var view = r.items[0];
        view.tag = path;
        var ids = [];

        console.log(path);
    		if(view.path.indexOf('http://')==0 || view.path.indexOf('https://')==0){
            	var link = new Link(Pix8.sites_link+'/'+md5(path)+'.yaml');
            	view.url = path;
    		}
    		else{
            	var link = new Link(Pix8.words_link+'/'+path+'.yaml');
    			view.word = path;
    		}

        if(view.items)
          Central.W({
            cmd: 'load',
            filter: {
              id: {$in: view.items},
            },
            collection: 'pix8'
          }, function(r){
            var ids = [];
            var item_links = [];

            if(r.items)
              r.items.forEach(item => {
              	item_links.push(App.items_link + item.id + '.yaml');

              	if(item.file)
              		item.file = App.items_link + item.file;

                  item.owner = Me.link;
          		  (new Link(App.items_link+item.id+'.yaml')).save(item)
              });

            view.items = item_links;
            view.owner = Me.link;
			      link.save(view);
            console.log(view);

            resolve();
          });
        else
          resolve();
      });
    });
  },

  items: [],
  collect: function(){
    if(!Central.items || !Central.items.length) return;

    var view = Central.items.pop();
    if(view.path && !Pix8.items[view.path]){
      Pix8.items[view.path] = true;
      Central.fetchView(view.path).then(Central.collect);
    }
    else{
      console.log('Already: ', view.path);
      Central.collect();
    }
  },

  list: function(filter){
    filter = $.extend({
    //  path: {$regex: "^(?!http).+"},
      type: "view",
      owner: 'dukecr'
    }, filter);

    Central.W({
      cmd: 'load', filter,
      sort: {
        updated: -1, time: -1
      },
      mod: {
        id: -1,
        path: -1
      },
      collection: 'pix8'
    }, r => {
      Central.items = r.items;

      Central.collect();
    });
  }
}
