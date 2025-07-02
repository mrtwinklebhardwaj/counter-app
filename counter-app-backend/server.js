import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5050;

// ✅ CORS config
const corsOptions = {
  origin: [
    'https://naam-jap.codeaurkahani.com',
    'https://www.naam-jap.codeaurkahani.com',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-id'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

app.use(bodyParser.json());

// ✅ Root route to test Render live deployment
app.get('/', (req, res) => {
  res.send('✅ Naam-Jap Backend is Live!');
});

// ✅ /setup (create default user)
app.get('/setup', async (req, res) => {
  try {
    const hashed = bcrypt.hashSync('admin', 10);
    const user = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: { email: 'admin@example.com', password: hashed },
    });
    console.log('User created or already exists:', user.email);
    res.send('Default user created');
  } catch (err) {
    console.error('Error in /setup:', err);
    res.status(500).send('Setup failed');
  }
});

// ✅ /login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ userId: user.id });
});

// ✅ /counter (GET)
app.get('/counter', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const today = new Date().toISOString().split('T')[0];

  let counter = await prisma.counter.findFirst({
    where: { userId, date: new Date(today) },
  });

  if (!counter) {
    counter = await prisma.counter.create({
      data: { userId, date: new Date(today), count: 0 },
    });
  }

  res.json({ count: counter.count });
});

// ✅ /counter (POST to increment)
app.post('/counter', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const today = new Date().toISOString().split('T')[0];

  let counter = await prisma.counter.findFirst({
    where: { userId, date: new Date(today) },
  });

  if (!counter) {
    counter = await prisma.counter.create({
      data: { userId, date: new Date(today), count: 0 },
    });
  }

  const updated = await prisma.counter.update({
    where: { id: counter.id },
    data: { count: counter.count + 1 },
  });

  res.json({ count: updated.count });
});

// ✅ /counter/reset
app.post('/counter/reset', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const today = new Date().toISOString().split('T')[0];

  const existing = await prisma.counter.findFirst({
    where: { userId, date: new Date(today) },
  });

  if (existing) {
    await prisma.counter.update({
      where: { id: existing.id },
      data: { count: 0 },
    });
  }

  res.json({ message: 'Counter reset' });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
