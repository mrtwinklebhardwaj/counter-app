import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5050;

// Simple CORS - allow all origins for testing
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-id', 'Authorization'],
}));

app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    routes: ['/setup', '/login', '/counter'],
    env: process.env.NODE_ENV || 'development'
  });
});

// Database health check
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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
      message: 'Default user created successfully',
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    console.error('Error in /setup:', err);
    res.status(500).json({ 
      error: 'Setup failed', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Login API
app.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('User found:', user ? { id: user.id, email: user.email } : 'No user');
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ userId: user.id });
  } catch (err) {
    console.error('Error in /login:', err);
    res.status(500).json({ 
      error: 'Login failed', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get today's counter
app.get('/counter', async (req, res) => {
  try {
    console.log('GET /counter - Headers:', req.headers);
    
    const userId = req.headers['x-user-id'];
    console.log('userId from header:', userId);
    
    if (!userId) {
      console.log('Missing x-user-id header');
      return res.status(400).json({ 
        error: 'x-user-id header is required',
        receivedHeaders: Object.keys(req.headers)
      });
    }
    
    // Validate userId is a number
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      console.log('Invalid userId - not a number:', userId);
      return res.status(400).json({ error: 'x-user-id must be a valid number' });
    }
    
    console.log('Parsed userId:', userIdNum);
    
    const today = new Date().toISOString().split('T')[0];
    console.log('Today date:', today, 'as Date object:', new Date(today));
    
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userIdNum } });
    if (!user) {
      console.log('User not found with ID:', userIdNum);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('User found:', { id: user.id, email: user.email });
    
    let counter = await prisma.counter.findFirst({ 
      where: { 
        userId: userIdNum, 
        date: new Date(today) 
      } 
    });
    console.log('Existing counter:', counter);

    if (!counter) {
      console.log('Creating new counter for today');
      counter = await prisma.counter.create({ 
        data: { 
          userId: userIdNum, 
          date: new Date(today), 
          count: 0 
        } 
      });
      console.log('New counter created:', counter);
    }

    res.json({ count: counter.count });
  } catch (err) {
    console.error('Error in GET /counter:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: 'Failed to get counter', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Increment counter
app.post('/counter', async (req, res) => {
  try {
    console.log('POST /counter - Headers:', req.headers);
    
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }
    
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: 'x-user-id must be a valid number' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    let counter = await prisma.counter.findFirst({ 
      where: { 
        userId: userIdNum, 
        date: new Date(today) 
      } 
    });

    if (!counter) {
      counter = await prisma.counter.create({ 
        data: { 
          userId: userIdNum, 
          date: new Date(today), 
          count: 0 
        } 
      });
    }

    const updated = await prisma.counter.update({
      where: { id: counter.id },
      data: { count: counter.count + 1 }
    });

    console.log('Counter incremented:', updated);
    res.json({ count: updated.count });
  } catch (err) {
    console.error('Error in POST /counter:', err);
    res.status(500).json({ 
      error: 'Failed to increment counter', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Reset counter
app.post('/counter/reset', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }
    
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: 'x-user-id must be a valid number' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const existing = await prisma.counter.findFirst({ 
      where: { 
        userId: userIdNum, 
        date: new Date(today) 
      } 
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
    res.status(500).json({ 
      error: 'Failed to reset counter', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});