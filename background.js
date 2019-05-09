/**
 * Create a context menu which will only show up for images.
 */

window.addEventListener('click', ev => {
  console.log(ev);
}, false);

chrome.webNavigation.onCompleted.addListener(function(d){
  let info = {
    file: 'gif_reader.js', 
    runAt: 'document_end', 
    frameId: d.frameId
  };

  chrome.tabs.executeScript(d.tabId, info);
  info.file = 'ext.js';
  chrome.tabs.executeScript(d.tabId, info);
});

chrome.contextMenus.create({
  "title" : "Play ggif audio",
  "type" : "normal",
  "contexts" : ["image"],
  "onclick" : (info, tab) => {
    if(info.mediaType == 'image')
      play(info.srcUrl);
  }
});
