
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
    const allowedSortFields = ['created_at', 'service_date', 'total_amount', 'status', 'customer_name', 'created_by_name'];
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

    // Search functionality - using LIKE with escaped values (including user name search)
    // Note: Handle NULL vehicle data in search
    if (search && search.trim()) {
      const searchTerm = escapeLike(search.trim());
      whereConditions.push(`(
        c.name LIKE ${searchTerm} OR 
        c.mobile LIKE ${searchTerm} OR 
        COALESCE(cv.plate_number, '') LIKE ${searchTerm} OR 
        COALESCE(sb.reference_plate_number, '') LIKE ${searchTerm} OR 
        COALESCE(vb.name, '') LIKE ${searchTerm} OR 
        COALESCE(vm.name, '') LIKE ${searchTerm} OR
        sb.id LIKE ${searchTerm} OR
        sb.subtotal LIKE ${searchTerm} OR
        COALESCE(sb.bill_number, '') LIKE ${searchTerm} OR
        COALESCE(sb.status, '') LIKE ${searchTerm} OR
        COALESCE(u.name, '') LIKE ${searchTerm} OR
        COALESCE(u.email, '') LIKE ${searchTerm}
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

    // Build the main query with user information
    // Changed JOINs to LEFT JOINs to handle NULL vehicle_id for other_service
    const sortColumn = sortField === 'customer_name' ? 'c.name' :
      sortField === 'created_by_name' ? 'COALESCE(u.name, "Unknown")' :
        `sb.${sortField}`;

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
        sb.memo,
        sb.vehicle_id,
        sb.customer_id,
        sb.created_by,
        sb.discount,
        sb.reference_plate_number,
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
        bt.brand as battery_brand,
        u.name as created_by_name,
        u.email as created_by_email,
        u.role as created_by_role
      FROM service_bookings sb
      INNER JOIN customers c ON sb.customer_id = c.id
      LEFT JOIN customer_vehicles cv ON sb.vehicle_id = cv.id
      LEFT JOIN vehicle_brands vb ON cv.brand_id = vb.id
      LEFT JOIN vehicle_models vm ON cv.model_id = vm.id
      LEFT JOIN oil_filters oil_f ON sb.oil_filter_id = oil_f.id
      LEFT JOIN battery_types bt ON sb.battery_type_id = bt.id
      LEFT JOIN users u ON sb.created_by = u.id
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

        // Add accessories to results and structure user information
        results.forEach(booking => {
          booking.accessories = accessoriesMap[booking.id] || [];

          // Structure vehicle information properly (handle NULL vehicle data)
          // Only create vehicle object if vehicle_id exists, otherwise keep original fields
          if (booking.vehicle_id) {
            booking.vehicle = {
              id: booking.vehicle_id,
              plate_number: booking.plate_number,
              brand_id: booking.brand_id,
              model_id: booking.model_id,
              brand_name: booking.brand_name,
              model_name: booking.model_name
            };
            // Remove individual vehicle fields since we structured them
            delete booking.plate_number;
            delete booking.brand_id;
            delete booking.model_id;
            delete booking.brand_name;
            delete booking.model_name;
          } else {
            // For other_service, keep vehicle_id as null and don't create vehicle object
            // But include reference plate number if available
            booking.vehicle = booking.reference_plate_number ? {
              id: null,
              plate_number: booking.reference_plate_number,
              brand_id: null,
              model_id: null,
              brand_name: null,
              model_name: null,
              is_reference_only: true // Flag to indicate this is just a plate reference
            } : null;
          }

          // Clean up the reference_plate_number field since it's now in vehicle object
          delete booking.reference_plate_number;

          // Structure user information in a nested object (handle NULL created_by)
          booking.created_by_user = booking.created_by ? {
            id: booking.created_by,
            name: booking.created_by_name || 'Unknown',
            email: booking.created_by_email || null,
            role: booking.created_by_role || null
          } : null;

          // Always remove user fields since we structured them
          delete booking.created_by_name;
          delete booking.created_by_email;
          delete booking.created_by_role;
        });

        // Get customer vehicles for other_service bookings
        const otherServiceBookings = results.filter(booking => booking.service_type === 'other_service');
        if (otherServiceBookings.length > 0) {
          const customerIds = [...new Set(otherServiceBookings.map(b => b.customer_id))];
          
          const customerVehiclesQuery = `
            SELECT 
              cv.customer_id,
              cv.id as vehicle_id,
              cv.plate_number,
              cv.brand_id,
              cv.model_id,
              vb.name as brand_name,
              vm.name as model_name
            FROM customer_vehicles cv
            LEFT JOIN vehicle_brands vb ON cv.brand_id = vb.id
            LEFT JOIN vehicle_models vm ON cv.model_id = vm.id
            WHERE cv.customer_id IN (${customerIds.join(',')})
            ORDER BY cv.created_at DESC
          `;

          try {
            const [customerVehiclesResults] = await db.query(customerVehiclesQuery);
            
            // Group vehicles by customer_id
            const vehiclesByCustomer = {};
            customerVehiclesResults.forEach(vehicle => {
              if (!vehiclesByCustomer[vehicle.customer_id]) {
                vehiclesByCustomer[vehicle.customer_id] = [];
              }
              vehiclesByCustomer[vehicle.customer_id].push({
                id: vehicle.vehicle_id,
                plate_number: vehicle.plate_number,
                brand_id: vehicle.brand_id,
                model_id: vehicle.model_id,
                brand_name: vehicle.brand_name,
                model_name: vehicle.model_name
              });
            });

            // Add customer_vehicles to other_service bookings
            otherServiceBookings.forEach(booking => {
              booking.customer_vehicles = vehiclesByCustomer[booking.customer_id] || [];
            });

            // If search term looks like a plate number, search for vehicles with that plate
            if (search && search.trim()) {
              const searchTerm = search.trim().toUpperCase();
              // Check if search term could be a plate number (contains letters and numbers, or dashes)
              if (/^[A-Z0-9\-\s]+$/i.test(searchTerm)) {
                const plateSearchQuery = `
                  SELECT DISTINCT
                    cv.id as vehicle_id,
                    cv.plate_number,
                    cv.brand_id,
                    cv.model_id,
                    cv.customer_id,
                    vb.name as brand_name,
                    vm.name as model_name,
                    c.name as owner_name,
                    c.mobile as owner_mobile
                  FROM customer_vehicles cv
                  LEFT JOIN vehicle_brands vb ON cv.brand_id = vb.id
                  LEFT JOIN vehicle_models vm ON cv.model_id = vm.id
                  LEFT JOIN customers c ON cv.customer_id = c.id
                  WHERE UPPER(cv.plate_number) LIKE '%${searchTerm.replace(/'/g, "''")}%'
                  ORDER BY cv.created_at DESC
                  LIMIT 10
                `;

                try {
                  const [plateSearchResults] = await db.query(plateSearchQuery);
                  
                  // Add plate search results to response for frontend to use
                  if (plateSearchResults.length > 0) {
                    // Add to each other_service booking for context
                    otherServiceBookings.forEach(booking => {
                      booking.plate_search_results = plateSearchResults.map(vehicle => ({
                        id: vehicle.vehicle_id,
                        plate_number: vehicle.plate_number,
                        brand_id: vehicle.brand_id,
                        model_id: vehicle.model_id,
                        brand_name: vehicle.brand_name,
                        model_name: vehicle.model_name,
                        owner: {
                          id: vehicle.customer_id,
                          name: vehicle.owner_name,
                          mobile: vehicle.owner_mobile
                        },
                        display_text: `${vehicle.plate_number} - ${vehicle.brand_name || 'Unknown'} ${vehicle.model_name || 'Model'} (Owner: ${vehicle.owner_name || 'Unknown'})`
                      }));
                    });
                  }
                } catch (plateSearchError) {
                  console.error('Error searching for plate number:', plateSearchError);
                }
              }
            }

            console.log('Added customer vehicles for other_service bookings');
          } catch (vehicleError) {
            console.error('Error fetching customer vehicles for other_service:', vehicleError);
            // Continue without customer vehicles if there's an error
            otherServiceBookings.forEach(booking => {
              booking.customer_vehicles = [];
            });
          }
        }
      } catch (accessoriesError) {
        console.error('Error fetching accessories:', accessoriesError);
        // Continue without accessories if there's an error
        results.forEach(booking => {
          booking.accessories = [];
          
          // Structure vehicle information properly (handle NULL vehicle data)
          if (booking.vehicle_id) {
            booking.vehicle = {
              id: booking.vehicle_id,
              plate_number: booking.plate_number,
              brand_id: booking.brand_id,
              model_id: booking.model_id,
              brand_name: booking.brand_name,
              model_name: booking.model_name
            };
            // Remove individual vehicle fields since we structured them
            delete booking.plate_number;
            delete booking.brand_id;
            delete booking.model_id;
            delete booking.brand_name;
            delete booking.model_name;
          } else {
            // For other_service, keep vehicle_id as null and don't create vehicle object
            // But include reference plate number if available
            booking.vehicle = booking.reference_plate_number ? {
              id: null,
              plate_number: booking.reference_plate_number,
              brand_id: null,
              model_id: null,
              brand_name: null,
              model_name: null,
              is_reference_only: true // Flag to indicate this is just a plate reference
            } : null;
          }

          // Clean up the reference_plate_number field since it's now in vehicle object
          delete booking.reference_plate_number;

          booking.created_by_user = booking.created_by ? {
            id: booking.created_by,
            name: booking.created_by_name || 'Unknown',
            email: booking.created_by_email || null,
            role: booking.created_by_role || null
          } : null;

          // Always remove user fields since we structured them
          delete booking.created_by_name;
          delete booking.created_by_email;
          delete booking.created_by_role;
        });

        // Get customer vehicles for other_service bookings (error case too)
        const otherServiceBookings = results.filter(booking => booking.service_type === 'other_service');
        if (otherServiceBookings.length > 0) {
          const customerIds = [...new Set(otherServiceBookings.map(b => b.customer_id))];
          
          const customerVehiclesQuery = `
            SELECT 
              cv.customer_id,
              cv.id as vehicle_id,
              cv.plate_number,
              cv.brand_id,
              cv.model_id,
              vb.name as brand_name,
              vm.name as model_name
            FROM customer_vehicles cv
            LEFT JOIN vehicle_brands vb ON cv.brand_id = vb.id
            LEFT JOIN vehicle_models vm ON cv.model_id = vm.id
            WHERE cv.customer_id IN (${customerIds.join(',')})
            ORDER BY cv.created_at DESC
          `;

          try {
            const [customerVehiclesResults] = await db.query(customerVehiclesQuery);
            
            // Group vehicles by customer_id
            const vehiclesByCustomer = {};
            customerVehiclesResults.forEach(vehicle => {
              if (!vehiclesByCustomer[vehicle.customer_id]) {
                vehiclesByCustomer[vehicle.customer_id] = [];
              }
              vehiclesByCustomer[vehicle.customer_id].push({
                id: vehicle.vehicle_id,
                plate_number: vehicle.plate_number,
                brand_id: vehicle.brand_id,
                model_id: vehicle.model_id,
                brand_name: vehicle.brand_name,
                model_name: vehicle.model_name
              });
            });

            // Add customer_vehicles to other_service bookings
            otherServiceBookings.forEach(booking => {
              booking.customer_vehicles = vehiclesByCustomer[booking.customer_id] || [];
            });

            console.log('Added customer vehicles for other_service bookings (error recovery)');
          } catch (vehicleError) {
            console.error('Error fetching customer vehicles for other_service (error recovery):', vehicleError);
            // Set empty arrays if vehicles can't be fetched
            otherServiceBookings.forEach(booking => {
              booking.customer_vehicles = [];
            });
          }
        }
      }
    }

    // Get total count for pagination (include user join in count query too)
    // Use same LEFT JOINs as main query for consistency
    const countQuery = `
      SELECT COUNT(DISTINCT sb.id) as total
      FROM service_bookings sb
      INNER JOIN customers c ON sb.customer_id = c.id
      LEFT JOIN customer_vehicles cv ON sb.vehicle_id = cv.id
      LEFT JOIN vehicle_brands vb ON cv.brand_id = vb.id
      LEFT JOIN vehicle_models vm ON cv.model_id = vm.id
      LEFT JOIN oil_filters oil_f ON sb.oil_filter_id = oil_f.id
      LEFT JOIN battery_types bt ON sb.battery_type_id = bt.id
      LEFT JOIN users u ON sb.created_by = u.id
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

