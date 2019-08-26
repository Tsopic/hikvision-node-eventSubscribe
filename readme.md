## Hikvision event subscriber

This is very raw library, feel free to use it and send pull requests and make it suitable for NPM

# This library will solve the problem with catching Hikvision Camera events

Supported events:
* AlarmLocal - Local IO alarm
* VideoMotion - Capture Video motion event
* LineDetection - Capture Line crossing event
* VideoLoss - Capture Video loss event
* VideoBlind - Capture video blind event
* start - Recording start event
* stop - Recording stop event

# Main features of the library

Emits
* Hikvision alarms
* Connection errors
* On connect event

## Quickstart

1. Clone repo
2. Copy config.json.example to config.json `cp config.json.example config.json`
3. `npm install`
4. `node index.js`

# Recompile Typescript
1. `npm install -g typescript`
2. run command `tsc` this will compile your code to dist directory


### Sample usage

``` 
const { CameraEventHandler } = require('./dist/cameraEventHandler');
const Events = require("events");
const config = require("./config.json");

const cam = new CameraEventHandler(config.host, config.port, config.user, config.password);

cam.on("error", function(err){
    console.log("error", err);
})

cam.on("connect", function(){
    console.log("connected")
})

cam.on("alarm", function(code, action, index){
    console.log("alarm tirggered", [code, action, index]);
})

```
