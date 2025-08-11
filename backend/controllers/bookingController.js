
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
        sb.oil_type_id,
        sb.oil_package_details,
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

const createNewBooking = async (req, res) => {
  const db = getDB();
  try {
    const {
      customer, vehicle, service, accessories = []
    } = req.body;

    const sanitizedService = {
      type: service.type,
      date: service.date,
      time: service.time,
      interval: service.interval || null,
      oilTypeId: service.oilTypeId || null,
      oilQuantity: service.oilQuantity || null,
      oilFilterId: service.oilFilterId || null,
      batteryTypeId: service.batteryTypeId || null,
      subtotal: service.subtotal,
      oilQuantityDetails: service.oilQuantityDetails || null
    };

    // Start transaction
    await db.beginTransaction();

    // Insert or get customer
    let customerId;
    const [existingCustomer] = await db.execute(
      'SELECT id FROM customers WHERE mobile = ?',
      [customer.mobile]
    );

    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].id;
    } else {
      const [customerResult] = await db.execute(
        'INSERT INTO customers (name, mobile) VALUES (?, ?)',
        [customer.name, customer.mobile]
      );
      customerId = customerResult.insertId;
    }

    // Insert or get vehicle
    let vehicleId;
    const [existingVehicle] = await db.execute(
      'SELECT id FROM customer_vehicles WHERE plate_number = ?',
      [vehicle.plateNumber]
    );

    if (existingVehicle.length > 0) {
      vehicleId = existingVehicle[0].id;
    } else {
      const [vehicleResult] = await db.execute(
        'INSERT INTO customer_vehicles (customer_id, brand_id, model_id, plate_number) VALUES (?, ?, ?, ?)',
        [customerId, vehicle.brandId, vehicle.modelId, vehicle.plateNumber]
      );
      vehicleId = vehicleResult.insertId;
    }

    // Calculate totals
    const vatPercentage = 5.00; // Get from settings
    const subtotal = parseFloat(sanitizedService.subtotal);
    const vatAmount = (subtotal * vatPercentage) / 100;
    const totalAmount = subtotal + vatAmount;

    // Before the INSERT, add this debugging:
    const params = [
      customerId, vehicleId, service.type, service.date, service.time,
      service.interval || null, service.oilTypeId || null, service.oilQuantity || null,
      service.oilFilterId || null, service.batteryTypeId || null,
      service.subtotal, vatPercentage, vatAmount, totalAmount, service.oilQuantityDetails || null
    ];

    console.log('SQL parameters:', params);
    console.log('Undefined parameters:', params.map((p, i) => p === undefined ? i : null).filter(i => i !== null));

    // Insert service booking
    const [bookingResult] = await db.execute(`
      INSERT INTO service_bookings (
        customer_id, vehicle_id, service_type, service_date, service_time,
        service_interval, oil_type_id, oil_quantity, oil_filter_id, battery_type_id,
        subtotal, vat_percentage, vat_amount, total_amount, oil_package_details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customerId, vehicleId, sanitizedService.type, sanitizedService.date, sanitizedService.time,
      sanitizedService.interval || null, sanitizedService.oilTypeId || null, sanitizedService.oilQuantity || null,
      sanitizedService.oilFilterId || null, sanitizedService.batteryTypeId || null,
      sanitizedService.subtotal, vatPercentage, vatAmount, totalAmount, sanitizedService.oilQuantityDetails || null
    ]);

    const bookingId = bookingResult.insertId;

    // Insert accessories
    for (const accessory of accessories) {
      await db.execute(
        'INSERT INTO booking_accessories (booking_id, accessory_id, quantity, price) VALUES (?, ?, ?, ?)',
        [bookingId, accessory.id, accessory.quantity, accessory.price]
      );
    }

    await db.commit();

    res.json({
      success: true,
      bookingId: bookingId,
      totalAmount: totalAmount
    });

  } catch (error) {
    await db.rollback();
    console.error('Booking creation failed:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ error: 'Failed to create booking', details: error.message });
  }
}


module.exports = {
  getAllBookings,
  createNewBooking
}