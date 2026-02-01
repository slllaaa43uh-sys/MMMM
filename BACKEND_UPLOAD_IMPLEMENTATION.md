# Backend Upload Service Implementation Guide

## Overview

The frontend has been updated to use **Direct Client-to-Storage Upload** strategy. This document describes the required backend API endpoints.

## Required Backend Endpoints

### 1. GET Signed Upload URL

**Endpoint:** `POST /api/v1/upload/get-signed-url`

**Purpose:** Generate a temporary signed URL for direct upload to Backblaze B2

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fileName": "video.mp4",
  "contentType": "video/mp4"
}
```

**Response (200 OK):**
```json
{
  "uploadUrl": "https://s3.us-west-004.backblazeb2.com/bucket/...",
  "fileUrl": "https://cdn.backblazeb2.com/bucket/unique-file-name.mp4",
  "uploadHeaders": {
    "Authorization": "..."
  }
}
```

**Implementation Example (Node.js + AWS SDK):**

```javascript
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure Backblaze B2 (S3-compatible)
const s3 = new AWS.S3({
  endpoint: 'https://s3.us-west-004.backblazeb2.com',
  accessKeyId: process.env.B2_KEY_ID,
  secretAccessKey: process.env.B2_APPLICATION_KEY,
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

router.post('/get-signed-url', authenticateToken, async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    
    // Generate unique file name
    const ext = fileName.split('.').pop();
    const uniqueName = `${uuidv4()}.${ext}`;
    const key = `uploads/${uniqueName}`;
    
    // Generate signed URL (expires in 1 hour)
    const uploadUrl = s3.getSignedUrl('putObject', {
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Expires: 3600, // 1 hour
      ACL: 'public-read'
    });
    
    // Public file URL
    const fileUrl = `https://f004.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${key}`;
    
    res.json({
      uploadUrl,
      fileUrl,
      uploadHeaders: {
        'Content-Type': contentType
      }
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ message: 'Failed to generate upload URL' });
  }
});
```

### 2. Register Uploaded File

**Endpoint:** `POST /api/v1/upload/register`

**Purpose:** Save file metadata to MongoDB after successful upload

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fileUrl": "https://cdn.backblazeb2.com/bucket/unique-file-name.mp4",
  "fileName": "video.mp4",
  "fileType": "video/mp4"
}
```

**Response (200 OK):**
```json
{
  "filePath": "https://cdn.backblazeb2.com/bucket/unique-file-name.mp4",
  "fileType": "video/mp4",
  "fileUrl": "https://cdn.backblazeb2.com/bucket/unique-file-name.mp4"
}
```

**Implementation Example:**

```javascript
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { fileUrl, fileName, fileType } = req.body;
    const userId = req.user.userId;
    
    // Optional: Save to database for tracking
    const fileRecord = await File.create({
      userId,
      fileName,
      fileUrl,
      fileType,
      uploadedAt: new Date()
    });
    
    res.json({
      filePath: fileUrl,
      fileType: fileType,
      fileUrl: fileUrl
    });
  } catch (error) {
    console.error('Error registering file:', error);
    res.status(500).json({ message: 'Failed to register file' });
  }
});
```

## Environment Variables Required

Add these to your `.env` file:

```bash
# Backblaze B2 Configuration
B2_KEY_ID=your_key_id
B2_APPLICATION_KEY=your_application_key
B2_BUCKET_NAME=your_bucket_name
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_CDN_URL=https://f004.backblazeb2.com/file/your_bucket_name
```

## NPM Packages Required

```bash
npm install aws-sdk uuid
```

## Benefits of This Approach

1. **Reduced Server Load**: Backend never handles large video files
2. **Faster Uploads**: Direct connection to storage (no proxy)
3. **Cost Efficient**: No bandwidth costs for backend server
4. **Scalable**: Can handle thousands of concurrent uploads
5. **Better UX**: Real-time progress tracking on frontend

## Migration from Old System

The frontend includes **automatic fallback** to the legacy upload method if the new endpoints are not available. This means:

- Deploy frontend first (no breaking changes)
- Implement new backend endpoints
- Once endpoints are ready, uploads will automatically use the new method
- Old endpoints can remain for backward compatibility

## Testing

### Test Signed URL Generation:
```bash
curl -X POST https://api.yourapp.com/api/v1/upload/get-signed-url \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.mp4","contentType":"video/mp4"}'
```

### Test File Registration:
```bash
curl -X POST https://api.yourapp.com/api/v1/upload/register \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"fileUrl":"https://cdn.example.com/file.mp4","fileName":"test.mp4","fileType":"video/mp4"}'
```

## Security Considerations

1. **Authentication**: Always verify JWT token before generating signed URLs
2. **File Size Limits**: Set max file size in signed URL parameters
3. **Rate Limiting**: Limit number of signed URL requests per user
4. **Content-Type Validation**: Validate file types (images/videos only)
5. **Expiration**: Keep signed URL expiration short (1 hour recommended)

## Complete Backend Routes File

```javascript
const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

// Configure S3 (Backblaze B2)
const s3 = new AWS.S3({
  endpoint: process.env.B2_ENDPOINT,
  accessKeyId: process.env.B2_KEY_ID,
  secretAccessKey: process.env.B2_APPLICATION_KEY,
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

// Get signed upload URL
router.post('/get-signed-url', authenticateToken, async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    
    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ message: 'Invalid file type' });
    }
    
    // Generate unique file name
    const ext = fileName.split('.').pop();
    const uniqueName = `${Date.now()}-${uuidv4()}.${ext}`;
    const key = `uploads/${uniqueName}`;
    
    // Generate signed URL
    const uploadUrl = s3.getSignedUrl('putObject', {
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Expires: 3600,
      ACL: 'public-read'
    });
    
    // Public file URL
    const fileUrl = `${process.env.B2_CDN_URL}/${key}`;
    
    res.json({
      uploadUrl,
      fileUrl,
      uploadHeaders: {
        'Content-Type': contentType
      }
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ message: 'Failed to generate upload URL' });
  }
});

// Register uploaded file
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { fileUrl, fileName, fileType } = req.body;
    const userId = req.user.userId;
    
    // Optional: Save to database
    // await File.create({ userId, fileName, fileUrl, fileType, uploadedAt: new Date() });
    
    res.json({
      filePath: fileUrl,
      fileType: fileType,
      fileUrl: fileUrl
    });
  } catch (error) {
    console.error('Error registering file:', error);
    res.status(500).json({ message: 'Failed to register file' });
  }
});

module.exports = router;
```

## Questions?

Contact the frontend team for any clarifications about the implementation.
