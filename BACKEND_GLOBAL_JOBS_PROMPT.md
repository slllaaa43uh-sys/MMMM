# مطالبة الذكاء الاصطناعي لتحديث الواجهة الخلفية - الوظائف العالمية

## نظرة عامة
أحتاج تحديث الواجهة الخلفية (Backend API) لدعم ميزة الوظائف العالمية (Global Jobs) مع نظام الإبلاغ عن المشاكل والإشعارات الكامل.

---

## ⚠️ ملاحظة مهمة - API عدادات الوظائف موجود

### ✅ الميزة الموجودة بالفعل:

يوجد API endpoint جاهز لعرض أعداد الوظائف:

```
GET /api/v1/posts/counts
```

**الاستجابة الحالية:**
```json
{
  "success": true,
  "data": {
    "jobs": {
      "total": 150,           // ✅ مجموع كل الوظائف
      "seeker": 80,           // ✅ ابحث عن وظيفة
      "employer": 70,         // ✅ ابحث عن موظفين
      "categories": {         // ✅ تقسيم حسب الفئات
        "سائق خاص": { "seeker": 10, "employer": 5, "total": 15 },
        "طباخ": { "seeker": 8, "employer": 4, "total": 12 }
      }
    },
    "haraj": {
      "total": 200,           // ✅ مجموع الحراج
      "categories": { ... }   // ✅ فئات الحراج
    }
  }
}
```

### 🔴 المطلوب إضافته:

1. **عداد الوظائف المستعجلة:**
```json
{
  "data": {
    "jobs": { ... },
    "haraj": { ... },
    "urgent": {              // ⭐ جديد
      "total": 45,
      "byTag": {
        "مطلوب الآن": 20,
        "عقود مؤقتة": 15,
        "دفع يومي": 10
      }
    }
  }
}
```

2. **عداد الوظائف العالمية (Global Jobs):**
```json
{
  "data": {
    "jobs": { ... },
    "haraj": { ... },
    "urgent": { ... },
    "globalJobs": {          // ⭐ جديد
      "total": 30,
      "byLocation": {
        "United Arab Emirates": 12,
        "Saudi Arabia": 10,
        "Kuwait": 5,
        "Qatar": 3
      }
    }
  }
}
```

### 📝 تحديث الكود المطلوب:

في ملف `src/controllers/postCountController.js`، أضف:

```javascript
// بعد السطر 37 - بعد حساب jobsTotalCount و harajTotalCount

// Get urgent jobs count
const urgentJobsTotalCount = await Post.countDocuments({
  displayPage: 'urgent',
  isShort: { $ne: true }
});

// Get urgent jobs by tag
const urgentJobsByTag = {};
const urgentTags = ['مطلوب الآن', 'عقود مؤقتة', 'دفع يومي'];
for (const tag of urgentTags) {
  const count = await Post.countDocuments({
    displayPage: 'urgent',
    specialTag: tag,
    isShort: { $ne: true }
  });
  urgentJobsByTag[tag] = count;
}

// Get global jobs count
const globalJobsTotalCount = await Post.countDocuments({
  isGlobalJob: true,
  isShort: { $ne: true }
});

// Get global jobs by location
const globalJobsByLocation = await Post.aggregate([
  {
    $match: {
      isGlobalJob: true,
      isShort: { $ne: true }
    }
  },
  {
    $group: {
      _id: '$globalJobData.workLocation',
      count: { $sum: 1 }
    }
  },
  {
    $sort: { count: -1 }
  },
  {
    $limit: 10  // أفضل 10 دول
  }
]);

const globalJobsByLocationObj = {};
globalJobsByLocation.forEach(item => {
  globalJobsByLocationObj[item._id] = item.count;
});
```

**وفي النهاية، أضف للاستجابة (السطر 148):**

```javascript
res.status(200).json({
  success: true,
  data: {
    jobs: {
      total: jobsTotalCount,
      seeker: jobsSeekerCount,
      employer: jobsEmployerCount,
      categories: jobCategoryCounts
    },
    haraj: {
      total: harajTotalCount,
      categories: harajCategoryCounts
    },
    // ⭐ جديد
    urgent: {
      total: urgentJobsTotalCount,
      byTag: urgentJobsByTag
    },
    // ⭐ جديد
    globalJobs: {
      total: globalJobsTotalCount,
      byLocation: globalJobsByLocationObj
    }
  }
});
```

