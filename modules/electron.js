$("<link>", {
  "rel" : "stylesheet",
  "type" :  "text/css",
  "href" : "electron.css"
}).appendTo('head');


$(ev => {
  document.addEventListener("keydown", e => {
    if (e.which === 123)
      require('remote').getCurrentWindow().toggleDevTools();
    else if (e.which === 116)
      location.reload();
  });

  $(document).on('click', 'a[target="_blank"]', function (event){
    event.preventDefault();
    console.log(this);
    require('electron').shell.openExternal(this.href);
  });
});

$(ev => {
  Context.init();
  User.id = Remote.getGlobal('Me').id;

  Data.load(User.id).then(item => {
    User.item = item || {id: User.id};

    Pix8.init();


    /*
    $(window).resize(function(event){
      var $lastCarousel = $('#pic > .carousel').last();
      if(!$lastCarousel.length) return;
      $lastCarousel.height($lastCarousel.height() + document.body.clientHeight - $('#pic').height());
      $lastCarousel[0].carousel.resize();
    });
    */
  });

  //$(document).trigger('connected');
});
