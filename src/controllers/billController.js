const { pool } = require('../config/db');
const { calculateBill, round2, num } = require('../utils/calc');

function pad(n, len = 4) {
  let s = String(n);
  while (s.length < len) s = '0' + s;
  return s;
}

// Generate unique ID if none provided
function uid() {
  return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// GET /api/bills/next-invoice
async function getNextInvoiceNo(req, res) {
  try {
    const [settingRows] = await pool.query(
      "SELECT setting_value FROM app_settings WHERE setting_key = 'invoice_counter'"
    );
    let counter = settingRows.length ? parseInt(settingRows[0].setting_value, 10) || 1000 : 1000;

    const [billRows] = await pool.query("SELECT invoice_no FROM bills");
    for (const b of billRows) {
      const m = /(\d+)\s*$/.exec(b.invoice_no || '');
      if (m) {
        const val = parseInt(m[1], 10);
        if (val > counter) counter = val;
      }
    }

    const nextInvoiceNo = 'INV-' + pad(counter + 1, 4);
    res.json({ success: true, invoiceNo: nextInvoiceNo, counter: counter + 1 });
  } catch (err) {
    console.error('Error fetching next invoice no:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/bills
async function getBills(req, res) {
  try {
    const { q, year, month } = req.query;
    let sql = 'SELECT * FROM bills WHERE 1=1';
    const params = [];

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      const digitsOnly = q.replace(/\D/g, '');
      if (digitsOnly.length >= 3) {
        sql += ' AND (customer_name LIKE ? OR invoice_no LIKE ? OR customer_phone LIKE ? OR REPLACE(REPLACE(REPLACE(customer_phone, " ", ""), "-", ""), "+", "") LIKE ?)';
        params.push(searchTerm, searchTerm, searchTerm, `%${digitsOnly}%`);
      } else {
        sql += ' AND (customer_name LIKE ? OR invoice_no LIKE ? OR customer_phone LIKE ?)';
        params.push(searchTerm, searchTerm, searchTerm);
      }
    }

    if (year) {
      sql += ' AND YEAR(bill_date) = ?';
      params.push(Number(year));
    }

    if (month) {
      sql += ' AND MONTH(bill_date) = ?';
      params.push(Number(month));
    }

    sql += ' ORDER BY bill_date DESC, created_at DESC';

    const [bills] = await pool.query(sql, params);

    if (bills.length === 0) {
      return res.json({ success: true, bills: [] });
    }

    // Attach items
    const billIds = bills.map((b) => b.id);
    const [items] = await pool.query(
      'SELECT * FROM bill_items WHERE bill_id IN (?) ORDER BY item_order ASC',
      [billIds]
    );

    const itemsMap = {};
    for (const it of items) {
      if (!itemsMap[it.bill_id]) itemsMap[it.bill_id] = [];
      itemsMap[it.bill_id].push({
        id: it.id,
        name: it.name,
        qty: Number(it.qty),
        price: Number(it.price),
        disc: Number(it.disc),
        discType: it.disc_type,
        gross: Number(it.gross),
        lineDisc: Number(it.line_disc),
        net: Number(it.net)
      });
    }

    const formattedBills = bills.map((b) => ({
      id: b.id,
      invoiceNo: b.invoice_no,
      date: b.bill_date instanceof Date ? b.bill_date.toISOString().slice(0, 10) : String(b.bill_date),
      customer: {
        name: b.customer_name,
        phone: b.customer_phone,
        address: b.customer_address || ''
      },
      items: itemsMap[b.id] || [],
      discType: b.disc_type,
      discValue: Number(b.disc_value),
      charges: Number(b.charges),
      received: Number(b.received),
      subtotal: Number(b.subtotal),
      discountAmt: Number(b.discount_amt),
      grandTotal: Number(b.grand_total),
      balance: Number(b.balance),
      createdAt: Number(b.created_at),
      updatedAt: Number(b.updated_at)
    }));

    res.json({ success: true, bills: formattedBills });
  } catch (err) {
    console.error('Error in getBills:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/bills/:id
async function getBillById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM bills WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    const b = rows[0];
    const [items] = await pool.query(
      'SELECT * FROM bill_items WHERE bill_id = ? ORDER BY item_order ASC',
      [id]
    );

    const bill = {
      id: b.id,
      invoiceNo: b.invoice_no,
      date: b.bill_date instanceof Date ? b.bill_date.toISOString().slice(0, 10) : String(b.bill_date),
      customer: {
        name: b.customer_name,
        phone: b.customer_phone,
        address: b.customer_address || ''
      },
      items: items.map((it) => ({
        id: it.id,
        name: it.name,
        qty: Number(it.qty),
        price: Number(it.price),
        disc: Number(it.disc),
        discType: it.disc_type,
        gross: Number(it.gross),
        net: Number(it.net)
      })),
      discType: b.disc_type,
      discValue: Number(b.disc_value),
      charges: Number(b.charges),
      received: Number(b.received),
      subtotal: Number(b.subtotal),
      discountAmt: Number(b.discount_amt),
      grandTotal: Number(b.grand_total),
      balance: Number(b.balance),
      createdAt: Number(b.created_at),
      updatedAt: Number(b.updated_at)
    };

    res.json({ success: true, bill });
  } catch (err) {
    console.error('Error in getBillById:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/bills
async function createBill(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const data = req.body;
    const id = data.id || uid();
    const invoiceNo = String(data.invoiceNo || '').trim();
    const date = data.date || new Date().toISOString().slice(0, 10);
    const customer = data.customer || {};
    const custName = String(customer.name || '').trim();
    const custPhone = String(customer.phone || '').trim();
    const custAddress = String(customer.address || '').trim();
    const items = Array.isArray(data.items) ? data.items : [];

    if (!invoiceNo) {
      throw new Error('Invoice Number is required.');
    }
    if (!custName || !custPhone) {
      throw new Error('Customer Name and Phone are required.');
    }
    if (items.length === 0) {
      throw new Error('Bill must contain at least one item.');
    }

    // Check duplicate invoice_no
    const [existing] = await connection.query('SELECT id FROM bills WHERE invoice_no = ?', [invoiceNo]);
    if (existing.length > 0) {
      throw new Error(`Invoice ${invoiceNo} already exists.`);
    }

    // Calculate totals server-side
    const calc = calculateBill(data);
    const now = Date.now();
    const createdAt = data.createdAt ? Number(data.createdAt) : now;
    const updatedAt = now;

    // 1. Insert bill
    await connection.query(
      `INSERT INTO bills (
        id, invoice_no, bill_date, customer_name, customer_phone, customer_address,
        disc_type, disc_value, charges, received, subtotal, discount_amt, grand_total, balance,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        invoiceNo,
        date,
        custName,
        custPhone,
        custAddress,
        data.discType === 'pct' ? 'pct' : 'rs',
        num(data.discValue),
        num(data.charges),
        num(data.received),
        calc.subtotal,
        calc.discountAmt,
        calc.grand,
        calc.balance,
        createdAt,
        updatedAt
      ]
    );

    // 2. Insert items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const ln = calc.lines[i];
      await connection.query(
        `INSERT INTO bill_items (
          bill_id, item_order, name, qty, price, disc, disc_type, gross, line_disc, net
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          i,
          String(it.name || '').trim(),
          num(it.qty),
          num(it.price),
          num(it.disc),
          it.discType === 'pct' ? 'pct' : 'rs',
          ln.gross,
          ln.disc,
          ln.net
        ]
      );

      // Save/remember product
      if (it.name && num(it.price) > 0) {
        await connection.query(
          `INSERT INTO products (name, price) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE price = VALUES(price), updated_at = CURRENT_TIMESTAMP`,
          [String(it.name).trim(), num(it.price)]
        );
      }
    }

    // 3. Save/remember customer
    await connection.query(
      `INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), address = VALUES(address), updated_at = CURRENT_TIMESTAMP`,
      [custName, custPhone, custAddress]
    );

    // 4. Update invoice counter in app_settings
    const m = /(\d+)\s*$/.exec(invoiceNo);
    if (m) {
      const invNum = parseInt(m[1], 10);
      await connection.query(
        `INSERT INTO app_settings (setting_key, setting_value) VALUES ('invoice_counter', ?)
         ON DUPLICATE KEY UPDATE setting_value = GREATEST(CAST(setting_value AS UNSIGNED), ?)`,
        [String(invNum), invNum]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Bill ${invoiceNo} saved successfully.`,
      bill: {
        id,
        invoiceNo,
        date,
        customer: { name: custName, phone: custPhone, address: custAddress },
        items,
        discType: data.discType === 'pct' ? 'pct' : 'rs',
        discValue: num(data.discValue),
        charges: num(data.charges),
        received: num(data.received),
        subtotal: calc.subtotal,
        discountAmt: calc.discountAmt,
        grandTotal: calc.grand,
        balance: calc.balance,
        createdAt,
        updatedAt
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error in createBill:', err);
    res.status(400).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
}

// PUT /api/bills/:id
async function updateBill(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const data = req.body;
    const invoiceNo = String(data.invoiceNo || '').trim();
    const date = data.date || new Date().toISOString().slice(0, 10);
    const customer = data.customer || {};
    const custName = String(customer.name || '').trim();
    const custPhone = String(customer.phone || '').trim();
    const custAddress = String(customer.address || '').trim();
    const items = Array.isArray(data.items) ? data.items : [];

    if (!invoiceNo) throw new Error('Invoice Number is required.');
    if (!custName || !custPhone) throw new Error('Customer Name and Phone are required.');
    if (items.length === 0) throw new Error('Bill must contain at least one item.');

    // Check duplicate invoice_no excluding this bill
    const [existing] = await connection.query(
      'SELECT id FROM bills WHERE invoice_no = ? AND id != ?',
      [invoiceNo, id]
    );
    if (existing.length > 0) {
      throw new Error(`Invoice ${invoiceNo} already exists.`);
    }

    const calc = calculateBill(data);
    const updatedAt = Date.now();

    // 1. Update bill
    await connection.query(
      `UPDATE bills SET
        invoice_no = ?, bill_date = ?, customer_name = ?, customer_phone = ?, customer_address = ?,
        disc_type = ?, disc_value = ?, charges = ?, received = ?, subtotal = ?, discount_amt = ?,
        grand_total = ?, balance = ?, updated_at = ?
       WHERE id = ?`,
      [
        invoiceNo,
        date,
        custName,
        custPhone,
        custAddress,
        data.discType === 'pct' ? 'pct' : 'rs',
        num(data.discValue),
        num(data.charges),
        num(data.received),
        calc.subtotal,
        calc.discountAmt,
        calc.grand,
        calc.balance,
        updatedAt,
        id
      ]
    );

    // 2. Remove old items and insert updated items
    await connection.query('DELETE FROM bill_items WHERE bill_id = ?', [id]);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const ln = calc.lines[i];
      await connection.query(
        `INSERT INTO bill_items (
          bill_id, item_order, name, qty, price, disc, disc_type, gross, line_disc, net
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          i,
          String(it.name || '').trim(),
          num(it.qty),
          num(it.price),
          num(it.disc),
          it.discType === 'pct' ? 'pct' : 'rs',
          ln.gross,
          ln.disc,
          ln.net
        ]
      );

      // Save/remember product
      if (it.name && num(it.price) > 0) {
        await connection.query(
          `INSERT INTO products (name, price) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE price = VALUES(price), updated_at = CURRENT_TIMESTAMP`,
          [String(it.name).trim(), num(it.price)]
        );
      }
    }

    // 3. Update customer
    await connection.query(
      `INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), address = VALUES(address), updated_at = CURRENT_TIMESTAMP`,
      [custName, custPhone, custAddress]
    );

    // 4. Update invoice counter
    const m = /(\d+)\s*$/.exec(invoiceNo);
    if (m) {
      const invNum = parseInt(m[1], 10);
      await connection.query(
        `INSERT INTO app_settings (setting_key, setting_value) VALUES ('invoice_counter', ?)
         ON DUPLICATE KEY UPDATE setting_value = GREATEST(CAST(setting_value AS UNSIGNED), ?)`,
        [String(invNum), invNum]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Bill ${invoiceNo} updated successfully.`,
      bill: {
        id,
        invoiceNo,
        date,
        customer: { name: custName, phone: custPhone, address: custAddress },
        items,
        discType: data.discType === 'pct' ? 'pct' : 'rs',
        discValue: num(data.discValue),
        charges: num(data.charges),
        received: num(data.received),
        subtotal: calc.subtotal,
        discountAmt: calc.discountAmt,
        grandTotal: calc.grand,
        balance: calc.balance,
        updatedAt
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error in updateBill:', err);
    res.status(400).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
}

// DELETE /api/bills/:id
async function deleteBill(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM bills WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (err) {
    console.error('Error in deleteBill:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getNextInvoiceNo,
  getBills,
  getBillById,
  createBill,
  updateBill,
  deleteBill
};