---

## 1. تحديث نموذج Post (Post Model)

أضف الحقول التالية لنموذج المنشورات:

```javascript
// في Post Schema/Model
{
  // الحقول الموجودة...
  
  // حقول الوظائف العالمية (جديد)
  isGlobalJob: { type: Boolean, default: false },
  globalJobData: {
    applicationUrl: { type: String, required: function() { return this.isGlobalJob; } },
    workLocation: { type: String, required: function() { return this.isGlobalJob; } }, // اسم الدولة
    salary: { type: String }, // اختياري
    numberOfEmployees: { type: Number }, // اختياري
    ageRequirement: { type: String } // اختياري (مثل: "25-35")
  }
}
```

## 2. API Endpoints المطلوبة

### A. إنشاء وظيفة عالمية
```
POST /api/v1/posts
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "content": "نص الوظيفة...",
  "isGlobalJob": true,
  "globalJobData": {
    "applicationUrl": "https://example.com/apply",
    "workLocation": "United Arab Emirates",
    "salary": "5000-8000 AED",
    "numberOfEmployees": 5,
    "ageRequirement": "25-35"
  },
  "media": [] // اختياري
}

Response 201:
{
  "success": true,
  "post": {
    "id": "...",
    "content": "...",
    "isGlobalJob": true,
    "globalJobData": {...},
    "user": {...},
    "createdAt": "..."
  }
}
```

### B. جلب الوظائف العالمية (مع Pagination)
```
GET /api/v1/posts?isGlobalJob=true&page=1&limit=20
Authorization: Bearer {token} (اختياري)

Response 200:
{
  "success": true,
  "posts": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalPosts": 95,
    "hasMore": true
  }
}
```

### C. نظام الإبلاغ عن المشاكل
```
POST /api/v1/reports
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "type": "post", // أو "comment" أو "reply" أو "video"
  "targetId": "post_id_here",
  "reason": "نص البلاغ...",
  "details": "تفاصيل إضافية..."
}

Response 201:
{
  "success": true,
  "report": {
    "id": "report_id",
    "type": "post",
    "targetId": "...",
    "reportedBy": "user_id",
    "reason": "...",
    "status": "pending", // pending, reviewed, resolved
    "createdAt": "..."
  }
}
```

## 3. نموذج البلاغات (Reports Model)

إنشاء نموذج جديد للبلاغات:

```javascript
const ReportSchema = new Schema({
  type: {
    type: String,
    enum: ['post', 'comment', 'reply', 'video', 'user'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['Post', 'Comment', 'Reply', 'Video', 'User']
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500
  },
  details: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  reviewNote: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date
});

// Index للأداء
ReportSchema.index({ targetId: 1, reportedBy: 1 });
ReportSchema.index({ status: 1, createdAt: -1 });
```

## 4. نظام الإشعارات (Notifications System)

### A. نموذج الإشعارات
```javascript
const NotificationSchema = new Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'new_global_job', // وظيفة عالمية جديدة
      'job_application', // تقديم على وظيفة
      'report_submitted', // تم استلام البلاغ
      'report_reviewed', // تم مراجعة البلاغ
      'post_approved', // تم قبول المنشور
      'post_rejected', // تم رفض المنشور
      'like', 'comment', 'follow' // الإشعارات العادية
    ],
    required: true
  },
  title: {
    ar: String,
    en: String
  },
  message: {
    ar: String,
    en: String
  },
  data: {
    postId: String,
    userId: String,
    reportId: String,
    jobId: String,
    actionUrl: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
```

### B. API Endpoints للإشعارات
```
GET /api/v1/notifications?page=1&limit=20
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "notifications": [
    {
      "id": "...",
      "type": "new_global_job",
      "title": { "ar": "وظيفة عالمية جديدة", "en": "New Global Job" },
      "message": { "ar": "تم نشر وظيفة جديدة في الإمارات", "en": "New job posted in UAE" },
      "data": {
        "postId": "...",
        "actionUrl": "/global-jobs/..."
      },
      "isRead": false,
      "createdAt": "..."
    }
  ],
  "unreadCount": 5,
  "pagination": {...}
}
```

```
PATCH /api/v1/notifications/:id/read
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Notification marked as read"
}
```

```
PATCH /api/v1/notifications/read-all
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "All notifications marked as read"
}
```

## 5. إشعارات Push (Firebase Cloud Messaging)

