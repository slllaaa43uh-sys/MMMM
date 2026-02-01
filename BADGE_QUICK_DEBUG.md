# 🔧 سكريبت اختبار سريع للباك إند

## اختبار 1: تحقق من وجود الـ endpoint

```bash
# من الترمنال، شغل هذا الأمر:
curl http://localhost:5001/api/v1/posts/counts

# أو إذا كان البورت مختلف:
curl http://localhost:5000/api/v1/posts/counts
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": {
    "jobs": { "total": 15, ... },
    "haraj": { "total": 8, ... }
  }
}
```

---

## اختبار 2: من JavaScript في Console المتصفح

```javascript
// افتح Console (F12) واكتب:
await fetch('http://localhost:5001/api/v1/posts/counts')
  .then(r => r.json())
  .then(data => {
    console.log('✅ API Response:', data);
    return data;
  })
  .catch(err => {
    console.error('❌ Error:', err);
  });
```

---

## اختبار 3: استخدام البادج سيرفس مباشرة

```javascript
// في Console المتصفح:
import { BadgeCounterService } from './services/badgeCounterService';

// جلب البيانات
const result = await BadgeCounterService.fetchPostCounts();
console.log('📊 Result:', result);

// قراءة الأعداد
console.log('💼 Jobs:', BadgeCounterService.getJobsTotalCount());
console.log('🏪 Haraj:', BadgeCounterService.getHarajTotalCount());
console.log('⚡ Urgent:', BadgeCounterService.getUrgentTotalCount());
console.log('🌍 Global:', BadgeCounterService.getGlobalJobsTotalCount());
```

---

## 🐛 إذا كان الخطأ: "CORS policy"

**الحل في الباك إند:**

```javascript
// في server.js أو app.js
const cors = require('cors');

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Vite ports
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 🐛 إذا كان الخطأ: "404 Not Found"

معناها الـ endpoint غير موجود في الباك إند.

**أضف هذا في routes:**

```javascript
// في routes/posts.js أو routes/api.js
router.get('/posts/counts', async (req, res) => {
    try {
        // Count jobs
        const jobsSeeker = await Post.countDocuments({ 
            type: 'job', 
            category: 'seeker',
            jobStatus: 'open' 
        });
        const jobsEmployer = await Post.countDocuments({ 
            type: 'job', 
            category: 'employer',
            jobStatus: 'open' 
        });
        const jobsTotal = jobsSeeker + jobsEmployer;

        // Count haraj
        const harajTotal = await Post.countDocuments({ 
            type: 'haraj',
            harajStatus: 'available' 
        });

        // Count urgent (optional)
        const urgentTotal = await Post.countDocuments({ 
            displayPage: 'urgent',
            jobStatus: 'open' 
        });

        // Count global jobs (optional)
        const globalTotal = await Post.countDocuments({ 
            type: 'global_job',
            jobStatus: 'open' 
        });

        res.json({
            success: true,
            data: {
                jobs: {
                    total: jobsTotal,
                    seeker: jobsSeeker,
                    employer: jobsEmployer,
                    categories: {}
                },
                haraj: {
                    total: harajTotal,
                    categories: {}
                },
                urgent: {
                    total: urgentTotal
                },
                globalJobs: {
                    total: globalTotal
                }
            }
        });
    } catch (error) {
        console.error('Error fetching counts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch counts' 
        });
    }
});

module.exports = router;
```

---

## 🔍 فحص البيانات في قاعدة البيانات

```javascript
// إذا كنت تستخدم MongoDB Compass أو mongosh:

// عدد الوظائف
db.posts.countDocuments({ type: 'job', jobStatus: 'open' })

// عدد الحراج
db.posts.countDocuments({ type: 'haraj', harajStatus: 'available' })

// عرض أمثلة
db.posts.find({ type: 'job' }).limit(5)
```

---

## 📊 اختبار كامل من Console

```javascript
// نسخ والصق هذا في Console:
(async () => {
    console.log('🔍 Starting Badge Counter Test...\n');
    
    // 1. Test API directly
    console.log('1️⃣ Testing API endpoint...');
    try {
        const response = await fetch('http://localhost:5001/api/v1/posts/counts');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Response:', data);
            
            // 2. Check data structure
            console.log('\n2️⃣ Data Structure:');
            console.log('Jobs:', data.data?.jobs);
            console.log('Haraj:', data.data?.haraj);
            console.log('Urgent:', data.data?.urgent);
            console.log('Global:', data.data?.globalJobs);
            
            // 3. Extract numbers
            console.log('\n3️⃣ Extracted Numbers:');
            const jobs = data.data?.jobs?.total || 0;
            const haraj = data.data?.haraj?.total || 0;
            const urgent = data.data?.urgent?.total || 0;
            const global = data.data?.globalJobs?.total || 0;
            
            console.log('💼 Jobs Total:', jobs);
            console.log('🏪 Haraj Total:', haraj);
            console.log('⚡ Urgent Total:', urgent);
            console.log('🌍 Global Total:', global);
            
            // 4. Check if any number > 0
            console.log('\n4️⃣ Validation:');
            if (jobs > 0 || haraj > 0 || urgent > 0 || global > 0) {
                console.log('✅ Numbers exist! Badges should display.');
            } else {
                console.warn('⚠️ All numbers are 0. No badges will show.');
                console.log('💡 Add some posts to see badges.');
            }
        } else {
            console.error('❌ API Error:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('❌ Fetch Error:', error.message);
        console.log('\n💡 Possible reasons:');
        console.log('- Backend not running');
        console.log('- Wrong API_BASE_URL');
        console.log('- CORS issue');
        console.log('- Network problem');
    }
    
    console.log('\n✨ Test Complete!');
})();
```

---

## 🎯 الخطوات التالية

### إذا API يعمل وترجع أرقام > 0 لكن البادجات لا تظهر:

1. **تحقق من BottomNav:**
   ```javascript
   // في Console:
   document.querySelectorAll('.badge-number').length
   // يجب أن يكون > 0
   ```

2. **تحقق من State:**
   - افتح React DevTools
   - ابحث عن BottomNav component
   - تحقق من state: jobsCount, harajCount, etc.

3. **تحقق من CSS:**
   ```javascript
   // في Console:
   const badges = document.querySelectorAll('[class*="bg-red-500"]');
   console.log('Badges found:', badges.length);
   badges.forEach(b => console.log('Badge:', b.textContent, b.style));
   ```

---

## 📞 الدعم

إذا جربت كل هذا ولم يعمل، أرسل لي:

1. **النتيجة من Console عند تحميل الصفحة**
2. **نتيجة اختبار API من الترمنال:**
   ```bash
   curl http://localhost:5001/api/v1/posts/counts
   ```
3. **Screenshot من DevTools → Network → اختر الـ request للـ counts**

وسأساعدك مباشرة! 🚀
