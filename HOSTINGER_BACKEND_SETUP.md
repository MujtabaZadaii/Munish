# Hostinger Backend & MySQL Setup Guide (A-One Billing System)

This comprehensive guide is configured for your live Hostinger account and database credentials.

---

## Your Live Credentials

- **Hostinger Domain / Backend**: `https://teal-peafowl-102461.hostingersite.com`
- **Vercel Frontend URL**: `https://aone-billing.vercel.app`
- **MySQL Database Name**: `u468502783_aone_billing`
- **MySQL Username**: `u468502783_anone`
- **MySQL Password**: `Mujtabazadaii112`
- **MySQL Host**: `localhost` (Internal Port `3306`)

---

## 1. phpMyAdmin Error #1044 Root Cause & Resolution

- **Root Cause**: Previously, `schema.sql` included `CREATE DATABASE IF NOT EXISTS aone_billing;` and `USE aone_billing;`. On shared cPanel/Hostinger environments, the database `u468502783_aone_billing` is already provisioned by the system, so individual database users do not have permissions to execute `CREATE DATABASE` queries, resulting in Error `#1044`.
- **Fix**: All `CREATE DATABASE` and `USE` statements were removed from `schema.sql`.
- **How to Import**:
  1. Open Hostinger hPanel and launch **phpMyAdmin**.
  2. In the left sidebar, click on **`u468502783_aone_billing`**.
  3. Click the top **Import** tab.
  4. Select `schema.sql` from your computer and click **Import / Go**. All 5 tables (`bills`, `bill_items`, `customers`, `products`, `app_settings`) will be created in seconds.

---

## 2. Deploying Backend Files to Hostinger

1. Download **`backend_hostinger.zip`** from this repository.
2. In Hostinger **File Manager**, navigate to your application root directory:
   - Path: `domains/teal-peafowl-102461.hostingersite.com/public_html`
3. Upload `backend_hostinger.zip` and extract its contents into the directory.
4. Verify the **`.env`** file contains:
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
5. In Hostinger hPanel, navigate to **Node.js**:
   - **Application startup file**: `server.js`
   - **Node.js version**: `20.x` or `22.x`
   - Click **NPM Install**
   - Click **Restart Application**
6. Verify your live backend health:
   `https://teal-peafowl-102461.hostingersite.com/api/health`
   You should receive:
   ```json
   {
     "status": "online",
     "app": "A-One Trade & Supply Network Billing API",
     "database": "MySQL",
     "db_name": "u468502783_aone_billing"
   }
   ```

---

## 3. Vercel Frontend Connection (`https://aone-billing.vercel.app`)

- The Vercel frontend automatically detects `vercel.app` hostname and routes all API calls to your live Hostinger backend (`https://teal-peafowl-102461.hostingersite.com`).
- A pulsing green **MySQL Live** badge in the header confirms real-time connection.
- All new bills, products, customer balances, and Excel bulk imports automatically persist to your Hostinger MySQL database.
