const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function csrfProtection(req, res, next) {
  if (!req.session) {
    return next();
  }

  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }

  res.locals.csrfToken = req.session.csrfToken;

  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token =
    req.body?._csrf ||
    req.headers['x-csrf-token'] ||
    req.query._csrf;

  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}

function csrfFormMiddleware(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

module.exports = { csrfProtection, csrfFormMiddleware, generateToken };
