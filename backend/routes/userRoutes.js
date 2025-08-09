const express = require('express');
const { createUser, getAllUsers } = require('../controllers/userController');
const router = express.Router();

router.post('/create', createUser);
router.get('/all', getAllUsers);

module.exports = router;