
const { getDB, dbConfig } = require('../config/db');

const getAllOilTypes = async (req, res) => {
  try {
     const db = getDB();
    const [results] = await db.execute('SELECT * FROM oil_types ORDER BY grade');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch oil types' });
  }
}

const getAllOilTypesByIntervell = async (req, res) => {
  try {
    const db = getDB();

    // Get the interval from the route parameter
    const interval = parseInt(req.params.interval, 10);

    if (![5000, 10000, 15000].includes(interval)) {
      return res.status(400).json({ error: 'Invalid interval. Must be 5000 or 10000, 15000' });
    }

    const [results] = await db.execute(
      'SELECT * FROM oil_types WHERE service_interval_km = ? ORDER BY grade',
      [interval]
    );

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch oil types' });
  }
};


module.exports = {
  getAllOilTypes,
  getAllOilTypesByIntervell
}