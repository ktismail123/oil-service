
const { getDB, dbConfig } = require('../config/db');

const getAllOilTypes = async (req, res) => {
  try {
     const db = getDB();
    const [results] = await db.execute('SELECT * FROM oil_types ORDER BY grade');
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



module.exports = {
  getAllOilTypes,
  getAllOilTypesByIntervell
}