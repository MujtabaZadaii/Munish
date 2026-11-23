const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'new', 'index.html');
let html = fs.readFileSync(targetFile, 'utf8');

console.log('Original file size:', html.length);

// 1. Insert Google Fonts
if (!html.includes('fonts.googleapis.com/css2?family=Outfit')) {
  const fontLinks = `<!-- Google Fonts: Outfit (Display) & Plus Jakarta Sans (Interface) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
`;
  html = html.replace('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3', fontLinks + '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3');
  console.log('✓ Google Fonts link inserted');
}

// 2. Replace CSS block with modern high-end styling preserving the exact navy + gold theme
const oldStyleStart = html.indexOf('<style>');
const oldStyleEnd = html.indexOf('</style>');

if (oldStyleStart !== -1 && oldStyleEnd !== -1) {
  const newStyle = `<style>
/* ============================================================
   THEME  (A-One Navy #1a2266 + Gold #f5a52c - Award Standard)
   ============================================================ */
:root {
  --navy: #1a2266;
  --navy-dark: #0f1546;
  --navy-light: #2c368c;
  --gold: #f5a52c;
  --gold-soft: #fff6e8;
  --gold-glow: rgba(245, 165, 44, 0.28);
  --ink: #131738;
  --muted: #5e6488;
  --line: #e3e6f3;
  --bg-page: #f4f6fb;
  --bg-card: #ffffff;
  --radius: 18px;
  --radius-sm: 12px;
  --shadow-subtle: 0 4px 20px -2px rgba(26, 34, 102, 0.06), 0 2px 6px -1px rgba(26, 34, 102, 0.04);
  --shadow-hover: 0 12px 30px -4px rgba(26, 34, 102, 0.12), 0 4px 10px -2px rgba(26, 34, 102, 0.06);
  --shadow-glass: 0 8px 32px 0 rgba(26, 34, 102, 0.10);
  --font-display: 'Outfit', sans-serif;
  --font-body: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
}

html {
  scroll-behavior: smooth;
  font-size: 15px;
}

body {
  background: var(--bg-page);
  color: var(--ink);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: transparent;
  min-height: 100vh;
}

h1, h2, h3, h4, h5, h6, .brand-name, .price, .t-grand .val, .stat-card .v, .stat-data .val {
  font-family: var(--font-display);
  letter-spacing: -0.015em;
}

/* ---------- Header with Glassmorphism ---------- */
.app-header {
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 4px solid var(--gold);
  box-shadow: 0 4px 24px rgba(26, 34, 102, 0.07);
  position: sticky;
  top: 0;
  z-index: 1020;
}
.brand {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  padding: 0.85rem 0;
}
.brand-logo {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  border: 2.5px solid var(--gold);
  background: #fff;
  flex: 0 0 auto;
  box-shadow: 0 4px 14px rgba(26, 34, 102, 0.18);
  transition: transform 0.25s ease;
}
.brand-logo:hover {
  transform: rotate(4deg) scale(1.04);
}
.brand-name {
  margin: 0;
  color: var(--navy);
  font-weight: 800;
  font-size: clamp(1.15rem, 3.4vw, 1.85rem);
  line-height: 1.15;
}
.brand-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 1rem;
  margin-top: 0.35rem;
  font-size: 0.88rem;
  color: var(--muted);
}
.brand-meta i {
  color: var(--gold);
  margin-right: 0.3rem;
}
.brand-meta a {
  color: inherit;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.15s ease;
}
.brand-meta a:hover {
  color: var(--navy);
}

/* ---------- App Navigation Tabs (Smooth Mobile Scroll Track) ---------- */
.app-tabs {
  display: flex;
  gap: 0.5rem;
  margin: 1.1rem 0 1.1rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 4px 2px 8px 2px;
}
.app-tabs::-webkit-scrollbar {
  display: none;
}
.app-tab {
  flex: 0 0 auto;
  white-space: nowrap;
  border: 1.5px solid var(--line);
  background: #fff;
  color: var(--navy);
  font-weight: 700;
  border-radius: 14px;
  padding: 0.65rem 1.15rem;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.88rem;
  box-shadow: 0 2px 6px rgba(26, 34, 102, 0.03);
}
.app-tab:hover {
  border-color: var(--gold);
  color: var(--navy-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 34, 102, 0.08);
}
.app-tab.active {
  background: var(--navy);
  border-color: var(--navy);
  color: #fff;
  box-shadow: 0 6px 20px rgba(26, 34, 102, 0.24);
  transform: translateY(-1px);
}
.app-tab.active i {
  color: var(--gold);
}
.app-tab .badge {
  background: var(--gold) !important;
  color: var(--navy-dark) !important;
  font-weight: 800;
}

/* ---------- Modern Cards with Subtle Glass Borders ---------- */
.card-soft {
  border: 1px solid rgba(26, 34, 102, 0.08);
  border-radius: var(--radius);
  box-shadow: var(--shadow-subtle);
  margin-bottom: 1.25rem;
  background: var(--bg-card);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card-soft > .card-header {
  background: transparent;
  border-bottom: 1px solid var(--line);
  padding: 1rem 1.35rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.card-soft > .card-body {
  padding: 1.35rem;
}
.step {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--navy);
  color: var(--gold);
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  font-size: 0.95rem;
  box-shadow: 0 3px 8px rgba(26, 34, 102, 0.22);
}
.card-title-text {
  margin: 0;
  font-weight: 800;
  color: var(--navy);
  font-size: 1.12rem;
}

/* ---------- Forms, Inputs & Tactile Buttons ---------- */
.form-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--navy);
  margin-bottom: 0.3rem;
}
.form-label .req {
  color: #e03131;
}
.form-control, .form-select {
  border-radius: 12px;
  border: 1.5px solid #d8dbe9;
  padding: 0.65rem 0.85rem;
  font-size: 0.94rem;
  transition: all 0.2s ease;
  background-color: #ffffff;
}
.form-control-sm, .form-select-sm {
  border-radius: 10px;
  padding: 0.4rem 0.6rem;
  font-size: 0.84rem;
}
.form-control:focus, .form-select:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 0.25rem var(--gold-glow);
  outline: none;
}
.form-control[readonly] {
  background: var(--bg-page);
  font-weight: 700;
  color: var(--navy);
}

/* Mobile iOS Safari: prevent 16px font-size auto zoom */
@media (max-width: 767.98px) {
  .form-control, .form-select, input[type="text"], input[type="number"], input[type="tel"], input[type="search"], textarea {
    font-size: 16px !important;
  }
}

.btn {
  border-radius: 12px;
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -0.01em;
}
.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(26, 34, 102, 0.12);
}
.btn:active {
  transform: scale(0.98);
}
.btn-navy {
  background: var(--navy);
  border-color: var(--navy);
  color: #fff;
}
.btn-navy:hover, .btn-navy:focus {
  background: var(--navy-dark);
  border-color: var(--navy-dark);
  color: #fff;
}
.btn-gold {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--navy-dark);
}
.btn-gold:hover, .btn-gold:focus {
  background: #e29415;
  border-color: #e29415;
  color: var(--navy-dark);
}
.btn-outline-navy {
  border: 2px solid var(--navy);
  color: var(--navy);
  background: #fff;
}
.btn-outline-navy:hover {
  background: var(--navy);
  color: #fff;
}
.btn-wa {
  background: #1fa855;
  border-color: #1fa855;
  color: #fff;
}
.btn-wa:hover {
  background: #188a45;
  border-color: #188a45;
  color: #fff;
}
.price {
  color: var(--navy);
  font-weight: 800;
}

/* ---------- Suggestion dropdown ---------- */
.suggest-wrap {
  position: relative;
}
.suggest-list {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  z-index: 1500;
  margin-top: 5px;
  background: #fff;
  border: 1.5px solid var(--gold);
  border-radius: 14px;
  box-shadow: 0 16px 36px rgba(15, 21, 70, 0.18);
  overflow: hidden;
}
.suggest-item {
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  background: #fff;
  padding: 0.65rem 0.95rem;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  transition: background 0.15s ease;
}
.suggest-item:last-child {
  border-bottom: 0;
}
.suggest-item:hover, .suggest-item.active {
  background: var(--gold-soft);
}
.suggest-item .s-title {
  font-weight: 700;
  color: var(--navy);
}
.suggest-item .s-sub {
  font-size: 0.82rem;
  color: var(--muted);
}

/* ---------- Items table ---------- */
.items-table {
  margin: 0;
  --bs-table-bg: transparent;
}
.items-table thead th {
  background: var(--navy);
  color: #fff;
  font-weight: 700;
  font-size: 0.84rem;
  white-space: nowrap;
  border: 0;
  vertical-align: middle;
  padding: 0.75rem 0.85rem;
}
.items-table thead th:first-child {
  border-top-left-radius: 12px;
}
.items-table thead th:last-child {
  border-top-right-radius: 12px;
}
.items-table tbody td {
  vertical-align: middle;
  border-color: var(--line);
  padding: 0.7rem 0.85rem;
}
.items-table tbody tr:nth-child(even) {
  background: rgba(246, 247, 252, 0.6);
}
.items-table .item-name {
  font-weight: 600;
  word-break: break-word;
  min-width: 160px;
}
.items-table input.form-control, .items-table select.form-select {
  min-width: 80px;
}
.items-table .input-group {
  min-width: 150px;
  flex-wrap: nowrap;
}
.empty-state {
  text-align: center;
  color: var(--muted);
  padding: 2.5rem 1.25rem;
}
.empty-state i {
  font-size: 2.4rem;
  color: var(--gold);
  display: block;
  margin-bottom: 0.5rem;
}

/* Mobile: Elegant card view for line items */
@media (max-width: 767.98px) {
  .items-table thead {
    display: none;
  }
  .items-table, .items-table tbody, .items-table tr, .items-table td {
    display: block;
    width: 100%;
  }
  .items-table tbody tr, .items-table tbody tr:nth-child(even) {
    background: #fff;
    border: 1.5px solid var(--line);
    border-radius: 16px;
    margin-bottom: 0.9rem;
    padding: 0.85rem 1rem;
    box-shadow: 0 3px 12px rgba(26, 34, 102, 0.04);
  }
  .items-table tbody td {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    border: 0;
    padding: 0.4rem 0;
  }
  .items-table tbody td::before {
    content: attr(data-label);
    font-weight: 700;
    font-size: 0.82rem;
    color: var(--navy);
    flex: 0 0 36%;
  }
  .items-table tbody td.item-name {
    min-width: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--navy);
  }
  .items-table tbody td.actions {
    justify-content: flex-end;
    border-top: 1px dashed var(--line);
    margin-top: 0.4rem;
    padding-top: 0.6rem;
  }
  .items-table tbody td.actions::before {
    display: none;
  }
  .items-table input.form-control, .items-table .input-group {
    min-width: 0;
    width: 62%;
  }
}

/* ---------- Summary Panel ---------- */
.totals-panel {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 1.2rem 1.35rem;
  box-shadow: var(--shadow-subtle);
}
.t-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.45rem 0;
  border-bottom: 1px dashed #dce0f0;
}
.t-row:last-child {
  border-bottom: 0;
}
.t-row .lbl {
  color: var(--muted);
  font-weight: 600;
  font-size: 0.92rem;
}
.t-row .val {
  font-weight: 800;
  color: var(--navy);
  font-size: 1rem;
}
.t-grand {
  background: linear-gradient(135deg, var(--navy) 0%, var(--navy-dark) 100%);
  color: #fff;
  border-radius: 16px;
  padding: 0.95rem 1.15rem;
  margin: 0.75rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 0;
  box-shadow: 0 8px 22px rgba(26, 34, 102, 0.28);
}
.t-grand .lbl {
  color: #fff;
  font-weight: 700;
  font-size: 1.05rem;
}
.t-grand .val {
  color: var(--gold);
  font-size: 1.55rem;
  font-weight: 900;
}
.words-box {
  margin-top: 0.9rem;
  background: var(--gold-soft);
  border-left: 5px solid var(--gold);
  border-radius: 14px;
  padding: 0.8rem 1.1rem;
  color: var(--navy-dark);
  font-weight: 700;
}
.words-box small {
  display: block;
  color: var(--muted);
  font-weight: 600;
  font-size: 0.8rem;
}

/* ---------- Saved Bills & Statistics ---------- */
.stat-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: var(--shadow-subtle);
  padding: 1.15rem 1.25rem;
  border-top: 4px solid var(--gold);
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}
.stat-card .k {
  font-size: 0.78rem;
  color: var(--muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.stat-card .v {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--navy);
  margin: 0.2rem 0;
}
.stat-card .s {
  font-size: 0.85rem;
  color: var(--muted);
}

.bill-row {
  display: grid;
  grid-template-columns: 120px 1fr 190px auto;
  gap: 0.5rem 1.1rem;
  align-items: center;
  padding: 0.95rem 1.2rem;
  border: 1.5px solid var(--line);
  border-radius: 16px;
  margin-bottom: 0.65rem;
  background: #fff;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.bill-row:hover {
  border-color: var(--gold);
  box-shadow: var(--shadow-hover);
  transform: translateY(-1px);
}
.bill-inv {
  font-weight: 800;
  color: var(--navy);
  font-family: var(--font-display);
}
.bill-actions {
  display: flex;
  gap: 0.35rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}
.badge-paid, .badge-due {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 20px;
  margin-left: 0.4rem;
  vertical-align: middle;
}
.badge-paid {
  background: #e6f6ec;
  color: #17803d;
}
.badge-due {
  background: #fff1dc;
  color: #b36b00;
}

/* Mobile Saved Bills Grid */
@media (max-width: 767.98px) {
  .bill-row {
    grid-template-columns: 1fr auto;
    padding: 1rem;
    border-radius: 16px;
    margin-bottom: 0.75rem;
  }
  .bill-cust {
    grid-column: 1 / -1;
  }
  .bill-total {
    text-align: right;
  }
  .bill-actions {
    grid-column: 1 / -1;
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 0.45rem !important;
    border-top: 1px dashed var(--line);
    padding-top: 0.75rem;
    margin-top: 0.4rem;
  }
  .bill-actions .btn {
    width: 100%;
    padding: 0.45rem 0.25rem !important;
    font-size: 0.78rem !important;
    white-space: nowrap;
    display: flex !important;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
  }
  .bill-actions .btn span.d-none.d-md-inline {
    display: inline !important;
  }
}

/* ---------- Toasts ---------- */
#toasts {
  position: fixed;
  z-index: 3000;
  left: 0;
  right: 0;
  bottom: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
  pointer-events: none;
}
@media (min-width: 768px) {
  #toasts {
    top: 1rem;
    bottom: auto;
    right: 1rem;
    left: auto;
    align-items: flex-end;
  }
}
.am-toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  max-width: 420px;
  background: #fff;
  border-radius: 14px;
  padding: 0.85rem 1.15rem;
  box-shadow: 0 12px 34px rgba(15, 21, 70, 0.22);
  border-left: 6px solid var(--navy);
  font-weight: 600;
  font-size: 0.92rem;
  opacity: 0;
  transform: translateY(12px);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.am-toast.show {
  opacity: 1;
  transform: none;
}
.am-toast i {
  font-size: 1.2rem;
  margin-top: 0.05rem;
}
.am-success { border-color: #1fa855; }
.am-success i { color: #1fa855; }
.am-danger { border-color: #d63a3a; }
.am-danger i { color: #d63a3a; }
.am-warning { border-color: var(--gold); }
.am-warning i { color: #e29415; }
.am-info { border-color: var(--navy); }
.am-info i { color: var(--navy); }

/* ---------- Modals with Smooth Backdrop ---------- */
.am-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 21, 70, 0.62);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2500;
  padding: 1rem;
}
.am-box {
  background: #fff;
  border-radius: 20px;
  max-width: 490px;
  width: 100%;
  box-shadow: 0 24px 64px rgba(15, 21, 70, 0.38);
  overflow: hidden;
  max-height: 92vh;
  overflow-y: auto;
  animation: amFadeUp 0.25s ease-out;
}
.am-head {
  background: var(--navy);
  color: #fff;
  padding: 1rem 1.35rem;
  font-weight: 800;
  border-bottom: 4px solid var(--gold);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
}
.am-body {
  padding: 1.35rem;
}
.am-foot {
  padding: 0 1.35rem 1.35rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}
.am-foot .btn {
  flex: 1 1 auto;
}

.edit-banner {
  background: var(--gold-soft);
  border: 1.5px solid var(--gold);
  color: var(--navy-dark);
  border-radius: 14px;
  padding: 0.75rem 1.15rem;
  margin-bottom: 1rem;
  font-weight: 600;
}
.product-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.15rem;
  border: 1.5px solid var(--line);
  border-radius: 14px;
  margin-bottom: 0.55rem;
  background: #fff;
  transition: all 0.2s ease;
}
.product-row:hover {
  border-color: var(--gold);
  box-shadow: var(--shadow-subtle);
}
.product-actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}
.product-name {
  font-weight: 700;
  color: var(--navy);
  overflow-wrap: anywhere;
}
.product-price {
  font-weight: 800;
  color: var(--navy);
  white-space: nowrap;
}
@media (max-width: 575.98px) {
  .product-row {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .product-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
.page-foot {
  text-align: center;
  color: var(--muted);
  font-size: 0.85rem;
  padding: 1.5rem 0 2.5rem;
}

/* ---------- Awwwards & Advanced UX Polish Animations ---------- */
@keyframes amFadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulseGreen {
  0% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.6); }
  70% { box-shadow: 0 0 0 7px rgba(25, 135, 84, 0); }
  100% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0); }
}
.animate-fade-up {
  animation: amFadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.live-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #198754;
  display: inline-block;
  margin-right: 6px;
  animation: pulseGreen 2s infinite;
}
.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}
.filter-pill {
  border: 1.5px solid var(--line);
  border-radius: 20px;
  padding: 0.35rem 0.95rem;
  font-size: 0.82rem;
  font-weight: 600;
  background: #fff;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
}
.filter-pill:hover {
  border-color: var(--navy);
  color: var(--navy);
  transform: translateY(-1px);
}
.filter-pill.active {
  background: var(--navy);
  border-color: var(--navy);
  color: #fff;
  box-shadow: 0 2px 10px rgba(26, 34, 102, 0.22);
}
.guide-card {
  border-left: 4px solid var(--gold);
  background: #fafbfe;
  border: 1px solid rgba(26, 34, 102, 0.06);
  border-left-width: 4px;
  border-radius: 14px;
  padding: 1.15rem;
  margin-bottom: 1rem;
}
.guide-card h5 {
  font-size: 1.02rem;
  font-weight: 700;
  color: var(--navy);
  margin-bottom: 0.5rem;
}
.badge-custom {
  font-size: 0.75rem;
  padding: 0.28rem 0.65rem;
  border-radius: 8px;
  font-weight: 700;
}
.badge-partial {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}
.badge-paid-pill {
  background: #d1e7dd;
  color: #0f5132;
  border: 1px solid #badbcc;
}
.badge-due-pill {
  background: #f8d7da;
  color: #842029;
  border: 1px solid #f5c2c7;
}
.stat-widget {
  background: #fff;
  border-radius: 16px;
  padding: 1.15rem 1.35rem;
  box-shadow: var(--shadow-subtle);
  border: 1px solid rgba(26, 34, 102, 0.07);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-widget:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}
.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  background: var(--gold-soft);
  color: var(--navy);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.45rem;
  flex-shrink: 0;
}
.stat-data .val {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--navy);
  line-height: 1.15;
}
.stat-data .lbl {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* 80mm POS Thermal Receipt Preview & Print */
#thermalReceiptModal .thermal-paper {
  width: 80mm;
  max-width: 100%;
  margin: 0 auto;
  background: #fff;
  padding: 12px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.3;
  color: #000;
  border: 1px dashed #ccc;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}
@media print {
  body.printing-thermal * {
    visibility: hidden !important;
  }
  body.printing-thermal #thermalPrintArea,
  body.printing-thermal #thermalPrintArea * {
    visibility: visible !important;
  }
  body.printing-thermal #thermalPrintArea {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 78mm !important;
    margin: 0 !important;
    padding: 2mm !important;
    font-family: 'Courier New', Courier, monospace !important;
    font-size: 11px !important;
    color: #000 !important;
    background: #fff !important;
  }
}
</style>`;

  html = html.slice(0, oldStyleStart) + newStyle + html.slice(oldStyleEnd + 8);
  console.log('✓ Modern CSS styles replaced');
}

