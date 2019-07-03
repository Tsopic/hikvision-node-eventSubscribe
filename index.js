const { CameraEventHandler } = require('./dist/cameraEventHandler');
const Events = require("events");
const config = require("./config.json");

const cam = new CameraEventHandler(config.host, config.port, config.user, config.password);

console.log("running script index")

cam.on("error", function(err){
    console.log("error", err);
})

cam.on("connect", function(){
    console.log("connected")
})

cam.on("event", function(){
    console.log("Got first event");
})

cam.on("alarm", function(code, action, index){
    console.log("alarm tirggered", [code, action, index]);
})