// const createNewBooking = async (req, res) => {
//   const db = getDB();
//   try {
//     const {
//       customer, vehicle, service, accessories = []
//     } = req.body;

//     const sanitizedService = {
//       type: service.type,
//       date: service.date,
//       time: service.time,
//       interval: service.interval || null,
//       oilTypeId: service.oilTypeId || null,
//       oilQuantity: service.oilQuantity || null,
//       oilFilterId: service.oilFilterId || null,
//       batteryTypeId: service.batteryTypeId || null,
//       subtotal: service.subtotal,
//       laborCost: service.laborCost || 0,
//       oilQuantityDetails: service.oilQuantityDetails || null,
//       memo: service.memo || null,
//       createdBy: (service.createdBy && service.createdBy !== '') ? service.createdBy : null,
//       // Store plate number reference for other_service
//       referencePlateNumber: (service.type === 'other_service' && vehicle?.plateNumber) ? vehicle.plateNumber : null,
//       discount: parseFloat(service.discount) || 0,
//     };

//     console.log('Service data with memo:', sanitizedService);
//     console.log('Service type:', sanitizedService.type);
//     console.log('Vehicle data:', vehicle);

//     // Validate created_by user exists if provided
//     if (sanitizedService.createdBy !== null) {
//       const [userExists] = await db.execute(
//         'SELECT id FROM users WHERE id = ?',
//         [sanitizedService.createdBy]
//       );
      
