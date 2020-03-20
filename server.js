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
  // demo 3/19
  let sql = 'SELECT * FROM locations WHERE search_query=$1;';
  let safeValues = [city];
  client.query(sql, safeValues)
    .then(results => {
      // if the city we are searching for is in the database, it will be the first thing in the results.rows
      if(results.rows.length > 0){
        response.send(results.rows[0]);
        console.log(results.rows);
        console.log('I found data in the database');
      } else {
        // we need to go to an API
        let key = process.env.GEOCODE_API_KEY;
        let url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`
        superagent.get(url)
        .then(data => {
          let geoData = data.body[0]
          let location = new Location(city, geoData);
          response.status(200).send(location);
          let sql = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
          let safeValues = [city, location.formatted_query, location.latitude, location.longitude]
          client.query(sql, safeValues);
      })
        .catch(() => errorHandler('LocationError', response))
            }
      })
    };

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
  const latitude = request.query.latitude;
  const longitude = request.query.longitude;
  let urlTrail = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&maxDistance=10&key=${key}`;

  superagent.get(urlTrail)
    .then(superagentResults => {
      const theTrail = superagentResults.body.trails.map(trail => {
        return new Trail(trail)
      })
      response.status(200).send(theTrail);
    })
    .catch(err => console.error(err))

};

//create constructor function for trails
function Trail (obj) {
  this.name = obj.name;
  this.location = obj.location;
  this.stars = obj.stars;
  this.star_votes = obj.star_votes;
  this.summary = obj.summary;
  this.trail_url = obj.url;
  this.conditions = obj.conditionsStatus;
  this.condition_date = obj.conditionDate.slice(0,10);
  this.condition_time = obj.conditionDate.slice(11,19);
}



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
