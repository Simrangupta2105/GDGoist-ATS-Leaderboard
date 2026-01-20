const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const region = process.env.AWS_REGION
const bucket = process.env.S3_BUCKET

const s3 = new S3Client({ region })

async function generateUploadUrl(key, contentType, expiresIn = 900) {
  if (!bucket) throw new Error('S3_BUCKET not configured')
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  })
  const url = await getSignedUrl(s3, command, { expiresIn })
  return url
}

async function uploadFile(fileBuffer, key, contentType) {
  if (!bucket) throw new Error('S3_BUCKET not configured')
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  })
  try {
    await s3.send(command)
    // Construct public URL (assuming bucket is public or we use this specific format)
    // For now we return standard S3 URL
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  } catch (err) {
    console.error('S3 Upload Error:', err)
    throw err
  }
}

async function getFile(key) {
  if (!bucket) throw new Error('S3_BUCKET not configured')
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })
  try {
    const response = await s3.send(command)
    // Convert stream to buffer
    const stream = response.Body
    const chunks = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  } catch (err) {
    console.error('S3 Get Error:', err)
    throw err
  }
}

module.exports = { generateUploadUrl, uploadFile, getFile }
