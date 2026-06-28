const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { getNestedValue } = require('../utils/nested');
const contentService = require('./content');

const FIELD_TYPE_ATTR = 'data-edit-type';

async function loadTemplate(templatePath) {
  const fullPath = path.isAbsolute(templatePath)
    ? templatePath
    : path.resolve(templatePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Template not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function resolveValue(contentTree, flatMap, key) {
  const fromTree = getNestedValue(contentTree, key);
  if (fromTree !== undefined) return fromTree;

  const flatEntry = flatMap[key];
  if (flatEntry) return flatEntry.value ?? flatEntry;

  return undefined;
}

function applyValueToElement($, el, key, value, explicitType, basePath = '') {
  const type = explicitType || inferTypeFromValue(key, value);

  switch (type) {
    case 'image': {
      const src = typeof value === 'object' ? value.src || value.url : value;
      const alt = typeof value === 'object' ? value.alt || '' : key;
      if (el.is('img')) {
        el.attr('src', src || '');
        el.attr('alt', alt);
      } else {
        el.html(`<img src="${escapeAttr(src || '')}" alt="${escapeAttr(alt)}" />`);
      }
      break;
    }
    case 'link': {
      let href = typeof value === 'object' ? value.href : '#';
      if (href && href.startsWith('/') && !href.startsWith('//') && basePath) {
        href = `${basePath}${href}`;
      }
      const text = typeof value === 'object' ? value.text : String(value ?? '');
      if (el.is('a')) {
        el.attr('href', href || '#');
        el.text(text);
      } else {
        el.html(`<a href="${escapeAttr(href || '#')}">${escapeHtml(text)}</a>`);
      }
      break;
    }
    case 'html': {
      const html = typeof value === 'object' ? value.html || '' : String(value ?? '');
      el.html(html);
      break;
    }
    case 'multiline': {
      const text = String(value ?? '');
      el.html(text.split('\n').map(escapeHtml).join('<br>'));
      break;
    }
    case 'file': {
      const assetId = typeof value === 'object' ? value.assetId || value.fileId : value;
      el.attr('data-asset-id', assetId || '');
      if (typeof value === 'object' && value.url) {
        el.attr('href', value.url);
      }
      break;
    }
    default:
      el.text(String(value ?? ''));
  }
}

function inferTypeFromValue(key, value) {
  if (value == null) return 'text';
  if (typeof value === 'object') {
    if (value.href) return 'link';
    if (value.src || value.url) return 'image';
    if (value.html) return 'html';
    if (value.assetId || value.fileId) return 'file';
  }
  if (typeof value === 'string' && value.includes('\n')) return 'multiline';
  if (key.toLowerCase().includes('image') || key.toLowerCase().includes('logo')) return 'image';
  return 'text';
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}

function injectMenu($, menuItems, basePath) {
  const nav = $('[data-menu="main"]');
  if (!nav.length || !menuItems.length) return;

  const links = menuItems
    .map((item) => {
      const url = item.url.startsWith('http') ? item.url : `${basePath}${item.url}`;
      return `<a href="${escapeAttr(url)}">${escapeHtml(item.label)}</a>`;
    })
    .join('\n');

  nav.html(links);
}

async function renderPage({ business, page, menuItems = [] }) {
  const html = await loadTemplate(page.template_path);
  const contentTree = await contentService.getContentTree(business.id, page.id);
  const flatMap = await contentService.getContentMap(business.id, page.id);

  const $ = cheerio.load(html, { decodeEntities: false });

  const basePath = business.slug ? `/${business.slug}` : '';
  injectMenu($, menuItems, basePath);

  $('[data-edit]').each((_, node) => {
    const el = $(node);
    const key = el.attr('data-edit');
    const explicitType = el.attr(FIELD_TYPE_ATTR) || el.attr('data-type');
    const value = resolveValue(contentTree, flatMap, key);
    applyValueToElement($, el, key, value, explicitType, basePath);
  });

  return $.html();
}

function scanTemplateForKeys(templatePath) {
  const html = fs.readFileSync(templatePath, 'utf8');
  const $ = cheerio.load(html);
  const keys = [];
  $('[data-edit]').each((_, node) => {
    keys.push($(node).attr('data-edit'));
  });
  return keys;
}

module.exports = {
  renderPage,
  loadTemplate,
  scanTemplateForKeys,
};
