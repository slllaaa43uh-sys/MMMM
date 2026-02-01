# 🔧 تحديثات الواجهة الخلفية - دعم حالات الحراج (Haraj Status)

## نظرة عامة
هذا الملف يحتوي على جميع التحديثات المطلوبة في الواجهة الخلفية لدعم ميزة حالات الحراج الجديدة.

---

## 📦 الكود الكامل للتطبيق

### 1️⃣ تحديث نموذج المنشور (Post Model)

```javascript
// models/Post.js أو ما يعادله
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  // الحقول الموجودة مسبقاً
  text: String,
  content: String,
  media: [{
    url: String,
    type: { type: String, enum: ['image', 'video'] },
    thumbnail: String
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // نوع المنشور
  type: {
    type: String,
    enum: ['general', 'job', 'haraj'],
    default: 'general',
    required: true
  },
  
  // حالة الوظيفة (للمنشورات من نوع job)
  jobStatus: {
    type: String,
    enum: ['open', 'negotiating', 'hired'],
    default: 'open'
  },
  
  // ⭐ حالة الحراج (للمنشورات من نوع haraj) - جديد
  harajStatus: {
    type: String,
    enum: ['available', 'sold', 'deleted'],
    default: 'available'
  },
  
  category: String,
  title: String,
  location: String,
  country: String,
  city: String,
  scope: String,
  isFeatured: Boolean,
  specialTag: String,
  contactPhone: String,
  contactEmail: String,
  contactMethods: [String],
  
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, default: 'like' }
  }],
  
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  isShort: { type: Boolean, default: false },
  
}, { timestamps: true });

// إضافة index للبحث السريع
postSchema.index({ type: 1, harajStatus: 1 });
postSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Post', postSchema);
```

---

### 2️⃣ Routes - الطرق (Routes)

