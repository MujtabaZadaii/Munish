const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.post('/bulk', productController.bulkImportProducts);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.delete('/', productController.deleteAllProducts);

module.exports = router;
