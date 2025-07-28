const { getDB, dbConfig } = require('../config/db');

const getAllAccessorys = async (req, res) => {
try {
     const db = getDB();

    const category = req.query.category || '';
    let query = 'SELECT * FROM accessories';
    let params = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY name';
    
    const [results] = await db.execute(query, params);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accessories' });
  }
}

module.exports = {
  getAllAccessorys,
}