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

module.exports = {
  getAllBatteryTypes,
  getBatteryTypesByCapacity
}