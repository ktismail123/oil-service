const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '_kt_root_',
  database: 'car_garage_db'
};

let db;

async function initDB() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

// API Routes

// 1. Get all vehicle brands
app.get('/api/brands', async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM vehicle_brands ORDER BY name');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// POST new brand
app.post('/api/brands', async (req, res) => {
  try {
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

    const connection = await mysql.createConnection(dbConfig);

    // Check if brand already exists (case-insensitive)
    const [existing] = await connection.execute(
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
    const [result] = await connection.execute(
      'INSERT INTO vehicle_brands (name) VALUES (?)',
      [trimmedName]
    );

    // Get the newly created brand
    const [newBrand] = await connection.execute(
      'SELECT * FROM vehicle_brands WHERE id = ?',
      [result.insertId]
    );

    await connection.end();

    res.status(201).json({
      message: 'Brand created successfully',
      brand: newBrand[0]
    });

  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ error: 'Failed to create brand' });
  }
});


// 2. Get models by brand ID
app.get('/api/models/:brandId', async (req, res) => {
  try {
    const [results] = await db.execute(
      'SELECT * FROM vehicle_models WHERE brand_id = ? ORDER BY name',
      [req.params.brandId]
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// 3. Get oil types
app.get('/api/oil-types', async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM oil_types ORDER BY grade');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch oil types' });
  }
});

// 4. Get oil filters
app.get('/api/oil-filters', async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM oil_filters ORDER BY code');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch oil filters' });
  }
});

// 5. Get battery types
app.get('/api/battery-types', async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM battery_types ORDER BY capacity, brand');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch battery types' });
  }
});

// 6. Get accessories by category
app.get('/api/accessories', async (req, res) => {
  try {
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
});

// 7. Check if customer exists (by mobile or plate number)
app.get('/api/customer/check', async (req, res) => {
  try {
    const { mobile, plate } = req.query;
    
    let query = `
      SELECT c.*, cv.id as vehicle_id, cv.plate_number, 
             vb.name as brand_name, vm.name as model_name
      FROM customers c
      LEFT JOIN customer_vehicles cv ON c.id = cv.customer_id
      LEFT JOIN vehicle_brands vb ON cv.brand_id = vb.id
      LEFT JOIN vehicle_models vm ON cv.model_id = vm.id
      WHERE 1=1
    `;
    let params = [];
    
    if (mobile) {
      query += ' AND c.mobile = ?';
      params.push(mobile);
    }
    
    if (plate) {
      query += ' AND cv.plate_number = ?';
      params.push(plate);
    }
    
    const [results] = await db.execute(query, params);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check customer' });
  }
});

// 8. Get customer service history
app.get('/api/customer/:customerId/history', async (req, res) => {
  try {
    const [results] = await db.execute(`
      SELECT sb.*, vb.name as brand_name, vm.name as model_name, cv.plate_number,
             ot.grade as oil_grade, of.code as filter_code, bt.capacity as battery_capacity
      FROM service_bookings sb
      JOIN customer_vehicles cv ON sb.vehicle_id = cv.id
      JOIN vehicle_brands vb ON cv.brand_id = vb.id
      JOIN vehicle_models vm ON cv.model_id = vm.id
      LEFT JOIN oil_types ot ON sb.oil_type_id = ot.id
      LEFT JOIN oil_filters of ON sb.oil_filter_id = of.id
      LEFT JOIN battery_types bt ON sb.battery_type_id = bt.id
      WHERE sb.customer_id = ?
      ORDER BY sb.service_date DESC, sb.service_time DESC
    `, [req.params.customerId]);
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service history' });
  }
});

// 9. Create new service booking
app.post('/api/bookings', async (req, res) => {
  try {
    const {
      customer, vehicle, service, accessories = []
    } = req.body;
    
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
    const vatPercentage = 15.00; // Get from settings
    const subtotal = parseFloat(service.subtotal);
    const vatAmount = (subtotal * vatPercentage) / 100;
    const totalAmount = subtotal + vatAmount;
    
    // Insert service booking
    const [bookingResult] = await db.execute(`
      INSERT INTO service_bookings (
        customer_id, vehicle_id, service_type, service_date, service_time,
        service_interval, oil_type_id, oil_quantity, oil_filter_id, battery_type_id,
        subtotal, vat_percentage, vat_amount, total_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customerId, vehicleId, service.type, service.date, service.time,
      service.interval || null, service.oilTypeId || null, service.oilQuantity || null,
      service.oilFilterId || null, service.batteryTypeId || null,
      service.subtotal, vatPercentage, vatAmount, totalAmount
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
});

// 10. Get system settings
app.get('/api/settings', async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM system_settings');
    const settings = {};
    results.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get all bookings - BASIC VERSION
app.get('/api/bookings', async (req, res) => {
  try {
    console.log('Fetching all bookings...');

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
});


// Initialize database and start server
initDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = app;