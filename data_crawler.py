#!/usr/bin/env python
# coding: utf-8

import sqlalchemy as sqla
from sqlalchemy import create_engine
from sqlalchemy import inspect
import traceback
import glob
import os
from pprint import pprint
import simplejson as json
import requests
import time
import pandas as pd
import datetime
from IPython.display import display

#JCdeaux api
APIKEY=" "
NAME="Dublin"
STATIONS="https://api.jcdecaux.com/vls/v1/stations"
#weather api
api_key = ''
#current data
url = f'http://api.openweathermap.org/data/2.5/weather?q=Dublin,ie&&appid={api_key}'
#forecast data
url2 = f'http://api.openweathermap.org/data/2.5/forecast?q=Dublin,ie&&appid={api_key}'

if not os.path.exists("data"):
    os.makedirs("data")

from sqlalchemy import create_engine
engine = create_engine('mysql+mysqlconnector://admin:@dbike..us-east-1.rds.amazonaws.com:3306/dbikes') 

# Create the dbikes database if it does not exist
sql = """
CREATE DATABASE IF NOT EXISTS dbikes;
"""
engine.execute(sql)

# Create the station table
sql = """
CREATE TABLE IF NOT EXISTS station (
address VARCHAR(256),
banking INTEGER,
bike_stands INTEGER,
bonus INTEGER,
contract_name VARCHAR(256),
name VARCHAR(256),
number INTEGER PRIMARY KEY,
position_lat REAL,
position_lng REAL,
status VARCHAR(256)
)
"""
try:
	res = engine.execute("DROP TABLE IF EXISTS station")
	res = engine.execute(sql)
	# print (res.fetchall())
except Exception as e:
	print(e)

# Define a function to create a new availability table every week
def create_availability_table():	
	table_name = "availability"
	sql = """
	CREATE TABLE IF NOT EXISTS {} (
	number INTEGER,
	available_bikes INTEGER,
	available_bike_stands INTEGER, 
	last_update BIGINT
	)
	""".format(table_name)
	try:
		res = engine.execute(sql)
		print (res.fetchall())
	except Exception as e:
		print(e) #, traceback.format_exc())
		
	return table_name

# Create the first availability table
create_availability_table()

def create_weather_table():
	# Create the weather table
	sql = """
	CREATE TABLE IF NOT EXISTS weather (
	id INTEGER,
	timestamp BIGINT,
	temperature REAL,
	humidity INTEGER,
	wind_speed REAL,
	wind_deg REAL,
	clouds INTEGER,
	main VARCHAR(256),
	description VARCHAR(256),
	visibility REAL,
	rain REAL,
	snow REAL
	)
	"""
	try:
		res = engine.execute(sql)
		print(res.fetchall())
	except Exception as e:
		print(e)
        
create_weather_table()

# Define a function to insert data into the availability table
def availability_to_db(text):
	availability = json.loads(text) 
	# print(type(availability), len(availability))

	for a in availability:
		# print (a)
		vals = (a.get('number'), a.get('available_bikes'), a.get('available_bike_stands'), a.get('last_update')/1000)
		sql = "INSERT INTO availability VALUES(%s, %s, %s, %s)"
		engine.execute(sql, vals)

	return
	
    
# Write the API response to a file with a filename based on the current date and time
def write_to_file(text, now):
	with open("data/bikes_{}".format(now).replace(" ", "_"), "w") as f:
		f.write(text)

# Write station data to database    
def stations_to_db(text):
	inspector = inspect(engine)
	stations = json.loads(text) 
	# print(type(stations), len(stations))

	if inspector.has_table('station'):
		sql = "SELECT number FROM station"
		existing_stations = pd.read_sql_query(sql, engine)	

        # Insert the new stations
		for station in stations:
			vals = (station.get('address'), int(station.get('banking')), station.get('bike_stands'), int(station.get('bonus')), station.get('contract_name'), station.get('name'), station.get('number'), station.get('position').get('lat'), station.get('position').get('lng'), station.get('status'))
			sql = "INSERT INTO station VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE address=VALUES(address), banking=VALUES(banking), bike_stands=VALUES(bike_stands), bonus=VALUES(bonus), contract_name=VALUES(contract_name), name=VALUES(name), position_lat=VALUES(position_lat), position_lng=VALUES(position_lng), status=VALUES(status)"
			engine.execute(sql, vals)
	else:
        # Insert all stations if the station table does not exist
		for station in stations:
		# print (station)
			vals = (station.get('address'), int(station.get('banking')), station.get('bike_stands'), int(station.get('bonus')), station.get('contract_name'), station.get('name'),station.get('number'),station.get('position').get('lat'), station.get('position').get('lng'), station.get('status'))
			engine.execute("insert into station values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", vals)
	return
	
def weather_to_db(text):
	data = json.loads(text)

	weather_id = data["weather"][0]["id"]
	timestamp = data["dt"]
	temperature = data["main"]["temp"]
	humidity = data["main"]["humidity"]
	wind_speed = data["wind"]["speed"]
	wind_deg = data["wind"]["deg"]
	clouds = data["clouds"]["all"]
	main = data["weather"][0]["main"]
	description = data["weather"][0]["description"]
	visibility = data["visibility"]
	try:
		rain = data["rain"]["1h"]
	except KeyError:
		rain = 0
	try:
		snow = data["snow"]["1h"]
	except KeyError:
		snow = 0

	# Insert data into "weather" table
	sql = """
	INSERT INTO weather (id, timestamp, temperature, humidity, wind_speed, wind_deg, clouds, main, description, visibility, rain, snow)
	VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
	"""
	values = (weather_id, timestamp, temperature, humidity, wind_speed, wind_deg, clouds, main, description, visibility, rain, snow)
	engine.execute(sql, values)
    
	return
    
    
    
# Define a function to periodically fetch data and write it to file and database
def fetch_data():
	while True:
		try:
			now = datetime.datetime.now()
			r = requests.get(STATIONS, params={"apiKey": APIKEY, "contract": NAME})
			wr = requests.get(url)
			# print(r, now)
			# write_to_file(r.text, now)
			availability_to_db(r.text)
			stations_to_db(r.text)
			weather_to_db(wr.text)
            
			time.sleep(5*60) # Fetch data every 5 minutes
		except:
			print(traceback.format_exc())
			if engine is None:
				pass
	return



fetch_data()