//       if (userExists.length === 0) {
//         return res.status(400).json({
//           error: 'Invalid created_by user ID',
//           details: `User with ID ${sanitizedService.createdBy} does not exist`
//         });
//       }
//       console.log('Validated created_by user:', sanitizedService.createdBy);
//     }

//     // Start transaction
//     await db.beginTransaction();

//     // Insert or get customer
//     let customerId;
//     const [existingCustomer] = await db.execute(
//       'SELECT id FROM customers WHERE mobile = ?',
//       [customer.mobile]
//     );

//     if (existingCustomer.length > 0) {
//       customerId = existingCustomer[0].id;
//       console.log('Found existing customer:', customerId);
//     } else {
//       const [customerResult] = await db.execute(
//         'INSERT INTO customers (name, mobile) VALUES (?, ?)',
//         [customer.name, customer.mobile]
//       );
//       customerId = customerResult.insertId;
//       console.log('Created new customer:', customerId);
//     }

//     // Handle vehicle section with improved logic
//     let vehicleId = null;
//     let vehicleProcessed = false;
    
//     // Process vehicle if it exists (regardless of service type)
//     if (vehicle && vehicle.plateNumber && vehicle.brandId && vehicle.modelId) {
//       // Full vehicle data provided - process normally
//       const [existingVehicle] = await db.execute(
//         'SELECT id, customer_id, brand_id, model_id FROM customer_vehicles WHERE plate_number = ?',
//         [vehicle.plateNumber]
//       );

//       if (existingVehicle.length > 0) {
//         const existingVehicleId = existingVehicle[0].id;
//         const existing = existingVehicle[0];

//         // Check if any vehicle information has changed
//         const needsUpdate = (
//           existing.customer_id != customerId ||
//           existing.brand_id != vehicle.brandId ||
//           existing.model_id != vehicle.modelId
//         );

//         if (needsUpdate) {
//           // Update the existing vehicle's information
//           await db.execute(
//             'UPDATE customer_vehicles SET customer_id = ?, brand_id = ?, model_id = ? WHERE id = ?',
//             [customerId, vehicle.brandId, vehicle.modelId, existingVehicleId]
//           );
//           console.log('Found and updated existing vehicle:', existingVehicleId);
//         } else {
//           console.log('Found existing vehicle (no changes needed):', existingVehicleId);
//         }

//         // For other_service, we process the vehicle but don't associate it with the booking
//         if (sanitizedService.type !== 'other_service') {
//           vehicleId = existingVehicleId;
//         }
//         vehicleProcessed = true;

//       } else {
//         // Create new vehicle
//         const [vehicleResult] = await db.execute(
//           'INSERT INTO customer_vehicles (customer_id, brand_id, model_id, plate_number) VALUES (?, ?, ?, ?)',
//           [customerId, vehicle.brandId, vehicle.modelId, vehicle.plateNumber]
//         );
//         const newVehicleId = vehicleResult.insertId;
//         console.log('Created new vehicle:', newVehicleId);

//         // For other_service, we create the vehicle but don't associate it with the booking
//         if (sanitizedService.type !== 'other_service') {
//           vehicleId = newVehicleId;
//         }
//         vehicleProcessed = true;
//       }
//     } else if (vehicle && vehicle.plateNumber && sanitizedService.type === 'other_service') {
//       // For other_service: only plate number provided without full vehicle details
//       // We'll store the plate number in the booking memo or a new field
//       console.log('Other service with plate number only:', vehicle.plateNumber);
      
//       // Check if this plate number exists in the system
//       const [existingVehicle] = await db.execute(
//         'SELECT id, customer_id, brand_id, model_id FROM customer_vehicles WHERE plate_number = ?',
//         [vehicle.plateNumber]
//       );

