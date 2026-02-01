# مطالبات AI - Google Sign-In Implementation

---

## 🎯 المطالبة 1: Frontend (React) - LoginPage.tsx

```
أريدك أن تضيف ميزة تسجيل الدخول بـ Google في صفحة تسجيل الدخول (LoginPage.tsx) بالمواصفات التالية:

### المطلوب:
1. إضافة زر "تسجيل الدخول بـ Google" مع أيقونة Google
2. عند الضغط على الزر، يفتح نافذة منبثقة (Popup) لاختيار حساب Google (وليس صفحة جديدة)
3. المستخدم يختار حساب Google من النافذة المنبثقة
4. بعد الاختيار، تختفي النافذة المنبثقة تلقائياً
5. يظهر محمل دائري (Spinner) على الزر أثناء المعالجة
6. في حالة النجاح:
   - إرسال Google ID Token إلى Backend: `POST /api/v1/auth/google-signin`
   - حفظ JWT Token المُرجع في localStorage
   - حفظ بيانات المستخدم في localStorage بما في ذلك صورة الملف الشخصي
   - الانتقال إلى الصفحة الرئيسية
7. في حالة الفشل: عرض رسالة خطأ مناسبة

### الـ Firebase Config الموجود:
- Project ID: mehnati-d7ab9
- API Key: AIzaSyCuH5K2NQhtLmeFtJ19ylnZ3FdcJ_AuOdU
- Web Client ID: 951669845862-ijkmvh127cro19u3d3gkmhb3a2t4l2vi.apps.googleusercontent.com

### التفاصيل التقنية:
1. استخدم `signInWithPopup` من Firebase Auth (وليس signInWithRedirect)
2. استخدم `GoogleAuthProvider` مع إعداد `prompt: 'select_account'`
3. بعد نجاح تسجيل الدخول، احصل على:
   - displayName (الاسم)
   - email (البريد الإلكتروني)
   - photoURL (⭐ صورة الملف الشخصي)
   - uid (Firebase UID)
4. احصل على ID Token: `await user.getIdToken()`
5. أرسل الطلب للـ Backend:
   ```javascript
   POST /api/v1/auth/google-signin
   Body: {
     idToken: "...",
     fcmToken: localStorage.getItem('fcmToken') // اختياري
   }
   ```
6. احفظ البيانات المُرجعة:
   ```javascript
   localStorage.setItem('token', data.token);
   localStorage.setItem('user', JSON.stringify({
     id: data.user.id,
     name: data.user.name,
     email: data.user.email,
     profileImage: data.user.profileImage, // ⭐ صورة Google
     phoneNumber: data.user.phoneNumber,
     isGoogleUser: true
   }));
   ```

### تصميم الزر:
- العرض الكامل مع أيقونة Google الملونة على اليسار
- نص "تسجيل الدخول بـ Google"
- حدود رمادية فاتحة، خلفية بيضاء
- hover: خلفية رمادية فاتحة جداً
- عند التحميل: إظهار Loader بدلاً من الأيقونة والنص

### معالجة الأخطاء:
- `auth/popup-closed-by-user`: "تم إلغاء تسجيل الدخول"
- `auth/cancelled-popup-request`: تجاهل (المستخدم أغلق النافذة)
- `auth/network-request-failed`: "خطأ في الاتصال بالإنترنت"
- خطأ Backend: عرض رسالة الخطأ من Server
- أخطاء أخرى: "فشل تسجيل الدخول بـ Google. حاول مرة أخرى."

### الموقع:
- أضف الزر في أعلى صفحة تسجيل الدخول
- أضف خط فاصل بعده مع كلمة "أو"
- ثم باقي نموذج تسجيل الدخول العادي (رقم الهاتف/كلمة المرور)

### ملاحظات:
- تأكد من استيراد الدوال المطلوبة من Firebase:
  ```typescript
  import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
  import { auth, googleProvider } from '../firebase-init';
  ```
- استخدم `useState` لإدارة حالة التحميل: `const [googleLoading, setGoogleLoading] = useState(false);`
- تأكد من تعطيل الزر أثناء التحميل: `disabled={googleLoading}`
```

---

## 🎯 المطالبة 2: Frontend - عرض الصورة في الواجهة

