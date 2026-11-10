# Hostinger Deployment Guide (اردو اور English میں مکمل گائیڈ)
## A-One Trade & Supply Network – MERN with MySQL Billing System

یہ مکمل MERN Fullstack پروجیکٹ ہے جس میں **Node.js + Express + React + MySQL** استعمال ہوا ہے۔ یہ Hostinger پر سنگل پورٹ پر چلتا ہے (Express خود pre-built React frontend کو `public/` سے serve کرتا ہے اور تمام REST APIs `/api/*` پر ہینڈل کرتا ہے)۔

---

### طریقہ کار (Step-by-Step Instructions)

#### مرحلہ 1: Hostinger پر MySQL Database بنانا
1. Hostinger کے **hPanel** میں لاگ ان کریں۔
2. **Databases** > **MySQL Databases** پر جائیں۔
3. نیا ڈیٹا بیس بنائیں:
   - **Database Name**: مثلاً `uXXXX_aone_billing`
   - **Database Username**: مثلاً `uXXXX_aone_user`
   - **Password**: ایک مضبوط پاس ورڈ رکھیں (اسے محفوظ کر لیں)۔
4. ڈیٹا بیس بننے کے بعد اس کے سامنے موجود **Enter phpMyAdmin** بٹن پر کلک کریں۔
5. phpMyAdmin کے اوپر موجود **Import** ٹیب پر کلک کریں۔
6. اس پروجیکٹ کی **`schema.sql`** فائل کو منتخب کریں اور نیچے **Go / Import** پر کلک کریں۔
   *(تمام ٹیبلز: `bills`, `bill_items`, `customers`, `products`, `app_settings` چند سیکنڈ میں بن جائیں گے)*

---

#### مرحلہ 2: Hostinger پر Node.js Application سیٹ اپ کرنا
1. Hostinger hPanel میں سرچ بار میں **Node.js** لکھ کر **Node.js** مینو کھولیں۔
2. **Create Application** پر کلک کریں:
   - **Node.js version**: `20.x` یا `22.x` منتخب کریں۔
   - **Application mode**: `Production`
   - **Application root**: اپنی ڈومین کا فولڈر (مثلاً `domains/yourdomain.com/public_html` یا `aone-billing`)
   - **Application startup file**: `server.js` لکھیں۔
3. **Create** پر کلک کریں۔

---

#### مرحلہ 3: Deploy ZIP اپلوڈ اور Extract کرنا
1. Hostinger hPanel میں **File Manager** پر جائیں۔
2. اپنے پروجیکٹ والے فولڈر (Application Root) میں جائیں۔
3. جو فائل تیار کی گئی ہے: **`hostinger_deploy.zip`**، اسے File Manager کے ذریعے Upload کریں۔
4. زپ فائل پر رائٹ کلک کر کے **Extract** کر دیں۔

---

#### مرحلہ 4: `.env` فائل میں ڈیٹا بیس کی سیٹنگز ڈالنا
1. File Manager میں موجود `.env.example` کو رینیم کر کے **`.env`** کر دیں (یا موجودہ `.env` کو ایڈٹ کریں)۔
2. اس میں اپنے Hostinger والے ڈیٹا بیس کے کوائف درج کریں:
   ```env
   PORT=5000
   NODE_ENV=production

   DB_HOST=localhost
   DB_USER=uXXXX_aone_user
   DB_PASSWORD=YourPasswordHere
   DB_NAME=uXXXX_aone_billing
   DB_PORT=3306
   ```
3. فائل کو **Save** کر دیں۔

---

#### مرحلہ 5: Dependencies انسٹال کرنا اور ایپ رن کرنا
1. واپس Hostinger کے **Node.js** پینل پر جائیں۔
2. **NPM Install** کے بٹن پر کلک کریں (یا اگر SSH ٹرمینل استعمال کر رہے ہیں تو `npm install --omit=dev` چلائیں)۔
3. اس کے بعد **Restart** یا **Start** ایپلیکیشن پر کلک کریں۔
4. اپنی ڈومین کھولیں (مثلاً `https://yourdomain.com`):
   - مکمل بلنگ سسٹم لائیو ہو جائے گا!
   - اوپر گرین بیج نظر آئے گا: **MySQL Live**۔
   - انوائس بنانا، کسٹمر آٹو فل، پروڈکٹس امپورٹ، سیلز رپورٹس اور پی ڈی ایف ڈاؤن لوڈ سب کچھ لائیو کام کرے گا!

---

### Local Machine (XAMPP / Local MySQL) پر چلانے کا طریقہ
اگر آپ اپنے کمپیوٹر پر لوکل چلانا چاہتے ہیں:
1. XAMPP میں **MySQL** اور **Apache** اسٹارٹ کریں۔
2. پروجیکٹ کے فولڈر میں ٹرمینل کھولیں اور چلائیں:
   ```bash
   npm install
   npm start
   ```
3. براؤزر میں کھولیں: **`http://localhost:5000`**
4. ڈویلپمنٹ موڈ میں React اور Node دونوں چلانے کے لیے:
   ```bash
   npm run dev       # Backend server with auto-reload
   npm run client    # React Vite frontend (port 3000)
   ```

