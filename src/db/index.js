const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const schemaStatements = require('./schema');

let db;
let SQL;

async function initDatabase() {
  if (db) return db;
  
  SQL = await initSqlJs();
  
  const dbPath = env.databasePath || './data.sqlite';
  const isFresh = !fs.existsSync(dbPath);
  
  if (isFresh) {
    db = new SQL.Database();
    for (const sql of schemaStatements) {
      db.run(sql);
    }
    console.log('[Database] Schema created for fresh database');
  } else {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  }
  
  return db;
}

function getDb() {
  if (!db) throw new Error('Database not initialized - call initDatabase first');
  return db;
}

function runMigrations() {
  if (!db) return;
  
  const now = new Date().toISOString();
  
  try {
    // Check system_api_keys table
    const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='system_api_keys'");
    if (result.length > 0 && result[0].values.length > 0) {
      const cols = db.exec("PRAGMA table_info(system_api_keys)");
      if (cols.length > 0) {
        const colNames = cols[0].values.map(v => v[1]);
        if (!colNames.includes('error_count')) {
          db.run("ALTER TABLE system_api_keys ADD COLUMN error_count INTEGER DEFAULT 0");
        }
        if (!colNames.includes('last_error_at')) {
          db.run("ALTER TABLE system_api_keys ADD COLUMN last_error_at TEXT");
        }
        if (!colNames.includes('cooldown_until')) {
          db.run("ALTER TABLE system_api_keys ADD COLUMN cooldown_until TEXT");
        }
        if (!colNames.includes('is_rate_limited')) {
          db.run("ALTER TABLE system_api_keys ADD COLUMN is_rate_limited INTEGER DEFAULT 0");
        }
      }
    }
    
    // Check user_byok_keys table
    const byokResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='user_byok_keys'");
    if (byokResult.length > 0 && byokResult[0].values.length > 0) {
      const byokCols = db.exec("PRAGMA table_info(user_byok_keys)");
      if (byokCols.length > 0) {
        const colNames = byokCols[0].values.map(v => v[1]);
        if (!colNames.includes('last_used_at')) {
          db.run("ALTER TABLE user_byok_keys ADD COLUMN last_used_at TEXT");
        }
        if (!colNames.includes('error_count')) {
          db.run("ALTER TABLE user_byok_keys ADD COLUMN error_count INTEGER DEFAULT 0");
        }
        if (!colNames.includes('last_error_at')) {
          db.run("ALTER TABLE user_byok_keys ADD COLUMN last_error_at TEXT");
        }
        if (!colNames.includes('cooldown_until')) {
          db.run("ALTER TABLE user_byok_keys ADD COLUMN cooldown_until TEXT");
        }
        if (!colNames.includes('is_rate_limited')) {
          db.run("ALTER TABLE user_byok_keys ADD COLUMN is_rate_limited INTEGER DEFAULT 0");
        }
      }
    }
    
    console.log('[Database] Migrations completed');
  } catch (e) {
    console.warn('[Migration] skip:', e.message);
  }
}

function save() {
  if (!db) return;
  const dbPath = env.databasePath || './data.sqlite';
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function close() {
  if (db) {
    save();
    db.close();
    db = null;
  }
}

// Helper to convert result to object (assumes step() already called)
function resultToObject(stmt) {
  const columns = stmt.getColumnNames();
  const values = stmt.get();
  if (!columns.length) return null;
  
  const row = {};
  columns.forEach((col, i) => {
    row[col] = values[i];
  });
  return row;
}

function resultToArray(stmt) {
  const columns = stmt.getColumnNames();
  if (!columns.length) return [];
  
  const results = [];
  while (stmt.step()) {
    const values = stmt.get();
    const row = {};
    columns.forEach((col, i) => {
      row[col] = values[i];
    });
    results.push(row);
  }
  stmt.free();
  return results;
}

// Wrapper for easier usage
const dbWrapper = {
  prepare(sql) {
    return {
      run: (...params) => {
        db.run(sql, params);
        const lastId = db.exec('SELECT last_insert_rowid()')[0]?.values[0][0];
        save();
        return { lastInsertRowid: lastId };
      },
      get: (...params) => {
        const stmt = db.prepare(sql);
        if (params.length === 1) stmt.bind([params[0]]);
        else if (params.length > 0) stmt.bind(params);
        if (stmt.step()) {
          const result = resultToObject(stmt);
          stmt.free();
          return result;
        }
        stmt.free();
        return null;
      },
      all: (...params) => {
        const stmt = db.prepare(sql);
        if (params.length === 1) stmt.bind([params[0]]);
        else if (params.length > 0) stmt.bind(params);
        return resultToArray(stmt);
      }
    };
  },
  
  transaction(fn) {
    return (...args) => {
      fn(...args);
      save();
    };
  }
};

module.exports = { initDatabase, getDb, runMigrations, save, close, db: dbWrapper };