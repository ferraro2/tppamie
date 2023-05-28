This is the source for running the website currently live at https://www.tppamie.com/

These are rough instructions and there may be some mistakes.  

### Build website

You will need require.js.
```
cd www/js
r.js.cmd -o .\build.js
```

creates the directory `/www-build` with optimized/minified js. 

### Run socket.io server
Requires node.js.
Copy `auth_socketIO_example` to `auth_socketIO` and enter any password. Both the socket.io server and python will use the password in this file to authenticate pushing new match data.  
```
cd node
node index.js
```

### Run python script
Requires python 2.7 with packages yaml and socketIO.
Copy `oauth_example.json` to `oauth.json` and enter your twitch credentials. 
```
cd bot-liveMatchUpdater
python liveMatchUpdater.py
```