
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

module.exports = {
  getModelByBrand,
  getAllModels
}