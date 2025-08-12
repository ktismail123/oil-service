
const { getDB, dbConfig } = require('../config/db');

const getAllOilTypes = async (req, res) => {
  try {
     const db = getDB();
    const [results] = await db.execute('SELECT * FROM oil_types ORDER BY created_at DESC');
    res.json(results);
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: 'Failed to fetch oil types' });
  }
}

const getAllOilTypesByIntervell = async (req, res) => {
  try {
    const db = getDB();

    const interval = parseInt(req.params.interval, 10);

    if (![5000, 10000, 15000].includes(interval)) {
      return res.status(400).json({ error: 'Invalid interval. Must be 5000, 10000, or 15000' });
    }

    const [results] = await db.execute(
      'SELECT * FROM oil_types WHERE service_interval = ? ORDER BY grade',
      [interval.toString()] // ENUM values must be strings
    );

    res.json(results);
  } catch (error) {
    console.error('Error fetching oil types by interval:', error);
    res.status(500).json({ error: 'Failed to fetch oil types' });
  }
};

const createOilType = async (req, res) => {
  try {
    const db = getDB();
    const {
      name, grade, brand, service_interval,
      package_1l_available, package_4l_available, bulk_available,
      price_1l, price_4l, price_per_liter, status, quantity_available
    } = req.body;
    
    console.log('Creating oil type with data:', req.body);
    
    // Validate required fields
    if (!name?.trim() || !grade?.trim() || !brand?.trim() || !service_interval) {
      return res.status(400).json({ 
        error: 'Name, grade, brand, and service_interval are required' 
      });
    }
    
    // Validate service interval and convert to string
    const validIntervals = ['5000', '10000', '15000'];
    const serviceInt = service_interval.toString();
    if (!validIntervals.includes(serviceInt)) {
      return res.status(400).json({ 
        error: 'Service interval must be 5000, 10000, or 15000 km' 
      });
    }
    
    // Sanitize and validate data
    const sanitizedData = {
      name: name.trim(),
      grade: grade.trim(),
      brand: brand.trim(),
      service_interval: serviceInt, // Store as string
      package_1l_available: package_1l_available ? 1 : 0,
      package_4l_available: package_4l_available ? 1 : 0,
      bulk_available: bulk_available ? 1 : 0,
      price_1l: Math.max(0, parseFloat(price_1l) || 0),
      price_4l: Math.max(0, parseFloat(price_4l) || 0),
      price_per_liter: Math.max(0, parseFloat(price_per_liter) || 0),
      status: status || 'active',
      quantity_available: Math.max(0, parseInt(quantity_available) || 0)
    };
    
    // Check for duplicate
    const [existingOilType] = await db.execute(
      'SELECT id FROM oil_types WHERE name = ? AND grade = ? AND brand = ?',
      [sanitizedData.name, sanitizedData.grade, sanitizedData.brand]
    );
    
    if (existingOilType.length > 0) {
      return res.status(409).json({ 
        error: 'Oil type with this name, grade, and brand combination already exists' 
      });
    }
    
    // Insert new oil type
    const [result] = await db.execute(`
      INSERT INTO oil_types (
        name, grade, brand, service_interval,
        package_1l_available, package_4l_available, bulk_available,
        price_1l, price_4l, price_per_liter, status, quantity_available
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sanitizedData.name,
      sanitizedData.grade,
      sanitizedData.brand,
      sanitizedData.service_interval, // Now string
      sanitizedData.package_1l_available,
      sanitizedData.package_4l_available,
      sanitizedData.bulk_available,
      sanitizedData.price_1l,
      sanitizedData.price_4l,
      sanitizedData.price_per_liter,
      sanitizedData.status,
      sanitizedData.quantity_available
    ]);
    
    console.log('Oil type created successfully:', result.insertId);
    
    res.status(201).json({
      success: true,
      message: 'Oil type created successfully',
      oilTypeId: result.insertId,
      data: {
        id: result.insertId,
        ...sanitizedData
      }
    });
    
  } catch (error) {
    console.error('Create oil type failed:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ 
      error: 'Failed to create oil type',
      details: error.message
    });
  }
};

const updateOilType = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const {
      name, grade, brand, service_interval,
      package_1l_available, package_4l_available, bulk_available,
      price_1l, price_4l, price_per_liter, status, quantity_available
    } = req.body;
    
    const oilTypeId = parseInt(id);
    
    console.log('Updating oil type with data:', req.body);
    
    // Validate oil type ID
    if (!oilTypeId || isNaN(oilTypeId)) {
      return res.status(400).json({ 
        error: 'Valid oil type ID is required' 
      });
    }
    
    // Validate required fields
    if (!name?.trim() || !grade?.trim() || !brand?.trim() || !service_interval) {
      return res.status(400).json({ 
        error: 'Name, grade, brand, and service_interval are required' 
      });
    }
    
    // Check if oil type exists
    const [existingOilType] = await db.execute(
      'SELECT id FROM oil_types WHERE id = ?',
      [oilTypeId]
    );
    
    if (existingOilType.length === 0) {
      return res.status(404).json({ 
        error: 'Oil type not found' 
      });
    }
    
    // Validate service interval
    const validIntervals = ['5000', '10000', '15000'];
    const serviceInt = service_interval.toString();
    if (!validIntervals.includes(serviceInt)) {
      return res.status(400).json({ 
        error: 'Service interval must be 5000, 10000, or 15000 km' 
      });
    }
    
    // Sanitize and validate data
    const sanitizedData = {
      name: name.trim(),
      grade: grade.trim(),
      brand: brand.trim(),
      service_interval: serviceInt,
      package_1l_available: package_1l_available ? 1 : 0,
      package_4l_available: package_4l_available ? 1 : 0,
      bulk_available: bulk_available ? 1 : 0,
      price_1l: Math.max(0, parseFloat(price_1l) || 0),
      price_4l: Math.max(0, parseFloat(price_4l) || 0),
      price_per_liter: Math.max(0, parseFloat(price_per_liter) || 0),
      status: status || 'active',
      quantity_available: Math.max(0, parseInt(quantity_available) || 0)
    };
    
    // Check for duplicate (excluding current oil type)
    const [duplicateOilType] = await db.execute(
      'SELECT id FROM oil_types WHERE name = ? AND grade = ? AND brand = ? AND id != ?',
      [sanitizedData.name, sanitizedData.grade, sanitizedData.brand, oilTypeId]
    );
    
    if (duplicateOilType.length > 0) {
      return res.status(409).json({ 
        error: 'Oil type with this name, grade, and brand combination already exists' 
      });
    }
    
    // Update oil type
    const [result] = await db.execute(`
      UPDATE oil_types SET 
        name = ?, grade = ?, brand = ?, service_interval = ?,
        package_1l_available = ?, package_4l_available = ?, bulk_available = ?,
        price_1l = ?, price_4l = ?, price_per_liter = ?, status = ?, 
        quantity_available = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      sanitizedData.name,
      sanitizedData.grade,
      sanitizedData.brand,
      sanitizedData.service_interval,
      sanitizedData.package_1l_available,
      sanitizedData.package_4l_available,
      sanitizedData.bulk_available,
      sanitizedData.price_1l,
      sanitizedData.price_4l,
      sanitizedData.price_per_liter,
      sanitizedData.status,
      sanitizedData.quantity_available,
      oilTypeId
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Oil type not found or no changes made' 
      });
    }
    
    console.log('Oil type updated successfully:', oilTypeId);
    
    res.json({
      success: true,
      message: 'Oil type updated successfully',
      data: {
        id: oilTypeId,
        ...sanitizedData
      }
    });
    
  } catch (error) {
    console.error('Update oil type failed:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ 
      error: 'Failed to update oil type',
      details: error.message
    });
  }
};

