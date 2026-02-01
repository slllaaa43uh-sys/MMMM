# مطالبات AI جاهزة للنسخ - Google Sign-In

---

## 📋 جدول المحتويات

1. [مطالبة الواجهة الأمامية - تحديث firebase-init.ts](#1-frontend-firebase-init)
2. [مطالبة الواجهة الأمامية - تحديث LoginPage.tsx](#2-frontend-loginpage)
3. [مطالبة الواجهة الأمامية - عرض الصورة](#3-frontend-display-image)
4. [مطالبة الواجهة الخلفية - Google Sign-In](#4-backend-google-signin)
5. [مطالبة تشغيل التطبيق](#5-run-application)

---

## 1️⃣ Frontend - Firebase Init

**انسخ هذه المطالبة للـ AI:**

```
حدث ملف firebase-init.ts بالإضافات التالية:

1. أضف GoogleAuthProvider من Firebase Auth
2. أضف export للـ auth و googleProvider
3. اضبط Google Provider مع إعداد prompt: 'select_account'

الكود المطلوب:

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCuH5K2NQhtLmeFtJ19ylnZ3FdcJ_AuOdU",
  authDomain: "mehnati-d7ab9.firebaseapp.com",
  projectId: "mehnati-d7ab9",
  storageBucket: "mehnati-d7ab9.firebasestorage.app",
  messagingSenderId: "951669845862",
  appId: "1:951669845862:android:49aa3d1839f766c2eda2a7"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const messaging = getMessaging(app);

// Google Sign-In Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// باقي الكود الموجود (requestNotificationPermission, onMessageListener)...
```

---

## 2️⃣ Frontend - LoginPage

**انسخ هذه المطالبة للـ AI:**

```
في LoginPage.tsx، أضف ميزة تسجيل الدخول بـ Google:

المتطلبات:
1. زر "تسجيل الدخول بـ Google" مع أيقونة Google الملونة
2. استخدم signInWithPopup (نافذة منبثقة وليس صفحة جديدة)
3. محمل دائري (Spinner) أثناء المعالجة
4. عند النجاح:
   - احصل على ID Token: await user.getIdToken()
   - أرسل POST request إلى: YOUR_BACKEND_URL/api/v1/auth/google-signin
   - Body: { idToken, fcmToken: localStorage.getItem('fcmToken') }
   - احفظ الـ response في localStorage:
     * token → localStorage.setItem('token', data.token)
     * user data → localStorage.setItem('user', JSON.stringify(data.user))
   - انتقل إلى الصفحة الرئيسية

الكود المطلوب:

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../firebase-init';
import { Loader2 } from 'lucide-react';

// داخل Component:
const [googleLoading, setGoogleLoading] = useState(false);

const handleGoogleSignIn = async () => {
  try {
    setGoogleLoading(true);
    
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    const idToken = await user.getIdToken();
    
    const response = await fetch('YOUR_BACKEND_URL/api/v1/auth/google-signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        idToken,
        fcmToken: localStorage.getItem('fcmToken')
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } else {
      throw new Error(data.error);
    }
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      alert('تم إلغاء تسجيل الدخول');
    } else if (error.code === 'auth/network-request-failed') {
      alert('خطأ في الاتصال بالإنترنت');
    } else {
      alert('فشل تسجيل الدخول. حاول مرة أخرى.');
    }
  } finally {
    setGoogleLoading(false);
  }
};

// في الـ JSX، أضف هذا الزر قبل نموذج تسجيل الدخول:
<button
  onClick={handleGoogleSignIn}
  disabled={googleLoading}
  className="w-full flex items-center justify-center gap-3 p-3 mb-4 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
>
  {googleLoading ? (
    <Loader2 size={20} className="animate-spin" />
  ) : (
    <>
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span className="font-medium">تسجيل الدخول بـ Google</span>
    </>
  )}
</button>

{/* خط فاصل */}
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-200"></div>
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="px-2 bg-white text-gray-500">أو</span>
  </div>
</div>
```

معالجة الأخطاء:
- auth/popup-closed-by-user → "تم إلغاء تسجيل الدخول"
- auth/network-request-failed → "خطأ في الاتصال"
- غيرها → "فشل تسجيل الدخول"
```

---

## 3️⃣ Frontend - عرض الصورة

**انسخ هذه المطالبة للـ AI:**

```
أضف عرض صورة المستخدم من Google في جميع الأماكن التالية:

1. Header Component (رأس الصفحة):
const user = JSON.parse(localStorage.getItem('user') || '{}');

{user.profileImage ? (
  <img 
    src={user.profileImage} 
    alt={user.name}
    onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
  />
) : (
  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
    {user.name?.charAt(0) || 'م'}
  </div>
)}

2. Profile View (صفحة الملف الشخصي):
<div className="relative w-32 h-32 mx-auto mb-4">
  <img 
    src={user.profileImage || '/default-avatar.png'} 
    alt={user.name}
    onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
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

3. Post Card (المنشورات):
<img 
  src={post.user.profileImage || '/default-avatar.png'} 
  alt={post.user.name}
  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
  className="w-12 h-12 rounded-full object-cover"
/>

4. Comments (التعليقات):
<img 
  src={comment.user.profileImage || '/default-avatar.png'} 
  alt={comment.user.name}
  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
  className="w-8 h-8 rounded-full object-cover"
/>

ملاحظات:
- استخدم object-cover للحفاظ على نسبة الصورة
- أضف onError handler لتحميل صورة افتراضية
- أضف loading="lazy" للأداء
```

---

## 4️⃣ Backend - Google Sign-In

**انسخ هذه المطالبة للـ AI:**

```
أضف endpoint لتسجيل الدخول بـ Google في الواجهة الخلفية:

الخطوات المطلوبة:

1. تحديث User Model (models/User.js):
أضف الحقول التالية:
- firebaseUid: { type: String, unique: true, sparse: true }
- email: { type: String, sparse: true, lowercase: true }
- profileImage: { type: String, default: null }
- isGoogleUser: { type: Boolean, default: false }
- emailVerified: { type: Boolean, default: false }

2. إنشاء Controller (controllers/googleAuthController.js):

const admin = require('../config/firebase-admin');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.googleSignIn = async (req, res) => {
  try {
    const { idToken, fcmToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'ID Token is required'
      });
    }
    
    // التحقق من Google ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture, email_verified } = decodedToken;
    
    // البحث عن المستخدم أو إنشاء حساب جديد
    let user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email: email || `user${uid}@mehnati.com`,
        name: name || email?.split('@')[0] || 'مستخدم',
        profileImage: picture,
        isGoogleUser: true,
        emailVerified: email_verified || true,
        fcmToken: fcmToken
      });
    } else {
      // تحديث الصورة و FCM Token
      if (picture) user.profileImage = picture;
      if (fcmToken) user.fcmToken = fcmToken;
      await user.save();
    }
    
    // إنشاء JWT Token
    const token = jwt.sign(
      { userId: user._id.toString(), firebaseUid: uid },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // إرجاع الاستجابة
    res.status(200).json({
      success: true,
      token: token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        phoneNumber: user.phoneNumber || '',
        isGoogleUser: true,
        emailVerified: user.emailVerified
      }
    });
    
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired Google token'
    });
  }
};

