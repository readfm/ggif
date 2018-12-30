var site_pix8 = new Site({
	path: __dirname,
	domains: ['g.io.cx', 'ggif', 'ggif.lh', 'ggif.co']
});

console.log('Dir: ', __dirname);

site_pix8.load('index.html');
