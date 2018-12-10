# LIRI
Allows user to search for songs, movies, and bands in town

## User Experience
LIRI users have several options when it comes to how they use the program.
### CLI
* Users can input a command, _with or without_ a search parameter, in the command line as call liri.

1. Entering this in the CLI will search for the song 'what about now'
  ```
  node liri.js spotify-this-song what about now
  ```
  * Output:
  ```
  What About Now
    Artist: Daughtry
    Album: Daughtry
    Released: Tuesday, November 21st, 2006
    Spotify Web Player Link:
      https://open.spotify.com/track/07dtD7iciEL7vHqATMxg3V
  ```
2. Entering a command _without_ a search string will bring the user to the related search prompt
  ```
  node liri.js spotify-this-song
  ```
  * Output:
  ```
  ? Enter a Song Name: 
  ```

3. Commands from a file
  * Users can run commands that are saved in a text file by entering the command 'do-what-it-says' (or 'from file') in the CLI
  * For example, the file 'random.txt' contains the text:
    ```
    spotify-this-song,"I Want it That Way"
    ```
  * CLI input (random.txt is the default filename, but any filename can be specified by entering after 'do-what-it-says')
  ```
  node liri.js do-what-it-says
  ```
  Output:
  ```
  I Want It That Way
    Artist: The Backstreet Boys
    Album: The Hits--Chapter One
    Released: Tuesday, October 23rd, 2001
    Spotify Web Player Link:
      https://open.spotify.com/track/07dtD7iciEL7vHqATMxg3V
  ```

### Main Menu / Prompts
* Running the program without any parameters will bring the user to the main menu, prompting them with options.
  ```
  node liri.js
  ```
  Output:
  ```
  ? What Knowledge Do You Seek?
    Song Information
    Band/Artist Upcoming Venues
    Movie Information
    Exit
  ```
* Selecting a function will prompt the user to enter a search string, and then display the results.

## Information Output
* Specific important information for results is output to the terminal window.
* All information for a result is a saved a text file, with each type of search appending results to their own file.
  * File output is not overwitten by new results, so a user can easily go back and see any information they'd like about past searches.

## Error Handling and Input Validation
The program will never crash because of user input, and any searches with no results will notify the user that they found no results, and prompt the user to either enter another search term, return to the main menu, or exit. This prevents the user from being frustrated with crashes, or confused because it returned a random song when their search yielded no results.

### User Convenience
* If the user searches for a song name that is shared by multiple different songs and artists, they can refine their search by song name and artist name.

* If the user searches for an artist's venues but they have no upcoming events, it notifies the user that the artist has no upcoming events. This is a completely seperate message than the 'No Results Found' message a user receives if they enter an artist name that doesn't seem to exist.

* When using CLI arguments to issue commands to liri, there are several accepted strings for each command that would be commom sense wording for the user. For example,
```
node liri.js song-search
node liri.js spotify-this-song
node liri.js search-song
```
all issue the same command to the application.

* CLI search parameters accept spaces between words for user convenience.
```
node liri.js spotify-this-song 'what about now'
```
Acts the same as
```
node liri.js song-search what about now
```

### Error Logging
* Errors thrown by the application are logged and sent to the developer (with no information about the client/user).
  * This notifies the developer when an API key expires, as well as allows them to correct and unforseen problems.
