const awsIot = require("aws-iot-device-sdk");
const AWS = require("aws-sdk");
require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWS_IOT_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_IOT_SECRET_ACCESS_KEY,
  region: process.env.AWS_IOT_REGION,
});

console.log("AWS:", process.env.AWS_IOT_ACCESS_KEY_ID);
const s3 = new AWS.S3();
let device;

async function initializeIoTDevice() {
  device = awsIot.device({
    keyPath:
      "/Users/visshal/Elgo/elgo-iot-plug-shelly/device_certs_new/035f080b642abfd092baf164202f09e1967d1d7189fc3aca1b1d84bee86662e8-private.pem.key",
    certPath:
      "/Users/visshal/Elgo/elgo-iot-plug-shelly/device_certs_new/035f080b642abfd092baf164202f09e1967d1d7189fc3aca1b1d84bee86662e8-certificate.pem.crt",
    caPath:
      "/Users/visshal/Elgo/elgo-iot-plug-shelly/device_certs_new/AmazonRootCA1.pem",
    clientId: "iotconsole-elgo-client-03",
    host: "a1smcl0622itjw-ats.iot.us-east-1.amazonaws.com",
  });

  device.on("connect", () => console.log("Connected to AWS IoT"));
  device.on("error", (error) => console.error("Connection Error:", error));
  return device;
}

function publishToAwsIotTopic(topic, data) {
  if (!device) {
    console.error("Device not initialized. Call initializeIoTDevice first.");
    return;
  }

  const messageJson = JSON.stringify(data);
  device.publish(topic, messageJson, () => {
    console.log(`Message published to ${topic}`);
  });
}

module.exports = { initializeIoTDevice, publishToAwsIotTopic };