### إرسال إشعار عند إنشاء وظيفة عالمية
```javascript
// عند إنشاء post مع isGlobalJob: true
async function notifyUsersAboutNewGlobalJob(post) {
  // جلب المستخدمين المهتمين (حسب الموقع أو الاهتمامات)
  const interestedUsers = await User.find({
    'preferences.notifyGlobalJobs': true,
    // يمكن إضافة فلتر حسب الدولة المهتمين بها
  }).select('fcmToken language');

  const notifications = interestedUsers.map(user => ({
    recipient: user._id,
    type: 'new_global_job',
    title: {
      ar: '🌍 وظيفة عالمية جديدة',
      en: '🌍 New Global Job'
    },
    message: {
      ar: `وظيفة جديدة في ${post.globalJobData.workLocation}`,
      en: `New job in ${post.globalJobData.workLocation}`
    },
    data: {
      postId: post._id.toString(),
      actionUrl: `/global-jobs/${post._id}`
    }
  }));

  await Notification.insertMany(notifications);

  // إرسال Push Notification عبر FCM
  const fcmTokens = interestedUsers
    .filter(u => u.fcmToken)
    .map(u => u.fcmToken);

  if (fcmTokens.length > 0) {
    await sendMulticastNotification(fcmTokens, {
      title: '🌍 وظيفة عالمية جديدة',
      body: `وظيفة جديدة في ${post.globalJobData.workLocation}`,
      data: {
        type: 'new_global_job',
        postId: post._id.toString()
      }
    });
  }
}
```

### إشعار عند استلام بلاغ
```javascript
async function notifyUserAboutReport(report) {
  const notification = await Notification.create({
    recipient: report.reportedBy,
    type: 'report_submitted',
    title: {
      ar: '✅ تم استلام البلاغ',
      en: '✅ Report Received'
    },
    message: {
      ar: 'تم استلام بلاغك وسيتم مراجعته قريباً',
      en: 'Your report has been received and will be reviewed soon'
    },
    data: {
      reportId: report._id.toString()
    }
  });

  // إرسال Push Notification
  const user = await User.findById(report.reportedBy).select('fcmToken');
  if (user && user.fcmToken) {
    await sendPushNotification(user.fcmToken, {
      title: '✅ تم استلام البلاغ',
      body: 'تم استلام بلاغك وسيتم مراجعته قريباً',
      data: {
        type: 'report_submitted',
        reportId: report._id.toString()
      }
    });
  }
}
```

## 6. Validation والتحقق

### في POST /api/v1/posts
```javascript
// التحقق من صحة البيانات
if (isGlobalJob) {
  if (!globalJobData || !globalJobData.applicationUrl || !globalJobData.workLocation) {
    return res.status(400).json({
      success: false,
      error: 'Global job requires applicationUrl and workLocation'
    });
  }

  // التحقق من صحة رابط التقديم
  try {
    new URL(globalJobData.applicationUrl);
  } catch (e) {
    return res.status(400).json({
      success: false,
      error: 'Invalid application URL'
    });
  }

  // التحقق من عدد الموظفين
  if (globalJobData.numberOfEmployees && globalJobData.numberOfEmployees < 1) {
    return res.status(400).json({
      success: false,
      error: 'Number of employees must be positive'
    });
  }
}
```

### في POST /api/v1/reports
```javascript
// منع البلاغات المكررة من نفس المستخدم
const existingReport = await Report.findOne({
  targetId,
  reportedBy: req.user._id,
  status: { $in: ['pending', 'reviewing'] }
});

if (existingReport) {
  return res.status(400).json({
    success: false,
    error: 'You have already reported this content'
  });
}

// حد أقصى للبلاغات في اليوم (منع spam)
const today = new Date();
today.setHours(0, 0, 0, 0);
const reportsToday = await Report.countDocuments({
  reportedBy: req.user._id,
  createdAt: { $gte: today }
});

if (reportsToday >= 10) {
  return res.status(429).json({
    success: false,
    error: 'Daily report limit reached'
  });
}
```

## 7. Indexes للأداء

```javascript
// في Post Model
PostSchema.index({ isGlobalJob: 1, createdAt: -1 });
PostSchema.index({ 'globalJobData.workLocation': 1, isGlobalJob: 1 });

// في Report Model
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ targetId: 1, reportedBy: 1 }, { unique: true });

// في Notification Model
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // حذف بعد 30 يوم
```

