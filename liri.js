require('dotenv').config();
const keys = require('./keys.js');
const nodemailer = require('nodemailer');
const axios = require('axios');
const moment = require('moment');
const Spotify = require('node-spotify-api');
const inquirer = require('inquirer');
const fs = require('fs');
const spotify = new Spotify(keys.spotify);

/** Array of any error objects */
var errorLog = [];

function Error(source, code, message) {
  this.source = source;
  this.code = code;
  this.message = message;
}

function sendErrorLog() {
  /* Source: https://www.w3schools.com/nodejs/nodejs_email.asp 
   * and https://nodemailer.com/about/ 
   * Why? experimenting with throwing errors, and I want to see
   * error logs that any users create
   */

  var logText;
  try {
    logText = JSON.stringify(errorLog, null, 1);
  } catch (e) {
    console.log(e);
  }

  try {
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: keys.mailer.user,
        pass: keys.mailer.password
      }
    });

    var mailOptions = {
      from: keys.mailer.from,
      to: keys.mailer.to,
      subject: 'Liri - Error Log',
      text: logText
    };
  } catch (e) {}

  transporter.sendMail(mailOptions, function(error, info) {});
}

function songSearch(songName) {
  spotify
    .search({
      type: 'track',
      query: songName,
      offset: '0',
      limit: '1'
    })
    .then(function(response) {
      if (response.tracks.items[0] === undefined) {
        console.log('\nSorry, No Results Found.\n');
        inquirer
          .prompt({
            type: 'list',
            message: 'Options:',
            choices: ['Search Again', 'Main Menu', 'Exit'],
            name: 'next'
          }).then(function(input) {
            switch (input.next) {
              case 'Search Again':
                songPrompt();
                break;

              case 'Main Menu':
                mainMenu();
                break;

              default:
                onExit();
                break;
            }
          });
      } else {
        displaySongInfo(response.tracks.items[0]);
        console.log('\n');
        inquirer
          .prompt({
            type: 'list',
            message: 'Options:',
            choices: [
              'Refine Search with Song and Artist',
              'Main Menu',
              'Exit'
            ],
            name: 'next'
          }).then(function(input) {
            switch (input.next) {
              case 'Refine Search with Song and Artist':
                console.clear();
                inquirer
                  .prompt([{
                      type: 'input',
                      message: 'Enter the Song Name: ',
                      name: 'songName'
                    },
                    {
                      type: 'input',
                      message: 'Enter Artist Name: ',
                      name: 'artistName'
                    }
                  ]).then(function(input) {
                    spotify
                      .search({
                        type: 'track',
                        query: input.songName,
                        offset: '0',
                        limit: '20'
                      })
                      .then(function(response) {
                        var matchFound = false;
                        // iterate through until finding a result with a matching artist
                        var i = 0;
                        var track;
                        while (i < response.tracks.items.length &&
                          matchFound === false) {
                          // check every artist of every result
                          for (
                            var a = 0; a < response.tracks.items[i]
                            .artists.length; a++
                          ) {
                            let aName = response.tracks.items[i].
                            artists[a].name.toLowerCase();
                            if (aName === input.artistName.toLowerCase()) {
                              matchFound = true;
                              track = response.tracks.items[i];
                            }
                          }
                          i++;
                        }
                        switch (matchFound) {
                          case true:
                            displaySongInfo(track);
                            console.log('\n');
                            inquirer
                              .prompt({
                                type: 'list',
                                message: 'Options:',
                                choices: ['Main Menu', 'Exit'],
                                name: 'next'
                              }).then(function(input) {
                                switch (input.next) {
                                  case 'Main Menu':
                                    mainMenu();
                                    break;

                                  default:
                                    onExit();
                                    break;
                                }
                              });
                            break;

                          default:
                            console.log('\n');
                            inquirer
                              .prompt([{
                                type: 'list',
                                message: 'Sorry, no results ' +
                                  'for ' + input.songName +
                                  ' by ' + input.artistName,
                                choices: ['Main Menu', 'Exit'],
                                name: 'next'
                              }]).then(function(input) {
                                switch (input.next) {
                                  case 'Main Menu':
                                    mainMenu();
                                    break;

                                  default:
                                    onExit();
                                    break;
                                }
                              });
                            break;
                        }
                      });
                  });
                break;
              case 'Main Menu':
                mainMenu();
                break;

              default:
                onExit();
                break;
            }
          });
      }
    }).catch(function(e) {
      if (e.statusCode == 400) {
        console.log('\nSorry, the database cannot be accessed right now. Please try again later.');
        errorLog.push(new Error('searchSong', '400', 'Spotify API Key Failed'));
      } else {
        console.log('\nSorry, No Results Found.\n');
      }
      inquirer
        .prompt({
          type: 'list',
          message: 'Options:',
          choices: ['Search Again', 'Main Menu', 'Exit'],
          name: 'next'
        }).then(function(input) {
          switch (input.next) {
            case 'Search Again':
              songPrompt();
              break;

            case 'Main Menu':
              mainMenu();
              break;

            default:
              onExit();
              break;
          }
        });
    });
}

