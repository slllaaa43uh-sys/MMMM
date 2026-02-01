# تنفيذ Google Sign-In - خطة العمل الكاملة

## ✅ ما تم إنجازه
- [x] Firebase Project: mehnati-d7ab9
- [x] SHA-1 Certificate: d7d2d5b34b2d6d12f243ff1dedf142a05ae1f06a
- [x] OAuth Client ID: 951669845862-1d5ti8hiqbghm728lqggg53svtc88k77.apps.googleusercontent.com
- [x] Web Client ID: 951669845862-ijkmvh127cro19u3d3gkmhb3a2t4l2vi.apps.googleusercontent.com
- [x] Package Name: com.mehnati.me
- [x] API Key: AIzaSyCuH5K2NQhtLmeFtJ19ylnZ3FdcJ_AuOdU

---

## 🎯 الخطوة 1: تحديث Frontend (React)

### A. تحديث `firebase-init.ts`

```typescript
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

// ⭐ Google Sign-In Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account' // يطلب اختيار حساب Google في كل مرة
});

// دوال الإشعارات الموجودة...
export const requestNotificationPermission = async () => { /* ... */ };
export const onMessageListener = () => { /* ... */ };
```

---

### B. تحديث `LoginPage.tsx`

**إضافة دالة تسجيل الدخول بـ Google:**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../firebase-init';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  
  // ⭐ دالة تسجيل الدخول بـ Google
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      
      // 1. تسجيل الدخول عبر Google Popup
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const user = result.user;
      
      console.log('✅ Google Sign-In Success:', {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid
      });
      
      // 2. الحصول على Firebase ID Token
      const idToken = await user.getIdToken();
      
      // 3. إرسال Token للـ Backend
      const response = await fetch('YOUR_BACKEND_URL/api/v1/auth/google-signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idToken,
          fcmToken: localStorage.getItem('fcmToken') // إرسال FCM token للإشعارات
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 4. حفظ JWT Token
        localStorage.setItem('token', data.token);
        
        // 5. حفظ بيانات المستخدم
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          profileImage: data.user.profileImage, // ⭐ صورة Google
          isGoogleUser: true,
          phoneNumber: data.user.phoneNumber || ''
        };
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('✅ User data saved:', userData);
        
        // 6. الانتقال للصفحة الرئيسية
        navigate('/');
      } else {
        throw new Error(data.error || 'فشل تسجيل الدخول');
      }
      
    } catch (error: any) {
      console.error('❌ Google Sign-In Error:', error);
      
      // معالجة الأخطاء الشائعة
      if (error.code === 'auth/popup-closed-by-user') {
        alert('تم إلغاء تسجيل الدخول');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // تجاهل - المستخدم أغلق النافذة
      } else if (error.code === 'auth/network-request-failed') {
        alert('خطأ في الاتصال بالإنترنت');
      } else {
        alert('فشل تسجيل الدخول بـ Google. حاول مرة أخرى.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Logo و العنوان */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              مرحباً بك
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              سجل الدخول للمتابعة
            </p>
          </div>
          
          {/* زر Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 p-3 mb-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <Loader2 size={20} className="animate-spin text-gray-600 dark:text-gray-400" />
            ) : (
              <>
                {/* Google Icon SVG */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  تسجيل الدخول بـ Google
                </span>
              </>
            )}
          </button>
          
          {/* خط فاصل */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">أو</span>
            </div>
          </div>
          
          {/* باقي نموذج تسجيل الدخول العادي (رقم الهاتف وكلمة المرور) */}
          <form onSubmit={handleLogin}>
            {/* ... الحقول الموجودة ... */}
          </form>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 الخطوة 2: تحديث Backend (Node.js)

### A. تحديث User Model

**في `models/User.js` أو `models/userModel.js`:**

```javascript
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // الحقول الموجودة...
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true // يسمح بـ null للمستخدمين غير Google
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  profileImage: {
    type: String,
    default: null
  },
  isGoogleUser: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  fcmToken: {
    type: String,
    default: null
  },
  // ... باقي الحقول
}, {
  timestamps: true
});

// Index للأداء
UserSchema.index({ firebaseUid: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ phoneNumber: 1 });

module.exports = mongoose.model('User', UserSchema);
```

---

### B. إنشاء Google Sign-In Controller

**إنشاء ملف `controllers/googleAuthController.js`:**

```javascript
const admin = require('../config/firebase-admin'); // Firebase Admin SDK
const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Google Sign-In Endpoint
 * POST /api/v1/auth/google-signin
 */
exports.googleSignIn = async (req, res) => {
  try {
    const { idToken, fcmToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'ID Token is required'
      });
    }
    
    // 1. التحقق من Google ID Token عبر Firebase Admin SDK
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('❌ Invalid Google Token:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired Google token'
      });
    }
    
    const { uid, email, name, picture, email_verified } = decodedToken;
    
    console.log('✅ Google Token Verified:', {
      uid,
      email,
      name,
      picture: picture ? 'Yes' : 'No'
    });
    
    // 2. البحث عن المستخدم في قاعدة البيانات
    let user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      // 3. إنشاء مستخدم جديد
      console.log('📝 Creating new user for Google UID:', uid);
      
      user = await User.create({
        firebaseUid: uid,
        email: email || `user${uid}@mehnati.com`, // fallback email
        name: name || email?.split('@')[0] || 'مستخدم',
        profileImage: picture || null,
        isGoogleUser: true,
        emailVerified: email_verified || true,
        fcmToken: fcmToken || null,
        createdAt: new Date()
      });
      
      console.log('✅ New user created:', user._id);
    } else {
      // 4. تحديث بيانات المستخدم الموجود
      let needsUpdate = false;
      
      if (picture && user.profileImage !== picture) {
        user.profileImage = picture;
        needsUpdate = true;
      }
      
      if (name && user.name !== name) {
        user.name = name;
        needsUpdate = true;
      }
      
      if (fcmToken && user.fcmToken !== fcmToken) {
        user.fcmToken = fcmToken;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await user.save();
        console.log('✅ User updated:', user._id);
      }
    }
    
    // 5. إنشاء JWT Token للتطبيق
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        firebaseUid: uid,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // 6. إرجاع الاستجابة
    res.status(200).json({
      success: true,
      token: token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profileImage: user.profileImage, // ⭐ صورة Google
        phoneNumber: user.phoneNumber || '',
        isGoogleUser: true,
        emailVerified: user.emailVerified
      }
    });
    
  } catch (error) {
    console.error('❌ Google Sign-In Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Link Phone Number to Google Account
 * POST /api/v1/auth/link-phone
 */
exports.linkPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const userId = req.user._id; // من Middleware
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }
    
    // التحقق من أن الرقم غير مستخدم
    const existingUser = await User.findOne({ 
      phoneNumber,
      _id: { $ne: userId }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Phone number already in use'
      });
    }
    
    // ربط الرقم بالحساب
    const user = await User.findById(userId);
    user.phoneNumber = phoneNumber;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Phone number linked successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profileImage: user.profileImage
      }
    });
    
  } catch (error) {
    console.error('❌ Link Phone Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
```

---

### C. إضافة Routes

**في `routes/authRoutes.js`:**

```javascript
const express = require('express');
const router = express.Router();
const googleAuthController = require('../controllers/googleAuthController');
const authMiddleware = require('../middleware/authMiddleware');

// Google Sign-In (لا يحتاج authentication)
router.post('/google-signin', googleAuthController.googleSignIn);

// ربط رقم الهاتف (يحتاج authentication)
router.post('/link-phone', authMiddleware, googleAuthController.linkPhoneNumber);

// ... باقي routes الموجودة
module.exports = router;
```

---

### D. التأكد من Firebase Admin SDK

**في `config/firebase-admin.js`:**

```javascript
const admin = require('firebase-admin');

// تحميل Service Account من environment variable أو ملف
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require('../path/to/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'mehnati-d7ab9'
  });
}

module.exports = admin;
```

---

## 🎯 الخطوة 3: Environment Variables

**أضف في `.env` (Backend):**

```env
# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"mehnati-d7ab9",...}

# أو ضع مسار الملف:
FIREBASE_SERVICE_ACCOUNT_PATH=./config/serviceAccountKey.json
```

---

## 🎯 الخطوة 4: الاختبار

### A. اختبار من Frontend (Browser):

1. افتح التطبيق في المتصفح
2. اضغط على "تسجيل الدخول بـ Google"
3. اختر حساب Google
4. تحقق من Console:
   - ✅ `Google Sign-In Success`
   - ✅ `User data saved`

### B. اختبار من Postman (Backend):

```bash
# 1. احصل على ID Token من Firebase:
# https://firebase.google.com/docs/auth/admin/verify-id-tokens#retrieve_id_tokens_on_clients

# 2. أرسل الطلب:
POST http://localhost:5000/api/v1/auth/google-signin
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "fcmToken": "optional_fcm_token_here"
}

# Response المتوقع:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "أحمد محمد",
    "email": "ahmed@gmail.com",
    "profileImage": "https://lh3.googleusercontent.com/...",
    "phoneNumber": "",
    "isGoogleUser": true,
    "emailVerified": true
  }
}
```

---

## 📋 ملخص التغييرات

### Frontend (React):
1. ✅ تحديث `firebase-init.ts` - إضافة `GoogleAuthProvider`
2. ✅ تحديث `LoginPage.tsx` - إضافة زر وdالة `handleGoogleSignIn`
3. ✅ عرض صورة المستخدم من `user.profileImage` في Header

### Backend (Node.js):
1. ✅ تحديث User Model - إضافة حقول Google
2. ✅ إنشاء `googleAuthController.js` - معالجة Google Sign-In
3. ✅ تحديث Routes - إضافة `/auth/google-signin`
4. ✅ Firebase Admin SDK - للتحقق من ID Token

---

## ⚠️ ملاحظات مهمة

### 1. **أمان Token:**
- ✅ ID Token يُرسل مرة واحدة فقط للـ Backend
- ✅ Backend يتحقق من Token عبر Firebase Admin SDK
- ✅ Backend يُصدر JWT Token خاص بالتطبيق

### 2. **الصورة الشخصية:**
- ✅ تُحفظ في قاعدة البيانات من `picture` field
- ✅ تُعرض مباشرة من Google CDN (سريعة)
- ✅ تُحدّث تلقائياً عند كل Sign-In

### 3. **البريد الإلكتروني:**
- ✅ يُحفظ من Google
- ✅ مُتحقق منه تلقائياً (`emailVerified: true`)

### 4. **رقم الهاتف:**
- ⚠️ Google لا يُرجع رقم الهاتف
- ✅ يمكن ربطه لاحقاً عبر `/auth/link-phone`

---

## 🚀 الخطوات التالية

1. **أنسخ الكود أعلاه إلى ملفاتك**
2. **اختبر في المتصفح أولاً**
3. **تأكد من Backend يستقبل الطلبات**
4. **اختبر في Android Studio بعد التأكد**

**هل أبدأ بتطبيق التحديثات الآن؟** 🚀
