---
---
// @flow
// places to put data in
var mapElement = document.getElementById('map');
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
function getJSON(url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('get', url, true);
    xhr.responseType = 'json';
    xhr.onload = function () {
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

/**
 * Poll the iss data and put it on the map
 * needs:
 * - a mapbox gl map in '#map' and variable name 'map'
 */
function pollISS() {
  /**
   * Get the last timestamps in a range
   * @param  {number} max      The amount of intervals to go back
   * @param  {number} interval amount of minutes between two timestamps
   * @return {string}          ,-joined string of the intervals
   */
  function getLastTimestamps(max, interval) {
    var timestamps = [];
    var now = new Date();
    for (var i = 230; i > 0; i -= 5) {
      var temp = new Date();
      temp.setMinutes(now.getMinutes() - i);
      timestamps.push(Math.floor(temp.getTime() / 1000));
    }
    return timestamps.join(',');
  }

  getJSON(`https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps=${getLastTimestamps(230, 5)}`)
    .then(function (data) {
      const geojson = {
        type: 'FeatureCollection',
        features: []
      };

      const current = {
        type: 'Point',
        coordinates: [data[data.length - 1].longitude, data[data.length - 1].latitude]
      };

      point.setData(current);

      let coords = [];

      for (let i in data) {
        if (i != 0) {
          if (data[i].longitude - data[i - 1].longitude > 200 || data[i].longitude - data[i - 1].longitude < -200) {
            geojson.features.push({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coords
              }
            });
            coords = [];
          }
        }
        coords.push([data[i].longitude, data[i].latitude]);
      }
      geojson.features.push({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coords
        }
      });
      line.setData(geojson);
    })
    .catch(status => {
      console.warn(status);
    });
}