```
أريدك أن تعرض صورة المستخدم من Google في جميع الأماكن التالية:

### 1. Header Component (رأس الصفحة):
- اقرأ بيانات المستخدم من localStorage:
  ```typescript
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  ```
- اعرض صورة دائرية في الزاوية العليا:
  ```tsx
  <img 
    src={user.profileImage || '/default-avatar.png'} 
    alt={user.name}
    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
  />
  ```
- إذا لم تكن هناك صورة، اعرض صورة افتراضية أو حرف أول من الاسم:
  ```tsx
  {user.profileImage ? (
    <img src={user.profileImage} className="w-10 h-10 rounded-full" />
  ) : (
    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
      {user.name?.charAt(0) || 'م'}
    </div>
  )}
  ```

### 2. Profile View (صفحة الملف الشخصي):
- اعرض صورة كبيرة في أعلى الصفحة:
  ```tsx
  <div className="relative w-32 h-32 mx-auto">
    <img 
      src={user.profileImage || '/default-avatar.png'} 
      alt={user.name}
      className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
    />
    {user.isGoogleUser && (
      <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow">
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          {/* Google Icon */}
        </svg>
      </div>
    )}
  </div>
  ```

### 3. Post Card (في المنشورات):
- اعرض صورة صغيرة بجانب اسم صاحب المنشور:
  ```tsx
  <img 
    src={post.user.profileImage || '/default-avatar.png'} 
    alt={post.user.name}
    className="w-12 h-12 rounded-full object-cover"
  />
  ```

### 4. Comments (في التعليقات):
- نفس الطريقة مع حجم أصغر:
  ```tsx
  <img 
    src={comment.user.profileImage || '/default-avatar.png'} 
    alt={comment.user.name}
    className="w-8 h-8 rounded-full object-cover"
  />
  ```

### ملاحظات مهمة:
- صورة Google تأتي من URL مباشر (مثل: https://lh3.googleusercontent.com/...)
- استخدم `object-cover` للحفاظ على نسبة الصورة
- أضف `loading="lazy"` للصور لتحسين الأداء
- أضف معالج خطأ لتحميل صورة افتراضية:
  ```tsx
  <img 
    src={user.profileImage || '/default-avatar.png'} 
    onError={(e) => {
      e.currentTarget.src = '/default-avatar.png';
    }}
    alt={user.name}
  />
  ```
```

---

## 🎯 المطالبة 3: Backend (Node.js) - Google Sign-In

```
أريدك أن تضيف endpoint لتسجيل الدخول بـ Google في الواجهة الخلفية:

### المطلوب:

#### 1. تحديث User Model (models/User.js):
أضف الحقول التالية:
```javascript
{
  firebaseUid: { type: String, unique: true, sparse: true },
  email: { type: String, sparse: true, lowercase: true },
  profileImage: { type: String, default: null },
  isGoogleUser: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  // الحقول الموجودة الأخرى...
}
```

#### 2. إنشاء Controller (controllers/googleAuthController.js):
```javascript
exports.googleSignIn = async (req, res) => {
  try {
    const { idToken, fcmToken } = req.body;
    
    // 1. التحقق من Google ID Token عبر Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture, email_verified } = decodedToken;
    
    // 2. البحث عن المستخدم أو إنشاء حساب جديد
    let user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email: email,
        name: name || email?.split('@')[0],
        profileImage: picture, // ⭐ صورة Google
        isGoogleUser: true,
        emailVerified: email_verified || true,
        fcmToken: fcmToken
      });
    } else {
      // تحديث الصورة و FCM Token إذا تغيرت
      user.profileImage = picture;
      user.fcmToken = fcmToken || user.fcmToken;
      await user.save();
    }
    
    // 3. إنشاء JWT Token
    const token = jwt.sign(
      { userId: user._id, firebaseUid: uid },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // 4. إرجاع الاستجابة
    res.status(200).json({
      success: true,
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage, // ⭐ صورة Google
        phoneNumber: user.phoneNumber || '',
        isGoogleUser: true,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid Google token'
    });
  }
};
```

#### 3. إضافة Route (routes/authRoutes.js):
```javascript
router.post('/google-signin', googleAuthController.googleSignIn);
```

#### 4. التأكد من Firebase Admin SDK (config/firebase-admin.js):
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../path/to/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;
```

