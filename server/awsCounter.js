const AWS = require("aws-sdk");
require("dotenv").config();

// const updateConfig = () => AWS.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   sessionToken: process.env.AWS_SESSION_TOKEN,
//   region: "ap-southeast-2",
// });

AWS.config.update({region: 'ap-southeast-2'});


const s3 = new AWS.S3();
const bucketName = "bismillah-page-bucket";
const objectKey = "text.json";

let jsonData = {
  counter: 0,
};

async function createS3bucket() {
  try {
    await s3.createBucket({ Bucket: bucketName }).promise();
    console.log(`Created bucket: ${bucketName}`);
  } catch (err) {
    if (err.statusCode === 409) {
      console.log(`Bucket already exists: ${bucketName}`);
    } else {
      console.log(`Error creating bucket: ${err}`);
    }
  }
}

async function uploadJsonToS3() {
  const params = {
    Bucket: bucketName,
    Key: objectKey,
    Body: JSON.stringify(jsonData),
    ContentType: "application/json",
  };

  try {
    await s3.putObject(params).promise();
    console.log("JSON file uploaded successfully.");
  } catch (err) {
    console.error("Error uploading JSON file:", err);
  }
}

async function getObjectFromS3() {
  const params = {
    Bucket: bucketName,
    Key: objectKey,
  };

  try {
    const data = await s3.getObject(params).promise();
    const parsedData = JSON.parse(data.Body.toString("utf-8"));
    return parsedData;
  } catch (err) {
    console.error("Error:", err);
    throw err; // Rethrow the error to handle it later
  }
}

async function updateObjectInS3() {
  try {
    // Get the current JSON data from S3
    jsonData = await getObjectFromS3();

    // Increment the counter by 1
    jsonData.counter += 1;

    // Upload the updated JSON to S3
    await uploadJsonToS3();

    return jsonData;
    
  } catch (err) {
    console.error("Error updating JSON data:", err);
  }
}


module.exports = { updateObjectInS3 };