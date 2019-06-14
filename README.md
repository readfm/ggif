# ggif
[GIF is extensible.](http://tiny.cc/gifspec)  
How will you extend it?  
[x] sound  
[x] youtube  
[x] [wiki](http://th.ai/wiki)  
[ ] git  

## gif.js
read gif contents: frames; youtube_id; syllables; timings; audio
playback via canvas element
sync gif frames w audio; control speed; go back/forth; find current time < ?

## ggif.js
make ggif from video loop (include audio and metadata)

## omgif.js
for parsing binary data from gif content, and making new gif binary from given data

_ _ _ _ _ _ _ _ _ _ _ _ _ _ 

## etc<br>
![they say GIF can't sync audio](https://i.imgur.com/2teFwEP.png)<br>
people say no sound w/ gif, they wrong now

![it was all a dream](https://i.imgur.com/LJn2ydF.gif)]<br>
solution arrived in a dream :)

# ggif
ggif talking gif, sync audio w/ gif, share
1) put audio and plaintext in GIF container
2) onclick play audio from 0:00, restart GIF from frame1
3) sync talking GIF

# compiling process
With our editor you can pick specific part of youtube video
After you got it selected on precise time click ctrl+G or just G button
Service will download whole video and crop selected part.
With ffmpeg this video will be cropped and converted to gif and mp3
once we got the right file, omggif.js will extract all the gif info
browser will send audio file to IBM watson to know what its been said
predicted result of syllables will be alligned with video/gif player
frames will be loaded as canvas with delay and shift info
now from UI it will grab precisley defined timings and syllables
im the next process it will put those txts on each canvas frame
after browser will gather updated ImageData with all pixel bytes
each frame can be sent to the server to let ffmpeg compress back into gif
but after recent update we can do in js ggif module, later with wasm
later on ggif we attach meta data like size, syllables, timings, yid
on the last step we just append audio file at the end of the gif
once all done, browser can open save dialog, put along other or share

*(since wasm 1.0 is now fully implemented in all major browsers, 
ffmpeg module can be also launched right in there using inmemory FS)

# pwa
with newest htm5 tech and V8 engine we can treat web app same way as it would be on mobile
with service workers we can cache modules and so serve this app in offline mode with its own frame and icon on home screen
if auto installer didnt pop out from the bottom once io.cx got loaded,
then click chrome menu > add to home screen
the better stack we are using the more flowy gif compiling goes
to speed it up ggif I/O process, with less memory required wasm will be used

## vocaltext
sync vocalization w plaintext
CAPitalize sylLABles while vocalIZED



