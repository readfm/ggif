window.Cfg = {
  port: 80,
  host: '127.0.0.1',
  files: 'http://127.0.0.1:5030/items/',

  default_site: 'https://css-tricks.com/',

  central: {
    server: 'io.cx'
  },

  sidCookie: "pix8sid",

	name: 'pix8',

	Data: {
		host: 'http://127.0.0.1',
		port: 8083
	},

	drag: {
		takeOffLimit: 12,
		dy: 15,
		dx: 10
	},

  socket: {
    host: '127.0.0.1',
    port: 3000,
    re_interval: 3000
  },


	collector: {
		minWidth: 60,
		minHeight: 60,
		limit: 20
	},

	limits: {
		minPix8Height: 40,
		minFrameHeight: 100,
		minControlHeight: 80
	},


  carousel: {
    name: 'images',
    allowPatterns: false,
    down2remove: 0.5,
    takeOffLimit: 5,
    slideLimit: 10,
    infinite: true,
    preloadLocal: false,
    preloadGoogle: false,
    fetchLimit: 8
  },

  pix8: {
    default_tag: 'pix8test2'
  }
};
