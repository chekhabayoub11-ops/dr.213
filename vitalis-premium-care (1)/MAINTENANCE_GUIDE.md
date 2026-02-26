# 🛠️ دليل الصيانة والتطوير

## 📋 قائمة التحقق اليومية

- [ ] التأكد من أن الموقع يحمل بدون أخطاء
- [ ] اختبار نظام الحجز
- [ ] اختبار المساعد الذكي
- [ ] التحقق من الروابط
- [ ] اختبار الأجهزة المختلفة (موبايل، تابلت، سطح مكتب)

---

## 🐛 استكشاف الأخطاء الشائعة

### 1. المساعد الذكي لا يرد على الرسائل
**السبب المحتمل:** 
- API Key غير صحيح أو منتهي الصلاحية
- عدم وجود اتصال بالإنترنت

**الحل:**
```bash
# 1. تحقق من .env.local
cat .env.local | grep VITE_GEMINI_API_KEY

# 2. احصل على API Key جديد من:
# https://aistudio.google.com/app/apikey

# 3. أعد تشغيل الموقع
npm run dev
```

### 2. الموقع يحمل ببطء
**السبب المحتمل:**
- صور كبيرة الحجم
- تحميل البيانات الثقيلة

**الحل:**
```bash
# امسح الكاش
npm run build

# تحقق من حجم الملفات
ls -lh dist/

# استخدم أداة تحليل الحجم
npm install --save-dev rollup-plugin-visualizer
```

### 3. الأحرف العربية لا تظهر بشكل صحيح
**السبب المحتمل:**
- ترميز Encoding غير صحيح
- خط غير محمل

**الحل:**
```html
<!-- تأكد من وجود في HTML: -->
<meta charset="UTF-8">
<!-- وفي CSS: -->
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap');
```

---

## 🔄 عملية التطوير

### إضافة ميزة جديدة

1. **إنشاء مكون جديد:**
```tsx
// components/MyNewComponent.tsx
import React from 'react';

const MyNewComponent: React.FC = () => {
  return <div className="p-4 bg-white rounded-lg">محتوى جديد</div>;
};

export default MyNewComponent;
```

2. **استيراده في App.tsx:**
```tsx
import MyNewComponent from './components/MyNewComponent';
```

3. **إضافته للجزء المناسب:**
```tsx
<MyNewComponent />
```

4. **اختباره محلياً:**
```bash
npm run dev
```

### تحديث الأنماط

استخدم Tailwind CSS مباشرة في className:
```tsx
<button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  زر مثال
</button>
```

---

## 📊 مؤشرات الأداء

### Core Web Vitals المستهدفة:
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

### كيفية القياس:
```bash
# استخدم Google Lighthouse
# 1. افتح DevTools (F12)
# 2. اذهب لـ Lighthouse tab
# 3. اختر "Generate report"
```

---

## 🔐 الأمان

### أفضل الممارسات:

1. **لا تضع API Keys في الكود:**
   ```tsx
   // ❌ خطر
   const apiKey = 'AIzaSy...'; // لا تفعل هذا!
   
   // ✅ آمن
   const apiKey = process.env.VITE_GEMINI_API_KEY;
   ```

2. **استخدم HTTPS دائماً:**
   ```bash
   # تأكد من استخدام https:// في الإنتاج
   ```

3. **تحديث المكتبات:**
   ```bash
   npm audit
   npm audit fix
   npm update
   ```

---

## 📈 التحسينات المستقبلية

### قريباً:
- [ ] إضافة نظام الدفع الإلكتروني
- [ ] نظام إدارة المرضى (Dashboard)
- [ ] تطبيق موبايل
- [ ] نظام الفواتير الإلكترونية
- [ ] تكامل مع WhatsApp و Telegram

---

## 📚 الموارد المفيدة

- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Guide](https://vitejs.dev/guide)
- [Google Gemini API](https://ai.google.dev)

---

## 👥 فريق التطوير

للأسئلة والدعم الفني:
- 📞 الهاتف: 0555 01 23 45
- 📧 البريد: dev@doctor-yahya.com
- 💬 WhatsApp: رقم الفريق التقني

---

**آخر تحديث:** فبراير 26، 2026
