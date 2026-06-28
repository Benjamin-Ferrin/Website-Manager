const express = require('express');
const renderer = require('../services/renderer');
const pageService = require('../services/pages');
const menuService = require('../services/menu');
const pdfService = require('../services/pdfDocuments');
const { resolveTenant, requireTenant } = require('../middleware/tenant');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Serve template-specific static assets
router.get('/:businessSlug/assets/:filename', resolveTenant, requireTenant, async (req, res) => {
  try {
    const { filename } = req.params;
    const template = req.tenant.template || 'general-diner';
    const templateDir = path.join(__dirname, '../../templates/businesses', template);
    const filePath = path.join(templateDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Asset not found');
    }

    // Set content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.ico': 'image/x-icon',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };
    const contentType = contentTypes[ext] || 'application/octet-stream';

    res.set('Content-Type', contentType);
    res.sendFile(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading asset');
  }
});

router.get('/:businessSlug/pdf/:pdfId', resolveTenant, requireTenant, async (req, res) => {
  try {
    const format = req.query.format || 'html';
    const pdf = await pdfService.getPdfDocument(req.tenant.id, parseInt(req.params.pdfId, 10));

    if (!pdf) {
      return res.status(404).send('PDF not found');
    }

    if (format === 'original') {
      return res.redirect(pdf.public_url);
    }

    res.set('Content-Type', 'text/html');
    const wrapper = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pdf.title}</title>
  <link rel="stylesheet" href="/css/site.css">
</head>
<body class="pdf-view">
  <header class="pdf-view-header">
    <a href="${req.tenantBasePath}/">Back</a>
    <h1>${pdf.title}</h1>
    <nav>
      <a href="?format=html">HTML version</a>
      <a href="?format=original">Original PDF</a>
    </nav>
  </header>
  <main>${pdf.generated_html || '<p>Conversion pending.</p>'}</main>
</body>
</html>`;
    res.send(wrapper);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading PDF');
  }
});

router.get('/:businessSlug/:pageSlug', resolveTenant, requireTenant, async (req, res) => {
  try {
    // Strip .html extension if present
    const pageSlug = req.params.pageSlug.replace(/\.html$/, '');
    const page = await pageService.getPageBySlug(req.tenant.id, pageSlug);
    if (!page) {
      return res.status(404).send('Page not found');
    }

    const menuItems = await menuService.getMenuItems(req.tenant.id);
    const html = await renderer.renderPage({
      business: req.tenant,
      page,
      menuItems,
    });

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error rendering page');
  }
});

router.get('/:businessSlug', resolveTenant, requireTenant, async (req, res) => {
  try {
    const page = await pageService.getHomePage(req.tenant.id);
    if (!page) {
      return res.status(404).send('No pages configured for this business');
    }

    const menuItems = await menuService.getMenuItems(req.tenant.id);
    const html = await renderer.renderPage({
      business: req.tenant,
      page,
      menuItems,
    });

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error rendering page');
  }
});

module.exports = router;
