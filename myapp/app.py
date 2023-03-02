# print("Starting Flask app...")
from flask import Flask, jsonify, render_template
import requests
import flask
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

APIKEY="534bc23767749c9092ddc16b51fe73fc4758c7ce"

@app.route('/api/bike-stations')
def get_bike_stations():
    url = f'https://api.jcdecaux.com/vls/v1/stations?contract=dublin&apiKey={APIKEY}'
    response = requests.get(url)
    return response.json()


def get_best_pickup_spot(latitude, longitude):
    # Define the URL for the API endpoint
    url = "https://api.jcdecaux.com/vls/v1/stations?contract=dublin&apiKey=d630c0ca29bdecff74ec4e2480a0e48fb5f9326f"

    # Make a GET request to the API endpoint
    response = requests.get(url)

    # Check if the request was successful
    if response.status_code == 200:
        # Parse the response JSON data
        data = json.loads(response.content.decode('utf-8'))
        
        # Get all stations
        stations = data
        
        #Calculate the distance between user location and each station
        for station in stations:
            station_latitude = station['position']['lat']
            station_longitude = station['position']['lng']
            distance = ((station_latitude - latitude) ** 2 + (station_longitude - longitude) ** 2) ** 0.5
            station['distance'] = distance
        
        # Sort stations by distance and available bikes
        sorted_stations = sorted(stations, key=lambda s: (s['distance'], s['number']))
        count=0
        best_3=[]
        # Return the closest station with available bikes
        while count<3:
            for station in sorted_stations:
                if station['number'] > 0:
                    best_3.append(station)
                    count+=1
                    
        # If no station with available bikes found, return the closest station
        return best_3[0]['name'],best_3[1]['name'],best_3[2]['name']
    else:
        # If request failed, return an error message
        return "Error: Could not retrieve bike network data"

# Example usage
latitude = 20.2082
longitude = 10.3738
best_pickup_spot = get_best_pickup_spot(latitude, longitude)
print("Best 3 pickup spots:", best_pickup_spot)


if __name__ == '__main__':
    app.run(debug=True)

