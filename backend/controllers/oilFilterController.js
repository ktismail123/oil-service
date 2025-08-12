

const { getDB, dbConfig } = require('../config/db');
const getAllOilFilters = async (req, res) => {
  try {
     const db = getDB();
    const [results] = await db.execute('SELECT * FROM oil_filters ORDER BY created_at DESC');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch oil filters' });
  }
}

const createOilFilter = async (req, res) => {
  try {
    const db = getDB();
    const {
      code,
      brand,
      price,
      quantity_available = 0
    } = req.body;
    
    console.log('Creating oil filter with data:', req.body);
    
    // Validate required fields
    if (!code?.trim() || !brand?.trim() || price === undefined || price === null) {
      return res.status(400).json({ 
        error: 'Code, brand, and price are required' 
      });
    }
    
    // Validate code length
    if (code.trim().length < 3) {
      return res.status(400).json({ 
        error: 'Filter code must be at least 3 characters long' 
      });
    }
    
    // Validate brand length
    if (brand.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Brand must be at least 2 characters long' 
      });
    }
    
    // Validate price
    const filterPrice = parseFloat(price);
    if (isNaN(filterPrice) || filterPrice < 0) {
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
      code: code.trim().toUpperCase(), // Convert to uppercase for consistency
      brand: brand.trim(),
      price: filterPrice,
      quantity_available: quantity
    };
    
    // Check for duplicate code (codes should be unique)
    const [existingFilter] = await db.execute(
      'SELECT id FROM oil_filters WHERE code = ?',
      [sanitizedData.code]
    );
    
    if (existingFilter.length > 0) {
      return res.status(409).json({ 
        error: 'Oil filter with this code already exists' 
      });
    }
    
    // Insert new oil filter
    const [result] = await db.execute(`
      INSERT INTO oil_filters (code, brand, price, quantity_available)
      VALUES (?, ?, ?, ?)
    `, [
      sanitizedData.code,
      sanitizedData.brand,
      sanitizedData.price,
      sanitizedData.quantity_available
    ]);
    
    console.log('Oil filter created successfully:', result.insertId);
    
    res.status(201).json({
      success: true,
      message: 'Oil filter created successfully',
      oilFilterId: result.insertId,
      data: {
        id: result.insertId,
        ...sanitizedData
      }
    });
    
  } catch (error) {
    console.error('Create oil filter failed:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ 
      error: 'Failed to create oil filter',
      details: error.message
    });
  }
};

const updateOilFilter = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const {
      code,
      brand,
      price,
      quantity_available
    } = req.body;
    
    const oilFilterId = parseInt(id);
    
    console.log('Updating oil filter with data:', req.body);
    
    // Validate oil filter ID
    if (!oilFilterId || isNaN(oilFilterId)) {
      return res.status(400).json({ 
        error: 'Valid oil filter ID is required' 
      });
    }
    
    // Validate required fields
    if (!code?.trim() || !brand?.trim() || price === undefined || price === null) {
      return res.status(400).json({ 
        error: 'Code, brand, and price are required' 
      });
    }
    
    // Check if oil filter exists
    const [existingFilter] = await db.execute(
      'SELECT id, code, brand FROM oil_filters WHERE id = ?',
      [oilFilterId]
    );
    
    if (existingFilter.length === 0) {
      return res.status(404).json({ 
        error: 'Oil filter not found' 
      });
    }
    
    // Validate code length
    if (code.trim().length < 3) {
      return res.status(400).json({ 
        error: 'Filter code must be at least 3 characters long' 
      });
    }
    
    // Validate brand length
    if (brand.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Brand must be at least 2 characters long' 
      });
    }
    
    // Validate price
    const filterPrice = parseFloat(price);
    if (isNaN(filterPrice) || filterPrice < 0) {
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
      code: code.trim().toUpperCase(),
      brand: brand.trim(),
      price: filterPrice,
      quantity_available: quantity
    };
    
    // Check for duplicate code (excluding current filter)
    const [duplicateFilter] = await db.execute(
      'SELECT id FROM oil_filters WHERE code = ? AND id != ?',
      [sanitizedData.code, oilFilterId]
    );
    
    if (duplicateFilter.length > 0) {
      return res.status(409).json({ 
        error: 'Oil filter with this code already exists' 
      });
    }
    
    // Update oil filter
    const [result] = await db.execute(`
      UPDATE oil_filters SET 
        code = ?, 
        brand = ?, 
        price = ?, 
        quantity_available = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      sanitizedData.code,
      sanitizedData.brand,
      sanitizedData.price,
      sanitizedData.quantity_available,
      oilFilterId
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Oil filter not found or no changes made' 
      });
    }
    
    console.log('Oil filter updated successfully:', oilFilterId);
    
    res.json({
      success: true,
      message: 'Oil filter updated successfully',
      data: {
        id: oilFilterId,
        ...sanitizedData
      }
    });
    
  } catch (error) {
    console.error('Update oil filter failed:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ 
      error: 'Failed to update oil filter',
      details: error.message
    });
  }
};

const deleteOilFilter = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const oilFilterId = parseInt(id);
    
    console.log('Deleting oil filter with ID:', oilFilterId);
    
    // Validate oil filter ID
    if (!oilFilterId || isNaN(oilFilterId)) {
      return res.status(400).json({ 
        error: 'Valid oil filter ID is required' 
      });
    }
    
    // Check if oil filter exists and get its details
    const [existingFilter] = await db.execute(
      'SELECT id, code, brand, price FROM oil_filters WHERE id = ?',
      [oilFilterId]
    );
    
    if (existingFilter.length === 0) {
      return res.status(404).json({ 
        error: 'Oil filter not found' 
      });
    }
    
    // Optional: Check if oil filter is being used in bookings (prevent deletion if referenced)
    const [filterInUse] = await db.execute(
      'SELECT id FROM service_bookings WHERE oil_filter_id = ? LIMIT 1',
      [oilFilterId]
    );
    
    if (filterInUse.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete oil filter. It is currently being used in existing bookings.' 
      });
    }
    
    // Delete the oil filter
    const [result] = await db.execute(
      'DELETE FROM oil_filters WHERE id = ?',
      [oilFilterId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Oil filter not found or already deleted' 
      });
    }
    
    console.log('Oil filter deleted successfully:', oilFilterId);
    
    res.json({
      success: true,
      message: 'Oil filter deleted successfully',
      deletedOilFilter: {
        id: oilFilterId,
        code: existingFilter[0].code,
        brand: existingFilter[0].brand,
        price: existingFilter[0].price
      }
    });
    
  } catch (error) {
    console.error('Delete oil filter failed:', error);
    res.status(500).json({ 
      error: 'Failed to delete oil filter',
      details: error.message
    });
  }
};

module.exports = {
  getAllOilFilters,
  createOilFilter,
  updateOilFilter,
  deleteOilFilter
}