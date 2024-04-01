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
  const params = { Bucket: bucket, Key: key };
  const data = await s3.getObject(params).promise();
  return data.Body.toString("utf-8");
}

async function initializeIoTDevice() {
  const bucketName = "awscertstorage";
  // Paths to your certificates in S3
  const privateKeyPath = process.env.AWS_PRIVATE_KEY_PATH;
  const certificatePath = process.env.AWS_CERTIFICATE_PATH;
  const caPath = process.env.AWS_CA_PATH;

  const [privateKey, certificate, caCertificate] = await Promise.all([
    downloadFromS3(bucketName, privateKeyPath),
    downloadFromS3(bucketName, certificatePath),
    downloadFromS3(bucketName, caPath),
  ]);

  device = awsIot.device({
    privateKey: Buffer.from(privateKey),
    clientCert: Buffer.from(certificate),
    caCert: Buffer.from(caCertificate),
    clientId: process.env.AWS_IOT_CLIENT_ID,
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
