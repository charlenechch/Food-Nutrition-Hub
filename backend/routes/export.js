// routes/export.js
const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Helper function to get month name
function getMonthName(monthNumber) {  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
  ];
  return months[monthNumber - 1];
}

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
        f.Fibre_g,
        DATE_FORMAT(f.createdAt, '%Y-%m-%d %H:%i:%s') as createdAt,
        GROUP_CONCAT(DISTINCT CONCAT(u.firstname, ' ', u.lastname)) as contributors
      FROM food f
      LEFT JOIN recipe r ON f.foodID = r.foodID
      LEFT JOIN userProfile up ON r.userProfileID = up.userProfileID
      LEFT JOIN user u ON up.userID = u.userID
      GROUP BY f.foodID, f.name, f.category, f.origin, f.description, f.Energy_kcal, f.Protein_g, f.Fat_g, f.Carbohydrates_g, f.Fibre_g,
               r.servings, f.difficulty, f.createdAt
      ORDER BY f.createdAt DESC
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
  try {
    const format = req.query.format || 'excel'; // 'excel' or 'pdf'
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Fetch all analytics data
    // Get metrics data
    const [totalRecipesResult] = await db.execute(`
      SELECT COUNT(*) as count FROM recipe WHERE status = 'Approved'
    `);
    const [totalStoriesResult] = await db.execute(`
      SELECT COUNT(*) as count FROM posts WHERE status = 'Approved'
    `);
    const [pendingRecipesResult] = await db.execute(`
      SELECT COUNT(*) as count FROM recipe WHERE status = 'Pending'
    `);
    const [pendingStoriesResult] = await db.execute(`
      SELECT COUNT(*) as count FROM posts WHERE status = 'Pending'
    `);

    // Get cultural origin data
    const [culturalOriginResult] = await db.execute(`
      SELECT origin as name, COUNT(foodID) as count
      FROM food
      WHERE origin IS NOT NULL AND origin != ''
      GROUP BY origin
      ORDER BY count DESC
    `);

    // Get popular categories
    const [categoriesResult] = await db.execute(`
      SELECT category as name, COUNT(foodID) as submissions
      FROM food
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category
      ORDER BY submissions DESC
    `);

    // Get monthly data
    const [monthlyResult] = await db.execute(`
      SELECT 
        'Posts' as type,
        status,
        MONTH(created_at) as month,
        COUNT(*) as count
      FROM posts 
      WHERE YEAR(created_at) = ?
      GROUP BY MONTH(created_at), status
      
      UNION ALL
      
      SELECT 
        'Recipes' as type,
        status,
        MONTH(createdAt) as month,
        COUNT(*) as count
      FROM recipe 
      WHERE YEAR(createdAt) = ?
      GROUP BY MONTH(createdAt), status
      
      ORDER BY month, type, status
    `, [year, year]);

    // Get top contributors
    const [contributorsResult] = await db.execute(`
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
      LEFT JOIN recipe r ON up.userProfileID = r.userProfileID AND r.status = 'Approved'
      LEFT JOIN posts p ON up.userProfileID = p.userProfileID AND p.status = 'Approved'
      GROUP BY u.userID, u.firstname, u.lastname, u.email, up.userProfileID
      HAVING total > 0
      ORDER BY total DESC
      LIMIT 10
    `);

    // Format data for export
    const analyticsData = {
      reportInfo: {
        title: "SarawakEats Analytics Report",
        generated: new Date().toISOString(),
        year: year,
        period: `Year ${year}`
      },
      summary: {
        totalRecipes: totalRecipesResult[0].count,
        totalStories: totalStoriesResult[0].count,
        pendingRecipes: pendingRecipesResult[0].count,
        pendingStories: pendingStoriesResult[0].count,
        totalContent: totalRecipesResult[0].count + totalStoriesResult[0].count
      },
      culturalOrigins: culturalOriginResult.map(row => ({
        origin: row.name,
        count: row.count
      })),
      categories: categoriesResult.map(row => ({
        category: row.name,
        submissions: row.submissions
      })),
      monthlyData: monthlyResult.reduce((acc, row) => {
        const monthName = getMonthName(row.month);
        if (!acc[monthName]) acc[monthName] = { month: monthName, posts: {}, recipes: {} };
        
        if (row.type === 'Posts') {
          acc[monthName].posts[row.status] = row.count;
        } else {
          acc[monthName].recipes[row.status] = row.count;
        }
        return acc;
      }, {}),
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
      return exportAsPDF(res, analyticsData, year);
    } else {
      // Default to Excel
      return exportAsExcel(res, analyticsData, year);
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
async function exportAsExcel(res, data, year) {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Add metadata
    workbook.creator = 'SarawakEats Admin';
    workbook.created = new Date();
    
    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 15 }
    ];
    
    summarySheet.addRows([
      { metric: 'Total Recipes', value: data.summary.totalRecipes },
      { metric: 'Total Stories', value: data.summary.totalStories },
      { metric: 'Pending Recipes', value: data.summary.pendingRecipes },
      { metric: 'Pending Stories', value: data.summary.pendingStories },
      { metric: 'Total Content', value: data.summary.totalContent },
      { metric: 'Report Year', value: year },
      { metric: 'Generated On', value: new Date().toLocaleString() }
    ]);
    
    // Sheet 2: Cultural Origins
    const originsSheet = workbook.addWorksheet('Cultural Origins');
    originsSheet.columns = [
      { header: 'Cultural Origin', key: 'origin', width: 30 },
      { header: 'Count', key: 'count', width: 15 },
      { header: 'Percentage', key: 'percentage', width: 15 }
    ];
    
    const originTotal = data.culturalOrigins.reduce((sum, item) => sum + item.count, 0);
    data.culturalOrigins.forEach(item => {
      const percentage = ((item.count / originTotal) * 100).toFixed(2);
      originsSheet.addRow({
        origin: item.origin,
        count: item.count,
        percentage: `${percentage}%`
      });
    });
    
    // Sheet 3: Categories
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
    
    // Sheet 4: Monthly Data
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
    
    // Sheet 5: Top Contributors
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
    
    // Style headers
    [summarySheet, originsSheet, categoriesSheet, monthlySheet, contributorsSheet].forEach(sheet => {
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });
    
    // Write to buffer and send
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=sarawakeats-analytics-${year}-${Date.now()}.xlsx`);
    res.send(buffer);
    
  } catch (error) {
    throw error;
  }
}

// PDF Export Function
async function exportAsPDF(res, data, year) {
  try {
    const doc = new PDFDocument({ margin: 50 });
    
    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sarawakeats-analytics-${year}-${Date.now()}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Title
    doc.fontSize(24).text('SarawakEats Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Report for Year: ${year}`, { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);
    
    // 1. Summary Section
    doc.fontSize(16).text('1. Summary', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(12);
    doc.text(`Total Recipes: ${data.summary.totalRecipes}`);
    doc.text(`Total Stories: ${data.summary.totalStories}`);
    doc.text(`Pending Recipes: ${data.summary.pendingRecipes}`);
    doc.text(`Pending Stories: ${data.summary.pendingStories}`);
    doc.text(`Total Content Items: ${data.summary.totalContent}`);
    doc.moveDown(2);
    
    // 2. Cultural Origins
    doc.fontSize(16).text('2. Cultural Origins Distribution', { underline: true });
    doc.moveDown(0.5);
    
    data.culturalOrigins.forEach((item, index) => {
      const percentage = ((item.count / data.culturalOrigins.reduce((sum, i) => sum + i.count, 0)) * 100).toFixed(1);
      doc.text(`${index + 1}. ${item.origin}: ${item.count} items (${percentage}%)`);
    });
    doc.moveDown(2);
    
    // 3. Top Categories
    doc.fontSize(16).text('3. Popular Food Categories', { underline: true });
    doc.moveDown(0.5);
    
    data.categories.slice(0, 10).forEach((item, index) => {
      doc.fontSize(12);
      doc.text(`${index + 1}. ${item.category}: ${item.submissions} submissions`);
    });
    doc.moveDown(2);
    
    // 4. Monthly Overview Table
    doc.fontSize(16).text('4. Monthly Contributions Overview', { underline: true });
    doc.moveDown(0.5);
    
    // Table header
    doc.fontSize(12);
    const startX = 50;
    const colWidths = [80, 100, 100];
    let currentY = doc.y;

    doc.lineWidth(0.5);
    doc.strokeColor('#333333');
    
    // Draw header line
    doc.moveTo(startX, currentY)
       .lineTo(startX + colWidths[0] + colWidths[1] + colWidths[2], currentY)
       .stroke();
    currentY += 2; // Small gap
    
    // Draw table rows with lines
    Object.values(data.monthlyData).forEach((month, index) => {
      if (doc.y > 700) { // New page if needed
        doc.addPage();
        currentY = 50;
    }
      
    // Draw row line before content
    doc.moveTo(startX, currentY)
        .lineTo(startX + colWidths[0] + colWidths[1] + colWidths[2], currentY)
        .stroke();
    currentY += 5;
      
    // Month column
    doc.text(month.month, startX + 5, currentY);
      
    // Posts column
    const postsTotal = (month.posts.Approved || 0) + (month.posts.Pending || 0) + (month.posts.Rejected || 0);
    doc.text(`Posts: ${postsTotal}`, startX + colWidths[0] + 5, currentY);
      
    // Recipes column
    const recipesTotal = (month.recipes.Approved || 0) + (month.recipes.Pending || 0) + (month.recipes.Rejected || 0);
    doc.text(`Recipes: ${recipesTotal}`, startX + colWidths[0] + colWidths[1] + 5, currentY);
      
    currentY += 20;
      
    // Draw bottom line after content
    doc.moveTo(startX, currentY - 10)
        .lineTo(startX + colWidths[0] + colWidths[1] + colWidths[2], currentY - 10)
        .stroke();
    });
    
    doc.moveDown(2);
    
    // 5. Top Contributors
    doc.fontSize(16).text('5. Top Contributors', { underline: true });
    doc.moveDown(0.5);
    
    data.topContributors.forEach((contributor, index) => {
      doc.fontSize(12);
      doc.text(`${index + 1}. ${contributor.name} (${contributor.email})`, { indent: 0, align: 'left' });
      doc.moveDown(0.3);
      doc.text(`   Recipes: ${contributor.recipes}, Stories: ${contributor.stories}, Total: ${contributor.totalContributions}`);
      doc.moveDown(0.5);
    });
    
    // Footer
    doc.addPage();
    doc.fontSize(10).text('--- End of Report ---', { align: 'center' });
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    throw error;
  }
}

module.exports = router;