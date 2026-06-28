require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./src/db/pool');
const config = require('./src/config');
const adminRoutes = require('./src/routes/admin');
const apiRoutes = require('./src/routes/api');
const publicRoutes = require('./src/routes/public');
const authService = require('./src/services/auth');
const fs = require('fs');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/uploads', express.static(config.uploadDir));

fs.mkdirSync(config.uploadDir, { recursive: true });

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: config.sessionMaxAge,
      httpOnly: true,
      sameSite: 'lax',
      secure: config.nodeEnv === 'production',
    },
  })
);

app.use((req, res, next) => {
  res.locals.userEmail = req.session?.userEmail || null;
  next();
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Multi-Tenant CMS</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          line-height: 1.6;
        }
        .container { 
          max-width: 900px; 
          margin: 0 auto; 
          padding: 60px 20px;
        }
        .hero {
          text-align: center;
          color: white;
          margin-bottom: 60px;
        }
        .hero h1 { 
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 20px;
          text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .hero p { 
          font-size: 1.25rem;
          opacity: 0.9;
          margin-bottom: 30px;
        }
        .cta-button {
          display: inline-block;
          background: white;
          color: #667eea;
          padding: 15px 40px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.1rem;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          margin-bottom: 60px;
        }
        .feature-card {
          background: rgba(255,255,255,0.95);
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }
        .feature-card:hover {
          transform: translateY(-5px);
        }
        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 15px;
        }
        .feature-card h3 {
          color: #333;
          margin-bottom: 10px;
          font-size: 1.2rem;
        }
        .feature-card p {
          color: #666;
          font-size: 0.95rem;
        }
        .info-section {
          background: rgba(255,255,255,0.95);
          padding: 40px;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          margin-bottom: 40px;
        }
        .info-section h2 {
          color: #333;
          margin-bottom: 20px;
          font-size: 1.8rem;
        }
        .info-section p {
          color: #666;
          margin-bottom: 15px;
        }
        .info-section ul {
          color: #666;
          padding-left: 20px;
        }
        .info-section li {
          margin-bottom: 8px;
        }
        .footer {
          text-align: center;
          color: rgba(255,255,255,0.8);
          padding-top: 40px;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="hero">
          <h1>Multi-Tenant CMS</h1>
          <p>Manage multiple business websites from a single, powerful platform</p>
          <a href="/admin" class="cta-button">Access Admin Panel</a>
        </div>

        <div class="features">
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </div>
            <h3>Multi-Tenant</h3>
            <p>Host multiple businesses with unique slugs or custom domains from one installation</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <h3>Dynamic Content</h3>
            <p>Edit content directly in the admin panel with support for text, HTML, images, and more</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                <path d="M2 2l7.586 7.586"></path>
                <circle cx="11" cy="11" r="2"></circle>
              </svg>
            </div>
            <h3>Template-Based</h3>
            <p>Create custom HTML templates with editable regions using simple data attributes</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <h3>Asset Management</h3>
            <p>Upload and manage images and PDFs with automatic PDF-to-HTML conversion</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3>Secure</h3>
            <p>Session-based authentication with CSRF protection and tenant data isolation</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </div>
            <h3>Navigation Menus</h3>
            <p>Configure custom navigation menus for each business with ease</p>
          </div>
        </div>

        <div class="info-section">
          <h2>How It Works</h2>
          <p>Each business tenant gets its own dedicated space with:</p>
          <ul>
            <li>Custom pages with unique templates</li>
            <li>Global and page-specific content management</li>
            <li>Dedicated asset library</li>
            <li>Configurable navigation menus</li>
            <li>PDF document support with web viewing</li>
          </ul>
          <p style="margin-top: 20px;">Access your business sites via slug-based URLs like <code>/your-business-slug</code> or configure custom domains for each tenant.</p>
        </div>

        <div class="footer">
          <p>Built with Node.js, Express, and PostgreSQL</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);
app.use('/', publicRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: err.message });
  }
  res.status(500).send('Internal server error');
});

async function start() {
  if (!config.databaseUrl) {
    console.error('DATABASE_URL is required. Copy .env.example to .env');
    process.exit(1);
  }

  try {
    await authService.ensureAdmin(config.adminEmail, config.adminPassword);
  } catch (err) {
    console.warn('Could not ensure admin user (database may not be ready):', err.message);
  }

  app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
    console.log(`Admin panel: http://localhost:${config.port}/admin`);
  });
}

start();
