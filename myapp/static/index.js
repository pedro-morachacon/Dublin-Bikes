// Initialize and add the map
function initMap() {
  // The location of Dublin
  const dublin = { lat: 53.35014, lng: -6.266155 };
  // The map, centered at Dublin
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: dublin,
  });
  getStations();
  getWeather();
}

function addMarkers(stations) {
  for (const station of stations) {
    // console.log(station);
    var marker = new google.maps.Marker({
      position: {
        lat: station.position_lat,
        lng: station.position_lng,
      },
      map: map,
      title: station.name,
      station_number: station.number,
    });

    marker.addListener('click', function () {
      drawInfoWindowChart(this, this.title);
    });
  }
}

function getStations() {
  fetch("/stations")
    .then((response) => response.json())
    .then((data) => {
      console.log("fetch response", typeof data);
      addMarkers(data);
    });
}

google.charts.load('current', { 'packages': ['corechart'] });
google.charts.setOnLoadCallback(initMap);

function drawInfoWindowChart(marker, stationName) {
  var jqxhr = $.getJSON($SCRIPT_ROOT + "/occupancy/" + marker.station_number, function(data) {
    data = JSON.parse(data.data);
    var node = document.createElement('div'),
        infowindow = new google.maps.InfoWindow(),
        chart = new google.visualization.ColumnChart(node);
    var chart_data = new google.visualization.DataTable();
    chart_data.addColumn('datetime', 'Time of Day');
    chart_data.addColumn('number', '#');
    _.forEach(data, function(row){
      chart_data.addRow([new Date(row[0]), row[1]]);
    })
    var options = {
      title: stationName,
      hAxis: {
        title: 'Time of Day', 
        titleTextStyle: {color: '#333'},
        format: 'HH:mm',
      },
      vAxis: {
        title: 'Available Bikes',
        minValue: 0,
      },
      legend: {position: 'none'},  // Hide the legend
      chartArea: {width: '80%', height: '70%'}
    };
    var chart = new google.visualization.ColumnChart(node);
    chart.draw(chart_data, options);
    var infowindow = new google.maps.InfoWindow({
      content: node
    });
    infowindow.open(map, marker);
  }).fail(function() {
    console.log( "error" );
  })
}


  function getWeather() {
    // Get the latest weather data
    $.get('/weather', function(data) {
        console.log(data);
        // Update the temperature and description
        $('#temp').text(data.temperature);
        $('#description').text(data.description);
    });
};




var map = null;
window.initMap = initMap;