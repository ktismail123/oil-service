
const { getDB } = require("../config/db");

const getAllBookings = async (req, res) => {
  try {
    const db = getDB();
    
    // Extract and validate query parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search || '';
    const status = req.query.status || '';
    const service_type = req.query.service_type || '';
    const date_from = req.query.date_from || '';
    const date_to = req.query.date_to || '';
    const sort_by = req.query.sort_by || 'created_at';
    const sort_order = (req.query.sort_order || 'DESC').toUpperCase();

    const offset = (page - 1) * limit;

    console.log('Query params:', { page, limit, search, status, service_type, date_from, date_to });

    // Validate sort parameters to prevent SQL injection
    const allowedSortFields = ['created_at', 'service_date', 'total_amount', 'status', 'customer_name'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';

    // Helper function to escape string values for SQL
    const escapeString = (str) => {
      if (!str) return "''";
      return "'" + str.replace(/'/g, "''") + "'";
    };

    // Helper function to escape LIKE values
    const escapeLike = (str) => {
      if (!str) return "''";
      const escaped = str.replace(/'/g, "''").replace(/%/g, '\\%').replace(/_/g, '\\_');
      return "'%" + escaped + "%'";
    };

    // Build WHERE conditions safely
    let whereConditions = [];

    // Search functionality - using LIKE with escaped values
    if (search && search.trim()) {
      const searchTerm = escapeLike(search.trim());
      whereConditions.push(`(
        c.name LIKE ${searchTerm} OR 
        c.mobile LIKE ${searchTerm} OR 
        cv.plate_number LIKE ${searchTerm} OR 
        vb.name LIKE ${searchTerm} OR 
        vm.name LIKE ${searchTerm} OR
        sb.id LIKE ${searchTerm} OR
        sb.subtotal LIKE ${searchTerm} OR
        sb.bill_number LIKE ${searchTerm}
      )`);
    }

    // Status filter
    if (status && status.trim()) {
      whereConditions.push(`sb.status = ${escapeString(status.trim())}`);
    }

    // Service type filter
    if (service_type && service_type.trim()) {
      whereConditions.push(`sb.service_type = ${escapeString(service_type.trim())}`);
    }

    // Date range filters
    if (date_from && date_from.trim()) {
      whereConditions.push(`sb.service_date >= ${escapeString(date_from.trim())}`);
    }

    if (date_to && date_to.trim()) {
      whereConditions.push(`sb.service_date <= ${escapeString(date_to.trim())}`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Build the main query
    const sortColumn = sortField === 'customer_name' ? 'c.name' : `sb.${sortField}`;
    
    const mainQuery = `
      SELECT 
        sb.id,
        sb.service_type,
        sb.service_date,
        sb.service_time,
        sb.service_interval,
        sb.oil_type_id,
        sb.oil_filter_id,
        sb.battery_type_id,
        sb.oil_package_details,
        sb.oil_quantity,
        sb.subtotal,
        sb.vat_percentage,
        sb.labour_cost,
        sb.vat_amount,
        sb.total_amount,
        sb.status,
        sb.created_at,
        sb.updated_at,
        sb.bill_number,
        c.name as customer_name,
        c.mobile as customer_mobile,
        cv.plate_number,
        cv.brand_id,
        cv.model_id,
        vb.name as brand_name,
        vm.name as model_name,
        oil_f.code as oil_filter_code,
        oil_f.brand as oil_filter_brand,
        bt.capacity as battery_capacity,
        bt.brand as battery_brand
      FROM service_bookings sb
      JOIN customers c ON sb.customer_id = c.id
      JOIN customer_vehicles cv ON sb.vehicle_id = cv.id
      LEFT JOIN vehicle_brands vb ON cv.brand_id = vb.id
      LEFT JOIN vehicle_models vm ON cv.model_id = vm.id
      LEFT JOIN oil_filters oil_f ON sb.oil_filter_id = oil_f.id
      LEFT JOIN battery_types bt ON sb.battery_type_id = bt.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ${limit} OFFSET ${offset}
    `;

    console.log('Executing main query...');
    console.log('WHERE clause:', whereClause);

    // Execute main query using db.query()
    const [results] = await db.query(mainQuery);

    // Get accessories for the returned bookings
    if (results.length > 0) {
      const bookingIds = results.map(r => r.id);
      const idsString = bookingIds.join(',');
      
      const accessoriesQuery = `
        SELECT 
          ba.booking_id,
          ba.accessory_id,
          a.name,
          a.category,
          ba.quantity,
          ba.price
        FROM booking_accessories ba
        JOIN accessories a ON ba.accessory_id = a.id
        WHERE ba.booking_id IN (${idsString})
        ORDER BY ba.booking_id, a.name
      `;

      try {
        const [accessoriesResults] = await db.query(accessoriesQuery);

        // Group accessories by booking_id
        const accessoriesMap = {};
        accessoriesResults.forEach(acc => {
          if (!accessoriesMap[acc.booking_id]) {
            accessoriesMap[acc.booking_id] = [];
          }
          accessoriesMap[acc.booking_id].push({
            id: acc.accessory_id,
            name: acc.name,
            category: acc.category,
            quantity: acc.quantity,
            price: acc.price
          });
        });

        // Add accessories to results
        results.forEach(booking => {
          booking.accessories = accessoriesMap[booking.id] || [];
        });
      } catch (accessoriesError) {
        console.error('Error fetching accessories:', accessoriesError);
        // Continue without accessories if there's an error
        results.forEach(booking => {
          booking.accessories = [];
        });
      }
    } else {
      results.forEach(booking => {
        booking.accessories = [];
      });
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT sb.id) as total
      FROM service_bookings sb
      JOIN customers c ON sb.customer_id = c.id
      JOIN customer_vehicles cv ON sb.vehicle_id = cv.id
      LEFT JOIN vehicle_brands vb ON cv.brand_id = vb.id
      LEFT JOIN vehicle_models vm ON cv.model_id = vm.id
      LEFT JOIN oil_filters oil_f ON sb.oil_filter_id = oil_f.id
      LEFT JOIN battery_types bt ON sb.battery_type_id = bt.id
      ${whereClause}
    `;

    const [countResult] = await db.query(countQuery);
    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / limit);

    console.log(`✅ Query successful. Found ${results.length} bookings out of ${totalRecords} total`);

    // Return response
    res.json({
      success: true,
      data: results,
      pagination: {
        current_page: page,
        per_page: limit,
        total_records: totalRecords,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      },
      filters: {
        search,
        status,
        service_type,
        date_from,
        date_to,
        sort_by: sortField,
        sort_order: sortDirection
      }
    });

  } catch (error) {
    console.error('❌ Error in getAllBookings:', error);
    res.status(500).json({
      error: 'Failed to fetch bookings',
      details: error.message
    });
  }
};

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
      laborCost: service.laborCost || 0, // Added labor cost
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
    const laborCost = parseFloat(sanitizedService.laborCost) || 0;
    const vatAmount = (subtotal * vatPercentage) / 100;
    const totalAmount = subtotal + vatAmount;

    // Before the INSERT, add this debugging:
    const params = [
      customerId, vehicleId, service.type, service.date, service.time,
      service.interval || null, service.oilTypeId || null, service.oilQuantity || null,
      service.oilFilterId || null, service.batteryTypeId || null,
      service.subtotal, vatPercentage, vatAmount, totalAmount, laborCost, service.oilQuantityDetails || null
    ];

    console.log('SQL parameters:', params);
    console.log('Undefined parameters:', params.map((p, i) => p === undefined ? i : null).filter(i => i !== null));

    // Insert service booking with labour_cost
    const [bookingResult] = await db.execute(`
      INSERT INTO service_bookings (
        customer_id, vehicle_id, service_type, service_date, service_time,
        service_interval, oil_type_id, oil_quantity, oil_filter_id, battery_type_id,
        subtotal, vat_percentage, vat_amount, total_amount, labour_cost, oil_package_details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customerId, vehicleId, sanitizedService.type, sanitizedService.date, sanitizedService.time,
      sanitizedService.interval || null, sanitizedService.oilTypeId || null, sanitizedService.oilQuantity || null,
      sanitizedService.oilFilterId || null, sanitizedService.batteryTypeId || null,
      sanitizedService.subtotal, vatPercentage, vatAmount, totalAmount, laborCost, sanitizedService.oilQuantityDetails || null
    ]);

    const bookingId = bookingResult.insertId;

    // Generate bill number
    const billNumber = `TKN-${bookingId}`;

    // Update bill_number for this booking
    await db.execute(
      'UPDATE service_bookings SET bill_number = ? WHERE id = ?',
      [billNumber, bookingId]
    );

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
      billNumber: billNumber,
      totalAmount: totalAmount,
      laborCost: laborCost
    });

  } catch (error) {
    await db.rollback();
    console.error('Booking creation failed:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ error: 'Failed to create booking', details: error.message });
  }
}

const updateBooking = async (req, res) => {
  const db = getDB();
  try {
    const { id } = req.params;
    const {
      customer, vehicle, service, accessories = [], status
    } = req.body;

    const bookingId = parseInt(id);

    // Validate booking ID
    if (!bookingId || isNaN(bookingId)) {
      return res.status(400).json({
        error: 'Valid booking ID is required'
      });
    }

    // Check if booking exists
    const [existingBooking] = await db.execute(
      'SELECT * FROM service_bookings WHERE id = ?',
      [bookingId]
    );

    if (existingBooking.length === 0) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    const currentBooking = existingBooking[0];

    // Validate status transition if status is being updated
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Check if booking can be updated based on current status
    if (currentBooking.status === 'completed' || currentBooking.status === 'cancelled') {
      if (!status) {
        return res.status(400).json({
          error: `Cannot update ${currentBooking.status} booking details. Only status changes are allowed.`
        });
      }
    }

    // Start transaction
    await db.beginTransaction();

    let customerId = currentBooking.customer_id;
    let vehicleId = currentBooking.vehicle_id;

    // Only update customer and vehicle if booking is still pending
    if (currentBooking.status === 'pending' && customer && vehicle) {
      // Handle customer update/creation
      if (customer.mobile) {
        const [existingCustomer] = await db.execute(
          'SELECT id FROM customers WHERE mobile = ?',
          [customer.mobile]
        );

        if (existingCustomer.length > 0) {
          customerId = existingCustomer[0].id;
          // Update customer name if different
          await db.execute(
            'UPDATE customers SET name = ? WHERE id = ?',
            [customer.name, customerId]
          );
        } else {
          const [customerResult] = await db.execute(
            'INSERT INTO customers (name, mobile) VALUES (?, ?)',
            [customer.name, customer.mobile]
          );
          customerId = customerResult.insertId;
        }
      }

      // Handle vehicle update/creation
      if (vehicle.plateNumber) {
        const [existingVehicle] = await db.execute(
          'SELECT id FROM customer_vehicles WHERE plate_number = ?',
          [vehicle.plateNumber]
        );

        if (existingVehicle.length > 0) {
          vehicleId = existingVehicle[0].id;
          await db.execute(
            'UPDATE customer_vehicles SET customer_id = ?, brand_id = ?, model_id = ? WHERE id = ?',
            [customerId, vehicle.brandId, vehicle.modelId, vehicleId]
          );
        } else {
          const [vehicleResult] = await db.execute(
            'INSERT INTO customer_vehicles (customer_id, brand_id, model_id, plate_number) VALUES (?, ?, ?, ?)',
            [customerId, vehicle.brandId, vehicle.modelId, vehicle.plateNumber]
          );
          vehicleId = vehicleResult.insertId;
        }
      }
    }

    // Prepare update fields
    let updateFields = [];
    let updateValues = [];

    // Update service details only if booking is pending
    if (currentBooking.status === 'pending' && service) {
      const sanitizedService = {
        type: service.type || currentBooking.service_type,
        date: service.date || currentBooking.service_date,
        time: service.time || currentBooking.service_time,
        interval: service.interval || currentBooking.service_interval,
        oilTypeId: service.oilTypeId || currentBooking.oil_type_id,
        oilQuantity: service.oilQuantity || currentBooking.oil_quantity,
        oilFilterId: service.oilFilterId || currentBooking.oil_filter_id,
        batteryTypeId: service.batteryTypeId || currentBooking.battery_type_id,
        subtotal: service.subtotal || currentBooking.subtotal,
        laborCost: service.laborCost !== undefined ? service.laborCost : currentBooking.labour_cost, // Added labor cost
        oilQuantityDetails: service.oilQuantityDetails || currentBooking.oil_package_details
      };

      // Validate labor cost
      const laborCost = parseFloat(sanitizedService.laborCost) || 0;
      if (laborCost < 0) {
        await db.rollback();
        return res.status(400).json({
          error: 'Labor cost cannot be negative'
        });
      }

      // Calculate totals
      const vatPercentage = 5.00;
      const subtotal = parseFloat(sanitizedService.subtotal);
      const vatAmount = (subtotal * vatPercentage) / 100;
      const totalAmount = subtotal + vatAmount;

      updateFields.push(
        'customer_id = ?', 'vehicle_id = ?', 'service_type = ?', 'service_date = ?', 'service_time = ?',
        'service_interval = ?', 'oil_type_id = ?', 'oil_quantity = ?', 'oil_filter_id = ?', 'battery_type_id = ?',
        'subtotal = ?', 'vat_percentage = ?', 'vat_amount = ?', 'total_amount = ?', 'labour_cost = ?', 'oil_package_details = ?'
      );
      updateValues.push(
        customerId, vehicleId, sanitizedService.type, sanitizedService.date, sanitizedService.time,
        sanitizedService.interval, sanitizedService.oilTypeId, sanitizedService.oilQuantity,
        sanitizedService.oilFilterId, sanitizedService.batteryTypeId,
        sanitizedService.subtotal, vatPercentage, vatAmount, totalAmount, laborCost, sanitizedService.oilQuantityDetails
      );
    }

    // Update status if provided
    if (status && status !== currentBooking.status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    // Add timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    if (updateFields.length === 1) { // Only timestamp update
      await db.rollback();
      return res.status(400).json({
        error: 'No valid fields to update'
      });
    }

    // Update service booking
    const updateQuery = `UPDATE service_bookings SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(bookingId);

    console.log('Update query:', updateQuery);
    console.log('Update values:', updateValues);

    const [bookingResult] = await db.execute(updateQuery, updateValues);

    if (bookingResult.affectedRows === 0) {
      await db.rollback();
      return res.status(404).json({
        error: 'Booking not found or no changes made'
      });
    }

    // Update accessories only if booking is pending and accessories are provided
    if (currentBooking.status === 'pending' && accessories.length >= 0) {
      // Delete existing accessories
      await db.execute(
        'DELETE FROM booking_accessories WHERE booking_id = ?',
        [bookingId]
      );

      // Insert updated accessories
      for (const accessory of accessories) {
        await db.execute(
          'INSERT INTO booking_accessories (booking_id, accessory_id, quantity, price) VALUES (?, ?, ?, ?)',
          [bookingId, accessory.id, accessory.quantity, accessory.price]
        );
      }
    }

    await db.commit();

    // Get updated booking details
    const [updatedBooking] = await db.execute(
      'SELECT * FROM service_bookings WHERE id = ?',
      [bookingId]
    );

    res.json({
      success: true,
      message: 'Booking updated successfully',
      bookingId: bookingId,
      booking: updatedBooking[0]
    });

  } catch (error) {
    await db.rollback();
    console.error('Booking update failed:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ error: 'Failed to update booking', details: error.message });
  }
};

const deleteBooking = async (req, res) => {
  const db = getDB();
  try {
    const { id } = req.params; // or req.body depending on your route setup
    const bookingId = parseInt(id);
    // Validate booking ID
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID is required'
      });
    }

    // Start transaction
    await db.beginTransaction();

    // Check if booking exists
    const [existingBooking] = await db.execute(
      'SELECT id, customer_id, vehicle_id FROM service_bookings WHERE id = ?',
      [bookingId]
    );

    if (existingBooking.length === 0) {
      await db.rollback();
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Delete related accessories first (foreign key constraint)
    await db.execute(
      'DELETE FROM booking_accessories WHERE booking_id = ?',
      [bookingId]
    );

    // Delete the main booking
    const [deleteResult] = await db.execute(
      'DELETE FROM service_bookings WHERE id = ?',
      [bookingId]
    );

    // Check if deletion was successful
    if (deleteResult.affectedRows === 0) {
      await db.rollback();
      return res.status(500).json({
        success: false,
        error: 'Failed to delete booking'
      });
    }

    await db.commit();

    res.json({
      success: true,
      message: 'Booking deleted successfully',
      deletedBookingId: bookingId
    });

  } catch (error) {
    await db.rollback();
    console.error('Booking deletion failed:', error);
    console.error('Booking ID:', req.params.bookingId || req.body.bookingId);
    res.status(500).json({
      success: false,
      error: 'Failed to delete booking',
      details: error.message
    });
  }
};

module.exports = {
  getAllBookings,
  createNewBooking,
  updateBooking,
  deleteBooking
}