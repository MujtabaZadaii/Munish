const base = 'https://teal-peafowl-102461.hostingersite.com';
const origin = 'https://aone-billing.vercel.app';

async function runTests() {
  const results = [];

  async function test(name, fn) {
    try {
      const res = await fn();
      results.push({ name, pass: true, detail: res });
      console.log(`[PASS] ${name}`);
    } catch (err) {
      results.push({ name, pass: false, error: err.message });
      console.log(`[FAIL] ${name}: ${err.message}`);
    }
  }

  // 1. Health & DB
  await test('Health check', async () => {
    const res = await fetch(`${base}/api/health`, {
      headers: { 'Origin': origin }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    return json;
  });

  // 2. CORS preflight
  await test('CORS Preflight (OPTIONS /api/products)', async () => {
    const res = await fetch(`${base}/api/products`, {
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    if (!allowOrigin || (allowOrigin !== '*' && allowOrigin !== origin)) {
      throw new Error(`CORS header mismatch: ${allowOrigin}`);
    }
    return { status: res.status, allowOrigin };
  });

  // 3. Next Invoice
  let nextInv = '';
  await test('Get Next Invoice No (GET /api/bills/next-invoice)', async () => {
    const res = await fetch(`${base}/api/bills/next-invoice`, {
      headers: { 'Origin': origin }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    nextInv = json.invoiceNo || json.invoice_no;
    if (!nextInv) throw new Error('No invoiceNo returned');
    return json;
  });

  // 4. Products: List
  let initialProducts = [];
  await test('Get Products (GET /api/products)', async () => {
    const res = await fetch(`${base}/api/products`, {
      headers: { 'Origin': origin }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    initialProducts = await res.json();
    return { count: initialProducts.length };
  });

  // 5. Products: Add Test Product
  let createdProductId = null;
  const testProductName = 'Test Product ' + Date.now();
  await test('Add Product (POST /api/products)', async () => {
    const res = await fetch(`${base}/api/products`, {
      method: 'POST',
      headers: {
        'Origin': origin,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: testProductName,
        price: 450,
        unit: 'Pcs',
        category: 'Hardware'
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Status ${res.status}: ${errText}`);
    }
    const json = await res.json();
    createdProductId = json.id || (json.product && json.product.id);
    if (!createdProductId) throw new Error('No product ID returned');
    return json;
  });

  // 6. Products: Update Product
  await test('Update Product (PUT /api/products/:id)', async () => {
    if (!createdProductId) throw new Error('No created product ID');
    const res = await fetch(`${base}/api/products/${createdProductId}`, {
      method: 'PUT',
      headers: {
        'Origin': origin,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: testProductName + ' (Updated)',
        price: 500,
        unit: 'Pcs'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    return await res.json();
  });

  // 7. Products: Delete Product
  await test('Delete Product (DELETE /api/products/:id)', async () => {
    if (!createdProductId) throw new Error('No created product ID');
    const res = await fetch(`${base}/api/products/${createdProductId}`, {
      method: 'DELETE',
      headers: { 'Origin': origin }
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    return await res.json();
  });

  // 8. Bills: Create Bill
  let testBillId = 'TEST-' + Date.now();
  await test('Create Bill (POST /api/bills)', async () => {
    const billPayload = {
      id: testBillId,
      invoiceNo: nextInv || ('INV-' + Math.floor(1000 + Math.random() * 9000)),
      date: new Date().toISOString().slice(0, 10),
      customer: {
        name: 'Automated Test Customer',
        phone: '03001234567',
        address: 'Test Market Chishtian'
      },
      items: [
        {
          name: 'PVC Pipe 1 inch',
          qty: 2,
          price: 350,
          discount: 0,
          discountType: 'rs',
          total: 700
        }
      ],
      subtotal: 700,
      discount: 0,
      discountType: 'rs',
      discountVal: 0,
      charges: 50,
      grandTotal: 750,
      received: 750,
      balance: 0,
      notes: 'Test bill created by automated verification'
    };

    const res = await fetch(`${base}/api/bills`, {
      method: 'POST',
      headers: {
        'Origin': origin,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(billPayload)
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    return await res.json();
  });

  // 9. Bills: List
  await test('List Bills (GET /api/bills)', async () => {
    const res = await fetch(`${base}/api/bills`, {
      headers: { 'Origin': origin }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const list = await res.json();
    return { count: list.length };
  });

  // 10. Customers Ledger
  await test('Get Customers Ledger (GET /api/customers)', async () => {
    const res = await fetch(`${base}/api/customers`, {
      headers: { 'Origin': origin }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const list = await res.json();
    return { count: list.length };
  });

  // 11. Reports: Stats
  await test('Get Report Stats (GET /api/reports/stats)', async () => {
    const res = await fetch(`${base}/api/reports/stats`, {
      headers: { 'Origin': origin }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  });

  // 12. Reports: Annual
  await test('Get Annual Report (GET /api/reports/annual)', async () => {
    const res = await fetch(`${base}/api/reports/annual?year=${new Date().getFullYear()}`, {
      headers: { 'Origin': origin }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  });

  // 13. Bills: Delete Test Bill
  await test('Delete Test Bill (DELETE /api/bills/:id)', async () => {
    const res = await fetch(`${base}/api/bills/${testBillId}`, {
      method: 'DELETE',
      headers: { 'Origin': origin }
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    return await res.json();
  });

  console.log('\n--- SUMMARY ---');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`Total: ${results.length}, Passed: ${passed}, Failed: ${failed}`);
}

runTests();

