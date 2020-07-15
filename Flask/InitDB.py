# Dependencies
import pandas as pd
import os
from pymongo import MongoClient

def initDB():
    
    print(os.environ.get('MONGODB_URI', ''))
    print("it work?")
    # Connect to MongoDB
    client = MongoClient(os.environ.get('MONGODB_URI', ''))

    # Create database and collection
    db = client['Olympics']
    collection = db['SportsEventsAndMedals']
   
    if(collection.count() == 0 ):
        olympic_data = pd.read_csv("Olympics.SportsEventsAndMedals.csv")

        # Convert dataFrame into a dictionary
        olympic_data_dict = olympic_data.to_dict("records")
        
        # Insert collection
        collection.insert_many(olympic_data_dict)

