// routes/export.js
const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

//Admin - data export

// Helper function to get month name
function getMonthName(monthNumber) {  
  if (!monthNumber || monthNumber < 1 || monthNumber > 12) {
    return 'Unknown';
  }
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
  ];
  return months[monthNumber - 1] || 'Unknown';
}

// to get available years from database
router.get('/available-years', async (req, res) => {
  try {
    console.log('📅 Getting available years from database...');
    
    // Query to get distinct years from all relevant tables
    const query = `
      SELECT DISTINCT YEAR(updated_at) as year 
      FROM posts
      WHERE YEAR(updated_at) IS NOT NULL
      
      UNION
      
      SELECT DISTINCT YEAR(updatedAt) as year 
      FROM recipe
      WHERE YEAR(updatedAt) IS NOT NULL
      
      UNION
      
      SELECT DISTINCT YEAR(updatedAt) as year 
      FROM food
      WHERE YEAR(updatedAt) IS NOT NULL
      
      ORDER BY year DESC
    `;
    
    const [yearsResult] = await db.execute(query);
    
    const years = yearsResult.map(row => row.year).filter(year => year);
    
    console.log('📅 Available years from database:', years);
    
    res.json({ 
      success: true, 
      years 
    });
    
  } catch (error) {
    console.error('Error getting available years:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get available years',
      message: error.message 
    });
  }
});

// to get available months for a specific year
router.get('/available-months', async (req, res) => {
  try {
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({ 
        success: false, 
        error: 'Year parameter is required' 
      });
    }
    
    console.log(`📅 Getting available months for year ${year}...`);
    
    const query = `
      SELECT DISTINCT MONTH(updated_at) as month 
      FROM posts
      WHERE YEAR(updated_at) = ?
        AND MONTH(updated_at) IS NOT NULL
      
      UNION
      
      SELECT DISTINCT MONTH(updatedAt) as month 
      FROM recipe
      WHERE YEAR(updatedAt) = ?
        AND MONTH(updatedAt) IS NOT NULL
      
      UNION
      
      SELECT DISTINCT MONTH(updatedAt) as month 
      FROM food
      WHERE YEAR(updatedAt) = ?
        AND MONTH(updatedAt) IS NOT NULL
      
      ORDER BY month ASC
    `;
    
    const [monthsResult] = await db.execute(query, [year, year, year]);
    
    const months = monthsResult.map(row => row.month).filter(month => month);
    
    console.log(`📅 Available months for year ${year}:`, months);
    
    res.json({ 
      success: true, 
      months 
    });
    
  } catch (error) {
    console.error('Error getting available months:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get available months',
      message: error.message 
    });
  }
});

// 1. FOOD DATABASE CSV EXPORT
router.get('/food-csv', async (req, res) => {
  try {
    const query = `
      SELECT 
        f.foodID,
        f.name as foodName,
        f.category,
        f.origin,
        f.description,
        r.servings,
        f.difficulty,
        f.Energy_kcal,
        f.Protein_g,
        f.Fat_g,
        f.Carbohydrates_g,
        f.Fiber_g,
        DATE_FORMAT(f.updatedAt, '%Y-%m-%d %H:%i:%s') as updatedAt,
        GROUP_CONCAT(DISTINCT CONCAT(u.firstname, ' ', u.lastname)) as contributors
      FROM food f
      LEFT JOIN recipe r ON f.foodID = r.foodID
      LEFT JOIN userProfile up ON r.userProfileID = up.userProfileID
      LEFT JOIN user u ON up.userID = u.userID
      GROUP BY f.foodID, f.name, f.category, f.origin, f.description, f.Energy_kcal, f.Protein_g, f.Fat_g, f.Carbohydrates_g, f.Fiber_g,
               r.servings, f.difficulty, f.updatedAt
      ORDER BY f.updatedAt DESC
    `;
    
    const [foodItems] = await db.execute(query);
    
    // Convert to CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(foodItems);
    
    // Set headers for download
    res.header('Content-Type', 'text/csv');
    res.attachment(`food-database-${Date.now()}.csv`);
    res.send(csv);
    
  } catch (error) {
    console.error('Food CSV export error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export food database',
      message: error.message 
    });
  }
});

