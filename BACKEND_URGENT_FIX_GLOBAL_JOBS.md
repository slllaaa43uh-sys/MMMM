# 🔴 تحديث عاجل مطلوب في Backend - فلترة الوظائف العالمية

## المشكلة
الوظائف العالمية (isGlobalJob: true) كانت تظهر في صفحة الوظائف العادية عند البحث بالـ category.

## الحل المطلوب

في ملف **`src/controllers/postController.js`** - دالة `getPosts`:

### الكود الحالي (قبل التعديل):

```javascript
const getPosts = async (req, res) => {
  try {
    const { category, postType, country, city, isGlobalJob, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    
    if (category) filter.category = category;
    if (postType) filter.title = postType;
    if (country && country !== '') filter.country = country;
    if (city && city !== '') filter.city = city;
    
    // إذا كان البحث عن الوظائف العالمية فقط
    if (isGlobalJob === 'true') {
      filter.isGlobalJob = true;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const posts = await Post.find(filter)
      .populate('user', 'name avatar email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalPosts = await Post.countDocuments(filter);
    
    res.status(200).json({ 
      success: true, 
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        totalPosts,
        hasMore: skip + posts.length < totalPosts
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### ✅ الكود الجديد (بعد التعديل):

```javascript
const getPosts = async (req, res) => {
  try {
    const { category, postType, country, city, isGlobalJob, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    
    // ⭐⭐⭐ CRITICAL FIX: استبعاد الوظائف العالمية من البحث العادي ⭐⭐⭐
    // إذا كان البحث في صفحة الوظائف العادية (مع category وبدون isGlobalJob)
    // يجب استبعاد جميع المنشورات التي isGlobalJob: true
    if (category && isGlobalJob !== 'true') {
      filter.isGlobalJob = { $ne: true };
    }
    
    // إذا كان البحث صريح عن الوظائف العالمية فقط
    if (isGlobalJob === 'true') {
      filter.isGlobalJob = true;
    }
    
    if (category) filter.category = category;
    if (postType) filter.title = postType;
    if (country && country !== '') filter.country = country;
    if (city && city !== '') filter.city = city;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const posts = await Post.find(filter)
      .populate('user', 'name avatar email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalPosts = await Post.countDocuments(filter);
    
    res.status(200).json({ 
      success: true, 
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        totalPosts,
        hasMore: skip + posts.length < totalPosts
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
```

## الفرق الرئيسي

**السطر المضاف:**
```javascript
// إذا كان البحث في صفحة الوظائف العادية، استبعد الوظائف العالمية
if (category && isGlobalJob !== 'true') {
  filter.isGlobalJob = { $ne: true };
}
```

### شرح المنطق:

1. **إذا كان هناك `category` في البحث** (يعني المستخدم يبحث في الوظائف العادية)
2. **وليس هناك `isGlobalJob=true`** (يعني ليس بحث صريح عن الوظائف العالمية)
3. **أضف شرط:** `isGlobalJob: { $ne: true }` (استبعد جميع المنشورات التي isGlobalJob = true)

### نتائج هذا التعديل:

| الطلب | النتيجة |
|-------|---------|
| `GET /api/v1/posts?category=سائق خاص` | ✅ يعرض الوظائف العادية فقط (يستبعد isGlobalJob: true) |
| `GET /api/v1/posts?isGlobalJob=true` | ✅ يعرض الوظائف العالمية فقط |
| `GET /api/v1/posts` | ✅ يعرض كل المنشورات (العادية + العالمية) |
| `GET /api/v1/posts?category=طباخ&postType=ابحث عن موظفين` | ✅ وظائف عادية فقط |

---

## اختبار التعديل

### 1. اختبار استبعاد الوظائف العالمية من البحث العادي:

```bash
curl -X GET "http://localhost:5000/api/v1/posts?category=سائق خاص" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**النتيجة المتوقعة:**
- يجب أن تعود جميع المنشورات التي `category = "سائق خاص"` و `isGlobalJob != true`
- يجب ألا تظهر أي منشورات فيها `isGlobalJob: true`

### 2. اختبار جلب الوظائف العالمية فقط:

```bash
curl -X GET "http://localhost:5000/api/v1/posts?isGlobalJob=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**النتيجة المتوقعة:**
- جميع المنشورات التي `isGlobalJob: true` فقط
- لا تظهر أي منشورات عادية

### 3. اختبار جلب جميع المنشورات (بدون فلتر):

```bash
curl -X GET "http://localhost:5000/api/v1/posts" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**النتيجة المتوقعة:**
- جميع المنشورات (عادية + عالمية)

---

## أمثلة عملية

### مثال 1: البحث عن سائق خاص في صفحة الوظائف العادية

**Request:**
```
GET /api/v1/posts?category=سائق خاص&postType=ابحث عن موظفين&country=السعودية
```

**MongoDB Query (بعد التعديل):**
```javascript
{
  isGlobalJob: { $ne: true },  // ⭐ جديد - يستبعد الوظائف العالمية
  category: "سائق خاص",
  title: "ابحث عن موظفين",
  country: "السعودية"
}
```

### مثال 2: جلب الوظائف العالمية

**Request:**
```
GET /api/v1/posts?isGlobalJob=true&page=1&limit=20
```

**MongoDB Query:**
```javascript
{
  isGlobalJob: true  // فقط الوظائف العالمية
}
```

---

## ملاحظات مهمة

1. **هذا التعديل ضروري للأمان:**
   - الفلتر في Frontend يمكن تجاوزه بسهولة
   - يجب تطبيق الفلتر في Backend لضمان فصل الصفحتين

2. **لا يؤثر على الأداء:**
   - استخدام `{ $ne: true }` فعّال في MongoDB
   - يمكن إضافة Index على `isGlobalJob` لتحسين الأداء:
   ```javascript
   PostSchema.index({ isGlobalJob: 1, category: 1, createdAt: -1 });
   ```

3. **متوافق مع الكود الحالي:**
   - لا يكسر أي Endpoint موجود
   - يضيف فقط فلتر إضافي للبحث بالـ category

---

## خطوات التطبيق

1. ✅ افتح ملف `src/controllers/postController.js`
2. ✅ ابحث عن دالة `getPosts`
3. ✅ أضف السطور التالية **قبل** تعيين الفلاتر:
   ```javascript
   if (category && isGlobalJob !== 'true') {
     filter.isGlobalJob = { $ne: true };
   }
   ```
4. ✅ احفظ الملف
5. ✅ أعد تشغيل الـ Backend:
   ```bash
   cd mehnati-backend
   npm restart
   # أو
   pm2 restart mehnati-backend
   ```
6. ✅ اختبر الـ API باستخدام الأمثلة أعلاه

---

## التحقق من نجاح التعديل

### قبل التعديل:
```bash
GET /api/v1/posts?category=سائق خاص
# النتيجة: 10 منشورات (8 عادية + 2 عالمية) ❌
```

### بعد التعديل:
```bash
GET /api/v1/posts?category=سائق خاص
# النتيجة: 8 منشورات (عادية فقط) ✅
```

```bash
GET /api/v1/posts?isGlobalJob=true
# النتيجة: 2 منشورات (عالمية فقط) ✅
```

---

## الخلاصة

هذا التعديل البسيط يحل المشكلة بشكل جذري:
- ✅ الوظائف العالمية لن تظهر في صفحة الوظائف العادية
- ✅ الوظائف العادية لن تظهر في صفحة الوظائف العالمية
- ✅ كل صفحة مستقلة تماماً عن الأخرى
- ✅ الأمان محفوظ في الـ Backend
