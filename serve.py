#Created these files following the tutorial in https://maxhalford.github.io/blog/bike-stations/
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run()