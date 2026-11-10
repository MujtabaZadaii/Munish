const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');

router.get('/next-invoice', billController.getNextInvoiceNo);
router.get('/', billController.getBills);
router.get('/:id', billController.getBillById);
router.post('/', billController.createBill);
router.put('/:id', billController.updateBill);
router.delete('/:id', billController.deleteBill);

module.exports = router;

