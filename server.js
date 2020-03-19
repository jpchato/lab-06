'use strict';

// Requirements
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config();

// Common variables
const app = express();
const PORT = process.env.PORT || 3001;

//CORS allows server to pass data to front-end
app.use(cors());

// connect to the database
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err))

// only turn on the server if you connect to the database
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  })


//routes
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailHandler)

//functions
function locationHandler(request, response){
  let city = request.query.city;
  let key = process.env.GEOCODE_API_KEY;
  let url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`
  superagent.get(url)
  .then(data => {
    let geoData = data.body[0]
    let location = new Location(city, geoData);
    response.status(200).send(location);
  })
  .catch(() => errorHandler('LocationError', response))
  }


// app.get('/location', (request, response) =>{
//   try{
//     let city = request.query.city;
//     console.log(city);
//     let geo = require('./data/geo.json');
//     let location = new Location(geo[0], city);
//     response.send(location);
//   }
//   catch(err){
//     errorHandler('Error')
//   }
// });

function weatherHandler(request, response) {
  const key = process.env.WEATHER_API_KEY;
  const lat = request.query.latitude;
  const lon = request.query.longitude;
  const url = `https://api.darksky.net/forecast/${key}/${lat},${lon}`;
  superagent.get(url)
    .then(data => {
      const weatherData = data.body.daily.data;
      const dailyWeather = weatherData.map(day => new Weather(day));
      response.status(200).send(dailyWeather);
    })
    .catch(() => errorHandler('Weather Error', response));
}


function trailHandler (request, response) {
  const key = process.env.TRAIL_API_KEY;

}

//create constructor function for trails



// app.get('/weather', (request, response) =>{
//   try {
//   let day = require('./data/darksky.json');
//   let dailyWeather = day.daily.data;
//   response.status(200).send(dailyWeather.map(day => new Weather(day)));

//   } catch(err){
//     errorHandler('Error', response)
//   }
// });

// this info goes into schema.sql as well
function Location(city, localData){
  this.search_query = city;
  this.formatted_query = localData.display_name;
  this.latitude = localData.lat;
  this.longitude = localData.lon;
}

function Weather(dailyForecast) {
  this.forecast = dailyForecast.summary;
  this.time = new Date(dailyForecast.time*1000).toString().slice(0, 15);
}

function errorHandler(str, res) {
  res.status(500).send(str);
}

// need to make a fucntion that is an error handler. When something goes wrong it will call the function. 
// 404 no page found
app.get('*', (request, response) => {
  response.status(404).send('404 error');
});