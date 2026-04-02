const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { pool } = require("../config/db");
const extract = require('extract-zip');

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sarawakeats_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const BACKUP_DIR = path.join(__dirname, '../../backups');
const TEMP_DIR = path.join(__dirname, '../../temp_backups');

// Ensure directories exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    // Get user from session or Firebase token
    const userId = req.session?.userId || req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    // Check if user has admin role in MySQL
    const [rows] = await pool.query(
      'SELECT role FROM users WHERE firebase_uid = ? OR id = ?',
      [userId, userId]
    );
    
    if (rows.length === 0 || rows[0].role !== 'Admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ==================== BACKUP ENDPOINTS ====================

// 1. Create database backup (MySQL dump)
router.post('/api/admin/backup/create', isAdmin, async (req, res) => {
  try {
    const timestamp = Date.now();
    const backupFileName = `mysql_backup_${timestamp}.sql`;
    const backupFilePath = path.join(TEMP_DIR, backupFileName);
    
    // Create MySQL dump using mysqldump
    const dumpCommand = `mysqldump -h ${process.env.DB_HOST || 'localhost'} -u ${process.env.DB_USER || 'root'} -p${process.env.DB_PASSWORD || ''} ${process.env.DB_NAME || 'sarawakeats_db'} --single-transaction --routines --triggers > "${backupFilePath}"`;
    
    await execPromise(dumpCommand);
    
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
        tables_count: 0,
        file_size: 0
      };
      
      archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });
      archive.finalize();
    });
    
    // Clean up temp file
    fs.unlinkSync(backupFilePath);
    
    // Get file size
    const stats = fs.statSync(zipFilePath);
    
    // Log backup activity
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details, created_at) VALUES (?, ?, ?, NOW())',
      [req.session?.userId || req.user?.uid, 'database_backup', `Created backup: ${zipFileName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`]
    );
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      filename: zipFileName,
      size: stats.size,
      path: zipFilePath
    });
    
  } catch (error) {
    console.error('Backup creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Download backup file
router.get('/api/admin/backup/download/:filename', isAdmin, async (req, res) => {
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
router.get('/api/admin/backup/list', isAdmin, async (req, res) => {
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
router.post('/api/admin/backup/restore', isAdmin, async (req, res) => {
  const { filename } = req.body;
  
  if (!filename) {
    return res.status(400).json({ success: false, error: 'Filename required' });
  }
  
  try {
    const filePath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Backup file not found' });
    }
    
    // Extract the SQL file from zip
    const extractDir = path.join(TEMP_DIR, `restore_${Date.now()}`);
    fs.mkdirSync(extractDir, { recursive: true });
    
    const extract = require('extract-zip');
    await extract(filePath, { dir: extractDir });
    
    // Find the SQL file
    const extractedFiles = fs.readdirSync(extractDir);
    const sqlFile = extractedFiles.find(file => file.endsWith('.sql'));
    
    if (!sqlFile) {
      throw new Error('No SQL file found in backup');
    }
    
    const sqlFilePath = path.join(extractDir, sqlFile);
    
    // Restore database
    const restoreCommand = `mysql -h ${process.env.DB_HOST || 'localhost'} -u ${process.env.DB_USER || 'root'} -p${process.env.DB_PASSWORD || ''} ${process.env.DB_NAME || 'sarawakeats_db'} < "${sqlFilePath}"`;
    
    await execPromise(restoreCommand);
    
    // Clean up
    fs.rmSync(extractDir, { recursive: true, force: true });
    
    // Log restore activity
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details, created_at) VALUES (?, ?, ?, NOW())',
      [req.session?.userId || req.user?.uid, 'database_restore', `Restored from backup: ${filename}`]
    );
    
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
router.delete('/api/admin/backup/cleanup', isAdmin, async (req, res) => {
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
router.get('/api/admin/backup/last-backup', isAdmin, async (req, res) => {
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
router.post('/api/admin/backup/export-json', isAdmin, async (req, res) => {
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