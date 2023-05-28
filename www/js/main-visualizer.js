require.config({
    baseUrl: "/js",
    waitSeconds: 10,
    enforceDefine: true,
    urlArgs: "",  /* remove cache buster for all other .js below */
    paths: {
        "jquery": [
            /* on one occasion, somehow google's cdn didn't work properly 
             * even when visiting the url showed the correct code.  
             * I put cloudflare's cdn instead and then the page loaded. How odd */
            "https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min",
            "https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min",
            "jquery-2.1.3.min"
        ],
        "jqueryui": [
            "https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/jquery-ui.min",
            "https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.11.3/jquery-ui.min",
            "jquery-ui-1.11.3.min"
        ],
        
        //old value used pre-4/26/16  "io": "https://cdn.socket.io/socket.io-1.3.5"
        "io": [
            "https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.4.5/socket.io.min",
            "socket.io-1.4.5.min"
        ]
    }
});

/*
 * 'define' used to be 'require', but enforceDefine was required to allow backup paths for jquery etc,
 * and this in turn requires define here apparently
 */
define(['visualizer'], function() {
});