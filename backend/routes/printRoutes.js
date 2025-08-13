const express = require('express');
const router = express.Router();
const { printTestReceipt } = require('../services/printerService');

router.post('/', async (req, res) => {
  try {
    await printTestReceipt(req.body);
    res.json({ success: true, message: 'Receipt printed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
