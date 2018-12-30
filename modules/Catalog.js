var module = window.Catalog = function(cfg){
	var t = this;
	//var id = img.src.split('/').pop();

  $.extend(t, {
  }, cfg);

  this.init();
};

$.extend(module.prototype, {
  init: function(){
    this.$cont = $('<div>');
    this.$filters = $('<div>').appendTo(this.$cont);
    this.$items = $('<div>').appendTo(this.$cont);
  },

	addFilter: function(fltr){
    var t = this;
    if(fltr instanceof jQuery){

    }
    else
    if(typeof fltr == 'string'){

    }
    else
    if(typeof fltr == 'object'){
      var $filter = $('<span>', {class: 'catalog-filter'});
      $filter.text(fltr.text);
      $filter.appendTo(this.$filters);
      $filter.click(function(){
        if(fltr.onClick == 'deactivate siblings'){
          $filter.siblings('.active').removeClass('active');
          $filter.addClass('active');
					t.$active = $filter;
          t.reload();
        }
      });

      if(fltr.active)
        $filter.addClass('active');

      $filter.data(fltr);

      return $filter;
    }
  },

  query: function(q){
    var t = this;
    return new Promise(function(resolve, reject){
      this.ws.send($.extend({
        cmd: 'load',
        collection: t.collection,
      }, q), resolve);
    });
  },


  filter: {},
  collectFilters: function(filter){
    filter = $.extend(this.filter, filter);

    return filter;
  },

  sort: {},
  collectSort: function(sort){
    sort = $.extend({}, this.sort, sort);

    this.$filters.children('.active').each(function(){
      var data = $(this).data();

      if(data.sort){
        $.extend(sort, data.sort);
        console.log(data.sort);
      }
    });

    return sort;
  },

  reload: function(){
    var t = this;
    t.find().then(function(items){
      t.$items.empty();
      t.arrange(items);
    });
  },

  limit: 200,

	find: function(){
    var t = this;


		return new Promise(function(resolve, reject){
			if(t.$active && t.$active.data('filter') == false)
				return t.$items.empty();

			t.query({
				filter: t.collectFilters(),
				sort: t.collectSort(),
				limit: t.limit,
			}).then(function(r){
				resolve(r.items);
			});
		});
	},


	// place elements
  arrange: function(items){
    var t = this;
    (items || []).forEach(function(item){
      if(t.skipIf && t.skipIf(item)) return;

      var $item = t.build(item);

      $item.appendTo(t.$items);
    });
  }
});
