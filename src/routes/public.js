const express = require('express');
const renderer = require('../services/renderer');
const pageService = require('../services/pages');
const menuService = require('../services/menu');
const pdfService = require('../services/pdfDocuments');
const { resolveTenant, requireTenant } = require('../middleware/tenant');

const router = express.Router();

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
    const page = await pageService.getPageBySlug(req.tenant.id, req.params.pageSlug);
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
