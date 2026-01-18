const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const adminRoutes = require('./routes/admin');

const app = express();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Apply rate limiting to all requests
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
    whitelist: ['sort', 'page', 'limit', 'fields']
}));

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Database connection with retry logic
const connectWithRetry = () => {
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/banner-earn', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    })
    .then(() => {
        console.log('✅ MongoDB connected successfully');
        
        // Check if admin user exists
        createAdminUser();
    })
    .catch((err) => {
        console.error(`❌ MongoDB connection error: ${err.message}`);
        console.log('⏳ Retrying connection in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

// Create default admin user if not exists
const User = require('./models/User');
const createAdminUser = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@bannerearn.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
        
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (!existingAdmin) {
            const adminUser = new User({
                name: 'Administrator',
                email: adminEmail,
                password: adminPassword,
                isAdmin: true,
                walletBalance: 0
            });
            
            await adminUser.save();
            console.log('✅ Default admin user created');
            console.log(`📧 Email: ${adminEmail}`);
            console.log('🔑 Password: Admin@123 (Please change immediately)');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// API documentation endpoint
app.get('/api-docs', (req, res) => {
    res.json({
        message: 'Banner Earn API Documentation',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/profile',
                updateProfile: 'PUT /api/auth/profile'
            },
            wallet: {
                click: 'POST /api/wallet/click',
                balance: 'GET /api/wallet/balance',
                withdraw: 'POST /api/wallet/withdraw',
                withdrawals: 'GET /api/wallet/withdrawals',
                clicks: 'GET /api/wallet/clicks'
            },
            admin: {
                users: 'GET /api/admin/users',
                withdrawals: 'GET /api/admin/withdrawals',
                updateWithdrawal: 'PUT /api/admin/withdrawals/:id',
                stats: 'GET /api/admin/stats'
            }
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Cannot find ${req.originalUrl} on this server!`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('🔥 Error:', err);
    
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('🔥 UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    
    // Gracefully shutdown server
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully');
    server.close(() => {
        console.log('💥 Process terminated');
    });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});

module.exports = server;