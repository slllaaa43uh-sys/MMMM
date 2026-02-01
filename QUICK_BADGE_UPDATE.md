# 🔢 تحديث سريع: إضافة عدادات للوظائف المستعجلة والعالمية

## ⏱️ الوقت المطلوب: 10 دقائق

---

## 📍 الملف المطلوب تعديله

```
mehnati-backend/src/controllers/postCountController.js
```

---

## ✏️ الكود المطلوب إضافته

### 1. بعد السطر 37 (بعد `harajTotalCount`)، أضف:

```javascript
    // ============================================
    // 3. الوظائف المستعجلة
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
    // 4. الوظائف العالمية
    // ============================================
    
    const globalJobsTotalCount = await Post.countDocuments({
      isGlobalJob: true,
      isShort: { $ne: true }
    });

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
```

---

### 2. في السطر 148 (في `res.status(200).json`)، استبدل الاستجابة بـ:

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
        urgent: {                        // ⭐ جديد
          total: urgentJobsTotalCount,
          byTag: urgentJobsByTag
        },
        globalJobs: {                    // ⭐ جديد
          total: globalJobsTotalCount,
          byLocation: globalJobsByLocationObj
        }
      }
    });
```

---

## ✅ اختبار

```bash
# اختبار الـ API
curl http://localhost:5000/api/v1/posts/counts

# الاستجابة المتوقعة:
{
  "success": true,
  "data": {
    "jobs": { "total": 150, ... },
    "haraj": { "total": 200, ... },
    "urgent": {                     // ⭐ جديد
      "total": 45,
      "byTag": {
        "مطلوب الآن": 20,
        "عقود مؤقتة": 15,
        "دفع يومي": 10
      }
    },
    "globalJobs": {                 // ⭐ جديد
      "total": 30,
      "byLocation": {
        "United Arab Emirates": 12,
        "Saudi Arabia": 10
      }
    }
  }
}
```

---

## 🎯 ملخص

✅ **الميزة الأساسية موجودة بالفعل** - فقط نحتاج إضافة عدادين جديدين  
✅ **كود جاهز للنسخ واللصق** - 10 دقائق فقط  
✅ **لا يؤثر على الكود الموجود** - إضافة فقط بدون تعديل  
✅ **يعمل مع Frontend الموجود** - API متوافق تماماً
