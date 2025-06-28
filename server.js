const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const connectDb = require('./config/db');

// Connect DB
connectDb();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tokens', require('./routes/tokenRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Error middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Listening to PORT: ${PORT}`);
});