# print("Starting Flask app...")
from flask import Flask, abort, jsonify, render_template
import requests
import flask
import json
import sqlalchemy as sqla  
from sqlalchemy import create_engine, text, inspect
import traceback
import pandas as pd
from requests import request
from datetime import datetime, date, timedelta

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
      
          
# @app.route("/occupancy/<int:station_id>")
# def get_occupancy(station_id):
#     df = pd.read_sql_query("select * from availability where number = %(number)s", engine, params={"number": station_id})
#     df['last_update_date'] = pd.to_datetime(df.last_update, unit='s')
#     df.set_index('last_update_date', inplace=True)
#     res = df['available_bike_stands'].resample('1h').mean()
#     res = res.fillna(value=0)
#     return jsonify(data=json.dumps(list(zip(map(lambda x: x.isoformat(), res.index), res.values))))
 
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

                  


if __name__ == '__main__':
    app.run(debug=True)

