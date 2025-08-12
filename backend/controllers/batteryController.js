const { getDB, dbConfig } = require('../config/db');

const getAllBatteryTypes = async (req, res) => {
try {
     const db = getDB();
    const [results] = await db.execute('SELECT * FROM battery_types ORDER BY created_at DESC');
    res.json(results);
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: 'Failed to fetch oil types' });
  }
}

const getBatteryTypesByCapacity = async (req, res) => {
  try {
    const db = getDB();
    const { capacity } = req.params;
    
    // Validate capacity parameter
    if (!capacity || isNaN(capacity)) {
      return res.status(400).json({ error: 'Invalid capacity parameter' });
    }
    
    const [results] = await db.execute(
      'SELECT * FROM battery_types WHERE capacity = ? ORDER BY brand',
      [parseInt(capacity)]
    );
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'No battery types found for this capacity' });
    }
    
    res.json(results);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch battery types by capacity' });
  }
};

const createBatteryType = async (req, res) => {
  try {
    const db = getDB();
    const {
      capacity,
      brand,
      price,
      quantity_available = 0
    } = req.body;
    
    console.log('Creating battery type with data:', req.body);
    
    // Validate required fields
    if (!capacity || !brand?.trim() || price === undefined || price === null) {
      return res.status(400).json({ 
        error: 'Capacity, brand, and price are required' 
      });
    }
    
    // Validate capacity
    const batteryCapacity = parseInt(capacity);
    if (isNaN(batteryCapacity) || batteryCapacity <= 0) {
      return res.status(400).json({ 
        error: 'Capacity must be a valid number greater than 0' 
      });
    }
    
    // Validate brand length
    if (brand.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Brand must be at least 2 characters long' 
      });
    }
    
    // Validate price
    const batteryPrice = parseFloat(price);
    if (isNaN(batteryPrice) || batteryPrice < 0) {
      return res.status(400).json({ 
        error: 'Price must be a valid number greater than or equal to 0' 
      });
    }
    
    // Validate quantity
    const quantity = parseInt(quantity_available) || 0;
    if (quantity < 0) {
      return res.status(400).json({ 
        error: 'Quantity must be greater than or equal to 0' 
      });
    }
    
    // Sanitize data
    const sanitizedData = {
      capacity: batteryCapacity,
      brand: brand.trim(),
      price: batteryPrice,
      quantity_available: quantity
    };
    
    // Check for duplicate (same capacity and brand combination)
    const [existingBatteryType] = await db.execute(
      'SELECT id FROM battery_types WHERE capacity = ? AND brand = ?',
      [sanitizedData.capacity, sanitizedData.brand]
    );
    
    if (existingBatteryType.length > 0) {
      return res.status(409).json({ 
        error: 'Battery type with this capacity and brand combination already exists' 
      });
    }
    
    // Insert new battery type
    const [result] = await db.execute(`
      INSERT INTO battery_types (capacity, brand, price, quantity_available)
      VALUES (?, ?, ?, ?)
    `, [
      sanitizedData.capacity,
      sanitizedData.brand,
      sanitizedData.price,
      sanitizedData.quantity_available
    ]);
    
    console.log('Battery type created successfully:', result.insertId);
    
    res.status(201).json({
      success: true,
      message: 'Battery type created successfully',
      batteryTypeId: result.insertId,
      data: {
        id: result.insertId,
        ...sanitizedData
      }
    });
    
  } catch (error) {
    console.error('Create battery type failed:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ 
      error: 'Failed to create battery type',
      details: error.message
    });
  }
};

