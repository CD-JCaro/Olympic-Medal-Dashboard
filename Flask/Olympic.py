# Dependencies
from flask import Flask, render_template, request, jsonify
import pymongo

# Create an instance of our Flask app.
app = Flask(__name__)

# Connect to MongoDB
conn = 'mongodb://localhost:27017'

# Pass connection to the pymongo instance.
client = pymongo.MongoClient(conn)

# Connect to a database. Will create one if not already available.
db = client.Olympics

@app.route("/")
def home():
    return render_template("index.html")

# Queries MongoDB
#/1944/1948/United States/Summer/Aquatics/Gold/
# http://127.0.0.1:5000/query?Year1=1944&Year2=2014&Country=United%20States&Season=Summer&Sport=Aquatics&Medal=ALL

@app.route('/query')
def EventSearch():
    Year1 = request.args.get("Year1")
    Year2 = request.args.get("Year2")
    Country = request.args.get("Country")
    Season = request.args.get("Season")
    Sport = request.args.get("Sport")
    Medal = request.args.get("Medal")

    if Season == "Both":
        Season = ["Summer","Winter"]
    else:
        Season = [Season, Season]

    if Medal == "All":
        Medal = ["Gold","Silver","Bronze"]
    else:
        Medal = [Medal, Medal]
        
    data = list(db.SportsEventsAndMedals.find({
        "Season": {"$in": Season}, 
        "Country": Country,
        "Sport": Sport,
        "Year":{"$gte": int(Year1),"$lte": int(Year2)},
        "Medal" : {"$in": Medal}
    }))
    for item in data:
        del item["_id"]

    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)