// 2. ANALYTICS REPORT EXPORT (Excel/PDF)
router.get('/analytics-report', async (req, res) => {
  console.log('📊 ANALYTICS EXPORT STARTED ========================');
  console.log('Query params:', req.query);
  console.log('Format:', req.query.format);
  console.log('Year:', req.query.year);
  console.log('Month:', req.query.month);
  console.log('StartDate:', req.query.startDate);
  console.log('EndDate:', req.query.endDate);

  try {
    const format = req.query.format || 'excel'; // 'excel' or 'pdf'
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month) : null;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;

    // Helper function to build WHERE clause
    const buildWhereClause = (tableAlias = '', dateColumn = 'updated_at') => {
      let whereClause = '';
      let params = [];
      
      if (month) {
        // Specific month of a year
        whereClause = `AND MONTH(${tableAlias ? tableAlias + '.' : ''}${dateColumn}) = ? AND YEAR(${tableAlias ? tableAlias + '.' : ''}${dateColumn}) = ?`;
        params = [month, year];
      } else if (startDate && endDate) {
        // Custom date range
        whereClause = `AND DATE(${tableAlias ? tableAlias + '.' : ''}${dateColumn}) BETWEEN ? AND ?`;
        params = [startDate, endDate];
      } else {
        // Full year (default)
        whereClause = `AND YEAR(${tableAlias ? tableAlias + '.' : ''}${dateColumn}) = ?`;
        params = [year];
      }
      
      return { whereClause, params };
    };

    // Build WHERE clauses for different tables
    const recipeWhere = buildWhereClause('r', 'updatedAt');
    const postWhere = buildWhereClause('p', 'updated_at');
    const foodWhere = buildWhereClause('f', 'updatedAt');

    // Get metrics data
    const [totalRecipesResult] = await db.execute(`
      SELECT COUNT(*) as count FROM recipe r 
      WHERE r.status = 'Approved'
      ${recipeWhere.whereClause}
    `, recipeWhere.params);

    const [totalStoriesResult] = await db.execute(`
      SELECT COUNT(*) as count FROM posts p 
      WHERE p.status = 'Approved'
      ${postWhere.whereClause}
    `, postWhere.params);
    
    const [pendingRecipesResult] = await db.execute(`
      SELECT COUNT(*) as count FROM recipe r 
      WHERE r.status = 'Pending'
      ${recipeWhere.whereClause}
    `, recipeWhere.params);

    const [pendingStoriesResult] = await db.execute(`
      SELECT COUNT(*) as count FROM posts p 
      WHERE p.status = 'Pending'
      ${postWhere.whereClause}
    `, postWhere.params);

    // Get cultural origin data WITH date filter
    const [culturalOriginResult] = await db.execute(`
      SELECT f.origin as name, COUNT(f.foodID) as count
      FROM food f
      WHERE f.origin IS NOT NULL AND f.origin != ''
      ${foodWhere.whereClause}
      GROUP BY f.origin
      ORDER BY count DESC
    `, foodWhere.params);

    // Get popular categories WITH date filter
    const [categoriesResult] = await db.execute(`
      SELECT f.category as name, COUNT(f.foodID) as submissions
      FROM food f
      WHERE f.category IS NOT NULL AND f.category != ''
      ${foodWhere.whereClause}
      GROUP BY f.category
      ORDER BY submissions DESC
    `, foodWhere.params);

    // Get monthly data WITH date filter
    let monthlyQuery;
    let monthlyParams;
    
    if (startDate && endDate) {
      // Custom date range
      monthlyQuery = `
        SELECT 
          'Posts' as type,
          status,
          MONTH(updated_at) as month,
          COUNT(*) as count
        FROM posts 
        WHERE DATE(updated_at) BETWEEN ? AND ?
        GROUP BY MONTH(updated_at), status
        
        UNION ALL
        
        SELECT 
          'Recipes' as type,
          status,
          MONTH(updatedAt) as month,
          COUNT(*) as count
        FROM recipe 
        WHERE DATE(updatedAt) BETWEEN ? AND ?
        GROUP BY MONTH(updatedAt), status
        
        ORDER BY month, type, status
      `;
      monthlyParams = [startDate, endDate, startDate, endDate];
    } else if (month) {
      // Specific month
      monthlyQuery = `
        SELECT 
          'Posts' as type,
          status,
          ${month} as month,
          COUNT(*) as count
        FROM posts 
        WHERE YEAR(updated_at) = ? AND MONTH(updated_at) = ?
        GROUP BY status
        
        UNION ALL
        
        SELECT 
          'Recipes' as type,
          status,
          ${month} as month,
          COUNT(*) as count
        FROM recipe 
        WHERE YEAR(updatedAt) = ? AND MONTH(updatedAt) = ?
        GROUP BY status
        
        ORDER BY type, status
      `;
      monthlyParams = [year, month, year, month];
    } else {
      // Full year
      monthlyQuery = `
        SELECT 
          'Posts' as type,
          status,
          MONTH(updated_at) as month,
          COUNT(*) as count
        FROM posts 
        WHERE YEAR(updated_at) = ?
        GROUP BY MONTH(updated_at), status
        
        UNION ALL
        
        SELECT 
          'Recipes' as type,
          status,
          MONTH(updatedAt) as month,
          COUNT(*) as count
        FROM recipe 
        WHERE YEAR(updatedAt) = ?
        GROUP BY MONTH(updatedAt), status
        
        ORDER BY month, type, status
      `;
      monthlyParams = [year, year];
    }

    const [monthlyResult] = await db.execute(monthlyQuery, monthlyParams);

    // Get top contributors WITH date filter
    let contributorQuery;
    let contributorParams;
    
    if (startDate && endDate) {
      contributorQuery = `
        SELECT 
          u.firstname,
          u.lastname,
          u.email,
          up.userProfileID,
          COUNT(DISTINCT r.recipeID) as recipes,
          COUNT(DISTINCT p.postID) as stories,
          (COUNT(DISTINCT r.recipeID) + COUNT(DISTINCT p.postID)) as total
        FROM user u
        INNER JOIN userProfile up ON u.userID = up.userID
        LEFT JOIN recipe r ON up.userProfileID = r.userProfileID 
          AND r.status = 'Approved'
          AND DATE(r.updatedAt) BETWEEN ? AND ?
        LEFT JOIN posts p ON up.userProfileID = p.userProfileID 
          AND p.status = 'Approved'
          AND DATE(p.updated_at) BETWEEN ? AND ?
        GROUP BY u.userID, u.firstname, u.lastname, u.email, up.userProfileID
        HAVING total > 0
        ORDER BY total DESC
        LIMIT 10
      `;
      contributorParams = [startDate, endDate, startDate, endDate];
    } else if (month) {
      contributorQuery = `
        SELECT 
          u.firstname,
          u.lastname,
          u.email,
          up.userProfileID,
          COUNT(DISTINCT r.recipeID) as recipes,
          COUNT(DISTINCT p.postID) as stories,
          (COUNT(DISTINCT r.recipeID) + COUNT(DISTINCT p.postID)) as total
        FROM user u
        INNER JOIN userProfile up ON u.userID = up.userID
        LEFT JOIN recipe r ON up.userProfileID = r.userProfileID 
          AND r.status = 'Approved'
          AND YEAR(r.updatedAt) = ? 
          AND MONTH(r.updatedAt) = ?
        LEFT JOIN posts p ON up.userProfileID = p.userProfileID 
          AND p.status = 'Approved'
          AND YEAR(p.updated_at) = ? 
          AND MONTH(p.updated_at) = ?
        GROUP BY u.userID, u.firstname, u.lastname, u.email, up.userProfileID
        HAVING total > 0
        ORDER BY total DESC
        LIMIT 10
      `;
      contributorParams = [year, month, year, month];
    } else {
      contributorQuery = `
        SELECT 
          u.firstname,
          u.lastname,
          u.email,
          up.userProfileID,
          COUNT(DISTINCT r.recipeID) as recipes,
          COUNT(DISTINCT p.postID) as stories,
          (COUNT(DISTINCT r.recipeID) + COUNT(DISTINCT p.postID)) as total
        FROM user u
        INNER JOIN userProfile up ON u.userID = up.userID
        LEFT JOIN recipe r ON up.userProfileID = r.userProfileID 
          AND r.status = 'Approved'
          AND YEAR(r.updatedAt) = ?
        LEFT JOIN posts p ON up.userProfileID = p.userProfileID 
          AND p.status = 'Approved'
          AND YEAR(p.updated_at) = ?
        GROUP BY u.userID, u.firstname, u.lastname, u.email, up.userProfileID
        HAVING total > 0
        ORDER BY total DESC
        LIMIT 10
      `;
      contributorParams = [year, year];
    }

    const [contributorsResult] = await db.execute(contributorQuery, contributorParams);

    // Format period display
    let period = '';
    if (month) {
      const monthName = getMonthName(month);
      period = `${monthName} ${year}`;
    } else if (startDate && endDate) {
      // Format dates nicely
      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-MY', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      };
      period = `${formatDate(startDate)} to ${formatDate(endDate)}`;
    } else {
      period = `Year ${year}`;
    }

    // Format monthly data properly
    const monthlyData = {};
    monthlyResult.forEach(row => {
      const monthName = getMonthName(row.month);
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = { 
          month: monthName, 
          posts: { Approved: 0, Pending: 0, Rejected: 0 },
          recipes: { Approved: 0, Pending: 0, Rejected: 0 }
        };
      }
      
      if (row.type === 'Posts') {
        monthlyData[monthName].posts[row.status] = row.count;
      } else {
        monthlyData[monthName].recipes[row.status] = row.count;
      }
    });

    const analyticsData = {
      reportInfo: {
        title: "SarawakEats Analytics Report",
        generated: new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuching' }),
        period: period,
        filters: {
          year: year,
          month: month,
          startDate: startDate,
          endDate: endDate
        }
      },
      summary: {
        totalRecipes: totalRecipesResult[0]?.count || 0,
        totalStories: totalStoriesResult[0]?.count || 0,
        pendingRecipes: pendingRecipesResult[0]?.count || 0,
        pendingStories: pendingStoriesResult[0]?.count || 0,
        totalContent: (totalRecipesResult[0]?.count || 0) + (totalStoriesResult[0]?.count || 0)
      },
      culturalOrigins: culturalOriginResult.map(row => ({
        origin: row.name,
        count: row.count
      })),
      categories: categoriesResult.map(row => ({
        category: row.name,
        submissions: row.submissions
      })),
      monthlyData: monthlyData,
      topContributors: contributorsResult.map(row => ({
        name: `${row.firstname} ${row.lastname}`,
        email: row.email,
        recipes: row.recipes,
        stories: row.stories,
        totalContributions: row.total
      }))
    };

    // Export based on requested format
    if (format.toLowerCase() === 'pdf') {
      return exportAsPDF(res, analyticsData, period);
    } else {
      return exportAsExcel(res, analyticsData, period);
    }

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export analytics report',
      message: error.message 
    });
  }
});

