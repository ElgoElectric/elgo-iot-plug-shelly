const awsIot = require("aws-iot-device-sdk");
const AWS = require("aws-sdk");
require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWS_IOT_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_IOT_SECRET_ACCESS_KEY,
  region: process.env.AWS_IOT_REGION,
});

const s3 = new AWS.S3();
let device;

async function downloadFromS3(bucket, key) {
  const params = {
    Bucket: bucket,
    Key: key,
  };
  return new Promise((resolve, reject) => {
    s3.getObject(params, (err, data) => {
      if (err) reject(err);
      else resolve(data.Body);
    });
  });
}

async function initializeIoTDevice() {
  const privateKey = await downloadFromS3(
    process.env.AWS_S3_BUCKET,
    process.env.AWS_S3_PKEY
  );
  const certificate = await downloadFromS3(
    process.env.AWS_S3_BUCKET,
    process.env.AWS_S3_CERT
  );
  const caCertificate = await downloadFromS3(
    process.env.AWS_S3_BUCKET,
    process.env.AWS_S3_CA1
  );

  const device = awsIot.device({
    privateKey: Buffer.from(privateKey),
    clientCert: Buffer.from(certificate),
    caCert: Buffer.from(caCertificate),
    clientId: "iotconsole-elgo-client-06",
    host: process.env.AWS_IOT_ENDPOINT,
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
