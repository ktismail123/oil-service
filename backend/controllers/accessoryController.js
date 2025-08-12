const { getDB, dbConfig } = require('../config/db');

const getAllAccessorys = async (req, res) => {
try {
     const db = getDB();

    const category = req.query.category || '';
    let query = 'SELECT * FROM accessories';
    let params = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [results] = await db.execute(query, params);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accessories' });
  }
}

const createAccessory = async (req, res) => {
  try {
    const db = getDB();
    const { name, category, price, quantity_available } = req.body;
    
    console.log('Creating accessory with data:', req.body);
    
    // Validate required fields individually
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Accessory name is required' });
    }
    
    if (!category?.trim()) {
      return res.status(400).json({ error: 'Category is required' });
    }
    
    if (price === undefined || price === null || price === '') {
      return res.status(400).json({ error: 'Price is required' });
    }
    
    // Validate and sanitize name
    const accessoryName = name.trim();
    if (accessoryName.length < 2) {
      return res.status(400).json({ 
        error: 'Accessory name must be at least 2 characters long' 
      });
    }
    
    if (accessoryName.length > 100) {
      return res.status(400).json({ 
        error: 'Accessory name cannot exceed 100 characters' 
      });
    }
    
    // Validate and sanitize category
    const accessoryCategory = category.trim().toLowerCase();
    const validCategories = ['oil_service', 'battery_service', 'general'];
    if (!validCategories.includes(accessoryCategory)) {
      return res.status(400).json({ 
        error: `Category must be one of: ${validCategories.join(', ')}` 
      });
    }
    
    // Validate and sanitize price
    const accessoryPrice = parseFloat(price);
    if (isNaN(accessoryPrice) || accessoryPrice < 0) {
      return res.status(400).json({ 
        error: 'Price must be a valid non-negative number' 
      });
    }
    
    // Optional: Validate price range
    if (accessoryPrice > 1000) {
      return res.status(400).json({ 
        error: 'Price seems unreasonably high. Please verify.' 
      });
    }
    
    // Validate and sanitize quantity
    const quantity = quantity_available ? parseInt(quantity_available) : 0;
    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ 
        error: 'Quantity must be a valid non-negative number' 
      });
    }
    
    // Check for duplicate (case-insensitive name check within same category)
    const [existingAccessory] = await db.execute(
      'SELECT id, name FROM accessories WHERE LOWER(name) = LOWER(?) AND category = ?',
      [accessoryName, accessoryCategory]
    );
    
    if (existingAccessory.length > 0) {
      return res.status(409).json({ 
        error: `Accessory "${accessoryName}" already exists in ${accessoryCategory} category` 
      });
    }
    
    // Optional: Check for similar names (warning)
    const [similarAccessories] = await db.execute(
      'SELECT name FROM accessories WHERE category = ? AND SOUNDEX(name) = SOUNDEX(?)',
      [accessoryCategory, accessoryName]
    );
    
    if (similarAccessories.length > 0) {
      console.log(`Warning: Similar accessory names found in ${accessoryCategory} category:`, 
        similarAccessories.map(a => a.name));
    }
    
    // Insert new accessory
    const [result] = await db.execute(`
      INSERT INTO accessories (name, category, price, quantity_available, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      accessoryName,
      accessoryCategory,
      accessoryPrice,
      quantity
    ]);
    
    console.log('Accessory created successfully:', result.insertId);
    
    // Return created accessory data
    res.status(201).json({
      success: true,
      message: 'Accessory created successfully',
      accessoryId: result.insertId,
      data: {
        id: result.insertId,
        name: accessoryName,
        category: accessoryCategory,
        price: accessoryPrice,
        quantity_available: quantity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Create accessory failed:', error);
    console.error('Request body:', req.body);
    
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Accessory with this name and category already exists' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create accessory',
      details: error.message
    });
  }
};

const updateAccessory = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { name, category, price, quantity_available } = req.body;
    
    const accessoryId = parseInt(id);
    
    console.log('Updating accessory ID:', accessoryId, 'with data:', req.body);
    
    // Validate accessory ID
    if (!accessoryId || isNaN(accessoryId)) {
      return res.status(400).json({ 
        error: 'Valid accessory ID is required' 
      });
    }
    
    // Check if accessory exists and get current data
    const [existingAccessory] = await db.execute(
      'SELECT * FROM accessories WHERE id = ?',
      [accessoryId]
    );
    
    if (existingAccessory.length === 0) {
      return res.status(404).json({ 
        error: 'Accessory not found' 
      });
    }
    
    const currentAccessory = existingAccessory[0];
    
    // Validate required fields
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Accessory name is required' });
    }
    
    if (!category?.trim()) {
      return res.status(400).json({ error: 'Category is required' });
    }
    
    if (price === undefined || price === null || price === '') {
      return res.status(400).json({ error: 'Price is required' });
    }
    
    // Validate and sanitize name
    const accessoryName = name.trim();
    if (accessoryName.length < 2) {
      return res.status(400).json({ 
        error: 'Accessory name must be at least 2 characters long' 
      });
    }
    
    if (accessoryName.length > 100) {
      return res.status(400).json({ 
        error: 'Accessory name cannot exceed 100 characters' 
      });
    }
    
    // Validate and sanitize category
    const accessoryCategory = category.trim().toLowerCase();
    const validCategories = ['oil_service', 'battery_service', 'general'];
    if (!validCategories.includes(accessoryCategory)) {
      return res.status(400).json({ 
        error: `Category must be one of: ${validCategories.join(', ')}` 
      });
    }
    
    // Validate and sanitize price
    const accessoryPrice = parseFloat(price);
    if (isNaN(accessoryPrice) || accessoryPrice < 0) {
      return res.status(400).json({ 
        error: 'Price must be a valid non-negative number' 
      });
    }
    
    // Optional: Validate price range
    if (accessoryPrice > 1000) {
      return res.status(400).json({ 
        error: 'Price seems unreasonably high. Please verify.' 
      });
    }
    
    // Validate and sanitize quantity
    const quantity = quantity_available !== undefined ? parseInt(quantity_available) : currentAccessory.quantity_available;
    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ 
        error: 'Quantity must be a valid non-negative number' 
      });
    }
    
    // Check for duplicate (excluding current accessory)
    if (accessoryName.toLowerCase() !== currentAccessory.name.toLowerCase() || 
        accessoryCategory !== currentAccessory.category) {
      const [duplicateAccessory] = await db.execute(
        'SELECT id, name FROM accessories WHERE LOWER(name) = LOWER(?) AND category = ? AND id != ?',
        [accessoryName, accessoryCategory, accessoryId]
      );
      
      if (duplicateAccessory.length > 0) {
        return res.status(409).json({ 
          error: `Accessory "${accessoryName}" already exists in ${accessoryCategory} category` 
        });
      }
    }
    
    // Check if any changes were made
    const hasChanges = (
      accessoryName !== currentAccessory.name ||
      accessoryCategory !== currentAccessory.category ||
      accessoryPrice !== parseFloat(currentAccessory.price) ||
      quantity !== parseInt(currentAccessory.quantity_available)
    );
    
    if (!hasChanges) {
      return res.json({
        success: true,
        message: 'No changes detected',
        data: {
          id: accessoryId,
          name: currentAccessory.name,
          category: currentAccessory.category,
          price: parseFloat(currentAccessory.price),
          quantity_available: parseInt(currentAccessory.quantity_available)
        }
      });
    }
    
    // Update accessory
    const [result] = await db.execute(`
      UPDATE accessories SET 
        name = ?, 
        category = ?, 
        price = ?, 
        quantity_available = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      accessoryName,
      accessoryCategory,
      accessoryPrice,
      quantity,
      accessoryId
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(500).json({ 
        error: 'Failed to update accessory - no rows affected' 
      });
    }
    
    console.log('Accessory updated successfully:', accessoryId);
    
    // Return updated data
    res.json({
      success: true,
      message: 'Accessory updated successfully',
      data: {
        id: accessoryId,
        name: accessoryName,
        category: accessoryCategory,
        price: accessoryPrice,
        quantity_available: quantity,
        updated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Update accessory failed:', error);
    console.error('Request body:', req.body);
    
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Accessory with this name and category already exists' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update accessory',
      details: error.message
    });
  }
};

