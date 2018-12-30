window.Wy = {
	split: function(){
	    var sel, range;
	    if (window.getSelection){
	        // IE9 and non-IE
	        sel = window.getSelection();
	        if (sel.getRangeAt && sel.rangeCount) {
	            range = sel.getRangeAt(0);
	            C.log(range);

				var node = range.startContainer.parentNode,
					text = range.startContainer.textContent,
					start = range.startOffset;

				var time = $(node).data('time');

				var $t1 = $('<i>'+text.substr(0, start)+'</i>').data('time', time),
					$t2 = $('<i>'+text.substr(start)+'</i>').data('time', time + 0.1);

				if(node.tagName == 'I'){
					$t2.insertAfter(node).blink('yellow');
					$t1.insertAfter(node).blink('orange');
					$(node).remove();
				}
				else{
					$(node).empty().append($t1).append($t2);
				}

				return $t2;
	        }
	    } else if (document.selection && document.selection.type != "Control") {
	        // IE < 9
	    	//document.selection.createRange().pasteHTML(html);
	    }
	},

	tagSelection: function(){
	    if(window.getSelection){
			var sel = window.getSelection();
			if(sel.getRangeAt && sel.rangeCount){
				var range = sel.getRangeAt(0).cloneRange();

				var node = range.startContainer.parentNode,
					text = range.startContainer.textContent,
					start = range.startOffset;

				var node = document.createElement('span');
				$(node).addClass('mark');
				range.surroundContents(node);

	            //sel.removeAllRanges();
	            //sel.addRange(range);

				return node;
			}
		}
	},

	paste: function(html){
		var sel, range;
	    if (window.getSelection){
	        sel = window.getSelection();
	        if(sel.getRangeAt && sel.rangeCount){
	            range = sel.getRangeAt(0);

				var node = range.startContainer.parentNode;

				return $(html).insertAfter(node);
			}
	    }
	},

	getSelection: function(){
		var sel, range;
	    if(window.getSelection){
	        sel = window.getSelection();
	        if(sel.getRangeAt && sel.rangeCount){
	            range = sel.getRangeAt(0);

	            C.log(range);

				var startNode = range.startContainer.parentNode,
					endNode = range.endContainer.parentNode,
					start = range.startOffset;

				if(startNode == endNode) return false;
				return $(startNode).nextUntil(endNode).add(startNode).add(endNode);
			}
		}
	},

	space: function(){
	    var sel, range;
	    if (window.getSelection){
	        // IE9 and non-IE
	        sel = window.getSelection();
	        if(sel.getRangeAt && sel.rangeCount){
	            range = sel.getRangeAt(0);
	            C.log(range);

				var node = range.startContainer.parentNode,
					text = range.startContainer.textContent,
					start = range.startOffset;

				var time = $(node).data('time');

				var $t2 = Wy.split();
				$t2.before('<i class="skip">&nbsp;</i>');

				return $t2;
	        }
	    }
	},

	placeCaret: function(node, l){
		if(window.getSelection){
			var range = document.createRange();

			if(!l) l = 0;
			if(l == 0 && !node.innerHTML){
				node.innerHTML = '&#8203;';
				l++;
			}

			range.setStart(node, l);
			range.collapse(true);

			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		}
	},

	increase: function(string, by){
		return string.replace(
			/[-]?((0|[1-9][0-9]*)(\.[0-9]+)?|\.[0-9]+)([eE][+-]?[0-9]+)?/g,
			function(str, p1, p2, p3, p4, offset, s){
				if(by < 1) return (Math.round((parseFloat(str) + by) * 100) / 100).toFixed(2);
				return parseFloat(str) + by;
			}
		);
	}
}