
const { getDB } = require("../config/db");

const getAllBookings = async (req, res) => {
try {
    const db = getDB();
    const [results] = await db.execute(`
      SELECT 
        sb.id,
        sb.service_type,
        sb.service_date,
        sb.service_time,
        sb.service_interval,
        sb.oil_quantity,
        sb.subtotal,
        sb.vat_percentage,
        sb.vat_amount,
        sb.total_amount,
        sb.status,
        sb.created_at,
        sb.updated_at,
        c.name as customer_name,
        c.mobile as customer_mobile,
        cv.plate_number,
        vb.name as brand_name,
        vm.name as model_name
      FROM service_bookings sb
      JOIN customers c ON sb.customer_id = c.id
      JOIN customer_vehicles cv ON sb.vehicle_id = cv.id
      LEFT JOIN vehicle_brands vb ON cv.brand_id = vb.id
      LEFT JOIN vehicle_models vm ON cv.model_id = vm.id
      ORDER BY sb.created_at DESC
    `);

    console.log('Query executed successfully, found bookings:', results.length);

    // Add empty accessories for each booking
    results.forEach(booking => {
      booking.accessories = [];
    });

    res.json({
      data: results,
      total: results.length
    });

  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bookings', 
      details: error.message 
    });
  }
}

module.exports = {
  getAllBookings,
}