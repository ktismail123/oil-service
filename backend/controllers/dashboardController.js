const { getDB, dbConfig } = require('../config/db');

const getDashboardData = async (req, res) => {
  try {
    const db = await getDB();
    const { month, year, day, status = 'completed' } = req.query;

    console.log("Dashboard filters received:", { month, year, day, status });

    // Build filter conditions
    let bookingFilters = [];
    let filterValues = [];

    // Date filters
    if (year) {
      bookingFilters.push("YEAR(service_date) = ?");
      filterValues.push(parseInt(year));
    }
    
    if (month) {
      bookingFilters.push("MONTH(service_date) = ?");
      filterValues.push(parseInt(month));
    }
    
    if (day) {
      bookingFilters.push("DAY(service_date) = ?");
      filterValues.push(parseInt(day));
    }

    // Status filter - only add if not empty (empty means all statuses)
    if (status && status.trim() !== '') {
      bookingFilters.push("status = ?");
      filterValues.push(status);
    }

    const whereClause = bookingFilters.length ? `WHERE ${bookingFilters.join(" AND ")}` : "";
    console.log("WHERE clause:", whereClause);
    console.log("Filter values:", filterValues);

    // 1. Summary with status breakdown
    const [summaryResult] = await db.execute(
      `SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(subtotal), 0) as total_subtotal,
        COALESCE(SUM(vat_amount), 0) as total_vat,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings
       FROM service_bookings 
       ${whereClause}`,
      filterValues
    );

    // 2. Service type distribution
    const [serviceTypes] = await db.execute(
      `SELECT 
        service_type,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as revenue,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
       FROM service_bookings 
       ${whereClause}
       GROUP BY service_type
       ORDER BY revenue DESC`,
      filterValues
    );

    // 3. Recent bookings with details
    const [recentBookings] = await db.execute(
      `SELECT 
        sb.id,
        sb.service_type,
        sb.service_date,
        sb.service_time,
        sb.total_amount,
        sb.subtotal,
        sb.status,
        sb.bill_number,
        c.name as customer_name,
        c.mobile as customer_mobile,
        cv.plate_number,
        CONCAT(COALESCE(vb.name, ''), ' ', COALESCE(vm.name, '')) as vehicle_info
       FROM service_bookings sb
       LEFT JOIN customers c ON sb.customer_id = c.id
       LEFT JOIN customer_vehicles cv ON sb.vehicle_id = cv.id
       LEFT JOIN vehicle_brands vb ON cv.brand_id = vb.id
       LEFT JOIN vehicle_models vm ON cv.model_id = vm.id
       ${whereClause}
       ORDER BY sb.created_at DESC
       LIMIT 10`,
      filterValues
    );

    // 4. Monthly revenue trend (last 12 months)
    const [monthlyTrend] = await db.execute(
      `SELECT 
        YEAR(service_date) as year,
        MONTH(service_date) as month,
        COUNT(*) as bookings_count,
        COALESCE(SUM(total_amount), 0) as revenue
       FROM service_bookings 
       WHERE service_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
         AND status = 'completed'
       GROUP BY YEAR(service_date), MONTH(service_date)
       ORDER BY year DESC, month DESC
       LIMIT 12`
    );

    // 5. Daily bookings for current month (if month/year filter applied)
    let dailyBookings = [];
    if (month && year) {
      const [dailyResult] = await db.execute(
        `SELECT 
          DAY(service_date) as day,
          COUNT(*) as bookings_count,
          COALESCE(SUM(total_amount), 0) as revenue,
          COALESCE(SUM(subtotal), 0) as subtotal
         FROM service_bookings 
         WHERE YEAR(service_date) = ? AND MONTH(service_date) = ?
           ${status ? 'AND status = ?' : ''}
         GROUP BY DAY(service_date)
         ORDER BY day ASC`,
        status ? [parseInt(year), parseInt(month), status] : [parseInt(year), parseInt(month)]
      );
      dailyBookings = dailyResult;
    }
console.log(dailyBookings);

    // Response
    res.json({
      success: true,
      data: {
        summary: {
          total_revenue: parseFloat(summaryResult[0].total_revenue || 0),
          total_subtotal: parseFloat(summaryResult[0].total_subtotal || 0),
          total_vat: parseFloat(summaryResult[0].total_vat || 0),
          total_bookings: parseInt(summaryResult[0].total_bookings || 0),
          completed_bookings: parseInt(summaryResult[0].completed_bookings || 0),
          pending_bookings: parseInt(summaryResult[0].pending_bookings || 0),
          cancelled_bookings: parseInt(summaryResult[0].cancelled_bookings || 0)
        },
        service_type_distribution: serviceTypes.map(service => ({
          service_type: service.service_type,
          count: parseInt(service.count),
          revenue: parseFloat(service.revenue),
          completed_count: parseInt(service.completed_count || 0),
          pending_count: parseInt(service.pending_count || 0),
          cancelled_count: parseInt(service.cancelled_count || 0)
        })),
        recent_bookings: recentBookings.map(booking => ({
          id: booking.id,
          service_type: booking.service_type,
          service_date: booking.service_date,
          service_time: booking.service_time,
          total_amount: parseFloat(booking.total_amount),
          subtotal: parseFloat(booking.subtotal),
          status: booking.status,
          bill_number: booking.bill_number,
          customer_name: booking.customer_name || 'N/A',
          customer_mobile: booking.customer_mobile,
          plate_number: booking.plate_number,
          vehicle_info: booking.vehicle_info ? booking.vehicle_info.trim() : 'N/A'
        })),
        monthly_trend: monthlyTrend.map(trend => ({
          year: trend.year,
          month: trend.month,
          bookings_count: parseInt(trend.bookings_count),
          revenue: parseFloat(trend.revenue)
        })),
        daily_bookings: dailyBookings.map(day => ({
          day: day.day,
          bookings_count: parseInt(day.bookings_count),
          revenue: parseFloat(day.revenue),
          subtotal: parseFloat(day.subtotal)
        }))
      },
      filters: { 
        month: month || null, 
        year: year || null, 
        day: day || null,
        status: status || 'all'
      }
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Export function for VAT reports
const exportDashboardData = async (req, res) => {
  try {
    const db = await getDB();
    const { month, year, status = 'completed', format = 'excel' } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        error: 'Month and year are required for export'
      });
    }

    console.log("Export request:", { month, year, status, format });

    // Get detailed data for export
    const [exportData] = await db.execute(
      `SELECT 
        sb.id,
        sb.bill_number,
        sb.service_type,
        sb.service_date,
        sb.service_time,
        sb.subtotal,
        sb.vat_amount,
        sb.total_amount,
        sb.status,
        c.name as customer_name,
        c.mobile as customer_mobile,
        cv.plate_number,
        CONCAT(COALESCE(vb.name, ''), ' ', COALESCE(vm.name, '')) as vehicle_info,
        sb.created_at
       FROM service_bookings sb
       LEFT JOIN customers c ON sb.customer_id = c.id
       LEFT JOIN customer_vehicles cv ON sb.vehicle_id = cv.id
       LEFT JOIN vehicle_brands vb ON cv.brand_id = vb.id
       LEFT JOIN vehicle_models vm ON cv.model_id = vm.id
       WHERE MONTH(sb.service_date) = ? AND YEAR(sb.service_date) = ? 
         ${status ? 'AND sb.status = ?' : ''}
       ORDER BY sb.service_date ASC, sb.created_at ASC`,
      status ? [parseInt(month), parseInt(year), status] : [parseInt(month), parseInt(year)]
    );

    if (format === 'vat_report') {
      // VAT-specific calculations
      const vatSummary = {
        period: `${year}-${month.padStart(2, '0')}`,
        total_sales: exportData.reduce((sum, record) => sum + parseFloat(record.total_amount || 0), 0),
        total_vat: exportData.reduce((sum, record) => sum + parseFloat(record.vat_amount || 0), 0),
        total_before_vat: exportData.reduce((sum, record) => sum + parseFloat(record.subtotal || 0), 0),
        record_count: exportData.length
      };

      return res.json({
        success: true,
        vat_report: {
          summary: vatSummary,
          records: exportData,
          export_date: new Date().toISOString(),
          filters: { month, year, status }
        }
      });
    }

    // Regular export
    res.json({
      success: true,
      export_data: {
        records: exportData,
        summary: {
          total_records: exportData.length,
          total_revenue: exportData.reduce((sum, record) => sum + parseFloat(record.total_amount || 0), 0),
          period: `${year}-${month}`
        },
        export_date: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({
      success: false,
      error: 'Export failed',
      details: error.message
    });
  }
};

module.exports = { 
  getDashboardData,
  exportDashboardData 
};