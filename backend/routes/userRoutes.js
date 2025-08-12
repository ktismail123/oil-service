const express = require('express');
const { createUser, getAllUsers, deleteUser } = require('../controllers/userController');
const router = express.Router();

router.post('/create', createUser);
router.get('/all', getAllUsers);
router.delete('/:id', deleteUser);

module.exports = router;