// Excel Export Function
async function exportAsExcel(res, data, period) {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Add metadata
    workbook.creator = 'SarawakEats Admin';
    workbook.created = new Date();
    workbook.properties.date1904 = true;
    
    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];
    
    // Add report header
    summarySheet.addRow({ metric: 'SarawakEats Analytics Report', value: '' });
    summarySheet.addRow({ metric: 'Period', value: period });
    summarySheet.addRow({ metric: 'Generated On', value: data.reportInfo.generated });
    summarySheet.addRow({ metric: '', value: '' }); // Empty row
    
    // Add summary data
    summarySheet.addRows([
      { metric: 'Total Approved Recipes', value: data.summary.totalRecipes },
      { metric: 'Total Approved Stories', value: data.summary.totalStories },
      { metric: 'Pending Recipes', value: data.summary.pendingRecipes },
      { metric: 'Pending Stories', value: data.summary.pendingStories },
      { metric: 'Total Content Items', value: data.summary.totalContent }
    ]);
    
    // Style the header row
    summarySheet.getRow(1).font = { bold: true, size: 14 };
    summarySheet.getRow(1).alignment = { horizontal: 'center' };
    summarySheet.mergeCells('A1:B1');
    
    // Sheet 2: Cultural Origins
    if (data.culturalOrigins.length > 0) {
      const originsSheet = workbook.addWorksheet('Cultural Origins');
      originsSheet.columns = [
        { header: 'Cultural Origin', key: 'origin', width: 30 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 }
      ];
      
      const originTotal = data.culturalOrigins.reduce((sum, item) => sum + item.count, 0);
      data.culturalOrigins.forEach(item => {
        const percentage = originTotal > 0 ? ((item.count / originTotal) * 100).toFixed(2) : '0.00';
        originsSheet.addRow({
          origin: item.origin,
          count: item.count,
          percentage: `${percentage}%`
        });
      });
    }
    
    // Sheet 3: Categories
    if (data.categories.length > 0) {
      const categoriesSheet = workbook.addWorksheet('Categories');
      categoriesSheet.columns = [
        { header: 'Category', key: 'category', width: 30 },
        { header: 'Submissions', key: 'submissions', width: 15 }
      ];
      
      data.categories.forEach(item => {
        categoriesSheet.addRow({
          category: item.category,
          submissions: item.submissions
        });
      });
    }
    
    // Sheet 4: Monthly Data
    if (Object.keys(data.monthlyData).length > 0) {
      const monthlySheet = workbook.addWorksheet('Monthly Data');
      monthlySheet.columns = [
        { header: 'Month', key: 'month', width: 15 },
        { header: 'Posts Approved', key: 'posts_approved', width: 15 },
        { header: 'Posts Pending', key: 'posts_pending', width: 15 },
        { header: 'Posts Rejected', key: 'posts_rejected', width: 15 },
        { header: 'Recipes Approved', key: 'recipes_approved', width: 15 },
        { header: 'Recipes Pending', key: 'recipes_pending', width: 15 },
        { header: 'Recipes Rejected', key: 'recipes_rejected', width: 15 },
        { header: 'Total', key: 'total', width: 15 }
      ];
      
      Object.values(data.monthlyData).forEach(month => {
        const total = 
          (month.posts.Approved || 0) + (month.posts.Pending || 0) + (month.posts.Rejected || 0) +
          (month.recipes.Approved || 0) + (month.recipes.Pending || 0) + (month.recipes.Rejected || 0);
        
        monthlySheet.addRow({
          month: month.month,
          posts_approved: month.posts.Approved || 0,
          posts_pending: month.posts.Pending || 0,
          posts_rejected: month.posts.Rejected || 0,
          recipes_approved: month.recipes.Approved || 0,
          recipes_pending: month.recipes.Pending || 0,
          recipes_rejected: month.recipes.Rejected || 0,
          total: total
        });
      });
    }
    
    // Sheet 5: Top Contributors
    if (data.topContributors.length > 0) {
      const contributorsSheet = workbook.addWorksheet('Top Contributors');
      contributorsSheet.columns = [
        { header: 'Rank', key: 'rank', width: 10 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Recipes', key: 'recipes', width: 15 },
        { header: 'Stories', key: 'stories', width: 15 },
        { header: 'Total', key: 'total', width: 15 }
      ];
      
      data.topContributors.forEach((contributor, index) => {
        contributorsSheet.addRow({
          rank: index + 1,
          name: contributor.name,
          email: contributor.email,
          recipes: contributor.recipes,
          stories: contributor.stories,
          total: contributor.totalContributions
        });
      });
    }
    
    // Style all headers
    workbook.eachSheet((sheet) => {
      if (sheet.rowCount > 0) {
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }
    });
    
    // Write to buffer and send
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create filename with period
    const safePeriod = period.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `sarawakeats-analytics-${safePeriod}-${Date.now()}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
    
  } catch (error) {
    throw error;
  }
}

// PDF Export Function
async function exportAsPDF(res, data, period) {
  try {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    // Create filename with period
    const safePeriod = period.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `sarawakeats-analytics-${safePeriod}-${Date.now()}.pdf`;
    
    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Title
    doc.fontSize(24).text('SarawakEats Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Period: ${period}`, { align: 'center' });
    doc.fontSize(10).text(`Generated: ${data.reportInfo.generated}`, { align: 'center' });
    doc.moveDown(2);
    
    // 1. Summary Section
    doc.fontSize(16).text('1. Summary', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(12);
    doc.text(`Total Approved Recipes: ${data.summary.totalRecipes}`);
    doc.text(`Total Approved Stories: ${data.summary.totalStories}`);
    doc.text(`Pending Recipes: ${data.summary.pendingRecipes}`);
    doc.text(`Pending Stories: ${data.summary.pendingStories}`);
    doc.text(`Total Content Items: ${data.summary.totalContent}`);
    doc.moveDown(2);
    
    // 2. Cultural Origins
    if (data.culturalOrigins.length > 0) {
      doc.fontSize(16).text('2. Cultural Origins Distribution', { underline: true });
      doc.moveDown(0.5);
      
      data.culturalOrigins.forEach((item, index) => {
        doc.fontSize(12);
        const total = data.culturalOrigins.reduce((sum, i) => sum + i.count, 0);
        const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
        doc.text(`${index + 1}. ${item.origin}: ${item.count} items (${percentage}%)`);
      });
      doc.moveDown(2);
    }
    
    // 3. Top Categories
    if (data.categories.length > 0) {
      doc.fontSize(16).text('3. Popular Food Categories', { underline: true });
      doc.moveDown(0.5);
      
      data.categories.slice(0, 10).forEach((item, index) => {
        doc.fontSize(12);
        doc.text(`${index + 1}. ${item.category}: ${item.submissions} submissions`);
      });
      doc.moveDown(2);
    }
    
    // 4. Monthly Overview Table
    if (Object.keys(data.monthlyData).length > 0) {
      doc.fontSize(16).text('4. Monthly Contributions Overview', { underline: true });
      doc.moveDown(0.5);

      // Table header
      doc.fontSize(12);
      const startX = 50;
      const colWidths = [80, 100, 100];
      const rowHeight = 25;
      let currentY = doc.y;

      const monthlyDataArray = Object.values(data.monthlyData);

      // Draw complete table
      const tableWidth = colWidths[0] + colWidths[1] + colWidths[2];
      const totalRows = monthlyDataArray.length + 1;
      const tableHeight = totalRows * rowHeight;

      // Draw all borders at once
      doc.lineWidth(0.5);
      doc.strokeColor('#333333');

      // Outer border
      doc.rect(startX, currentY, tableWidth, tableHeight).stroke();

      // Vertical lines
      let x = startX;
      doc.moveTo(x + colWidths[0], currentY).lineTo(x + colWidths[0], currentY + tableHeight).stroke();
      doc.moveTo(x + colWidths[0] + colWidths[1], currentY).lineTo(x + colWidths[0] + colWidths[1], currentY + tableHeight).stroke();

      // Header row - Center align the headers
      currentY += 5;
      doc.text('Month', startX + colWidths[0]/2 - 10, currentY);
      doc.text('Posts', startX + colWidths[0] + colWidths[1]/2 - 10, currentY);
      doc.text('Recipes', startX + colWidths[0] + colWidths[1] + colWidths[2]/2 - 15, currentY);

      currentY += rowHeight - 10;

      // Horizontal line after header
      doc.moveTo(startX, currentY).lineTo(startX + tableWidth, currentY).stroke();

      // Data rows
      monthlyDataArray.forEach((month, index) => {
          currentY += 5;
          
          // Month column - left aligned
          doc.text(month.month, startX + 5, currentY);
          
          // Posts column - center the number
          const postsTotal = (month.posts.Approved || 0) + (month.posts.Pending || 0) + (month.posts.Rejected || 0);
          const postsX = startX + colWidths[0] + colWidths[1]/2 - 5;
          doc.text(postsTotal.toString(), postsX, currentY);
          
          // Recipes column - center the number
          const recipesTotal = (month.recipes.Approved || 0) + (month.recipes.Pending || 0) + (month.recipes.Rejected || 0);
          const recipesX = startX + colWidths[0] + colWidths[1] + colWidths[2]/2 - 5;
          doc.text(recipesTotal.toString(), recipesX, currentY);
          
          currentY += rowHeight - 10;
          
          // Draw horizontal line after each row (except last)
          if (index < monthlyDataArray.length - 1) {
              doc.moveTo(startX, currentY).lineTo(startX + tableWidth, currentY).stroke();
          }
      });

      doc.moveDown(2);
    }
    
    // 5. Top Contributors
    const leftMargin = 50;
    if (data.topContributors.length > 0) {
      doc.fontSize(16).text('5. Top Contributors', leftMargin, doc.y, { 
      underline: true 
      });
      doc.moveDown(0.5);

      data.topContributors.forEach((contributor, index) => {
        doc.fontSize(12);
        doc.text(`${index + 1}. ${contributor.name} (${contributor.email})`);
        doc.moveDown(0.3);
        doc.text(`   Recipes: ${contributor.recipes}, Stories: ${contributor.stories}, Total: ${contributor.totalContributions}`);
        doc.moveDown(0.5);
      });
      doc.moveDown(2);
    }
    
    // Footer
    doc.fontSize(10).text('--- End of Report ---', { align: 'center' });
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    throw error;
  }
}

