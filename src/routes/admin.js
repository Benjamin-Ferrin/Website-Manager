const express = require('express');
const path = require('path');
const { requireAuth, redirectIfAuthenticated } = require('../middleware/auth');
const { csrfFormMiddleware, csrfProtection } = require('../middleware/csrf');
const authService = require('../services/auth');
const businessService = require('../services/business');
const pageService = require('../services/pages');
const contentService = require('../services/content');
const assetService = require('../services/assets');
const menuService = require('../services/menu');
const pdfService = require('../services/pdfDocuments');
const { buildFormFields, renderFormField } = require('../utils/formGenerator');

const router = express.Router();

router.use(csrfFormMiddleware);

router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('admin/login', { error: null });
});

router.post('/login', redirectIfAuthenticated, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await authService.findByEmail(email);
    if (!user || !(await authService.verifyPassword(user, password))) {
      return res.render('admin/login', { error: 'Invalid email or password' });
    }
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.render('admin/login', { error: 'Login failed' });
  }
});

router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

router.get('/', requireAuth, async (req, res) => {
  const businesses = await businessService.getAll();
  res.render('admin/dashboard', { businesses, userEmail: req.session.userEmail });
});

router.get('/businesses/new', requireAuth, (req, res) => {
  res.render('admin/business-form', { business: null, error: null });
});

router.post('/businesses', requireAuth, csrfProtection, async (req, res) => {
  try {
    const { name, slug, domain } = req.body;
    await businessService.create({ name, slug, domain: domain || null });
    res.redirect('/admin');
  } catch (err) {
    res.render('admin/business-form', {
      business: req.body,
      error: err.message,
    });
  }
});

router.get('/businesses/:id', requireAuth, async (req, res) => {
  const business = await businessService.getById(parseInt(req.params.id, 10));
  if (!business) return res.status(404).send('Business not found');

  const pages = await pageService.getPages(business.id);
  const assets = await assetService.getAssets(business.id);
  const pdfs = await pdfService.getPdfDocuments(business.id);

  res.render('admin/business-edit', { business, pages, assets, pdfs });
});

router.post('/businesses/:id', requireAuth, csrfProtection, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    let settings = undefined;
    if (req.body.settings) {
      settings = typeof req.body.settings === 'string'
        ? JSON.parse(req.body.settings)
        : req.body.settings;
    }
    await businessService.update(id, {
      name: req.body.name,
      slug: req.body.slug,
      domain: req.body.domain || null,
      settings,
    });
    res.redirect(`/admin/businesses/${id}`);
  } catch (err) {
    const business = await businessService.getById(id);
    res.render('admin/business-edit', {
      business,
      pages: await pageService.getPages(id),
      assets: await assetService.getAssets(id),
      pdfs: await pdfService.getPdfDocuments(id),
      error: err.message,
    });
  }
});

router.get('/businesses/:id/content', requireAuth, async (req, res) => {
  const businessId = parseInt(req.params.id, 10);
  const business = await businessService.getById(businessId);
  if (!business) return res.status(404).send('Business not found');

  const contentMap = await contentService.getContentMap(businessId, null);
  const fields = buildFormFields(
    Object.fromEntries(
      Object.entries(contentMap).map(([k, v]) => [k, v.value ?? v])
    )
  ).map((f) => ({ ...f, rendered: renderFormField(f) }));

  res.render('admin/content-edit', {
    business,
    page: null,
    fields,
    contentMap,
  });
});

router.post('/businesses/:id/content', requireAuth, csrfProtection, async (req, res) => {
  const businessId = parseInt(req.params.id, 10);
  const submitted = req.body.content || {};

  const updates = {};
  for (const [key, value] of Object.entries(submitted)) {
    if (typeof value === 'object' && value !== null) {
      if (value.href !== undefined) {
        updates[key] = { href: value.href, text: value.text || value.href };
      } else if (value.src !== undefined) {
        updates[key] = { src: value.src, alt: value.alt || '' };
      } else if (value.assetId !== undefined) {
        updates[key] = { assetId: parseInt(value.assetId, 10) };
      } else {
        updates[key] = value;
      }
    } else if (typeof value === 'string' && value.trim().startsWith('{')) {
      try {
        updates[key] = JSON.parse(value);
      } catch {
        updates[key] = value;
      }
    } else {
      updates[key] = value;
    }
  }

  await contentService.updateContent(businessId, null, updates);
  res.redirect(`/admin/businesses/${businessId}/content`);
});

router.get('/businesses/:id/pages/new', requireAuth, async (req, res) => {
  const business = await businessService.getById(parseInt(req.params.id, 10));
  if (!business) return res.status(404).send('Business not found');
  res.render('admin/page-form', { business, page: null, error: null });
});

router.post('/businesses/:id/pages', requireAuth, csrfProtection, async (req, res) => {
  const businessId = parseInt(req.params.id, 10);
  try {
    await pageService.createPage(businessId, {
      slug: req.body.slug,
      title: req.body.title,
      template_path: req.body.template_path,
      sort_order: parseInt(req.body.sort_order || '0', 10),
      is_home: req.body.is_home === 'on',
    });
    res.redirect(`/admin/businesses/${businessId}`);
  } catch (err) {
    const business = await businessService.getById(businessId);
    res.render('admin/page-form', { business, page: req.body, error: err.message });
  }
});

