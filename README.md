# ggif

GGIF: audio sync GIF onclick
1) play audio: javascriptkit.com/script/script2/soundlink.shtml
2) restart GIF: jsfiddle.net/GS427/94/
GAME: tap tap sync gGIF, score

TODO:

A) FIX EDGE CASES
1) find devices/browsers where sync fails eg desktop:safari;ie;edge
2) alert before device/browser may fail sync
3) debug (1) reduce (2)

B) ? GGIF DRAG/DROP? // share like GIF but like talkies
1) embed mp3/code in GIF format?
2) chrome naptha ocr plugin > ID GIF > fetch xc.cx/id/?
3) gifv? gfycat? but drag/drop

C) FIX GAME
3) match pattern: no more compound error
2) race to perfect sync //try to beat me you can't
1) FIND PLAYERS

0) BET WE SYNC GIF
a) partner with players
b) pool bets / select task
c) pay bounty hunters

1) SOCIAL CODING
a) workflow
b) push push
c) ggif pix8 tvxt twxt

2) SUMMEROFCODE.CODEACADEMY.COM
a) 3 courses html;make;interactive 
b) codepen.io
c) codeacademy.reddit.com

3) ADULTLITERACY.XPRIZE.ORG
a) bet we sync GIF
b) try new tools
c) make people read

## gif.js
library that reads contents from ggif - actual frames, youtube_id, syllables, timings, audio..
and makes it playable on canvas element
synchronises gif frame set with audio, so also it gives methods to control speed, move forward or back, find current time..

## ggif.js
this library not only can read those gif's, but also receive an input with certain frameset of images, sent them to server and glue new gif, include audio and another metadeta

## omgif.js
for parsing binary data from gif content, and making new gif binary from given data
