# 🔢 حالة عدادات الوظائف (Badge Counters)

## 📅 تاريخ المراجعة
1 فبراير 2026

---

## ✅ الميزات الموجودة في الـ Backend

### 1. API Endpoint موجود
```
GET /api/v1/posts/counts
```

**الملف:** `src/controllers/postCountController.js`  
**الحالة:** ✅ يعمل بشكل كامل

### 2. البيانات المتوفرة حالياً

```json
{
  "success": true,
  "data": {
    "jobs": {
      "total": 150,
      "seeker": 80,
      "employer": 70,
      "categories": {
        "سائق خاص": { "seeker": 10, "employer": 5, "total": 15 },
        "طباخ": { "seeker": 8, "employer": 4, "total": 12 },
        "برمجة وتقنية": { "seeker": 15, "employer": 10, "total": 25 },
        "هندسة ومقاولات": { ... },
        "إدارة ومحاسبة": { ... }
        // ... 14 فئة إجمالية
      }
    },
    "haraj": {
      "total": 200,
      "categories": {
        "سيارات ومركبات": 50,
        "عقارات وأراضي": 40,
        "أجهزة وإلكترونيات": 30
        // ... بقية فئات الحراج
      }
    }
  }
}
```

---

## 🔴 المطلوب إضافته

### 1. عدادات الوظائف المستعجلة

#### أ) العدد الإجمالي
```javascript
const urgentJobsTotalCount = await Post.countDocuments({
  displayPage: 'urgent',
  isShort: { $ne: true }
});
```

#### ب) التقسيم حسب نوع الاستعجال
```javascript
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
```

#### الناتج المتوقع:
```json
{
  "urgent": {
    "total": 45,
    "byTag": {
      "مطلوب الآن": 20,
      "عقود مؤقتة": 15,
      "دفع يومي": 10
    }
  }
}
```

---

### 2. عدادات الوظائف العالمية (Global Jobs)

#### أ) العدد الإجمالي
```javascript
const globalJobsTotalCount = await Post.countDocuments({
  isGlobalJob: true,
  isShort: { $ne: true }
});
```

#### ب) التقسيم حسب الموقع (أفضل 10 دول)
```javascript
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
    $limit: 10
  }
]);

// تحويل إلى Object
const globalJobsByLocationObj = {};
globalJobsByLocation.forEach(item => {
  globalJobsByLocationObj[item._id] = item.count;
});
```

#### الناتج المتوقع:
```json
{
  "globalJobs": {
    "total": 30,
    "byLocation": {
      "United Arab Emirates": 12,
      "Saudi Arabia": 10,
      "Kuwait": 5,
      "Qatar": 3
    }
  }
}
```

---

## 📝 الكود الكامل للتحديث

### ملف: `src/controllers/postCountController.js`

```javascript
const Post = require('../models/Post');

// @desc    Get post counts for badges
// @route   GET /api/v1/posts/counts
// @access  Public
exports.getPostCounts = async (req, res) => {
  try {
    // ============================================
    // 1. الوظائف العادية
    // ============================================
    
    const jobsSeekerCount = await Post.countDocuments({
      displayPage: 'jobs',
      title: { $regex: 'ابحث عن وظيفة|أبحث عن وظيفة', $options: 'i' },
      isShort: { $ne: true }
    });

    const jobsEmployerCount = await Post.countDocuments({
      displayPage: 'jobs',
      title: { $regex: 'ابحث عن موظفين|أبحث عن موظفين', $options: 'i' },
      isShort: { $ne: true }
    });

    const jobsTotalCount = await Post.countDocuments({
      displayPage: 'jobs',
      isShort: { $ne: true }
    });

    // التصنيفات
    const jobCategoryMappings = {
      'سائق خاص': ['سائق خاص', 'سائق'],
      'طباخ': ['طباخ'],
      'برمجة وتقنية': ['برمجة وتقنية', 'مبرمج', 'تقنية']
      // ... بقية الفئات
    };

    const jobCategoryCounts = {};
    for (const [displayName, possibleValues] of Object.entries(jobCategoryMappings)) {
      const seekerCount = await Post.countDocuments({
        displayPage: 'jobs',
        category: { $in: possibleValues },
        title: { $regex: 'ابحث عن وظيفة|أبحث عن وظيفة', $options: 'i' },
        isShort: { $ne: true }
      });
      const employerCount = await Post.countDocuments({
        displayPage: 'jobs',
        category: { $in: possibleValues },
        title: { $regex: 'ابحث عن موظفين|أبحث عن موظفين', $options: 'i' },
        isShort: { $ne: true }
      });
      jobCategoryCounts[displayName] = {
        seeker: seekerCount,
        employer: employerCount,
        total: seekerCount + employerCount
      };
    }

    // ============================================
    // 2. الحراج
    // ============================================
    
    const harajTotalCount = await Post.countDocuments({
      displayPage: 'haraj',
      isShort: { $ne: true }
    });

    const harajCategories = [
      'عقارات وأراضي', 'سيارات ومركبات', 'معدات ثقيلة وشاحنات',
      'أعمال وتجارة', 'مقاولات وبناء', 'أجهزة وإلكترونيات'
    ];

    const harajCategoryCounts = {};
    for (const category of harajCategories) {
      const count = await Post.countDocuments({
        displayPage: 'haraj',
        category: category,
        isShort: { $ne: true }
      });
      harajCategoryCounts[category] = count;
    }

    // ============================================
    // 3. الوظائف المستعجلة ⭐ جديد
    // ============================================
    
    const urgentJobsTotalCount = await Post.countDocuments({
      displayPage: 'urgent',
      isShort: { $ne: true }
    });

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

    // ============================================
    // 4. الوظائف العالمية ⭐ جديد
    // ============================================
    
    const globalJobsTotalCount = await Post.countDocuments({
      isGlobalJob: true,
      isShort: { $ne: true }
    });

    // التقسيم حسب الموقع (أفضل 10 دول)
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
        $limit: 10
      }
    ]);

    const globalJobsByLocationObj = {};
    globalJobsByLocation.forEach(item => {
      globalJobsByLocationObj[item._id] = item.count;
    });

    // ============================================
    // الاستجابة النهائية
    // ============================================
    
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
        urgent: {
          total: urgentJobsTotalCount,
          byTag: urgentJobsByTag
        },
        globalJobs: {
          total: globalJobsTotalCount,
          byLocation: globalJobsByLocationObj
        }
      }
    });

  } catch (error) {
    console.error('Error getting post counts:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب عدد المنشورات'
    });
  }
};
```

