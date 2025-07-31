const { getDB, dbConfig } = require('../config/db');

const getAllBatteryTypes = async (req, res) => {
try {
     const db = getDB();
    const [results] = await db.execute('SELECT * FROM battery_types ORDER BY brand');
    res.json(results);
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: 'Failed to fetch oil types' });
  }
}

module.exports = {
  getAllBatteryTypes,
}