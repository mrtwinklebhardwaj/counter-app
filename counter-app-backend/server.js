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

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
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
    res.status(500).json({ error: 'Setup failed', details: err.message });
  }
});

// Login API
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ userId: user.id });
  } catch (err) {
    console.error('Error in /login:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get today's counter
app.get('/counter', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header required' });
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
    res.status(500).json({ error: 'Failed to get counter' });
  }
});

// Increment counter
app.post('/counter', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header required' });
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
    res.status(500).json({ error: 'Failed to increment counter' });
  }
});

// Reset counter
app.post('/counter/reset', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header required' });
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
    res.status(500).json({ error: 'Failed to reset counter' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});