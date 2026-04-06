const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { pool } = require("../config/db");
const extract = require('extract-zip');


const BACKUP_DIR = path.join(__dirname, '../../backups');
const TEMP_DIR = path.join(__dirname, '../../temp_backups');

// Tables to exclude from backup
const EXCLUDED_TABLES = ['otp', 'sessions'];

// Ensure directories exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// ==================== BACKUP ENDPOINTS ====================

// 1. Create database backup (MySQL dump)
router.post('/create', async (req, res) => {
  try {
    const timestamp = Date.now();
    
    // Get all tables from database
    const [tables] = await pool.query('SHOW TABLES');
    const backupData = {};
    
    // Get the table name key (usually 'Tables_in_databasename')
    const tableKey = Object.keys(tables[0])[0];
    
    // Backup each table (excluding specified tables)
    for (const tableRow of tables) {
      const tableName = tableRow[tableKey];
      
      // Skip excluded tables
      if (EXCLUDED_TABLES.includes(tableName.toLowerCase())) {
        console.log(`Skipping excluded table: ${tableName}`);
        continue;
      }
      
      console.log(`Backing up table: ${tableName}`);
      
      // Get all data from the table
      const [rows] = await pool.query(`SELECT * FROM ${tableName}`);
      backupData[tableName] = rows;
    }
    
    // Create JSON backup file
    const backupFileName = `backup_${timestamp}.json`;
    const backupFilePath = path.join(TEMP_DIR, backupFileName);
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
    
    // Compress the backup
    const zipFileName = `sarawakeats_backup_${timestamp}.zip`;
    const zipFilePath = path.join(BACKUP_DIR, zipFileName);
    
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.file(backupFilePath, { name: backupFileName });
      
      // Add metadata
      const metadata = {
        backup_date: new Date().toISOString(),
        database: process.env.DB_NAME,
        tables_count: Object.keys(backupData).length,
        excluded_tables: EXCLUDED_TABLES,
        backup_type: 'json'
      };
      
      archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });
      archive.finalize();
    });
    
    // Clean up temp file
    fs.unlinkSync(backupFilePath);
    
    // Get file size
    const stats = fs.statSync(zipFilePath);
    
    // Log backup activity (if activity_logs table exists)
    try {
      await pool.query(
        'INSERT INTO activity_logs (user_id, action, details, created_at) VALUES (?, ?, ?, NOW())',
        [req.session?.userId || req.user?.uid, 'database_backup', `Created backup: ${zipFileName} (${(stats.size / 1024 / 1024).toFixed(2)} MB) - Excluded tables: ${EXCLUDED_TABLES.join(', ')}`]
      );
    } catch (logError) {
      console.log('Could not log to activity_logs:', logError.message);
    }
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      filename: zipFileName,
      size: stats.size,
      tables_backed_up: Object.keys(backupData).length,
      excluded_tables: EXCLUDED_TABLES
    });
    
  } catch (error) {
    console.error('Backup creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Download backup file
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(BACKUP_DIR, filename);
    
    // Security: Prevent directory traversal
    if (!filePath.startsWith(BACKUP_DIR)) {
      return res.status(403).json({ success: false, error: 'Invalid filename' });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Backup file not found' });
    }
    
    res.download(filePath, filename);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. List all available backups
router.get('/list', async (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.endsWith('.zip') && file.startsWith('sarawakeats_backup_'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        const timestamp = parseInt(file.match(/\d+/)?.[0] || '0');
        return {
          filename: file,
          size: stats.size,
          size_mb: (stats.size / 1024 / 1024).toFixed(2),
          created_at: new Date(stats.birthtime).toISOString(),
          timestamp: timestamp
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
    
    res.json({
      success: true,
      backups: backups,
      total: backups.length,
      backup_directory: BACKUP_DIR
    });
    
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Restore from backup
router.post('/restore', async (req, res) => {
  const { filename } = req.body;
  
  if (!filename) {
    return res.status(400).json({ success: false, error: 'Filename required' });
  }
  
  try {
    const filePath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Backup file not found' });
    }
    
    // Extract the JSON file from zip
    const extractDir = path.join(TEMP_DIR, `restore_${Date.now()}`);
    fs.mkdirSync(extractDir, { recursive: true });
    
    await extract(filePath, { dir: extractDir });
    
    // Find the JSON file
    const extractedFiles = fs.readdirSync(extractDir);
    const jsonFile = extractedFiles.find(file => file.endsWith('.json') && file !== 'metadata.json');
    
    if (!jsonFile) {
      throw new Error('No backup JSON file found in archive');
    }
    
    const jsonFilePath = path.join(extractDir, jsonFile);
    const backupData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    // Get a connection for transaction
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Disable foreign key checks
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Restore each table (skip excluded tables)
      for (const [tableName, rows] of Object.entries(backupData)) {
        // Skip if this is an excluded table (shouldn't be in backup anyway)
        if (EXCLUDED_TABLES.includes(tableName.toLowerCase())) {
          console.log(`Skipping restore of excluded table: ${tableName}`);
          continue;
        }
        
        if (rows && rows.length > 0) {
          console.log(`Restoring table: ${tableName} (${rows.length} rows)`);
          
          // Clear existing data
          await connection.query(`TRUNCATE TABLE ${tableName}`);
          
          // Insert backup data in batches
          const batchSize = 100;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            for (const row of batch) {
              await connection.query(`INSERT INTO ${tableName} SET ?`, row);
            }
          }
        }
      }
      
      // Re-enable foreign key checks
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      await connection.commit();
      
      console.log('Restore completed successfully');
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
    // Clean up
    fs.rmSync(extractDir, { recursive: true, force: true });
    
    // Log restore activity
    try {
      await pool.query(
        'INSERT INTO activity_logs (user_id, action, details, created_at) VALUES (?, ?, ?, NOW())',
        [req.session?.userId || req.user?.uid, 'database_restore', `Restored from backup: ${filename}`]
      );
    } catch (logError) {
      console.log('Could not log to activity_logs:', logError.message);
    }
    
    res.json({
      success: true,
      message: 'Database restored successfully'
    });
    
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Delete old backups (cleanup)
router.delete('/cleanup', async (req, res) => {
  const { daysToKeep = 30 } = req.body;
  
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const deletedFiles = [];
    
    for (const file of files) {
      if (file.endsWith('.zip') && file.startsWith('sarawakeats_backup_')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        const fileAge = (now - stats.birthtimeMs) / (1000 * 60 * 60 * 24);
        
        if (fileAge > daysToKeep) {
          fs.unlinkSync(filePath);
          deletedFiles.push(file);
        }
      }
    }
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedFiles.length} old backups`,
      deleted: deletedFiles
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Get last backup info
router.get('/last-backup', async (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.endsWith('.zip') && file.startsWith('sarawakeats_backup_'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
          filename: file,
          created_at: stats.birthtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.created_at - a.created_at);
    
    const lastBackup = backups[0] || null;
    
    res.json({
      success: true,
      lastBackup: lastBackup,
      hasBackup: !!lastBackup
    });
    
  } catch (error) {
    console.error('Get last backup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Export specific tables as JSON (alternative to full SQL backup)
router.post('/export-json', async (req, res) => {
  const { tables = ['users', 'recipes', 'foods', 'posts', 'comments'] } = req.body;
  
  try {
    const exportData = {};
    
    for (const table of tables) {
      const [rows] = await pool.query(`SELECT * FROM ${table}`);
      exportData[table] = rows;
    }
    
    const timestamp = Date.now();
    const jsonFileName = `data_export_${timestamp}.json`;
    const jsonFilePath = path.join(TEMP_DIR, jsonFileName);
    
    fs.writeFileSync(jsonFilePath, JSON.stringify(exportData, null, 2));
    
    // Create zip with JSON
    const zipFileName = `sarawakeats_data_${timestamp}.zip`;
    const zipFilePath = path.join(BACKUP_DIR, zipFileName);
    
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.file(jsonFilePath, { name: jsonFileName });
      archive.finalize();
    });
    
    // Clean up
    fs.unlinkSync(jsonFilePath);
    
    res.json({
      success: true,
      message: 'Data exported successfully',
      filename: zipFileName,
      tables_exported: tables
    });
    
  } catch (error) {
    console.error('JSON export error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;