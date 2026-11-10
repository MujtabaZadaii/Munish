# Hostinger Backend & MySQL Setup Guide (مکمل اردو و انگریزی گائیڈ)

یہ گائیڈ آپ کو بتائے گی کہ **Hostinger** پر بیک اینڈ اور MySQL ڈیٹا بیس کیسے سیٹ کرنا ہے، اور ورسل (Vercel) والے فرنٹ اینڈ کو Hostinger بیک اینڈ سے کیسے جوڑنا ہے۔

---

## 1. Hostinger پر کیا کیا ایڈ کرنا ہے؟ (What to add on Hostinger)

### الف. MySQL Database بنانا (Hostinger hPanel میں):

1. اپنے **Hostinger hPanel** میں لاگ ان کریں۔
2. بائیں جانب مینو سے **Databases** > **MySQL Databases** پر کلک کریں۔
3. ایک نیا ڈیٹا بیس کریٹ کریں:
   - **MySQL Database name**: مثلاً `u123456789_aone_db`
   - **MySQL Username**: مثلاً `u123456789_aone_user`
   - **Password**: ایک مضبوط پاس ورڈ لکھیں اور یاد رکھیں۔
   - **Create** بٹن دبائیں۔
4. اب اسی پیج پر ڈیٹا بیس کے سامنے **Enter phpMyAdmin** بٹن پر کلک کریں۔
5. phpMyAdmin کے اوپر موجود **Import** ٹیب پر جائیں۔
6. **Choose File** پر کلک کر کے اس زپ فائل میں موجود **`schema.sql`** کو سلیکٹ کریں اور نیچے **Go / Import** پر کلک کریں۔
   _(اس سے 5 ٹیبلز: `bills`, `bill_items`, `customers`, `products`, `app_settings` فوراً بن جائیں گے)_

---

### ب. Node.js App بنانا (Hostinger hPanel میں):

1. Hostinger سرچ بار میں **Node.js** لکھیں اور **Node.js** مینو کھولیں۔
2. **Create Application** پر کلک کریں:
   - **Node.js version**: `20.x` یا `22.x`
   - **Application mode**: `Production`
   - **Application root**: وہ فولڈر جہاں آپ بیک اینڈ رکھنا چاہتے ہیں (مثلاً `domains/api.yourdomain.com/public_html` یا `api`)
   - **Application startup file**: `server.js`
3. **Create** پر کلک کریں۔

---

### ج. Backend Files اپلوڈ کرنا:

1. Hostinger کے **File Manager** میں جائیں۔
2. اپنے اس ایپلی کیشن والے فولڈر میں جائیں۔
3. **`backend_hostinger.zip`** فائل کو اپلوڈ کر کے **Extract** کریں۔
4. فولڈر کے اندر ایک فائل بنائیں یا موجودہ `.env.example` کو رینیم کر کے **`.env`** بنائیں۔
5. اس میں اپنے Hostinger والے ڈیٹا بیس کی تفصیلات درج کریں:

   ```env
   PORT=5000
   NODE_ENV=production

   DB_HOST=localhost
   DB_USER=u123456789_aone_user
   DB_PASSWORD=ApkaDatabasePassword
   DB_NAME=u123456789_aone_db
   DB_PORT=3306
   ```

6. فائل کو **Save** کر دیں۔

---

### د. پیکجز انسٹال کرنا اور ایپ رن کرنا:

1. واپس Hostinger کے **Node.js** پیج پر جائیں۔
2. **NPM Install** بٹن دبائیں (یا ٹرمینل میں `npm install --omit=dev` چلائیں)۔
3. **Restart Application** کا بٹن دبائیں۔
4. آپ کا بیک اینڈ لائیو ہو جائے گا! چیک کرنے کے لیے براؤزر میں کھولیں:
   `https://your-domain.com/api/health`
   آپ کو نظر آئے گا:
   ```json
   { "status": "online", "database": "MySQL" }
   ```

---

## 2. Vercel فرنٹ اینڈ کو Hostinger بیک اینڈ سے کیسے جوڑنا ہے؟

اگر آپ کا فرنٹ اینڈ **`aone-billing.vercel.app`** پر ہے اور بیک اینڈ Hostinger پر (مثلاً `https://api.yourdomain.com`):

- `vercel.json` میں ری رائٹ رول پہلے سے شامل ہے جو Vercel سے آنے والی `/api/*` ریکویسٹس کو Hostinger کی طرف فارورڈ کرتا ہے۔
- یا Vercel کے پروجیکٹ سیٹنگز میں Environment Variable ایڈ کریں:
  - Key: `VITE_API_BASE`
  - Value: `https://your-hostinger-domain.com`
- اس طرح Vercel کا فرنٹ اینڈ سیدھا آپ کے Hostinger MySQL بیک اینڈ کے ساتھ 100% کنیکٹ ہو جائے گا!
