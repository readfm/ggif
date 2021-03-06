// Text and Timings
  var segments = getSegments(hText);
  var timingSlots = timings.split(' ');
  var currentTappedSeg,
      currentPlayedSeg,
      tappedSegs,
      missedSegs,
      scores,
      timeout,
      startTime = null;

  resetVars();
  
  function showModalbox() {
    $('#socialModalbox').show();
  }

  function closeSocialBox() {
    $('#socialModalbox').hide();
  }
  
  $(document).bind('click', function(e) {
          if(e.target.id != 'logo' && !$(e.target).hasClass("modal")) { // modal class is to identify modalbox content
            closeSocialBox();
          }
      });

  $(document).ready(function(){
      // attach events
      $(document).bind('keydown', function(e) {
          if(e.keyCode == 32) clicksound.playclip();  // play audio on space key press
          else if(e.keyCode == 27) clicksound.mute();  // stop audio on escape key press
          else if(e.keyCode == 81 || e.keyCode == 87 || e.keyCode == 69 || e.keyCode == 82 ||       // q w e r
                  e.keyCode == 84 || e.keyCode == 89 || e.keyCode == 85 || e.keyCode == 73 ||       // t y u i
                  e.keyCode == 79 || e.keyCode == 80 || e.keyCode == 65 || e.keyCode == 83 ||       // o p a s
                  e.keyCode == 68 || e.keyCode == 70 || e.keyCode == 74 || e.keyCode == 75 ||       // d f j k
                  e.keyCode == 76 || e.keyCode == 186 || e.keyCode == 222 ||                        // l ; '
				  e.keyCode == 71 || e.keyCode == 72 || e.keyCode == 90 || e.keyCode == 88 ||	    // g h z x
				  e.keyCode == 67 || e.keyCode == 86 || e.keyCode == 66 || e.keyCode == 78 ||       // c v b n
				  e.keyCode == 77 || e.keyCode == 188 || e.keyCode == 190 || e.keyCode == 191 ||    // m , . /
				  e.keyCode == 219 || e.keyCode == 221 || e.keyCode == 48 || e.keyCode == 49 ||
				  e.keyCode == 50 || e.keyCode == 51 || e.keyCode == 52 || e.keyCode == 53 ||
				  e.keyCode == 54 || e.keyCode == 55 || e.keyCode == 56 || e.keyCode == 57 ) tap();                                  
      });

      $(document).bind('click', function(e) {
          if(
            e.target.id != 'gif' && 
            e.target.id != 'logo' && 
            e.target.id != 'git' && 
            e.target.id != 'coin' && 
            e.target.id != 'gitHint' && 
            e.target.id != 'close' && 
            e.target.id != 'ccard'
          ) clicksound.mute();
      });

      $('#data')[0].textContent = text;
  });

  function getSegments(txt) {
    var words = txt.split(" ");
    var segs = [], wordSegs = [], i;
    for(i=0; i<words.length; i++) {
      wordSegs = words[i].split('-');
      $.each(wordSegs, function() {
        segs.push(this);
      });
    }
    return segs;
  }

  function tap() {
    // Unhighlight previous seg
    SpanUtils.removeSpanNode(currentTappedSeg + '');
    // move to next seg
    currentTappedSeg++;

    if(currentTappedSeg == 0) play(); // hidden play segs to check for missed segs
    else if(currentTappedSeg == segments.length-1) showFeedback();  // show feedback on last seg tap
    else if(currentTappedSeg >= segments.length) currentTappedSeg = 0;
    tappedSegs[currentTappedSeg] = true;

    // get seg score
    var tapTime = ((new Date()).getTime() - startTime)/1000;
    var score = calculateSegScore(tapTime, timingSlots[currentTappedSeg]);

    // highlight current seg
    var segIxInHText = currentTappedSeg==0?0:segments.slice(0, currentTappedSeg).join(' ').length+1; //segIxInHText in hText = length of substring before seg(+1 for space or dash before current seg)
    var preDashes = hText.substring(0, segIxInHText).match(/\-/g);
    var segIxInText = preDashes?segIxInHText - preDashes.length:segIxInHText;
    SpanUtils.putWordInSpan($('#data')[0], segIxInText, segments[currentTappedSeg], currentTappedSeg+"");
    $('#'+currentTappedSeg).addClass(score);

    missedSegs = 0;
  }

  /**
   * Signals that next segment should be selected
   * TODO: probably, there is a better name for this function
   */
  function play() {
      currentPlayedSeg++;
      if(currentPlayedSeg >= segments.length) currentPlayedSeg = 0;
      if(currentPlayedSeg == 0) startTime = (new Date()).getTime(); // start of loop
      if(!tappedSegs[currentPlayedSeg-1]) {
        missedSegs++;
      }
      else tappedSegs[currentPlayedSeg-1] = false; // done checking

      if(missedSegs == 9) { // end game
        // unhighlight previous seg
        SpanUtils.removeSpanNode(currentTappedSeg + '');
        clearTimeout(timeout);
        resetVars();
      } else {
        var segTimeout = timingSlots[currentPlayedSeg + 1] - timingSlots[currentPlayedSeg];
        timeout = setTimeout(play, segTimeout * 1000);
      }
  }

  function calculateSegScore(currentTiming, perfectTiming) {
    var scoreStr = '';
    var score = Math.abs(perfectTiming - currentTiming);
    console.log('SCORE: ' + score);
    if(score >= 0 && score < 0.12) { // master
      scoreStr = 'ace';
      scores.push(100);
    } else if(score >= 0.05 && score < 0.18) { // good
      scoreStr = 'good';
      scores.push(50);
    } else if(score >= 0.1 && score < 0.24) {
      scoreStr = 'ok';
      scores.push(25);
    } else {
      scoreStr = 'oops';
      //scores.push(0); // don't include bad segs in total score
    }
    return scoreStr;
  }

  function showFeedback() {
    var sum = 0, i, avg = 0, feedback = '';
    for(i=0; i<scores.length; i++) {
      sum += scores[i];
    }
    avg = sum/scores.length;
    console.log('FEEDBACK: ' + avg);
    if(avg == 100) {
      feedback = 'ace';
    } else if(avg < 100 && avg >= 50) {
      feedback = 'good';
    } else if(avg < 50 && avg >= 25) {
      feedback = 'ok';
    } else {
      feedback = 'oops'
    }
    $('#feedback').html(feedback);
    $('#feedback')[0].className = 'show';
    scores = [];  // reset scores
    var fTimeout = setTimeout(function(){$('#feedback')[0].className = 'hide';}, 2000);
  }

  // Mouseover/ Click sound effect- by JavaScript Kit (www.javascriptkit.com)
  // Visit JavaScript Kit at http://www.javascriptkit.com/ for full source code
  //** Usage: Instantiate script by calling: var uniquevar=createsoundbite('soundfile1', 'fallbackfile2', 'fallebacksound3', etc)
  //** Call: uniquevar.playclip() to play sound
  var html5_audiotypes={ //define list of audio file extensions and their associated audio types. Add to it if your specified audio file isn't on this list:
      mp3: 'audio/mpeg',
      mp4: 'audio/mp4',
      ogg: 'audio/ogg',
      wav: 'audio/wav'
  }

  function createsoundbite(sound){
    var html5audio=document.createElement('audio')
    if (html5audio.canPlayType){ //check support for HTML5 audio
      for (var i=0; i<arguments.length; i++){
        var sourceel=document.createElement('source')
        sourceel.setAttribute('src', arguments[i])
        if (arguments[i].match(/\.(\w+)$/i))
            sourceel.setAttribute('type', html5_audiotypes[RegExp.$1])
        html5audio.appendChild(sourceel)
      };
      html5audio.load();
      html5audio.playclip = function() {
        $('#gif').attr('src', $('#gif').attr('src'));
        html5audio.pause();
        html5audio.currentTime = 0;
        html5audio.muted = false;
        html5audio.play();
      };
      html5audio.mute = function () {
        html5audio.muted = true;
      };
      html5audio.addEventListener('ended', function() {
        console.log(this.currentSrc);
        console.log(this.currentTime);
        this.load();
        this.play();
      }, false);
      html5audio.stop = function() {
        html5audio.pause();
      };
      return html5audio;
    } else {
      return {
        playclip: function(){
          alert("Your browser doesn't support HTML5 audio unfortunately");
        }
      };
    }
  }

  //Initialize two sound clips with 1 fallback file each:


  /**
  * All span related operations.
  */
  SpanUtils = {
      /**
       * Put word in span tag and append it to the dom.
       * Loop on node childNodes to find the childNode contains the word(this is needed in the case of having another span tags).
       * Create span node of the word, put value before word in Text node and insert before span, put value after word in Text node and insert after span
       * @param {Object} node is the node contains the word.
       * @param {Number} wordIx is the index of the word.
       * @param {String} word the word to be put in span tag
       * @param {String} id the id of the span tag
       */
      putWordInSpan: function(node, wordIx, word, id) {
          var i, index = 0, childNode;
          for(i=0; i<node.childNodes.length; i++) {
              childNode = node.childNodes[i];
              len = childNode.textContent.length;
              index += len;  // find the node where seg exists
              if(wordIx < index) {  // word in this childNode
                  wordIx = wordIx - (index - len);  // word index within the childNode not the whole node text
                  if(childNode.nodeName == 'SPAN') {  // if word already in span, highlighted with different id
                      // if word start position is already included in a span (the word or first seg of the word is highlighted), return span id
                      if(childNode.textContent == word || wordIx == 0) return childNode.id;
                  }

                  //if part of the word only included in the childNode,use this part as the whole word; this occur when there is a highlighted seg of the word
                  word = wordIx+word.length > childNode.textContent.length?childNode.textContent.slice(wordIx):word;
                  // Get the text string parts before/after the word.
                  var valBefore = childNode.textContent.substring(0, wordIx);
                  var valAfter = childNode.textContent.slice(wordIx+word.length);
                  var previousSibling = childNode.previousSibling;  // node before this childNode
                  var nextSibling = childNode.nextSibling;  // node after this childNode

                  // Append the span node to the DOM
                  var spanNode = $('<span id="' + id + '">' + word + '</span>');  // Create a span node contains the word
                  spanNode.insertAfter(childNode); // Append the span node to the dom; inserted after the text before the word
                  if(previousSibling && previousSibling.nodeType == 3) {  // previous sibling is text node
                      previousSibling.textContent += valBefore; // append valBefore to previous text node
                      $(childNode).remove(); // remove childNode
                  } else {
                      childNode.textContent = valBefore; // Set the original node value to the text string before the word.
                  }
                  if(nextSibling && nextSibling.nodeType == 3) {
                      nextSibling.textContent = valAfter + nextSibling.textContent; // append valAfter to next text node
                  } else {
                      $(document.createTextNode(valAfter)).insertAfter(spanNode); //Create text node to contain text string after the word; insert after span
                  }
                  return id;  // done, return id of span
              }
          } // end for
      },

      /**
       * Remove span node with the given id.
       * Loop on node childNodes to find the span childNode with the given id(this is needed in the case of having another span tags).
       * Append the value of span to node before or after.
       * @param: {String} id the id of the span node
       */
      removeSpanNode: function(id) {
          var spanNode = $('#' + id); // span node to be removed
          if(spanNode.length == 0) return;
          var preSibling = spanNode[0].previousSibling; // previous sibling(value before span)
          var nextSibling = spanNode[0].nextSibling;  // next sibling(value after span)

          if(preSibling && preSibling.nodeType == 3 && nextSibling && nextSibling.nodeType == 3) {  // if previous and next siblings are Text nodes
              var data = preSibling.textContent + spanNode[0].textContent + nextSibling.textContent; // all node value
              preSibling.textContent = data;  // set data to previous node and remove the rest
              $(spanNode).remove(); // remove span node
              $(nextSibling).remove();  // remove next sibling
          } else if(preSibling && preSibling.nodeType == 3) { // if previousSibling is Text node
              preSibling.textContent += spanNode[0].textContent; // append span value to previous node
              $(spanNode).remove(); // remove span node
          } else if(nextSibling && nextSibling.nodeType == 3) { // if nextSibling is Text node
              nextSibling.textContent = spanNode[0].textContent + nextSibling.textContent; // append span value to next node
              $(spanNode).remove(); // remove span node
          } else {  // previous and next nodes are not Text
              $(document.createTextNode(spanNode[0].textContent)).insertAfter(spanNode); //Create text node to contain span value; insert after span
              $(spanNode).remove(); // remove span node
          }
      }
    };

    function resetVars() {
      currentTappedSeg = -1;
      currentPlayedSeg = -1;
      tappedSegs = [];
      missedSegs = 0;
      scores = [];
    }
    
   $(document).keydown(function(ev){
  if([65,83,68,70,74,75,76,186,81,87,69,82,84,89,85,73,79,80,222,71,72,90,88,67,86,66,78,77,188,190,191,219,221,48,49,50,51,52,53,54,56,57].indexOf(ev.keyCode)+1){
    $('.playG').show();
    $('#logo').css('height', '70%');
  }
});
    
    var noTapTimeOut = 10; // seconds
    var timer;
    var tmr = function(){
    if(timer) clearTimeout(timer);
    timer = setTimeout(function(){
      $('.playG').hide();
      $('#logo').css('height', '100%');
    }, noTapTimeOut * 1000);
    };
    tmr();
    
    $(document).keydown(function(ev){
  if([65,83,68,70,74,75,76,186,81,87,69,82,84,89,85,73,79,80,222,71,72,90,88,67,86,66,78,77,188,190,191,219,221,48,49,50,51,52,53,54,56,57].indexOf(ev.keyCode)+1)
    tmr();
});

$(function(){
  function check(){
    $('#coin')[$('#ccard').is(':visible')?'addClass':'removeClass']('x');
    $('#gitHint')[$('#git').is(':visible')?'addClass':'removeClass']('x');
  };
  
  $('#coin').click(function(){
    $('#ccard').toggle();
    check();
  });
  
  $('#gitHint').click(function(){
    $('#git').toggle();
    check();
  });
  
  $('#ccard,#git').mouseout(function(){
    $(this).hide();
    check();
    //clicksound.mute();
  });
  
  $('#ccard').click(function(){
    $(this).hide();
    document.location = 'http://ggif.co/back';
    //clicksound.playclip()
  });
  
  $('#git').click(function(){
    $(this).hide();
    document.location = 'https://github.com/readfm/ggif';
    //clicksound.playclip()
  });
});