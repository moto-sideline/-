'use strict';

(function(window, document) {
  function createTimer(elem) {
    var pretext, deadline, now, left, date, hour, min, sec, msec;
    pretext = elem.getAttribute('data-pretext');
    deadline = moment(elem.getAttribute('data-deadline'));

    if (isNaN(deadline)) {
      alert("data-deadlineに誤りがあります\n" + elem.outerHTML);
      return false;
    }

    setInterval(function(){
      now = moment(new Date());
      if (now.diff(deadline) < 0) {
        date = ('0' + deadline.diff(now, 'days')).slice(-2);
        hour = ('0' + deadline.diff(now, 'hours')).slice(-2);
        min = ('0' + deadline.diff(now, 'minutes')).slice(-2);
        sec =('0' + deadline.diff(now, 'seconds')).slice(-2);
        msec =('0' + deadline.diff(now, 'milliseconds')).slice(-2);
        elem.innerHTML = [
          pretext,
          '<span class="timer__date">' + date + '</span>日',
          '<span class="timer__hour">' + hour + '</span>時間',
          '<span class="timer__min">' + min + '</span>分',
          '<span class="timer__sec">' + sec + '</span>秒',
          '<span class="timer__millisec">' + msec + '</span>'
        ].join('');
      } else {
        elem.innerHTML = [
          pretext,
          '<span class="timer__date">00</span>日',
          '<span class="timer__hour">00</span>時間',
          '<span class="timer__min">00</span>分',
          '<span class="timer__sec">00</span>秒',
          '<span class="timer__millisec">00</span>'
        ].join('');
      }
    }, 75);
  };

  var timerElems;

  timerElems = document.getElementsByClassName('timer');
  for(var i=0, l=timerElems.length; i < l; i++) {
    createTimer(timerElems[i])
  }
})(window, document);

(function(window, document){
  var lazyElems = (function() {
        var elems = document.getElementsByClassName('lazy');
        return Array.apply(null, elems);
      })(),
      offset = 30;
  function handler() {
    var top = document.body.scrollTop + window.innerHeight - offset
    for (var i = 0, len = lazyElems.length; i < len; i++) {
      if (lazyElems[0].offsetTop < top) {
        lazyElems[0].className += ' lazy-on';
        lazyElems.shift();
        if (lazyElems.length == 0) {
          window.removeEventListener('scroll', handler)
          break;
        }
      }
    }
  }
  window.addEventListener('scroll', handler);
})(window, document);

// 幅100％
(function(window, document) {
  var elems = document.getElementsByClassName('bg-w');
  for(var i = 0, len = elems.length; i < len; i++) {
    var div = document.createElement('div'),
        fontsize = elems[i].className.match(/fs-h./);
    if (fontsize != null) div.className = fontsize[0];
    div.style.cssText = [
      'height:' + elems[i].clientHeight + 'px;',
      'margin-bottom: .7em;'
    ].join('');
    elems[i].parentNode.insertBefore(div, elems[i].nextElementSibling);
  }
})(window, document);
