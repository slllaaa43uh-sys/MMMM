# 🤖 مطالبة للذكاء الاصطناعي - تحديث الواجهة الخلفية

## المشكلة الحالية ❌
شارة "تم البيع" لا تظهر في الواجهة الأمامية لأن البيانات القادمة من API لا تحتوي على:
- `type: 'haraj'`
- `harajStatus: 'sold'`

## المطلوب بالضبط ✅

### 1️⃣ تحديث نموذج Post في قاعدة البيانات

```javascript
// في ملف models/Post.js أو ما يعادله

const postSchema = new mongoose.Schema({
  // ... الحقول الموجودة ...
  
  // إضافة/تحديث هذه الحقول:
  type: {
    type: String,
    enum: ['general', 'job', 'haraj'],
    required: true,
    default: 'general'
  },
  
  jobStatus: {
    type: String,
    enum: ['open', 'negotiating', 'hired'],
    default: 'open'
  },
  
  // ⭐ الحقل الجديد المهم
  harajStatus: {
    type: String,
    enum: ['available', 'sold', 'deleted'],
    default: 'available'
  }
});
```

### 2️⃣ تحديث endpoint إنشاء المنشورات

```javascript
// POST /api/v1/posts

router.post('/posts', authenticate, upload, async (req, res) => {
  const { category, type, ...otherFields } = req.body;
  
  // قوائم الفئات
  const HARAJ_CATEGORIES = [
    'سيارات', 'عقارات', 'أجهزة منزلية', 'أثاث ومفروشات', 
    'جوالات', 'لابتوبات وكمبيوتر', 'كاميرات وتصوير', 'ألعاب فيديو',
    'ملابس وموضة', 'ساعات ومجوهرات', 'حيوانات أليفة', 'طيور',
    'معدات ثقيلة', 'قطع غيار', 'تحف ومقتنيات', 'كتب ومجلات',
    'أدوات رياضية', 'مستلزمات أطفال', 'خيم وتخييم', 'أرقام مميزة',
    'نقل عفش', 'أدوات أخرى'
  ];
  
  // ⭐ تحديد النوع تلقائياً
  let postType = type || 'general';
  if (!type && category && HARAJ_CATEGORIES.includes(category)) {
    postType = 'haraj';
  }
  
  const newPost = new Post({
    ...otherFields,
    category,
    type: postType,
    // ⭐ تعيين الحالة الافتراضية
    harajStatus: postType === 'haraj' ? 'available' : undefined
  });
  
  await newPost.save();
  res.status(201).json(newPost);
});
```

### 3️⃣ إضافة endpoint جديد لتحديث حالة الحراج

```javascript
// ⭐ PUT /api/v1/posts/:postId/haraj-status

router.put('/posts/:postId/haraj-status', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const { status } = req.body; // 'sold' أو 'available'
    
    // التحقق
    if (!['available', 'sold'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    // التحقق من الملكية
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // ⭐ تحديث الحالة
    post.harajStatus = status;
    await post.save();
    
    res.json({ success: true, harajStatus: status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 4️⃣ تحديث جميع endpoints لإرجاع harajStatus

```javascript
// GET /api/v1/posts
// GET /api/v1/posts/user/:userId
// GET /api/v1/posts/:postId

// تأكد من إرجاع الحقول التالية:
const posts = await Post.find(query)
  .populate('user', 'name avatar')
  .select('text content media type category jobStatus harajStatus ...')
  .lean();

// ⭐ مثال على البيانات المرجعة:
{
  "_id": "123",
  "text": "سيارة للبيع",
  "category": "سيارات",
  "type": "haraj",           // ⭐ مهم
  "harajStatus": "sold",     // ⭐ مهم جداً
  "user": { ... },
  ...
}
```

### 5️⃣ سكريبت الترحيل للبيانات الموجودة

```javascript
// scripts/migrate-haraj-posts.js

const Post = require('./models/Post');

async function migrateHarajPosts() {
  const HARAJ_CATEGORIES = [
    'سيارات', 'عقارات', 'أجهزة منزلية', 'أثاث ومفروشات',
    'جوالات', 'لابتوبات وكمبيوتر', 'كاميرات وتصوير', 'ألعاب فيديو',
    'ملابس وموضة', 'ساعات ومجوهرات', 'حيوانات أليفة', 'طيور',
    'معدات ثقيلة', 'قطع غيار', 'تحف ومقتنيات', 'كتب ومجلات',
    'أدوات رياضية', 'مستلزمات أطفال', 'خيم وتخييم', 'أرقام مميزة',
    'نقل عفش', 'أدوات أخرى'
  ];
  
  // 1. تحديث جميع منشورات الحراج
  const result = await Post.updateMany(
    { category: { $in: HARAJ_CATEGORIES } },
    { 
      $set: { 
        type: 'haraj',
        harajStatus: 'available' 
      } 
    }
  );
  
  console.log(`✅ Updated ${result.modifiedCount} haraj posts`);
}

