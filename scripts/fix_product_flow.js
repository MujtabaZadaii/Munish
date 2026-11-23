const fs = require('fs');
const path = require('path');

// 1. Update src/controllers/billController.js
const billCtrlPath = path.join(__dirname, '..', 'src', 'controllers', 'billController.js');
let billCtrl = fs.readFileSync(billCtrlPath, 'utf8');

const oldPhoneCheck1 = `if (!invoiceNo) {
      throw new Error('Invoice Number is required.');
    }
    if (!custName || !custPhone) {
      throw new Error('Customer Name and Phone are required.');
    }`;

const newPhoneCheck1 = `if (!invoiceNo) {
      throw new Error('Invoice Number is required.');
    }
    if (!custName) {
      throw new Error('Customer Name is required.');
    }`;

const oldPhoneCheck2 = `if (!invoiceNo) throw new Error('Invoice Number is required.');
    if (!custName || !custPhone) throw new Error('Customer Name and Phone are required.');`;

const newPhoneCheck2 = `if (!invoiceNo) throw new Error('Invoice Number is required.');
    if (!custName) throw new Error('Customer Name is required.');`;

if (billCtrl.includes(oldPhoneCheck1)) {
  billCtrl = billCtrl.replace(oldPhoneCheck1, newPhoneCheck1);
  console.log('✓ billController createBill phone check updated');
}
if (billCtrl.includes(oldPhoneCheck2)) {
  billCtrl = billCtrl.replace(oldPhoneCheck2, newPhoneCheck2);
  console.log('✓ billController updateBill phone check updated');
}

fs.writeFileSync(billCtrlPath, billCtrl, 'utf8');

