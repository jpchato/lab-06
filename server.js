'use strict';

const express = require('express');
const app = express();

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
    errorHandler('Error')
  }
});


app.get('/weather', (request, response) =>{
  try {let weather = [];
  let day = require('./data/darksky.json');
  day.daily.data.forEach(forecast => {
    weather.push(new Weather (forecast));
  });
  response.status(200).json(weather);
  // response.send(weather);
  } catch(err){
    errorHandler('Error')
  }
});

function Location(obj, city){
  this.search_query = city;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

function Weather(obj) {
  this.forecast = obj.summary;
  this.time = new Date(obj.time).toDateString();
}
// need to make a fucntion that is an error handler. When something goes wrong it will call the function. 
// app.get('*', (request, response) => {
//   response.status(404).send('404 error');
// });

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});

function errorHandler(str, res) {
  res.status(500).send(str);
}