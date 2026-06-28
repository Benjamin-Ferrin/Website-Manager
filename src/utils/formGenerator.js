const { inferFieldType } = require('./nested');

function labelFromKey(key) {
  const last = key.split('.').pop();
  return last
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function buildFormFields(contentMap) {
  return Object.entries(contentMap).map(([key, entry]) => {
    const value = entry?.value ?? entry;
    const type = entry?.field_type || inferFieldType(key, value);

    return {
      key,
      label: labelFromKey(key),
      type,
      value,
    };
  });
}

function renderFormField(field) {
  const { key, label, type, value } = field;
  const name = `content[${key}]`;
  const id = `field-${key.replace(/\./g, '-')}`;

  switch (type) {
    case 'multiline':
      return {
        html: `<label for="${id}">${label}</label>
<textarea id="${id}" name="${name}" rows="4">${escapeHtml(String(value ?? ''))}</textarea>`,
        type,
      };
    case 'html':
      return {
        html: `<label for="${id}">${label} (HTML)</label>
<textarea id="${id}" name="${name}" rows="8">${escapeHtml(String(value?.html ?? value ?? ''))}</textarea>`,
        type,
      };
    case 'image': {
      const src = typeof value === 'object' ? value.src || value.url || '' : value || '';
      const alt = typeof value === 'object' ? value.alt || '' : '';
      return {
        html: `<label for="${id}">${label} URL</label>
<input type="url" id="${id}" name="${name}[src]" value="${escapeAttr(src)}" />
<label for="${id}-alt">Alt text</label>
<input type="text" id="${id}-alt" name="${name}[alt]" value="${escapeAttr(alt)}" />`,
        type,
      };
    }
    case 'link': {
      const href = typeof value === 'object' ? value.href || '' : '';
      const text = typeof value === 'object' ? value.text || '' : '';
      return {
        html: `<label for="${id}">${label} URL</label>
<input type="url" id="${id}" name="${name}[href]" value="${escapeAttr(href)}" />
<label for="${id}-text">Link text</label>
<input type="text" id="${id}-text" name="${name}[text]" value="${escapeAttr(text)}" />`,
        type,
      };
    }
    case 'json':
      return {
        html: `<label for="${id}">${label} (JSON)</label>
<textarea id="${id}" name="${name}" rows="6">${escapeHtml(JSON.stringify(value ?? {}, null, 2))}</textarea>`,
        type,
      };
    case 'file':
      return {
        html: `<label for="${id}">${label} (asset ID)</label>
<input type="number" id="${id}" name="${name}[assetId]" value="${escapeAttr(String(value?.assetId ?? value?.fileId ?? ''))}" />`,
        type,
      };
    default:
      return {
        html: `<label for="${id}">${label}</label>
<input type="text" id="${id}" name="${name}" value="${escapeAttr(String(value ?? ''))}" />`,
        type,
      };
  }
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

function parseSubmittedContent(formData) {
  const result = {};
  for (const [key, value] of Object.entries(formData)) {
    result[key] = value;
  }
  return result;
}

module.exports = {
  buildFormFields,
  renderFormField,
  labelFromKey,
  parseSubmittedContent,
};