3. إضافة Route (routes/authRoutes.js):
const googleAuthController = require('../controllers/googleAuthController');
router.post('/google-signin', googleAuthController.googleSignIn);

4. تأكد من Firebase Admin SDK (config/firebase-admin.js):
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    })
  });
}

module.exports = admin;

5. Environment Variables (.env):
JWT_SECRET=your_jwt_secret_here
FIREBASE_PROJECT_ID=mehnati-d7ab9
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@mehnati-d7ab9.iam.gserviceaccount.com

ملاحظات:
- استخدم Firebase Admin SDK للتحقق من ID Token
- لا تثق في البيانات من Frontend بدون تحقق
- احفظ صورة Google في profileImage
- أرجع JWT Token مع بيانات المستخدم
```

---

## 5️⃣ تشغيل التطبيق

**انسخ هذه المطالبة للـ AI:**

```
شغل التطبيق واختبر Google Sign-In:

الأوامر المطلوبة:

1. تشغيل Backend:
cd backend
npm install
npm run dev

# أو
node server.js

# Expected output:
✅ Server running on port 5000
✅ MongoDB connected

2. تشغيل Frontend:
cd frontend (أو المجلد الرئيسي)
npm install
npm run dev

# Expected output:
✅ VITE ready in X ms
✅ Local: http://localhost:3000