function displaySongInfo(track) {

  fs.appendFile('songResults.txt', JSON.stringify(track, null, 1), function(e) {
    if (e) {
      console.log(e);
      errorLog.push('displayVenueInfo', '', e);
    }
  });
  try {
    var song = track.name;
    var artist = track.artists[0].name;
    var album = track.album.name;
    var released = moment(track.album.release_date, 'YYYY-MM-DD');
    released = released.format('dddd, MMMM Do YYYY');
    var link = track.external_urls.spotify;
    console.log('\n');
    console.log(
      `${song}
    Artist: ${artist}
    Album: ${album}
    Released: ${released}
    Spotify Webplayer Link:
      ${link}`
    );
  } catch (e) {
    errorLog.push('displaySongInfo', '', e);
  }
}

function songPrompt() {
  console.clear();
  inquirer
    .prompt({
      type: 'input',
      message: 'Enter a Song Name: ',
      name: 'name'
    }).then(function(input) {
      if (input.name === '' || input.name === undefined) {
        console.log('Invalid Input: Song Name');
        songPrompt();
      } else {
        songSearch(input.name);
      }
    });
}

function movieSearch(movieName) {
  axios({
    method: 'GET',
    url: `http://www.omdbapi.com/?apikey=${keys.omdb.id}&t=${movieName}`
  }).then(function(response) {
    if (response.data.Response === 'False') {
      console.log('\n');
      console.log(response.data.Error);
    } else {
      displayMovieInfo(response.data);
    }
    inquirer.prompt({
      type: 'list',
      message: 'Options: ',
      choices: ['Search Again', 'Main Menu', 'Exit'],
      name: 'next'
    }).then(function(input) {
      switch (input.next) {
        case 'Search Again':
          moviePrompt();
          break;

        case 'Main Menu':
          mainMenu();
          break;

        default:
          onExit();
          break;
      }
    });
  }).catch(function(e) {

    if (e.response !== undefined) {
      switch (e.response.status) {
        // Invalid API key
        case 401:
          console.log('Sorry, the database cannot be accessed at this time. Please try again later.');
          break;

        default:
          console.log(`An Unkown Error has occured:`);
          try {
            errorLog.push(new Error('movieSearch', e.response.status, e.response.statusText));
          } catch (e) {
            errorLog.push(new Error('movieSearch', '', e.response));
          }
          break;
      }
    } else {
      errorLog.push(new Error('movieSearch', '', e));
    }
  });
}

function displayMovieInfo(movie) {
  fs.appendFile('movieResults.txt', JSON.stringify(movie, null, 1), function(e) {
    if (e) {
      console.log(e);
      errorLog.push('displayVenueInfo', '', e);
    }
  });
  try {
    var released = moment(movie.Released, 'DD MMM YYYY');
    released = released.format('MM/DD/YYYY');
    console.log(
      `  ${movie.Title}
    Rated: ${movie.Rated}
    Released: ${released}
    Reviews:
  `);
    for (var i = 0; i < movie.Ratings.length; i++) {
      console.log(`    ${movie.Ratings[i].Source}: ${movie.Ratings[i].Value}`);
    }
    console.log(`
    Starring Actors: ${movie.Actors}
    Writers: ${movie.Writer}
    Director: ${movie.Director}

    Plot: ${movie.Plot}

    Country of Origin: ${movie.Country}
    Language: ${movie.Language}
  `);
  } catch (e) {
    console.log('An error occured when trying to display movie results.');
    errorLog.push(new Error('displayMovieInfo', '', e));
  }
}

