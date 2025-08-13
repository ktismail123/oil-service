const { getDB, dbConfig } = require('../config/db');
const checkCustomerByPlate = async (req, res) => {
  const db = getDB();
  try {
    // Get plate from QUERY parameters (not path parameters)
    const { mobile, plate } = req.query;

    console.log('=== CHECK CUSTOMER REQUEST ===');
    console.log('Full request URL:', req.url);
    console.log('Query parameters received:', req.query);
    console.log('Plate parameter:', plate);

    // Validate that at least one parameter is provided
    if (!mobile && !plate) {
      return res.status(400).json({
        success: false,
        error: 'Either mobile number or plate number is required',
        received: req.query
      });
    }

    let query;
    let params = [];

    if (plate) {
      // Search by plate number
      query = `
        SELECT 
          c.id as customer_id,
          c.name as customer_name,
          c.mobile as customer_mobile,
          cv.id as vehicle_id,
          cv.plate_number,
          cv.brand_id,
          cv.model_id,
          vb.name as brand_name,
          vm.name as model_name
        FROM customer_vehicles cv
        JOIN customers c ON cv.customer_id = c.id
        LEFT JOIN vehicle_brands vb ON cv.brand_id = vb.id
        LEFT JOIN vehicle_models vm ON cv.model_id = vm.id
        WHERE cv.plate_number = ?
        ORDER BY cv.created_at DESC
      `;
      params = [plate];
      console.log('Searching by plate number:', plate);
    } else {
      // Search by mobile number
      query = `
        SELECT 
          c.id as customer_id,
          c.name as customer_name,
          c.mobile as customer_mobile,
          cv.id as vehicle_id,
          cv.plate_number,
          cv.brand_id,
          cv.model_id,
          vb.name as brand_name,
          vm.name as model_name
        FROM customers c
        LEFT JOIN customer_vehicles cv ON c.id = cv.customer_id
        LEFT JOIN vehicle_brands vb ON cv.brand_id = vb.id
        LEFT JOIN vehicle_models vm ON cv.model_id = vm.id
        WHERE c.mobile = ?
        ORDER BY cv.created_at DESC
      `;
      params = [mobile];
      console.log('Searching by mobile number:', mobile);
    }

    console.log('Executing query:', query);
    console.log('With parameters:', params);

    const [results] = await db.execute(query, params);

    console.log(`Found ${results.length} records`);

    if (results.length === 0) {
      return res.json([]); // Return empty array for no results
    }

    // Return results as array to match your Angular Observable<any[]>
    res.json(results);

  } catch (error) {
    console.error('Error checking customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check customer details',
      details: error.message
    });
  }
};

module.exports = {
    checkCustomerByPlate
}