## 8. Admin Panel - إدارة البلاغات

### GET /api/v1/admin/reports
```
GET /api/v1/admin/reports?status=pending&page=1&limit=20
Authorization: Bearer {admin_token}

Response 200:
{
  "success": true,
  "reports": [
    {
      "id": "...",
      "type": "post",
      "target": {
        "id": "...",
        "content": "...",
        "user": {...}
      },
      "reportedBy": {
        "id": "...",
        "name": "..."
      },
      "reason": "...",
      "status": "pending",
      "createdAt": "..."
    }
  ],
  "stats": {
    "pending": 15,
    "reviewing": 5,
    "resolved": 120,
    "dismissed": 30
  }
}
```

### PATCH /api/v1/admin/reports/:id
```
PATCH /api/v1/admin/reports/:reportId
Authorization: Bearer {admin_token}

Body:
{
  "status": "resolved", // أو "dismissed"
  "reviewNote": "المحتوى ينتهك سياسات الاستخدام",
  "action": "delete_post" // أو "warn_user" أو "ban_user" أو "no_action"
}

Response 200:
{
  "success": true,
  "report": {...}
}
```

## 9. Webhooks والإحصائيات

### إحصائيات الوظائف العالمية
```
GET /api/v1/stats/global-jobs
Authorization: Bearer {admin_token}

Response 200:
{
  "success": true,
  "stats": {
    "totalGlobalJobs": 150,
    "activeJobs": 120,
    "jobsByCountry": {
      "United Arab Emirates": 45,
      "Saudi Arabia": 30,
      "Kuwait": 25
    },
    "averageApplicationsPerJob": 15,
    "topPosters": [...]
  }
}
```

## 10. متطلبات الأمان (Security)

1. **Rate Limiting**: 
   - 5 وظائف عالمية في اليوم للمستخدم العادي
   - 10 بلاغات في اليوم كحد أقصى
   
2. **Validation**:
   - التحقق من صحة جميع الـ URLs
   - تنظيف النصوص من XSS
   
3. **Authorization**:
   - المستخدمون فقط يمكنهم الإبلاغ
   - الإداريون فقط يمكنهم مراجعة البلاغات

## ملاحظات مهمة

1. **الترجمة**: جميع الإشعارات يجب أن تكون ب ar و en
2. **FCM Tokens**: تحديث tokens عند login
3. **Soft Delete**: عدم حذف المحتوى المُبلغ عنه نهائياً (للمراجعة)
4. **Logging**: تسجيل جميع عمليات البلاغ والإشعارات
5. **Caching**: استخدام Redis لـ caching الإشعارات غير المقروءة

## خطوات التنفيذ المقترحة

1. ✅ إضافة حقول `isGlobalJob` و `globalJobData` لنموذج Post
2. ✅ تحديث POST /api/v1/posts لدعم الوظائف العالمية
3. ✅ إضافة فلتر `isGlobalJob=true` في GET /api/v1/posts
4. ✅ إنشاء نموذج Reports
5. ✅ إنشاء API endpoints للبلاغات
6. ✅ إنشاء نموذج Notifications
7. ✅ إنشاء API endpoints للإشعارات
8. ✅ دمج FCM للإشعارات Push
9. ✅ إضافة Admin Panel للبلاغات
10. ✅ إضافة Tests للوظائف الجديدة

## أمثلة اختبار API

### إنشاء وظيفة عالمية
```bash
curl -X POST http://localhost:5000/api/v1/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "مطلوب مهندس برمجيات للعمل في دبي",
    "isGlobalJob": true,
    "globalJobData": {
      "applicationUrl": "https://company.com/apply",
      "workLocation": "United Arab Emirates",
      "salary": "15000-20000 AED",
      "numberOfEmployees": 3,
      "ageRequirement": "25-40"
    }
  }'
```

### إرسال بلاغ
```bash
curl -X POST http://localhost:5000/api/v1/reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "post",
    "targetId": "POST_ID_HERE",
    "reason": "محتوى مخالف",
    "details": "هذا المنشور يحتوي على معلومات كاذبة"
  }'
```

### جلب الإشعارات
```bash
curl -X GET "http://localhost:5000/api/v1/notifications?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**ملاحظة نهائية**: تأكد من تحديث المتغيرات البيئية (Environment Variables) لإضافة مفاتيح FCM والإعدادات الأخرى المطلوبة.
