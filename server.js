'use strict';

const express = require('express');
const app = expres();

require('dotenv').config();

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3001;

app.get('/location', (request, response) =>{
  try{
    let city = request.query.city;
    console.log(city);
    let geo = require('./data/geo.json');
    let location = new Location(geo[0], city);
    response.send(location);
  }
  catch(err){
    console.log(err);
  }
})

function Location()

// "lat": "47.8278656",
//     "lon": "-122.3053932",
//     "display_name": "Lynnwood, Snohomish County, Washington, USA",
//     "class": "place",
//     "type": "city",
//     "importance": 0.61729106268039,
//     "icon": "https://locationiq.org/static/images/mapicons/poi_place_city.p.20.png"