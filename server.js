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
  res.redirect('/admin');
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
