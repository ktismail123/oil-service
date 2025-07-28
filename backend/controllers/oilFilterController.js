

const { getDB, dbConfig } = require('../config/db');
const getAllOilFilters = async (req, res) => {
  try {
     const db = getDB();
    const [results] = await db.execute('SELECT * FROM oil_filters ORDER BY code');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch oil filters' });
  }
}

module.exports = {
  getAllOilFilters,
}