
const { getDB, dbConfig } = require('../config/db');
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
}