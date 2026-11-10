const { pool } = require('../config/db');

// GET /api/reports/stats
async function getStatsSummary(req, res) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);

    const [allBills] = await pool.query(
      'SELECT id, bill_date, grand_total, balance FROM bills'
    );

    let todayTotal = 0;
    let todayCount = 0;
    let monthTotal = 0;
    let monthCount = 0;
    let dueTotal = 0;
    let dueCount = 0;

    for (const b of allBills) {
      const bDate = b.bill_date instanceof Date ? b.bill_date.toISOString().slice(0, 10) : String(b.bill_date);
      const grand = Number(b.grand_total) || 0;
      const bal = Number(b.balance) || 0;

      if (bDate === today) {
        todayCount++;
        todayTotal += grand;
      }
      if (bDate.slice(0, 7) === month) {
        monthCount++;
        monthTotal += grand;
      }
      if (bal > 0.004) {
        dueTotal += bal;
        dueCount++;
      }
    }

    res.json({
      success: true,
      stats: {
        today: { count: todayCount, total: todayTotal },
        month: { count: monthCount, total: monthTotal },
        pending: { count: dueCount, total: dueTotal },
        totalBills: allBills.length
      }
    });
  } catch (err) {
    console.error('Error in getStatsSummary:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/reports/annual
async function getAnnualReport(req, res) {
  try {
    const currentYear = String(new Date().getFullYear());
    const year = req.query.year || currentYear;

    // 1. Get available years
    const [yearRows] = await pool.query(
      'SELECT DISTINCT YEAR(bill_date) AS yr FROM bills WHERE bill_date IS NOT NULL ORDER BY yr DESC'
    );
    const availableYears = yearRows.map((r) => String(r.yr)).filter(Boolean);
    if (!availableYears.includes(currentYear)) {
      availableYears.unshift(currentYear);
    }

    // 2. Query bills for requested year
    const [bills] = await pool.query(
      `SELECT id, invoice_no, bill_date, customer_name, grand_total, received, balance, created_at
       FROM bills
       WHERE YEAR(bill_date) = ?
       ORDER BY bill_date DESC, created_at DESC`,
      [Number(year)]
    );

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthsData = monthNames.map((name) => ({
      name,
      count: 0,
      amount: 0,
      received: 0,
      balance: 0
    }));

    let grandTotalSum = 0;
    let receivedSum = 0;
    let balanceSum = 0;

    for (const b of bills) {
      const bDate = b.bill_date instanceof Date ? b.bill_date.toISOString().slice(0, 10) : String(b.bill_date);
      const mIdx = parseInt(bDate.slice(5, 7), 10) - 1;
      const g = Number(b.grand_total) || 0;
      const r = Number(b.received) || 0;
      const bl = Number(b.balance) || 0;

      if (mIdx >= 0 && mIdx < 12) {
        monthsData[mIdx].count++;
        monthsData[mIdx].amount += g;
        monthsData[mIdx].received += r;
        monthsData[mIdx].balance += bl;
      }

      grandTotalSum += g;
      receivedSum += r;
      balanceSum += bl;
    }

    const billRows = bills.map((b) => ({
      id: b.id,
      invoiceNo: b.invoice_no,
      date: b.bill_date instanceof Date ? b.bill_date.toISOString().slice(0, 10) : String(b.bill_date),
      customerName: b.customer_name || 'Walk-in Customer',
      grandTotal: Number(b.grand_total) || 0,
      received: Number(b.received) || 0,
      balance: Number(b.balance) || 0
    }));

    res.json({
      success: true,
      year,
      availableYears,
      summary: {
        totalSales: grandTotalSum,
        totalBills: bills.length,
        avgBill: bills.length ? grandTotalSum / bills.length : 0,
        totalReceived: receivedSum,
        totalBalance: balanceSum
      },
      months: monthsData,
      bills: billRows
    });
  } catch (err) {
    console.error('Error in getAnnualReport:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getStatsSummary,
  getAnnualReport
};