//User - data export (saved foods)

// ✅ Export Saved Foods Endpoint
router.post('/export/saved-foods', async (req, res) => {
  let connection;
  
  try {
    console.log('='.repeat(60));
    console.log('🚨 EXPORT ROUTE HIT!');
    console.log('🚨 Request method:', req.method);
    console.log('🚨 Request URL:', req.url);
    console.log('🚨 Request path:', req.path);
    console.log('🚨 Request originalUrl:', req.originalUrl);
    console.log('🚨 Request headers:', req.headers['content-type']);
    console.log('🚨 Request body RAW:', req.body);
    console.log('🚨 Request body TYPE:', typeof req.body);
    
    // Try to manually parse body if it's a string
    if (typeof req.body === 'string') {
      console.log('🚨 Body is string, attempting manual parse...');
      try {
        req.body = JSON.parse(req.body);
        console.log('🚨 Manually parsed body:', req.body);
      } catch (e) {
        console.log('🚨 Failed to parse:', e.message);
      }
    }
    
    console.log('🚨 Session user:', req.session?.user);
    console.log('='.repeat(60));
    
    connection = await db.getConnection();
    
    const userId = req.session.user.userID;
    const { saveIds, dataTypes = [] } = req.body;
    
    console.log('📥 Export request processed:', { 
      userId, 
      saveIds,
      saveIdsType: typeof saveIds,
      saveIdsIsArray: Array.isArray(saveIds),
      saveIdsLength: saveIds?.length || 0
    });

    const exportType = saveIds && Array.isArray(saveIds) && saveIds.length > 0 
      ? "selected" 
      : "all";
    
    console.log('📊 Export type:', exportType);

    // Step 1: Get userProfileID from userID
    const [userProfileRows] = await connection.execute(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userId]
    );
    
    if (!userProfileRows || userProfileRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User profile not found' 
      });
    }
    
    const userProfileID = userProfileRows[0].userProfileID;
    console.log('📊 UserProfileID:', userProfileID);

    if (!dataTypes || dataTypes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data types selected for export'
      });
    }

    // Step 2: Fetch profile information (only if selected)
    let profileData = null;
    if (dataTypes.includes('profile')) {
      const [profileRows] = await connection.execute(`
        SELECT u.firstname, u.lastname, u.email, u.role,
              u.status, u.lastLogin, u.consent_date,
              up.bio, up.location, up.dietaryPreference, up.allergies, up.language
        FROM user u
        JOIN userProfile up ON u.userID = up.userID
        WHERE u.userID = ?
      `, [userId]);
      profileData = profileRows[0] || null;
    }

    // Step 3: Fetch user's recipes (only if selected)
    let myRecipes = [];
    if (dataTypes.includes('recipes')) {
      const [recipeRows] = await connection.execute(`
        SELECT r.recipeID, r.ingredients, r.steps, r.cookTime, r.servings,
              r.DidYouKnow, r.chefTips, r.status, r.createdAt,
              f.name as foodName, f.origin, f.category
        FROM recipe r
        JOIN food f ON r.foodID = f.foodID
        WHERE r.userProfileID = ?
        ORDER BY r.createdAt DESC
      `, [userProfileID]);
      myRecipes = recipeRows;
    }

    // Step 4: Fetch user's community posts (only if selected)
    let myPosts = [];
    if (dataTypes.includes('posts')) {
      const [postRows] = await connection.execute(`
        SELECT postID, foodName, origin, culturalStory, status, created_at
        FROM posts
        WHERE userProfileID = ?
        ORDER BY created_at DESC
      `, [userProfileID]);
      myPosts = postRows;
    }

    // Step 5: Fetch user's liked posts (only if selected)
    let likedPosts = [];
    if (dataTypes.includes('likedPosts')) {
      const [likedRows] = await connection.execute(`
        SELECT p.postID, p.foodName, p.origin, p.culturalStory, p.created_at
        FROM likes l
        JOIN posts p ON l.postID = p.postID
        WHERE l.userProfileID = ?
        ORDER BY p.created_at DESC
      `, [userProfileID]);
      likedPosts = likedRows;
    }
    
    // Step 6: Get saved food IDs based on export type (only if selected)
    let savedFoods = [];
    if (dataTypes.includes('savedFoods')) {
      let savedFoodsQuery = `
        SELECT sf.saveID, f.foodID as id, sf.recipeID, f.name, f.origin, sf.createdAt as savedDate
        FROM saveFood sf
        JOIN food f ON sf.foodID = f.foodID
        WHERE sf.userProfileID = ?
      `;
      
      const queryParams = [userProfileID];
      
      if (saveIds && Array.isArray(saveIds) && saveIds.length > 0) {
        // Export only selected foods
        const placeholders = saveIds.map(() => '?').join(',');
        savedFoodsQuery += ` AND sf.saveID IN (${placeholders})`;
        queryParams.push(...saveIds);
      }
      
      savedFoodsQuery += ' ORDER BY sf.createdAt DESC';
      
      [savedFoods] = await connection.execute(savedFoodsQuery, queryParams);
    }
    
    // Step 7: Fetch complete food details for each saved food
    const foodIdsToFetch = savedFoods.map(sf => sf.id).filter(id => id);
    const recipeIdsToFetch = savedFoods.map(sf => sf.recipeID).filter(id => id);

    console.log('🔍 Food IDs to fetch:', foodIdsToFetch);
    console.log('🔍 Recipe IDs to fetch:', recipeIdsToFetch);
    
    let foodsData = [];
    let recipesData = [];
    
    if (foodIdsToFetch.length > 0) {
      const foodPlaceholders = foodIdsToFetch.map(() => '?').join(',');
      const [foodRows] = await connection.execute(`
        SELECT 
          f.foodID,
          f.name,
          f.origin,
          f.category,
          f.difficulty,
          f.dietaryTags,
          f.description,
          f.image,
          f.prepTime,
          f.culturalSignificance,
          f.traditionalPreparation,
          f.commonIngredients,
          f.alternative,
          f.altDescription,
          f.healthTips,
          f.Energy_kcal,
          f.Protein_g,
          f.Fat_g,
          f.Carbohydrates_g,
          f.Fiber_g,
          f.VitaminC_mg,
          f.likes_count
        FROM food f
        WHERE f.foodID IN (${foodPlaceholders})
      `, foodIdsToFetch);
      
      foodsData = foodRows;
    }
    
    if (recipeIdsToFetch.length > 0) {
      const recipePlaceholders = recipeIdsToFetch.map(() => '?').join(',');
      const [recipeRows] = await connection.execute(`
        SELECT 
          r.recipeID,
          r.foodID,
          r.ingredients,
          r.steps,
          r.cookTime,
          r.servings,
          r.DidYouKnow,
          r.chefTips,
          r.updatedAt as recipeUpdatedAt,
          r.admin_feedback,
          r.status,
          up.userProfileID,
          u.firstname,
          u.lastname,
          up.location,
          up.bio
        FROM recipe r
        JOIN userProfile up ON r.userProfileID = up.userProfileID
        JOIN user u ON up.userID = u.userID
        WHERE r.recipeID IN (${recipePlaceholders})
      `, recipeIdsToFetch);
      
      recipesData = recipeRows;
    }
    
    console.log(`📊 Preparing PDF export of ${savedFoods.length} saved foods`);
    
    // Create PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: 'Saved Foods Export',
        Author: 'Sarawak Eats',
        Subject: 'User Saved Foods',
        Keywords: 'food, recipes, export',
        Creator: 'Sarawak Eats Export System',
        CreationDate: new Date()
      }
    });
    
    // Set response headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="saved-foods-${Date.now()}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // ===== PDF CONTENT =====
    
    // Header
    doc.fontSize(25)
       .font('Helvetica-Bold')
       .text('Sarawak Eats', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(16)
       .font('Helvetica')
       .text('My Data Export', { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Exported on: ${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuching' })}`, { align: 'center' });
    const dataTypeLabels = {
      profile: 'Profile Information',
      savedFoods: 'Saved Foods',
      recipes: 'My Recipes',
      posts: 'My Community Posts',
      likedPosts: 'Liked Posts'
    };
    // const totalItems = savedFoods.length + myRecipes.length + myPosts.length + likedPosts.length;
    const exportedLabels = dataTypes.map(t => dataTypeLabels[t] || t).join(', ');
    // doc.text(`Total items exported: ${totalItems}`, { align: 'center' });
    doc.text(`Includes: ${exportedLabels}`, { align: 'center' });
    //doc.text(`User: ${req.session.user.firstName} ${req.session.user.lastName}`, { align: 'center' });
    
    doc.moveDown(2);

    // Profile Information
    if (profileData) {
      doc.fontSize(14).font('Helvetica-Bold').text('Profile Information');
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Name: ${profileData.firstname} ${profileData.lastname}`);
      doc.text(`Email: ${profileData.email}`);
      doc.text(`Role: ${profileData.role}`);
      if (profileData.location) doc.text(`Location: ${profileData.location}`);
      if (profileData.bio) doc.text(`Bio: ${profileData.bio}`);
      if (profileData.dietaryPreference) doc.text(`Dietary Preference: ${profileData.dietaryPreference}`);
      if (profileData.allergies) doc.text(`Allergies: ${profileData.allergies}`);
      if (profileData.status) doc.text(`Account Status: ${profileData.status}`);
      if (profileData.lastLogin) doc.text(`Last Login: ${new Date(profileData.lastLogin).toLocaleDateString()}`);
      if (profileData.consent_date) doc.text(`Consent Date: ${new Date(profileData.consent_date).toLocaleDateString()}`);
      doc.moveDown(2);
    }

    // My Recipes
    if (myRecipes.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('My Recipes');
      doc.fontSize(9).font('Helvetica').text(`${myRecipes.length} items`);
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      myRecipes.forEach((recipe, index) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`${index + 1}. ${recipe.foodName}`);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Origin: ${recipe.origin || 'N/A'} | Category: ${recipe.category || 'N/A'}`);
        doc.text(`Cook Time: ${recipe.cookTime || 'N/A'} min | Servings: ${recipe.servings || 'N/A'}`);
        doc.text(`Status: ${recipe.status || 'N/A'}`);
        if (recipe.ingredients) {
          doc.moveDown(0.3);
          doc.font('Helvetica-Bold').text('Ingredients:');
          doc.font('Helvetica').text(recipe.ingredients.replace(/\\n/g, '\n'), { width: 500 });
        }
        if (recipe.steps) {
          doc.moveDown(0.3);
          doc.font('Helvetica-Bold').text('Steps:');
          doc.font('Helvetica').text(recipe.steps.replace(/\\n/g, '\n').replace(/\*\*/g, ''), { width: 500 });
        }
        if (recipe.chefTips) {
          doc.moveDown(0.3);
          doc.font('Helvetica-Bold').text('Chef Tips:');
          doc.font('Helvetica').text(recipe.chefTips, { width: 500 });
        }
        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#CCCCCC').stroke();
        doc.moveDown(1);
        if (doc.y > 700) { doc.addPage(); doc.moveDown(1); }
      });
      doc.moveDown(1);
    }

    // My Community Posts
    if (myPosts.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('My Community Posts');
      doc.fontSize(9).font('Helvetica').text(`${myPosts.length} items`);
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      myPosts.forEach((post, index) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`${index + 1}. ${post.foodName}`);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Origin: ${post.origin || 'N/A'} | Status: ${post.status || 'N/A'}`);
        doc.text(`Posted on: ${new Date(post.created_at).toLocaleDateString()}`);
        if (post.culturalStory) {
          doc.moveDown(0.3);
          doc.font('Helvetica-Bold').text('Cultural Story:');
          doc.font('Helvetica').text(post.culturalStory, { width: 500, align: 'justify' });
        }
        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#CCCCCC').stroke();
        doc.moveDown(1);
        if (doc.y > 700) { doc.addPage(); doc.moveDown(1); }
      });
      doc.moveDown(1);
    }

    // Liked Posts
    if (likedPosts.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Liked Posts');
      doc.fontSize(9).font('Helvetica').text(`${likedPosts.length} items`);
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      likedPosts.forEach((post, index) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`${index + 1}. ${post.foodName}`);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Origin: ${post.origin || 'N/A'}`);
        doc.text(`Posted on: ${new Date(post.created_at).toLocaleDateString()}`);
        if (post.culturalStory) {
          doc.moveDown(0.3);
          doc.font('Helvetica-Bold').text('Cultural Story:');
          doc.font('Helvetica').text(post.culturalStory, { width: 500, align: 'justify' });
        }
        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#CCCCCC').stroke();
        doc.moveDown(1);
        if (doc.y > 700) { doc.addPage(); doc.moveDown(1); }
      });
      doc.moveDown(1);
    }
    // ===== SECTION: Saved Foods =====
    if (savedFoods.length > 0) {
      // Table of Contents style
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('Saved Foods List');
        doc.fontSize(9).font('Helvetica').text(`${savedFoods.length} items`);
      
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      
      doc.moveDown(1);
    
    // List each saved food
    savedFoods.forEach((sf, index) => {
      console.log(`📄 Processing item ${index + 1}:`, {
        saveID: sf.saveID,
        foodID: sf.id,
        name: sf.name
      });

      const food = foodsData.find(f => f.foodID === sf.id); 
      
      if (!food) {
        console.log(`❌ No food data found for foodID: ${sf.id}`);
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(`${index + 1}. ${sf.name || 'Unknown Food'}`);
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Saved on: ${new Date(sf.savedDate).toLocaleDateString()}`);
        doc.text(`Note: Food details not available`);
        doc.moveDown(1);
        return;
      }
      
      console.log(`✅ Found food data:`, food.name);

      const recipe = recipesData.find(r => r.recipeID === sf.recipeID);
      
        // Item number
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(`${index + 1}. ${food.name}`, {
             continued: true
           })
           .font('Helvetica')
           .fontSize(10)
           .text(` (Saved on: ${new Date(sf.savedDate).toLocaleDateString()})`, { align: 'right' });
        
        // Food details
        doc.fontSize(10)
           .text(`Origin: ${food.origin || 'N/A'} | Category: ${food.category || 'N/A'}`);
        
        doc.text(`Difficulty: ${food.difficulty || 'N/A'} | Prep Time: ${food.prepTime || 'N/A'} minutes`);
        
        // Dietary tags
        if (food.dietaryTags) {
          doc.text(`Dietary: ${food.dietaryTags}`);
        
        // Description
        if (food.description) {
          doc.moveDown(0.3);
          doc.font('Helvetica-Bold')
             .text('Description:');
          doc.moveDown(0.1);

          doc.font('Helvetica');
          doc.text(food.description, {
            width: 500,
            align: 'justify'
          });
        }
        
        // Nutrition facts (table)
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold')
           .text('Nutrition Facts:');
        doc.moveDown(0.2);
        
        doc.font('Helvetica');
        const nutritionLines = [
          `Energy: ${food.Energy_kcal || 'N/A'} kcal`,
          `Protein: ${food.Protein_g || 'N/A'} g`,
          `Fat: ${food.Fat_g || 'N/A'} g`,
          `Carbs: ${food.Carbohydrates_g || 'N/A'} g`,
          `Fiber: ${food.Fiber_g || 'N/A'} g`,
          `Vitamin C: ${food.VitaminC_mg || 'N/A'} mg`
        ];

        // Create a neat list
        nutritionLines.forEach((line, index) => {
          doc.text(line, {
            indent: 20,
            width: 500,
            align: 'left'
          });
        });

        doc.moveDown(0.3);
        
        // Recipe (if exists)
        if (recipe) {
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold')
             .text('Recipe:');
          
          doc.font('Helvetica');
          doc.text(`Contributor: ${recipe.firstname} ${recipe.lastname}`);
          doc.text(`Cook Time: ${recipe.cookTime || 'N/A'} min | Servings: ${recipe.servings || 'N/A'}`);
          
          if (recipe.ingredients) {
            doc.moveDown(0.3);
            doc.font('Helvetica-Bold')
               .text('Ingredients:');
            doc.moveDown(0.2);
    
          let ingredientsText = recipe.ingredients;
    
          // Clean up the ingredients text
          ingredientsText = ingredientsText.replace(/\\n/g, '\n');
          ingredientsText = ingredientsText.replace(/\\r/g, '');

          doc.font('Helvetica');
          
          // Process each line
          const lines = ingredientsText.split('\n');
          lines.forEach((line, index) => {
            if (line.trim()) {
              const bulletLine = line.trim().startsWith('•') || line.trim().startsWith('-') 
                ? line.trim() 
                : `• ${line.trim()}`;
              
              doc.text(bulletLine, {
                width: 500,
                align: 'left'
              });
            }
          });
        }
          
          if (recipe.steps) {
            doc.moveDown(0.3);
            doc.font('Helvetica-Bold')
              .text('Steps:');
            doc.moveDown(0.2);
            
            let stepsText = recipe.steps;
    
            // Clean up the steps text
            stepsText = stepsText.replace(/\\n/g, '\n');
            stepsText = stepsText.replace(/\\r/g, '');
            stepsText = stepsText.replace(/\*\*/g, ''); // Remove bold markers
            stepsText = stepsText.replace(/<\/?b>/g, ''); // Remove HTML bold tags

            stepsText = stepsText.replace(/^(\s+)(\d+(?:\.\d+)*\.)/gm, '$2');
    
            doc.font('Helvetica');
            doc.text(stepsText, {
                width: 500,
                align: 'left',
                indent: 10
            
            // // Process each line
            // const lines = stepsText.split('\n');
            // // let stepNumber = 1;
            // lines.forEach((line) => {
            //   const trimmedLine = line.trim();
              
            //   if (trimmedLine) {
            //     // Remove any existing step numbers (like "1.", "2.", etc.)
            //     const cleanLine = trimmedLine.replace(/^\d+\.\s*/, '');
                
            //     // Add proper step number
            //     doc.font('Helvetica'); // Ensure regular font
            //     doc.text(`${stepNumber}. ${cleanLine}`, {
            //       width: 500,
            //       align: 'left',
            //       indent: 10
            //     });
            //     stepNumber++;
            //   }
            });
          }
          
          if (recipe.chefTips) {
            doc.moveDown(0.3);
            doc.font('Helvetica-Bold')
               .text('Chef Tips:');
            doc.font('Helvetica')
               .text(recipe.chefTips, {
                 width: 500,
                 align: 'left'
               });
          }
        }
        
        // Health tips
        if (food.healthTips) {
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold')
             .text('Health Tips:');
          doc.font('Helvetica')
             .text(food.healthTips, {
               width: 500,
               align: 'left'
             });
        }
        
        // Separator
        doc.moveDown(1);
        doc.moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .strokeColor('#CCCCCC')
           .stroke();
        
        doc.moveDown(1);
        
        // Page break if needed
        if (doc.y > 700) {
          doc.addPage();
          doc.fontSize(10)
             //.text(`Continued...`, { align: 'right' });
          doc.moveDown(1);
        }
      }
    });
  }
    
    // Footer
    doc.moveDown(3);
    doc.fontSize(10)
      .font('Helvetica')
      .text(`© ${new Date().getFullYear()} Sarawak Eats. All rights reserved.`, { 
        align: 'center',
        width: 500 
      });
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    console.error('❌ PDF export error:', error);
    
    // Send error as JSON instead of trying to send partial PDF
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to export saved foods as PDF',
        message: error.message 
      });
    }
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;