import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { ALLOWED_ORIGINS } from './constants/serverConstants.js';
import connectDB from './db.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';


dotenv.config();

const PORT = process.env.PORT || 5000;
const API_VERSION_1 = "/api/v1/";

const app = express();

app.set("trust proxy", 1);

const configureSecurityMiddleware = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: [
          "'self'",
          "ws:",
          "wss:",
          "https://tickyourtour.duckdns.org",
          "https://tytfaceserver.duckdns.org",
          "https://tyt-crm-frontend-v1.vercel.app",
          "http://127.0.0.1:8000",
          "http://localhost:8000",
          "https://*.duckdns.org",
          "http://*.duckdns.org"
        ],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  });
};

const configureCORSMiddleware = () => {
  return cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or postman)
      if (!origin) return callback(null, true);

      // Check if origin is explicitly in our ALLOWED_ORIGINS list
      if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // Reject requests from non-allowed origins
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    credentials: true,
  });
};

const configurePerformanceMonitoring = () => {
  return (req, res, next) => {
    const start = process.hrtime.bigint(); // Start high-resolution timer in nanoseconds

    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const ms = Number(end - start) / 1_000_000; // Convert nanoseconds difference to milliseconds

      // Log if response is slow (>300ms) and not just a static asset
      if (ms > 300 && !req.path.startsWith('/static/')) {
        console.log(`🐌 Slow API: ${req.method} ${req.originalUrl} - ${ms.toFixed(2)}ms`);
      }
    });
    next();
  };
};

const configureRateLimiter = () => {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 100, // Limit each IP to 100 requests per `window` (1 min)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      success: false,
      message: "Too many requests from this IP, please try again later."
    }
  });
};

const configureCompression = () => {
  return compression({
    level: 6, // Optimization level (balance between CPU and size)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      // Skip compression if the client specifically requests it via header
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Fallback to standard compression filter logic
      return compression.filter(req, res);
    }
  });
};

app.use(configureSecurityMiddleware());
app.use(configureCORSMiddleware());
app.use(configurePerformanceMonitoring());
app.use(configureRateLimiter());
app.use(configureCompression());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public', { maxAge: '1d' }));


// Connect to Database
connectDB();


app.get('/', (_, res) => {
  res.json({ success: true, message: 'Server is running fine!' });
});

const routes = [
  {
    path: `${API_VERSION_1}auth`,
    router: authRoutes
  },
  {
    path: `${API_VERSION_1}projects`,
    router: projectRoutes
  }
]

routes.forEach((route) => {
  app.use(route.path, route.router);
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});