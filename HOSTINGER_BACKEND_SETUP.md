# Hostinger Backend & MySQL Setup Guide (A-One Billing System)

یہ گائیڈ آپ کے مخصوص Hostinger اکاؤنٹ اور لائیو کریڈینشلز کے مطابق تیار کی گئی ہے۔

---

## آپ کے لائیو کریڈینشلز (Your Exact Credentials)

- **Hostinger Domain**: `https://teal-peafowl-102461.hostingersite.com`
- **Vercel Frontend URL**: `https://aone-billing.vercel.app`
- **MySQL Database Name**: `u468502783_aone_billing`
- **MySQL Username**: `u468502783_anone`
- **MySQL Password**: `Mujtabazadaii112`
- **MySQL Host**: `localhost` (پورٹ `3306`)

---

## 1. phpMyAdmin میں Error #1044 کیوں آیا تھا اور کیسے حل ہوا؟

- **وجہ**: پہلے `schema.sql` میں `CREATE DATABASE IF NOT EXISTS aone_billing;` لکھا تھا، چونکہ ہوسٹنگر پر ڈیٹا بیس کا نام `u468502783_aone_billing` پہلے سے بن چکا ہوتا ہے، اس لیے یوزر کو نیا ڈیٹا بیس بنانے کی اجازت نہیں تھی اور Error 1044 آتا تھا۔
- **حل**: ہم نے `schema.sql` سے `CREATE DATABASE` اور `USE` ختم کر دیا ہے۔ اب آپ phpMyAdmin میں `u468502783_aone_billing` پر کلک کر کے نیا `schema.sql` امپورٹ کریں گے تو 1 سیکنڈ میں سارے ٹیبلز (`bills`, `bill_items`, `customers`, `products`, `app_settings`) بن جائیں گے۔

---

## 2. Hostinger پر Backend کیسے اپلوڈ اور چلانا ہے؟

1. **`backend_hostinger.zip`** فائل اپنے کمپیوٹر پر ڈاؤن لوڈ کریں۔
2. Hostinger **File Manager** میں جائیں:
   - راستہ: `domains/teal-peafowl-102461.hostingersite.com/public_html`
3. یہاں `backend_hostinger.zip` کو اپلوڈ کر کے **Extract** کریں۔
4. فولڈر میں موجود **`.env`** فائل چیک کریں، اس میں یہ سیٹنگز پہلے سے لکھی ہوئی ہیں:
   ```env
   PORT=5000
   NODE_ENV=production

   DB_HOST=localhost
   DB_USER=u468502783_anone
   DB_PASSWORD=Mujtabazadaii112
   DB_NAME=u468502783_aone_billing
   DB_PORT=3306

   FRONTEND_URL=https://aone-billing.vercel.app
   ```
5. Hostinger کے **Node.js** مینو میں جائیں:
   - **Entry File**: `server.js`
   - **Node.js version**: 20 یا 22
   - **NPM Install** کا بٹن دبائیں۔
   - **Restart Application** کا بٹن دبائیں۔
6. چیک کرنے کے لیے لنک کھولیں:
   `https://teal-peafowl-102461.hostingersite.com/api/health`
   اگر یہ جواب آئے تو بیک اینڈ 100% پرفیکٹ چل رہا ہے:
   ```json
   {
     "status": "online",
     "app": "A-One Trade & Supply Network Billing API",
     "database": "MySQL",
     "db_name": "u468502783_aone_billing"
   }
   ```

---

## 3. Vercel فرنٹ اینڈ (`https://aone-billing.vercel.app`)

- ورسل پر موجود فرنٹ اینڈ خودکار طور پر آپ کے ہوسٹنگر بیک اینڈ (`https://teal-peafowl-102461.hostingersite.com`) کے ساتھ جڑ چکا ہے۔
- ہیڈر میں **MySQL Live** کا سبز بیج (Green Badge) نظر آئے گا۔
- جیسے ہی آپ کوئی نیا بل بنائیں گے یا پروڈکٹ سیو کریں گے، وہ فوراً آپ کے Hostinger MySQL ڈیٹا بیس میں محفوظ ہو جائے گا اور پی ڈی ایف انوائس ڈاؤن لوڈ ہو جائے گی۔
