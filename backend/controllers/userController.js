const { getDB, dbConfig } = require('../config/db');
const bcrypt = require('bcryptjs');
const createUser = async (req, res) => {
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
}

const getAllUsers = async (req, res) => {
    try {
        const db = getDB();

        // Fetch all users, exclude password for security
        const [users] = await db.query(`
            SELECT id, name, email, role, created_at, updated_at 
            FROM users
            ORDER BY created_at DESC
        `);

        if (!users.length) {
            return res.status(404).json({ message: 'No users found' });
        }

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: err.message 
        });
    }
};



module.exports = {
    createUser,
    getAllUsers
}