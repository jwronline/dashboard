---
#comment for jekyll
---

mapboxgl.accessToken = 'pk.eyJ1IjoiandyIiwiYSI6ImNpbWFwcWk1cjAwMXR3ZG04d3RxdDljZDMifQ.z794EtjWIrwwHICvYXs5Ww';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/jwr/cimaq5nsu009lbkm0gpqx3e2o',
  center: [0, 10],
  zoom: 1
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
  data: {{ site.data.steps | jsonify }},
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
      var i;
      var print = function(text) {
        console.log(i);
        setTimeout(function() {
          var p = document.createElement('p');
          p.innerHTML = '$ ' + text;
          data.appendChild(p);
        }, i * 1000);
      }
      for (i = 0; i < texts.length; i++) {
        print(texts[i]);
      }
      // video
      video.innerHTML = '<video src="'+this.data[this.number].video+'"><p>oops! no video 😢</p></video>';
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
  e.preventDefault();
  console.log(e.keyCode);
  if (e.keyCode === 32 || e.keyCode === 39 || e.keyCode === 40 || e.keyCode === 13) {
    // space, right arrow, down arrow, enter
    step.advance();
  } else if (e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 8) {
    // left arrow, up arrow, backspace
    step.decline();
  }

});
