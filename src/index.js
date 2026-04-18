const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const env = require('./config/env');
const { initDatabase, getDb, save, close, runMigrations } = require('./db');
const { errorHandler } = require('./lib/http');

const authRoutes = require('./modules/auth/routes');
const generationRoutes = require('./modules/generations/routes');
const orderRoutes = require('./modules/orders/routes');
const adminRoutes = require('./modules/admin/routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.allowedOrigins || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => res.json({ success: true, message: 'Ok' }));

// Public routes
app.use('/api/public', require('./modules/auth/routes'));
app.use('/api/providers', require('./modules/providers/index'));
app.use('/api/public/providers', require('./modules/providers/index'));

// Operator routes
app.use('/api/operator', require('./modules/operator/routes'));

// Routes - will be set up after DB init
app.use('/api/auth', authRoutes);
app.use('/api/user', require('./modules/user/routes'));
app.use('/api/user/generations', generationRoutes);
app.use('/api/user/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

async function start() {
  try {
    await initDatabase();
    runMigrations();
    save();
    
    const { db } = require('./db');
    const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
    
    if (userCount > 0) {
      console.log('[Seed] Already seeded');
    } else {
      const { seed } = require('./db/seed');
      seed();
      save();
    }
    
    app.listen(env.port || 3005, () => {
      console.log(`[Server] Running on port ${env.port || 3005}`);
      
      // Check expired subscriptions on startup and every hour
      const { checkExpiredSubscriptions } = require('./services/subscriptions.service');
      try {
        const result = checkExpiredSubscriptions();
        console.log(`[Subscription] Startup check: ${result.checked} expired, ${result.updated} downgraded`);
      } catch (e) {
        console.error('[Subscription] Check error:', e.message);
      }
      
      setInterval(() => {
        try {
          checkExpiredSubscriptions();
        } catch (e) {
          console.error('[Subscription] Check error:', e.message);
        }
      }, 60 * 60 * 1000);
    });
  } catch (e) {
    console.error('[Server] Failed to start:', e);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('[Server] Shutting down...');
  close();
  process.exit(0);
});

start();