const { pool } = require('../config/db');

// GET /api/customers
async function getCustomers(req, res) {
  try {
    const { q } = req.query;
    let sql = 'SELECT * FROM customers';
    const params = [];

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      const digitsOnly = q.replace(/\D/g, '');
      if (digitsOnly.length >= 3) {
        sql += ' WHERE name LIKE ? OR phone LIKE ? OR REPLACE(REPLACE(REPLACE(phone, " ", ""), "-", ""), "+", "") LIKE ?';
        params.push(searchTerm, searchTerm, `%${digitsOnly}%`);
      } else {
        sql += ' WHERE name LIKE ? OR phone LIKE ?';
        params.push(searchTerm, searchTerm);
      }
    }

    sql += ' ORDER BY updated_at DESC, name ASC LIMIT 50';
    const [rows] = await pool.query(sql, params);

    res.json({ success: true, count: rows.length, customers: rows });
  } catch (err) {
    console.error('Error in getCustomers:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/customers
async function saveCustomer(req, res) {
  try {
    const { name, phone, address } = req.body;
    const cleanName = String(name || '').trim();
    const cleanPhone = String(phone || '').trim();
    const cleanAddress = String(address || '').trim();

    if (!cleanName || !cleanPhone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), address = VALUES(address), updated_at = CURRENT_TIMESTAMP`,
      [cleanName, cleanPhone, cleanAddress]
    );

    res.json({
      success: true,
      message: 'Customer saved successfully.',
      customer: {
        id: result.insertId,
        name: cleanName,
        phone: cleanPhone,
        address: cleanAddress
      }
    });
  } catch (err) {
    console.error('Error in saveCustomer:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getCustomers,
  saveCustomer
};
