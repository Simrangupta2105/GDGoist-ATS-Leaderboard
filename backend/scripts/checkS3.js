require('dotenv').config()
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')

async function checkS3() {
    console.log('Checking S3 Connectivity...')
    console.log(`Region: ${process.env.AWS_REGION}`)
    console.log(`Bucket: ${process.env.S3_BUCKET}`)

    const client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    })

    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.S3_BUCKET,
            MaxKeys: 1
        })
        const response = await client.send(command)
        console.log('✅ S3 Connection Successful!')
        console.log('Bucket accessible.')
        console.log(`Found ${response.KeyCount} objects (sample).`)
    } catch (err) {
        console.error('❌ S3 Connection Failed:')
        console.error(err.message)
        if (err.Code) console.error(`Error Code: ${err.Code}`)
    }
}

checkS3()
