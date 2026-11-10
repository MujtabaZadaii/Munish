function round2(x) {
  return Math.round((Number(x) + Number.EPSILON) * 100) / 100;
}

function num(v) {
  const n = parseFloat(v);
  return (isFinite(n) && n > 0) ? n : 0;
}

function lineCalc(it) {
  const qty = num(it.qty);
  const price = num(it.price);
  const gross = round2(qty * price);
  const discVal = num(it.disc);
  let d = it.discType === 'pct' ? (gross * Math.min(discVal, 100) / 100) : discVal;
  d = round2(Math.min(d, gross));
  const net = round2(gross - d);
  return {
    gross,
    disc: d,
    net
  };
}

function calculateBill(bill) {
  const items = Array.isArray(bill.items) ? bill.items : [];
  const lines = items.map(lineCalc);
  const subtotal = round2(lines.reduce((s, l) => s + l.net, 0));
  const dv = num(bill.discValue);
  let discountAmt = bill.discType === 'pct' ? (subtotal * Math.min(dv, 100) / 100) : dv;
  discountAmt = round2(Math.min(discountAmt, subtotal));
  const charges = round2(num(bill.charges));
  const grand = round2(subtotal - discountAmt + charges);
  const received = round2(num(bill.received));
  const balance = round2(grand - received);

  return {
    lines,
    subtotal,
    discountAmt,
    charges,
    grand,
    received,
    balance
  };
}

module.exports = {
  round2,
  num,
  lineCalc,
  calculateBill
};