if (navigator.onLine === false) {
  mapElement.innerHTML = '<img src="src/img/map.png" alt="map of the world">';
} else {
  /**
   * Mapbox gl initialising
   */
  mapboxgl.accessToken = 'pk.eyJ1IjoiandyIiwiYSI6ImNpbWFwcWk1cjAwMXR3ZG04d3RxdDljZDMifQ.z794EtjWIrwwHICvYXs5Ww';
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jwr/cimaq5nsu009lbkm0gpqx3e2o',
    center: [0, 10],
    zoom: 0.5
  });
  map.addControl(new mapboxgl.Navigation({
    position: 'top-left'
  }));

  var line = new mapboxgl.GeoJSONSource({
    data: {type: 'FeatureCollection', features: [{type: 'Feature', properties: {}, geometry: {type: 'LineString', coordinates: [[-119.3167870917, -46.531659950566], [-99.018583887099, -35.777385411671], [-84.397054785368, -22.119934614843], [-72.692621944016, -7.1671054831952], [-61.81526072935, 8.1483715584995], [-49.971540149093, 23.071681846179], [-35.015607277284, 36.632621724901], [-14.132832420817, 47.130275623459], [13.82049696657, 51.76682021298], [42.617610589183, 48.48490106133], [64.824327451434, 38.810490610252], [80.620798066959, 25.647761610685], [92.840824509364, 10.89118437185], [103.75266788073, -4.4033108759685], [115.16396892378, -19.473673902861], [129.06330757415, -33.452331449791], [148.11304572056, -44.900711646668], [174.38285485558, -51.300147293497]]}}, {type: 'Feature', properties: {}, geometry: {type: 'LineString', coordinates: [[-156.21814539954, -50.081888274776], [-132.11338100223, -41.826111604545], [-114.93336502289, -29.396152350432], [-102.03008456192, -14.965798950153], [-90.95424357904, 0.25895828659825], [-79.839136517674, 15.482258810679], [-66.799546574046, 29.896797318396], [-49.335542915143, 42.25468442897], [-24.815820760543, 50.302046795573], [4.7728267801048, 51.153693943374], [30.81113735973, 44.39939448891], [49.576762211025, 32.720350182441], [63.305818292148, 18.615061023141], [74.651089380952, 3.494305581566], [85.58356293247, -11.784355279483], [97.9169459486, -26.455864422845], [113.9422340824, -39.446124156667], [136.45025004958, -48.827691543859], [165.30358515119, -51.723218668437]]}}, {type: 'Feature', properties: {}, geometry: {type: 'LineString', coordinates: [[-167.10580412833, -46.786525220246], [-146.59254981185, -36.157574547762], [-131.84206621369, -22.559653382053]]}}]}
  });

  var point = new mapboxgl.GeoJSONSource({
    data: {
      type: 'Point',
      coordinates: [-131.84206621369, -22.559653382053]
    }
  });

  map.on('style.load', function () {
    map.addSource('line', line);
    map.addLayer({
      id: 'line',
      type: 'line',
      source: 'line',
      paint: {
        'line-color': '#CCC',
        'line-width': 2
      }
    });
    map.addSource('point', point);
    map.addLayer({
      id: 'point',
      type: 'symbol',
      source: 'point',
      layout: {
        'icon-image': 'star-15'
      }
    });
  });

  pollISS();
  setInterval(() => {
    pollISS();
  }, 10000);
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
  decline() {
    this.number--;
    this.display();
  },
  advance() {
    this.number++;
    this.display();
  },
  set(i) {
    this.number = i;
    this.display();
  },
  display() {
    if (!this.data[this.number]) {
      alert('this step doesn\'t exist!'); // eslint-disable-line no-alert
    } else {
      // name
      counter.innerHTML = this.data[this.number].name;
      // texts
      var texts = this.data[this.number].text;
      var i = 0;
      var print = function (text) {
        var pre = document.createElement('pre');
        pre.innerHTML = '$ ' + text;
        if (this.data[this.number].style) {
          pre.classList.add(this.data[this.number].style);
        }
        data.appendChild(pre);
        pre.scrollIntoView({
          behaviour: 'smooth'
        });
      }.bind(this);
      var intervalId = setInterval(function () {
        if (i == texts.length) {
          clearInterval(intervalId);
          return;
        }
        print(texts[i++]);
      }, 1000);
      // video
      if (typeof this.data[this.number].video !== 'undefined') {
        video.innerHTML = `<video src="src/vid/${this.data[this.number].video}" autoplay onclick="javascript:this.muted = !this.muted;"><p>oops! no video 😢</p></video>`;
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
  show() {
    var rem = window.open('src/html/remote.html', 'remote', 'menubar=no,location=no,resizable=no,scrollbars=no,status=no,width=300,height=300');
    help.classList.add('help__hidden');
    rem.focus();
  }
};

window.addEventListener('message', function (event) {
  eval(event.data); // eslint-disable-line no-eval
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
  display() {
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
  tick() {
    this.time.setSeconds(this.time.getSeconds() + 1);
    this.display();
  },
  play() {
    this.timeInterval = setInterval(function () {
      this.tick();
    }.bind(this), 1000);
    this.running = true;
    this.display();
  },
  pause() {
    clearInterval(this.timeInterval);
    this.running = false;
    this.display();
  },
  toggle() {
    if (this.running) {
      this.pause();
    } else {
      this.play();
    }
  },
  set(d, h, m, s) {
    this.time = new Date(d * 86400000 + h * 3600000 + m * 60000 + s * 1000);
    this.display();
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
window.addEventListener('keydown', function (e) {
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
if (typeof window.process !== 'undefined') {
  const electronRemote = require('electron').remote;
  const Menu = electronRemote.Menu;
  const MenuItem = electronRemote.MenuItem;

  var menu = new Menu();
  menu.append(new MenuItem({
    label: 'next step',
    click() {
      step.advance();
    }
  }));
  menu.append(new MenuItem({
    label: 'previous step',
    click() {
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
    click() {
      timer.toggle();
    }
  }));
  menu.append(new MenuItem({
    type: 'separator'
  }));
  menu.append(new MenuItem({
    label: 'show remote',
    click() {
      remote.show();
    }
  }));
  menu.append(new MenuItem({
    type: 'separator'
  }));
  menu.append(new MenuItem({
    label: 'help',
    click() {
      help.classList.toggle('help__hidden');
    }
  }));

  window.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    menu.popup(electronRemote.getCurrentWindow());
  }, false);
}