// 2. Update new/index.html
const indexHtmlPath = path.join(__dirname, '..', 'new', 'index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// A. Improve renderProducts to not destroy master cache during search
const oldRenderProducts = `  async function renderProducts() {
    var q = ($('#productSearch').value || '').trim();
    var all = await api.getProducts(q);
    if (all) { dbProducts = all; store.set(K.products, all); }
    else { all = loadProducts(); }

    $('#productCount').textContent = all.length;
    $('#productListCount').textContent = all.length + (all.length === 1 ? ' product' : ' products');
    $('#productsList').innerHTML = all.length ? all.map(function (p, idx) {
      return '<div class="product-row" data-id="' + (p.id || '') + '" data-product-index="' + idx + '">' +
        '<div class="me-auto"><div class="product-name">' + esc(p.name) + '</div><div class="product-price">' + esc(rs(p.price)) + '</div></div>' +
        '<div class="product-actions"><button type="button" class="btn btn-sm btn-outline-navy product-edit" title="Edit"><i class="bi bi-pencil"></i> Edit</button>' +
        '<button type="button" class="btn btn-sm btn-outline-danger product-delete" title="Delete"><i class="bi bi-trash3"></i> Delete</button></div></div>';
    }).join('') : '<div class="empty-state"><i class="bi bi-box"></i>' + (q ? 'No products match your search.' : 'No saved products yet. Add a product above or import a CSV/Excel file.') + '</div>';
  }`;

const newRenderProducts = `  async function renderProducts() {
    var q = ($('#productSearch').value || '').trim();
    var all = await api.getProducts(q);
    if (!q && all) {
      dbProducts = all;
      store.set(K.products, all);
    }
    if (!all) {
      var full = loadProducts();
      all = q ? full.filter(function (p) { return (p.name || '').toLowerCase().includes(q.toLowerCase()); }) : full;
    }

    $('#productCount').textContent = (dbProducts && dbProducts.length) ? dbProducts.length : (loadProducts().length);
    $('#productListCount').textContent = all.length + (all.length === 1 ? ' product' : ' products');
    $('#productsList').innerHTML = all.length ? all.map(function (p, idx) {
      return '<div class="product-row" data-id="' + (p.id || '') + '" data-product-index="' + idx + '">' +
        '<div class="me-auto"><div class="product-name">' + esc(p.name) + '</div><div class="product-price">' + esc(rs(p.price)) + '</div></div>' +
        '<div class="product-actions"><button type="button" class="btn btn-sm btn-outline-navy product-edit" title="Edit"><i class="bi bi-pencil"></i> Edit</button>' +
        '<button type="button" class="btn btn-sm btn-outline-danger product-delete" title="Delete"><i class="bi bi-trash3"></i> Delete</button></div></div>';
    }).join('') : '<div class="empty-state"><i class="bi bi-box"></i>' + (q ? 'No products match your search.' : 'No saved products yet. Add a product above or import a CSV/Excel file.') + '</div>';
  }`;

if (indexHtml.includes(oldRenderProducts)) {
  indexHtml = indexHtml.replace(oldRenderProducts, newRenderProducts);
  console.log('✓ renderProducts cache preservation during search updated');
} else {
  console.log('! renderProducts exact match not found');
}

// B. Improve Product Form submit and Edit / Delete actions with productEditingId
const oldProductHandlers = `    $('#productForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var p = normalizeProduct({ name: $('#productName').value, price: $('#productPrice').value });
      if (!p) { toast('Enter a product name and a valid selling price.', 'warning'); return; }
      var editingId = (productEditIndex >= 0 && dbProducts[productEditIndex]) ? dbProducts[productEditIndex].id : null;
      try {
        var res = await api.saveProduct(p, editingId);
        if (!res.success) throw new Error(res.message);
        clearProductForm();
        await renderProducts();
        toast(res.message || 'Product saved to MySQL.', 'success');
      } catch (err) {
        toast('Product saved locally: ' + err.message, 'warning');
        saveProductRecord(p, 'skip');
        clearProductForm();
        renderProducts();
      }
    });
    $('#productCancelBtn').addEventListener('click', clearProductForm);

    $('#deleteAllProductsBtn').addEventListener('click', function () {
      var allProducts = loadProducts();
      if (!allProducts.length) { toast('There are no saved products to delete.', 'info'); return; }
      confirmDialog(
        'Delete all products from MySQL?',
        'This will permanently delete all ' + allProducts.length + ' saved product(s) from MySQL database. This action cannot be undone.',
        'Delete all products',
        true
      ).then(async function (ok) {
        if (!ok) return;
        try {
          var res = await api.deleteAllProducts();
          if (!res.success) throw new Error(res.message);
          dbProducts = [];
          store.set(K.products, []);
          clearProductForm();
          $('#productSearch').value = '';
          await renderProducts();
          toast('All products deleted from MySQL database.', 'success', 5000);
        } catch (err) {
          store.set(K.products, []);
          clearProductForm();
          $('#productSearch').value = '';
          renderProducts();
          toast('Deleted locally: ' + err.message, 'warning');
        }
      });
    });

    $('#productsList').addEventListener('click', function (e) {
      var row = e.target.closest('[data-product-index]'); if (!row) return;
      var idx = Number(row.getAttribute('data-product-index')), list = loadProducts(), p = list[idx];
      if (!p) return;
      if (e.target.closest('.product-edit')) {
        productEditIndex = idx; $('#productName').value = p.name; $('#productPrice').value = p.price;
        $('#productSaveBtn').innerHTML = '<i class="bi bi-check-lg me-1"></i> Update Product';
        $('#productCancelWrap').classList.remove('d-none');
        $('#productName').focus(); window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (e.target.closest('.product-delete')) {
        confirmDialog('Delete product?', '“' + p.name + '” will be removed from MySQL database.', 'Delete product', true).then(async function (ok) {
          if (!ok) return;
          try {
            if (p.id) {
              var res = await api.deleteProduct(p.id);
              if (!res.success) throw new Error(res.message);
            }
            list.splice(idx, 1);
            dbProducts = list;
            store.set(K.products, list);
            if (productEditIndex === idx) clearProductForm();
            await renderProducts();
            toast('Product deleted from MySQL.', 'success');
          } catch (err) {
            list.splice(idx, 1);
            store.set(K.products, list);
            if (productEditIndex === idx) clearProductForm();
            renderProducts();
            toast('Deleted locally: ' + err.message, 'warning');
          }
        });
      }
    });`;

const newProductHandlers = `    var productEditingId = null;

    function clearProductForm() {
      productEditIndex = -1;
      productEditingId = null;
      $('#productName').value = '';
      $('#productPrice').value = '';
      $('#productSaveBtn').innerHTML = '<i class="bi bi-plus-lg me-1"></i> Save Product';
      $('#productCancelWrap').classList.add('d-none');
    }

    $('#productForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var p = normalizeProduct({ name: $('#productName').value, price: $('#productPrice').value });
      if (!p) { toast('Enter a product name and a valid selling price.', 'warning'); return; }
      var editingId = productEditingId || ((productEditIndex >= 0 && dbProducts[productEditIndex]) ? dbProducts[productEditIndex].id : null);
      try {
        var res = await api.saveProduct(p, editingId);
        if (!res.success) throw new Error(res.message);
        clearProductForm();
        await renderProducts();
        toast(res.message || 'Product saved to MySQL.', 'success');
      } catch (err) {
        toast('Product saved locally: ' + err.message, 'warning');
        saveProductRecord(p, 'skip');
        clearProductForm();
        renderProducts();
      }
    });
    $('#productCancelBtn').addEventListener('click', clearProductForm);

    $('#deleteAllProductsBtn').addEventListener('click', function () {
      var allProducts = loadProducts();
      if (!allProducts.length) { toast('There are no saved products to delete.', 'info'); return; }
      confirmDialog(
        'Delete all products from MySQL?',
        'This will permanently delete all ' + allProducts.length + ' saved product(s) from MySQL database. This action cannot be undone.',
        'Delete all products',
        true
      ).then(async function (ok) {
        if (!ok) return;
        try {
          var res = await api.deleteAllProducts();
          if (!res.success) throw new Error(res.message);
          dbProducts = [];
          store.set(K.products, []);
          clearProductForm();
          $('#productSearch').value = '';
          await renderProducts();
          toast('All products deleted from MySQL database.', 'success', 5000);
        } catch (err) {
          store.set(K.products, []);
          clearProductForm();
          $('#productSearch').value = '';
          renderProducts();
          toast('Deleted locally: ' + err.message, 'warning');
        }
      });
    });

    $('#productsList').addEventListener('click', function (e) {
      var row = e.target.closest('[data-id]'); if (!row) return;
      var prodId = row.getAttribute('data-id');
      var prodIndex = Number(row.getAttribute('data-product-index'));
      var list = loadProducts();
      var p = list.find(function (x) { return String(x.id) === String(prodId); }) || list[prodIndex];
      if (!p) return;

      if (e.target.closest('.product-edit')) {
        productEditingId = p.id || prodId || null;
        productEditIndex = prodIndex;
        $('#productName').value = p.name;
        $('#productPrice').value = p.price;
        $('#productSaveBtn').innerHTML = '<i class="bi bi-check-lg me-1"></i> Update Product';
        $('#productCancelWrap').classList.remove('d-none');
        $('#productName').focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (e.target.closest('.product-delete')) {
        confirmDialog('Delete product?', '“' + p.name + '” will be removed from MySQL database.', 'Delete product', true).then(async function (ok) {
          if (!ok) return;
          try {
            if (p.id || prodId) {
              var res = await api.deleteProduct(p.id || prodId);
              if (!res.success) throw new Error(res.message);
            }
            if (productEditingId === (p.id || prodId)) clearProductForm();
            await renderProducts();
            toast('Product deleted from MySQL.', 'success');
          } catch (err) {
            var fullList = loadProducts().filter(function (x) { return String(x.id) !== String(p.id || prodId) && x.name !== p.name; });
            dbProducts = fullList;
            store.set(K.products, fullList);
            if (productEditingId === (p.id || prodId)) clearProductForm();
            renderProducts();
            toast('Deleted locally: ' + err.message, 'warning');
          }
        });
      }
    });`;

if (indexHtml.includes(oldProductHandlers)) {
  indexHtml = indexHtml.replace(oldProductHandlers, newProductHandlers);
  console.log('✓ Product form submit & list edit/delete handlers modernized');
} else {
  console.log('! Product form handlers exact match not found');
}

fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
console.log('Script execution complete.');
