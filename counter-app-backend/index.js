const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const bodyParser = require('body-parser')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const app = express()
app.use(cors())
app.use(bodyParser.json())

// Default user setup
app.get('/setup', async (req, res) => {
  const hashed = bcrypt.hashSync('admin', 10)
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', password: hashed }
  })
  res.send('Default user created')
})

// Login API
app.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  res.json({ userId: user.id })
})

// Get today's counter
app.get('/counter', async (req, res) => {
  const userId = req.headers['x-user-id']
  const today = new Date().toISOString().split('T')[0]
  let counter = await prisma.counter.findFirst({ where: { userId, date: new Date(today) } })

  if (!counter) {
    counter = await prisma.counter.create({ data: { userId, date: new Date(today), count: 0 } })
  }

  res.json({ count: counter.count })
})

// Increment counter
app.post('/counter', async (req, res) => {
  const userId = req.headers['x-user-id']
  const today = new Date().toISOString().split('T')[0]
  let counter = await prisma.counter.findFirst({ where: { userId, date: new Date(today) } })

  if (!counter) {
    counter = await prisma.counter.create({ data: { userId, date: new Date(today), count: 0 } })
  }

  const updated = await prisma.counter.update({
    where: { id: counter.id },
    data: { count: counter.count + 1 }
  })

  res.json({ count: updated.count })
})

const PORT = 5000
app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`))
