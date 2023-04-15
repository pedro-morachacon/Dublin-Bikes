google.charts.load('current', { 'packages': ['corechart'] });
var dateInputElement;
var markers = [];
var map = null;
var selectedStationValue = null;
var stationData;
var openInfoWindow;
var selectedStationName = null;
var dailyData = [5, 5, 5, 5, 5, 5, 5];
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const today = new Date().toISOString().substr(0, 10);
var dailyChart;
// Initially set title to "Predictive"
var predictionStatus = "Predictive";

var hourlyChart;
var hourlyData = new Array(7);
for (var i = 0; i < 7; i++) hourlyData[i] = Array(24).fill(5);

var predictionChart;
var predictionData = new Array(2);
for (var i = 0; i < 2; i++) predictionData[i] = Array(24).fill(5);

var darkMode = false;

// Global funcition to map stations' names to id
function getStationNumberByName(stationName) {
  const station = stationData.find(station => station.name === stationName);
  return station ? station.number : null;
}


async function initMap() {
  // The location of Dublin
  const dublin = { lat: 53.35014, lng: -6.266155 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: dublin,
  });

  await getStations(); // Wait for the station data to be fetched
  getWeather();
  populateStations();
  dateInputElement = document.querySelector('.date-input input[type="date"]');
  dateInputElement.value = today;
  selectedStationName = document.getElementById("station-input");
  const stationNumber = getStationNumberByName(selectedStationName.value);

  async function fetchAvailableBikes() {
    const response = await fetch('/available_bikes');
    const data = await response.json();
    return data;
  }

  // Function to create heat map layer
  function createHeatmapLayer(availableBikes) {
    const heatmapData = [];
    //Filter duplicates
    var flag = false;

    for (const data of availableBikes) {
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

  // Fetch available bikes data and create heatmap
  const availableBikes = await fetchAvailableBikes();
  createHeatmapLayer(availableBikes);


  if (stationNumber) {
    dateInputElement = document.querySelector('.date-input input[type="date"]');
    dateInputElement.value = today;

    updateCharts(dateInputElement.value, stationNumber);
  } else {
    console.log("Station not found.");
  }

  function getStations() {
    return new Promise((resolve, reject) => {
      fetch("/stations")
        .then((response) => response.json())
        .then((data) => {
          console.log("fetch response", typeof data);
          stationData = data;
          addMarkers(data);
          resolve(data);
        })
        .catch((error) => {
          console.error("Failed to fetch stations data:", error);
          reject(error);
        });
    });
  }


  // Function to create the datalist of stations
  function populateStations() {
    $.get('/stations', function (data) {
      const stations = data.map(station => `<option value="${station.name}" data-id="${station.id}">`);
      $('#stations').html(stations.join(''));
    });
  }

  // Function to add markers of the map
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
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      });

      marker.addListener('click', function () {
        // When click markers, populate the datalist and show info window
        drawInfoWindowChart(this, this.title);
        selectedStationValue = station.name;
        console.log(selectedStationValue);
        document.getElementById("station-input").value = selectedStationValue;
      });
      markers.push(marker);
    }
  }

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
}

