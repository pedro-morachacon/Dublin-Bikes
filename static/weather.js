// **** The weather pane idea comes from COMP30680 Practical 7 Assignment 2 example 2017: JavaScript and JSON **** //

// Function to get the weather forecast from the API
function getWeatherForecast() {
    $.get('https://api.openweathermap.org/data/2.5/forecast?q=Dublin&appid=ae15fcd8aa527f306b31be332291daa1', function (data) {
        displayForecastTable(data);
    });
}

// Function to get the current weather from the API
function getWeather() {
    // Get the latest weather data
    $.get('https://api.openweathermap.org/data/2.5/weather?q=Dublin&appid=ae15fcd8aa527f306b31be332291daa1', function (data) {
        // Set the icon
        const iconSRC = `<img src="https://openweathermap.org/img/w/${data.weather[0].icon}.png" style="width:50px;height:50px;">`;

        // Update the temperature and description
        const tempCelsius = Math.round(data.main.temp - 273.15);
        const description = data.weather[0].description;
        $('#temp').text(tempCelsius + "℃");
        $('#description').text(description);
        $('#weatherIcon').html(iconSRC);
    });
};


function displayForecastTable(data) {
    let forecastHTML = '<table>';
    forecastHTML += '<tr><th>Day</th><th>Summary</th><th>Icon</th><th>Min temp</th><th>Max temp</th><th>Details</th></tr>';

    let previousDate = '';
    let minTemp, maxTemp, summary, icon;

    data.list.forEach((forecast, index) => {
        const timestamp = new Date(forecast.dt * 1000);
        const date = timestamp.toDateString();

        // If it's a new date, save the previous date's data and reset the values
        if (previousDate !== date) {
            if (previousDate !== '') {
                // Add previous day's data to the table
                forecastHTML += `<tr><td>${previousDate}</td><td>${summary}</td><td>${icon}</td><td>${minTemp}&deg;C</td><td>${maxTemp}&deg;C</td>`;
                forecastHTML += `<td><button class="details-btn" data-date="${previousDate}">Show details</button></td></tr>`;
            }

            // Update values for the new date
            previousDate = date;
            minTemp = Math.round(forecast.main.temp_min - 273.15);
            maxTemp = Math.round(forecast.main.temp_max - 273.15);
            summary = forecast.weather[0].description;
            icon = `<img src="https://openweathermap.org/img/w/${forecast.weather[0].icon}.png" style="width:50px;height:50px;">`;
        } else {
            const tempMin = Math.round(forecast.main.temp_min - 273.15);
            const tempMax = Math.round(forecast.main.temp_max - 273.15);

            if (tempMin < minTemp) minTemp = tempMin;
            if (tempMax > maxTemp) maxTemp = tempMax;
        }

        if (index === data.list.length - 1) {
            // Add last day's data to the table
            forecastHTML += `<tr><td>${previousDate}</td><td>${summary}</td><td>${icon}</td><td>${minTemp}&deg;C</td><td>${maxTemp}&deg;C</td>`;
            forecastHTML += `<td><button class="details-btn" data-date="${previousDate}">Show details</button></td></tr>`;
        }

        document.querySelectorAll(".details-btn").forEach(button => {
            button.addEventListener("click", () => {
                const date = button.getAttribute("data-date");
                // Call the function to fetch and display the detailed weather information for the specified date
                displayDetailedWeather(date);
            });
        });
    });

    forecastHTML += '</table>';
    $('#weather-pane').html(forecastHTML);

    // Add event listeners to details buttons
    document.querySelector("#weather-pane").addEventListener("click", (event) => {
        if (event.target.matches(".details-btn")) {
            const date = event.target.getAttribute("data-date");
            displayDetailedWeather(date);
        }
    });
}

function displayDetailedWeather(date) {
    // Fetch the weather data again and filter for the specific date
    $.get('https://api.openweathermap.org/data/2.5/forecast?q=Dublin&appid=ae15fcd8aa527f306b31be332291daa1', function (data) {
        const detailsHTML = `<h3>Detailed forecast for ${date}</h3><div id="detailed-weather"></div>`;
        $('#detailed-weather-pane').html(detailsHTML).show();

        let detailedWeatherHTML = '';
        data.list.forEach((forecast) => {
            const timestamp = new Date(forecast.dt * 1000);
            const forecastDate = timestamp.toDateString();
            if (date === forecastDate) {
                const hours = timestamp.getHours();
                const summary = forecast.weather[0].description;
                const icon = forecast.weather[0].icon;
                const temperature = Math.round(forecast.main.temp - 273.15);
                detailedWeatherHTML += `
            <div class="detail">
              <div class="time">${hours}:00</div>
              <img src="http://openweathermap.org/img/w/${icon}.png" alt="${summary}" width="50" height="50">
              <div class="desc">${summary}</div>
              <div class="temp">${temperature}°C</div>
            </div>`;
            }
        });

        $('#detailed-weather').html(detailedWeatherHTML);
        toggleDetailedWeatherPane(true);
        const detailedWeatherPane = document.getElementById('detailed-weather-pane');
        detailedWeatherPane.style.height = "300px";

    });
}

// Function to toggle the detailed weather pane
function toggleDetailedWeatherPane() {
    const detailedWeatherPane = document.getElementById('detailed-weather-pane');
    if (detailedWeatherPane.style.height === "0px") {
        detailedWeatherPane.style.height = "300px";
    } else {
        detailedWeatherPane.style.height = "0px";
    }
}