### الأمان:
- ✅ التحقق من Google ID Token عبر Firebase Admin SDK
- ✅ عدم الثقة في البيانات من Frontend بدون تحقق
- ✅ إنشاء JWT Token للتطبيق بعد التحقق من Google Token
- ✅ تحديث FCM Token للإشعارات

### معالجة الأخطاء:
- Invalid Token → 401 Unauthorized
- Server Error → 500 Internal Server Error
- Missing Data → 400 Bad Request

### Testing:
اختبر عبر Postman:
```bash
POST http://localhost:5000/api/v1/auth/google-signin
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "fcmToken": "optional_fcm_token"
}
```

المتوقع:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "أحمد محمد",
    "email": "ahmed@gmail.com",
    "profileImage": "https://lh3.googleusercontent.com/...",
    "isGoogleUser": true
  }
}
```
```

---

## 🎯 المطالبة 4: Android Studio - التحقق من الإعدادات

```
تأكد من أن Android Studio جاهز لـ Google Sign-In:

### 1. التحقق من google-services.json:
✅ الملف موجود في: `android/app/google-services.json`
✅ يحتوي على OAuth Client مع SHA-1: d7d2d5b34b2d6d12f243ff1dedf142a05ae1f06a

### 2. التحقق من build.gradle (Project Level):
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

### 3. التحقق من build.gradle (App Level):
```gradle
plugins {
    id 'com.google.gms.google-services'
}

dependencies {
    implementation 'com.google.firebase:firebase-auth:22.3.1'
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
}
```

### 4. تشغيل التطبيق:
```bash
# من Android Studio Terminal:
cd android
./gradlew clean
./gradlew assembleDebug
```

### 5. اختبار Google Sign-In:
- شغل التطبيق في Emulator أو جهاز حقيقي
- اضغط على زر "تسجيل الدخول بـ Google"
- يجب أن تظهر نافذة اختيار حساب Google
- اختر حساب واضغط
- يجب أن يدخل التطبيق تلقائياً

### 6. التحقق من Logcat:
ابحث عن:
```
✅ Google Sign-In Success
✅ User data saved
```

### إذا ظهرت مشاكل:
1. تأكد أن SHA-1 مضاف في Firebase Console
2. حمل google-services.json جديد بعد إضافة SHA-1
3. نظف وأعد بناء التطبيق: Clean → Rebuild Project
4. تأكد أن الجهاز/Emulator متصل بالإنترنت
5. تأكد أن Google Play Services محدث

### ملاحظة:
⚠️ لن يعمل Google Sign-In في المتصفح على Android بدون SHA-1 صحيح!
✅ سيعمل في المتصفح على Desktop بدون مشاكل
```

---

## 📝 ملخص سريع

### للواجهة الأمامية (Frontend):
1. ✅ أضف زر Google Sign-In في LoginPage
2. ✅ استخدم `signInWithPopup` (نافذة منبثقة)
3. ✅ احصل على ID Token وأرسله للـ Backend
4. ✅ احفظ البيانات المُرجعة بما فيها `profileImage`
5. ✅ اعرض الصورة في Header, Profile, Posts, Comments

### للواجهة الخلفية (Backend):
1. ✅ أضف حقول Google في User Model
2. ✅ أنشئ endpoint: `/api/v1/auth/google-signin`
3. ✅ تحقق من ID Token عبر Firebase Admin SDK
4. ✅ أنشئ/حدث المستخدم مع `profileImage`
5. ✅ أرجع JWT Token + بيانات المستخدم

### لـ Android Studio:
1. ✅ التأكد من google-services.json محدث
2. ✅ التأكد من SHA-1 مضاف في Firebase
3. ✅ Clean + Rebuild Project
4. ✅ اختبار على جهاز/Emulator

---

## 🚀 جاهز للتنفيذ!

انسخ هذه المطالبات وأرسلها للـ AI المناسب:
- المطالبة 1 + 2 → للـ AI اللي يعدل الواجهة الأمامية
- المطالبة 3 → للـ AI اللي يعدل الواجهة الخلفية
- المطالبة 4 → للتحقق من إعدادات Android Studio
