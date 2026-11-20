const { pool } = require('../config/db');
const { calculateBill, num } = require('../utils/calc');

// GET /api/backup/export
async function exportBackup(req, res) {
  try {
    const [bills] = await pool.query('SELECT * FROM bills ORDER BY bill_date ASC, created_at ASC');
    const [items] = await pool.query('SELECT * FROM bill_items ORDER BY bill_id, item_order ASC');
    const [customers] = await pool.query('SELECT * FROM customers ORDER BY name ASC');
    const [products] = await pool.query('SELECT * FROM products ORDER BY name ASC');
    const [settings] = await pool.query('SELECT * FROM app_settings WHERE setting_key = "invoice_counter"');

    const itemsMap = {};
    for (const it of items) {
      if (!itemsMap[it.bill_id]) itemsMap[it.bill_id] = [];
      itemsMap[it.bill_id].push({
        name: it.name,
        qty: Number(it.qty),
        price: Number(it.price),
        disc: Number(it.disc),
        discType: it.disc_type
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

    const formattedProducts = products.map((p) => ({
      name: p.name,
      price: Number(p.price)
    }));

    const formattedCustomers = customers.map((c) => ({
      name: c.name,
      phone: c.phone,
      address: c.address || ''
    }));

    const counter = settings.length ? parseInt(settings[0].setting_value, 10) || 1000 : 1000;

    const backupData = {
      app: 'aone-billing',
      version: 1,
      exportedAt: new Date().toISOString(),
      bills: formattedBills,
      customers: formattedCustomers,
      products: formattedProducts,
      counter
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="A-One-Backup-${new Date().toISOString().slice(0, 10)}.json"`
    );
    res.json(backupData);
  } catch (err) {
    console.error('Error in exportBackup:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/backup/restore
async function restoreBackup(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const data = req.body || {};
    const mode = String(req.query.mode || data.mode || 'merge').toLowerCase(); // 'merge' or 'replace'

    // Extract records supporting all backup shapes
    let rawBills = [];
    let rawProducts = [];
    let rawCustomers = [];
    let backupCounter = null;

    if (Array.isArray(data)) {
      rawBills = data;
    } else if (typeof data === 'object') {
      if (Array.isArray(data.bills)) rawBills = data.bills;
      if (Array.isArray(data.products)) rawProducts = data.products;
      if (Array.isArray(data.customers)) rawCustomers = data.customers;
      if (data.counter != null) backupCounter = Number(data.counter);
    }

    if (mode === 'replace') {
      await connection.query('DELETE FROM bill_items');
      await connection.query('DELETE FROM bills');
      await connection.query('DELETE FROM products');
      await connection.query('DELETE FROM customers');
    }

    let addedBills = 0;
    let updatedBills = 0;
    let maxInvoiceNum = 0;

    // 1. Process Bills
    for (const b of rawBills) {
      if (!b || typeof b !== 'object') continue;
      const id = String(b.id || 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
      const invoiceNo = String(b.invoiceNo || b.invoice_no || 'INV-0000').slice(0, 50);
      const billDate = /^\d{4}-\d{2}-\d{2}$/.test(b.date || b.bill_date || '')
        ? (b.date || b.bill_date)
        : new Date().toISOString().slice(0, 10);

      const custObj = b.customer || {};
      const custName = String(custObj.name || b.customer_name || 'Walk-in Customer').trim().slice(0, 150);
      const custPhone = String(custObj.phone || b.customer_phone || '').trim().slice(0, 50);
      const custAddress = String(custObj.address || b.customer_address || '').trim();

      const items = Array.isArray(b.items) ? b.items : [];
      if (!items.length) continue;

      const calc = calculateBill({
        items,
        discType: b.discType || b.disc_type,
        discValue: b.discValue != null ? b.discValue : b.disc_value,
        charges: b.charges,
        received: b.received
      });

      const createdAt = Number(b.createdAt || b.created_at) || Date.now();
      const updatedAt = Number(b.updatedAt || b.updated_at) || Date.now();

      // Check if bill exists by ID or by invoice number to prevent duplicate key error
      const [existing] = await connection.query(
        'SELECT id, updated_at FROM bills WHERE id = ? OR invoice_no = ?',
        [id, invoiceNo]
      );

      let targetId = id;
      if (existing.length > 0) {
        targetId = existing[0].id;
        await connection.query(
          `UPDATE bills SET
            invoice_no = ?, bill_date = ?, customer_name = ?, customer_phone = ?, customer_address = ?,
            disc_type = ?, disc_value = ?, charges = ?, received = ?, subtotal = ?, discount_amt = ?,
            grand_total = ?, balance = ?, updated_at = ?
           WHERE id = ?`,
          [
            invoiceNo,
            billDate,
            custName,
            custPhone,
            custAddress,
            b.discType === 'pct' ? 'pct' : 'rs',
            num(b.discValue != null ? b.discValue : b.disc_value),
            num(b.charges),
            num(b.received),
            calc.subtotal,
            calc.discountAmt,
            calc.grand,
            calc.balance,
            updatedAt,
            targetId
          ]
        );

        await connection.query('DELETE FROM bill_items WHERE bill_id = ?', [targetId]);
        updatedBills++;
      } else {
        await connection.query(
          `INSERT INTO bills (
            id, invoice_no, bill_date, customer_name, customer_phone, customer_address,
            disc_type, disc_value, charges, received, subtotal, discount_amt, grand_total, balance,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            invoiceNo,
            billDate,
            custName,
            custPhone,
            custAddress,
            b.discType === 'pct' ? 'pct' : 'rs',
            num(b.discValue != null ? b.discValue : b.disc_value),
            num(b.charges),
            num(b.received),
            calc.subtotal,
            calc.discountAmt,
            calc.grand,
            calc.balance,
            createdAt,
            updatedAt
          ]
        );
        addedBills++;
      }

      // Insert line items
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const ln = calc.lines[i] || { gross: 0, disc: 0, net: 0 };
        await connection.query(
          `INSERT INTO bill_items (
            bill_id, item_order, name, qty, price, disc, disc_type, gross, line_disc, net
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            targetId,
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

        // Also ensure product is saved
        if (it.name && num(it.price) > 0) {
          await connection.query(
            `INSERT INTO products (name, price) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE price = VALUES(price), updated_at = CURRENT_TIMESTAMP`,
            [String(it.name).trim(), num(it.price)]
          );
        }
      }

      // Also ensure customer is remembered
      if (custName && custPhone) {
        const [foundCust] = await connection.query('SELECT id FROM customers WHERE phone = ?', [custPhone]);
        if (foundCust.length > 0) {
          await connection.query(
            'UPDATE customers SET name = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [custName, custAddress, foundCust[0].id]
          );
        } else {
          await connection.query(
            'INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)',
            [custName, custPhone, custAddress]
          );
        }
      }

      const m = /(\d+)\s*$/.exec(invoiceNo);
      if (m) maxInvoiceNum = Math.max(maxInvoiceNum, parseInt(m[1], 10));
    }

    // 2. Process Products
    for (const p of rawProducts) {
      const name = String(p.name || p['Product Name'] || '').trim();
      const price = num(p.price != null ? p.price : p['Selling Price']);
      if (name && price >= 0) {
        await connection.query(
          `INSERT INTO products (name, price) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE price = VALUES(price), updated_at = CURRENT_TIMESTAMP`,
          [name, price]
        );
      }
    }

    // 3. Process Customers
    for (const c of rawCustomers) {
      const name = String(c.name || '').trim();
      const phone = String(c.phone || '').trim();
      const address = String(c.address || '').trim();
      if (name && phone) {
        const [foundCust] = await connection.query('SELECT id FROM customers WHERE phone = ?', [phone]);
        if (foundCust.length > 0) {
          await connection.query(
            'UPDATE customers SET name = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, address, foundCust[0].id]
          );
        } else {
          await connection.query(
            'INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)',
            [name, phone, address]
          );
        }
      }
    }

    // 4. Update Counter
    if (backupCounter && backupCounter > maxInvoiceNum) {
      maxInvoiceNum = backupCounter;
    }
    if (maxInvoiceNum > 0) {
      await connection.query(
        `INSERT INTO app_settings (setting_key, setting_value) VALUES ('invoice_counter', ?)
         ON DUPLICATE KEY UPDATE setting_value = GREATEST(CAST(setting_value AS UNSIGNED), ?)`,
        [String(maxInvoiceNum), maxInvoiceNum]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Restore complete: ${addedBills} bills added, ${updatedBills} bills updated, ${rawProducts.length} products processed.`,
      stats: {
        addedBills,
        updatedBills,
        products: rawProducts.length,
        customers: rawCustomers.length,
        mode
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error in restoreBackup:', err);
    res.status(500).json({ success: false, message: 'Restore failed: ' + err.message });
  } finally {
    connection.release();
  }
}

module.exports = {
  exportBackup,
  restoreBackup
};
