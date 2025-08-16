const { getDB, dbConfig } = require('../config/db');

const getDashboardData = async (req, res) => {
  try {
    const db = await getDB();
    const { month, year, userId } = req.query;

    // Build basic filter conditions
    let bookingFilters = [];
    let filterValues = [];

    if (month && year) {
      bookingFilters.push("MONTH(service_date) = ? AND YEAR(service_date) = ?");
      filterValues.push(parseInt(month), parseInt(year));
    } else if (year) {
      bookingFilters.push("YEAR(service_date) = ?");
      filterValues.push(parseInt(year));
    }

    if (userId) {
      bookingFilters.push("created_by = ?");
      filterValues.push(parseInt(userId));
    }

    const whereClause = bookingFilters.length ? `WHERE ${bookingFilters.join(" AND ")}` : "";

    console.log("Filters applied:", { month, year, userId });
    console.log("WHERE clause:", whereClause);

    // 1. Get filtered booking stats (direct approach)
    const [summaryResult] = await db.execute(
      `SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(subtotal), 0) as total_revenue
       FROM service_bookings 
       ${whereClause}`,
      filterValues
    );

    // 2. Get all users count (unfiltered)
    const [allUsers] = await db.execute(
      `SELECT COUNT(*) as total_users FROM users`
    );

    // 3. FIXED: Direct user performance query
    let userPerformanceQuery;
    let userPerformanceValues;

    if (userId) {
      // If filtering by specific user, get only that user's data
      userPerformanceQuery = `
        SELECT 
          u.id,
          u.name,
          u.role,
          COALESCE(SUM(sb.subtotal), 0) as revenue,
          COUNT(sb.id) as bookings_count
        FROM users u
        LEFT JOIN service_bookings sb ON u.id = sb.created_by 
          ${whereClause.replace('WHERE', 'AND')}
        WHERE u.id = ?
        GROUP BY u.id, u.name, u.role`;
      userPerformanceValues = [...filterValues, parseInt(userId)];
    } else {
      // If no user filter, show all users with their filtered booking data
      userPerformanceQuery = `
        SELECT 
          u.id,
          u.name,
          u.role,
          COALESCE(SUM(sb.subtotal), 0) as revenue,
          COUNT(sb.id) as bookings_count
        FROM users u
        LEFT JOIN service_bookings sb ON u.id = sb.created_by 
          ${bookingFilters.length ? `AND ${bookingFilters.join(" AND ")}` : ""}
        GROUP BY u.id, u.name, u.role
        ORDER BY revenue DESC`;
      userPerformanceValues = filterValues;
    }

    console.log("User performance query:", userPerformanceQuery);
    const [userStats] = await db.execute(userPerformanceQuery, userPerformanceValues);

    // 4. Service type stats (direct from filtered bookings)
    const [serviceTypes] = await db.execute(
      `SELECT 
        service_type,
        COUNT(*) as count,
        COALESCE(SUM(subtotal), 0) as revenue
       FROM service_bookings 
       ${whereClause}
       GROUP BY service_type`,
      filterValues
    );

    // 5. Oil type stats (direct approach)
    let oilTypeQuery;
    let oilTypeValues;

    if (bookingFilters.length) {
      oilTypeQuery = `
        SELECT 
          ot.id,
          ot.name as oil_type_name,
          COUNT(sb.id) as usage_count,
          COALESCE(SUM(sb.subtotal), 0) as total_revenue
        FROM oil_types ot
        LEFT JOIN service_bookings sb ON ot.id = sb.oil_type_id 
          AND sb.service_type = 'oil_change'
          AND ${bookingFilters.join(" AND ")}
        GROUP BY ot.id, ot.name
        ORDER BY usage_count DESC`;
      oilTypeValues = filterValues;
    } else {
      oilTypeQuery = `
        SELECT 
          ot.id,
          ot.name as oil_type_name,
          COUNT(sb.id) as usage_count,
          COALESCE(SUM(sb.subtotal), 0) as total_revenue
        FROM oil_types ot
        LEFT JOIN service_bookings sb ON ot.id = sb.oil_type_id 
          AND sb.service_type = 'oil_change'
        GROUP BY ot.id, ot.name
        ORDER BY usage_count DESC`;
      oilTypeValues = [];
    }

    const [oilTypes] = await db.execute(oilTypeQuery, oilTypeValues);

    // 6. Recent bookings (direct from filtered bookings)
    const [recentBookings] = await db.execute(
      `SELECT 
        sb.id,
        sb.service_type,
        sb.service_date,
        sb.subtotal,
        c.name as customer_name,
        u.name as created_by_name
       FROM service_bookings sb
       LEFT JOIN customers c ON sb.customer_id = c.id
       LEFT JOIN users u ON sb.created_by = u.id
       ${whereClause}
       ORDER BY sb.created_at DESC
       LIMIT 10`,
      filterValues
    );

    // Calculate metrics
    const activeUsers = userStats.filter(user => user.bookings_count > 0).length;
    const totalRevenue = parseFloat(summaryResult[0].total_revenue);
    const averageRevenuePerActiveUser = activeUsers > 0 ? totalRevenue / activeUsers : 0;

    // Response with clear metrics
    res.json({
      success: true,
      data: {
        summary: {
          total_revenue: totalRevenue,
          total_bookings: parseInt(summaryResult[0].total_bookings),
          total_users_in_system: parseInt(allUsers[0].total_users),
          users_shown: userStats.length, // How many users are shown in the table
          active_users_in_period: activeUsers, // Users with bookings in filtered period
          average_revenue_per_active_user: parseFloat(averageRevenuePerActiveUser.toFixed(2))
        },
        user_performance: userStats.map(user => ({
          id: user.id,
          name: user.name,
          role: user.role,
          revenue: parseFloat(user.revenue),
          bookings_count: parseInt(user.bookings_count)
        })),
        service_type_distribution: serviceTypes.map(service => ({
          service_type: service.service_type,
          count: parseInt(service.count),
          revenue: parseFloat(service.revenue)
        })),
        oil_type_stats: oilTypes.map(oil => ({
          id: oil.id,
          oil_type_name: oil.oil_type_name,
          usage_count: parseInt(oil.usage_count),
          total_revenue: parseFloat(oil.total_revenue)
        })),
        recent_bookings: recentBookings.map(booking => ({
          id: booking.id,
          service_type: booking.service_type,
          service_date: booking.service_date,
          subtotal: parseFloat(booking.subtotal),
          customer_name: booking.customer_name || 'N/A',
          created_by_name: booking.created_by_name || 'N/A'
        }))
      },
      filters: { month, year, userId },
      explanation: {
        total_bookings: "Total bookings matching the applied filters",
        total_revenue: "Total revenue from bookings matching the applied filters",
        user_performance: userId ? "Performance data for the selected user only" : "Performance data for all users with filtered booking data"
      }
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = { getDashboardData };