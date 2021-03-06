const S3 = require('aws-sdk/clients/s3');
const fs = require('fs');

//EV's
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

//
const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
})

//uploads a file to s3
const uploadFile = (file) => {
    const fileStream = fs.createReadStream(file.path)

    //necessary params for the upload
    const uploadParams = {
        Bucket: bucketName,
        Body: fileStream, 
        Key: file.filename
    }

    return s3.upload(uploadParams).promise()
}

exports.uploadFile = uploadFile;

//download/get a file from s3
const getFileAws = (fileKey) => {
    const downloadParams = {
        Bucket: bucketName,
        Key: fileKey
    }

    return s3.getObject(downloadParams).createReadStream();
}

exports.getFileAws = getFileAws;