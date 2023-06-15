This is the source for running the website currently live at https://www.tppamie.com/

These are rough instructions and there may be some mistakes.  


### Website
#### Build
You will need require.js.

    cd www/js
    r.js.cmd -o .\build.js

creates the directory `/www-build` with optimized/minified js. 

#### Direct visualizer to your local socket.io server & python script
Currently your website will use the socket.io server running at tppamie.com.  
To run your own socket.io server & python script instead, 
go to `www/js/visualizer.js` and toggle `var localSockOn = true;`


### Run socket.io server
This server provides live match updates for the visualizer via socket.io.  
Requires node.js.  
Copy `auth_socketIO_example` to `auth_socketIO` and enter any password. Both the socket.io server and python will use the password in this file to authenticate pushing new match data.  

    cd py2/node
    node index.js


### Run python script
This script runs indefinitely.  It:
- connects to twitchplayspokemon's twitch chat
- watches chat messages to know when a match is starting
- downloads match data from twitchplayspokemon.tv/api on match starts
- reformats the data
- emits the data to the socket.io server for transmission
- posts an in-chat message with the visualizer URL 

Requires python 2.7 with packages yaml and socketIO.  
Copy `config.example.json` to `config.json` and enter your twitch credentials. 

    cd bot-liveMatchUpdater
    python LiveMatchUpdater.py
