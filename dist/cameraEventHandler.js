"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var net = require("net");
var parseString = require("xml2js").parseString;
var Events = require("events");
class CameraEventHandler extends Events {
    constructor(ipAddress, port, username, password) {
        super();
        this.activeEvents = {};
        this.triggerActive = false;
        this.debug = true;
        this.ipAddress = "120.0.0.1";
        this.port = 80;
        this.username = "admin";
        this.password = "";
        this.ipAddress = ipAddress;
        this.port = port;
        this.username = username;
        this.password = password;
        this.activeEvents = {};
        this.connect();
        this.handleConnection = this.handleConnection.bind(this);
        this.handleEnd = this.handleEnd.bind(this);
        this.handleData = this.handleData.bind(this);
        this.handleError = this.handleError.bind(this);
    }
    connect() {
        var authHeader = "Authorization: Basic " + new Buffer(this.username + ":" + this.password).toString("base64");
        // Connect
        var client = net.connect(this.port, this.ipAddress, function () {
            var header = "GET /ISAPI/Event/notification/alertStream HTTP/1.1\r\n" +
                "Host: " +
                this.ipAddress +
                ":" +
                this.port +
                "\r\n" +
                authHeader +
                "\r\n" +
                "Accept: multipart/x-mixed-replace\r\n\r\n";
            client.write(header);
            client.setKeepAlive(true, 10000);
        });
        client.on("data", (data) => this.handleData(data));
        client.on("close", () => {
            // Try to reconnect after 30s
            setTimeout(() => this.connect(), 30000);
            this.handleEnd();
        });
        client.on("error", (err) => this.handleError(err));
    }
    // Handle alarms
    handleData(data) {
        var result;
        parseString(data, function (err, parsedResult) {
            if (err) {
                return err;
            }
            result = parsedResult;
        });
        if (result) {
            var code = result.EventNotificationAlert["eventType"][0];
            var action = result.EventNotificationAlert["eventState"][0];
            var index = parseInt(result.EventNotificationAlert["channelID"][0]);
            var count = parseInt(result.EventNotificationAlert["activePostCount"][0]);
            // give codes returned by camera prettier and standardized description
            if (code === "IO") {
                code = "AlarmLocal";
            }
            if (code === "VMD") {
                code = "VideoMotion";
            }
            if (code === "linedetection") {
                code = "LineDetection";
            }
            if (code === "videoloss") {
                code = "VideoLoss";
            }
            if (code === "shelteralarm") {
                code = "VideoBlind";
            }
            if (action === "active") {
                action = "Start";
            }
            if (action === "inactive") {
                action = "Stop";
            }
            // create and event identifier for each recieved event
            // This allows multiple detection types with multiple indexes for DVR or multihead devices
            var eventIdentifier = code + index;
            // Count 0 seems to indicate everything is fine and nothing is wrong, used as a heartbeat
            // if triggerActive is true, lets step through the activeEvents
            // If activeEvents has something, lets end those events and clear activeEvents and reset triggerActive
            if (count == 0) {
                if (this.triggerActive === true) {
                    for (var i in this.activeEvents) {
                        if (this.activeEvents.hasOwnProperty(i)) {
                            var eventDetails = this.activeEvents[i];
                            if (this.debug) {
                                console.log("Ending Event: " +
                                    i +
                                    " - " +
                                    eventDetails["code"] +
                                    " - " +
                                    (Date.now() - eventDetails["lasttimestamp"]) / 1000);
                            }
                            this.emit("alarm", eventDetails.code, "Stop", eventDetails.index);
                        }
                    }
                    this.activeEvents = {};
                    this.triggerActive = false;
                }
                else {
                    // should be the most common result
                    // Nothing interesting happening and we haven't seen any events
                    if (this.debug) {
                        this.emit("alarm", code, action, index);
                    }
                }
            }
            else if (typeof this.activeEvents[eventIdentifier] === "undefined" ||
                this.activeEvents[eventIdentifier] === null) {
                var eventDetails = {};
                eventDetails.code = code;
                eventDetails.index = index;
                eventDetails.lasttimestamp = Date.now();
                this.activeEvents[eventIdentifier] = eventDetails;
                this.emit("alarm", code, action, index);
                this.triggerActive = true;
                // known active events
            }
            else {
                if (this.debug) {
                    console.log("    Skipped Event: " + code + " " + action + " " + index + " " + count);
                }
                // Update lasttimestamp
                var eventDetails = {};
                eventDetails.code = code;
                eventDetails.index = index;
                eventDetails.lasttimestamp = Date.now();
                this.activeEvents[eventIdentifier] = eventDetails;
                // step through activeEvents
                // if we haven't seen it in more than 2 seconds, lets end it and remove from activeEvents
                for (var i in this.activeEvents) {
                    if (this.activeEvents.hasOwnProperty(i)) {
                        var eventDetails = this.activeEvents[i];
                        if ((Date.now() - eventDetails.lasttimestamp) / 1000 > 2) {
                            if (this.debug) {
                                console.log("    Ending Event: " +
                                    i +
                                    " - " +
                                    eventDetails["code"] +
                                    " - " +
                                    (Date.now() - eventDetails["lasttimestamp"]) / 1000);
                            }
                            this.emit("alarm", eventDetails.code, "Stop", eventDetails.index);
                            delete this.activeEvents[i];
                        }
                    }
                }
            }
        }
    }
    // Handle connection
    handleConnection() {
        if (this.debug) {
            console.log("Connected to " + this.ipAddress + ":" + this.port);
        }
        this.emit("connect");
    }
    // Handle connection ended
    handleEnd() {
        if (this.debug) {
            console.log("Connection closed!");
        }
        this.emit("end");
    }
    // Handle Errors
    handleError(err) {
        if (this.debug) {
            console.log("Connection error: " + err);
        }
        this.emit("error", err);
    }
}
exports.CameraEventHandler = CameraEventHandler;
//# sourceMappingURL=cameraEventHandler.js.map