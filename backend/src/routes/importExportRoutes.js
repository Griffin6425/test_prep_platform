const express = require('express');
const router = express.Router();
const {
  exportToJSON,
  exportToExcel,
  importFromJSON,
  importFromExcel
} = require('../controllers/importExportController');
const authMiddleware = require('../middlewares/auth');
const { uploadExcel } = require('../config/upload');

router.use(authMiddleware);

// Export routes
router.get('/quiz-sets/:setId/export/json', exportToJSON);
router.get('/quiz-sets/:setId/export/excel', exportToExcel);

// Import routes
router.post('/quiz-sets/:setId/import/json', importFromJSON);
router.post('/quiz-sets/:setId/import/excel', uploadExcel.single('file'), importFromExcel);

module.exports = router;
