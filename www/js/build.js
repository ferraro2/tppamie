/*
 * to build (windows): in js directory, run
 *      r.js.cmd -o .\build.js
 */

({
    appDir:"../",
    baseUrl:"js",
    dir: "../../www-build",
    keepBuildDir: true, // so it doesn't take 5 minutes to copy the gifs over every time
    paths: {
        jquery: "empty:",
        jqueryui: "empty:",
        io: "empty:"
    },
    //fileExclusionRegExp: /.gif$|.png$|.jpeg$|.jpg$|.bmp$/,
    modules: [
        {
            name: "main-visualizer"
        },
        {
            name: "main-logs"
        }
    ]
});