const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// تهيئة Firebase Admin SDK
let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('🔑 Loading Firebase credentials from environment variable...');
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (require('fs').existsSync('./serviceAccountKey.json')) {
    console.log('🔑 Loading Firebase credentials from file...');
    serviceAccount = require('./serviceAccountKey.json');
  } else {
    throw new Error('❌ No Firebase credentials found! Set FIREBASE_SERVICE_ACCOUNT environment variable.');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();
  const messaging = admin.messaging();

  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}

// الاستماع للرسائل الجديدة
const setupMessageListener = () => {
  db.collectionGroup('messages')
    .orderBy('timestamp', 'desc')
    .limit(1)
    .onSnapshot(async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const message = change.doc.data();
          const chatId = change.doc.ref.parent.parent.id;
          
          // الحصول على معلومات الدردشة
          const chatDoc = await db.collection('chats').doc(chatId).get();
          const chatData = chatDoc.data();
          
          // إرسال إشعار للمستخدم الآخر
          const receiverId = chatData.users.find(id => id !== message.senderId);
          
          // الحصول على FCM token للمستلم
          const userDoc = await db.collection('users').doc(receiverId).get();
          const userData = userDoc.data();
          
          if (userData && userData.fcmToken) {
            // الحصول على اسم المرسل
            const senderDoc = await db.collection('users').doc(message.senderId).get();
            const senderData = senderDoc.data();
            
            const notificationMessage = {
              token: userData.fcmToken,
              notification: {
                title: senderData.name || 'رسالة جديدة',
                body: message.text,
              },
              data: {
                chatId: chatId,
                senderId: message.senderId,
                type: 'new_message',
              },
              android: {
                priority: 'high',
                notification: {
                  sound: 'default',
                  channelId: 'chat_messages',
                },
              },
            };
            
            try {
              await messaging.send(notificationMessage);
              console.log(`✅ إشعار تم إرساله إلى ${userData.name}`);
            } catch (error) {
              console.error('❌ خطأ في إرسال الإشعار:', error);
            }
          }
        }
      });
    });
};

// بدء الاستماع للرسائل
setupMessageListener();

// API Endpoints

// إرسال إشعار يدوي
app.post('/send-notification', async (req, res) => {
  try {
    const { token, title, body, data } = req.body;
    
    if (!token || !title || !body) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: token, title, body' 
      });
    }
    
    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'chat_messages',
        },
      },
    };
    
    const response = await messaging.send(message);
    
    res.json({
      success: true,
      messageId: response,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// حفظ FCM Token
app.post('/save-token', async (req, res) => {
  try {
    const { userId, token } = req.body;
    
    if (!userId || !token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing userId or token' 
      });
    }
    
    await db.collection('users').doc(userId).update({
      fcmToken: token,
      fcmTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    res.json({
      success: true,
      message: 'Token saved successfully',
    });
  } catch (error) {
    console.error('Error saving token:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// إرسال إشعار لعدة مستخدمين
app.post('/send-bulk-notification', async (req, res) => {
  try {
    const { tokens, title, body, data } = req.body;
    
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'tokens must be a non-empty array' 
      });
    }
    
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'chat_messages',
        },
      },
      tokens: tokens,
    };
    
    const response = await messaging.sendEachForMulticast(message);
    
    res.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    });
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({
    name: 'Higo Notification Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      'POST /send-notification': 'إرسال إشعار لمستخدم واحد',
      'POST /save-token': 'حفظ FCM token للمستخدم',
      'POST /send-bulk-notification': 'إرسال إشعار لعدة مستخدمين',
      'GET /health': 'فحص حالة السيرفر',
    },
  });
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Listening for new messages...`);
  console.log(`🌐 http://localhost:${PORT}`);
});

// معالجة الأخطاء
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});