// 3. Update validateBill: make customer address auto-fallback and graceful phone handling
const oldValidateSnippet = `    need('custName', 'Customer Name', state.customer.name.trim().length > 0);
    need('custAddress', 'Address', state.customer.address.trim().length > 0);
    need('custPhone', 'Phone Number', phoneDigits(state.customer.phone).length >= 7);`;

const newValidateSnippet = `    // Customer Name is mandatory
    need('custName', 'Customer Name', state.customer.name.trim().length > 0);
    
    // Address auto-fallback so fast walk-in counter billing is never blocked
    if (!state.customer.address || !state.customer.address.trim()) {
      state.customer.address = 'Walk-in Customer / Chishtian';
      if ($('#custAddress')) $('#custAddress').value = state.customer.address;
    }
    
    // Phone validation (optional or must be >= 7 digits if provided)
    if (state.customer.phone && state.customer.phone.trim().length > 0) {
      need('custPhone', 'Phone Number', phoneDigits(state.customer.phone).length >= 7);
    }`;

if (html.includes(oldValidateSnippet)) {
  html = html.replace(oldValidateSnippet, newValidateSnippet);
  console.log('✓ validateBill updated for graceful counter sales');
} else {
  console.log('! validateBill snippet not found for exact replacement, checking alternative');
}

// 4. Update attachSuggest blur delay and touch prevention
const oldAttachBlur = `    input.addEventListener('input', refresh);
    input.addEventListener('focus', refresh);
    input.addEventListener('blur', function () { setTimeout(hide, 150); });`;

const newAttachBlur = `    input.addEventListener('input', refresh);
    input.addEventListener('focus', refresh);
    input.addEventListener('blur', function () { setTimeout(hide, 300); });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });
    list.addEventListener('touchstart', function (e) { e.preventDefault(); });`;

if (html.includes(oldAttachBlur)) {
  html = html.replace(oldAttachBlur, newAttachBlur);
  console.log('✓ attachSuggest touch & blur race condition fixed');
} else {
  console.log('! attachSuggest blur snippet not found for exact replacement');
}

fs.writeFileSync(targetFile, html, 'utf8');
console.log('New file size:', html.length);
