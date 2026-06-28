function getNestedValue(obj, keyPath) {
  if (!obj || !keyPath) return undefined;
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

function setNestedValue(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] == null || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
  return obj;
}

function flattenObject(obj, prefix = '') {
  const result = {};
  if (obj == null || typeof obj !== 'object') return result;

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

function unflattenObject(flat) {
  const result = {};
  for (const [key, value] of Object.entries(flat)) {
    setNestedValue(result, key, value);
  }
  return result;
}

function inferFieldType(key, value) {
  if (value == null) return 'text';
  if (typeof value === 'object') {
    if (value.href && value.text) return 'link';
    if (value.src || value.url) return 'image';
    if (value.html) return 'html';
    if (value.fileId || value.assetId) return 'file';
    return 'json';
  }
  if (typeof value === 'string' && value.includes('\n')) return 'multiline';
  if (typeof value === 'string' && value.trim().startsWith('<')) return 'html';
  if (key.toLowerCase().includes('image') || key.toLowerCase().includes('logo')) {
    return 'image';
  }
  return 'text';
}

module.exports = {
  getNestedValue,
  setNestedValue,
  flattenObject,
  unflattenObject,
  inferFieldType,
};