const deleteOilType = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const oilTypeId = parseInt(id);
    
    console.log('Deleting oil type with ID:', oilTypeId);
    
    // Validate oil type ID
    if (!oilTypeId || isNaN(oilTypeId)) {
      return res.status(400).json({ 
        error: 'Valid oil type ID is required' 
      });
    }
    
    // Check if oil type exists and get its details
    const [existingOilType] = await db.execute(
      'SELECT id, name, grade, brand FROM oil_types WHERE id = ?',
      [oilTypeId]
    );
    
    if (existingOilType.length === 0) {
      return res.status(404).json({ 
        error: 'Oil type not found' 
      });
    }
    
    // Optional: Check if oil type is being used in bookings (prevent deletion if referenced)
    const [oilTypeInUse] = await db.execute(
      'SELECT id FROM service_bookings WHERE oil_type_id = ? LIMIT 1',
      [oilTypeId]
    );
    
    if (oilTypeInUse.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete oil type. It is currently being used in existing bookings.' 
      });
    }
    
    // Delete the oil type
    const [result] = await db.execute(
      'DELETE FROM oil_types WHERE id = ?',
      [oilTypeId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Oil type not found or already deleted' 
      });
    }
    
    console.log('Oil type deleted successfully:', oilTypeId);
    
    res.json({
      success: true,
      message: 'Oil type deleted successfully',
      deletedOilType: {
        id: oilTypeId,
        name: existingOilType[0].name,
        grade: existingOilType[0].grade,
        brand: existingOilType[0].brand
      }
    });
    
  } catch (error) {
    console.error('Delete oil type failed:', error);
    res.status(500).json({ 
      error: 'Failed to delete oil type',
      details: error.message
    });
  }
};


module.exports = {
  getAllOilTypes,
  getAllOilTypesByIntervell,
  createOilType,
  updateOilType,
  deleteOilType
}