function moviePrompt() {
  console.clear();
  inquirer
    .prompt({
      type: 'input',
      message: 'Enter a movie name: ',
      name: 'name'
    }).then(function(input) {
      if (input.name === "" || input.name === undefined) {
        console.log('Invalid Input: Movie Name');
        moviePrompt();
      } else {
        movieSearch(input.name);
      }
    });
}

function bandSearch(bandName) {
  axios({
    method: 'GET',
    url: `https://rest.bandsintown.com/artists/${bandName}?app_id=${keys.bands.id}`
  }).then(function(response) {
    try {
      if (response.data.upcoming_event_count === 0) {
        console.log(`${bandName} has no upcoming events.`);
        console.log('\n');
        inquirer
          .prompt({
            type: 'list',
            message: 'Options:',
            choices: ['Search Again', 'Main Menu', 'Exit'],
            name: 'next'
          }).then(function(input) {
            switch (input.next) {
              case 'Search Again':
                bandPrompt();
                break;

              case 'Main Menu':
                mainMenu();
                break;

              default:
                onExit();
                break;
            }
          });
      } else if (response.data.upcoming_event_count > 0) {
        bandEvents(bandName);
      } else {
        console.log(`No Results Found.`);
        console.log('\n');
        inquirer
          .prompt({
            type: 'list',
            message: 'Options:',
            choices: ['Search Again', 'Main Menu', 'Exit'],
            name: 'next'
          }).then(function(input) {
            switch (input.next) {
              case 'Search Again':
                bandPrompt();
                break;

              case 'Main Menu':
                mainMenu();
                break;

              default:
                onExit();
                break;
            }
          });
      }
    } catch (e) {
      console.log(e);
      errorLog.push(new Error('bandSearch', '', e));
    }
  });
}

function bandEvents(bandName) {
  axios({
    method: 'GET',
    url: `https://rest.bandsintown.com/artists/${bandName}/events?app_id=${keys.bands.id}`
  }).then(function(response) {
    function getStates(data) {
      var allStates = [];
      var output = [];
      data.forEach(function(event) {
        // canadian locations don't have regions, only city
        if (event.venue.region === "") {
          allStates.push(event.venue.city);
        } else {
          allStates.push(event.venue.region);
        }
      });
      allStates.forEach(function(state) {
        if (output.indexOf(state) === -1) {
          output.push(state);
        }
      });
      output = output.sort();
      return output;
    }

    function chooseState(response) {
      try {
        console.clear();
        inquirer
          .prompt({
            type: 'list',
            message: `Select a state/region to view its upcoming ${bandName} venues:`,
            choices: getStates(response.data),
            name: 'region'
          }).then(function(input) {
            response.data.forEach(function(event) {
              if (event.venue.region === input.region || event.venue.city === input.region) {
                displayVenueInfo(event);
              }
            });
            console.log('\n');
            inquirer
              .prompt({
                type: 'list',
                message: 'Options:',
                choices: ['Back', 'Main Menu', 'Exit'],
                name: 'next'
              }).then(function(input) {
                switch (input.next) {
                  case 'Back':
                    chooseState(response);
                    break;

                  case 'Main Menu':
                    mainMenu();
                    break;

                  default:
                    onExit();
                    break;
                }
              });
          });
      } catch (e) {
        errorLog.push(new Error('chooseState', '', e));
      }
    }
    chooseState(response);
  });
}

function displayVenueInfo(current) {
  fs.appendFile('eventResults.txt', JSON.stringify(current, null, 1), function(e) {
    if (e) {
      console.log(e);
      errorLog.push('displayVenueInfo', '', e);
    }
  });
  try {
    var dt = current.datetime;
    dt = dt.split('T');
    var date = dt[0];
    var time = dt[1];
    date = moment(date, 'YYYY-MM-DD');
    date = date.format('MM/DD/YYYY');
    time = moment(time, 'HH:mm:ss');
    time = time.format('LT');

    console.log('\n');
    console.log(`Venue: ${current.venue.name}`);
    console.log(`Lineup: ${current.lineup.splice(0).join(", ")}`);
    console.log(`Location: ${current.venue.city}, ${current.venue.region}, ${current.venue.country}`);
    console.log(`Date: ${date}`);
    console.log(`Time: ${time}`);
  } catch (e) {
    console.log(e);
    errorLog.push('displayVenueInfo', '', e);
  }
}

