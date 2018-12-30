var FS = require('fs');

const JP = require('path').join;
const log = t => console.log(t);



const ytdl = require('ytdl-core');

var youtube_id = process.argv[process.argv[0] == 'ggif'?1:2];
var video_path = JP(process.cwd(), youtube_id + '.mp4');

if(FS.existsSync(video_path)){
  log('Video #'+youtube_id+' already exists')
}
else{
  var url = 'http://www.youtube.com/watch?v='+youtube_id;
  log(url);

  ytdl(url, { filter: (format) => format.container === 'mp4' })
  .pipe(FS.createWriteStream(video_path));
}
