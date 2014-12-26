"use strict";

var csp = require("js-csp");

var f = a => console.dir(a);

f("abe");

function *foo(x) {
    var y = yield 123;
    yield (2 + y);
    yield 3 + x;
}

var it = foo(33);

f(it.next().value);
f(it.next(3));
f(it.next());
f(it.next());

var listen = function(id, eventName) {
  var element = document.getElementById(id);
  var chan = csp.chan();

  element.addEventListener(eventName, function(event){
    csp.putAsync(chan, event);
  });

  return chan;
};


window.onload = () => {

  var buttonChan = listen("button", "click");

  csp.go(function*(){
    for(;;){
      var event = yield csp.take(buttonChan);
      f(event);
    }
  });

  return;

  var el = document.getElementById("display");
  function show(text) {
    el.textContent = text;
    console.log(text);
  }
  function noOp() {};
  function firehose(element, eventName) {
    var ch = csp.chan(csp.buffers.dropping(1));
    element.addEventListener(eventName, function(event) {
      csp.putAsync(ch, event, noOp);
    });
    return ch;
  }
  var moves = firehose(document.body, "mousemove");
  csp.go(function*() {
    for (;;) {
      var event = yield csp.take(moves);
      show(event.x + ":" + event.y);
      for (;;) {
        var result = yield csp.alts([moves, csp.timeout(50)]);
        var value = result.value;
        if (value === csp.CLOSED) {
          show("STOP");
          break;
        }
        event = value;
        show(event.x + ":" + event.y);
      }
    }
  });
};