//       if (existingVehicle.length > 0) {
//         console.log('Found existing vehicle for plate number:', vehicle.plateNumber);
//         // Vehicle exists but we won't associate it with other_service booking
//         vehicleProcessed = true;
//       } else {
//         console.log('Plate number not found in system, will store as reference only');
//       }
//     }

//     console.log('Vehicle processing result:', {
//       vehicleProcessed,
//       vehicleIdForBooking: vehicleId,
//       serviceType: sanitizedService.type,
//       plateNumber: vehicle?.plateNumber || null
//     });

//     // Calculate totals
//     const vatPercentage = 5.00;
//     const subtotal = parseFloat(sanitizedService.subtotal);
//     const laborCost = parseFloat(sanitizedService.laborCost) || 0;
//     const vatAmount = (subtotal * vatPercentage) / 100;
//     const totalAmount = subtotal + vatAmount;

//     // Prepare parameters for booking insertion
//     const bookingParams = [
//       customerId,
//       vehicleId, // null for other_service, actual ID for vehicle-based services
//       sanitizedService.type,
//       sanitizedService.date,
//       sanitizedService.time,
//       sanitizedService.interval,
//       sanitizedService.oilTypeId,
//       sanitizedService.oilQuantity,
//       sanitizedService.oilFilterId,
//       sanitizedService.batteryTypeId,
//       sanitizedService.subtotal,
//       vatPercentage,
//       vatAmount,
//       totalAmount,
//       laborCost,
//       sanitizedService.oilQuantityDetails,
//       sanitizedService.memo,
//       sanitizedService.createdBy,
//       sanitizedService.referencePlateNumber,
//       sanitizedService.discount
//     ];

//     console.log('Booking parameters:', bookingParams);

