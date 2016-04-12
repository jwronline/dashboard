---
---

// places to put data in
var map = document.getElementById('map');
var data = document.getElementById('data');
var counter = document.getElementById('counter');
var days = document.getElementById('days');
var hours = document.getElementById('hours');
var minutes = document.getElementById('minutes');
var seconds = document.getElementById('seconds');
var video = document.getElementById('video');
var sign = document.getElementById('sign');
var holding = document.getElementById('holding');
var help = document.getElementById('help');

/**
 * get and parse a json file from url
 * @param  {string} url the url to get
 * @return {Promise}    the Promise that will return the json or status
 */
var getJSON = function(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('get', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status == 200) {
        resolve(xhr.response);
      } else {
        reject(status);
      }
    };
    xhr.send();
  });
}

if (!navigator.onLine) {
  map.innerHTML = '<img src="src/img/map.png" alt="map of the world">';
  var pollISS = function() {
    console.warn('you\'re currently offline.');
  };
} else {
  /**
   * Mapbox gl initialising
   */
  mapboxgl.accessToken = 'pk.eyJ1IjoiandyIiwiYSI6ImNpbWFwcWk1cjAwMXR3ZG04d3RxdDljZDMifQ.z794EtjWIrwwHICvYXs5Ww';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jwr/cimaq5nsu009lbkm0gpqx3e2o',
    center: [0, 10],
    zoom: 0.5
  });
  map.addControl(new mapboxgl.Navigation({
    position: "top-left"
  }));

  /**
   * Poll the iss data and put it on the map
   * needs:
   * - a mapbox gl map in '#map' and variable name 'map'
   */
  var pollISS = function() {
    var geojson = {
      "type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": []
      }
    }

    var url = 'https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps=';
    var date = new Date();
    for (var i = 200; i > 0; i -= 5) {
      if (i !== 200) {
        url += ',';
      }
      var temp = new Date();
      temp.setMinutes(date.getMinutes() - i);
      url += Math.floor(temp.getTime() / 1000);
    }
    getJSON(url)
      .then(function(data) {
        // todo: use proper updateSoure()
        // map.removeSource('route');
        // map.removeSource('final');

        var coords = [];

        var current = {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [data[data.length - 1].longitude, data[data.length - 1].latitude]
          },
          "properties": {
            "title": "Current location"
          }
        }

        for (var i in data) {
          if (i != 0) {
            if (data[i].longitude - data[i - 1].longitude > 200 || data[i].longitude - data[i - 1].longitude < -200) {
              geojson.data.features.push({
                "type": "Feature",
                "properties": {},
                "geometry": {
                  "type": "LineString",
                  "coordinates": coords
                }
              });
              coords = [];
            }
          }
          coords.push([data[i].longitude, data[i].latitude]);
        }
        geojson.data.features.push({
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "LineString",
            "coordinates": coords
          }
        }, current);

        map.addSource("route", geojson);
        map.addLayer({
          "id": "route",
          "type": "line",
          "source": "route",
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "#CCC",
            "line-width": 2
          }
        });
        map.addSource("final", {
          "type": "geojson",
          "data": current
        });
        map.addLayer({
          "id": "final",
          "type": "symbol",
          "source": "final",
          "layout": {
            // "icon-image": "rocket-15"
            // "icon-image": "triangle-15"
            "icon-image": "star-15"
          }
        });

      }),
      function(status) {
        console.warn(status);
      };
  }
}
/**
 * The main object holding:
 * - the current step
 * - the function to advance
 * - the function to decline
 * - the function to display
 * - the data from _data/steps.yml
 * @type {Object}
 */
var step = {
  data: {{site.data.steps | jsonify}},
  number: -1,
  decline: function() {
    this.number--;
    this.display();
  },
  advance: function() {
    this.number++;
    this.display();
  },
  display: function() {
    if (!this.data[this.number]) {
      alert('this step doesn\'t exist!');
    } else {
      // getting the position of the iss
      pollISS();
      // name
      counter.innerHTML = this.data[this.number].name;
      // texts
      var texts = this.data[this.number].text;
      var i = 0;
      var print = function(text) {
        var pre = document.createElement('pre');
        pre.innerHTML = '$ ' + text;
        if (this.data[this.number].style) pre.classList.add(this.data[this.number].style);
        data.appendChild(pre);
        pre.scrollIntoView({
          behaviour: 'smooth'
        });
      }.bind(this);
      var intervalId = setInterval(function() {
        if (i == texts.length) {
          clearInterval(intervalId);
          return;
        }
        print(texts[i++]);
      }, 1);
      // video
      if (typeof this.data[this.number].video !== 'undefined') {
        video.innerHTML = '<video src="src/vid/' + this.data[this.number].video + '" autoplay onclick="javascript:this.muted = !this.muted;"><p>oops! no video 😢</p></video>';
      } else {
        video.innerHTML = '<div id="video" class="video"><div class="video--intro"><p>JWR Mission Control</p></div></div>';
      }
    }
  }
};

