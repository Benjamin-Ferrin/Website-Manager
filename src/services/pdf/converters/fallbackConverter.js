const path = require('path');

const name = 'fallback-embed';

async function convert(filePath, context = {}) {
  const fileName = path.basename(filePath);
  const publicUrl = context.publicUrl || `/uploads/${fileName}`;

  const html = `
<div class="pdf-fallback">
  <p class="pdf-fallback-notice">PDF preview could not be fully converted. Showing embedded original.</p>
  <iframe src="${publicUrl}" title="PDF document" class="pdf-embed" width="100%" height="600"></iframe>
  <p><a href="${publicUrl}" download>Download original PDF</a></p>
</div>`.trim();

  return {
    html,
    meta: { converter: name, fallback: true },
    status: 'failed',
  };
}

module.exports = { name, convert };
