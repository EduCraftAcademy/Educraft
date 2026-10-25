import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { authenticate } from './server/auth.js';
import authRoutes from './server/routes/auth.js';
import aiRoutes from './server/routes/ai.js';
import subscriptionsRoutes from './server/routes/subscriptions.js';
import classesRoutes from './server/routes/classes.js';
import studentsRoutes from './server/routes/students.js';
import teachersRoutes from './server/routes/teachers.js';
import adminRoutes from './server/routes/admin.js';
import exportsRoutes from './server/routes/exports.js';
import { db } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Global Session / Auth Middleware
  app.use(authenticate);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'EduCraft AI Studio',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/subscriptions', subscriptionsRoutes);
  app.use('/api/classes', classesRoutes);
  app.use('/api/students', studentsRoutes);
  app.use('/api/teachers', teachersRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/exports', exportsRoutes);

  // General curricula & subjects query
  app.get('/api/curricula', (req, res) => {
    const curricula = db.get('curricula');
    res.json({ success: true, curricula });
  });

  // Notifications endpoint
  app.get('/api/notifications', (req: any, res) => {
    const user = req.user;
    if (!user) return res.json({ success: true, notifications: [] });
    const notifications = db.get('notifications').filter(n => n.userId === user.id);
    res.json({ success: true, notifications });
  });

  app.post('/api/notifications/:id/read', (req: any, res) => {
    const { id } = req.params;
    db.update(data => {
      const notif = data.notifications.find(n => n.id === id);
      if (notif) notif.read = true;
    });
    res.json({ success: true });
  });

  // Vite integration in dev or static files in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 EduCraft AI Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start EduCraft server:', err);
  process.exit(1);
});
