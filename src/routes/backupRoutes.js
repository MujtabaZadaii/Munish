const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

// Support both /api/backup and /api/backup/export
router.get('/', backupController.exportBackup);
router.get('/export', backupController.exportBackup);
router.post('/restore', backupController.restoreBackup);

module.exports = router;
