const express = require('express');

const cors = require('cors');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// ✅ Swagger config
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pharma API',
      version: '1.0.0',
    },
    servers: [
      { url: process.env.NODE_ENV === 'production' ? 'https://pharma-api-flame.vercel.app' : `http://localhost:${process.env.PORT || 5000}` },
      { url: 'https://pharma-api-flame.vercel.app' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js',
  ],
}));

// ✅ Analytics tracking middleware
const apiAnalyticsTracker = require('./middleware/apiAnalyticsTracker');
const protectNonGet = require('./middleware/protectNonGet');

// Removed mongoose connection logic

// ✅ Middleware: track API calls globally (non-blocking, after response)
app.use(apiAnalyticsTracker);

// ✅ كل الطرق ما عدا GET / HEAD / OPTIONS تحتاج JWT — ما عدا POST /api/auth/*
app.use(protectNonGet);

// ✅ Routes
const authRoutes      = require('./routes/auth');
const adminAuthRoutes = require('./routes/adminAuth');
const productRoutes   = require('./routes/products');
const categoryRoutes  = require('./routes/categories');
const brandRoutes     = require('./routes/brands');
const messageRoutes   = require('./routes/messages');
const analyticsRoutes = require('./routes/analytics');
const productAnalyticsRoutes = require('./routes/productAnalyticsRoutes');
const orderRoutes     = require('./routes/orderRoutes'); 

app.use('/api/auth',       authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands',     brandRoutes);
app.use('/api/messages',   messageRoutes);
app.use('/api/analytics',  analyticsRoutes);
app.use('/api/product-analytics', productAnalyticsRoutes);
app.use('/api/orders',     orderRoutes); 

app.get('/', (req, res) => res.send('Server is running!'));

// ✅ Serverless export — بدل app.listen
module.exports = app;