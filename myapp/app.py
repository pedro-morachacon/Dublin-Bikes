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

APIKEY="534bc23767749c9092ddc16b51fe73fc4758c7ce"

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
    df['last_update_date'] = pd.to_datetime(df.last_update, unit='s')
    df.set_index('last_update_date', inplace=True)

    # Select rows corresponding to today's date
    today = date.today() # - timedelta(days=1)
    today_df = df.loc[today.strftime('%Y-%m-%d')]

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
        results = conn.execute('''SELECT a1.number, a1.available_bikes
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
    
@app.route('/prediction', methods=['POST'])
def get_prediction():
    try:
        # Get the input data from the request
        data = request.get_json()
        print(data)
        station_name = data.get('station_name')
        date = data.get('date')
        time = data.get('time')

        # Load the corresponding model for the station
        station_id = get_station_id_by_name(station_name)
        model_filename = f'station{station_id}.pkl'
        model_filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model", model_filename)

        with open(model_filepath, 'rb') as f:
            model = pickle.load(f)

        input_data = preprocess_input(date, time)
        prediction = model.predict([input_data])
        print(prediction)

        return jsonify({'bikes': prediction[0][0], 'stands': prediction[0][1]})
    except:
        print(traceback.format_exc())
        return "error in get_prediction", 500

def get_station_id_by_name(station_name):
    try:
        conn = engine.connect()
        result = conn.execute('SELECT number FROM station WHERE name = %s', (station_name,))
        row = result.fetchone()
        if row:
            return row[0]
        else:
            return None
    except:
        print(traceback.format_exc())
        return None
    
def get_latest_weather():
    try:
        conn = engine.connect()
        result = conn.execute('SELECT * FROM weather ORDER BY timestamp DESC LIMIT 1')
        row = result.fetchone()
        if row:
            return dict(zip(result.keys(), row))
        else:
            return None
    except:
        print(traceback.format_exc())
        return None

def preprocess_input(date, time):
    dt = datetime.strptime(f"{date} {time}", '%Y-%m-%d %H:%M')
    weekday = dt.weekday()
    if weekday > 4:
        weekday = weekday - 4
    else:
        weekday = 0

    time_of_day = int(dt.strftime('%H%M'))

    latest_weather = get_latest_weather()
    if latest_weather:
        temp = latest_weather['temperature']
        humidity = latest_weather['humidity']
        wind = latest_weather['wind_speed']
    else:
        temp = 10
        humidity = 70
        wind = 5

    input_data = [temp, humidity, wind, weekday, time_of_day]
    return input_data

if __name__ == '__main__':
    app.run(debug=True)
    