function bandPrompt() {
  console.clear();
  inquirer
    .prompt({
      type: 'input',
      message: 'Enter a Band or Artist name: ',
      name: 'name'
    }).then(function(input) {
      if (input.name === "" || input.name === undefined) {
        console.log('Invalid Input: Band Name');
        bandPrompt();
      } else {
        bandSearch(input.name);
      }
    });
}

function fromFile (filename) {
  console.log('Searching...');
  try {
    var data = fs.readFileSync(filename, 'utf8')
    data = data.split(',');
    var command = data[0].replace(/\s/g, '');
    var param = data[1];
    fromArguments(command, param);
  } catch (e) {
    console.log(`Could not parse file '${filename}.`);
    console.log(e);
    errorLog.push((new Error('fromFile', '', e)));
  }
}



function mainMenu() {
  console.clear();
  inquirer
    .prompt([
      // Here we create a basic text prompt.
      {
        type: 'list',
        message: 'What Knowledge Do You Seek?',
        choices: [
          'Song Information',
          'Band/Artist Upcoming Venues',
          'Movie Information',
          'Exit'
        ],
        name: 'action'
      }
    ]).then(function(input) {
      switch (input.action) {
        case 'Band/Artist Upcoming Venues':
          bandPrompt();
          break;

        case 'Song Information':
          songPrompt();
          break;

        case 'Movie Information':
          moviePrompt();
          break;

        default:
          onExit();
          break;
      }
    });
}

function onExit() {
  console.log('Thank you for using Liri!');
  console.log(`'Better than Siri, but that's not hard.'`);
  if (errorLog.length > 0) {
    sendErrorLog();
  }
}

function fromArguments(command, param) {
  switch (command) {
    case 'spotify this song':
    case 'spotify-this-song':
    case 'spotifythissong':
    case 'search song':
    case 'search-song':
    case 'searchsong':
    case 'song-search':
    case 'song search':
    case 'songsearch':
      switch (param) {
        case null:
        case undefined:
        case '':
          songPrompt();
          break;
        default:
          songSearch(param);
          break;
      }
      break;
    case 'band search':
    case 'band-search':
    case 'bandsearch':
    case 'concert-search':
    case 'concert search':
    case 'concertsearch':
    case 'concert this':
    case 'concert-this':
    case 'concertthis':
      switch (param) {
        case null:
        case undefined:
        case '':
          bandPrompt();
          break;
        default:
          bandSearch(param);
          break;
      }
      break;
    case 'movie this':
    case 'movie-this':
    case 'moviethis':
    case 'search movie':
    case 'search-movie':
    case 'searchmovie':
    case 'movie-search':
    case 'movie search':
    case 'moviesearch':
      switch (param) {
        case null:
        case undefined:
        case '':
          moviePrompt();
          break;
        default:
          movieSearch(param);
          break;
      }
      break;
    case 'do what it says':
    case 'do-what-it-says':
    case 'dowhatitsays':
    case 'from file':
    case 'from-file':
    case 'fromfile':
    case 'from text':
    case 'from-text':
    case 'fromtext':
      switch (param) {
        case null:
        case undefined:
        case '':
          fromFile('random.txt');
          break;
        default:
          fromFile(param);
          break;
      }
      break;
    default:
      mainMenu();
      break;
  }
}

/****************** Main Driver Functionality ******************/
//Check for process arguments on initialization
if (process.argv.length > 2) {
  var command = process.argv[2];
  var param = process.argv[3];
  if (process.argv.length > 3) {
    for (let i = 4; i < process.argv.length; i++) {
      param = param.concat(' ', process.argv[i]);
    }
  }
  try {
    command = command.toLowerCase();
  } catch (e) {
    param = process.argv[2];
  }
  try {
    param = param.toLowerCase();
  } catch (e) {
    param = process.argv[3];
  };
  fromArguments(command, param);
} else {
  mainMenu();
}