3. اختبار Google Sign-In:
- افتح المتصفح: http://localhost:3000
- انتقل إلى صفحة تسجيل الدخول
- اضغط على زر "تسجيل الدخول بـ Google"
- يجب أن تظهر نافذة منبثقة لاختيار حساب Google
- اختر حساب واضغط
- يجب أن تدخل الصفحة الرئيسية تلقائياً

4. التحقق من النجاح:
افتح Console في المتصفح (F12):
- ✅ Google Sign-In Success
- ✅ User data saved
- ✅ Token: eyJhbGciOiJIUzI1NiIs...

في Backend Console:
- ✅ Google Token Verified
- ✅ User created/updated

5. التحقق من localStorage:
في Console:
localStorage.getItem('token')  // يجب أن يرجع JWT Token
JSON.parse(localStorage.getItem('user'))  // يجب أن يرجع بيانات المستخدم

6. إذا ظهرت أخطاء:
Frontend Errors:
- auth/popup-closed-by-user → تم إلغاء العملية
- auth/network-request-failed → مشكلة اتصال
- CORS error → تأكد من إعدادات CORS في Backend

Backend Errors:
- 401 Invalid token → تحقق من Firebase Admin SDK
- 500 Server error → تحقق من MongoDB connection
- 400 Bad request → تحقق من صحة البيانات

7. Android Testing (اختياري):
cd android
./gradlew clean
./gradlew assembleDebug

# أو من Android Studio:
Build → Clean Project
Build → Rebuild Project
Run App
```

---

## 📝 ملخص سريع

### هل الواجهة الأمامية تحتاج تعديل؟
✅ **نعم، تحتاج 3 تعديلات:**
1. firebase-init.ts - إضافة Google Provider
2. LoginPage.tsx - إضافة زر Google Sign-In
3. Header/Profile/Posts - عرض صورة المستخدم

### هل الواجهة الخلفية تحتاج تعديل؟
✅ **نعم، تحتاج 4 تعديلات:**
1. User Model - إضافة حقول Google
2. Google Auth Controller - معالجة تسجيل الدخول
3. Auth Routes - إضافة endpoint جديد
4. Firebase Admin SDK - التحقق من Token

### رابط الواجهة الخلفية:
استبدل `YOUR_BACKEND_URL` بـ:
- **Development:** `http://localhost:5000`
- **Production:** `https://your-server.com`

### معلومات Firebase:
- Project ID: mehnati-d7ab9
- API Key: AIzaSyCuH5K2NQhtLmeFtJ19ylnZ3FdcJ_AuOdU
- Web Client ID: 951669845862-ijkmvh127cro19u3d3gkmhb3a2t4l2vi.apps.googleusercontent.com
- Android SHA-1: d7d2d5b34b2d6d12f243ff1dedf142a05ae1f06a

---

## 🚀 جاهز للتنفيذ!

انسخ المطالبات أعلاه بالترتيب:
1. ✅ Firebase Init (المطالبة 1)
2. ✅ LoginPage (المطالبة 2)
3. ✅ Display Image (المطالبة 3)
4. ✅ Backend (المطالبة 4)
5. ✅ Run App (المطالبة 5)
