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
map.addControl(new mapboxgl.Navigation({position: "top-left"}));

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
  var issLayer = mapboxgl.polyline([]).addTo(map);

  var url = 'https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps=';
  var date = new Date();
  for (var i = 24; i > 0; i--) {
    if (i !== 24) {
      url += ',';
    }
    var temp = new Date();
    temp.setHours(date.getHours() - i);
    url += Math.round(temp.getTime() / 1000);
  }
  getJSON(url)
    .then(function(data) {
      for (var i in data) {
        polyline.addLatLng(mapboxgl.latLng(data[i].latitude,data[i].longitude));
        console.log(data[i].latitude,data[i].longitude,data[i].timestamp);
      }
    }),
    function(status) {
      console.warn(status);
    };
}

var step = {
  number: 0,
  decline: function() {
    this.number--;
    this.display();
  },
  advance: function() {
    this.number++;
    this.display();
  },
  display: function() {
    counter.innerHTML = this.number;
  }
};


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