```javascript
// routes/posts.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload'); // middleware للتعامل مع الملفات

// ============================================
// ⭐ Endpoint جديد: تحديث حالة الحراج
// ============================================
router.put('/posts/:postId/haraj-status', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    // التحقق من صحة الحالة
    if (!status || !['available', 'sold'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid haraj status. Must be "available" or "sold"' 
      });
    }

    // البحث عن المنشور
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // التحقق من الملكية
    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ 
        error: 'Unauthorized: You can only update your own posts' 
      });
    }

    // التحقق من أن المنشور من نوع حراج
    if (post.type !== 'haraj') {
      return res.status(400).json({ 
        error: 'This endpoint is only for haraj posts' 
      });
    }

    // تحديث الحالة
    post.harajStatus = status;
    await post.save();

    // إرجاع النتيجة
    return res.json({ 
      success: true, 
      message: `Haraj status updated to ${status}`,
      post: {
        _id: post._id,
        harajStatus: post.harajStatus,
        type: post.type
      }
    });

  } catch (error) {
    console.error('Error updating haraj status:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// تحديث Endpoint: إنشاء منشور جديد
// ============================================
router.post('/posts', authenticate, upload.array('media', 10), async (req, res) => {
  try {
    const { 
      text, 
      content, 
      category, 
      type,
      title,
      location,
      country,
      city,
      scope,
      contactPhone,
      contactEmail,
      contactMethods,
      isFeatured,
      isShort
    } = req.body;

    const userId = req.user._id;

    // تحديد النوع تلقائياً إذا لم يتم تحديده
    let postType = type || 'general';
    
    // قوائم الفئات (يجب أن تتطابق مع الواجهة الأمامية)
    const HARAJ_CATEGORIES = ['سيارات', 'عقارات', 'إلكترونيات', 'أثاث', 'ملابس', 'أخرى'];
    const JOB_CATEGORIES = ['سائق', 'أمن', 'طباخ', 'محاسب', 'مهندس', 'طبيب'];
    
    if (!type) {
      if (category && HARAJ_CATEGORIES.includes(category)) {
        postType = 'haraj';
      } else if (category && JOB_CATEGORIES.includes(category)) {
        postType = 'job';
      }
    }

    // معالجة الملفات المرفوعة
    const media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image';
        media.push({
          url: file.path || `/uploads/${file.filename}`,
          type: fileType,
          thumbnail: fileType === 'video' ? file.thumbnailPath : undefined
        });
      }
    }

    // إنشاء المنشور
    const newPost = new Post({
      text: text || content,
      content: text || content,
      media,
      user: userId,
      type: postType,
      category,
      title,
      location,
      country,
      city,
      scope,
      contactPhone,
      contactEmail,
      contactMethods: contactMethods ? JSON.parse(contactMethods) : [],
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isShort: isShort === 'true' || isShort === true,
      
      // تعيين القيم الافتراضية بناءً على النوع
      jobStatus: postType === 'job' ? 'open' : undefined,
      harajStatus: postType === 'haraj' ? 'available' : undefined
    });

    await newPost.save();
    
    // إرجاع المنشور مع بيانات المستخدم
    const populatedPost = await Post.findById(newPost._id)
      .populate('user', 'name avatar username');

    return res.status(201).json({
      success: true,
      post: populatedPost
    });

  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ 
      error: 'Failed to create post',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// تحديث Endpoint: الحصول على جميع المنشورات
// ============================================
router.get('/posts', async (req, res) => {
  try {
    const { 
      category, 
      country, 
      city, 
      type,
      userId,
      page = 1, 
      limit = 20,
      includeDeleted = 'false' // جديد: خيار لإظهار المحذوفة
    } = req.query;

    // بناء الاستعلام
    const query = {};
    
    if (category) query.category = category;
    if (type) query.type = type;
    if (userId) query.user = userId;
    
    // تصفية الموقع
    if (country && country !== 'عام' && country !== 'General') {
      query.country = country;
      if (city && city !== 'كل المدن') {
        query.city = city;
      }
    }
    
    // إخفاء المنشورات المحذوفة من الحراج (ما لم يُطلب عرضها)
    if (includeDeleted !== 'true') {
      query.$or = [
        { harajStatus: { $ne: 'deleted' } },
        { type: { $ne: 'haraj' } }
      ];
    }

    // حساب الصفحات
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // جلب المنشورات
    const posts = await Post.find(query)
      .populate('user', 'name avatar username')
      .populate('originalPost')
      .select('text content media type category jobStatus harajStatus title location country city scope isFeatured specialTag contactPhone contactEmail contactMethods reactions shares isShort createdAt updatedAt')
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // حساب إجمالي المنشورات
    const total = await Post.countDocuments(query);

    return res.json({
      success: true,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch posts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// تحديث Endpoint: الحصول على منشورات مستخدم معين
// ============================================
router.get('/posts/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, includeDeleted = 'false' } = req.query;

    const query = { 
      user: userId === 'me' ? req.user._id : userId,
      isShort: { $ne: true } // استبعاد الـ shorts من البروفايل
    };

    // للمستخدم نفسه: إظهار جميع المنشورات بما فيها المحذوفة
    // للآخرين: إخفاء المنشورات المحذوفة
    if (userId !== 'me' && userId !== req.user._id.toString() && includeDeleted !== 'true') {
      query.$or = [
        { harajStatus: { $ne: 'deleted' } },
        { type: { $ne: 'haraj' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find(query)
      .populate('user', 'name avatar username')
      .populate('originalPost')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Post.countDocuments(query);

    return res.json({
      success: true,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching user posts:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch user posts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// تحديث Endpoint: الحصول على منشور واحد
// ============================================
router.get('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('user', 'name avatar username bio')
      .populate('originalPost')
      .populate('reactions.user', 'name avatar')
      .lean();

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // إذا كان المنشور محذوف من الحراج، لا تعرضه إلا للمالك
    if (post.type === 'haraj' && post.harajStatus === 'deleted') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // التحقق من المالك (تحتاج لإضافة منطق التحقق من التوكن هنا)
      // إذا لم يكن المالك، أرجع 404
    }

    return res.json({
      success: true,
      post
    });

  } catch (error) {
    console.error('Error fetching post:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch post',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// Endpoint موجود مسبقاً: تحديث حالة الوظيفة
// ============================================
router.put('/posts/:postId/job-status', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!status || !['open', 'negotiating', 'hired'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid job status. Must be "open", "negotiating", or "hired"' 
      });
    }

    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (post.type !== 'job') {
      return res.status(400).json({ 
        error: 'This endpoint is only for job posts' 
      });
    }

    post.jobStatus = status;
    await post.save();

    return res.json({ 
      success: true, 
      message: `Job status updated to ${status}`,
      post: {
        _id: post._id,
        jobStatus: post.jobStatus,
        type: post.type
      }
    });

  } catch (error) {
    console.error('Error updating job status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Endpoint: حذف منشور (تحديث للدعم الناعم)
// ============================================
router.delete('/posts/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // للحراج: حذف ناعم (soft delete)
    if (post.type === 'haraj') {
      post.harajStatus = 'deleted';
      await post.save();
      
      return res.json({ 
        success: true, 
        message: 'Haraj post marked as deleted',
        softDelete: true
      });
    }

    // للمنشورات الأخرى: حذف فعلي
    await post.deleteOne();
    
    return res.json({ 
      success: true, 
      message: 'Post deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = router;
```

---

### 3️⃣ سكريبت الترحيل (Migration Script)

