const { getDB, dbConfig } = require('../config/db');

const getAllBrands = async (req, res) => {
  try {
    const db = getDB();
    const [results] = await db.execute('SELECT * FROM vehicle_brands ORDER BY created_at DESC');
    res.json(results);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
};

const createBrand = async (req, res) => {
try {
  const db = getDB();
    const { name } = req.body;

    // Validation
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ 
        error: 'Brand name is required and must be a string' 
      });
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({ 
        error: 'Brand name must be between 2 and 50 characters' 
      });
    }

    // Check for valid characters (letters, spaces, hyphens only)
    if (!/^[a-zA-Z\s-]+$/.test(trimmedName)) {
      return res.status(400).json({ 
        error: 'Brand name can only contain letters, spaces, and hyphens' 
      });
    }

    // const connection = await mysql.createConnection(dbConfig);

    // Check if brand already exists (case-insensitive)
    const [existing] = await db.execute(
      'SELECT id FROM vehicle_brands WHERE LOWER(name) = LOWER(?)',
      [trimmedName]
    );

    if (existing.length > 0) {
      await connection.end();
      return res.status(409).json({ 
        error: 'Brand name already exists' 
      });
    }

    // Insert new brand
    const [result] = await db.execute(
      'INSERT INTO vehicle_brands (name) VALUES (?)',
      [trimmedName]
    );

    // Get the newly created brand
    const [newBrand] = await db.execute(
      'SELECT * FROM vehicle_brands WHERE id = ?',
      [result.insertId]
    );

    // await connection.end();

    res.status(201).json({
      message: 'Brand created successfully',
      brand: newBrand[0]
    });

  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ error: 'Failed to create brand' });
  }
};

const updateBrand = async (req, res) => {
    const { name } =    req.body;
    const id = req.params.id;
    const db = getDB();


    // Validation
    if (!name || typeof name !== 'string') {
      throw { status: 400, message: 'Brand name is required and must be a string' };
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      throw { status: 400, message: 'Brand name must be between 2 and 50 characters' };
    }

    // const connection = await mysql.createConnection(dbConfig);

    try {
      
      // Check if brand exists
      const [existing] = await db.execute(
        'SELECT id FROM vehicle_brands WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        throw { status: 404, message: 'Brand not found' };
      }

      // Check if name is already taken by another brand
      const [duplicate] = await db.execute(
        'SELECT id FROM vehicle_brands WHERE LOWER(name) = LOWER(?) AND id != ?',
        [trimmedName, id]
      );

      if (duplicate.length > 0) {
        throw { status: 409, message: 'Brand name already exists' };
      }

      // Update brand
      await db.execute(
        'UPDATE vehicle_brands SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [trimmedName, id]
      );

      // Get updated brand
      const [updatedBrand] = await db.execute(
        'SELECT * FROM vehicle_brands WHERE id = ?',
        [id]
      );

      // return {
      //   message: 'Brand updated successfully',
      //   brand: updatedBrand[0]
      // };

       res.status(201).json({
      message: 'Brand updated successfully',
      brand: updatedBrand[0]
    });

    }  catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ error: 'Failed to update brand' });
  }

}

const deleteBrand = async (req, res) => {
  const id = req.params.id;

    try {
      const db = getDB();
      // Check if brand exists
      const [existing] = await db.execute(
        'SELECT id FROM vehicle_brands WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        throw { status: 404, message: 'Brand not found' };
      }

      // Check if brand has associated models
      const [models] = await db.execute(
        'SELECT id FROM vehicle_models WHERE brand_id = ?',
        [id]
      );

      if (models.length > 0) {
        throw { status: 400, message: 'Cannot delete brand. It has associated vehicle models.' };
      }

      // Delete brand
      await db.execute('DELETE FROM vehicle_brands WHERE id = ?', [id]);

        res.status(201).json({
      message: 'Brand deleted successfully',
    });

    }  catch (error) {
      console.error('Error creating brand:', error);
      res.status(500).json({ error: 'Failed to delete brand' });
    }
    }

module.exports = {
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand
};

// class BrandController {
//   // Get all brands
//   static async getAllBrands() {
//     try {
//     const db = getDB();
//     const [results] = await db.execute('SELECT * FROM vehicle_brands ORDER BY name');
//     res.json(results);
//   } catch (error) {
//     console.error('Error fetching brands:', error);
//     res.status(500).json({ error: 'Failed to fetch brands' });
//   }
//   }

