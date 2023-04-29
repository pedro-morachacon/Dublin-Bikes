# print("Starting Flask app...")
from flask import Flask, abort, jsonify, render_template, request
import requests
import flask
import json
import sqlalchemy as sqla
from sqlalchemy import create_engine, text, inspect
import traceback
import pandas as pd
from datetime import datetime, date, timedelta
import pickle
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

from sqlalchemy import create_engine
engine = create_engine('mysql+mysqlconnector://admin:qutmaS-gevbuv-nonhu3@dbike.cjpj1p90if76.us-east-1.rds.amazonaws.com:3306/dbikes') 

@app.route('/stations')
def get_stations():
    try:
        conn = engine.connect()
        results = conn.execute('SELECT * FROM station')
        rows = results.fetchall()
        print(results)
        return jsonify([row._asdict() for row in rows]) 
    except:
        print(traceback.format_exc())
        return "error in get_stations", 404
    
    
@app.route("/occupancy/<int:station_id>")
def get_occupancy(station_id):
    df = pd.read_sql_query("select * from availability where number = %(number)s", engine, params={"number": station_id})
    # print(df)
    df['last_update_date'] = pd.to_datetime(df.last_update, unit='s')
    df.set_index('last_update_date', inplace=True)

    # Select rows corresponding to today's date
    today = date.today() # - timedelta(days=1)
    today_df = df.loc[today.strftime('%Y-%m-%d')]
    print(today_df)

    # Compute the hourly average for today
    res = today_df['available_bike_stands'].resample('1h').mean()

    print(res)
    return jsonify(data=json.dumps(list(zip(map(lambda x: x.isoformat(), res.index), res.values))))

@app.route('/weather')
def get_weather():
    try:
        conn = engine.connect()
        result = conn.execute('SELECT * FROM weather ORDER BY timestamp DESC LIMIT 1')
        row = result.fetchone()
        print(row)
        # convert row tuple to a dictionary
        row_dict = dict(zip(result.keys(), row))
        return jsonify(row_dict)
    except:
        print(traceback.format_exc())
        return "error in get_weather", 404
    

@app.route('/available_bikes')
def get_available_bikes():
    try:
        conn = engine.connect()
        results = conn.execute('''SELECT DISTINCT a1.number, a1.available_bikes
                                  FROM availability a1
                                  JOIN (
                                      SELECT number, MAX(last_update) as last_update
                                      FROM availability
                                      GROUP BY number
                                  ) a2
                                  ON a1.number = a2.number AND a1.last_update = a2.last_update''')
        rows = results.fetchall()
        return jsonify([row._asdict() for row in rows])
    except:
        print(traceback.format_exc())
        return "error in get_available_bikes", 404

@app.route('/available_bike_stands')
def get_available_bike_stands():
    try:
        conn = engine.connect()
        results = conn.execute('''SELECT DISTINCT a1.number, a1.available_bike_stands
                                  FROM availability a1
                                  JOIN (
                                      SELECT number, MAX(last_update) as last_update
                                      FROM availability
                                      GROUP BY number
                                  ) a2
                                  ON a1.number = a2.number AND a1.last_update = a2.last_update''')
        rows = results.fetchall()
        return jsonify([row._asdict() for row in rows])
    except:
        print(traceback.format_exc())
        return "error in get_available_bike_stands", 404

@app.route('/daily_avg_availability/<int:station_id>')
def get_daily_avg_availability(station_id):
    try:
        conn = engine.connect()
        results = conn.execute('''SELECT number, DAYOFWEEK(FROM_UNIXTIME(last_update)) as day_of_week, AVG(available_bikes) as avg_bikes
                                  FROM availability
                                  WHERE number = %s
                                  GROUP BY number, day_of_week''', (station_id))
        rows = results.fetchall()
        return jsonify([row._asdict() for row in rows])
    except:
        print(traceback.format_exc())
        return "error in get_daily_avg_availability", 404
    