```javascript
// scripts/migrateHarajStatus.js
// سكريبت يُنفذ مرة واحدة لتحديث البيانات الموجودة

const mongoose = require('mongoose');
const Post = require('../models/Post');
require('dotenv').config();

async function migrateHarajStatus() {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to database');

    // 1. تحديث جميع منشورات الحراج التي ليس لها harajStatus
    const harajUpdateResult = await Post.updateMany(
      { 
        type: 'haraj', 
        harajStatus: { $exists: false } 
      },
      { 
        $set: { harajStatus: 'available' } 
      }
    );

    console.log(`✅ Updated ${harajUpdateResult.modifiedCount} haraj posts with default status`);

    // 2. تحديث جميع منشورات الوظائف التي ليس لها jobStatus
    const jobUpdateResult = await Post.updateMany(
      { 
        type: 'job', 
        jobStatus: { $exists: false } 
      },
      { 
        $set: { jobStatus: 'open' } 
      }
    );

    console.log(`✅ Updated ${jobUpdateResult.modifiedCount} job posts with default status`);

    // 3. تحديث المنشورات التي ليس لها type
    const noTypeResult = await Post.updateMany(
      { 
        type: { $exists: false } 
      },
      { 
        $set: { type: 'general' } 
      }
    );

    console.log(`✅ Updated ${noTypeResult.modifiedCount} posts with default type`);

    // 4. عرض إحصائيات
    const stats = await Post.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          harajStatuses: {
            $push: {
              $cond: [
                { $eq: ['$type', 'haraj'] },
                '$harajStatus',
                null
              ]
            }
          },
          jobStatuses: {
            $push: {
              $cond: [
                { $eq: ['$type', 'job'] },
                '$jobStatus',
                null
              ]
            }
          }
        }
      }
    ]);

    console.log('\n📊 Current Statistics:');
    console.log(JSON.stringify(stats, null, 2));

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
  }
}

// تشغيل السكريبت
migrateHarajStatus();
```

**لتشغيل السكريبت:**
```bash
node scripts/migrateHarajStatus.js
```

---

### 4️⃣ Middleware للتحقق (Validators)

```javascript
// middleware/validators.js
const { body, param, validationResult } = require('express-validator');

// التحقق من حالة الحراج
const validateHarajStatus = [
  param('postId').isMongoId().withMessage('Invalid post ID'),
  body('status')
    .isIn(['available', 'sold'])
    .withMessage('Status must be either "available" or "sold"'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// التحقق من حالة الوظيفة
const validateJobStatus = [
  param('postId').isMongoId().withMessage('Invalid post ID'),
  body('status')
    .isIn(['open', 'negotiating', 'hired'])
    .withMessage('Status must be "open", "negotiating", or "hired"'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateHarajStatus,
  validateJobStatus
};
```

**استخدام Validators في Routes:**
```javascript
const { validateHarajStatus, validateJobStatus } = require('../middleware/validators');

router.put('/posts/:postId/haraj-status', authenticate, validateHarajStatus, async (req, res) => {
  // الكود هنا...
});

router.put('/posts/:postId/job-status', authenticate, validateJobStatus, async (req, res) => {
  // الكود هنا...
});
```

---

### 5️⃣ ملف Environment Variables

```env
# .env
MONGODB_URI=mongodb://localhost:27017/your_database_name
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=development
```

---

## 📝 ملاحظات هامة

1. **التوافقية مع البيانات الموجودة**: نفّذ سكريبت الترحيل قبل التشغيل في الإنتاج
2. **الحذف الناعم**: المنشورات المحذوفة من الحراج تبقى في قاعدة البيانات لكن مخفية
3. **الصلاحيات**: تأكد من أن المستخدم يمكنه فقط تعديل منشوراته الخاصة
4. **Indexes**: تم إضافة indexes للبحث السريع في قاعدة البيانات
5. **التحقق من البيانات**: استخدم express-validator للتحقق من صحة البيانات

---

## 🧪 اختبار API

### باستخدام cURL:

```bash
# 1. تحديث حالة الحراج إلى "تم البيع"
curl -X PUT http://localhost:5000/api/v1/posts/POST_ID/haraj-status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "sold"}'

# 2. تحديث حالة الحراج إلى "متاح"
curl -X PUT http://localhost:5000/api/v1/posts/POST_ID/haraj-status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "available"}'

# 3. الحصول على منشورات الحراج فقط
curl -X GET "http://localhost:5000/api/v1/posts?type=haraj&country=السعودية"

# 4. حذف منشور حراج (حذف ناعم)
curl -X DELETE http://localhost:5000/api/v1/posts/POST_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ Checklist

- [ ] تحديث نموذج Post بحقل harajStatus
- [ ] إضافة route جديد: PUT /api/v1/posts/:postId/haraj-status
- [ ] تحديث route: POST /api/v1/posts لدعم type و harajStatus
- [ ] تحديث route: GET /api/v1/posts لتصفية المحذوفة
- [ ] تحديث route: GET /api/v1/posts/user/:userId
- [ ] تحديث route: DELETE /api/v1/posts/:postId للحذف الناعم
- [ ] إضافة Validators
- [ ] تشغيل سكريبت الترحيل
- [ ] اختبار جميع الـ endpoints
- [ ] تحديث التوثيق (Documentation)

---

## 🎯 النتيجة النهائية

بعد تطبيق هذه التحديثات، ستدعم الواجهة الخلفية:

✅ حالات الحراج الثلاث: متاح، تم البيع، محذوف  
✅ تحديث حالة منشورات الحراج من الواجهة الأمامية  
✅ إخفاء المنشورات المحذوفة من العرض العام  
✅ عرض المنشورات المحذوفة للمالك في البروفايل  
✅ التوافق الكامل مع الواجهة الأمامية المحدثة  

---

**تاريخ التحديث:** فبراير 2026  
**الإصدار:** 2.0
