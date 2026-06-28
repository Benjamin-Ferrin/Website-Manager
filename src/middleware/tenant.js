const businessService = require('../services/business');

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'uploads',
  'public',
  'favicon.ico',
  'robots.txt',
]);

async function resolveTenant(req, res, next) {
  const host = req.hostname.toLowerCase();

  if (host !== 'localhost' && host !== '127.0.0.1') {
    const byDomain = await businessService.getByDomain(host);
    if (byDomain) {
      req.tenant = byDomain;
      req.tenantBasePath = '';
      return next();
    }
  }

  const slug = req.params.businessSlug;
  if (slug && !RESERVED_SLUGS.has(slug)) {
    const bySlug = await businessService.getBySlug(slug);
    if (bySlug) {
      req.tenant = bySlug;
      req.tenantBasePath = `/${bySlug.slug}`;
      return next();
    }
  }

  return next();
}

async function requireTenant(req, res, next) {
  if (!req.tenant) {
    return res.status(404).send('Business not found');
  }
  next();
}

module.exports = { resolveTenant, requireTenant, RESERVED_SLUGS };