/**
 * The remote function
 * @type {Object}
 */
var remote = {
  show: function(){
    var rem = window.open('src/html/remote.html','remote', 'menubar=no,location=no,resizable=no,scrollbars=no,status=no,width=300,height=300');
    help.classList.add('help__hidden');
    rem.focus();
  }
}

window.addEventListener("message", function(event){
  eval(event.data);
}, false);

/**
 * The timer holding
 * - the current MET
 * - add one second
 * - start running
 * - stop running
 * - toggle running
 * @type {Object}
 */
// start at -9m00 (a.k.a 9 minutes before epoch)
var _time = new Date(0 - 9 * 60 * 1000);
var timer = {
  time: _time,
  running: false,
  timeInterval: null,
  display: function() {
    if (this.time.getTime() < 0) {
      sign.innerHTML = '-';
    } else {
      sign.innerHTML = '';
    }
    var d = Math.floor(Math.abs((this.time.getTime() / 86400000)));
    var h = Math.floor(Math.abs((this.time.getTime() / 3600000) % 24));
    var m = Math.floor(Math.abs((this.time.getTime() / 60000) % 60));
    var s = Math.floor(Math.abs((this.time.getTime() / 1000) % 60));
    days.innerHTML = (h < 10 ? '0' : '') + d;
    hours.innerHTML = (h < 10 ? '0' : '') + h;
    minutes.innerHTML = (m < 10 ? '0' : '') + m;
    seconds.innerHTML = (s < 10 ? '0' : '') + s;
    holding.innerHTML = this.running ? '' : '(H)';
  },
  tick: function() {
    this.time.setSeconds(this.time.getSeconds() + 1);
    this.display();
  },
  play: function() {
    this.timeInterval = setInterval(function() {
      this.tick();
    }.bind(this), 1000);
    this.running = true;
    this.display();
  },
  pause: function() {
    clearInterval(this.timeInterval);
    this.running = false;
    this.display();
  },
  toggle: function() {
    if (this.running) {
      this.pause();
    } else {
      this.play();
    }
  }
};

/**
 * Listen to keycodes to advance and go back a step
 *
 * advance: space, right arrow, down arrow and enter
 * decline:         left arrow,   up arrow and backspace
 *
 * calls the step function
 */
window.addEventListener('keydown', function(e) {
  console.log(e.keyCode);
  if (e.keyCode === 32 || e.keyCode === 39 || e.keyCode === 40 || e.keyCode === 13) {
    e.preventDefault();
    // space, right arrow, down arrow, enter
    step.advance();
  } else if (e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 8) {
    e.preventDefault();
    // left arrow, up arrow, backspace
    step.decline();
    // p, h
  } else if (e.keyCode === 80 || e.keyCode === 72) {
    e.preventDefault();
    // toggle the running of the time
    timer.toggle();
    // r show remote
  } else if (e.keyCode === 82) {
    remote.show();
    // ? show help
  } else if (e.keyCode === 191 || e.keyCode === 188) {
    help.classList.toggle('help__hidden');
  }
});

/**
 * Only run when in electron
 * shows the context menu
 * @param  {Object} process only present in electron
 */
if (process) {
  const electronRemote = require('electron').remote;
  const Menu = electronRemote.Menu;
  const MenuItem = electronRemote.MenuItem;

  var menu = new Menu();
  menu.append(new MenuItem({
    label: 'next step',
    click: function() {
      step.advance();
    }
  }));
  menu.append(new MenuItem({
    label: 'previous step',
    click: function() {
      step.decline();
    }
  }));
  menu.append(new MenuItem({
    type: 'separator'
  }));
  menu.append(new MenuItem({
    label: 'holding',
    type: 'checkbox',
    checked: true,
    click: function() {
      timer.toggle();
    }
  }));
  menu.append(new MenuItem({
    type: 'separator'
  }));
  menu.append(new MenuItem({
    label: 'show remote',
    click: function() {
      remote.show();
    }
  }));
  menu.append(new MenuItem({
    type: 'separator'
  }));
  menu.append(new MenuItem({
    label: 'help',
    click: function() {
      help.classList.toggle('help__hidden');
    }
  }));

  window.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    menu.popup(electronRemote.getCurrentWindow());
  }, false);
}