// Wrap functions inside to avoid access objects before created
document.addEventListener("DOMContentLoaded", () => {
  // Create charts
  dailyChart = createDailyChart("daily-chart", dailyData);
  hourlyChart = createHourlyChart("hourly-chart", hourlyData);
  predictionChart = createPredictionChart("prediction-chart", predictionData);

  function createDailyChart(chartID, chartData) {
    var chart = document.getElementById(chartID).getContext('2d');
    var barChart = new Chart(chart, {
      type: 'bar',
      data: {
        labels: daysOfWeek,
        datasets: [
          {
            label: "Average",
            backgroundColor: "#1996ff",
            data: chartData
          }
        ]
      },
      options: {
        maintainAspectRatio: true,
        legend: { display: false },
        title: {
          display: true,
          text: "Average Daily Bikes",
          fontColor: 'grey'
        },
        scales: {
          xAxes: [{
            ticks: {
              fontColor: 'grey',
            },
          }],
          yAxes: [{
            display: true,
            stacked: false,
            ticks: { beginAtZero: true,
              fontColor: 'grey',},
          }]
        }
      }

    });

    return barChart;
  }

  function createHourlyChart(chartID, hourlyData) {
    var chart = document.getElementById(chartID).getContext('2d');
    var lineChart = new Chart(chart, {
      type: 'line',
      data: {
        labels: ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"],
        datasets: [{
          data: hourlyData[0],
          label: "Monday",
          borderColor: "#ff0000",
          fill: false
        }, {
          data: hourlyData[1],
          label: "Tuesday",
          borderColor: "#ff8000",
          fill: false
        }, {
          data: hourlyData[2],
          label: "Wednesday",
          borderColor: "#ffff00",
          fill: false
        }, {
          data: hourlyData[3],
          label: "Thursday",
          borderColor: "#00ff00",
          fill: false
        }, {
          data: hourlyData[4],
          label: "Friday",
          borderColor: "#00ffff",
          fill: false
        }, {
          data: hourlyData[5],
          label: "Saturday",
          borderColor: "#0000ff",
          fill: false
        }, {
          data: hourlyData[6],
          label: "Sunday",
          borderColor: "#8000ff",
          fill: false
        }]
      },
      options: {
        title: {
          display: true,
          text: "Average Hourly Weekly Bikes",
          fontColor: 'grey',
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            boxWidth: 10,
            fontColor: 'grey'
          }
        },
        scales: {
          xAxes: [{
            ticks: {
              fontColor: 'grey',
            },
          }],
          yAxes: [{
            ticks: {
              fontColor: 'grey',
            },
          }],
        },
      }
    });

    return lineChart;
  }

  function createPredictionChart(chartID, chartData) {
    var chart = document.getElementById(chartID).getContext('2d');

    var lineChart = new Chart(chart, {
      type: 'line',
      data: {
        labels: ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"],
        datasets: [{
          data: chartData[0],
          label: "Available Bikes",
          borderColor: "#3e95cd",
          fill: false
        }, {
          data: chartData[1],
          label: "Available Stands",
          borderColor: "#8e5ea2",
          fill: false
        }]
      },
      options: {
        title: {
          display: true,
          text: predictionStatus + " Hourly Daily Occupancy",
          fontColor: 'grey',
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            boxWidth: 10,
            fontColor: 'grey'
          }
        },
        scales: {
          xAxes: [{
            ticks: {
              fontColor: 'grey',
            },
          }],
          yAxes: [{
            ticks: {
              fontColor: 'grey',
            },
          }],
        },
      }
    });

    return lineChart;
  }

  async function updateCharts(date, station_number) {
    console.log("updateCharts called with date:", date, "and station_number:", station_number);

    var predictionData = await fetchDataForPredictionChart(date, station_number);
    console.log("Fetched predictionData:", predictionData);
    for (var i = 0; i < 2; i++) {
      predictionChart.data.datasets[i].data = predictionData[i];
    }
    predictionChart.options.title.text = predictionStatus + " Hourly Daily Occupancy";
    predictionChart.update();

    var dailyData = await fetchDailyAvgAvailability(station_number);
    var dailyChartData = dailyData.map(item => parseFloat(item.avg_bikes));
    console.log("Fetched dailyData:", dailyData);
    console.log("Processed dailyData:", dailyChartData);

    var hourlyData = await fetchHourlyWeeklyAvgAvailability(station_number);
    var hourlyChartData = Array(7).fill().map(() => Array(24).fill(0));

    hourlyData.forEach(item => {
      const dayIndex = item.day_of_week - 1;
      const hourIndex = item.hour_of_day;
      hourlyChartData[dayIndex][hourIndex] = parseFloat(item.avg_bikes);
    });
    console.log("Fetched hourlyData:", hourlyData);
    console.log("Processed hourlyData:", hourlyChartData);

    // Update the charts using the fetched data
    dailyChart.data.datasets[0].data = dailyChartData;
    dailyChart.update();

    for (var i = 0; i < hourlyChartData.length; i++) {
      hourlyChart.data.datasets[i].data = hourlyChartData[i];
    }
    hourlyChart.update();
  }

  async function fetchDailyAvgAvailability(station_number) {
    const response = await fetch(`/daily_avg_availability/${station_number}`);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error("Failed to fetch daily average availability data");
    }
  }

  async function fetchHourlyWeeklyAvgAvailability(station_number) {
    const response = await fetch(`/hourly_weekly_avg_availability/${station_number}`);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error("Failed to fetch hourly weekly availability data");
    }
  }

  async function fetchDataForPredictionChart(date, station_id) {
    if (date < today) {
      predictionStatus = "Historical"

      // Get historical data
      const response = await fetch(`/hourly_avg_availability/${date}/${station_id}`);
      return await response.json();
    } else {
      predictionStatus = "Predictive"
      // Get prediction data
      const predictionsBikes = [];
      const predictionsStands = [];
      for (let hour = 0; hour < 24; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        const response = await fetch('/prediction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            station_id: station_id,
            date: date,
            time: time,
          }),
        });

        const prediction = await response.json();
        predictionsBikes.push(prediction.bikes);
        predictionsStands.push(prediction.stands);
      }
      return [predictionsBikes, predictionsStands]; // Return predictions for available bikes and bike stands
    }
  }

  //Display charts button
  document.getElementById("display-charts-btn").addEventListener("click", () => {
    const selectedDate = document.querySelector('.date-input input[type="date"]').value;
    const selectedStationName = document.getElementById("station-input").value;
    const selectedStationNumber = getStationNumberByName(selectedStationName);

    if (selectedStationNumber) {
      updateCharts(selectedDate, selectedStationNumber);
      updateStationInformation(selectedStationNumber);
    } else {
      console.log("Station not found.");
    }
  });

  // Weather button
  document.querySelector("#weather-forecast-btn").addEventListener("click", () => {
    const weatherPane = document.getElementById("weather-pane");
    const detailedWeatherPane = document.getElementById("detailed-weather-pane");
    if (weatherPane.style.display === "none") {
      getWeatherForecast();
      weatherPane.style.display = "block";
      detailedWeatherPane.style.height = "0px"; // Hide the detailed weather pane
    } else {
      weatherPane.style.display = "none";
      detailedWeatherPane.style.height = "0px";
    }
  });

  function updateStationInformation(stationNumber) {
    // Fetch station data
    $.get(`https://api.jcdecaux.com/vls/v1/stations/${stationNumber}?contract=dublin&apiKey=534bc23767749c9092ddc16b51fe73fc4758c7ce`, function (station) {
      if (station) {
        $("#current-station").text("***Current Station: " + station.name);
        $("#station-status").text("Status: " + station.status);
        $("#current-available-bikes").text("Available Bikes: " + station.available_bikes);
        $("#current-available-bike-stands").text("Available Bike Stands: " + station.available_bike_stands);
      }
    });
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

  const darkModeChartOptions = {
    title: {
      fontColor: '#f3d19c',
    },
    scales: {
      xAxes: [{
        ticks: {
          fontColor: '#f3d19c',
        },
      }],
      yAxes: [{
        ticks: {
          fontColor: '#f3d19c',
        },
      }],
    },
  };
  
  const lightModeChartOptions = {
    title: {
      fontColor: 'grey',
    },
    scales: {
      xAxes: [{
        ticks: {
          fontColor: 'grey',
        },
      }],
      yAxes: [{
        ticks: {
          fontColor: 'grey',
        },
      }],
    },
  };

  document.getElementById("theme-btn").addEventListener("click", toggleTheme);

  function toggleTheme() {
    darkMode = !darkMode;
    const btn = document.getElementById("theme-btn");
  
    // Toggle dark mode class on body
    document.body.classList.toggle("dark-mode");
  
    // Detailed pane
    const detailedPane = document.getElementById('detailed-weather-pane');
    if (detailedPane) {
      detailedPane.classList.toggle('dark-mode', darkMode);
    }
  
    // Update chart options
    const chartOptions = darkMode ? darkModeChartOptions : lightModeChartOptions;
    Object.assign(dailyChart.options.title, chartOptions.title);
    Object.assign(dailyChart.options.scales.xAxes[0], chartOptions.scales.xAxes[0]);
    Object.assign(dailyChart.options.scales.yAxes[0], chartOptions.scales.yAxes[0]);
    dailyChart.update();
  
    Object.assign(hourlyChart.options.title, chartOptions.title);
    Object.assign(hourlyChart.options.scales.xAxes[0], chartOptions.scales.xAxes[0]);
    Object.assign(hourlyChart.options.scales.yAxes[0], chartOptions.scales.yAxes[0]);
    hourlyChart.update();
  
    Object.assign(predictionChart.options.title, chartOptions.title);
    Object.assign(predictionChart.options.scales.xAxes[0], chartOptions.scales.xAxes[0]);
    Object.assign(predictionChart.options.scales.yAxes[0], chartOptions.scales.yAxes[0]);
    predictionChart.update();
  
    // Change the button text
    if (btn.innerHTML === "Dark Mode") {
      btn.innerHTML = "Light Mode";
      map.setOptions({ styles: darkModeStyles });
    } else {
      btn.innerHTML = "Dark Mode";
      map.setOptions({ styles: null });
    }
  }
  
  window.initMap = initMap;

});

