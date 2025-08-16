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

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role } = req.body;
        const db = getDB();

        // Validate user ID
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Check if user exists
        const [existingUser] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (existingUser.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const currentUser = existingUser[0];
        let updateData = {};

        // Validate and prepare name update
        if (name !== undefined) {
            if (name.trim().length < 2 || name.trim().length > 50) {
                return res.status(400).json({ message: 'Name must be between 2 and 50 characters' });
            }
            updateData.name = name.trim();
        }

        // Validate and prepare email update
        if (email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }
            
            // Check if email exists for another user
            if (email !== currentUser.email) {
                const [emailExists] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
                if (emailExists.length > 0) {
                    return res.status(400).json({ message: 'Email already exists for another user' });
                }
            }
            updateData.email = email.trim();
        }

        // Validate and prepare password update
        if (password !== undefined && password !== '') {
            if (password.length < 8) {
                return res.status(400).json({ message: 'Password must be at least 8 characters long' });
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Validate and prepare role update
        if (role !== undefined) {
            if (!['manager', 'technician'].includes(role)) {
                return res.status(400).json({ message: 'Role must be either manager or technician' });
            }
            updateData.role = role;
        }

        // Check if there are any changes
        const hasChanges = Object.keys(updateData).length > 0;
        if (!hasChanges) {
            return res.status(400).json({ message: 'No changes provided' });
        }

        // Build dynamic update query
        const updateFields = Object.keys(updateData).map(field => `${field} = ?`);
        const updateValues = Object.values(updateData);
        
        updateFields.push('updated_at = NOW()');
        updateValues.push(id);

        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        
        const [result] = await db.query(updateQuery, updateValues);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found or no changes made' });
        }

        // Return updated user data (excluding password)
        const [updatedUser] = await db.query(
            'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );

        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser[0],
            updatedFields: Object.keys(updateData)
        });

    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


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
    updateUser,
    deleteUser
}