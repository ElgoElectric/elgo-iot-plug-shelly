const express = require("express");
const MQTT = require("mqtt");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
let globalLightLevel_current = -100;
let globalLightLevel_prev = -100;
function formatUnixTimestamp(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000); // Convert Unix timestamp to milliseconds
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Pad single digits with leading zero
  const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")} ${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return formattedDate;
}

const { initializeIoTDevice, publishToAwsIotTopic } = require("./mqtt_pub.js"); // Add this import statement
initializeIoTDevice()
  .then(() => {
    console.log("AWS IoT Device Initialized Successfully");
  })
  .catch((error) => {
    console.error("Failed to initialize AWS IoT Device:", error);
  });

// MQTT configuration
const PORT = process.env.PORT;
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
const MQTT_OPTIONS = {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  protocol: "wss",
};
const mqttClient = MQTT.connect(MQTT_BROKER_URL, MQTT_OPTIONS);

// Local

const app = express();
const topics = [
  `elgoplug1/${process.env.IOT_TOPIC}`,
  `elgoplug2/${process.env.IOT_TOPIC}`,
  `elgoplug3/${process.env.IOT_TOPIC}`,
  `elgoplug4/${process.env.IOT_TOPIC}`,
];

mqttClient.on("connect", () => {
  console.log("Successfully connected to MQTT broker.");
  mqttClient.subscribe(topics, (err, granted) => {
    if (err) {
      console.error("Failed to subscribe to topics:", err.message);
    } else {
      console.log(
        "Subscribed to topics:",
        granted.map((sub) => sub.topic).join(", ")
      );
    }
  });
});

mqttClient.on("message", (topic, message) => {
  const { deviceLabel, power, recordedTimestamp } = JSON.parse(
    message.toString()
  );
  const data = {
    deviceLabel: deviceLabel,
    devicePower: power,
    recordedTimestamp: formatUnixTimestamp(recordedTimestamp),
  };
  console.log(
    "\n\nDevice Label:",
    data.deviceLabel,
    "\nPower:",
    data.devicePower,
    "\nTimestamp:",
    data.recordedTimestamp
  );
  // Kitchen Appliance 1
  if (topic === `elgoplug1/${process.env.IOT_TOPIC}`) {
    try {
      publishToAwsIotTopic(process.env.AWS_PUB_IOT_TOPIC_1, data);
    } catch (e) {
      console.error("Failed to parse energy data:", e.message);
    }
  }
  // Kitchen Appliance 2
  else if (topic === `elgoplug2/${process.env.IOT_TOPIC}`) {
    try {
      publishToAwsIotTopic(process.env.AWS_PUB_IOT_TOPIC_2, data);
    } catch (e) {
      console.error("Failed to parse energy data:", e.message);
    }
  }
  // Refrigerator
  else if (topic === `elgoplug3/${process.env.IOT_TOPIC}`) {
    try {
      publishToAwsIotTopic(process.env.AWS_PUB_IOT_TOPIC_3, data);
    } catch (e) {
      console.error("Failed to parse energy data:", e.message);
    }
  }
  // HVAC
  else if (topic === `elgoplug4/${process.env.IOT_TOPIC}`) {
    try {
      publishToAwsIotTopic(process.env.AWS_PUB_IOT_TOPIC_4, data);
    } catch (e) {
      console.error("Failed to parse energy data:", e.message);
    }
  }
});

// Enable CORS for all routes
app.use(cors());

// Endpoint to toggle power
app.get("/togglePower", (req, res) => {
  const isPowerOn = req.query.isPowerOn === "true"; // Get power status from the query parameter
  const topic = `${req.query.plugID}/command/switch:0`;
  const message = isPowerOn ? "on" : "off";

  mqttClient.publish(topic, message, {}, (err) => {
    if (err) {
      res
        .status(500)
        .send(
          `MQTT publish failed to turn ${message} device connected to shelly plug:${req.query.plugID}`
        );
      return;
    }
    res.send(
      `Device connected to shelly plug:${req.query.plugID} turned ${message}`
    );
  });
});

