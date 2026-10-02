# استخدام Node.js 18
FROM node:18-alpine

# إنشاء مجلد التطبيق
WORKDIR /app

# نسخ package files
COPY package*.json ./

# تثبيت المكتبات
RUN npm ci --only=production

# نسخ باقي الملفات
COPY . .

# تعريف المنفذ
EXPOSE 3000

# متغير البيئة
ENV NODE_ENV=production

# تشغيل التطبيق
CMD ["node", "index.js"]
