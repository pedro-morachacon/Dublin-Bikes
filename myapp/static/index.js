// Initialize and add the map
async function initMap() {
  // The location of Dublin
  const dublin = { lat: 53.35014, lng: -6.266155 };
  // The map, centered at Dublin
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: dublin,
  });
  getStations();
  getWeather();
  populateStations();

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer();

  directionsRenderer.setMap(map);

  // Create the autocomplete objects for the start and end inputs
  const startInput = document.getElementById("start");
  const endInput = document.getElementById("end");

  const options = {
    fields: ["address_components", "geometry", "icon", "name"],
    componentRestrictions: { country: "ie" },
    strictBounds: false,
  };

  const placesService = new google.maps.places.PlacesService(map);
  const startAutocomplete = new google.maps.places.Autocomplete(startInput, options);
  const endAutocomplete = new google.maps.places.Autocomplete(endInput, options);

  document.getElementById("station-input").addEventListener("input", function () {
    selectedStationValue = this.value; 
  });
 

  // Handle the button click
  document.querySelector(".plan-journey-btn").addEventListener("click", async () => {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    const stationInput = document.getElementById("station-input");
    const selectedStation = selectedStationValue;
  
    const dateInput = document.querySelector('.date-input input[type="date"]');
    const timeInput = document.querySelector('.time-input input[type="time"]');
  
    if (dateInput.value && timeInput.value) {
      const response = await fetch('/prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          station_name: selectedStation,
          date: dateInput.value,
          time: timeInput.value
        })
      });
  
      if (response.ok) {
        const prediction = await response.json();
  
        document.querySelector('.left-nav').style.display = 'none';
        document.querySelector('#prediction-pane').style.display = 'block';
        document.querySelector('#prediction-text').innerHTML = `There will be <span style="color:red">${Math.round(prediction.bikes)}</span> bikes and <span style="color:red">${Math.round(prediction.stands)}</span> bike stands at <span style="color:blue">${selectedStation}</span> on <span style="color:green">${dateInput.value} at ${timeInput.value}</span>.`;
      } else {
        alert("Error getting prediction.");
      }
    }
  
    document.querySelector('#go-back-btn').addEventListener('click', function () {
      document.querySelector('#prediction-pane').style.display = 'none';
      document.querySelector('.left-nav').style.display = 'block';
    });


    directionsService.route(
      {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(response);
          displayNavigationInstructions(response); 
          resetBlueMarkers();

          // Get the best pickup spots after successfully setting the directions
          const startLatLng = response.routes[0].legs[0].start_location;
          getBestPickupSpot(startLatLng)
            .then((bestStations) => {
              bestStations.forEach((station) => {
                // Find the corresponding marker
                const stationMarker = markers.find((marker) => {
                  return marker.station_number === station.number;
                });
                console.log(stationMarker);
                // Update the marker icon's size and color
                if (stationMarker) {
                  // Remove the original marker
                  stationMarker.setMap(null);

                  // Create a new marker with the blue icon
                  const newMarker = createCustomMarker(station, "http://maps.google.com/mapfiles/ms/icons/blue-dot.png");

                  // Replace the original marker in the markers array
                  const index = markers.indexOf(stationMarker);
                  if (index !== -1) {
                    markers[index] = newMarker;
                  }
                }

              });
            })
            .catch((error) => {
              console.error("Error: Could not retrieve bike network data", error);
            });
        } else {
          window.alert("Directions request failed due to " + status);
        }
      }
    );

  });
  
  function displayNavigationInstructions(directionsResult) {
    const instructionsContainer = document.querySelector("#navigation-instructions");
    instructionsContainer.innerHTML = "";
  
    const steps = directionsResult.routes[0].legs[0].steps;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const instruction = document.createElement("p");
      instruction.innerHTML = step.instructions;
      instructionsContainer.appendChild(instruction);
    }
  }
  

  // Fetch available bikes data and create heatmap
  const availableBikesData = await fetchAvailableBikes();
  createHeatmapLayer(availableBikesData);

  initDarkModeToggle(map, darkModeStyles);
}

