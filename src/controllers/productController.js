const { pool } = require('../config/db');
const { round2, num } = require('../utils/calc');

// GET /api/products
async function getProducts(req, res) {
  try {
    const { q } = req.query;
    let sql = 'SELECT * FROM products';
    const params = [];

    if (q && q.trim()) {
      sql += ' WHERE name LIKE ?';
      params.push(`%${q.trim()}%`);
    }

    sql += ' ORDER BY name ASC';
    const [rows] = await pool.query(sql, params);

    const products = rows.map((r) => ({
      id: r.id,
      name: r.name,
      price: Number(r.price),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    res.json({ success: true, count: products.length, products });
  } catch (err) {
    console.error('Error in getProducts:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/products
async function createProduct(req, res) {
  try {
    const { name, price } = req.body;
    const cleanName = String(name || '').trim();
    const cleanPrice = round2(num(price));

    if (!cleanName) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    // Check if duplicate name
    const [existing] = await pool.query(
      'SELECT id, name FROM products WHERE LOWER(name) = LOWER(?)',
      [cleanName]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'A product with this name already exists.' });
    }

    const [result] = await pool.query(
      'INSERT INTO products (name, price) VALUES (?, ?)',
      [cleanName, cleanPrice]
    );

    res.status(201).json({
      success: true,
      message: 'Product added successfully.',
      product: {
        id: result.insertId,
        name: cleanName,
        price: cleanPrice
      }
    });
  } catch (err) {
    console.error('Error in createProduct:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/products/:id
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, price } = req.body;
    const cleanName = String(name || '').trim();
    const cleanPrice = round2(num(price));

    if (!cleanName) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    // Check duplicate name for other products
    const [existing] = await pool.query(
      'SELECT id FROM products WHERE LOWER(name) = LOWER(?) AND id != ?',
      [cleanName, id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Another product already uses this name.' });
    }

    const [result] = await pool.query(
      'UPDATE products SET name = ?, price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [cleanName, cleanPrice, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({
      success: true,
      message: 'Product updated successfully.',
      product: { id: Number(id), name: cleanName, price: cleanPrice }
    });
  } catch (err) {
    console.error('Error in updateProduct:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/products/:id
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Error in deleteProduct:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/products (Delete All)
async function deleteAllProducts(req, res) {
  try {
    await pool.query('DELETE FROM products');
    res.json({ success: true, message: 'All products deleted successfully.' });
  } catch (err) {
    console.error('Error in deleteAllProducts:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/products/bulk
async function bulkImportProducts(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { products, mode = 'update' } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'No products provided for import.' });
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;
    let invalid = 0;

    for (const item of products) {
      const name = String(item.name || item['Product Name'] || item.productName || '').trim().slice(0, 255);
      const priceRaw = item.price != null ? item.price : (item['Selling Price'] != null ? item['Selling Price'] : item.sellingPrice);
      const priceNum = Number(priceRaw);

      if (!name || priceRaw === '' || priceRaw == null || !isFinite(priceNum) || priceNum < 0) {
        invalid++;
        continue;
      }

      const cleanPrice = round2(priceNum);

      const [existing] = await connection.query(
        'SELECT id, price FROM products WHERE LOWER(name) = LOWER(?)',
        [name]
      );

      if (existing.length > 0) {
        if (mode === 'skip') {
          skipped++;
        } else {
          await connection.query(
            'UPDATE products SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [cleanPrice, existing[0].id]
          );
          updated++;
        }
      } else {
        await connection.query(
          'INSERT INTO products (name, price) VALUES (?, ?)',
          [name, cleanPrice]
        );
        added++;
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Import complete: ${added} added, ${updated} updated, ${skipped} skipped, ${invalid} invalid.`,
      stats: { added, updated, skipped, invalid }
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error in bulkImportProducts:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
}

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteAllProducts,
  bulkImportProducts
};
