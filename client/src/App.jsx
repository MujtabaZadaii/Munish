import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

const COMPANY = 'A-One Trade & Supply Network';
const SALESMAN = 'Munesh ';
const PHONE = '+92 322 3968631';
const NAVY = [26, 34, 102];
const GOLD = [245, 165, 44];

function round2(x) {
  return Math.round((Number(x) + Number.EPSILON) * 100) / 100;
}
function num(v) {
  const n = parseFloat(v);
  return isFinite(n) && n > 0 ? n : 0;
}
function fmt(n) {
  n = Number(n) || 0;
  const neg = n < 0;
  n = Math.abs(n);
  const hasDec = Math.abs(n - Math.round(n)) > 0.004;
  const s = n.toLocaleString('en-US', {
    minimumFractionDigits: hasDec ? 2 : 0,
    maximumFractionDigits: 2
  });
  return (neg ? '-' : '') + s;
}
function rs(n) {
  return 'Rs. ' + fmt(n);
}
function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}-${MONTHS[+m[2] - 1]}-${m[1]}` : iso || '';
}

// Pakistani numbering words
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
function below100(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : ''); }
function below1000(n) {
  const h = Math.floor(n / 100), r = n % 100, out = [];
  if (h) out.push(ONES[h] + ' Hundred');
  if (r) out.push(below100(r));
  return out.join(' ');
}
function intToWords(n) {
  if (n === 0) return 'Zero';
  const parts = [];
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5);  n %= 1e5;
  const thou = Math.floor(n / 1e3);  n %= 1e3;
  if (crore) parts.push((crore >= 1000 ? intToWords(crore) : below1000(crore)) + ' Crore');
  if (lakh) parts.push(below100(lakh) + ' Lakh');
  if (thou) parts.push(below100(thou) + ' Thousand');
  if (n) parts.push(below1000(n));
  return parts.join(' ');
}
function amountInWords(amount) {
  amount = round2(Math.max(0, Number(amount) || 0));
  if (amount > 9e13) return 'Amount too large';
  const r = Math.floor(amount);
  const p = Math.round((amount - r) * 100);
  let s = intToWords(r) + ' Rupees';
  if (p) s += ' and ' + below100(p) + ' Paisa';
  return s + ' Only';
}

export default function App() {
  const [tab, setTab] = useState('new'); // 'new', 'saved', 'products', 'reports'
  const [dbOnline, setDbOnline] = useState(true);

  // Bill state
  const [invoiceNo, setInvoiceNo] = useState('INV-1001');
  const [editingId, setEditingId] = useState(null);
  const [billDate, setBillDate] = useState(todayISO());
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [items, setItems] = useState([]);
  const [discType, setDiscType] = useState('rs');
  const [discValue, setDiscValue] = useState('');
  const [charges, setCharges] = useState('');
  const [received, setReceived] = useState('');

  // Add Item form state
  const [addName, setAddName] = useState('');
  const [addQty, setAddQty] = useState('1');
  const [addPrice, setAddPrice] = useState('');
  const [addDisc, setAddDisc] = useState('');
  const [addDiscType, setAddDiscType] = useState('rs');
  const [editItemIdx, setEditItemIdx] = useState(-1);

  // Suggestions
  const [custSuggestions, setCustSuggestions] = useState([]);
  const [prodSuggestions, setProdSuggestions] = useState([]);

  // Data lists
  const [savedBills, setSavedBills] = useState([]);
  const [searchBillQuery, setSearchBillQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [searchProdQuery, setSearchProdQuery] = useState('');
  const [stats, setStats] = useState({ today: { count: 0, total: 0 }, month: { count: 0, total: 0 }, pending: { count: 0, total: 0 }, totalBills: 0 });

  // Product form
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pEditId, setPEditId] = useState(null);

  // Reports
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [availableYears, setAvailableYears] = useState([String(new Date().getFullYear())]);
  const [annualReport, setAnnualReport] = useState(null);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState(null);
  function showToast(text, type = 'info') {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  }

  // Initial load
  useEffect(() => {
    fetchNextInvoice();
    fetchBills();
    fetchProducts();
    fetchStats();
  }, []);

  async function fetchNextInvoice() {
    try {
      const res = await fetch('/api/bills/next-invoice');
      const data = await res.json();
      if (data.success && !editingId) {
        setInvoiceNo(data.invoiceNo);
        setDbOnline(true);
      }
    } catch (e) {
      setDbOnline(false);
    }
  }

  async function fetchBills(q = '') {
    try {
      const url = q ? `/api/bills?q=${encodeURIComponent(q)}` : '/api/bills';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSavedBills(data.bills);
        setDbOnline(true);
      }
    } catch (e) {
      setDbOnline(false);
    }
  }

  async function fetchProducts(q = '') {
    try {
      const url = q ? `/api/products?q=${encodeURIComponent(q)}` : '/api/products';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setDbOnline(true);
      }
    } catch (e) {
      setDbOnline(false);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/reports/stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (e) {}
  }

  async function fetchReport(year) {
    try {
      const res = await fetch(`/api/reports/annual?year=${year}`);
      const data = await res.json();
      if (data.success) {
        setAnnualReport(data);
        if (data.availableYears) setAvailableYears(data.availableYears);
      }
    } catch (e) {}
  }

  useEffect(() => {
    if (tab === 'reports') fetchReport(reportYear);
    if (tab === 'saved') { fetchBills(searchBillQuery); fetchStats(); }
    if (tab === 'products') fetchProducts(searchProdQuery);
  }, [tab, reportYear]);

  // Calculations
  const calculatedLines = items.map((it) => {
    const gross = round2(num(it.qty) * num(it.price));
    const dVal = num(it.disc);
    let d = it.discType === 'pct' ? (gross * Math.min(dVal, 100)) / 100 : dVal;
    d = round2(Math.min(d, gross));
    return { gross, disc: d, net: round2(gross - d) };
  });

  const subtotal = round2(calculatedLines.reduce((s, l) => s + l.net, 0));
  const dv = num(discValue);
  let discountAmt = discType === 'pct' ? (subtotal * Math.min(dv, 100)) / 100 : dv;
  discountAmt = round2(Math.min(discountAmt, subtotal));
  const grandTotal = round2(subtotal - discountAmt + num(charges));
  const balance = round2(grandTotal - num(received));

  // Add Item to bill
  function handleAddItem(e) {
    e.preventDefault();
    if (!addName.trim()) { showToast('Please enter product name.', 'warning'); return; }
    if (num(addQty) <= 0) { showToast('Please enter quantity greater than 0.', 'warning'); return; }

    const item = {
      name: addName.trim(),
      qty: num(addQty),
      price: num(addPrice),
      disc: num(addDisc),
      discType: addDiscType
    };

    if (editItemIdx >= 0) {
      const updated = [...items];
      updated[editItemIdx] = item;
      setItems(updated);
      setEditItemIdx(-1);
      showToast('Item updated.', 'info');
    } else {
      setItems([...items, item]);
    }

    setAddName('');
    setAddQty('1');
    setAddPrice('');
    setAddDisc('');
    setAddDiscType('rs');
    setProdSuggestions([]);
  }

  // Save Bill
  async function handleSaveBill() {
    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) {
      showToast('Please fill in Customer Name, Address and Phone.', 'warning');
      return;
    }
    if (items.length === 0) {
      showToast('Please add at least one product to the bill.', 'warning');
      return;
    }

    const billPayload = {
      id: editingId || ('b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)),
      invoiceNo,
      date: billDate,
      customer,
      items,
      discType,
      discValue: num(discValue),
      charges: num(charges),
      received: num(received),
      subtotal,
      discountAmt,
      grandTotal,
      balance
    };

    try {
      const url = editingId ? `/api/bills/${editingId}` : '/api/bills';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billPayload)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setEditingId(billPayload.id);
        fetchBills();
        fetchStats();
      } else {
        showToast(data.message || 'Error saving bill', 'danger');
      }
    } catch (e) {
      showToast('Network error saving to MySQL: ' + e.message, 'danger');
    }
  }

  function handleNewBill() {
    setEditingId(null);
    setCustomer({ name: '', phone: '', address: '' });
    setItems([]);
    setDiscValue('');
    setCharges('');
    setReceived('');
    setBillDate(todayISO());
    fetchNextInvoice();
    showToast('Started new bill.', 'info');
  }

  function handleLoadBill(b) {
    setEditingId(b.id);
    setInvoiceNo(b.invoiceNo);
    setBillDate(b.date);
    setCustomer(b.customer || { name: '', phone: '', address: '' });
    setItems(b.items || []);
    setDiscType(b.discType || 'rs');
    setDiscValue(b.discValue ? String(b.discValue) : '');
    setCharges(b.charges ? String(b.charges) : '');
    setReceived(b.received ? String(b.received) : '');
    setTab('new');
    showToast(`Bill ${b.invoiceNo} loaded for editing.`, 'info');
  }

  async function handleDeleteBill(id, invNo) {
    if (!window.confirm(`Are you sure you want to delete ${invNo} from MySQL?`)) return;
    try {
      const res = await fetch(`/api/bills/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchBills(searchBillQuery);
        fetchStats();
        if (editingId === id) handleNewBill();
      }
    } catch (e) {
      showToast('Error deleting bill: ' + e.message, 'danger');
    }
  }

  // Product CRUD
  async function handleSaveProduct(e) {
    e.preventDefault();
    if (!pName.trim()) return;
    try {
      const url = pEditId ? `/api/products/${pEditId}` : '/api/products';
      const method = pEditId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pName.trim(), price: num(pPrice) })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setPName('');
        setPPrice('');
        setPEditId(null);
        fetchProducts(searchProdQuery);
      } else {
        showToast(data.message, 'warning');
      }
    } catch (e) {
      showToast('Error saving product: ' + e.message, 'danger');
    }
  }

  async function handleDeleteProduct(id) {
    if (!window.confirm('Delete this product from MySQL?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchProducts(searchProdQuery);
      }
    } catch (e) {
      showToast('Error deleting: ' + e.message, 'danger');
    }
  }

  // Bulk Product Import
  function handleBulkImport(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        let rows = [];
        if (file.name.match(/\.(xlsx|xls)$/i)) {
          const wb = XLSX.read(evt.target.result, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        } else {
          const text = evt.target.result;
          rows = text.split('\n').map((l) => l.split(','));
        }
        if (rows.length < 2) throw new Error('File has no data.');
        const headers = rows[0].map((h) => String(h).trim().toLowerCase());
        const nameIdx = headers.indexOf('product name') >= 0 ? headers.indexOf('product name') : headers.indexOf('name');
        const priceIdx = headers.indexOf('selling price') >= 0 ? headers.indexOf('selling price') : headers.indexOf('price');
        if (nameIdx < 0 || priceIdx < 0) throw new Error('Required headers: Product Name, Selling Price');

        const prods = [];
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (r[nameIdx] && r[priceIdx] !== undefined) {
            prods.push({ name: String(r[nameIdx]).trim(), price: Number(r[priceIdx]) || 0 });
          }
        }
        const res = await fetch('/api/products/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: prods, mode: 'update' })
        });
        const data = await res.json();
        showToast(data.message, 'success');
        fetchProducts();
      } catch (err) {
        showToast('Bulk import error: ' + err.message, 'danger');
      }
    };
    if (file.name.match(/\.csv$/i)) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
    e.target.value = '';
  }

  // WhatsApp
  function handleWhatsApp(b) {
    const targetBill = b || {
      customer,
      invoiceNo,
      date: billDate,
      grandTotal,
      received: num(received),
      balance
    };
    const digits = String(targetBill.customer.phone || '').replace(/\D/g, '');
    if (digits.length < 8) { showToast('Customer has no valid phone number.', 'warning'); return; }
    const msg = `Assalam o Alaikum ${targetBill.customer.name},\n\nThank you for shopping with *${COMPANY}*.\nInvoice No: ${targetBill.invoiceNo}\nDate: ${fmtDate(targetBill.date)}\nTotal Amount: ${rs(targetBill.grandTotal)}\n${targetBill.received > 0 ? 'Received: ' + rs(targetBill.received) + '\n' : ''}${targetBill.balance > 0 ? 'Balance Due: ' + rs(targetBill.balance) + '\n' : ''}\nSalesman: ${SALESMAN}\nWhatsApp: ${PHONE}`;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  // jsPDF Generation
  function handleDownloadPDF(b) {
    const curBill = b || {
      invoiceNo,
      date: billDate,
      customer,
      items,
      discType,
      discValue: num(discValue),
      charges: num(charges),
      received: num(received),
      subtotal,
      discountAmt,
      grandTotal,
      balance
    };

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, M = 12, CW = W - 2 * M;

    // Header
    doc.setFillColor(26, 34, 102); doc.rect(0, 0, W, 34, 'F');
    doc.setFillColor(245, 165, 44); doc.rect(0, 34, W, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(255, 255, 255);
    doc.text(COMPANY, M, 15);
    doc.setFontSize(10.5); doc.setFont('helvetica', 'normal');
    doc.text(`Salesman: ${SALESMAN}   |   WhatsApp: ${PHONE}`, M, 25);

    // Meta Box
    let y = 44;
    doc.setFillColor(246, 247, 252); doc.setDrawColor(26, 34, 102); doc.setLineWidth(0.4);
    doc.roundedRect(M, y, 100, 28, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(107, 112, 144);
    doc.text('BILL TO', M + 5, y + 6);
    doc.setFontSize(11); doc.setTextColor(26, 34, 102);
    doc.text(curBill.customer.name || 'Valued Customer', M + 5, y + 12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    doc.text(curBill.customer.address || '', M + 5, y + 18);
    doc.text('Phone: ' + (curBill.customer.phone || ''), M + 5, y + 24);

    // Invoice No Box
    const rX = M + 105, rW = CW - 105;
    doc.roundedRect(rX, y, rW, 28, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(26, 34, 102);
    doc.text('INVOICE', rX + rW - 5, y + 9, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(107, 112, 144);
    doc.text('Invoice No.', rX + 5, y + 16);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(15, 21, 70);
    doc.text(curBill.invoiceNo, rX + rW - 5, y + 16, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(107, 112, 144);
    doc.text('Date', rX + 5, y + 23);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(15, 21, 70);
    doc.text(fmtDate(curBill.date), rX + rW - 5, y + 23, { align: 'right' });

    // Table Header
    y += 34;
    doc.setFillColor(26, 34, 102); doc.rect(M, y, CW, 8, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(255, 255, 255);
    doc.text('Sr#', M + 7, y + 5.5, { align: 'center' });
    doc.text('Product Name', M + 17, y + 5.5);
    doc.text('Qty', M + 110, y + 5.5, { align: 'center' });
    doc.text('Unit Price', M + 150, y + 5.5, { align: 'right' });
    doc.text('Total', M + CW - 3, y + 5.5, { align: 'right' });

    y += 8;
    curBill.items.forEach((it, idx) => {
      const gross = round2(num(it.qty) * num(it.price));
      let d = it.discType === 'pct' ? (gross * Math.min(num(it.disc), 100)) / 100 : num(it.disc);
      const lineNet = round2(gross - d);
      if (idx % 2 === 1) { doc.setFillColor(246, 247, 252); doc.rect(M, y, CW, 7, 'F'); }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(28, 32, 64);
      doc.text(String(idx + 1), M + 7, y + 5, { align: 'center' });
      doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 21, 70);
      doc.text(it.name, M + 17, y + 5);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(28, 32, 64);
      doc.text(String(it.qty), M + 110, y + 5, { align: 'center' });
      doc.text(rs(it.price), M + 150, y + 5, { align: 'right' });
      doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 34, 102);
      doc.text(rs(lineNet), M + CW - 3, y + 5, { align: 'right' });
      y += 7;
    });

    // Totals
    y += 6;
    const tX = W - M - 80, tW = 80;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(60, 64, 96);
    doc.text('Subtotal', tX + 3, y + 5); doc.text(rs(curBill.subtotal), tX + tW - 3, y + 5, { align: 'right' });
    y += 7;
    doc.text('Delivery Charges', tX + 3, y + 5); doc.text(rs(curBill.charges), tX + tW - 3, y + 5, { align: 'right' });
    y += 7;
    doc.setFillColor(26, 34, 102); doc.roundedRect(tX, y, tW, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(255, 255, 255);
    doc.text('GRAND TOTAL', tX + 3, y + 6);
    doc.setFontSize(11); doc.setTextColor(245, 165, 44);
    doc.text(rs(curBill.grandTotal), tX + tW - 3, y + 6, { align: 'right' });
    y += 11;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(60, 64, 96);
    doc.text('Amount Received', tX + 3, y + 5); doc.text(rs(curBill.received), tX + tW - 3, y + 5, { align: 'right' });
    y += 7;
    doc.setFont('helvetica', 'bold'); doc.setTextColor(curBill.balance > 0 ? 192 : 26, curBill.balance > 0 ? 57 : 34, curBill.balance > 0 ? 43 : 102);
    doc.text(curBill.balance < 0 ? 'Excess Received' : 'Balance Due', tX + 3, y + 5);
    doc.text(rs(Math.abs(curBill.balance)), tX + tW - 3, y + 5, { align: 'right' });

    // Amount in words
    y += 10;
    doc.setFillColor(255, 244, 224); doc.roundedRect(M, y, CW, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(107, 112, 144);
    doc.text('AMOUNT IN WORDS', M + 5, y + 5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(15, 21, 70);
    doc.text(amountInWords(curBill.grandTotal), M + 5, y + 10);

    // Footer
    doc.setDrawColor(245, 165, 44); doc.setLineWidth(0.8); doc.line(M, 275, W - M, 275);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(26, 34, 102);
    doc.text('Thank you for your business!', W / 2, 281, { align: 'center' });

    doc.save(`A-One-Bill-${curBill.invoiceNo}.pdf`);
    showToast(`PDF downloaded: A-One-Bill-${curBill.invoiceNo}.pdf`, 'success');
  }

  return (
    <div>
      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }} className={`alert alert-${toastMsg.type} shadow-lg py-2 px-3`}>
          <strong>{toastMsg.text}</strong>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div className="brand">
            <div className="brand-logo d-flex align-items-center justify-content-center bg-navy text-gold fw-bold" style={{ backgroundColor: 'var(--navy)', color: 'var(--gold)', fontSize: '1.4rem' }}>
              A-1
            </div>
            <div>
              <h1 className="brand-name">A-One Trade &amp; Supply Network</h1>
              <div className="brand-meta">
                <span><i className="bi bi-person-badge-fill"></i>Salesman: <strong>{SALESMAN}</strong></span>
                <span><i className="bi bi-whatsapp"></i><a href="https://wa.me/923223968631" target="_blank" rel="noreferrer">{PHONE}</a></span>
                <span className={`badge rounded-pill ${dbOnline ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'} px-2 py-1`}>
                  <i className={`bi ${dbOnline ? 'bi-database-check' : 'bi-cloud-slash'} me-1`}></i>
                  {dbOnline ? 'MySQL Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container pb-5">
        {/* Navigation Tabs */}
        <nav className="app-tabs">
          <button type="button" className={`app-tab ${tab === 'new' ? 'active' : ''}`} onClick={() => setTab('new')}>
            <i className="bi bi-receipt-cutoff me-1"></i> New Bill
          </button>
          <button type="button" className={`app-tab ${tab === 'saved' ? 'active' : ''}`} onClick={() => setTab('saved')}>
            <i className="bi bi-folder2-open me-1"></i> Saved Bills <span className="badge rounded-pill ms-1">{savedBills.length}</span>
          </button>
          <button type="button" className={`app-tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>
            <i className="bi bi-box-seam me-1"></i> Products <span className="badge rounded-pill ms-1">{products.length}</span>
          </button>
          <button type="button" className={`app-tab ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>
            <i className="bi bi-calendar3 me-1"></i> Yearly Reports
          </button>
        </nav>

        {/* ================= TAB 1: NEW / EDIT BILL ================= */}
        {tab === 'new' && (
          <section>
            {editingId && (
              <div className="alert alert-info py-2 px-3 mb-3 d-flex justify-content-between align-items-center">
                <div><i className="bi bi-info-circle-fill me-2"></i>Editing Invoice: <strong>{invoiceNo}</strong> ({customer.name})</div>
                <button className="btn btn-sm btn-outline-primary" onClick={handleNewBill}>Create New Instead</button>
              </div>
            )}

            {/* Step 1: Customer Details */}
            <div className="card card-soft">
              <div className="card-header"><span className="step">1</span><h2 className="card-title-text">Customer Details</h2></div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label">Customer Name <span className="req">*</span></label>
                    <div className="suggest-wrap">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Customer / Shop name"
                        value={customer.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomer({ ...customer, name: val });
                          if (val.length >= 2) {
                            fetch(`/api/customers?q=${encodeURIComponent(val)}`)
                              .then((r) => r.json())
                              .then((d) => setCustSuggestions(d.customers || []));
                          } else {
                            setCustSuggestions([]);
                          }
                        }}
                      />
                      {custSuggestions.length > 0 && (
                        <div className="suggest-list">
                          {custSuggestions.map((c, i) => (
                            <button
                              key={i}
                              type="button"
                              className="suggest-item"
                              onClick={() => {
                                setCustomer({ name: c.name, phone: c.phone, address: c.address || '' });
                                setCustSuggestions([]);
                              }}
                            >
                              <div className="s-title">{c.name}</div>
                              <div className="s-sub">{c.phone} {c.address ? `• ${c.address}` : ''}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label">Phone Number <span className="req">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0322 1234567"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label">Shop / Delivery Address <span className="req">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Shop #, Market, City"
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-6 col-md-4">
                    <label className="form-label">Invoice No.</label>
                    <input type="text" className="form-control" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-control" value={billDate} onChange={(e) => setBillDate(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Add Products */}
            <div className="card card-soft">
              <div className="card-header"><span className="step">2</span><h2 className="card-title-text">Add Products</h2></div>
              <div className="card-body">
                <form onSubmit={handleAddItem} className="row g-2 align-items-end">
                  <div className="col-12 col-md-4">
                    <label className="form-label">Product Name</label>
                    <div className="suggest-wrap">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type to search saved products"
                        value={addName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAddName(val);
                          if (val.length >= 1) {
                            fetch(`/api/products?q=${encodeURIComponent(val)}`)
                              .then((r) => r.json())
                              .then((d) => setProdSuggestions(d.products || []));
                          } else {
                            setProdSuggestions([]);
                          }
                        }}
                      />
                      {prodSuggestions.length > 0 && (
                        <div className="suggest-list">
                          {prodSuggestions.map((p, i) => (
                            <button
                              key={i}
                              type="button"
                              className="suggest-item"
                              onClick={() => {
                                setAddName(p.name);
                                setAddPrice(String(p.price));
                                setProdSuggestions([]);
                              }}
                            >
                              <div className="s-title">{p.name}</div>
                              <div className="s-sub">{rs(p.price)}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-4 col-md-2">
                    <label className="form-label">Quantity</label>
                    <input type="number" step="any" min="0.001" className="form-control" value={addQty} onChange={(e) => setAddQty(e.target.value)} />
                  </div>
                  <div className="col-4 col-md-2">
                    <label className="form-label">Unit Price (Rs.)</label>
                    <input type="number" step="any" min="0" className="form-control" placeholder="0.00" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} />
                  </div>
                  <div className="col-4 col-md-2">
                    <label className="form-label">Disc.</label>
                    <div className="input-group">
                      <input type="number" step="any" min="0" className="form-control" placeholder="0" value={addDisc} onChange={(e) => setAddDisc(e.target.value)} />
                      <select className="form-select" style={{ maxWidth: '65px' }} value={addDiscType} onChange={(e) => setAddDiscType(e.target.value)}>
                        <option value="rs">Rs</option>
                        <option value="pct">%</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-12 col-md-2 d-grid">
                    <button type="submit" className="btn btn-navy">
                      <i className={`bi ${editItemIdx >= 0 ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
                      {editItemIdx >= 0 ? 'Update' : 'Add Item'}
                    </button>
                  </div>
                </form>

                {/* Items Table */}
                <div className="table-responsive mt-3">
                  <table className="table items-table">
                    <thead>
                      <tr>
                        <th className="text-center" style={{ width: '50px' }}>Sr#</th>
                        <th>Product Name</th>
                        <th className="text-center" style={{ width: '100px' }}>Qty</th>
                        <th className="text-end" style={{ width: '130px' }}>Unit Price</th>
                        <th style={{ width: '140px' }}>Discount</th>
                        <th className="text-end" style={{ width: '130px' }}>Line Total</th>
                        <th className="text-end" style={{ width: '110px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="empty-state">
                            <i className="bi bi-cart3"></i>
                            No products added to this invoice yet.
                          </td>
                        </tr>
                      ) : (
                        items.map((it, idx) => {
                          const ln = calculatedLines[idx] || { net: 0 };
                          return (
                            <tr key={idx}>
                              <td className="text-center fw-bold" style={{ color: 'var(--navy)' }}>{idx + 1}</td>
                              <td className="item-name">{it.name}</td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={it.qty}
                                  onChange={(e) => {
                                    const up = [...items];
                                    up[idx].qty = num(e.target.value);
                                    setItems(up);
                                  }}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-end"
                                  value={it.price}
                                  onChange={(e) => {
                                    const up = [...items];
                                    up[idx].price = num(e.target.value);
                                    setItems(up);
                                  }}
                                />
                              </td>
                              <td>
                                <div className="input-group input-group-sm">
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={it.disc || ''}
                                    onChange={(e) => {
                                      const up = [...items];
                                      up[idx].disc = num(e.target.value);
                                      setItems(up);
                                    }}
                                  />
                                  <select
                                    className="form-select"
                                    style={{ maxWidth: '65px' }}
                                    value={it.discType}
                                    onChange={(e) => {
                                      const up = [...items];
                                      up[idx].discType = e.target.value;
                                      setItems(up);
                                    }}
                                  >
                                    <option value="rs">Rs</option>
                                    <option value="pct">%</option>
                                  </select>
                                </div>
                              </td>
                              <td className="text-end price">{rs(ln.net)}</td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                                >
                                  <i className="bi bi-trash3-fill"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Step 3: Summary & Actions */}
            <div className="card card-soft">
              <div className="card-header"><span className="step">3</span><h2 className="card-title-text">Summary &amp; Checkout</h2></div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-3" style={{ background: 'var(--bg-soft)' }}>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Subtotal:</span>
                        <strong className="price">{rs(subtotal)}</strong>
                      </div>
                      <div className="row g-2 mb-2 align-items-center">
                        <div className="col-6"><span className="text-muted">Bill Discount:</span></div>
                        <div className="col-6">
                          <div className="input-group input-group-sm">
                            <input type="number" className="form-control" placeholder="0" value={discValue} onChange={(e) => setDiscValue(e.target.value)} />
                            <select className="form-select" style={{ maxWidth: '65px' }} value={discType} onChange={(e) => setDiscType(e.target.value)}>
                              <option value="rs">Rs</option>
                              <option value="pct">%</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="row g-2 mb-2 align-items-center">
                        <div className="col-6"><span className="text-muted">Delivery Charges:</span></div>
                        <div className="col-6">
                          <input type="number" className="form-control form-control-sm" placeholder="0" value={charges} onChange={(e) => setCharges(e.target.value)} />
                        </div>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold fs-5" style={{ color: 'var(--navy)' }}>GRAND TOTAL:</span>
                        <span className="fw-bold fs-4" style={{ color: 'var(--gold)' }}>{rs(grandTotal)}</span>
                      </div>
                      <div className="row g-2 mb-2 align-items-center">
                        <div className="col-6"><span className="text-muted">Amount Received:</span></div>
                        <div className="col-6">
                          <input type="number" className="form-control form-control-sm" placeholder="0" value={received} onChange={(e) => setReceived(e.target.value)} />
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold">{balance < 0 ? 'Excess Received:' : 'Balance Due:'}</span>
                        <strong style={{ color: balance > 0 ? '#c0392b' : 'var(--navy)', fontSize: '1.1rem' }}>{rs(Math.abs(balance))}</strong>
                      </div>
                    </div>
                    <div className="small text-muted mt-2 fst-italic">
                      <strong>In Words:</strong> {amountInWords(grandTotal)}
                    </div>
                  </div>

                  <div className="col-12 col-md-6 d-flex flex-column justify-content-between">
                    <div className="d-grid gap-2">
                      <button type="button" className="btn btn-navy py-2 fs-6" onClick={handleSaveBill}>
                        <i className="bi bi-save2-fill me-2"></i> Save Bill to MySQL
                      </button>
                      <button type="button" className="btn btn-outline-navy py-2" onClick={() => handleDownloadPDF()}>
                        <i className="bi bi-file-earmark-pdf-fill me-2"></i> Download PDF Invoice
                      </button>
                      <button type="button" className="btn btn-wa py-2" onClick={() => handleWhatsApp()}>
                        <i className="bi bi-whatsapp me-2"></i> Share via WhatsApp
                      </button>
                      <button type="button" className="btn btn-outline-secondary py-2" onClick={handleNewBill}>
                        <i className="bi bi-plus-circle me-2"></i> Reset / New Bill
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= TAB 2: SAVED BILLS ================= */}
        {tab === 'saved' && (
          <section>
            {/* Stats Cards */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-4">
                <div className="stat-card">
                  <div className="k">Today</div>
                  <div className="v">{rs(stats.today.total)}</div>
                  <div className="s">{stats.today.count} {stats.today.count === 1 ? 'bill' : 'bills'}</div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="stat-card">
                  <div className="k">This Month</div>
                  <div className="v">{rs(stats.month.total)}</div>
                  <div className="s">{stats.month.count} {stats.month.count === 1 ? 'bill' : 'bills'}</div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="stat-card">
                  <div className="k">Pending Balance</div>
                  <div className="v">{rs(stats.pending.total)}</div>
                  <div className="s">{stats.pending.count} bills with balance due</div>
                </div>
              </div>
            </div>

            {/* Search & Actions */}
            <div className="card card-soft mb-3">
              <div className="card-body">
                <div className="row g-2 align-items-center">
                  <div className="col-12 col-md">
                    <div className="input-group">
                      <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search by customer name, phone, or invoice no..."
                        value={searchBillQuery}
                        onChange={(e) => {
                          setSearchBillQuery(e.target.value);
                          fetchBills(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-auto">
                    <a href="/api/backup/export" className="btn btn-outline-navy">
                      <i className="bi bi-download me-1"></i> Backup (JSON)
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bills List */}
            {savedBills.length === 0 ? (
              <div className="card card-soft text-center py-5">
                <i className="bi bi-folder2-open fs-1 text-gold mb-2"></i>
                <div className="text-muted">No saved bills found in MySQL database.</div>
              </div>
            ) : (
              savedBills.map((b) => {
                const paid = b.balance <= 0.004;
                return (
                  <div key={b.id} className="bill-row">
                    <div>
                      <div className="bill-inv">{b.invoiceNo}</div>
                      <div className="small text-muted">{fmtDate(b.date)}</div>
                    </div>
                    <div>
                      <div className="fw-semibold">{b.customer?.name}</div>
                      <div className="small text-muted">{b.customer?.phone}</div>
                    </div>
                    <div>
                      <span className="price">{rs(b.grandTotal)}</span>
                      {paid ? <span className="badge-paid">Paid</span> : <span className="badge-due">Due {rs(b.balance)}</span>}
                    </div>
                    <div className="bill-actions">
                      <button className="btn btn-sm btn-navy" onClick={() => handleLoadBill(b)}>
                        <i className="bi bi-pencil-square me-1"></i> View/Edit
                      </button>
                      <button className="btn btn-sm btn-outline-navy" onClick={() => handleDownloadPDF(b)}>
                        <i className="bi bi-file-earmark-pdf-fill me-1"></i> PDF
                      </button>
                      <button className="btn btn-sm btn-wa" onClick={() => handleWhatsApp(b)}>
                        <i className="bi bi-whatsapp"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteBill(b.id, b.invoiceNo)}>
                        <i className="bi bi-trash3-fill"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}

        {/* ================= TAB 3: PRODUCTS ================= */}
        {tab === 'products' && (
          <section>
            {/* Add / Edit Product */}
            <div className="card card-soft mb-3">
              <div className="card-header">
                <h2 className="card-title-text"><i className="bi bi-box-seam me-2"></i>{pEditId ? 'Edit Product' : 'Add New Product'}</h2>
              </div>
              <div className="card-body">
                <form onSubmit={handleSaveProduct} className="row g-2 align-items-end">
                  <div className="col-12 col-md-6">
                    <label className="form-label">Product Name</label>
                    <input type="text" className="form-control" placeholder="e.g. Copper Pipe 1/2 inch" value={pName} onChange={(e) => setPName(e.target.value)} required />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label">Selling Price (Rs.)</label>
                    <input type="number" step="any" min="0" className="form-control" placeholder="0.00" value={pPrice} onChange={(e) => setPPrice(e.target.value)} required />
                  </div>
                  <div className="col-6 col-md-3 d-grid">
                    <button type="submit" className="btn btn-navy">
                      <i className={`bi ${pEditId ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
                      {pEditId ? 'Update Product' : 'Save Product'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Bulk & Search Toolbar */}
            <div className="card card-soft mb-3">
              <div className="card-body">
                <div className="row g-2 align-items-center">
                  <div className="col-12 col-md">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search saved products by name..."
                      value={searchProdQuery}
                      onChange={(e) => {
                        setSearchProdQuery(e.target.value);
                        fetchProducts(e.target.value);
                      }}
                    />
                  </div>
                  <div className="col-auto">
                    <label className="btn btn-outline-navy mb-0">
                      <i className="bi bi-upload me-1"></i> Bulk Import Excel/CSV
                      <input type="file" accept=".csv,.xlsx,.xls" className="d-none" onChange={handleBulkImport} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Products List */}
            {products.length === 0 ? (
              <div className="card card-soft text-center py-5 text-muted">
                <i className="bi bi-box fs-1 text-gold mb-2"></i>
                No products found in MySQL catalog.
              </div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="product-row">
                  <div>
                    <div className="product-name">{p.name}</div>
                    <div className="product-price">{rs(p.price)}</div>
                  </div>
                  <div className="product-actions">
                    <button
                      className="btn btn-sm btn-outline-navy"
                      onClick={() => {
                        setPEditId(p.id);
                        setPName(p.name);
                        setPPrice(String(p.price));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <i className="bi bi-pencil"></i> Edit
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteProduct(p.id)}>
                      <i className="bi bi-trash3"></i> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* ================= TAB 4: YEARLY SALES REPORTS ================= */}
        {tab === 'reports' && (
          <section>
            <div className="card card-soft mb-3">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h2 className="card-title-text"><i className="bi bi-graph-up-arrow me-2"></i>Annual Sales Record</h2>
                <div className="d-flex align-items-center gap-2">
                  <label className="form-label mb-0">Year</label>
                  <select className="form-select form-select-sm" value={reportYear} onChange={(e) => setReportYear(e.target.value)} style={{ width: 'auto' }}>
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="card-body">
                {annualReport ? (
                  <>
                    <div className="row g-3 mb-4">
                      <div className="col-12 col-md-4">
                        <div className="stat-card">
                          <div className="k">Total Sales ({reportYear})</div>
                          <div className="v">{rs(annualReport.summary?.totalSales || 0)}</div>
                          <div className="s">{annualReport.summary?.totalBills || 0} saved invoices</div>
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <div className="stat-card">
                          <div className="k">Total Received</div>
                          <div className="v">{rs(annualReport.summary?.totalReceived || 0)}</div>
                          <div className="s">Cash &amp; bank collected</div>
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <div className="stat-card">
                          <div className="k">Total Outstanding Due</div>
                          <div className="v" style={{ color: '#c0392b' }}>{rs(annualReport.summary?.totalBalance || 0)}</div>
                          <div className="s">Pending receivables</div>
                        </div>
                      </div>
                    </div>

                    <h5 className="fw-bold mb-3" style={{ color: 'var(--navy)' }}>Monthly Breakdown</h5>
                    <div className="table-responsive">
                      <table className="table table-bordered table-striped">
                        <thead className="table-dark" style={{ background: 'var(--navy)' }}>
                          <tr>
                            <th>Month</th>
                            <th className="text-center">Bills Count</th>
                            <th className="text-end">Total Amount</th>
                            <th className="text-end">Received</th>
                            <th className="text-end">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {annualReport.months?.map((m, i) => (
                            <tr key={i}>
                              <td className="fw-semibold">{m.name}</td>
                              <td className="text-center">{m.count}</td>
                              <td className="text-end fw-bold" style={{ color: 'var(--navy)' }}>{rs(m.amount)}</td>
                              <td className="text-end text-success">{rs(m.received)}</td>
                              <td className="text-end text-danger">{rs(m.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted">Loading annual report data from MySQL...</div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
