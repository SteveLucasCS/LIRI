require('dotenv').config();
const Keys = require('./keys.js');
const Axios = require('axios');
const Moment = require('moment');
const Spotify = require('node-spotify-api');
const Inquirer = require('inquirer');
const fs = require('fs');
const spotify = new Spotify(Keys.spotify);

function songSearch(songName) {
  spotify
    .search({
      type: 'track',
      query: songName
    })
    .then(function(data) {
      try {
        fs.writeFileSync('results.json', JSON.stringify(response.data, null, 2));
      } catch (e) {
        console.log(e);
      }
    })
    .catch(function(err) {
      console.error('Error occurred: ' + err);
    });
}

function songPrompt() {
  Inquirer
    .prompt({
      type: 'input',
      message: 'Enter a song name: ',
      name: 'name'
    }).then(function(input) {
      if (input.songName === "" || input.name === undefined) {
        console.log('Invalid Input: Song Name');
      } else {
        songSearch(input.name);
      }
    });
}

function movieSearch(movieName) {
  Axios({
    method: 'GET',
    url: `http://www.omdbapi.com/?apikey=${Keys.omdb.id}&t=${movieName}`
  }).then(function(response) {
    try {
      fs.writeFileSync('results.json', JSON.stringify(response.data, null, 2));
    } catch (e) {
      console.log(e);
    }
  });
}

function moviePrompt() {
  Inquirer
    .prompt({
      type: 'input',
      message: 'Enter a movie name: ',
      name: 'name'
    }).then(function(input) {
      if (input.songName === "" || input.name === undefined) {
        console.log('Invalid Input: Movie Name');
      } else {
        movieSearch(input.name);
      }
    });
}

function bandSearch(bandName) {
  Axios({
    method: 'GET',
    url: `https://rest.bandsintown.com/artists/${bandName}?app_id=${Keys.bands.id}`
  }).then(function(response) {
    try {
      if (response.data.upcoming_event_count === 0) {
        console.log(`${bandName} has no upcoming events.`);
      } else {
        bandEvents(bandName);
      }
      fs.writeFileSync('results.json', JSON.stringify(response.data, null, 2));
    } catch (e) {
      console.log(e);
    }
  });
}

function bandEvents(bandName) {
  Axios({
    method: 'GET',
    url: `https://rest.bandsintown.com/artists/${bandName}/events?app_id=${Keys.bands.id}`
  }).then(function(response) {
    try {
      // index of the current event being 'browsed'
      var i = 0;
      var exitLoop = false;

      function displayVenuInfo(current) {
        console.log(`Venue: ${current.venue.name}`);
        console.log(`Lineup: ${current.lineup.splice(0).join(", ")}`);
        console.log(`Location: ${current.venue.city}, ${current.venue.region}, ${current.venue.country}`);
        console.log(`Date: ${current.datetime}`);
        fs.appendFileSync('events.json', JSON.stringify(current.data, null, 2));
      }
      displayVenuInfo(response.data[i]);
    } catch (e) {
      console.log(e);
    }
  });
}

function bandPrompt() {
  Inquirer
    .prompt({
      type: 'input',
      message: 'Enter a band or artist name: ',
      name: 'name'
    }).then(function(input) {
      if (input.songName === "" || input.name === undefined) {
        console.log('Invalid Input: Band Name');
      } else {
        bandSearch(input.name);
      }
    });
}

/****************************** Main Functionality *****************************/
Inquirer
  .prompt([
    // Here we create a basic text prompt.
    {
      type: 'list',
      message: 'What knowledge do you seek?',
      choices: [
        'Song Information',
        'Band or Artist Information',
        'Movie Information'
      ],
      name: 'action'
    }
  ]).then(function(input) {
    switch (input.action) {
      case 'Song Information':
        songPrompt();
        break;

      case 'Band or Artist Information':
        bandPrompt();
        break;

      case 'Movie Information':
        moviePrompt();
        break;

      default:
        console.log('Invalid Input');
        break;
    }
  });