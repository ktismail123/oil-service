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

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    const db = getDB();
    
    console.log('Deleting user with ID:', userId);
    
    // Validate user ID
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ 
        message: 'Valid user ID is required' 
      });
    }
    
    // Check if user exists and get their details
    const [existingUser] = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [userId]
    );
    
    if (existingUser.length === 0) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    
    const user = existingUser[0];
    
    // Optional: Check if user has created any bookings (prevent deletion if they have data)
    const [userBookings] = await db.query(
      'SELECT COUNT(*) as count FROM service_bookings WHERE created_at = ? OR updated_at = ?',
      [userId, userId]
    );
    
    if (userBookings[0].count > 0) {
      return res.status(409).json({ 
        message: 'Cannot delete user. They have associated booking records.' 
      });
    }
    
    // Delete the user
    const [result] = await db.query(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        message: 'User not found or already deleted' 
      });
    }
    
    console.log('User deleted successfully:', userId);
    
    res.json({
      message: 'User deleted successfully',
      success: true,
      deletedUser: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (err) {
    console.error('Delete user failed:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};


module.exports = {
    createUser,
    getAllUsers,
    deleteUser
}