// تشغيل السكريبت
migrateHarajPosts();
```

## 📋 Checklist للتطبيق

- [ ] 1. تحديث نموذج Post بإضافة `harajStatus`
- [ ] 2. إضافة endpoint: `PUT /api/v1/posts/:postId/haraj-status`
- [ ] 3. تحديث POST /api/v1/posts لتعيين `type: 'haraj'` تلقائياً
- [ ] 4. تحديث GET endpoints لإرجاع `type` و `harajStatus`
- [ ] 5. تشغيل سكريبت الترحيل للبيانات الموجودة
- [ ] 6. اختبار API وإرجاع البيانات

## 🧪 اختبار البيانات

### بعد التطبيق، يجب أن ترجع API:

```json
{
  "posts": [
    {
      "_id": "67890",
      "text": "سيارة للبيع - كامري 2020",
      "category": "سيارات",
      "type": "haraj",           
      "harajStatus": "available",
      "user": {
        "_id": "12345",
        "name": "أحمد",
        "avatar": "/uploads/avatar.jpg"
      },
      "media": [...],
      "createdAt": "2026-02-01T10:00:00Z",
      ...
    }
  ]
}
```

### عند تغيير الحالة:

```bash
curl -X PUT http://localhost:5000/api/v1/posts/67890/haraj-status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "sold"}'
```

يجب أن يرجع:
```json
{
  "success": true,
  "harajStatus": "sold"
}
```

## ⚠️ ملاحظات مهمة جداً

1. **type يجب أن يكون 'haraj'** للمنشورات من الفئات المذكورة
2. **harajStatus يجب أن يكون موجود دائماً** في response
3. **القيمة الافتراضية** لـ harajStatus هي 'available'
4. **عند الحذف** يمكن تغيير harajStatus إلى 'deleted' بدلاً من حذف المنشور
5. **التحقق من الملكية** مهم جداً في endpoint التحديث

## 🎯 ما الذي ستفعله الواجهة الأمامية

الواجهة الأمامية تتحقق من المنشور بهذه الطريقة:

```typescript
const isHarajPost = (post) => {
  // 1. تحقق من type
  if (post.type === 'haraj') return true;
  
  // 2. أو تحقق من category
  const HARAJ_CATEGORIES = ['سيارات', 'عقارات', ...];
  return HARAJ_CATEGORIES.includes(post.category);
};

// عرض الشارة
{isHarajPost(post) && post.harajStatus === 'sold' && (
  <span>تم البيع</span>
)}
```

## 📊 مثال على البيانات الصحيحة

### منشور حراج متاح:
```json
{
  "_id": "post1",
  "text": "للبيع آيفون 13",
  "category": "جوالات",
  "type": "haraj",
  "harajStatus": "available",
  ...
}
```

### منشور حراج تم بيعه:
```json
{
  "_id": "post2",
  "text": "للبيع سيارة كامري",
  "category": "سيارات",
  "type": "haraj",
  "harajStatus": "sold",     // ⭐ هذا ما يجب أن يظهر الشارة
  ...
}
```

### منشور وظيفة (ليس حراج):
```json
{
  "_id": "post3",
  "text": "مطلوب سائق",
  "category": "سائق خاص",
  "type": "job",
  "jobStatus": "open",
  "harajStatus": undefined,  // لا يحتاج
  ...
}
```

---

## 🚀 خطوات سريعة للتطبيق

1. **افتح ملف نموذج Post** → أضف `harajStatus`
2. **افتح routes/posts.js** → أضف endpoint التحديث
3. **حدّث POST endpoint** → عيّن `type: 'haraj'` تلقائياً
4. **حدّث GET endpoints** → أرجع `type` و `harajStatus`
5. **شغّل سكريبت الترحيل** → `node scripts/migrate-haraj-posts.js`
6. **اختبر API** → تأكد من إرجاع البيانات الصحيحة

---

**التاريخ**: 1 فبراير 2026  
**الأولوية**: عالية جداً ⚠️  
**الحالة**: جاهز للتطبيق ✅
