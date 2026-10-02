# 🔔 Higo Notification Server

سيرفر Node.js لإرسال إشعارات Firebase Cloud Messaging (FCM) لتطبيق Higo Chat.

## 📋 المتطلبات

- Node.js 18 أو أحدث
- حساب Firebase مع تفعيل Cloud Messaging
- Service Account Key من Firebase

## 🚀 التثبيت

1. **تثبيت المكتبات:**
```bash
cd server
npm install
```

2. **إعداد Firebase:**
   - اذهب إلى [Firebase Console](https://console.firebase.google.com)
   - اختر مشروعك
   - اذهب إلى Project Settings > Service Accounts
   - اضغط على "Generate New Private Key"
   - احفظ الملف باسم `serviceAccountKey.json` في مجلد `server`

3. **إعداد المتغيرات:**
```bash
cp .env.example .env
```

4. **تشغيل السيرفر:**
```bash
npm start
```

للتطوير مع التحديث التلقائي:
```bash
npm run dev
```

## 📡 API Endpoints

### 1. إرسال إشعار لمستخدم واحد
```bash
POST /send-notification
Content-Type: application/json

{
  "token": "FCM_TOKEN_HERE",
  "title": "عنوان الإشعار",
  "body": "نص الإشعار",
  "data": {
    "chatId": "chat_123",
    "type": "new_message"
  }
}
```

### 2. حفظ FCM Token
```bash
POST /save-token
Content-Type: application/json

{
  "userId": "user_id_here",
  "token": "FCM_TOKEN_HERE"
}
```

### 3. إرسال إشعار جماعي
```bash
POST /send-bulk-notification
Content-Type: application/json

{
  "tokens": ["token1", "token2", "token3"],
  "title": "عنوان الإشعار",
  "body": "نص الإشعار",
  "data": {
    "type": "announcement"
  }
}
```

### 4. فحص حالة السيرفر
```bash
GET /health
```

## 🌐 الاستضافة المجانية

يمكن رفع السيرفر على:

### 1. **Render.com** (موصى به)
- اذهب إلى [Render.com](https://render.com)
- Create New > Web Service
- ربط GitHub repo
- Build Command: `cd server && npm install`
- Start Command: `cd server && npm start`
- مجاني مع 750 ساعة/شهر

### 2. **Railway.app**
- اذهب إلى [Railway.app](https://railway.app)
- New Project > Deploy from GitHub
- اختر المجلد `server`
- مجاني مع $5 credit شهرياً

### 3. **Fly.io**
```bash
# تثبيت flyctl
curl -L https://fly.io/install.sh | sh

# تسجيل الدخول
flyctl auth login

# نشر التطبيق
cd server
flyctl launch
flyctl deploy
```

### 4. **Cyclic.sh**
- اذهب إلى [Cyclic.sh](https://cyclic.sh)
- Link GitHub repo
- Deploy automatically
- مجاني 100%

### 5. **Glitch.com**
- اذهب إلى [Glitch.com](https://glitch.com)
- New Project > Import from GitHub
- مجاني مع auto-sleep بعد 5 دقائق

## 📝 ملاحظات مهمة

1. **الأمان:**
   - لا ترفع ملف `serviceAccountKey.json` على GitHub
   - استخدم متغيرات البيئة في الاستضافة
   - في Render/Railway: أضف `serviceAccountKey.json` كـ Secret File

2. **الأداء:**
   - السيرفر يستمع للرسائل الجديدة تلقائياً
   - يرسل إشعارات فورية للمستخدمين

3. **التطوير:**
   - استخدم `npm run dev` للتطوير المحلي
   - السيرفر يعمل على المنفذ 3000 افتراضياً

## 🔧 استكشاف الأخطاء

### خطأ: "Cannot find module 'firebase-admin'"
```bash
npm install
```

### خطأ: "Failed to load serviceAccountKey.json"
تأكد من وجود الملف في مجلد `server`

### خطأ: "EADDRINUSE: address already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

## 📦 هيكل المشروع

```
server/
├── index.js                 # الملف الرئيسي
├── package.json            # المكتبات
├── .env                    # المتغيرات (لا ترفعه)
├── .env.example            # مثال للمتغيرات
├── .gitignore             # ملفات لتجاهلها
├── serviceAccountKey.json  # Firebase key (لا ترفعه)
└── README.md              # هذا الملف
```

## 🎯 الاستخدام مع التطبيق

في التطبيق، احفظ FCM token عند تسجيل الدخول:

```dart
import 'package:firebase_messaging/firebase_messaging.dart';

// الحصول على Token
final fcmToken = await FirebaseMessaging.instance.getToken();

// إرسال Token للسيرفر
final response = await http.post(
  Uri.parse('YOUR_SERVER_URL/save-token'),
  headers: {'Content-Type': 'application/json'},
  body: json.encode({
    'userId': currentUserId,
    'token': fcmToken,
  }),
);
```

## 📞 الدعم

للمساعدة أو الأسئلة، راجع:
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Express.js Docs](https://expressjs.com)
- [Node.js Docs](https://nodejs.org)

---

تم إنشاء هذا السيرفر لتطبيق Higo Chat 💬
