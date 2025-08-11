
const { getDB, dbConfig } = require('../config/db');
const getAllModels = async (req, res) => {
  try {
    const db = getDB();
    const [results] = await db.execute(`
      SELECT 
        vm.id,
        vm.brand_id,
        vm.name,
        vm.created_at,
        vm.updated_at,
        vb.name as brand_name
      FROM vehicle_models vm
      LEFT JOIN vehicle_brands vb ON vm.brand_id = vb.id
      ORDER BY vm.created_at DESC
    `);
    res.json(results);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
}

const getModelByBrand = async (req, res) => {
  try {
    const db = getDB();
    const [results] = await db.execute(
      'SELECT * FROM vehicle_models WHERE brand_id = ? ORDER BY name',
      [req.params.brandId]
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch models' });
  }
}

const createModel = async (req, res) => {
  try {
    const db = getDB();
    const { name, brand_id } = req.body;
    const brandId = parseInt(brand_id);
    
    
    // Validate required fields
    if (!name || !brandId) {
      return res.status(400).json({ 
        error: 'Name and brand_id are required' 
      });
    }
    
    // Validate name length
    if (name.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Model name must be at least 2 characters long' 
      });
    }
    
    // Verify brand exists
    const [brandExists] = await db.execute(
      'SELECT id FROM vehicle_brands WHERE id = ?',
      [brandId]
    );
    
    if (brandExists.length === 0) {
      return res.status(404).json({ 
        error: 'Brand not found' 
      });
    }
    
    // Check for duplicate model name within the same brand
    const [existingModel] = await db.execute(
      'SELECT id FROM vehicle_models WHERE name = ? AND brand_id = ?',
      [name.trim(), brandId]
    );
    
    if (existingModel.length > 0) {
      return res.status(409).json({ 
        error: 'Model with this name already exists for this brand' 
      });
    }
    
    // Insert new model
    const [result] = await db.execute(
      'INSERT INTO vehicle_models (name, brand_id) VALUES (?, ?)',
      [name.trim(), brandId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Model created successfully',
      modelId: result.insertId,
      data: {
        id: result.insertId,
        name: name.trim(),
        brand_id: brandId
      }
    });
    
  } catch (error) {
    console.error('Create model failed:', error);
    res.status(500).json({ error: 'Failed to create model' });
  }
};

const updateModel = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params; // Get model ID from URL params
    const { name, brand_id } = req.body;
    const brandId = parseInt(brand_id);
    const modelId = parseInt(id);
    
    // Validate required fields
    if (!name || !brandId || !modelId) {
      return res.status(400).json({ 
        error: 'Model ID, name and brand_id are required' 
      });
    }
    
    // Validate name length
    if (name.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Model name must be at least 2 characters long' 
      });
    }
    
    // Check if model exists
    const [existingModel] = await db.execute(
      'SELECT id FROM vehicle_models WHERE id = ?',
      [modelId]
    );
    
    if (existingModel.length === 0) {
      return res.status(404).json({ 
        error: 'Model not found' 
      });
    }
    
    // Verify brand exists
    const [brandExists] = await db.execute(
      'SELECT id FROM vehicle_brands WHERE id = ?',
      [brandId]
    );
    
    if (brandExists.length === 0) {
      return res.status(404).json({ 
        error: 'Brand not found' 
      });
    }
    
    // Check for duplicate model name within the same brand (excluding current model)
    const [duplicateModel] = await db.execute(
      'SELECT id FROM vehicle_models WHERE name = ? AND brand_id = ? AND id != ?',
      [name.trim(), brandId, modelId]
    );
    
    if (duplicateModel.length > 0) {
      return res.status(409).json({ 
        error: 'Model with this name already exists for this brand' 
      });
    }
    
    // Update model
    const [result] = await db.execute(
      'UPDATE vehicle_models SET name = ?, brand_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name.trim(), brandId, modelId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Model not found or no changes made' 
      });
    }
    
    res.json({
      success: true,
      message: 'Model updated successfully',
      data: {
        id: modelId,
        name: name.trim(),
        brand_id: brandId
      }
    });
    
  } catch (error) {
    console.error('Update model failed:', error);
    res.status(500).json({ error: 'Failed to update model' });
  }
};

const deleteModel = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const modelId = parseInt(id);
    
    // Validate model ID
    if (!modelId || isNaN(modelId)) {
      return res.status(400).json({ 
        error: 'Valid model ID is required' 
      });
    }
    
    // Check if model exists
    const [existingModel] = await db.execute(
      'SELECT id, name FROM vehicle_models WHERE id = ?',
      [modelId]
    );
    
    if (existingModel.length === 0) {
      return res.status(404).json({ 
        error: 'Model not found' 
      });
    }
    
    // Optional: Check if model is being used in other tables (prevent deletion if referenced)
    const [modelInUse] = await db.execute(
      'SELECT id FROM customer_vehicles WHERE model_id = ? LIMIT 1',
      [modelId]
    );
    
    if (modelInUse.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete model. It is currently being used by existing vehicles.' 
      });
    }
    
    // Delete the model
    const [result] = await db.execute(
      'DELETE FROM vehicle_models WHERE id = ?',
      [modelId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Model not found or already deleted' 
      });
    }
    
    res.json({
      success: true,
      message: 'Model deleted successfully',
      deletedModel: {
        id: modelId,
        name: existingModel[0].name
      }
    });
    
  } catch (error) {
    console.error('Delete model failed:', error);
    res.status(500).json({ error: 'Failed to delete model' });
  }
};

module.exports = {
  getModelByBrand,
  getAllModels,
  createModel,
  updateModel,
  deleteModel
}