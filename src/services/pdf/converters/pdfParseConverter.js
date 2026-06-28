const fs = require('fs');
const pdfParse = require('pdf-parse');

const name = 'pdf-parse';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function textToHtml(text) {
  const lines = text.split(/\r?\n/);
  const parts = [];
  let paragraph = [];
  let inTable = false;
  let tableRows = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      parts.push(`<p>${escapeHtml(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length) {
      const rows = tableRows
        .map((cells) => {
          const tds = cells.map((c) => `<td>${escapeHtml(c.trim())}</td>`).join('');
          return `<tr>${tds}</tr>`;
        })
        .join('');
      parts.push(`<table class="pdf-table"><tbody>${rows}</tbody></table>`);
      tableRows = [];
      inTable = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushTable();
      continue;
    }

    const isTableRow = /\t/.test(line) || /\s{2,}/.test(line);
    if (isTableRow) {
      flushParagraph();
      inTable = true;
      const cells = line.split(/\t|\s{2,}/).filter(Boolean);
      tableRows.push(cells);
      continue;
    }

    if (inTable) flushTable();

    if (trimmed.length < 80 && /^[A-Z0-9][A-Z0-9\s\-:&]+$/.test(trimmed) && trimmed === trimmed.toUpperCase()) {
      flushParagraph();
      parts.push(`<h2>${escapeHtml(trimmed)}</h2>`);
    } else if (trimmed.length < 60 && /^[A-Z]/.test(trimmed) && !trimmed.endsWith('.')) {
      flushParagraph();
      parts.push(`<h3>${escapeHtml(trimmed)}</h3>`);
    } else {
      paragraph.push(trimmed);
    }
  }

  flushParagraph();
  flushTable();

  if (parts.length === 0) {
    return `<p>${escapeHtml(text.trim())}</p>`;
  }

  return parts.join('\n');
}

async function convert(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  if (!data.text || !data.text.trim()) {
    throw new Error('No extractable text in PDF');
  }

  const html = `<div class="pdf-content">\n${textToHtml(data.text)}\n</div>`;
  return { html, meta: { pages: data.numpages, converter: name } };
}

module.exports = { name, convert };