//     // Insert service booking
//     const [bookingResult] = await db.execute(`
//       INSERT INTO service_bookings (
//         customer_id, vehicle_id, service_type, service_date, service_time,
//         service_interval, oil_type_id, oil_quantity, oil_filter_id, battery_type_id,
//         subtotal, vat_percentage, vat_amount, total_amount, labour_cost, oil_package_details, memo, created_by, reference_plate_number, discount
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `, bookingParams);

//     const bookingId = bookingResult.insertId;
//     console.log('Created booking with ID:', bookingId);

//     // Generate bill number
//     const billNumber = `TKN-${bookingId}`;

//     // Update bill_number for this booking
//     await db.execute(
//       'UPDATE service_bookings SET bill_number = ? WHERE id = ?',
//       [billNumber, bookingId]
//     );

//     console.log('Generated bill number:', billNumber);

//     // Insert accessories
//     for (const accessory of accessories) {
//       await db.execute(
//         'INSERT INTO booking_accessories (booking_id, accessory_id, quantity, price) VALUES (?, ?, ?, ?)',
//         [bookingId, accessory.id, accessory.quantity, accessory.price]
//       );
//     }

//     console.log('Inserted accessories:', accessories.length);

//     await db.commit();
//     console.log('Transaction committed successfully');

//     // Enhanced response
//     res.json({
//       success: true,
//       bookingId: bookingId,
//       billNumber: billNumber,
//       totalAmount: totalAmount,
//       laborCost: laborCost,
//       memo: sanitizedService.memo,
//       createdBy: sanitizedService.createdBy,
//       vatAmount: vatAmount,
//       subtotal: subtotal,
//       vehicleId: vehicleId, // null for other_service
//       vehicleProcessed: vehicleProcessed, // indicates if vehicle data was saved
//       message: 'Booking created successfully'
//     });

//   } catch (error) {
//     await db.rollback();
//     console.error('Booking creation failed:', error);
//     console.error('Request body:', req.body);
//     res.status(500).json({
//       error: 'Failed to create booking',
//       details: error.message
//     });
//   }
// };

const createNewBooking = async (req, res) => {
  const pool = getDB();
  const connection = await pool.getConnection();
  
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
      laborCost: service.laborCost || 0,
      discount: parseFloat(service.discount) || 0,
      oilQuantityDetails: service.oilQuantityDetails || null,
      memo: service.memo || null,
      createdBy: (service.createdBy && service.createdBy !== '') ? service.createdBy : null,
      // Store plate number reference for other_service
      referencePlateNumber: (service.type === 'other_service' && vehicle?.plateNumber) ? vehicle.plateNumber : null,
      // Accept status from payload, default to 'completed'
      status: service.status || 'completed'
    };

    console.log('Service data with memo:', sanitizedService);
    console.log('Service type:', sanitizedService.type);
    console.log('Vehicle data:', vehicle);

    // Validate status if provided
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (sanitizedService.status && !validStatuses.includes(sanitizedService.status)) {
      return res.status(400).json({
        error: 'Invalid status',
        details: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Validate created_by user exists if provided
    if (sanitizedService.createdBy !== null) {
      const [userExists] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [sanitizedService.createdBy]
      );
      
      if (userExists.length === 0) {
        return res.status(400).json({
          error: 'Invalid created_by user ID',
          details: `User with ID ${sanitizedService.createdBy} does not exist`
        });
      }
      console.log('Validated created_by user:', sanitizedService.createdBy);
    }

    // Start transaction
    await connection.beginTransaction();

    // Insert or get customer
    let customerId;
    const [existingCustomer] = await connection.execute(
      'SELECT id FROM customers WHERE mobile = ?',
      [customer.mobile]
    );

    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].id;
      console.log('Found existing customer:', customerId);
    } else {
      const [customerResult] = await connection.execute(
        'INSERT INTO customers (name, mobile) VALUES (?, ?)',
        [customer.name, customer.mobile]
      );
      customerId = customerResult.insertId;
      console.log('Created new customer:', customerId);
    }

    // Handle vehicle section with improved logic
    let vehicleId = null;
    let vehicleProcessed = false;
    
    // Process vehicle if it exists (regardless of service type)
    if (vehicle && vehicle.plateNumber && vehicle.brandId && vehicle.modelId) {
      // Full vehicle data provided - process normally
      const [existingVehicle] = await connection.execute(
        'SELECT id, customer_id, brand_id, model_id FROM customer_vehicles WHERE plate_number = ?',
        [vehicle.plateNumber]
      );

      if (existingVehicle.length > 0) {
        const existingVehicleId = existingVehicle[0].id;
        const existing = existingVehicle[0];

        // Check if any vehicle information has changed
        const needsUpdate = (
          existing.customer_id != customerId ||
          existing.brand_id != vehicle.brandId ||
          existing.model_id != vehicle.modelId
        );

        if (needsUpdate) {
          // Update the existing vehicle's information
          await connection.execute(
            'UPDATE customer_vehicles SET customer_id = ?, brand_id = ?, model_id = ? WHERE id = ?',
            [customerId, vehicle.brandId, vehicle.modelId, existingVehicleId]
          );
          console.log('Found and updated existing vehicle:', existingVehicleId);
        } else {
          console.log('Found existing vehicle (no changes needed):', existingVehicleId);
        }

        // For other_service, we process the vehicle but don't associate it with the booking
        if (sanitizedService.type !== 'other_service') {
          vehicleId = existingVehicleId;
        }
        vehicleProcessed = true;

      } else {
        // Create new vehicle
        const [vehicleResult] = await connection.execute(
          'INSERT INTO customer_vehicles (customer_id, brand_id, model_id, plate_number) VALUES (?, ?, ?, ?)',
          [customerId, vehicle.brandId, vehicle.modelId, vehicle.plateNumber]
        );
        const newVehicleId = vehicleResult.insertId;
        console.log('Created new vehicle:', newVehicleId);

        // For other_service, we create the vehicle but don't associate it with the booking
        if (sanitizedService.type !== 'other_service') {
          vehicleId = newVehicleId;
        }
        vehicleProcessed = true;
      }
    } else if (vehicle && vehicle.plateNumber && sanitizedService.type === 'other_service') {
      // For other_service: only plate number provided without full vehicle details
      // We'll store the plate number in the booking memo or a new field
      console.log('Other service with plate number only:', vehicle.plateNumber);
      
      // Check if this plate number exists in the system
      const [existingVehicle] = await connection.execute(
        'SELECT id, customer_id, brand_id, model_id FROM customer_vehicles WHERE plate_number = ?',
        [vehicle.plateNumber]
      );

      if (existingVehicle.length > 0) {
        console.log('Found existing vehicle for plate number:', vehicle.plateNumber);
        // Vehicle exists but we won't associate it with other_service booking
        vehicleProcessed = true;
      } else {
        console.log('Plate number not found in system, will store as reference only');
      }
    }

    console.log('Vehicle processing result:', {
      vehicleProcessed,
      vehicleIdForBooking: vehicleId,
      serviceType: sanitizedService.type,
      plateNumber: vehicle?.plateNumber || null
    });

    // Calculate totals
    const vatPercentage = 5.00;
    const subtotal = parseFloat(sanitizedService.subtotal);
    const laborCost = parseFloat(sanitizedService.laborCost) || 0;
    const vatAmount = (subtotal * vatPercentage) / 100;
    const totalAmount = subtotal + vatAmount;

    // Prepare parameters for booking insertion
    const bookingParams = [
      customerId,
      vehicleId, // null for other_service, actual ID for vehicle-based services
      sanitizedService.type,
      sanitizedService.date,
      sanitizedService.time,
      sanitizedService.interval,
      sanitizedService.oilTypeId,
      sanitizedService.oilQuantity,
      sanitizedService.oilFilterId,
      sanitizedService.batteryTypeId,
      sanitizedService.subtotal,
      vatPercentage,
      vatAmount,
      totalAmount,
      laborCost,
      sanitizedService.oilQuantityDetails,
      sanitizedService.memo,
      sanitizedService.createdBy,
      sanitizedService.referencePlateNumber,
      sanitizedService.discount,
      sanitizedService.status
    ];

    console.log('Booking parameters:', bookingParams);

    // Insert service booking
    const [bookingResult] = await connection.execute(`
      INSERT INTO service_bookings (
        customer_id, vehicle_id, service_type, service_date, service_time,
        service_interval, oil_type_id, oil_quantity, oil_filter_id, battery_type_id,
        subtotal, vat_percentage, vat_amount, total_amount, labour_cost, oil_package_details, memo, created_by, reference_plate_number, discount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, bookingParams);

    const bookingId = bookingResult.insertId;
    console.log('Created booking with ID:', bookingId);

    // Generate bill number
    const billNumber = `TKN-${bookingId}`;

    // Update bill_number for this booking
    await connection.execute(
      'UPDATE service_bookings SET bill_number = ? WHERE id = ?',
      [billNumber, bookingId]
    );

    console.log('Generated bill number:', billNumber);

    // Insert accessories
    for (const accessory of accessories) {
      await connection.execute(
        'INSERT INTO booking_accessories (booking_id, accessory_id, quantity, price) VALUES (?, ?, ?, ?)',
        [bookingId, accessory.id, accessory.quantity, accessory.price]
      );
    }

    console.log('Inserted accessories:', accessories.length);

    await connection.commit();
    console.log('Transaction committed successfully');

    // Enhanced response
    res.json({
      success: true,
      bookingId: bookingId,
      billNumber: billNumber,
      totalAmount: totalAmount,
      laborCost: laborCost,
      discount: sanitizedService.discount,
      memo: sanitizedService.memo,
      createdBy: sanitizedService.createdBy,
      vatAmount: vatAmount,
      subtotal: subtotal,
      status: sanitizedService.status,
      vehicleId: vehicleId, // null for other_service
      vehicleProcessed: vehicleProcessed, // indicates if vehicle data was saved
      message: 'Booking created successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Booking creation failed:', error);
    console.error('Request body:', req.body);
    res.status(500).json({
      error: 'Failed to create booking',
      details: error.message
    });
  } finally {
    // Always release the connection back to the pool
    connection.release();
  }
};