function initDarkModeToggle(map, darkModeStyles) {
  const toggleContainer = document.createElement("div");
  toggleContainer.classList.add("map-toggle-container");
  map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(toggleContainer);

  const toggleSwitch = document.createElement("label");
  toggleSwitch.classList.add("switch");
  toggleContainer.appendChild(toggleSwitch);

  const toggleInput = document.createElement("input");
  toggleInput.type = "checkbox";
  toggleSwitch.appendChild(toggleInput);

  const toggleSlider = document.createElement("span");
  toggleSlider.classList.add("slider", "round");
  toggleSwitch.appendChild(toggleSlider);

  let isDarkMode = false;
  toggleInput.addEventListener("change", () => {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
      map.setOptions({ styles: darkModeStyles });
    } else {
      map.setOptions({ styles: null });
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#weather-forecast-btn").addEventListener("click", () => {
    const weatherPane = document.getElementById("weather-pane");
    if (weatherPane.style.display === "none") {
      getWeatherForecast(); // Call the function to fetch and show the weather forecast
      weatherPane.style.display = "block";
    } else {
      weatherPane.style.display = "none";
    }
  });
});

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
      icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
    });

    marker.addListener('click', function () {
      drawInfoWindowChart(this, this.title);
      selectedStationValue = station.name;
      console.log(selectedStationValue);
      document.getElementById("station-input").value = selectedStationValue;
    });
    markers.push(marker);
  }
}

function createCustomMarker(station, iconUrl) {
  const newMarker = new google.maps.Marker({
    position: {
      lat: station.position.lat,
      lng: station.position.lng,
    },
    map: map,
    title: station.name,
    station_number: station.number,
    icon: iconUrl,
  });

  newMarker.addListener("click", function () {
    drawInfoWindowChart(this, this.title);
    selectedStationValue = station.name;
    console.log(selectedStationValue);
    document.getElementById("station-input").value = selectedStationValue;
  });

  return newMarker;
}

function changeMarkerIcon(marker, iconUrl) {
  marker.setIcon({
    url: iconUrl,
  });
}

function resetBlueMarkers() {
  markers.forEach((marker) => {
    if (marker.icon === "http://maps.google.com/mapfiles/ms/icons/blue-dot.png") {
      changeMarkerIcon(marker, "http://maps.google.com/mapfiles/ms/icons/red-dot.png");
    }
  });
}

function getStations() {
  fetch("/stations")
    .then((response) => response.json())
    .then((data) => {
      console.log("fetch response", typeof data);
      stationData = data;
      addMarkers(data);
    });
}

google.charts.load('current', { 'packages': ['corechart'] });
// google.charts.setOnLoadCallback(initMap);

function drawInfoWindowChart(marker, stationName) {

  var jqxhr = $.getJSON($SCRIPT_ROOT + "/occupancy/" + marker.station_number, function (data) {
    data = JSON.parse(data.data);
    var node = document.createElement('div'),
      infowindow = new google.maps.InfoWindow(),
      chart = new google.visualization.ColumnChart(node);
    var chart_data = new google.visualization.DataTable();
    chart_data.addColumn('datetime', 'Time of Day');
    chart_data.addColumn('number', '#');
    _.forEach(data, function (row) {
      chart_data.addRow([new Date(row[0]), row[1]]);
    })
    var options = {
      title: stationName,
      hAxis: {
        title: 'Time of Day',
        titleTextStyle: { color: '#333' },
        format: 'HH:mm',
      },
      vAxis: {
        title: 'Available Bike Stands',
        minValue: 0,
      },
      legend: { position: 'none' },  // Hide the legend
      chartArea: { width: '80%', height: '70%' }
    };
    var chart = new google.visualization.ColumnChart(node);
    chart.draw(chart_data, options);
    var infowindow = new google.maps.InfoWindow({
      content: node
    });

    if (openInfoWindow) {
      openInfoWindow.close();
    }
    openInfoWindow = infowindow;

    infowindow.open(map, marker);
  }).fail(function () {
    console.log("error");
  })
}

function getWeather() {
  // Get the latest weather data
  $.get('/weather', function (data) {
    console.log(data);
    // Update the temperature and description
    $('#temp').text(Math.round(data.temperature - 273.15) + "℃");
    $('#description').text(data.description);
  });
};

