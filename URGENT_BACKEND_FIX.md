# 🚨 مشكلة عاجلة: فشل رفع الفيديو

## المشكلة الحالية

عند محاولة رفع فيديو، تظهر رسالة **"عذراً فشل النشر"**

## السبب

الواجهة الأمامية تحاول استخدام خدمة رفع جديدة تتطلب endpoints غير موجودة بعد في الباكند:
- `POST /api/v1/upload/get-signed-url`
- `POST /api/v1/upload/register`

## الحل المؤقت ✅

تم تعديل الكود ليستخدم الطريقة القديمة مباشرة:

```typescript
// الآن يستخدم:
POST /api/v1/upload/multiple
```

## ماذا يحتاج الباكند الآن؟

### 1. تأكد من endpoint موجود وشغال:

```
POST /api/v1/upload/multiple
```

**Request:**
```javascript
FormData with field: 'files' (can be multiple files)
Headers: { 'Authorization': 'Bearer <token>' }
```

**Response:**
```json
{
  "files": [
    {
      "filePath": "https://cdn.example.com/video.mp4",
      "fileType": "video/mp4"
    }
  ]
}
```

أو:

```json
{
  "file": {
    "filePath": "https://cdn.example.com/video.mp4",
    "fileType": "video/mp4"
  }
}
```

### 2. تأكد من دعم الفيديو:

```javascript
// Backend يجب أن يقبل:
const allowedMimeTypes = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'video/mp4',       // ← مهم!
  'video/quicktime', // ← مهم!
  'video/webm'       // ← مهم!
];
```

### 3. تأكد من حجم الملف:

```javascript
// Multer config مثال:
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB للفيديو
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

### 4. كود كامل للـ Endpoint (مثال):

```javascript
const express = require('express');
const multer = require('multer');
const { uploadToB2 } = require('./b2-storage'); // أو أي storage service

const router = express.Router();

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/webm'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`نوع الملف غير مدعوم: ${file.mimetype}`));
    }
  }
});

// Upload endpoint
router.post('/multiple', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'لم يتم إرسال ملفات' });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      // Upload to Backblaze B2 or your storage
      const fileUrl = await uploadToB2(file);
      
      uploadedFiles.push({
        filePath: fileUrl,
        fileType: file.mimetype
      });
    }

    // إذا كان ملف واحد، أرسله كـ object
    if (uploadedFiles.length === 1) {
      return res.json({
        file: uploadedFiles[0],
        files: uploadedFiles
      });
    }

    // إذا كان أكثر من ملف، أرسلهم كـ array
    res.json({
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'فشل رفع الملفات',
      error: error.message 
    });
  }
});

module.exports = router;
```

## مشكلة Android Studio

إذا كان لديك مشكلة في Android Studio مع الفيديو، قد تحتاج إلى:

### 1. تحديث AndroidManifest.xml:

```xml
<manifest>
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.INTERNET" />
  
  <application
    android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
  </application>
</manifest>
```

### 2. إنشاء network_security_config.xml:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

### 3. تحديث build.gradle:

```gradle
android {
    compileSdkVersion 33
    
    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 33
        
        // إضافة هذا
        multiDexEnabled true
    }
    
    buildTypes {
        release {
            minifyEnabled false
        }
    }
}
```

## الاختبار

### 1. اختبر الـ endpoint بـ curl:

```bash
curl -X POST https://your-api.com/api/v1/upload/multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@video.mp4"
```

### 2. يجب أن تحصل على response:

```json
{
  "file": {
    "filePath": "https://cdn.example.com/12345.mp4",
    "fileType": "video/mp4"
  },
  "files": [...]
}
```

## الـ Logs المفيدة

أضف هذا في الباكند لمعرفة المشكلة:

```javascript
router.post('/multiple', authenticateToken, upload.array('files', 10), async (req, res) => {
  console.log('📤 Upload request received');
  console.log('Files count:', req.files?.length);
  console.log('File details:', req.files?.map(f => ({
    name: f.originalname,
    size: f.size,
    type: f.mimetype
  })));
  
  try {
    // ... upload logic
  } catch (error) {
    console.error('❌ Upload failed:', error);
    res.status(500).json({ message: error.message });
  }
});
```

## الخلاصة

✅ **تم إصلاح الواجهة الأمامية** - الآن تستخدم الطريقة القديمة التي تعمل

⏳ **الباكند يحتاج** - تأكد من أن `/api/v1/upload/multiple` يعمل ويقبل الفيديو

📱 **Android** - إذا كان لديك مشكلة، استخدم الإعدادات أعلاه

## الخطوات التالية

1. ✅ تحديث الواجهة الأمامية (تم)
2. ⏳ تأكد من endpoint الباكند
3. ⏳ اختبر رفع فيديو
4. ⏳ في المستقبل، نفذ الـ endpoints الجديدة من BACKEND_UPLOAD_IMPLEMENTATION.md

---

**الحالة:** الواجهة الأمامية جاهزة، الباكند يحتاج تأكيد
