function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }

  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  return res.redirect('/admin/login');
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/admin');
  }
  next();
}

module.exports = { requireAuth, redirectIfAuthenticated };
