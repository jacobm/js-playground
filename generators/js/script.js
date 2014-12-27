"use strict";

var csp = require("js-csp");

var f = a => console.dir(a);

function *dingo(){
  yield 7;
  yield 8;
  yield 9;
}

function *foo(x) {
    var y = yield 123;
    yield (2 + y);
    yield* dingo();
    yield 3 + x;
}

var logGenerator = g => {
  for(var x of g){
    console.log("Value " + x);
  }
}

logGenerator(foo(1));

var it = foo(23);
f(it.next().value);
f(it.next(3).value);
f(it.next().value);
f(it.next().value);

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


  var searchChan = listen("search-button", "click");

  csp.go(function*(){
    var searchInput = document.getElementById("search-input");

    for(;;){
      var event = yield csp.take(searchChan);
      var data = yield csp.take(businessSearch(searchInput.value));

      var requests = [];
      for(var bu of data.businessUnits){
        requests.push(businessData(bu.id));
      }

      // simple presentation
      var root = document.getElementById("search-results");
      root.innerHTML = '';
      var numFound = document.createElement('div');
      numFound.appendChild(document.createTextNode("Found for " + searchInput.value + " returned " + data.businessUnits.length));
      root.appendChild(numFound);

      for(var r of requests){
        var bu = yield r;
        var div = document.createElement('div');
        var elm = document.createTextNode("Name: " + bu.displayName + ", " + bu.trustScore);
        div.appendChild(elm);
        root.appendChild(div);
      }

      searchInput.value = '';
      searchInput.focus();
      f(data);
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


function httpRequest(url) {
  var ch = csp.chan();
  var req = new XMLHttpRequest();
  req.onload = function() {
    if(req.status === 200) {
      csp.putAsync(ch, this.responseText);
    }
    else {
      csp.putAsync(ch, new Error(this.responseText));
    }
  }
  req.open('get', url, true);
  req.send();
  return ch;
}

function jsonRequest(url) {
  return csp.go(function*() {
    var value = yield csp.take(httpRequest(url));
    if(!(value instanceof Error)) {
      value = JSON.parse(value);
    }
    return value;
  });
}


var apiKey = '&apikey=IZIKhLfUQejkeYPBBWO8GH7eQPdtdNQX';
var baseUrl = 'https://api.trustpilot.com/v1/business-units/';

var businessSearch = function(name){
  return jsonRequest(baseUrl + 'search?query=' + name + '?' + apiKey);
}

var businessData = function(id){
  return jsonRequest(baseUrl + id + '?' + apiKey);
}
