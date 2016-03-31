---
#comment for jekyll
---

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

var pollISS = function() {
  var geojson = {
    "type": "geojson",
    "data": {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "LineString",
        "coordinates": []
      }
    }
  }

  var url = 'https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps=';
  var date = new Date();
  for (var i = 400; i > 0; i -= 10) {
    if (i !== 400) {
      url += ',';
    }
    var temp = new Date();
    temp.setMinutes(date.getMinutes() - i);
    url += Math.floor(temp.getTime() / 1000);
  }
  getJSON(url)
    .then(function(data) {
      for (var i in data) {
        geojson.data.geometry.coordinates.push([data[i].longitude, data[i].latitude]);
      }
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
    }),
    function(status) {
      console.warn(status);
    };
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
      pollISS();
      // name
      counter.innerHTML = this.data[this.number].name;
      // texts
      var texts = this.data[this.number].text;
      var i = 0;
      var print = function(text) {
        var p = document.createElement('p');
        p.innerHTML = '$ ' + text;
        data.appendChild(p);
        p.scrollIntoView({
          behaviour: 'smooth'
        });
      }
      var intervalId = setInterval(function() {
        if (i == texts.length) {
          clearInterval(intervalId);
          return;
        }
        print(texts[i++]);
      }, 1000);
      // video
      video.innerHTML = '<video src="src/vid/' + this.data[this.number].video + '" autoplay ><p>oops! no video 😢</p></video>';
    }
  }
};

/**
 * The timer holding
 * - the current MET
 * - add one second
 * - start running
 * - stop running
 * - toggle running
 * @type {Object}
 */
// start at -9m00 (a.k.a -1.dec.31.23.51.00)
// var _time = new Date(-000001, 11, 31, 23, 59, 55);
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
    days.innerHTML = (this.time.getDate() < 10 ? '0' : '' ) + this.time.getDate();
    hours.innerHTML = (this.time.getHours() < 10 ? '0' : '' ) + this.time.getHours();
    minutes.innerHTML = (this.time.getMinutes() < 10 ? '0' : '' ) + this.time.getMinutes();
    seconds.innerHTML = (this.time.getSeconds() < 10 ? '0' : '' ) + this.time.getSeconds();
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
  },
  pause: function() {
    clearInterval(this.timeInterval);
    this.running = false;
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
    // p
  } else if (e.keyCode === 80) {
    e.preventDefault();
    // toggle the running of the time
    timer.toggle();
  }
});