//   // Create new brand
//   static async createBrand(brandData) {
//     const { name } = brandData;

//     // Validation
//     if (!name || typeof name !== 'string') {
//       throw { status: 400, message: 'Brand name is required and must be a string' };
//     }

//     const trimmedName = name.trim();
    
//     if (trimmedName.length < 2 || trimmedName.length > 50) {
//       throw { status: 400, message: 'Brand name must be between 2 and 50 characters' };
//     }

//     if (!/^[a-zA-Z\s-]+$/.test(trimmedName)) {
//       throw { status: 400, message: 'Brand name can only contain letters, spaces, and hyphens' };
//     }

//     const connection = await mysql.createConnection(dbConfig);

//     try {
//       // Check if brand already exists
//       const [existing] = await connection.execute(
//         'SELECT id FROM vehicle_brands WHERE LOWER(name) = LOWER(?)',
//         [trimmedName]
//       );

//       if (existing.length > 0) {
//         throw { status: 409, message: 'Brand name already exists' };
//       }

//       // Insert new brand
//       const [result] = await connection.execute(
//         'INSERT INTO vehicle_brands (name) VALUES (?)',
//         [trimmedName]
//       );

//       // Get the newly created brand
//       const [newBrand] = await connection.execute(
//         'SELECT * FROM vehicle_brands WHERE id = ?',
//         [result.insertId]
//       );

//       return {
//         message: 'Brand created successfully',
//         brand: newBrand[0]
//       };

//     } finally {
//       await connection.end();
//     }
//   }

//   // Update brand
//   static async updateBrand(id, brandData) {
//     const { name } = brandData;

//     // Validation
//     if (!name || typeof name !== 'string') {
//       throw { status: 400, message: 'Brand name is required and must be a string' };
//     }

//     const trimmedName = name.trim();
    
//     if (trimmedName.length < 2 || trimmedName.length > 50) {
//       throw { status: 400, message: 'Brand name must be between 2 and 50 characters' };
//     }

//     const connection = await mysql.createConnection(dbConfig);

//     try {
//       // Check if brand exists
//       const [existing] = await connection.execute(
//         'SELECT id FROM vehicle_brands WHERE id = ?',
//         [id]
//       );

//       if (existing.length === 0) {
//         throw { status: 404, message: 'Brand not found' };
//       }

//       // Check if name is already taken by another brand
//       const [duplicate] = await connection.execute(
//         'SELECT id FROM vehicle_brands WHERE LOWER(name) = LOWER(?) AND id != ?',
//         [trimmedName, id]
//       );

//       if (duplicate.length > 0) {
//         throw { status: 409, message: 'Brand name already exists' };
//       }

//       // Update brand
//       await connection.execute(
//         'UPDATE vehicle_brands SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
//         [trimmedName, id]
//       );

//       // Get updated brand
//       const [updatedBrand] = await connection.execute(
//         'SELECT * FROM vehicle_brands WHERE id = ?',
//         [id]
//       );

//       return {
//         message: 'Brand updated successfully',
//         brand: updatedBrand[0]
//       };

//     } finally {
//       await connection.end();
//     }
//   }

//   // Delete brand
//   static async deleteBrand(id) {
//     const connection = await mysql.createConnection(dbConfig);

//     try {
//       // Check if brand exists
//       const [existing] = await connection.execute(
//         'SELECT id FROM vehicle_brands WHERE id = ?',
//         [id]
//       );

//       if (existing.length === 0) {
//         throw { status: 404, message: 'Brand not found' };
//       }

//       // Check if brand has associated models
//       const [models] = await connection.execute(
//         'SELECT id FROM vehicle_models WHERE brand_id = ?',
//         [id]
//       );

//       if (models.length > 0) {
//         throw { status: 400, message: 'Cannot delete brand. It has associated vehicle models.' };
//       }

//       // Delete brand
//       await connection.execute('DELETE FROM vehicle_brands WHERE id = ?', [id]);

//       return { message: 'Brand deleted successfully' };

//     } finally {
//       await connection.end();
//     }
//   }
// }

// module.exports = BrandController;