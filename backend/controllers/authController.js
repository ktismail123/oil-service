const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');

const SECRET_KEY = 'your_jwt_secret'; // Move to .env in production

// Register
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body; // now includes role
        const db = getDB();

        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Validate role (only 'manager' or 'technician')
        const userRole = role && ['manager', 'technician'].includes(role) ? role : 'technician';

        await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [
            name, email, hashedPassword, userRole
        ]);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


// Login
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const db = getDB();

        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

       if (role.toLowerCase() !== user.role.toLowerCase()) {
             return res.status(401).json({ message: 'User does not have the specified role' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role }, // role added here
            SECRET_KEY,
            { expiresIn: '1d' }
        );

        // Send token + role in response
        res.json({
            data:{
                token,
                role: user.role
            },
            success: true
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


// Profile
exports.getProfile = async (req, res) => {
    try {
        const db = getDB();
        const [rows] = await db.query(
            'SELECT id, name, email FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