---

## 🎯 خطة التنفيذ

### الخطوة 1: تحديث Backend
```bash
# في مستودع mehnati-backend
cd /path/to/mehnati-backend
```

افتح `src/controllers/postCountController.js` وأضف الكود أعلاه.

### الخطوة 2: اختبار API
```bash
curl http://localhost:5000/api/v1/posts/counts
```

### الخطوة 3: تحديث Frontend
في ملف `App.tsx` أو `BottomNav.tsx`:

```typescript
interface PostCounts {
  jobs: {
    total: number;
    seeker: number;
    employer: number;
    categories: Record<string, { seeker: number; employer: number; total: number }>;
  };
  haraj: {
    total: number;
    categories: Record<string, number>;
  };
  urgent: {
    total: number;
    byTag: Record<string, number>;
  };
  globalJobs: {
    total: number;
    byLocation: Record<string, number>;
  };
}

// جلب العدادات
const fetchCounts = async () => {
  const res = await fetch(`${API_BASE_URL}/api/v1/posts/counts`);
  const data = await res.json();
  if (data.success) {
    setCounts(data.data);
  }
};

useEffect(() => {
  fetchCounts();
  // تحديث كل 30 ثانية
  const interval = setInterval(fetchCounts, 30000);
  return () => clearInterval(interval);
}, []);
```

### الخطوة 4: عرض الأرقام على الأيقونات

```tsx
{/* أيقونة الوظائف العادية */}
<div className="relative">
  <Briefcase className="w-6 h-6" />
  {counts?.jobs?.total > 0 && (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {counts.jobs.total}
    </span>
  )}
</div>

{/* أيقونة الوظائف المستعجلة */}
<div className="relative">
  <Zap className="w-6 h-6" />
  {counts?.urgent?.total > 0 && (
    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {counts.urgent.total}
    </span>
  )}
</div>

{/* أيقونة الوظائف العالمية */}
<div className="relative">
  <Globe className="w-6 h-6" />
  {counts?.globalJobs?.total > 0 && (
    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {counts.globalJobs.total}
    </span>
  )}
</div>
```

---

## 📊 مثال على الاستجابة الكاملة

```json
{
  "success": true,
  "data": {
    "jobs": {
      "total": 150,
      "seeker": 80,
      "employer": 70,
      "categories": {
        "سائق خاص": { "seeker": 10, "employer": 5, "total": 15 },
        "طباخ": { "seeker": 8, "employer": 4, "total": 12 }
      }
    },
    "haraj": {
      "total": 200,
      "categories": {
        "سيارات ومركبات": 50,
        "عقارات وأراضي": 40
      }
    },
    "urgent": {
      "total": 45,
      "byTag": {
        "مطلوب الآن": 20,
        "عقود مؤقتة": 15,
        "دفع يومي": 10
      }
    },
    "globalJobs": {
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

---

## ✅ الخلاصة

| الميزة | الحالة | ملاحظات |
|-------|--------|---------|
| API عدادات الوظائف العادية | ✅ موجود | يعمل بشكل كامل |
| عدادات حسب الفئات (سائق، طباخ) | ✅ موجود | 14 فئة |
| عدادات الحراج | ✅ موجود | يعمل بشكل كامل |
| عدادات الوظائف المستعجلة | 🔴 مطلوب إضافته | الكود جاهز أعلاه |
| عدادات الوظائف العالمية | 🔴 مطلوب إضافته | الكود جاهز أعلاه |

**الوقت المتوقع للتطبيق:** 15-20 دقيقة  
**الصعوبة:** سهل - مجرد إضافة queries إضافية
