import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ============ UTILITY FUNCTIONS ============
function readJSON(file) {
  const filePath = path.join(DATA_DIR, file);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return [];
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
    return [];
  }
}

function writeJSON(file, data) {
  const filePath = path.join(DATA_DIR, file);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${file}:`, error);
    return false;
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

function findOne(collection, query) {
  // ✅ Validation
  if (!collection || !query) {
    console.error('Invalid findOne query:', { collection, query });
    return null;
  }
  
  try {
    const items = readJSON(collection);
    return items.find(item => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] !== value) return false;
      }
      return true;
    }) || null;
  } catch (error) {
    console.error(`Error in findOne for ${collection}:`, error);
    return null;
  }
}

function findMany(collection, query = {}) {
  let items = readJSON(collection);
  if (Object.keys(query).length > 0) {
    items = items.filter(item => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] !== value) return false;
      }
      return true;
    });
  }
  return items;
}

function create(collection, data) {
  const items = readJSON(collection);
  const newItem = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...data
  };
  items.push(newItem);
  writeJSON(collection, items);
  return newItem;
}

function update(collection, query, data) {
  const items = readJSON(collection);
  let updated = null;
  const newItems = items.map(item => {
    let match = true;
    for (const [key, value] of Object.entries(query)) {
      if (item[key] !== value) match = false;
    }
    if (match) {
      updated = { ...item, ...data, updatedAt: new Date().toISOString() };
      return updated;
    }
    return item;
  });
  if (updated) {
    writeJSON(collection, newItems);
  }
  return updated;
}

function remove(collection, query) {
  const items = readJSON(collection);
  const newItems = items.filter(item => {
    for (const [key, value] of Object.entries(query)) {
      if (item[key] === value) return false;
    }
    return true;
  });
  if (newItems.length !== items.length) {
    writeJSON(collection, newItems);
    return true;
  }
  return false;
}

function count(collection, query = {}) {
  return findMany(collection, query).length;
}

// ============ DATABASE EXPORTS ============
export const db = {
  users: {
    findUnique: (query) => findOne('users.json', query),
    findFirst: (query) => findOne('users.json', query),
    findMany: (query) => findMany('users.json', query),
    create: (data) => create('users.json', data),
    update: (query, data) => update('users.json', query, data),
    delete: (query) => remove('users.json', query),
    count: (query) => count('users.json', query),
  },
  
  purchases: {
    findUnique: (query) => findOne('purchases.json', query),
    findMany: (query) => findMany('purchases.json', query),
    create: (data) => create('purchases.json', data),
    update: (query, data) => update('purchases.json', query, data),
    delete: (query) => remove('purchases.json', query),
    count: (query) => count('purchases.json', query),
  },
  
  downloads: {
    findUnique: (query) => findOne('downloads.json', query),
    findMany: (query) => findMany('downloads.json', query),
    create: (data) => create('downloads.json', data),
    update: (query, data) => update('downloads.json', query, data),
    delete: (query) => remove('downloads.json', query),
    count: (query) => count('downloads.json', query),
  },
  
  accessTokens: {
    findUnique: (query) => findOne('access-tokens.json', query),
    findFirst: (query) => findOne('access-tokens.json', query),
    findMany: (query) => findMany('access-tokens.json', query),
    create: (data) => create('access-tokens.json', data),
    update: (query, data) => update('access-tokens.json', query, data),
    delete: (query) => remove('access-tokens.json', query),
    count: (query) => count('access-tokens.json', query),
  },
  
  paymentLogs: {
    findUnique: (query) => findOne('payment-logs.json', query),
    findFirst: (query) => findOne('payment-logs.json', query),
    findMany: (query) => findMany('payment-logs.json', query),
    create: (data) => create('payment-logs.json', data),
    update: (query, data) => update('payment-logs.json', query, data),
    delete: (query) => remove('payment-logs.json', query),
    count: (query) => count('payment-logs.json', query),
  },
};

// Export individual functions for direct use
export { readJSON, writeJSON, findOne, findMany, create, update, remove, generateId };