const deleteAccessory = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const accessoryId = parseInt(id);
    
    console.log('Deleting accessory with ID:', accessoryId);
    
    // Validate accessory ID
    if (!accessoryId || isNaN(accessoryId)) {
      return res.status(400).json({ 
        error: 'Valid accessory ID is required' 
      });
    }
    
    // Check if accessory exists and get its details
    const [existingAccessory] = await db.execute(
      'SELECT id, name, category, price FROM accessories WHERE id = ?',
      [accessoryId]
    );
    
    if (existingAccessory.length === 0) {
      return res.status(404).json({ 
        error: 'Accessory not found' 
      });
    }
    
    // Optional: Check if accessory is being used in bookings (prevent deletion if referenced)
    const [accessoryInUse] = await db.execute(
      'SELECT id FROM booking_accessories WHERE accessory_id = ? LIMIT 1',
      [accessoryId]
    );
    
    if (accessoryInUse.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete accessory. It is currently being used in existing bookings.' 
      });
    }
    
    // Delete the accessory
    const [result] = await db.execute(
      'DELETE FROM accessories WHERE id = ?',
      [accessoryId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Accessory not found or already deleted' 
      });
    }
    
    console.log('Accessory deleted successfully:', accessoryId);
    
    res.json({
      success: true,
      message: 'Accessory deleted successfully',
      deletedAccessory: {
        id: accessoryId,
        name: existingAccessory[0].name,
        category: existingAccessory[0].category,
        price: existingAccessory[0].price
      }
    });
    
  } catch (error) {
    console.error('Delete accessory failed:', error);
    res.status(500).json({ 
      error: 'Failed to delete accessory',
      details: error.message
    });
  }
};

module.exports = {
  getAllAccessorys,
  createAccessory,
  updateAccessory,
  deleteAccessory
}