function getWeatherForecast() {
  $.get('https://api.openweathermap.org/data/2.5/forecast?q=Dublin&appid=ae15fcd8aa527f306b31be332291daa1', function (data) {
    let forecastHTML = '';
    for (let i = 0; i < 8; i++) { // Loop through the next 8 forecasts (24 hours)
      const forecast = data.list[i];
      const timestamp = new Date(forecast.dt * 1000);
      const hours = timestamp.getHours();
      const temperature = Math.round(forecast.main.temp - 273.15);
      forecastHTML += `${hours}:00 ${temperature}°C &emsp;`;
    }
    $('#weather-pane').html(forecastHTML);
  });
}


function getBestPickupSpot(startLatLng) {
  return new Promise((resolve, reject) => {
    const url = "https://api.jcdecaux.com/vls/v1/stations?contract=dublin&apiKey=d630c0ca29bdecff74ec4e2480a0e48fb5f9326f";

    fetch(url)
      .then(response => response.json())
      .then(data => {
        const stations = data.filter(station => station.available_bikes > 0);

        stations.forEach(station => {
          const stationLatitude = station.position.lat;
          const stationLongitude = station.position.lng;
          const earthRadius = 6371; // in kilometers
          const dLat = deg2rad(stationLatitude - startLatLng.lat());
          const dLng = deg2rad(stationLongitude - startLatLng.lng());
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(startLatLng.lat())) * Math.cos(deg2rad(stationLatitude)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = earthRadius * c;
          station.distance = distance;
        });

        const sortedStations = stations.sort((a, b) => (a.distance - b.distance) || (a.number - b.number));

        const bestStations = sortedStations.slice(0, 3);
        console.log(bestStations);

        if (bestStations.length > 0) {
          resolve(bestStations);

        } else {
          resolve([sortedStations[0].number]);
        }
      })
      .catch(error => {
        console.error("Error: Could not retrieve bike network data", error);
        reject("Error: Could not retrieve bike network data");
      });
  });
}

function deg2rad(degrees) {
  return degrees * (Math.PI / 180);
}

async function fetchAvailableBikes() {
  const response = await fetch('/available_bikes');
  const data = await response.json();
  return data;
}

function createHeatmapLayer(availableBikesData) {
  const heatmapData = [];
  var flag = false;

  for (const data of availableBikesData) {
    const number = data.number;
    if (number == 507) flag = true;
    const availableBikes = data.available_bikes;
    const station = stationData.find(s => s.number === number);
    if (station) {
      const location = new google.maps.LatLng(station.position_lat, station.position_lng);
      const weight = availableBikes;
      if (number != 507 || !flag) heatmapData.push({ location, weight });
    }
  }

  const heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatmapData,
    maxIntensity: 40,
    radius: 30,
    dissipating: true,
    map: map
  });

  return heatmap;
}

function populateStations() {
  $.get('/stations', function (data) {
    const stations = data.map(station => `<option value="${station.name}" data-id="${station.id}">`);
    $('#stations').html(stations.join(''));
  });
}



function createDarkLightModeControl(map) {
  const controlDiv = document.createElement("div");

  const controlUI = document.createElement("div");
  controlUI.style.backgroundColor = "#fff";
  controlUI.style.border = "2px solid #fff";
  controlUI.style.borderRadius = "3px";
  controlUI.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.3)";
  controlUI.style.cursor = "pointer";
  controlUI.style.marginBottom = "22px";
  controlUI.style.marginLeft = "10px";
  controlUI.style.textAlign = "center";
  controlUI.title = "Click to toggle dark/light mode";
  controlDiv.appendChild(controlUI);

  const controlText = document.createElement("div");
  controlText.style.color = "rgb(25,25,25)";
  controlText.style.fontFamily = "Roboto,Arial,sans-serif";
  controlText.style.fontSize = "16px";
  controlText.style.lineHeight = "38px";
  controlText.style.paddingLeft = "5px";
  controlText.style.paddingRight = "5px";
  controlText.innerHTML = "Dark/Light";
  controlUI.appendChild(controlText);

  controlUI.addEventListener("click", function () {
    const currentStyles = map.get('styles');
    if (currentStyles) {
      map.set('styles', null);
    } else {
      map.set('styles', darkModeStyles);
    }
  });

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlDiv);
}


const darkModeStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];




var map = null;
var markers = []
var selectedStationValue = null;;
var stationData;
var openInfoWindow;

window.initMap = initMap;