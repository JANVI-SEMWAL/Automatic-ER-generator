const express = require('express');
const router = express.Router();
const { toER, toSQL, downloadPDF, downloadTablePDF } = require('../controllers/convertController');
const auth = require('../middleware/authMiddleware');

router.post('/toER', auth, toER);
router.post('/toSQL', auth, toSQL);
router.post('/downloadPDF', auth, downloadPDF);
router.post('/downloadTablePDF', auth, downloadTablePDF);

module.exports = router;
