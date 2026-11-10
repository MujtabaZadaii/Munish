# A-One Trade & Supply Network – Billing System (MERN Stack with MySQL)

Complete fullstack MERN billing, invoicing, inventory and sales reporting application for **A-One Trade & Supply Network**.

## 🚀 Tech Stack
- **Frontend**: React (Vite, Bootstrap 5, Bootstrap Icons, jsPDF, SheetJS)
- **Backend**: Node.js & Express RESTful API
- **Database**: MySQL (Connection pooling, prepared statements, transactions, auto-initialization)
- **Deployment**: Ready for Hostinger (Shared Hosting / VPS), cPanel, VPS, Render, Railway, etc.

## 🌟 Key Features
- **Invoice Creation & Management**:
  - Auto-generated sequential invoice numbers (`INV-1001`, `INV-1002`, etc.)
  - Real-time calculations: Gross, line-item discounts (Rs or %), subtotal, delivery charges, grand total, balance due / excess received.
  - Number to words in Pakistani numbering format (Rupees, Lakh, Crore, Paisa).
  - Draft auto-save prevents data loss during accidental reloads.
- **Customer Auto-complete**:
  - Live search from database by customer name or phone number.
- **Product Catalog Management**:
  - Add, edit, delete products.
  - Bulk import via CSV / Excel (.xlsx / .xls) with duplicate handling (Update existing or Skip).
  - Download standard CSV template.
- **PDF & Sharing**:
  - Professional vector-drawn A4 PDF invoices using jsPDF with navy & gold branding, logo, company terms, and signature lines.
  - One-click WhatsApp message sharing with formatted invoice details and direct customer links.
- **Sales Analytics & Reports**:
  - Dashboard stats: Today's sales, this month's sales, pending balance due.
  - Annual Sales Reports: Total sales, monthly breakdown table (Jan–Dec), filtered by year.
- **Backup & Restore**:
  - Full MySQL database JSON export and restore (Merge or Replace mode).

## 🛠️ Local Setup
1. Clone the repository:
   ```bash
   git clone <your-github-repo-url>
   cd aone-billing
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables:
   Copy `.env.example` to `.env` and configure your MySQL credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=aone_billing
   DB_PORT=3306
   ```
4. Start the application:
   ```bash
   npm start
   ```
   Open `http://localhost:5000` in your browser.

## 📦 Hostinger Deployment
For detailed step-by-step instructions with screenshots and hPanel settings, see [HOSTINGER_DEPLOYMENT_GUIDE.md](./HOSTINGER_DEPLOYMENT_GUIDE.md).

