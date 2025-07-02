import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5050;

// ✅ More flexible CORS config
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://naam-jap.codeaurkahani.com',
      'https://www.naam-jap.codeaurkahani.com',
      'http://localhost:3000', // for local development
      'http://localhost:5173', // for Vite dev server
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For development/testing, you might want to allow all origins temporarily
    // Uncomment the line below for debugging (remove in production)
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-id', 'Authorization'],
  credentials: true,
};

// ✅ Enable CORS for all requests
app.use(cors(corsOptions));

// ✅ Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// ✅ Add body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Add a simple health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Naam Jap Backend API is running!', 
    timestamp: new Date().toISOString(),
    routes: ['/setup', '/login', '/counter']
  });
});

// ✅ Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Default user setup
app.get('/setup', async (req, res) => {
  try {
    console.log('Setup route accessed');
    const hashed = bcrypt.hashSync('admin', 10);
    const user = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: { email: 'admin@example.com', password: hashed },
    });
    console.log('User created or already exists:', user.email);
    res.json({ 
      message: 'Default user created/updated successfully',
      user: { id: user.id, email: user.email },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error in /setup:', err);
    res.status(500).json({ 
      error: 'Setup failed', 
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Login API
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ userId: user.id });
  } catch (err) {
    console.error('Error in /login:', err);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// Get today's counter
app.get('/counter', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    let counter = await prisma.counter.findFirst({ 
      where: { userId: parseInt(userId), date: new Date(today) } 
    });

    if (!counter) {
      counter = await prisma.counter.create({ 
        data: { userId: parseInt(userId), date: new Date(today), count: 0 } 
      });
    }

    res.json({ count: counter.count });
  } catch (err) {
    console.error('Error in GET /counter:', err);
    res.status(500).json({ error: 'Failed to get counter', details: err.message });
  }
});

// Increment counter
app.post('/counter', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    let counter = await prisma.counter.findFirst({ 
      where: { userId: parseInt(userId), date: new Date(today) } 
    });

    if (!counter) {
      counter = await prisma.counter.create({ 
        data: { userId: parseInt(userId), date: new Date(today), count: 0 } 
      });
    }

    const updated = await prisma.counter.update({
      where: { id: counter.id },
      data: { count: counter.count + 1 }
    });

    res.json({ count: updated.count });
  } catch (err) {
    console.error('Error in POST /counter:', err);
    res.status(500).json({ error: 'Failed to increment counter', details: err.message });
  }
});

// Reset counter
app.post('/counter/reset', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }
    
    const today = new Date().toISOString().split('T')[0];

    const existing = await prisma.counter.findFirst({ 
      where: { userId: parseInt(userId), date: new Date(today) } 
    });

    if (existing) {
      await prisma.counter.update({
        where: { id: existing.id },
        data: { count: 0 },
      });
    }

    res.json({ message: 'Counter reset successfully' });
  } catch (err) {
    console.error('Error in POST /counter/reset:', err);
    res.status(500).json({ error: 'Failed to reset counter', details: err.message });
  }
});

// ✅ 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.originalUrl,
    method: req.method 
  });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/`);
});

// ✅ Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});