app.get("/", (req, res) => {
  console.info("INFO: Server Started Successfully");
  res.json({ "message:": "Welcome to Elgo Shelly Plug Server" });
});
app.get("/loglightLevel", (req, res) => {
  try {
    if (!req.query.hasOwnProperty("lightLevel_current")) {
      throw new Error("No lightLevel_current query parameter provided");
    }
    if (!req.query.hasOwnProperty("lightLevel_prev")) {
      throw new Error("No lightLevel_prev query parameter provided");
    }

    const lightLevel_current = parseInt(req.query.lightLevel_current, 10);
    const lightLevel_prev = parseInt(req.query.lightLevel_prev, 10);

    //Init State
    if((lightLevel_current == lightLevel_prev)&(lightLevel_current == 0)){
      res.json({
        message: "Light levels retrieved successfully, no update performed",
        currentLightLevel: globalLightLevel_current,
        previousLightLevel: globalLightLevel_prev,
      });
    }

    //Transformation Logic
    if(globalLightLevel_current == 0 & globalLightLevel_prev == 0){
       if (lightLevel_current == 1){
        //Switch On Once

        globalLightLevel_prev = 0;
        globalLightLevel_current = 1;
       } 
       else if (lightLevel_current == 0.5){
        //Switch On

        //Switch Off

        //Switch On

        //Switch Off

        //Switch On

        globalLightLevel_prev = 0;
        globalLightLevel_current = 0.5;
       }

       else if (lightLevel_current == 0){
        //Do Nothing

        globalLightLevel_prev = 0;
        globalLightLevel_current = 0;
       }

       else if (lightLevel_current == 0.75){
        //Switch On

        //Switch Off

        //Switch On

        globalLightLevel_prev = 0;
        globalLightLevel_current = 0.75;
       }
    }

    else if(globalLightLevel_current == 0 & globalLightLevel_prev == 0.5){
      if (lightLevel_current == 1){
        //Switch On Once

        globalLightLevel_prev = 0;
        globalLightLevel_current = 1;
       }
        else if (lightLevel_current == 0.5){
          //Switch On
  
          //Switch Off
  
          //Switch On
  
          //Switch Off
  
          //Switch On
  
          globalLightLevel_prev = 0;
          globalLightLevel_current = 0.5;
        }
  
        else if (lightLevel_current == 0){
          //Do Nothing
  
          globalLightLevel_prev = 0.5;
          globalLightLevel_current = 0;
        }
  
        else if (lightLevel_current == 0.75){
          //Switch On
  
          //Switch Off
  
          //Switch On
  
          globalLightLevel_prev = 0;
          globalLightLevel_current = 0.75;
        }
    }
    else if(globalLightLevel_current == 0 & globalLightLevel_prev == 0.75){
      if (lightLevel_current == 0.5){
        //Switch On Once

        globalLightLevel_prev = 0;
        globalLightLevel_current = 0.5;
      }
      else if (lightLevel_current == 0){
        //Do Nothing

        globalLightLevel_prev = 0.75;
        globalLightLevel_current = 0;
      }

      else if (lightLevel_current == 0.75){
        //Switch On

        //Switch Off

        //Switch On

        //Switch Off

        //Switch On


        globalLightLevel_prev = 0;
        globalLightLevel_current = 0.75;
      }

      else if (lightLevel_current == 1){
        //Switch On

        //Switch Off

        //Switch On

        globalLightLevel_prev = 0;
        globalLightLevel_current = 1;
      }
    }

    else if(globalLightLevel_current == 0 & globalLightLevel_prev == 1){
      if (lightLevel_current == 0.5){
        //Switch On

        //Switch Off

        //Switch On

        globalLightLevel_prev = 0;
        globalLightLevel_current = 0.5;
      }
      else if (lightLevel_current == 0){
        //Do Nothing

        globalLightLevel_prev = 1;
        globalLightLevel_current = 0;
      }

      else if (lightLevel_current == 0.75){
        //Switch On

        globalLightLevel_prev = 0;
        globalLightLevel_current = 0.75;
      }

      else if (lightLevel_current == 1){
        //Switch On

        //Switch Off

        //Switch On

        //Switch Off

        //Switch On

        globalLightLevel_prev = 0;
        globalLightLevel_current = 1;
      }
    }

    else if(globalLightLevel_current == 0.5){
      if (lightLevel_current == 1){
        //Switch Off

        //Switch On

        globalLightLevel_prev = 0.5;
        globalLightLevel_current = 1;
      }
      else if (lightLevel_current == 0.5){
        //Do Nothing

        globalLightLevel_prev = 0.5;
        globalLightLevel_current = 0.5;
      }

      else if (lightLevel_current == 0){
        //Switch Off

        globalLightLevel_prev = 0.5;
        globalLightLevel_current = 0;
      }

      else if (lightLevel_current == 0.75){
        //Switch Off

        //Switch On

        //Switch Off

        //Switch On

        globalLightLevel_prev = 0.5;
        globalLightLevel_current = 0.75;
      }
    }

    else if(globalLightLevel_current == 0.75){
      if (lightLevel_current == 1){
        //Switch Off

        //Switch On

        //Switch Off

        //Switch On

        globalLightLevel_prev = 0.75;
        globalLightLevel_current = 1;
      }

      else if (lightLevel_current == 0.5){
        //Switch Off

        //Switch On

        globalLightLevel_prev = 0.75;
        globalLightLevel_current = 0.5;
      }

      else if (lightLevel_current == 0){
        //Switch Off

        globalLightLevel_prev = 0.75;
        globalLightLevel_current = 0;
      }

      else if (lightLevel_current == 0.75){
        //Do Nothing

        globalLightLevel_prev = 0.75;
        globalLightLevel_current = 0.75;
      }
    }

    else if(globalLightLevel_current == 1){
      if (lightLevel_current == 1){
        //Do Nothing

        globalLightLevel_prev = 1;
        globalLightLevel_current = 1;
      }
        
      else if (lightLevel_current == 0.5){
        //Switch Off

        //Switch On

        //Switch Off

        //Switch On

        globalLightLevel_prev = 1;
        globalLightLevel_current = 0.5;
      }

      else if (lightLevel_current == 0){
        //Switch Off

        globalLightLevel_prev = 1;
        globalLightLevel_current = 0;
      }

      else if (lightLevel_current == 0.75){
        //Switch Off

        //Switch On

        globalLightLevel_prev = 1;
        globalLightLevel_current = 0.75;
      }
    }   


    if (isNaN(lightLevel_current)) {
      throw new Error("lightLevel_current must be a number");
    }
    if (isNaN(lightLevel_prev)) {
      throw new Error("lightLevel_prev must be a number");
    }

    if ((lightLevel_current == -1) & (lightLevel_prev == -1)) {
      res.json({
        message: "Light levels retrieved successfully, no update performed",
        currentLightLevel: globalLightLevel_current,
        previousLightLevel: globalLightLevel_prev,
      });
    } else {
      globalLightLevel_prev = lightLevel_prev;
      globalLightLevel_current = lightLevel_current;

      res.json({
        message: "Light level updated successfully",
        currentLightLevel: globalLightLevel_current,
        previousLightLevel: globalLightLevel_prev,
      });
    }
  } catch (error) {
    res.status(400).json({
      message: "Error processing request",
      error: error.message,
      currentLightLevel: globalLightLevel_current,
      previousLightLevel: globalLightLevel_prev,
    });
  }
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});
