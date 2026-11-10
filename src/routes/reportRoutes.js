const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/stats', reportController.getStatsSummary);
router.get('/annual', reportController.getAnnualReport);

module.exports = router;
