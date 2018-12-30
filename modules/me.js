window.User = window.Me = {
  //dir: Path.join(require('os').homedir(), 'Desktop', 'me') || Cfg.Me.dir,

  init: function(cfg){
    //this.init_ipfs();
    if(!FS.existsSync(this.dir))
      FS.mkdirSync(this.dir);

    this.serve(Cfg.Data.port);
  },


  lists: {},

  append2list: function(path, line){

  },
};

if(window.Remote){
  $.extend(Me, Remote.getGlobal('Me'));
}