const updateBooking = async (req, res) => {
  const pool = getDB();
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const {
      customer, vehicle, service, accessories = [], status
    } = req.body;

    const bookingId = parseInt(id);

    console.log('=== UPDATE BOOKING WITH MEMO ===');
    console.log('Booking ID:', bookingId);
    console.log('Service data:', service);
    console.log('Vehicle data:', vehicle);
    console.log('Customer data:', customer);
    console.log('Memo in request:', service?.memo);

    // Validate booking ID
    if (!bookingId || isNaN(bookingId)) {
      return res.status(400).json({
        error: 'Valid booking ID is required'
      });
    }

    // Check if booking exists
    const [existingBooking] = await connection.execute(
      'SELECT * FROM service_bookings WHERE id = ?',
      [bookingId]
    );

    if (existingBooking.length === 0) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    const currentBooking = existingBooking[0];
    console.log('Current booking status:', currentBooking.status);

    // Validate created_by user exists if provided in service
    if (service?.createdBy && service.createdBy !== '') {
      const [userExists] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [service.createdBy]
      );
      
      if (userExists.length === 0) {
        return res.status(400).json({
          error: 'Invalid created_by user ID',
          details: `User with ID ${service.createdBy} does not exist`
        });
      }
    }

    // Validate status transition if status is being updated
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Start transaction
    await connection.beginTransaction();

    let customerId = currentBooking.customer_id;
    let vehicleId = currentBooking.vehicle_id;
    let referencePlateNumber = currentBooking.reference_plate_number;

    // Handle customer update/creation - Allow for all statuses except 'cancelled'
    if (currentBooking.status !== 'cancelled' && customer && customer.mobile) {
      console.log('Updating customer data');
      
      const [existingCustomer] = await connection.execute(
        'SELECT id FROM customers WHERE mobile = ?',
        [customer.mobile]
      );

      if (existingCustomer.length > 0) {
        customerId = existingCustomer[0].id;
        // Update customer name if different
        if (customer.name) {
          await connection.execute(
            'UPDATE customers SET name = ? WHERE id = ?',
            [customer.name, customerId]
          );
        }
      } else {
        const [customerResult] = await connection.execute(
          'INSERT INTO customers (name, mobile) VALUES (?, ?)',
          [customer.name || '', customer.mobile]
        );
        customerId = customerResult.insertId;
      }
      console.log('Customer updated/created with ID:', customerId);
    }

    // Handle vehicle update/creation - Allow for all statuses except 'cancelled'
    if (currentBooking.status !== 'cancelled' && vehicle) {
      console.log('Updating vehicle data');
      
      if (currentBooking.service_type === 'other_service') {
        // For other_service: handle plate number reference
        if (vehicle.plateNumber) {
          referencePlateNumber = vehicle.plateNumber;
          
          // Check if full vehicle data is provided
          if (vehicle.brandId && vehicle.modelId) {
            // Full vehicle data provided - save to vehicles table but don't associate
            const [existingVehicle] = await connection.execute(
              'SELECT id FROM customer_vehicles WHERE plate_number = ?',
              [vehicle.plateNumber]
            );

            if (existingVehicle.length > 0) {
              const existingVehicleId = existingVehicle[0].id;
              await connection.execute(
                'UPDATE customer_vehicles SET customer_id = ?, brand_id = ?, model_id = ? WHERE id = ?',
                [customerId, vehicle.brandId, vehicle.modelId, existingVehicleId]
              );
              console.log('Updated existing vehicle for other_service (not associated)');
            } else {
              const [vehicleResult] = await connection.execute(
                'INSERT INTO customer_vehicles (customer_id, brand_id, model_id, plate_number) VALUES (?, ?, ?, ?)',
                [customerId, vehicle.brandId, vehicle.modelId, vehicle.plateNumber]
              );
              console.log('Created new vehicle for other_service (not associated):', vehicleResult.insertId);
            }
          }
          // vehicleId remains null for other_service
          console.log('Updated reference plate number for other_service:', referencePlateNumber);
        } else {
          referencePlateNumber = null;
        }
      } else {
        // For oil_change and battery_replacement: handle normal vehicle association
        if (vehicle.plateNumber && vehicle.brandId && vehicle.modelId) {
          const [existingVehicle] = await connection.execute(
            'SELECT id FROM customer_vehicles WHERE plate_number = ?',
            [vehicle.plateNumber]
          );

          if (existingVehicle.length > 0) {
            vehicleId = existingVehicle[0].id;
            await connection.execute(
              'UPDATE customer_vehicles SET customer_id = ?, brand_id = ?, model_id = ? WHERE id = ?',
              [customerId, vehicle.brandId, vehicle.modelId, vehicleId]
            );
          } else {
            const [vehicleResult] = await connection.execute(
              'INSERT INTO customer_vehicles (customer_id, brand_id, model_id, plate_number) VALUES (?, ?, ?, ?)',
              [customerId, vehicle.brandId, vehicle.modelId, vehicle.plateNumber]
            );
            vehicleId = vehicleResult.insertId;
          }
          // Clear reference plate for regular services
          referencePlateNumber = null;
        }
      }
    }

    // Prepare update fields
    let updateFields = [];
    let updateValues = [];

    // Update service details based on booking status
    if (service) {
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
        laborCost: service.laborCost !== undefined ? service.laborCost : currentBooking.labour_cost,
        oilQuantityDetails: service.oilQuantityDetails || currentBooking.oil_package_details,
        memo: service.memo !== undefined ? service.memo : currentBooking.memo,
        createdBy: service.createdBy !== undefined ? 
          (service.createdBy && service.createdBy !== '' ? service.createdBy : null) : 
          currentBooking.created_by,
        discount: service.discount !== undefined ? parseFloat(service.discount) || 0 : currentBooking.discount,
      };

      console.log('Sanitized service:', sanitizedService);

      // Validate labor cost
      const laborCost = parseFloat(sanitizedService.laborCost) || 0;
      if (laborCost < 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Labor cost cannot be negative'
        });
      }

      // Validate memo length
      if (sanitizedService.memo && sanitizedService.memo.length > 500) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Memo cannot exceed 500 characters'
        });
      }

      // Clean memo text
      const cleanedMemo = sanitizedService.memo ? sanitizedService.memo.trim() : null;

      if (currentBooking.status === 'pending') {
        // Full service update for pending bookings
        console.log('Full service update for pending booking');

        // Calculate totals
        const vatPercentage = 5.00;
        const subtotal = parseFloat(sanitizedService.subtotal);
        const vatAmount = (subtotal * vatPercentage) / 100;
        const totalAmount = subtotal + vatAmount;

        updateFields.push(
          'customer_id = ?', 'vehicle_id = ?', 'service_type = ?', 'service_date = ?', 'service_time = ?',
          'service_interval = ?', 'oil_type_id = ?', 'oil_quantity = ?', 'oil_filter_id = ?', 'battery_type_id = ?',
          'subtotal = ?', 'vat_percentage = ?', 'vat_amount = ?', 'total_amount = ?', 'labour_cost = ?',
          'oil_package_details = ?', 'memo = ?', 'created_by = ?', 'reference_plate_number = ?', 'discount = ?'
        );
        updateValues.push(
          customerId, vehicleId, sanitizedService.type, sanitizedService.date, sanitizedService.time,
          sanitizedService.interval, sanitizedService.oilTypeId, sanitizedService.oilQuantity,
          sanitizedService.oilFilterId, sanitizedService.batteryTypeId,
          sanitizedService.subtotal, vatPercentage, vatAmount, totalAmount, laborCost,
          sanitizedService.oilQuantityDetails, cleanedMemo, sanitizedService.createdBy, referencePlateNumber, sanitizedService.discount
        );

      } else if (currentBooking.status === 'in_progress') {
        // For in_progress bookings, allow memo and created_by updates only
        console.log('Limited service update for in_progress booking (memo and created_by only)');
        
        if (service.memo !== undefined) {
          updateFields.push('memo = ?');
          updateValues.push(cleanedMemo);
        }
        
        if (service.createdBy !== undefined) {
          updateFields.push('created_by = ?');
          updateValues.push(sanitizedService.createdBy);
        }

      } else if (currentBooking.status === 'completed' || currentBooking.status === 'cancelled') {
        // For completed/cancelled bookings, allow memo and created_by updates only
        console.log('Limited service update for completed/cancelled booking (memo and created_by only)');
        
        if (service.memo !== undefined) {
          updateFields.push('memo = ?');
          updateValues.push(cleanedMemo);
        }
        
        if (service.createdBy !== undefined) {
          updateFields.push('created_by = ?');
          updateValues.push(sanitizedService.createdBy);
        }
      }
    }

    // Update customer_id and vehicle_id if they were changed (even for non-pending bookings)
    if (customerId !== currentBooking.customer_id) {
      console.log('Customer ID changed:', currentBooking.customer_id, '->', customerId);
      // Only add if not already in updateFields
      if (!updateFields.includes('customer_id = ?')) {
        updateFields.push('customer_id = ?');
        updateValues.push(customerId);
      }
    }

    if (vehicleId !== currentBooking.vehicle_id) {
      console.log('Vehicle ID changed:', currentBooking.vehicle_id, '->', vehicleId);
      // Only add if not already in updateFields
      if (!updateFields.includes('vehicle_id = ?')) {
        updateFields.push('vehicle_id = ?');
        updateValues.push(vehicleId);
      }
    }

    if (referencePlateNumber !== currentBooking.reference_plate_number) {
      console.log('Reference plate changed:', currentBooking.reference_plate_number, '->', referencePlateNumber);
      // Only add if not already in updateFields
      if (!updateFields.includes('reference_plate_number = ?')) {
        updateFields.push('reference_plate_number = ?');
        updateValues.push(referencePlateNumber);
      }
    }

    // Update status if provided
    if (status && status !== currentBooking.status) {
      updateFields.push('status = ?');
      updateValues.push(status);
      console.log('Status update:', currentBooking.status, '->', status);
    }

    // Add timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    if (updateFields.length === 1) { // Only timestamp update
      await connection.rollback();
      return res.status(400).json({
        error: 'No valid fields to update',
        debug: {
          currentStatus: currentBooking.status,
          providedCustomer: !!customer,
          providedVehicle: !!vehicle,
          providedService: !!service,
          providedStatus: !!status
        }
      });
    }

    // Update service booking
    const updateQuery = `UPDATE service_bookings SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(bookingId);

    console.log('Update query:', updateQuery);
    console.log('Update values:', updateValues);

    const [bookingResult] = await connection.execute(updateQuery, updateValues);

    if (bookingResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        error: 'Booking not found or no changes made'
      });
    }

    console.log('Booking updated successfully');

    // Update accessories only if booking is pending and accessories are provided
    if (currentBooking.status === 'pending' && accessories.length >= 0) {
      console.log('Updating accessories for pending booking');

      // Delete existing accessories
      await connection.execute(
        'DELETE FROM booking_accessories WHERE booking_id = ?',
        [bookingId]
      );

      // Insert updated accessories
      for (const accessory of accessories) {
        await connection.execute(
          'INSERT INTO booking_accessories (booking_id, accessory_id, quantity, price) VALUES (?, ?, ?, ?)',
          [bookingId, accessory.id, accessory.quantity, accessory.price]
        );
      }

      console.log('Accessories updated:', accessories.length);
    }

    await connection.commit();
    console.log('Transaction committed');

    // Get updated booking details with proper JOINs for different service types
    const [updatedBooking] = await pool.execute(
      `SELECT 
        sb.*,
        c.name as customer_name,
        c.mobile as customer_mobile,
        cv.plate_number,
        vb.name as brand_name,
        vm.name as model_name
      FROM service_bookings sb
      JOIN customers c ON sb.customer_id = c.id
      LEFT JOIN customer_vehicles cv ON sb.vehicle_id = cv.id
      LEFT JOIN vehicle_brands vb ON cv.brand_id = vb.id
      LEFT JOIN vehicle_models vm ON cv.model_id = vm.id
      WHERE sb.id = ?`,
      [bookingId]
    );

    console.log('Updated booking:', {
      memo: updatedBooking[0].memo,
      reference_plate_number: updatedBooking[0].reference_plate_number,
      vehicle_id: updatedBooking[0].vehicle_id
    });

    res.json({
      success: true,
      message: 'Booking updated successfully',
      bookingId: bookingId,
      booking: updatedBooking[0],
      memo: updatedBooking[0].memo,
      referencePlateNumber: updatedBooking[0].reference_plate_number,
      changes: {
        fieldsUpdated: updateFields.filter(field => field !== 'updated_at = CURRENT_TIMESTAMP'),
        statusChanged: status && status !== currentBooking.status,
        memoUpdated: service?.memo !== undefined && service.memo !== currentBooking.memo,
        referencePlateUpdated: referencePlateNumber !== currentBooking.reference_plate_number,
        customerUpdated: customerId !== currentBooking.customer_id,
        vehicleUpdated: vehicleId !== currentBooking.vehicle_id
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Booking update failed:', error);
    console.error('Request body:', req.body);
    res.status(500).json({
      error: 'Failed to update booking',
      details: error.message
    });
  } finally {
    // Always release the connection back to the pool
    connection.release();
  }
};

const deleteBooking = async (req, res) => {
  const pool = getDB();
  const connection = await pool.getConnection();
  
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
    await connection.beginTransaction();

    // Check if booking exists
    const [existingBooking] = await connection.execute(
      'SELECT id, customer_id, vehicle_id FROM service_bookings WHERE id = ?',
      [bookingId]
    );

    if (existingBooking.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Delete related accessories first (foreign key constraint)
    await connection.execute(
      'DELETE FROM booking_accessories WHERE booking_id = ?',
      [bookingId]
    );

    // Delete the main booking
    const [deleteResult] = await connection.execute(
      'DELETE FROM service_bookings WHERE id = ?',
      [bookingId]
    );

    // Check if deletion was successful
    if (deleteResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(500).json({
        success: false,
        error: 'Failed to delete booking'
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Booking deleted successfully',
      deletedBookingId: bookingId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Booking deletion failed:', error);
    console.error('Booking ID:', req.params.id || req.body.id);
    res.status(500).json({
      success: false,
      error: 'Failed to delete booking',
      details: error.message
    });
  } finally {
    // Always release the connection back to the pool
    connection.release();
  }
};

const updateBookingStatus = async (req, res) => {
  const pool = getDB();
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const { status, updatedBy } = req.body;

    const bookingId = parseInt(id);

    console.log('=== UPDATE BOOKING STATUS ===');
    console.log('Booking ID:', bookingId);
    console.log('New Status:', status);
    console.log('Updated By:', updatedBy);

    // Validate booking ID
    if (!bookingId || isNaN(bookingId)) {
      return res.status(400).json({
        error: 'Valid booking ID is required'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        details: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Validate updatedBy user exists if provided
    if (updatedBy) {
      const [userExists] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [updatedBy]
      );
      
      if (userExists.length === 0) {
        return res.status(400).json({
          error: 'Invalid updatedBy user ID',
          details: `User with ID ${updatedBy} does not exist`
        });
      }
    }

    // Check if booking exists and get current details
    const [existingBooking] = await connection.execute(
      `SELECT 
        sb.id, sb.status, sb.bill_number, sb.customer_id, sb.service_type,
        c.name as customer_name, c.mobile as customer_mobile
      FROM service_bookings sb
      JOIN customers c ON sb.customer_id = c.id
      WHERE sb.id = ?`,
      [bookingId]
    );

    if (existingBooking.length === 0) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    const currentBooking = existingBooking[0];
    console.log('Current status:', currentBooking.status);

    // Check if status is actually changing
    if (currentBooking.status === status) {
      return res.status(400).json({
        error: 'Status unchanged',
        details: `Booking is already ${status}`
      });
    }

    // Validate status transitions (business rules)
    const validTransitions = {
      'pending': ['in_progress', 'completed', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': ['pending', 'cancelled'], 
      'cancelled': [] // Cannot change from cancelled
    };

    if (!validTransitions[currentBooking.status].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        details: `Cannot change status from ${currentBooking.status} to ${status}`
      });
    }

    // Start transaction
    await connection.beginTransaction();

    // Update the booking status
    const updateQuery = `
      UPDATE service_bookings 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const [updateResult] = await connection.execute(updateQuery, [status, bookingId]);

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        error: 'Failed to update booking status'
      });
    }

    // Optional: Log status change for audit trail
    // You would need to create this table first
    try {
      await connection.execute(`
        INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, changed_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [bookingId, currentBooking.status, status, updatedBy || null]);
    } catch (logError) {
      // Continue even if logging fails (table might not exist)
      console.warn('Status change logging skipped:', logError.message);
    }

    await connection.commit();
    console.log('Status updated successfully');

    // Return response with booking details
    res.json({
      success: true,
      message: 'Booking status updated successfully',
      bookingId: bookingId,
      billNumber: currentBooking.bill_number,
      statusChange: {
        from: currentBooking.status,
        to: status
      },
      booking: {
        id: currentBooking.id,
        bill_number: currentBooking.bill_number,
        service_type: currentBooking.service_type,
        customer_name: currentBooking.customer_name,
        customer_mobile: currentBooking.customer_mobile,
        old_status: currentBooking.status,
        new_status: status,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Status update failed:', error);
    res.status(500).json({
      error: 'Failed to update booking status',
      details: error.message
    });
  } finally {
    // Always release the connection back to the pool
    connection.release();
  }
};

module.exports = {
  getAllBookings,
  createNewBooking,
  updateBooking,
  deleteBooking,
  updateBookingStatus
}