const updateBatteryType = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { capacity, brand, price, quantity_available } = req.body;
    
    const batteryTypeId = parseInt(id);
    
    console.log('Updating battery type ID:', batteryTypeId, 'with data:', req.body);
    
    // Validate battery type ID
    if (!batteryTypeId || isNaN(batteryTypeId)) {
      return res.status(400).json({ 
        error: 'Valid battery type ID is required' 
      });
    }
    
    // Check if battery type exists and get current data
    const [existingBatteryType] = await db.execute(
      'SELECT * FROM battery_types WHERE id = ?',
      [batteryTypeId]
    );
    
    if (existingBatteryType.length === 0) {
      return res.status(404).json({ 
        error: 'Battery type not found' 
      });
    }
    
    const currentBatteryType = existingBatteryType[0];
    
    // Validate required fields
    if (!capacity) {
      return res.status(400).json({ error: 'Capacity is required' });
    }
    
    if (!brand?.trim()) {
      return res.status(400).json({ error: 'Brand is required' });
    }
    
    if (price === undefined || price === null || price === '') {
      return res.status(400).json({ error: 'Price is required' });
    }
    
    // Validate and sanitize capacity
    const batteryCapacity = parseInt(capacity);
    if (isNaN(batteryCapacity) || batteryCapacity <= 0) {
      return res.status(400).json({ 
        error: 'Capacity must be a valid positive number' 
      });
    }
    
    // Validate capacity range (optional)
    if (batteryCapacity < 30 || batteryCapacity > 200) {
      return res.status(400).json({ 
        error: 'Capacity must be between 30 and 200 Ah' 
      });
    }
    
    // Validate and sanitize brand
    const batteryBrand = brand.trim();
    if (batteryBrand.length < 2) {
      return res.status(400).json({ 
        error: 'Brand must be at least 2 characters long' 
      });
    }
    
    if (batteryBrand.length > 50) {
      return res.status(400).json({ 
        error: 'Brand name cannot exceed 50 characters' 
      });
    }
    
    // Validate and sanitize price
    const batteryPrice = parseFloat(price);
    if (isNaN(batteryPrice) || batteryPrice < 0) {
      return res.status(400).json({ 
        error: 'Price must be a valid non-negative number' 
      });
    }
    
    // Optional: Validate price range
    if (batteryPrice > 10000) {
      return res.status(400).json({ 
        error: 'Price seems unreasonably high. Please verify.' 
      });
    }
    
    // Validate and sanitize quantity
    const quantity = quantity_available !== undefined ? parseInt(quantity_available) : currentBatteryType.quantity_available;
    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ 
        error: 'Quantity must be a valid non-negative number' 
      });
    }
    
    // Check for duplicate (excluding current battery type)
    if (batteryCapacity !== currentBatteryType.capacity || batteryBrand.toLowerCase() !== currentBatteryType.brand.toLowerCase()) {
      const [duplicateBatteryType] = await db.execute(
        'SELECT id, capacity, brand FROM battery_types WHERE capacity = ? AND LOWER(brand) = LOWER(?) AND id != ?',
        [batteryCapacity, batteryBrand, batteryTypeId]
      );
      
      if (duplicateBatteryType.length > 0) {
        return res.status(409).json({ 
          error: `Battery type with ${batteryCapacity}Ah capacity from ${batteryBrand} already exists` 
        });
      }
    }
    
    // Check if any changes were made
    const hasChanges = (
      batteryCapacity !== parseInt(currentBatteryType.capacity) ||
      batteryBrand !== currentBatteryType.brand ||
      batteryPrice !== parseFloat(currentBatteryType.price) ||
      quantity !== parseInt(currentBatteryType.quantity_available)
    );
    
    if (!hasChanges) {
      return res.json({
        success: true,
        message: 'No changes detected',
        data: {
          id: batteryTypeId,
          capacity: parseInt(currentBatteryType.capacity),
          brand: currentBatteryType.brand,
          price: parseFloat(currentBatteryType.price),
          quantity_available: parseInt(currentBatteryType.quantity_available)
        }
      });
    }
    
    // Update battery type
    const [result] = await db.execute(`
      UPDATE battery_types SET 
        capacity = ?, 
        brand = ?, 
        price = ?, 
        quantity_available = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      batteryCapacity,
      batteryBrand,
      batteryPrice,
      quantity,
      batteryTypeId
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(500).json({ 
        error: 'Failed to update battery type - no rows affected' 
      });
    }
    
    console.log('Battery type updated successfully:', batteryTypeId);
    
    // Return updated data
    res.json({
      success: true,
      message: 'Battery type updated successfully',
      data: {
        id: batteryTypeId,
        capacity: batteryCapacity,
        brand: batteryBrand,
        price: batteryPrice,
        quantity_available: quantity,
        updated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Update battery type failed:', error);
    console.error('Request body:', req.body);
    
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Battery type with this capacity and brand already exists' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update battery type',
      details: error.message
    });
  }
};

const deleteBatteryType = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const batteryTypeId = parseInt(id);
    
    console.log('Deleting battery type with ID:', batteryTypeId);
    
    // Validate battery type ID
    if (!batteryTypeId || isNaN(batteryTypeId)) {
      return res.status(400).json({ 
        error: 'Valid battery type ID is required' 
      });
    }
    
    // Check if battery type exists and get its details
    const [existingBatteryType] = await db.execute(
      'SELECT id, capacity, brand, price FROM battery_types WHERE id = ?',
      [batteryTypeId]
    );
    
    if (existingBatteryType.length === 0) {
      return res.status(404).json({ 
        error: 'Battery type not found' 
      });
    }
    
    // Optional: Check if battery type is being used in bookings (prevent deletion if referenced)
    const [batteryTypeInUse] = await db.execute(
      'SELECT id FROM service_bookings WHERE battery_type_id = ? LIMIT 1',
      [batteryTypeId]
    );
    
    if (batteryTypeInUse.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete battery type. It is currently being used in existing bookings.' 
      });
    }
    
    // Delete the battery type
    const [result] = await db.execute(
      'DELETE FROM battery_types WHERE id = ?',
      [batteryTypeId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Battery type not found or already deleted' 
      });
    }
    
    console.log('Battery type deleted successfully:', batteryTypeId);
    
    res.json({
      success: true,
      message: 'Battery type deleted successfully',
      deletedBatteryType: {
        id: batteryTypeId,
        capacity: existingBatteryType[0].capacity,
        brand: existingBatteryType[0].brand,
        price: existingBatteryType[0].price
      }
    });
    
  } catch (error) {
    console.error('Delete battery type failed:', error);
    res.status(500).json({ 
      error: 'Failed to delete battery type',
      details: error.message
    });
  }
};

module.exports = {
  getAllBatteryTypes,
  getBatteryTypesByCapacity,
  createBatteryType,
  updateBatteryType,
  deleteBatteryType
}