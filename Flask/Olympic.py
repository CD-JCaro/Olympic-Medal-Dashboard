# Dependencies
from flask import Flask, render_template, request, jsonify
import pymongo
from InitDB import initDB

initDB()

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
# http://127.0.0.1:5000/query?Year1=1944&Year2=2014&Country=All&Season=All&Sport=All&Medal=ALL
@app.route('/query')
def EventSearch():
    Year1 = request.args.get("Year1")
    Year2 = request.args.get("Year2")
    Country = request.args.get("Country")
    Season = request.args.get("Season")
    Event = request.args.get("Event")
    Sport = request.args.get("Sport")
    Medal = request.args.get("Medal")
    
    MyQuery = {}

    MyQuery.update({"Year":{"$gte": int(Year1),"$lte": int(Year2)}})

    if Season == "All":
        MyQuery.update({"Season":{"$in":["Summer","Winter"]}})
    else:
        MyQuery.update({"Season":Season})

    if Country != "All":
        MyQuery.update({"Country":Country})
                      
    if Sport != "All":
        MyQuery.update({"Sport": Sport})
        
    if Event != "All":
        MyQuery.update({"Event": Event})        

    if Medal == "All":
        MyQuery.update({"Medal":{"$in":["Gold","Silver","Bronze"]}})
    else:
        MyQuery.update({"Medal": Medal})
                    
    data = list(db.SportsEventsAndMedals.find(MyQuery))
    for item in data:
        del item["_id"]

    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)