@app.route('/daily_avg_stands_availability/<int:station_id>')
def get_daily_avg_stands_availability(station_id):
    try:
        conn = engine.connect()
        results = conn.execute('''SELECT number, DAYOFWEEK(FROM_UNIXTIME(last_update)) as day_of_week, AVG(available_bike_stands) as avg_bike_stands
                                  FROM availability
                                  WHERE number = %s
                                  GROUP BY number, day_of_week''', (station_id))
        rows = results.fetchall()
        return jsonify([row._asdict() for row in rows])
    except:
        print(traceback.format_exc())
        return "error in get_daily_avg_stands_availability", 404

@app.route('/hourly_avg_availability/<date>/<int:station_id>')
def get_hourly_avg_availability(date, station_id):
    print(date)
    try:
        conn = engine.connect()
        results = conn.execute('''SELECT number, HOUR(FROM_UNIXTIME(last_update)) as hour_of_day, 
                                          AVG(available_bikes) as avg_bikes, AVG(available_bike_stands) as avg_stands
                                   FROM availability
                                   WHERE DATE(FROM_UNIXTIME(last_update)) = %s and number = %s
                                   GROUP BY number, hour_of_day;
                                   ''', (date, station_id))
        rows = results.fetchall()
        result_data = [[row.avg_bikes for row in rows], [row.avg_stands for row in rows]]
        return jsonify(result_data)
    except:
        print(traceback.format_exc())
        return "error in get_hourly_avg_availability", 404

    
    
@app.route('/hourly_weekly_avg_availability/<int:station_id>')
def hourly_weekly_avg_availability(station_id):
    try:
        conn = engine.connect()
        results = conn.execute('''SELECT number, DAYOFWEEK(FROM_UNIXTIME(last_update)) as day_of_week, HOUR(FROM_UNIXTIME(last_update)) as hour_of_day, AVG(available_bikes) as avg_bikes
                                    FROM availability
                                    WHERE number = %s
                                    GROUP BY number, day_of_week, hour_of_day;
                                    ''', (station_id,))
        rows = results.fetchall()
        return jsonify([row._asdict() for row in rows])
    except:
        print(traceback.format_exc())
        return "error in hourly_weekly_avg_availability", 404


@app.route('/prediction', methods=['POST'])
def get_prediction():
    try:
        # Get the input data from the request
        data = request.get_json()
        print("Received data:", data)
        station_id = data.get('station_id')
        date = data.get('date')
        time = data.get('time')

        # Load the corresponding model for the station
        model_filename = f'station{station_id}.pkl'
        model_filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model", model_filename)

        print("Loading model file:", model_filepath)

        with open(model_filepath, 'rb') as f:
            model = pickle.load(f)

        input_data = preprocess_input(date, time)
        prediction = model.predict([input_data])
        print("Prediction:", prediction)

        return jsonify({'bikes': prediction[0][0], 'stands': prediction[0][1]})
    except:
        print(traceback.format_exc())
        return "error in get_prediction", 500
      
def get_weather_forecast(date):
    api_key = 'ae15fcd8aa527f306b31be332291daa1'
    url = f'https://api.openweathermap.org/data/2.5/forecast?q=Dublin&appid={api_key}'
    response = requests.get(url)
    data = response.json()

    weather_data = []

    for forecast in data['list']:
        forecast_date = datetime.fromtimestamp(forecast['dt']).strftime('%Y-%m-%d')
        if forecast_date == date:
            temp = forecast['main']['temp']
            humidity = forecast['main']['humidity']
            wind_speed = forecast['wind']['speed']
            weather_data.append((temp, humidity, wind_speed))

    if not weather_data:
        return [(283, 70, 5)]  # Default values in case there's no data for the specified date

    return weather_data

def preprocess_input(date, time):
    dt = datetime.strptime(f"{date} {time}", '%Y-%m-%d %H:%M')
    weekday = dt.weekday()
    if weekday > 4:
        weekday = weekday - 4
    else:
        weekday = 0

    time_of_day = int(dt.strftime('%H%M'))

    weather_data = get_weather_forecast(date)
    
    avg_temp = sum([t for t, _, _ in weather_data]) / len(weather_data)
    avg_humidity = sum([h for _, h, _ in weather_data]) / len(weather_data)
    avg_wind = sum([w for _, _, w in weather_data]) / len(weather_data)

    input_data = [avg_temp, avg_humidity, avg_wind, weekday, time_of_day]
    return input_data

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5100)
    