router.get('/businesses/:businessId/pages/:pageId', requireAuth, async (req, res) => {
  const businessId = parseInt(req.params.businessId, 10);
  const pageId = parseInt(req.params.pageId, 10);
  const business = await businessService.getById(businessId);
  const page = await pageService.getPage(businessId, pageId);
  if (!business || !page) return res.status(404).send('Not found');

  res.render('admin/page-form', { business, page, error: null });
});

router.post('/businesses/:businessId/pages/:pageId', requireAuth, csrfProtection, async (req, res) => {
  const businessId = parseInt(req.params.businessId, 10);
  const pageId = parseInt(req.params.pageId, 10);
  try {
    await pageService.updatePage(businessId, pageId, {
      slug: req.body.slug,
      title: req.body.title,
      template_path: req.body.template_path,
      sort_order: parseInt(req.body.sort_order || '0', 10),
      is_home: req.body.is_home === 'on',
    });
    res.redirect(`/admin/businesses/${businessId}`);
  } catch (err) {
    const business = await businessService.getById(businessId);
    const page = await pageService.getPage(businessId, pageId);
    res.render('admin/page-form', { business, page: { ...page, ...req.body }, error: err.message });
  }
});

router.get('/businesses/:businessId/pages/:pageId/content', requireAuth, async (req, res) => {
  const businessId = parseInt(req.params.businessId, 10);
  const pageId = parseInt(req.params.pageId, 10);
  const business = await businessService.getById(businessId);
  const page = await pageService.getPage(businessId, pageId);
  if (!business || !page) return res.status(404).send('Not found');

  const contentMap = await contentService.getContentMap(businessId, pageId);
  const fields = buildFormFields(
    Object.fromEntries(
      Object.entries(contentMap).map(([k, v]) => [k, v.value ?? v])
    )
  ).map((f) => ({ ...f, rendered: renderFormField(f) }));

  res.render('admin/content-edit', { business, page, fields, contentMap });
});

router.post('/businesses/:businessId/pages/:pageId/content', requireAuth, csrfProtection, async (req, res) => {
  const businessId = parseInt(req.params.businessId, 10);
  const pageId = parseInt(req.params.pageId, 10);
  const submitted = req.body.content || {};
  const updates = {};

  for (const [key, value] of Object.entries(submitted)) {
    if (typeof value === 'object' && value !== null) {
      updates[key] = value;
    } else {
      updates[key] = value;
    }
  }

  await contentService.updateContent(businessId, pageId, updates);
  res.redirect(`/admin/businesses/${businessId}/pages/${pageId}/content`);
});

router.get('/businesses/:id/assets', requireAuth, async (req, res) => {
  const businessId = parseInt(req.params.id, 10);
  const business = await businessService.getById(businessId);
  if (!business) return res.status(404).send('Business not found');

  const assets = await assetService.getAssets(businessId);
  const pdfs = await pdfService.getPdfDocuments(businessId);

  res.render('admin/assets', { business, assets, pdfs, message: req.query.message || null });
});

router.post('/businesses/:id/assets', requireAuth, (req, res) => {
  const { upload } = require('../middleware/upload');
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.redirect(`/admin/businesses/${req.params.id}/assets?message=${encodeURIComponent(err.message)}`);
    }

    const token = req.body?._csrf;
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).send('Invalid CSRF token');
    }

    try {
      const businessId = parseInt(req.params.id, 10);
      if (!req.file) {
        return res.redirect(`/admin/businesses/${businessId}/assets?message=No+file+selected`);
      }
      await assetService.saveAsset(businessId, req.file);
      res.redirect(`/admin/businesses/${businessId}/assets?message=Upload+successful`);
    } catch (e) {
      res.redirect(`/admin/businesses/${req.params.id}/assets?message=${encodeURIComponent(e.message)}`);
    }
  });
});

router.get('/businesses/:id/menu', requireAuth, async (req, res) => {
  const businessId = parseInt(req.params.id, 10);
  const business = await businessService.getById(businessId);
  if (!business) return res.status(404).send('Business not found');

  const items = await menuService.getMenuItems(businessId);
  res.render('admin/menu-edit', { business, items });
});

router.post('/businesses/:id/menu', requireAuth, csrfProtection, async (req, res) => {
  const businessId = parseInt(req.params.id, 10);
  const labels = Array.isArray(req.body.label) ? req.body.label : [req.body.label].filter(Boolean);
  const urls = Array.isArray(req.body.url) ? req.body.url : [req.body.url].filter(Boolean);

  const items = labels.map((label, i) => ({
    label,
    url: urls[i] || '/',
    sort_order: i,
  }));

  await menuService.replaceMenu(businessId, items);
  res.redirect(`/admin/businesses/${businessId}/menu`);
});

module.exports = router;
