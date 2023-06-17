require.config({
    baseUrl: "/js",
    waitSeconds: 10,
    enforceDefine: true,
    urlArgs: "",  /* remove cache buster for all other .js below */
    paths: {
        "jquery": [
            "https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min",
            "https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min",
            "jquery-2.1.3.min"
        ]
    }
});

define(['logs'], function() {
});