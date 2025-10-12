const dotenv = require('dotenv');
// Load node.env first (may contain placeholders), then load .env to override with real keys
dotenv.config({ path: __dirname + '/node.env' });
dotenv.config();
const verificationStore = {}; // in-memory store for email verification codes
const { createVerificationEmailTemplate } = require('./emailTemplates');
const jwt = require('jsonwebtoken');

// JWT Secret Key (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Helper function to generate JWT token with 6 months expiration
const generateToken = (userId, userType) => {
  return jwt.sign(
    { 
      userId: userId, 
      userType: userType,
      loginTime: new Date().toISOString()
    },
    JWT_SECRET,
    { expiresIn: '6m' } // 6 months
  );
};

// Helper function to verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Helper to resolve the frontend base URL for links in emails
// Priority: explicit env FRONTEND_URL -> request Origin header -> referer origin -> default http://localhost:5173
const getFrontendBaseUrl = (req) => {
  let fromEnv = process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim();
  if (fromEnv) {
    // Normalize double slashes and trailing slash
    fromEnv = fromEnv.replace(/\/{2,}/g, '/');
    if (fromEnv.endsWith('/')) fromEnv = fromEnv.slice(0, -1);
    return fromEnv;
  }
  const origin = (req.headers && (req.headers.origin || req.headers.referer)) || "";
  try {
    if (origin) {
      const url = new URL(origin);
      return `${url.protocol}//${url.host}`;
    }
  } catch (_) {}
  return "http://localhost:5173";
};

// Helper function to check and manage free trial for users
const checkFreeTrial = async (userId) => {
  try {
    const user = await User.findById(userId).lean();
    if (!user) return { canPost: false, message: "User not found" };
    
    // If user has canPostAds, they can post
    if (user.canPostAds) {
      return { canPost: true, message: "User has posting permissions" };
    }
    
    // Check if user has used free trial
    if (user.freeTrialUsed) {
      // Check if free trial is still active (within 5 minutes)
      if (user.freeTrialEndTime && new Date() < user.freeTrialEndTime) {
        return { canPost: true, message: "Free trial is active" };
      } else {
        return { canPost: false, message: "Free trial expired. Payment required." };
      }
    }
    
    // User hasn't used free trial yet, start it now
    const now = new Date();
    const freeTrialEndTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
    
    await User.findByIdAndUpdate(userId, {
      freeTrialUsed: true,
      freeTrialStartTime: now,
      freeTrialEndTime: freeTrialEndTime
    });
    
    return { canPost: true, message: "Free trial started for 5 minutes" };
  } catch (error) {
    console.error("Error checking free trial:", error);
    return { canPost: false, message: "Error checking free trial" };
  }
};

// Helper function to check and manage free trial for sellers
const checkSellerFreeTrial = async (sellerId) => {
  try {
    const seller = await Seller.findById(sellerId).lean();
    if (!seller) return { canPost: false, message: "Seller not found" };
    
    // If seller has canPostAds, they can post
    if (seller.canPostAds) {
      return { canPost: true, message: "Seller has posting permissions" };
    }
    
    // Check if seller has used free trial
    if (seller.freeTrialUsed) {
      // Check if free trial is still active (within 5 minutes)
      if (seller.freeTrialEndTime && new Date() < seller.freeTrialEndTime) {
        return { canPost: true, message: "Free trial is active" };
      } else {
        return { canPost: false, message: "Free trial expired. Payment required." };
      }
    }
    
    // Seller hasn't used free trial yet, start it now
    const now = new Date();
    const freeTrialEndTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
    
    await Seller.findByIdAndUpdate(sellerId, {
      freeTrialUsed: true,
      freeTrialStartTime: now,
      freeTrialEndTime: freeTrialEndTime
    });
    
    return { canPost: true, message: "Free trial started for 5 minutes" };
  } catch (error) {
    console.error("Error checking seller free trial:", error);
    return { canPost: false, message: "Error checking seller free trial" };
  }
};

// Email configuration helper
const getEmailConfig = () => ({
  user: process.env.EMAIL_USER || "inquiriesesa@gmail.com",
  pass: process.env.EMAIL_PASS || "dmsfmhyxafbvnbgb",
  from: process.env.EMAIL_FROM || "Prime Net Farmer <inquiriesesa@gmail.com>"
});
require("dotenv").config({ path: "node.env" });
require('dotenv').config();
const ADMIN_ID = "admin@gmail.com"; // only admin
const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");
const bcrypt = require("bcrypt");
const AppModel = require("./models/App");
const WorkUpload = require("./models/workupload");
// Stripe mode diagnostics endpoint
// This helps verify whether live or test keys are loaded at runtime
// Safe: only exposes prefix and last 4 for debugging
try {
  const express = require("express");
  if (typeof app !== 'undefined' && app && app.get) {
    app.get('/stripe-mode', (req, res) => {
      const pk = process.env.STRIPE_PUBLISHABLE_KEY || '';
      const sk = process.env.STRIPE_SECRET_KEY || '';
      const mode = sk.startsWith('sk_live_') ? 'live' : (sk.startsWith('sk_test_') ? 'test' : 'unknown');
      res.json({
        mode,
        publishableKeyPreview: pk ? `${pk.slice(0, 10)}...${pk.slice(-6)}` : '',
        secretKeyPreview: sk ? `${sk.slice(0, 7)}...${sk.slice(-6)}` : ''
      });
    });
  }
} catch (_) {}
//////
const InformationBox = require("./models/informationBox");
const Service = require("./models/Service"); // ya sahi path jo aapka model hai
const Event = require("./models/Event");
const http = require("http");
const crypto = require("crypto");
const SellerModelProfile = require("./models/sellerdetailsmodel");
const router = express.Router();
const Stripe = require("stripe");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bodyParser = require("body-parser");
const ForgotPassword = require("./models/ForgotPassword");
const Ad = require("./models/Ad");
///
const mongoose = require("mongoose");
const cors = require("cors");
const Seller = require("./models/Seller");
const Message = require("./models/Message");
//const SellerDetails = require("./models/SellerDetails");

// const { createPaymentIntent } = require('./models/paymentModel'); // Removed - using direct Stripe calls
const DeltaPayment = require("./models/DeltaPayment");
const Payment = require("./models/Payment"); // FIXED: Added missing Payment model import
const City = require("./models/City");
const Product = require("./models/Prodct");
const Booking = require("./models/Booking");
const ServiceProvider = require("./models/Serviceprovider");
const Category = require("./models/Category");
const User = require("./models/User");
const Request = require("./models/Request");
const SellerRating = require("./models/SellerRating");
const app = express();


app.use(express.urlencoded({ extended: true })); 

const { dbConnection, isConnected } = require("./db/conn");
const jwtToken = require("jsonwebtoken");
const port = process.env.PORT || 3000;
const static_path = path.join(__dirname, "../public");
app.use(express.static(static_path));

// Serve uploaded files from uploads directory
const uploads_path = path.join(__dirname, "uploads");
app.use('/uploads', express.static(uploads_path));

// Strict CORS for production with proper preflight handling
const allowedOrigins = [
  (process.env.FRONTEND_URL || '').replace(/\/$/, ''),
  'https://www-pnf.com',
  'https://www.pnf.com',
  'https://pnf.vercel.app',
  'https://pnf-frontend.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
].filter(Boolean);

const corsOptions = {
  origin: function(origin, callback) {
    console.log('🔍 CORS Check - Origin:', origin);
    console.log('🔍 CORS Check - Allowed Origins:', allowedOrigins);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('🔍 CORS Check - No origin, allowing');
      return callback(null, true);
    }
    
    const clean = origin.replace(/\/$/, '');
    console.log('🔍 CORS Check - Clean origin:', clean);
    
    // Allow all localhost and 127.0.0.1 ports for development
    if (clean.includes('localhost') || clean.includes('127.0.0.1')) {
      console.log('🔍 CORS Check - Localhost detected, allowing');
      return callback(null, true);
    }
    
    // Check against allowed origins
    if (allowedOrigins.includes(clean)) {
      console.log('🔍 CORS Check - Origin allowed:', clean);
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked origin:', origin);
    console.log('❌ Clean origin:', clean);
    console.log('❌ Not in allowed origins list');
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Accept',
    'Authorization',
    'Origin',
    'X-Requested-With',
    'email',
    'password',
    'X-Owner-Id'
  ]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Additional CORS middleware for Vercel deployment
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('🔍 Additional CORS middleware - Origin:', origin);
  
  if (origin && allowedOrigins.includes(origin.replace(/\/$/, ''))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, Origin, X-Requested-With, email, password, X-Owner-Id');
  }
  
  if (req.method === 'OPTIONS') {
    console.log('🔍 Handling OPTIONS request');
    return res.sendStatus(200);
  }
  
  next();
});
// Fallback headers for any route not covered (defensive)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin.replace(/\/$/, ''))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, Origin, X-Requested-With, email, password, X-Owner-Id');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});
app.use(express.json({ limit: '5mb' }));
///////////
// Attach io to req

/////////////
app.get("/", (req, res) => {
  res.send("Hello from me");
});

// Test endpoint to check Cloudinary configuration
app.get("/test-cloudinary", (req, res) => {
  const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                 process.env.CLOUDINARY_API_KEY && 
                                 process.env.CLOUDINARY_API_SECRET &&
                                 process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';
  
  const cloudinaryConfig = {
    cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
    api_key: !!process.env.CLOUDINARY_API_KEY,
    api_secret: !!process.env.CLOUDINARY_API_SECRET,
    cloud_name_value: process.env.CLOUDINARY_CLOUD_NAME,
    is_configured: isCloudinaryConfigured
  };
  
  res.json({
    message: "Cloudinary configuration status",
    config: cloudinaryConfig,
    status: isCloudinaryConfigured ? "OK" : "MISSING_CONFIG",
    recommendation: isCloudinaryConfigured ? "File uploads should work" : "Use image URLs only until Cloudinary is configured"
  });
});

// Test endpoint for category creation
app.post("/test-category", async (req, res) => {
  try {
    const { Title, image } = req.body;
    console.log("Test category request:", { Title, image });
    
    if (!Title) {
      return res.status(400).json({ message: "Title is required" });
    }
    
    if (!image) {
      return res.status(400).json({ message: "Image URL is required" });
    }
    
    res.json({ 
      message: "Test successful", 
      data: { Title, image },
      status: "OK"
    });
  } catch (error) {
    console.error("Test category error:", error);
    res.status(500).json({ 
      message: "Test failed", 
      error: error.message 
    });
  }
});

// Simple test to verify verification store is working







  
 // Simple test to verify verification store is working
app.get("/test-verification-store", (req, res) => {
  verificationStore["test@example.com"] = {
    code: "123456",
    expires: Date.now() + 10 * 60 * 1000
  };

  res.json({
    message: "Test verification code added",
    verificationStore,
    timestamp: new Date().toISOString()
  });
});

// Temporary debug endpoint for verification store
app.get("/check-verification-store", (req, res) => {
  res.json({
    verificationStore,
    keys: Object.keys(verificationStore),
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to manually add a verification code
app.post("/test-add-verification", (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Email and code required" });
  }

  verificationStore[email] = {
    code,
    expires: Date.now() + 10 * 60 * 1000
  };

  console.log("=== TEST VERIFICATION CODE ADDED ===", verificationStore);

  res.json({
    success: true,
    message: "Test verification code added",
    verificationStore
  });
});

// Simple endpoint to add verification code for your email
app.post("/add-verification-for-umar", (req, res) => {
  const email = "umargul692002@gmail.com";
  const code = "123456";

  verificationStore[email] = {
    code,
    expires: Date.now() + 10 * 60 * 1000
  };

  res.json({
    success: true,
    message: `Verification code ${code} added for ${email}`,
    email,
    code
  });
});

// Universal verification endpoint that always works
app.post("/verify-any-code", (req, res) => {
  const { email, code } = req.body;

  console.log("=== UNIVERSAL VERIFICATION ===", { email, code });

  res.json({
    success: true,
    message: `Code ${code} for ${email} accepted (universal mode)`
  });
});

// Test endpoint to check verification store
app.get("/test-verification-store", (req, res) => {
  console.log("=== TEST VERIFICATION STORE ===");
  console.log("Current verification store:", verificationStore);
  console.log("Store keys:", Object.keys(verificationStore));
  
  res.json({
    success: true,
    verificationStore: verificationStore,
    keys: Object.keys(verificationStore),
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for payment
app.get("/test-payment", (req, res) => {
  console.log("=== TEST PAYMENT ENDPOINT ===");
  res.json({
    success: true,
    message: "Payment endpoint is working",
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to send email
app.post("/test-send-email", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  
  try {
    const emailConfig = getEmailConfig();
    console.log("Test email config:", { user: emailConfig.user, pass: emailConfig.pass ? "***" : "NOT_SET", from: emailConfig.from });
    
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
    },
      tls: {
        rejectUnauthorized: false
    }
  });

    const { htmlTemplate, textTemplate } = createVerificationEmailTemplate("Test User", "123456", email);

    const attachments = (process.env.APP_logopnf_INLINE || "").toLowerCase() === "true" ? [
      {
        filename: "logopnf.png",
        path: path.join(__dirname, "../src/assets/logopnf.png"),
        cid: "app-logopnf"
    }
    ] : [];

    await transporter.sendMail({
      from: emailConfig.from,
      to: email,
      subject: "🔐 Test Email - Prime Net Farmer!",
      text: textTemplate,
      html: htmlTemplate,
      attachments
  });

    res.json({ 
      success: true, 
      message: "Test email sent successfully!",
      email: email
  });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send test email",
      error: error.message
  });
  }
});


// Test Stripe connection
app.get("/test-stripe", async (req, res) => {
  try {
    console.log('=== TESTING STRIPE CONNECTION ===');
    console.log('Stripe secret key available:', !!process.env.STRIPE_SECRET_KEY);
    console.log('Stripe secret key starts with:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...' : 'NOT SET');
    
    // Test Stripe connection by retrieving account info
    const account = await stripe.accounts.retrieve();
    console.log('Stripe account retrieved:', account.id);
    
    res.json({
      success: true,
      message: "Stripe connection successful",
      account: {
        id: account.id,
        country: account.country,
        default_currency: account.default_currency
    }
  });
  } catch (error) {
    console.error('Stripe connection test failed:', error);
    res.status(500).json({
      success: false,
      message: "Stripe connection failed",
      error: error.message,
      errorType: error.type,
      errorCode: error.code
  });
  }
});

const verifyTokenMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: Token is missing" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: Invalid token" });
  }
};
const Subproduct = require("./models/Subproduct");

const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token || !token.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. Token missing or invalid format." });
  }

  const tokenWithoutBearer = token.substring(7); // Remove "Bearer " prefix

  try {
    const decoded = jwt.verify(tokenWithoutBearer, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token." });
  }
};
app.post("/signup", async (req, res) => {
  try {
    const { Name, password, email, phoneNumber, zipCode, country, city, heardFrom,referenceName, } = req.body;

    // 🔍 Debug: frontend se kya aaya
    console.log("📩 Signup Request Body:", req.body);

    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
  });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already registered" });
    } else if (existingUser.phoneNumber === phoneNumber) {
        return res.status(400).json({ message: "Phone number already registered" });
    }
  }

    // ✅ Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      Name,
      password: hashedPassword,
      country,
      city,
      email,
      phoneNumber,
      zipCode,
      heardFrom, 
      referenceName,
  });

    // 🔍 Debug: DB me save hone se pehle object
    console.log("📝 New User Object:", newUser);

    await newUser.save();

    // 🔍 Debug: confirm save
    console.log("✅ User Saved with heardFrom:", newUser.heardFrom);

    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("❌ Signup Error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});


//////////////////////////////
///////////////////////////
////seller side



app.post("/seller-signup", async (req, res) => {
  try {
    let {
      Name,
      password,
      email,
      phoneNumber,
      categoryId,
      productId,
      city,
      subproductId,
      country,
      zipCode,
      experience,
      details,
      heardFrom, 
      referenceName,
  } = req.body;

    // agar empty hai to "Other"
    if (!heardFrom || heardFrom.trim() === "") {
      heardFrom = "Other";
  }

    // check duplicate user
    const existingUser = await Seller.findOne({
      $or: [{ email }, { phoneNumber }],
  });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already registered" });
    } else if (existingUser.phoneNumber === phoneNumber) {
        return res.status(400).json({ message: "Phone number already registered" });
    }
  }

    // ✅ password hashing
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Seller({
      Name,
      city,
      country,
      password: hashedPassword,
      email,
      category: categoryId,
      product: productId,
      phoneNumber,
      subproduct: subproductId,
      zipCode,
      experience,
      details,
      heardFrom,
      referenceName,
  });

    console.log("📩 Seller Signup Body:", req.body);
    console.log("📝 New Seller Object:", newUser);

    await newUser.save();

    res.status(200).json({ 
      success: true, 
      message: "Seller registered successfully",
      sellerId: newUser._id,
      name: newUser.Name
    });
  } catch (error) {
    console.error("❌ Seller Signup Error:", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
});


// Shared handler for sending verification code
const handleSendVerificationCode = async (req, res) => {
  const { email, userName = "Valued User" } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // store code (in-memory) with expiration (10 minutes)
  verificationStore[email] = {
    code: code,
    expires: Date.now() + 10 * 60 * 1000 // 10 minutes
  };

  console.log("=== EMAIL VERIFICATION CODE SENT ===");
  console.log("Email:", email);
  console.log("Code:", code);
  console.log("Expires at:", new Date(verificationStore[email].expires));
  console.log("Verification store keys:", Object.keys(verificationStore));

  // Try to send email
  try {
    const emailConfig = getEmailConfig();
    console.log("Email config:", { user: emailConfig.user, pass: emailConfig.pass ? "***" : "NOT_SET", from: emailConfig.from });
    
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
    },
      tls: {
        rejectUnauthorized: false
    }
  });

    // Get professional email templates
    const { htmlTemplate, textTemplate } = createVerificationEmailTemplate(userName, code, email);
    console.log("Email template generated:", { 
      htmlLength: htmlTemplate.length, 
      textLength: textTemplate.length,
      code: code 
  });

    console.log("Attempting to send email...");
    console.log("Email details:", {
      from: emailConfig.from,
      to: email,
      subject: "🔐 Verify Your Email - Welcome to Prime Net Farmer!"
  });
    
    const attachments = (process.env.APP_logopnf_INLINE || "").toLowerCase() === "true" ? [
      {
        filename: "logopnf.png",
        path: path.join(__dirname, "../src/assets/logopnf.png"),
        cid: "app-logopnf"
    }
    ] : [];
    
    const emailResult = await transporter.sendMail({
      from: emailConfig.from,
      to: email,
      subject: "🔐 Verify Your Email - Welcome to Prime Net Farmer!",
      text: textTemplate,
      html: htmlTemplate,
      attachments
  });

    console.log("Email sent successfully!", emailResult);
    res.json({ 
      success: true, 
      message: "Verification code sent to your email successfully!",
      expiresIn: "10 minutes",
      emailResult: emailResult.messageId
  });
  } catch (emailError) {
    console.error("Email sending error:", emailError);
    console.error("Error details:", emailError.message);
    
    // Even if email fails, the code is already stored, so we can still return success
    res.json({ 
      success: true, 
      message: "Verification code generated successfully! (Email may not have been sent)",
      code: code, // Return the code for testing if email fails
      expiresIn: "10 minutes",
      warning: "Email sending failed, but code is available for verification"
  });
  }
};






// ------------------- Multer -------------------
///////////////////////////////
///////////////////////////////
////////////////////////////////////
//////////////////////////////////
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// Cloudinary config with placeholder safety
const normalizeValue = (v) => (v && !/^(your_|YOUR_)/.test(String(v))) ? v : '';
const CLOUDINARY_CLOUD_NAME = normalizeValue(process.env.CLOUDINARY_CLOUD_NAME);
const CLOUDINARY_API_KEY = normalizeValue(process.env.CLOUDINARY_API_KEY);
const CLOUDINARY_API_SECRET = normalizeValue(process.env.CLOUDINARY_API_SECRET);

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
);

let storage;
if (isCloudinaryConfigured) {
  // Use Cloudinary storage
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "user_ads",
      allowed_formats: ["jpg", "png", "jpeg"],
    },
  });
} else {
  // Use local storage when Cloudinary is not configured
  console.log("Cloudinary not configured, using local storage for file uploads");
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const upload = multer({ storage }); // use this in routes
// Seller Login


app.post("/seller-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find seller by email
    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(400).json({ success: false, message: "Seller not found" });
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    // Check trial and subscription status
    const hasUsedTrial = seller.hasUsedTrial || false;
    const trialCompleted = seller.trialCompleted || false;
    const hasActiveSubscription = seller.hasActiveSubscription || false;
    const subscriptionStartDate = seller.subscriptionStartDate;
    const subscriptionEndDate = seller.subscriptionEndDate;
    const trialStartDate = seller.trialStartDate;
    const trialEndDate = seller.trialEndDate;
    const trialSelected = seller.trialSelected || false;

    // Check if 6-month trial has expired
    const isTrialExpired = (() => {
      if (!trialSelected || !trialStartDate) return false; // No trial selected yet
      
      const now = new Date();
      if (trialEndDate) {
        return now > new Date(trialEndDate);
      }
      
      // Fallback: calculate 6 months from start date
      const trialStart = new Date(trialStartDate);
      const sixMonthsFromStart = new Date(trialStart);
      sixMonthsFromStart.setMonth(sixMonthsFromStart.getMonth() + 6);
      
      return now > sixMonthsFromStart;
    })();

    // Check if monthly subscription has expired
    const isSubscriptionExpired = (() => {
      if (!hasActiveSubscription || !subscriptionEndDate) return true;
      const now = new Date();
      return now > new Date(subscriptionEndDate);
    })();

    // Check account status and deactivate if trial expired
    let accountActive = seller.accountActive !== false; // Default to true if not set
    let updatedHasUsedTrial = hasUsedTrial;
    let updatedTrialCompleted = trialCompleted;
    
    if (isTrialExpired && !hasActiveSubscription && accountActive && trialSelected) {
      // Deactivate account after 6 months if no subscription and trial was selected
      await Seller.findByIdAndUpdate(seller._id, {
        accountActive: false,
        accountDeactivatedAt: new Date(),
        trialCompleted: true,
        hasUsedTrial: true
      });
      accountActive = false;
      updatedHasUsedTrial = true;
      updatedTrialCompleted = true;
      console.log('Account deactivated due to expired trial:', seller._id);
    }

    // Block login if trial expired and no active subscription
    if (isTrialExpired && !hasActiveSubscription) {
      return res.status(403).json({ 
        success: false, 
        message: "Your 6-month trial has expired. Please pay $10 for 1 month access to continue.",
        requiresPayment: true,
        trialExpired: true,
        trialStartDate: trialStartDate,
        trialEndDate: trialEndDate,
        subscriptionRequired: true
      });
    }

    // Generate JWT token for 6 months
    const token = generateToken(seller._id, "SELLER");
    
    // ✅ Return sellerId with trial and subscription info + JWT token
    res.json({
      success: true,
      message: "Login successful",
      sellerId: seller._id,
      name: seller.Name,
      userType: "SELLER",
      token: token, // JWT token for 6 months
      tokenExpiry: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 6 months from now
      hasUsedTrial: updatedHasUsedTrial,
      trialCompleted: updatedTrialCompleted,
      hasActiveSubscription: hasActiveSubscription && !isSubscriptionExpired,
      subscriptionStartDate: subscriptionStartDate,
      subscriptionEndDate: subscriptionEndDate,
      isSubscriptionExpired: isSubscriptionExpired,
      trialStartDate: trialStartDate,
      trialEndDate: trialEndDate,
      isTrialExpired: isTrialExpired,
      accountActive: accountActive,
      trialSelected: trialSelected,
      // Additional info for frontend
      trialDuration: "6 months",
      subscriptionDuration: "1 month",
      subscriptionPrice: "$10"
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create subscription payment session for seller
app.post('/create-subscription-checkout-session', async (req, res) => {
  try {
    const { sellerId, email } = req.body;
    
    if (!sellerId || !email) {
      return res.status(400).json({ success: false, message: "Seller ID and email are required" });
    }
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Seller Subscription - 1 Month Access',
            description: '1 month access to seller dashboard and all features',
          },
          unit_amount: 1000, // $10.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription-success?sellerId=${sellerId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription-cancel`,
      metadata: {
        sellerId: sellerId,
        type: 'subscription'
      }
    });
    
    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    res.status(500).json({ success: false, message: 'Failed to create subscription session' });
  }
});

// Activate seller subscription after successful payment
app.post('/activate-seller-subscription', async (req, res) => {
  try {
    const { sellerId } = req.body;
    
    if (!sellerId) {
      return res.status(400).json({ success: false, message: "Seller ID is required" });
    }
    
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }
    
    // Activate subscription for 1 month
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    
    await Seller.findByIdAndUpdate(sellerId, {
      hasActiveSubscription: true,
      subscriptionStartDate: subscriptionStartDate,
      subscriptionEndDate: subscriptionEndDate,
      accountActive: true,
      trialCompleted: true,
      hasUsedTrial: true,
      canPostAds: true,
      canPostEvents: true,
      postCredits: 10
    });
    
    console.log('Seller subscription activated:', sellerId);
    
    res.json({
      success: true,
      message: "Subscription activated successfully for 1 month",
      subscriptionStartDate: subscriptionStartDate,
      subscriptionEndDate: subscriptionEndDate,
      subscriptionDuration: "1 month",
      subscriptionPrice: "$10",
      canPostAds: true,
      canPostEvents: true,
      postCredits: 10
    });
  } catch (error) {
    console.error("Activate subscription error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Start free trial for seller
app.post('/start-free-trial', async (req, res) => {
  try {
    const { sellerId } = req.body;
    
    if (!sellerId) {
      return res.status(400).json({ success: false, message: "Seller ID is required" });
    }
    
    // Check if seller already selected trial
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }
    
    if (seller.trialSelected) {
      return res.status(400).json({ success: false, message: "Free trial already started" });
    }
    
    // Start the free trial for 6 months
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setMonth(trialEndDate.getMonth() + 6); // 6 months from now
    
    const updatedSeller = await Seller.findByIdAndUpdate(sellerId, {
      trialSelected: true,
      trialStartDate: trialStartDate,
      trialEndDate: trialEndDate,
      hasUsedTrial: true,
      trialCompleted: false,
      accountActive: true,
      canPostAds: true,
      canPostEvents: true,
      postCredits: 10
    }, { new: true });
    
    console.log('6-month free trial started for seller:', sellerId);
    console.log('Trial start date:', trialStartDate);
    console.log('Trial end date:', trialEndDate);
    
    res.json({
      success: true,
      message: "6-month free trial started successfully",
      trialStartDate: trialStartDate.toISOString(),
      trialEndDate: trialEndDate.toISOString(),
      trialDuration: "6 months",
      trialSelected: updatedSeller.trialSelected,
      canPostAds: true,
      canPostEvents: true,
      postCredits: 10
    });
  } catch (error) {
    console.error("Start free trial error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Data repair endpoint to fix inconsistent seller data
app.post('/repair-seller-data', async (req, res) => {
  try {
    const { sellerId } = req.body;
    
    if (!sellerId) {
      return res.status(400).json({ success: false, message: "Seller ID is required" });
    }
    
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }
    
    console.log('Repairing seller data for:', sellerId);
    console.log('Current data:', {
      accountActive: seller.accountActive,
      hasUsedTrial: seller.hasUsedTrial,
      trialSelected: seller.trialSelected,
      trialStartDate: seller.trialStartDate,
      trialCompleted: seller.trialCompleted
    });
    
    // Fix data inconsistencies
    let updates = {};
    
    // If account is deactivated but trial was never used, mark trial as used
    if (!seller.accountActive && !seller.hasUsedTrial && !seller.hasActiveSubscription) {
      updates.hasUsedTrial = true;
      updates.trialCompleted = true;
      console.log('Fixed: Marked trial as used for deactivated account');
    }
    
    // If trial was selected but no start date, set a default start date
    if (seller.trialSelected && !seller.trialStartDate) {
      updates.trialStartDate = new Date();
      console.log('Fixed: Set trial start date');
    }
    
    if (Object.keys(updates).length > 0) {
      const updatedSeller = await Seller.findByIdAndUpdate(sellerId, updates, { new: true });
      console.log('Seller data repaired:', updates);
      
      res.json({
        success: true,
        message: "Seller data repaired successfully",
        updates: updates,
        seller: {
          accountActive: updatedSeller.accountActive,
          hasUsedTrial: updatedSeller.hasUsedTrial,
          trialSelected: updatedSeller.trialSelected,
          trialStartDate: updatedSeller.trialStartDate,
          trialCompleted: updatedSeller.trialCompleted
        }
      });
    } else {
      res.json({
        success: true,
        message: "No data inconsistencies found",
        seller: {
          accountActive: seller.accountActive,
          hasUsedTrial: seller.hasUsedTrial,
          trialSelected: seller.trialSelected,
          trialStartDate: seller.trialStartDate,
          trialCompleted: seller.trialCompleted
        }
      });
    }
  } catch (error) {
    console.error("Repair seller data error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update seller trial and subscription status
app.post("/update-seller-trial-status", async (req, res) => {
  try {
    const { sellerId, hasUsedTrial, trialCompleted, hasActiveSubscription, subscriptionStartDate } = req.body;

    const updateData = {};
    if (hasUsedTrial !== undefined) updateData.hasUsedTrial = hasUsedTrial;
    if (trialCompleted !== undefined) updateData.trialCompleted = trialCompleted;
    if (hasActiveSubscription !== undefined) updateData.hasActiveSubscription = hasActiveSubscription;
    if (subscriptionStartDate !== undefined) updateData.subscriptionStartDate = subscriptionStartDate;

    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      updateData,
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    res.json({
      success: true,
      message: "Trial status updated successfully",
      seller: {
        hasUsedTrial: seller.hasUsedTrial,
        trialCompleted: seller.trialCompleted,
        hasActiveSubscription: seller.hasActiveSubscription,
        subscriptionStartDate: seller.subscriptionStartDate
      }
    });
  } catch (error) {
    console.error("Update trial status error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

////////////////////

app.post("/seller-update-profile" , async (req,res)=>{
  const {sellerId , Name , email, phoneNumber , details,documentationURL, demoURL  } = req.body
  console.log(sellerId , Name , email, phoneNumber , details, documentationURL, demoURL )
  console.log("hello")
  try{
    const seller = await Seller.findById(sellerId);
    const updatedSeller = await Seller.findByIdAndUpdate(sellerId , {
      Name:Name ||  seller.Name,
      email : email || seller.email ,
      phoneNumber: phoneNumber || seller.phoneNumber,
      details:details|| seller.details,
      documentationURL:documentationURL || seller.documentationURL,
      demoURL: demoURL || seller.demoURL
  },{new:true}) ;
    res.status(201).json(updatedSeller);
  }
  catch(error){
    res.status(400).json(error)
  }
});
app.post("/buyer-update-profile" , async (req,res)=>{
  const {sellerId , Name , email, phoneNumber  } = req.body
  console.log(sellerId , Name , email, phoneNumber  )
  console.log("hello")
  try{
    const seller = await User.findById(sellerId);
    const updatedSeller = await User.findByIdAndUpdate(sellerId , {
      Name:Name ||  seller.Name,
      email : email || seller.email ,
      phoneNumber: phoneNumber || seller.phoneNumber,
  },{new:true}) ;
    res.status(201).json(updatedSeller);
  }
  catch(error){
    res.status(400).json(error)
  }
});
app.delete("/delete-seller/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSeller = await Seller.findByIdAndDelete(id);

    if (!deletedSeller) {
      return res.status(404).json({ message: "Seller not found" });
  }

    res.status(200).json({ message: "Seller deleted successfully" });
  } catch (error) {
    console.error("Error deleting seller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log(user)

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid User" });
  }

    if (user.isDeleted) {
      return res
        .status(403)
        .json({ success: false, message: "User account is deactivated" });
  }

    // ✅ Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch for user:", user.email);
      return res
        .status(401)
        .json({ success: false, message: "Invalid Password" });
  }

    let payStatus;
    if (user && user.isDeleted === false) {
      try {
        payStatus = await Payment.findOne({ userId: user._id, expired: false });
        // console.log(status.isPaid);
    } catch (error) {
        console.error("Error fetching payment status:", error);
    }
  }

    res.status(200).json({
      success: true,
      message: "Login successful",
      userId: user._id,
      userType: user.userType,
      name: user.Name,
      token: "buyer-token-" + user._id, // Simple token for buyer
      payStatus: payStatus,
  });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
});
// Token verification endpoint
app.post("/verify-token", async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
    
    // Get user details based on user type
    let userDetails = null;
    if (decoded.userType === "SELLER") {
      userDetails = await Seller.findById(decoded.userId);
    } else {
      userDetails = await User.findById(decoded.userId);
    }
    
    if (!userDetails) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.json({
      success: true,
      message: "Token is valid",
      user: {
        userId: decoded.userId,
        userType: decoded.userType,
        name: userDetails.Name,
        loginTime: decoded.loginTime
      }
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//////////////////
app.post("/logopnfut", (req, res) => {
  // Assuming the token is sent in the Authorization header
  const authToken = req.headers.authorization;

  if (!authToken) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: No token provided" });
  }

  // Here, you would perform any additional validation or processing related to logging out
  // For example, you might revoke the token, update the user's status, etc.

  // Respond with a success message
  res.status(200).json({ success: true, message: "logopnfut successful" });
});
app.get("/check-auth", authenticateToken, (req, res) => {
  // If the code reaches here, it means the user is authenticated
  // You can return additional user information if needed
  res.json({ isAuthenticated: true, userId: req.userId });
});
app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "This is a protected route.", userId: req.userId });
});
app.post("/city", async (req, res) => {
  try {
    const { cityname } = req.body;
    const newCity = new City({
      cityname,
  });

    await newCity.save();

    res.status(200).json({ message: "City registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});
//////////////////////////////////
app.get("/users", async (req, res) => {
  try {
    const allusers = await User.find({}); // Query all cities and project only the 'cityname' field
    res.status(200).json(allusers);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching cities" });
  }
});
app.get("/getallsellers", async (req, res) => {
  try {
    console.log("🔍 Fetching all sellers with populated references");
    
    // Populate category, product, and subproduct references - Same as getseller endpoint
    const allusers = await Seller.find({})
      .populate("category", "Title name")
      .populate("product", "name Title")
      .populate("subproduct", "Title name");
    
    console.log("📊 All sellers fetched:", allusers.length);
    console.log("📊 Sample seller data:", allusers[0] ? {
      name: allusers[0].Name,
      subproduct: allusers[0].subproduct,
      category: allusers[0].category,
      product: allusers[0].product
    } : "No sellers found");
    
    res.status(200).json(allusers);
  } catch (error) {
    console.error("❌ Error fetching all sellers:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching sellers" });
  }
});
app.get("/getseller/:userId", async (req, res) => {
  console.log("🔍 Fetching seller with populated references")
  try {
    const id = req.params.userId;
    console.log("Seller ID:", id)
    
    // Populate category, product, and subproduct references
    const seller = await Seller.findById(id)
      .populate("category", "Title name")
      .populate("product", "name Title")
      .populate("subproduct", "Title name");
    
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }
    
    console.log("✅ Seller found with populated data:", {
      name: seller.Name,
      category: seller.category?.Title || seller.category?.name,
      product: seller.product?.name || seller.product?.Title,
      subproduct: seller.subproduct?.Title || seller.subproduct?.name,
      image: seller.image,
      profileImage: seller.profileImage,
      allFields: Object.keys(seller.toObject())
    });
    
    res.status(200).json(seller);
  } catch (error) {
    console.error("❌ Error fetching seller:", error);
    res.status(500).json({ message: "An error occurred while fetching seller" });
  }
});
//////////////////
app.post("/messages", async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;
    const newMessage = new Message({ sender, receiver, message });
    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/messages/:userId/:sellerId", async (req, res) => {
  try {
    const { userId, sellerId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: sellerId },
        { sender: sellerId, receiver: userId },
      ],
  }).sort({ createdAt: 1 }); // Use 'createdAt' instead of 'timestamp'

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/cities", async (req, res) => {
  try {
    const cities = await City.find({}, "cityname"); // Query all cities and project only the 'cityname' field
    res.status(200).json(cities);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching cities" });
  }
});
app.post("/services", async (req, res) => {
  try {
    const { name } = req.body;
    const newServices = new Services({
      name,
  });

    await newServices.save();

    res.status(200).json({ message: "Services registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});
app.get("/services", async (req, res) => {
  try {
    const services = await Services.find({}, "name"); // Query all cities and project only the 'cityname' field
    res.status(200).json(services);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching cities" });
  }
});
app.post("/serviceprovider", async (req, res) => {
  try {
    // Extract data from the request body
    const {
      Name,
      email,
      phoneNumber,
      city,
      product,
      location,
      distance,
      availability,
  } = req.body;
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(400).json({ message: "Invalid product ID" });
  }
    // Create a new Serviceprovider instance
    const serviceprovider = new ServiceProvider({
      Name,
      email,
      phoneNumber,
      city,
      product,
      location,
      distance,
      availability,
  });

    // Save the data to the database
    await serviceprovider.save();

    res.status(201).json({ message: "Location data saved successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while saving location data" });
  }
});
app.get("/serviceprovider", async (req, res) => {
  try {
    const Services = await ServiceProvider.find(
      {},
      "Name email phoneNumber city category location distance availability"
    ); // Query all cities and project only the 'cityname' field
    res.status(200).json(Services);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching cities" });
  }
});
// Category endpoints with image upload support
app.post("/Category", (req, res, next) => {
  // Check if Cloudinary is properly configured
  const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                 process.env.CLOUDINARY_API_KEY && 
                                 process.env.CLOUDINARY_API_SECRET &&
                                 process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';
  
  if (isCloudinaryConfigured) {
    // Use multer middleware for file upload
    upload.single("image")(req, res, next);
  } else {
    // Skip multer middleware, just parse the body
    next();
  }
}, async (req, res) => {
  try {
    const { Title } = req.body;
    if (!Title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Handle image - check if Cloudinary is configured
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                   process.env.CLOUDINARY_API_KEY && 
                                   process.env.CLOUDINARY_API_SECRET &&
                                   process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';
    
    let imageUrl = "";
    if (isCloudinaryConfigured) {
      // Cloudinary is configured, use uploaded file
      if (req.file) {
        imageUrl = req.file.path; // Cloudinary URL
      } else if (req.body.image) {
        imageUrl = req.body.image; // Fallback to URL input
      } else {
        return res.status(400).json({ message: "Image is required" });
      }
    } else {
      // Cloudinary not configured, expect URL in request body
      if (req.body.image) {
        imageUrl = req.body.image; // Use image URL from request body
      } else {
        return res.status(400).json({ 
          message: "Image URL is required. Please provide an image URL in the 'image' field." 
        });
      }
    }

    let existingCategory = await Category.findOne({ Title });

    if (existingCategory) {
      if (existingCategory.isDeleted) {
        // If the existing category is marked as deleted, update it to set isDeleted to false
        existingCategory.isDeleted = false;
        existingCategory.image = imageUrl;
        await existingCategory.save();
        return res
          .status(200)
          .json({ message: "Category already existed and is now restored" });
      } else {
        return res.status(400).json({ message: "Category already registered" });
      }
    }

    const newCategory = new Category({
      Title,
      image: imageUrl,
    });

    await newCategory.save();

    res.status(200).json({ message: "Category registered successfully" });
  } catch (error) {
    console.error("Category creation error:", error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Provide more specific error messages
    if (error.message && error.message.includes("Cloudinary")) {
      return res.status(500).json({ 
        message: "Image upload failed. Please check your image and try again." 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Invalid data provided: " + Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({ 
      message: "An error occurred while creating category",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Bulk upload categories
app.post("/Category/bulk", upload.array("images", 50), async (req, res) => {
  try {
    const { categories } = req.body;
    const categoriesData = JSON.parse(categories);
    
    if (!Array.isArray(categoriesData)) {
      return res.status(400).json({ message: "Categories must be an array" });
    }

    const results = [];
    for (let i = 0; i < categoriesData.length; i++) {
      const category = categoriesData[i];
      let imageUrl = "";
      
      if (req.files && req.files[i]) {
        imageUrl = req.files[i].path;
      } else if (category.image) {
        imageUrl = category.image;
      }

      try {
        const existingCategory = await Category.findOne({ Title: category.Title });
        if (existingCategory && !existingCategory.isDeleted) {
          results.push({ 
            title: category.Title, 
            status: "skipped", 
            message: "Already exists" 
          });
          continue;
        }

        const newCategory = new Category({
          Title: category.Title,
          image: imageUrl,
        });

        await newCategory.save();
        results.push({ 
          title: category.Title, 
          status: "success", 
          message: "Created successfully" 
        });
      } catch (err) {
        results.push({ 
          title: category.Title, 
          status: "error", 
          message: err.message 
        });
      }
    }

    res.status(200).json({ 
      message: "Bulk upload completed", 
      results 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred during bulk upload" });
  }
});
app.get("/Category", async (req, res) => {
  try {
    const Services = await Category.find({ isDeleted: false }); // Query categories where isDeleted is false
    res.status(200).json(Services);
  } catch (error) {
    console.error("Categories fetch error:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching categories" });
  }
});

app.get("/Category/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
  }

    res.status(200).json(category);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching category by ID" });
  }
});
// Product endpoints with image upload support
app.post("/product", (req, res, next) => {
  // Check if Cloudinary is properly configured
  const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                 process.env.CLOUDINARY_API_KEY && 
                                 process.env.CLOUDINARY_API_SECRET &&
                                 process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';
  
  if (isCloudinaryConfigured) {
    // Use multer middleware for file upload
    upload.single("image")(req, res, next);
  } else {
    // Skip multer middleware, just parse the body
    next();
  }
}, async (req, res) => {
  try {
    const { name, categoryId } = req.body;
    console.log(name, categoryId);

    if (!name || !categoryId) {
      return res.status(400).json({ message: "Name and categoryId are required" });
    }

    // Handle image - check if Cloudinary is configured
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                   process.env.CLOUDINARY_API_KEY && 
                                   process.env.CLOUDINARY_API_SECRET &&
                                   process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';
    
    let imageUrl = "";
    if (isCloudinaryConfigured) {
      // Cloudinary is configured, use uploaded file
      if (req.file) {
        imageUrl = req.file.path; // Cloudinary URL
      } else if (req.body.image) {
        imageUrl = req.body.image; // Fallback to URL input
      } else {
        return res.status(400).json({ message: "Image is required" });
      }
    } else {
      // Cloudinary not configured, expect URL in request body
      if (req.body.image) {
        imageUrl = req.body.image; // Use image URL from request body
      } else {
        return res.status(400).json({ 
          message: "Image URL is required. Please provide an image URL in the 'image' field." 
        });
      }
    }

    // Check if the categoryId exists in the Category model
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    // Check if a product with the same name already exists
    const existingProduct = await Product.findOne({ name, category: categoryId });
    if (existingProduct) {
      return res.status(400).json({ message: "Product already registered" });
    }

    const newProduct = new Product({
      name,
      category: categoryId,
      image: imageUrl,
    });

    await newProduct.save();

    res.status(200).json({ message: "Product registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Test endpoint
app.get("/test-bulk", (req, res) => {
  res.json({ message: "Bulk endpoint test successful" });
});

// Simple bulk test endpoint
app.post("/api/test-bulk", (req, res) => {
  console.log("Simple bulk test endpoint hit");
  console.log("Request body:", req.body);
  res.json({ message: "Simple bulk test successful", received: req.body });
});

// Bulk upload products
app.post("/product/bulk", (req, res, next) => {
  // Check if Cloudinary is properly configured
  const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                 process.env.CLOUDINARY_API_KEY && 
                                 process.env.CLOUDINARY_API_SECRET &&
                                 process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';
  
  if (isCloudinaryConfigured) {
    // Use multer middleware for file upload
    upload.array("images", 50)(req, res, next);
  } else {
    // Skip multer middleware, just parse the body
    next();
  }
}, async (req, res) => {
  try {
    console.log("Bulk upload endpoint hit");
    console.log("Request body:", req.body);
    const { products } = req.body;
    const productsData = JSON.parse(products);
    
    if (!Array.isArray(productsData)) {
      return res.status(400).json({ message: "Products must be an array" });
    }

    const results = [];
    let imageIndex = 0;
    
    // Check if Cloudinary is configured
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                   process.env.CLOUDINARY_API_KEY && 
                                   process.env.CLOUDINARY_API_SECRET &&
                                   process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';

    for (let i = 0; i < productsData.length; i++) {
      const product = productsData[i];
      let imageUrl = "";
      
      if (isCloudinaryConfigured) {
        // Cloudinary is configured, use uploaded files
        if (req.files && req.files[imageIndex]) {
          imageUrl = req.files[imageIndex].path;
          imageIndex++;
        } else if (product.image) {
          imageUrl = product.image;
        } else {
          imageUrl = "https://via.placeholder.com/300x200?text=No+Image";
        }
      } else {
        // Cloudinary not configured, use image URLs from request body
        if (product.image) {
          imageUrl = product.image;
        } else {
          imageUrl = "https://via.placeholder.com/300x200?text=No+Image";
        }
      }

      try {
        // Check if category exists
        const categoryExists = await Category.findById(product.categoryId);
        if (!categoryExists) {
          results.push({ 
            name: product.name, 
            status: "error", 
            message: "Invalid category ID" 
          });
          continue;
        }

        // Check if product already exists
        const existingProduct = await Product.findOne({ 
          name: product.name, 
          category: product.categoryId 
        });
        if (existingProduct) {
          results.push({ 
            name: product.name, 
            status: "skipped", 
            message: "Already exists" 
          });
          continue;
        }

        const newProduct = new Product({
          name: product.name,
          category: product.categoryId,
          image: imageUrl,
        });

        await newProduct.save();
        results.push({ 
          name: product.name, 
          status: "success", 
          message: "Created successfully" 
        });
      } catch (err) {
        results.push({ 
          name: product.name, 
          status: "error", 
          message: err.message 
        });
      }
    }

    res.status(200).json({ 
      message: "Bulk upload completed", 
      results 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred during bulk upload" });
  }
});

// Simplified bulk upload products with category names
app.post("/api/product/bulk-simple", (req, res, next) => {
  // Check if Cloudinary is properly configured
  const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                 process.env.CLOUDINARY_API_KEY && 
                                 process.env.CLOUDINARY_API_SECRET &&
                                 process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';
  
  if (isCloudinaryConfigured) {
    // Use multer middleware for file upload
    upload.array("images", 50)(req, res, next);
  } else {
    // Skip multer middleware, just parse the body
    next();
  }
}, async (req, res) => {
  try {
    console.log("Bulk-simple upload endpoint hit");
    console.log("Request body:", req.body);
    const { products } = req.body;
    const productsData = JSON.parse(products);
    
    if (!Array.isArray(productsData)) {
      return res.status(400).json({ message: "Products must be an array" });
    }

    const results = [];
    let imageIndex = 0;

    for (let i = 0; i < productsData.length; i++) {
      const product = productsData[i];
      let imageUrl = "";
      
      // Handle image assignment
      if (req.files && req.files[imageIndex]) {
        imageUrl = req.files[imageIndex].path;
        imageIndex++;
      } else if (product.image) {
        imageUrl = product.image;
      } else {
        imageUrl = "https://via.placeholder.com/300x200?text=No+Image";
      }

      try {
        // Find category by name
        const category = await Category.findOne({ 
          Title: { $regex: new RegExp(`^${product.categoryName}$`, 'i') },
          isDeleted: false 
        });
        
        if (!category) {
          results.push({ 
            name: product.name, 
            status: "error", 
            message: `Category "${product.categoryName}" not found` 
          });
          continue;
        }

        // Check if product already exists
        const existingProduct = await Product.findOne({ 
          name: product.name, 
          category: category._id 
        });
        if (existingProduct) {
          results.push({ 
            name: product.name, 
            status: "skipped", 
            message: "Already exists" 
          });
          continue;
        }

        const newProduct = new Product({
          name: product.name,
          category: category._id,
          image: imageUrl,
        });

        await newProduct.save();
        results.push({ 
          name: product.name, 
          status: "success", 
          message: `Created successfully in ${category.Title}` 
        });
      } catch (err) {
        results.push({ 
          name: product.name, 
          status: "error", 
          message: err.message 
        });
      }
    }

    res.status(200).json({ 
      message: "Bulk upload completed", 
      results 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred during bulk upload" });
  }
});
app.get("/product", async (req, res) => {
  try {
    const categoryId = req.query.categoryId;

    // Create a filter object to use in the query
    const filter = categoryId ? { category: categoryId, isDeleted: false } : {};

    // Fetch products based on the filter
    const products = await Product.find(filter);

    res.status(200).json(products);
  } catch (error) {
    console.error("Product fetch error:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching products" });
  }
});
app.get("/product/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
  }

    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching product by ID" });
  }
});
app.put('/product/:id', upload.single("image"), async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, categoryId } = req.body;

    // Handle image upload
    let imageUrl = "";
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary URL
    } else if (req.body.image) {
      imageUrl = req.body.image; // Fallback to URL input
    } else {
      return res.status(400).json({ message: "Image is required" });
    }

    // Validate if categoryId exists
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    // Check if another product with the same name and category exists (exclude current product)
    const existingProduct = await Product.findOne({ 
      name, 
      category: categoryId, 
      _id: { $ne: productId } 
    });
    if (existingProduct) {
      return res.status(400).json({ message: 'Another product with this name already exists in this category' });
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        name,
        category: categoryId,
        image: imageUrl,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating product' });
  }
});

app.get("/category/:categoryId/products", async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    // Check if the category exists
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found" });
  }

    // Fetch products for the specified category
    const products = await Product.find({
      category: categoryId,
      isDeleted: false,
  });

    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post("/seller-form", async (req, res) => {
  try {
    const { category, product, location, address } = req.body;
    const newUser = new Sellerform({
      category,
      location,
      product,
      address,
  });
    await newUser.save();
    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});
app.get("/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    console.log('=== FETCHING USER/SELLER DETAILS ===');
    console.log('User ID:', userId);

    // Check if the user ID is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
  }

    // First try to find as a seller
    let user = await Seller.findById(userId).lean();
    let isSeller = true;
    
    // If not found as seller, try as regular user
    if (!user) {
      user = await User.findById(userId).lean();
      isSeller = false;
    }

    if (!user) {
      console.log('User/Seller not found for ID:', userId);
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
  }

    console.log('Found user/seller:', { isSeller, postCredits: user.postCredits || 0 });
    
    // Return all user details including credits
    res.status(200).json({ 
      success: true, 
      user: user, 
      postCredits: user.postCredits || 0,
      isSeller: isSeller
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
});
app.get("/getallsellers/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if the user ID is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
  }

    // Fetch user details by ID
    const user = await Seller.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
  }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
});
app.post("/api/logopnfut", (req, res) => {
  const authToken = req.headers.authorization;

  if (!authToken) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(authToken, JWT_SECRET);
    // Additional checks, if needed...

    // If everything is fine, perform logopnfut operations
    // ...

    res.status(200).json({ message: "logopnfut successful" });
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
});
app.post("/bookings", async (req, res) => {
  try {
    const { userId, productId, sellerId } = req.body;
    // Create a new booking
    console.log("Booking request received:", req.body);
    console.log("Seller email:", req.body.sellerEmail);
    console.log("Buyer ID (userId):", req.body.userId);
    
    // Create booking with proper field mapping
    const bookingData = {
      user: req.body.userId,  // Map userId to user field (ObjectId reference)
      seller: req.body.sellerId,  // Map sellerId to seller field (ObjectId reference)
      product: req.body.productId,  // Map productId to product field (ObjectId reference)
      buyerName: req.body.buyerName,
      buyerEmail: req.body.buyerEmail,
      buyerContact: req.body.buyerContact,
      description: req.body.description,
      serviceName: req.body.serviceName,
      sellerName: req.body.sellerName,
      sellerEmail: req.body.sellerEmail
    };
    
    console.log("Booking data to create:", bookingData);
    
    const newBooking = await Booking.create(bookingData)
  
  console.log("Created booking:", newBooking);
  console.log("Booking user field:", newBooking.user);
    // SEND EMAIL ...................
    // Only send email if sellerEmail exists and is valid
    if (req.body.sellerEmail && req.body.sellerEmail.trim() !== '') {
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        // service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || "inquiriesesa@gmail.com",
          pass: process.env.EMAIL_PASS || "vdaqhaybecipeldj",
        },
      });

      // Email options
      let mailOptions = {
        from: process.env.EMAIL_FROM || "Prime Net Farmer <inquiriesesa@gmail.com>",
        to: req.body.sellerEmail,
        subject: "You Have Recieved A New Booking",
        text: `
        Hello ${req.body.sellerName},

        You have received a new booking for your service. Please review the detail on your dashboard and take necessary actions accordingly.
        Thank you for your cooperation.`,
      };

      // Send the email (don't send response here, just log)
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Email sending error:", error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    } else {
      console.log("No seller email provided, skipping email notification");
    }
    // SEND EMAIL END ...................
    
    // Send single response
    res.status(201).json(newBooking);

  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
app.get("/bookings", async (req, res) => {
  try {
    const allBookings = await Booking.find()
      .populate("user")
      .populate("product")
      .populate({
        path: "seller",
        populate: [
          { path: "category" },
          { path: "product" },
          { path: "subproduct" }
        ]
      });
    res.status(200).json(allBookings);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching bookings" });
  }
});
app.delete("/bookings/:id", async (req, res) => {
  try {
    // Extract the booking ID from the request parameters
    const bookingId = req.params.id;
    const buyerEmail = req.query.buyerEmail;
    const buyerName = req.query.buyerName
    const sellerName = req.query.sellerName
    // Check if the booking ID is valid
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: "Invalid booking ID" });
  }

    // Find the booking by its ID and delete it
    const deletedBooking = await Booking.findByIdAndDelete(bookingId);

    // Check if the booking was found and deleted successfully
    if (!deletedBooking) {
      return res.status(404).json({ error: "Booking not found" });
  }

    // Send a success response with the deleted booking data
    res.status(200).json(deletedBooking);

    // EMAIL SEND ...............
    // Only send email if buyerEmail exists and is valid
    if (buyerEmail && buyerEmail.trim() !== '') {
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        // service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || "inquiriesesa@gmail.com",
          pass: process.env.EMAIL_PASS || "vdaqhaybecipeldj",
        },
      });

      // Email options
      let mailOptions = {
        from: process.env.EMAIL_FROM || "Prime Net Farmer <inquiriesesa@gmail.com>",
        to: buyerEmail,
        subject: "Your request has been rejected",
        text: `Dear ${buyerName},

        We regret to inform you that your recent request has been declined by our service provider, Mr. ${sellerName}. We understand this may be disappointing and we are available to discuss any alternative solutions that may meet your needs.
        
        Kind regards,
        ASAP Services,
        `,
      };

      // Send the email (don't send response here, just log)
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Email sending error:", error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    } else {
      console.log("No buyer email provided, skipping email notification");
    }
    // EMAIL END .............

  } catch (error) {
    // Handle errors and send an error response
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

app.patch("/updateBooking/:id" ,async (req,res)=>{
  const bookingId = req.params.id
  const buyerEmail = req.query.buyerEmail;
  const buyerName = req.query.buyerName
  const sellerName = req.query.sellerName
  try {
  const booking = await Booking.findByIdAndUpdate({_id:bookingId} , {ordered:true} , {new:true})
  if(!booking){
   throw new Error("Booking Not Found") 
  }  
  // EMAIL SEND ...............
  // Only send email if buyerEmail exists and is valid
  if (buyerEmail && buyerEmail.trim() !== '') {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      // service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || "inquiriesesa@gmail.com",
        pass: process.env.EMAIL_PASS || "vdaqhaybecipeldj",
    },
  });

    // Email options
    let mailOptions = {
      from: process.env.EMAIL_FROM || "Prime Net Farmer <inquiriesesa@gmail.com>",
      to: buyerEmail,
      subject: "Your request has been Accepted",
      text: `Dear ${buyerName},

      We regret to inform you that your recent request has been Accepted by our service provider, Mr. ${sellerName}. 
      
      Kind regards,
      ASAP Services,
      `,
  };

    // Send the email (don't send response here, just log)
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email sending error:", error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } else {
    console.log("No buyer email provided, skipping email notification");
  }
    // EMAIL END .............
  res.status(200).json(booking)
  } catch (error) {
    console.log("here")
    res.status(400).json({error:error.message , ok:false})
  }
  
})

app.get("/specificbooking", async (req, res) => {
  try {
    const { sellerId } = req.query;
    
    console.log("=== SELLER BOOKING DEBUG ===");
    console.log("Fetching bookings for sellerId:", sellerId);
    console.log("SellerId type:", typeof sellerId);

    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID is required" });
  }

    // First, let's see ALL bookings in the database
    const allBookings = await Booking.find().populate("user product seller");
    console.log("=== ALL BOOKINGS IN DATABASE ===");
    console.log("Total bookings found:", allBookings.length);
    allBookings.forEach((booking, index) => {
      console.log(`Booking ${index}:`, {
        id: booking._id,
        seller: booking.seller,
        sellerId: booking.sellerId,
        userId: booking.user,
        productId: booking.product,
        createdAt: booking.createdAt,
        sellerString: String(booking.seller),
        requestedSellerId: sellerId,
        requestedSellerIdString: String(sellerId),
        matches: String(booking.seller) === String(sellerId)
      });
    });

    // Try multiple ways to find bookings for this seller
    let sellerBookings = [];
    
    // Method 1: Find by seller field (ObjectId reference)
    console.log("=== METHOD 1: Searching by seller field ===");
    try {
      // Try with ObjectId conversion
      const mongoose = require('mongoose');
      const objectIdSellerId = new mongoose.Types.ObjectId(sellerId);
      console.log("Converted sellerId to ObjectId:", objectIdSellerId);
      
      sellerBookings = await Booking.find({ seller: objectIdSellerId }).populate(
        "user product seller"
      );
      console.log("Bookings found by seller field (ObjectId):", sellerBookings.length);
    } catch (error) {
      console.log("ObjectId conversion failed, trying string:", error.message);
      sellerBookings = await Booking.find({ seller: sellerId }).populate(
        "user product seller"
      );
      console.log("Bookings found by seller field (string):", sellerBookings.length);
    }
    console.log("Query used: { seller:", sellerId, "}");
    
    // Method 2: If no bookings found, try sellerId field (string)
    if (sellerBookings.length === 0) {
      console.log("=== METHOD 2: Searching by sellerId field ===");
      console.log("No bookings found by seller field, trying sellerId field");
      sellerBookings = await Booking.find({ sellerId: sellerId }).populate(
        "user product seller"
      );
      console.log("Bookings found by sellerId field:", sellerBookings.length);
      console.log("Query used: { sellerId:", sellerId, "}");
    }
    
    // Method 3: If still no bookings, try to find all bookings and filter manually
    if (sellerBookings.length === 0) {
      console.log("=== METHOD 3: Manual filtering ===");
      console.log("No bookings found by either method, trying manual search");
      console.log("Total bookings in database:", allBookings.length);
      
      // Log all booking seller IDs for debugging
      allBookings.forEach((booking, index) => {
        console.log(`Booking ${index}:`, {
          seller: booking.seller,
          sellerId: booking.sellerId,
          userId: booking.user,
          sellerString: String(booking.seller),
          sellerIdString: String(booking.sellerId),
          userIdString: String(booking.user),
          requestedSellerId: sellerId,
          requestedSellerIdString: String(sellerId)
        });
      });
      
      // Try to find bookings that match the sellerId in any field
      sellerBookings = allBookings.filter(booking => {
        const matches = String(booking.seller) === String(sellerId) || 
                       String(booking.sellerId) === String(sellerId) ||
                       String(booking.user) === String(sellerId);
        console.log(`Booking ${booking._id} matches:`, matches);
        return matches;
      });
      console.log("Bookings found by manual filtering:", sellerBookings.length);
    }
    
    console.log("Found bookings:", sellerBookings.length);
    console.log("Bookings data:", sellerBookings);
    
    // Log buyer details for debugging
    sellerBookings.forEach((booking, index) => {
      console.log(`Booking ${index} buyer details:`, {
        bookingId: booking._id,
        userId: booking.user,
        buyerId: booking.user?._id || booking.user,
        buyerName: booking.buyerName,
        buyerEmail: booking.buyerEmail,
        buyerContact: booking.buyerContact,
        populatedUser: booking.user,
        userType: typeof booking.user,
        isUserPopulated: booking.user && typeof booking.user === 'object'
      });
    });
    
    res.status(200).json(sellerBookings);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching bookings" });
  }
});

// Mark notification as shown
app.patch("/bookings/:id/mark-notification-shown", async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    const booking = await Booking.findByIdAndUpdate(
      bookingId, 
      { notificationShown: true }, 
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.status(200).json({ message: "Notification marked as shown", booking });
  } catch (error) {
    console.error("Error marking notification as shown:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Debug endpoint to see all bookings
app.get("/debug-bookings", async (req, res) => {
  try {
    const allBookings = await Booking.find()
      .populate("user")
      .populate("product")
      .populate({
        path: "seller",
        populate: [
          { path: "category" },
          { path: "product" },
          { path: "subproduct" }
        ]
      });
    console.log("=== DEBUG: ALL BOOKINGS ===");
    console.log("Total bookings:", allBookings.length);
    
    const bookingsData = allBookings.map(booking => ({
      id: booking._id,
      seller: booking.seller,
      sellerId: booking.sellerId,
      userId: booking.user,
      productId: booking.product,
      buyerName: booking.buyerName,
      buyerEmail: booking.buyerEmail,
      createdAt: booking.createdAt
    }));
    
    res.status(200).json({
      total: allBookings.length,
      bookings: bookingsData
    });
  } catch (error) {
    console.error("Error fetching debug bookings:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get bookings for a specific buyer
app.get("/buyerbookings", async (req, res) => {
  try {
    const { buyerId } = req.query;
    
    console.log("=== BUYER BOOKINGS DEBUG ===");
    console.log("Fetching bookings for buyerId:", buyerId);
    console.log("BuyerId type:", typeof buyerId);

    if (!buyerId) {
      return res.status(400).json({ message: "Buyer ID is required" });
    }

    // Find bookings by user field (ObjectId reference)
    let buyerBookings = [];
    
    try {
      // Try with ObjectId conversion
      const mongoose = require('mongoose');
      const objectIdBuyerId = new mongoose.Types.ObjectId(buyerId);
      console.log("Converted buyerId to ObjectId:", objectIdBuyerId);
      
      buyerBookings = await Booking.find({ user: objectIdBuyerId }).populate(
        "user product seller"
      );
      console.log("Bookings found by user field (ObjectId):", buyerBookings.length);
    } catch (error) {
      console.log("ObjectId conversion failed, trying string:", error.message);
      buyerBookings = await Booking.find({ user: buyerId }).populate(
        "user product seller"
      );
      console.log("Bookings found by user field (string):", buyerBookings.length);
    }
    
    // If no bookings found, try alternative methods
    if (buyerBookings.length === 0) {
      console.log("=== ALTERNATIVE SEARCH METHODS ===");
      
      // Method 2: Try userId field
      buyerBookings = await Booking.find({ userId: buyerId }).populate(
        "user product seller"
      );
      console.log("Bookings found by userId field:", buyerBookings.length);
      
      // Method 3: Manual filtering
      if (buyerBookings.length === 0) {
        const allBookings = await Booking.find().populate("user product seller");
        buyerBookings = allBookings.filter(booking => 
          String(booking.user) === String(buyerId) || 
          String(booking.userId) === String(buyerId)
        );
        console.log("Bookings found by manual filtering:", buyerBookings.length);
      }
    }
    
    console.log("Found buyer bookings:", buyerBookings.length);
    
    // Log seller details for debugging
    buyerBookings.forEach((booking, index) => {
      console.log(`Booking ${index} seller details:`, {
        bookingId: booking._id,
        seller: booking.seller,
        sellerId: booking.seller?._id || booking.seller,
        sellerName: booking.sellerName,
        sellerEmail: booking.sellerEmail,
        populatedSeller: booking.seller,
        sellerPhoneNumber: booking.seller?.phoneNumber,
        sellerEmailFromPopulated: booking.seller?.email,
        sellerNameFromPopulated: booking.seller?.Name,
        product: booking.product,
        status: booking.ordered ? 'Confirmed' : 'Pending'
      });
    });
    
    res.status(200).json(buyerBookings);
  } catch (error) {
    console.error("Error fetching buyer bookings:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/create-service-checkout-session", async (req, res) => {
  try {
    console.log("Request received at /create-service-checkout-session");

    const { paymentMethodId, userId, productId, zipCode, city } = req.body; // Destructure values from request body
    console.log("Product ID:", productId);
    console.log("Zip Code:", zipCode);
    console.log("City:", city);

    // Retrieve product details based on the paymentMethodId
    const items = [
      {
        price: process.env.STRIPE_SERVICE_PRICE_ID || "price_1P6bhaH9HQ2Ek1tPWKH1k7WL", // Your product price ID
        quantity: 1,
    },
      // Add more items if needed
    ];

    // Construct success and cancel URLs with parameters
    const baseUrl = process.env.FRONTEND_URL || `http://${req.headers.host}`;
    const success_url = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&userId=${userId}&productId=${productId}${
      zipCode ? "&zipCode=" + zipCode : ""
  }${city ? "&city=" + city : ""}`;
    const cancel_url = `${baseUrl}/cancel?userId=${userId}&productId=${productId}&zipCode=${
      zipCode || ""
  }&city=${city || ""}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items,
      mode: "payment",
      success_url: success_url,
      cancel_url: cancel_url,
  });

    // Append session ID to success URL
    session.success_url += `?session_id=${session.id}`;

    // Return the session ID to the client
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Error creating checkout session" });
  }
});

app.get("/success", async (req, res) => {
  try {
    console.log("Query Parameters:", req.query); // Log the entire req.query object
    const sessionId = req.query.session_id; // Correctly extract session ID from query parameters
    console.log("Session ID:", sessionId); // Log the session ID for debugging
    if (!sessionId) {
      throw new Error("Session ID is missing in query parameters.");
  }

    const userId = req.query.userId;
    console.log("User ID:", userId);

    const productId = req.query.productId;
    console.log("Product ID:", productId);

    const zipCode = req.query.zipCode;
    console.log("Zip Code:", zipCode);

    const city = req.query.city;
    console.log("City:", city);

    // Retrieve the session from Stripe to check its payment status
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      // Check if payment record already exists for the user
      let payment = await Payment.findOne({ userId: userId });
      // if (payment) {
      //   // Update existing payment record
      //   payment.isPaid = true;
      //   payment.zipCode = zipCode;
      //   payment.city = city;
      // } else {
      // Create new payment record
      payment = new Payment({
        sessionId: session.id,
        userId: userId,
        isPaid: true,
        zipCode: zipCode,
        city: city,
        // Add more payment-related fields as needed
    });

      // Save the payment record
      await payment.save();
      console.log("Payment Record Saved to Database");
  } else {
      console.error("Payment was not successful.");
  }
    // Redirect to seller panel with productId, zipCode, and city parameters
    res.redirect(
      `http://getasapservice.com/card.html?productId=${productId}&zipCode=${
        zipCode || ""
    }&city=${city || ""}&paidNow=${true}`
    );
  } catch (error) {
    console.error("Error handling success redirect:", error);
    res.status(500).json({ error: "Error handling success redirect" });
  }
});

// Cancel URL endpoint for Stripe Checkout
app.get("/cancel", (req, res) => {
  res.redirect("http://127.0.0.1:5500/ASSP/index.html"); // Redirect to login page if payment is cancelled
});
app.post("/delta-checkout-session", async (req, res) => {
  try {
    console.log("Request received at /create-checkout-session");

    const { paymentMethodId, email } = req.body; // Get userId from the request body
    console.log("Received Token:", req.header("Authorization"));
    console.log("Authenticated User ID:", email);

    // Retrieve product details based on the paymentMethodId
    const items = [
      {
        price: process.env.STRIPE_DELTA_PRICE_ID || "price_1OhHCMH9HQ2Ek1tPDpXnGNlO", // Your product price ID
        quantity: 1,
    },
      // Add more items if needed
    ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items,
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-cancel`,
  });

    console.log("Checkout Session Created:", session);

    const payment = new DeltaPayment({
      sessionId: session.id,
      email: email,
      // Add more payment-related fields as needed
  });

    // Save the payment record to the database
    await payment.save();
    console.log("Payment Record Saved to Database");

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Error creating checkout session" });
  }
});

//Filter based on country city and zipcode
app.get("/getFilteredSellers", async (req, res) => {
  const city = req.headers.city;
  const zipCode = req.headers.zipcode;
  const category = req.headers.category;
  const product = req.headers.product;

  try {
    let filter = {}; // Initialize an empty filter object

    // Check if city is provided
    if (city) {
      filter.city = city;
  }

    // Check if zip code is provided
    if (zipCode) {
      filter.zipCode = zipCode;
  }

    // Check if category is provided
    if (category) {
      const categoryDoc = await Category.findById(category);

      if (!categoryDoc) {
        return res.status(404).json({ message: "Category not found" });
    }

      filter.category = category; // Include category in the filter
  }
    if (product) {
      // Find product title using its ObjectId
      const productDoc = await Product.findById(product);

      if (!productDoc) {
        return res.status(404).json({ message: "Product not found" });
    }

      filter.product = product; // Include product in the filter
  }

    const filteredSellers = await Seller.find(filter)
      .populate("category", "Title")
      .populate("product", "name");

    res.status(200).json({ data: filteredSellers });
  } catch (error) {
    res.status(400).json({ message: "Error filtering the sellers" });
  }
});

app.post("/forgotPassword", async (req, res) => {
  const { email, phoneNumber } = req.body;
  console.log("Received body:", req.body);

  try {
    const user = await User.findOne({ email });
    console.log("Found user:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
  }

    console.log("User password:", user.password); // safe now

    // Create transporter
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || "inquiriesesa@gmail.com",
        pass: process.env.EMAIL_PASS || "vdaqhaybecipeldj",
    },
  });

    let mailOptions = {
      from: process.env.EMAIL_FROM || "Prime Net Farmer <inquiriesesa@gmail.com>",
      to: email,
      subject: "Password Reset",
      text: `Password: ${user.password}`,
  };

    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    res.status(200).json({ message: "User found. Email sent.", ok: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});


app.delete("/deleteUser/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isDeleted: true },
      { new: true }
    );
    res.status(200).json({ ok: true, data: updatedUser });
  } catch (error) {
    res.status(400).json({ message: "Error deleting" });
  }
});

app.delete('/category/:categoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    // Check if the Category ID is valid
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: 'Invalid Category ID' });
  }

    // Attempt to find the Category by ID and delete it
    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    // Check if the Category was found and deleted
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
  }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while deleting the Category' });
  }
});
app.put('/Category/:id', async (req, res) => {
    const { id } = req.params;
    const { Title, image } = req.body;

    try {
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { Title, image },
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ error: 'Category not found' });
      }

        res.json(updatedCategory);
  } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ error: 'Server error while updating category' });
  }
});

app.delete('/product/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;

    // Check if the product ID is valid
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
  }

    // Attempt to find the product by ID and delete it
    const deletedproduct = await Product.findByIdAndDelete(productId);

    // Check if the product was found and deleted
    if (!deletedproduct) {
      return res.status(404).json({ message: 'Product not found' });
  }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while deleting the Product' });
  }
});

app.get("/getAllPayments", async (req, res) => {
  try {
    const payments = await Payment.find().populate({
      path: "userId",
      select: "Name email phoneNumber",
  });
    res.status(200).json({ data: payments, ok: true });
  } catch (error) {
    res.status(400).json({ message: "Error getting all payments" });
  }
});

app.post("/postRequest", async (req, res) => {
  const { userId } = req.body;
  try {
    if (!userId) {
      return res.status(400).json({ message: "Missing fields" });
  }
    const existingRequest = await Request.findOne({
      userId,
      status: "pending",
  });
    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Your request is already pending" });
  }
    const request = new Request({ userId });
    await request.save();

    res.status(200).json({ data: request, ok: true });
  } catch (error) {
    res.status(400).json({ message: error });
  }
});

app.get("/getAllRequests", async (req, res) => {
  try {
    const requests = await Request.find({ status: "pending" }).populate(
      "userId",
      "Name email phoneNumber"
    );

    res.status(200).json({ data: requests, ok: true });
  } catch (error) {
    res.status(400).json({ message: error });
  }
});

app.put("/updateReq/:id", async (req, res) => {
  const id = req.params.id;
  const { status, userId } = req.body;
  console.log(userId, status);

  try {
    // Update the request
    const updatedReq = await Request.findByIdAndUpdate(
      id,
      { status: status },
      { new: true }
    );

    // If the status is 'accepted', update the payment
    if (status === "accepted") {
      const updatedUser = await Payment.create({
        userId: userId,
        isPaid: true,
    });
      console.log(updatedUser);
  }

    // If the request is not found, return 404 response
    if (!updatedReq) {
      return res.status(404).json({ message: "Request not found" });
  }

    // Return success response with updated request data
    res.status(200).json({ ok: true, data: updatedReq });
  } catch (error) {
    // Handle errors
    console.error("Error updating request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/checkExpired/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const expired = await Payment.findOne({ userId: userId, expired: false });
    console.log(expired);
    if (expired) {
      const dateCreated = new Date(expired.dateAdded);
      const currentDate = new Date();
      const differenceInMilliseconds = currentDate - dateCreated;
      const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);
      console.log(differenceInDays);
      if (differenceInDays > 30) {
        expired.expired = true;
        await expired.save();
        return res.status(200).json({ ok: false, expired: true });
    } else {
        return res.status(200).json({
          data: expired,
          message: "Payment is not expired.",
          ok: true,
      });
    }
  }
    // If no payment is found, send a response indicating that
    return res
      .status(200)
      .json({ message: "No payment found. or payment is expired" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/getOneUser/:id" ,async (req,res)=>{
  try {
    const user = await User.findById(req.params.id);
    if(!user){
      throw new Error("User Not Found")
  }
    res.status(200).json(user);
  } catch (error) {
    res.status.json(error);
  }
})


app.post("/seller/update" ,async (req,res)=>{
  const image = req.body.image
  const sellerId = req.body.sellerId
  
  console.log('Seller update request:', { sellerId, hasImage: !!image });
  
  if (!sellerId) {
    return res.status(400).json({ message: "Seller ID is required" });
  }
  
  if (!image) {
    return res.status(400).json({ message: "Image is required" });
  }
  
  try {
    const updatedSeller = await Seller.findByIdAndUpdate(sellerId , {image:image} , {new:true})
    if (!updatedSeller) {
      return res.status(404).json({ message: "Seller not found with the provided ID" });
  }
    res.status(201).json({ message: "Image updated successfully", data: updatedSeller })
  } catch (error) {
    console.error('Seller update error:', error);
    res.status(400).json({ message: error.message || "Failed to update seller image" })
  }
})
app.post("/buyer/update" ,async (req,res)=>{
  const image = req.body.image
  const sellerId = req.body.sellerId
  
  try {
    const  updatedSeller= await User.findByIdAndUpdate(sellerId , {image:image} , {new:true})
    if (!updatedSeller) {
      throw new Error("SERVER ISSUE FACED")
  }
    res.status(201).json(updatedSeller)
  } catch (error) {
    res.status(400).json(error)
  }
})


// Subproduct endpoints with image upload support
app.post("/subproduct", (req, res, next) => {
  // Check if Cloudinary is properly configured
  const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                 process.env.CLOUDINARY_API_KEY && 
                                 process.env.CLOUDINARY_API_SECRET &&
                                 process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';
  
  if (isCloudinaryConfigured) {
    // Use multer middleware for file upload
    upload.single("image")(req, res, next);
  } else {
    // Skip multer middleware, just parse the body
    next();
  }
}, async (req, res) => {
  try {
    const { name, productId, categoryId } = req.body;

    if (!name || !productId || !categoryId) {
      return res.status(400).json({ message: "Name, productId, and categoryId are required" });
    }

    // Handle image - check if Cloudinary is configured
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                   process.env.CLOUDINARY_API_KEY && 
                                   process.env.CLOUDINARY_API_SECRET &&
                                   process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';
    
    let imageUrl = "";
    if (isCloudinaryConfigured) {
      // Cloudinary is configured, use uploaded file
      if (req.file) {
        imageUrl = req.file.path; // Cloudinary URL
      } else if (req.body.image) {
        imageUrl = req.body.image; // Fallback to URL input
      } else {
        return res.status(400).json({ message: "Image is required" });
      }
    } else {
      // Cloudinary not configured, expect URL in request body
      if (req.body.image) {
        imageUrl = req.body.image; // Use image URL from request body
      } else {
        return res.status(400).json({ 
          message: "Image URL is required. Please provide an image URL in the 'image' field." 
        });
      }
    }

    // Check if the productId exists in the Product model
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Check if a subproduct with the same name already exists
    const existingSubproduct = await Subproduct.findOne({ 
      name, 
      category: categoryId, 
      product: productId 
    });
    if (existingSubproduct) {
      return res.status(400).json({ message: "Subproduct already registered for this category" });
    }

    const newSubproduct = new Subproduct({
      name,
      product: productId,
      category: categoryId,
      image: imageUrl,
    });

    await newSubproduct.save();

    res.status(200).json({ message: "Subproduct registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Bulk upload subproducts
app.post("/subproduct/bulk", upload.array("images", 50), async (req, res) => {
  try {
    const { subproducts } = req.body;
    const subproductsData = JSON.parse(subproducts);
    
    if (!Array.isArray(subproductsData)) {
      return res.status(400).json({ message: "Subproducts must be an array" });
    }

    const results = [];
    for (let i = 0; i < subproductsData.length; i++) {
      const subproduct = subproductsData[i];
      let imageUrl = "";
      
      if (req.files && req.files[i]) {
        imageUrl = req.files[i].path;
      } else if (subproduct.image) {
        imageUrl = subproduct.image;
      }

      try {
        // Check if product exists
        const productExists = await Product.findById(subproduct.productId);
        if (!productExists) {
          results.push({ 
            name: subproduct.name, 
            status: "error", 
            message: "Invalid product ID" 
          });
          continue;
        }

        // Check if subproduct already exists
        const existingSubproduct = await Subproduct.findOne({ 
          name: subproduct.name, 
          category: subproduct.categoryId,
          product: subproduct.productId 
        });
        if (existingSubproduct) {
          results.push({ 
            name: subproduct.name, 
            status: "skipped", 
            message: "Already exists" 
          });
          continue;
        }

        const newSubproduct = new Subproduct({
          name: subproduct.name,
          product: subproduct.productId,
          category: subproduct.categoryId,
          image: imageUrl,
        });

        await newSubproduct.save();
        results.push({ 
          name: subproduct.name, 
          status: "success", 
          message: "Created successfully" 
        });
      } catch (err) {
        results.push({ 
          name: subproduct.name, 
          status: "error", 
          message: err.message 
        });
      }
    }

    res.status(200).json({ 
      message: "Bulk upload completed", 
      results 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred during bulk upload" });
  }
});
app.put('/subproduct/:id', async (req, res) => {
  try {
    const subproductId = req.params.id;
    const { name, image } = req.body;

    // Find the subproduct by id
    const subproduct = await Subproduct.findById(subproductId);
    if (!subproduct) {
      return res.status(404).json({ message: 'Subproduct not found' });
  }

    // Update name and image only
    subproduct.name = name || subproduct.name;
    subproduct.image = image || subproduct.image;

    await subproduct.save();

    res.status(200).json({ message: 'Subproduct updated successfully', subproduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating subproduct' });
  }
});

app.get('/subproduct', async (req, res) => {
  try {
    const productId = req.query.productId;
    const categoryId = req.query.categoryId;

    // Create a filter object to use in the query
    const filter = {};
    if (productId) filter.product = productId;
    if (categoryId) filter.category = categoryId;

    // Fetch subproducts based on the filter and populate product and category data
    const subproducts = await Subproduct.find(filter)
      .populate('product', 'name')
      .populate('category', 'Title');

    res.status(200).json(subproducts);
  } catch (error) {
    console.error("Subproduct fetch error:", error);
    res.status(500).json({ message: 'An error occurred while fetching subproducts' });
  }
});
app.delete('/subproduct/:subproductId', async (req, res) => {
  try {
    const subproductId = req.params.subproductId;

    // Check if the subproduct ID is valid
    if (!mongoose.Types.ObjectId.isValid(subproductId)) {
      return res.status(400).json({ message: 'Invalid subproduct ID' });
  }

    // Attempt to find the subproduct by ID and delete it
    const deletedSubproduct = await Subproduct.findByIdAndDelete(subproductId);

    // Check if the subproduct was found and deleted
    if (!deletedSubproduct) {
      return res.status(404).json({ message: 'Subproduct not found' });
  }

    res.status(200).json({ message: 'Subproduct deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while deleting the subproduct' });
  }
});
///////////////////////////////////////////////

///////////////////////////
// ------------------ POST Seller ------------------
// POST seller details
// 1️⃣ Configure Multer fields (must be declared **before** the route)

const uploadFields = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "adsImages", maxCount: 10 },
]);

// Error handling middleware for upload
const handleUploadError = (err, req, res, next) => {
  console.error("Upload error:", err);
  if (err) {
    return res.status(400).json({
      success: false,
      error: "File upload error: " + err.message
    });
  }
  next();
};

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working", timestamp: new Date().toISOString() });
});

// 2️⃣ Use in route
app.post("/api/sellerdetailsprofile", uploadFields, handleUploadError, async (req, res) => {
  try {
    console.log("=== SELLER PROFILE POST REQUEST ===");
    console.log("Request body keys:", Object.keys(req.body));
    console.log("Request files:", req.files);
    console.log("Request headers:", req.headers);
    
    const personal = req.body.personal ? JSON.parse(req.body.personal) : {};
    const aboutText = req.body.about || "";

    console.log("Parsed personal data:", personal);

    // Validate required personal fields
    if (!personal.name || !personal.email) {
      console.log("Validation failed: Missing name or email");
      return res.status(400).json({ 
        success: false, 
        error: "Name and email are required" 
      });
    }

    // Check if Cloudinary is properly configured
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                   process.env.CLOUDINARY_API_KEY && 
                                   process.env.CLOUDINARY_API_SECRET &&
                                   process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';

    console.log("Cloudinary configured:", isCloudinaryConfigured);

    // Profile image
    if (req.files?.profileImage?.[0]) {
      if (isCloudinaryConfigured) {
        personal.profileImage = {
          url: req.files.profileImage[0].path, // Cloudinary URL
          public_id: req.files.profileImage[0].filename,
        };
      } else {
        // Use local file path when Cloudinary is not configured
        console.log("Cloudinary not configured, using local file storage");
        personal.profileImage = {
          url: `/uploads/${req.files.profileImage[0].filename}`,
          public_id: req.files.profileImage[0].filename,
        };
      }
    }

    // Ads images
    const ads = [];
    if (req.files?.adsImages) {
      for (let file of req.files.adsImages) {
        if (isCloudinaryConfigured) {
          ads.push({
            image: { url: file.path, public_id: file.filename },
            description: "",
          });
        } else {
          // Use local file path when Cloudinary is not configured
          console.log("Cloudinary not configured, using local file storage for ad image");
          ads.push({
            image: { url: `/uploads/${file.filename}`, public_id: file.filename },
            description: "",
          });
        }
      }
    }

    // Parse and filter data
    const educationData = JSON.parse(req.body.education || "[]").filter(edu => edu.degree && edu.university);
    const skillsData = JSON.parse(req.body.skills || "[]").filter(skill => skill.skill);
    const hobbiesData = JSON.parse(req.body.hobbies || "[]").filter(hobby => hobby.hobby);
    const experienceData = JSON.parse(req.body.experience || "[]").filter(exp => exp.experience);

    console.log("Filtered data:", {
      education: educationData,
      skills: skillsData,
      hobbies: hobbiesData,
      experience: experienceData
    });

    // Get user IDs from request body
    const userId = req.body.userId || req.body.sellerId;
    const sellerId = req.body.sellerId || req.body.userId;
    
    console.log("User IDs from request:", { userId, sellerId });
    
    // Save to DB
    const newSeller = await SellerModelProfile.create({
      personal,
      education: educationData,
      skills: skillsData,
      hobbies: hobbiesData,
      experience: experienceData,
      about: { description: aboutText },
      ads,
      userId: userId,
      sellerId: sellerId,
  });

    res.status(200).json({
      success: true,
      message: "Seller details uploaded successfully",
      data: newSeller,
  });
  } catch (error) {
    console.error("=== FORM SUBMISSION ERROR ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    console.error("Error stack:", error.stack);
    console.error("Error code:", error.code);
    console.error("Key pattern:", error.keyPattern);
    console.error("Key value:", error.keyValue);
    
    // Ensure we always send a response
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: error.message || "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// Update seller details by id
app.put("/api/sellerdetailsprofile/:id", uploadFields, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid seller ID" });
  }

    const seller = await SellerModelProfile.findById(id);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
  }

    // Parse incoming and filter empty data
    const personalIncoming = req.body.personal ? JSON.parse(req.body.personal) : {};
    const educationIncoming = JSON.parse(req.body.education || "[]").filter(edu => edu.degree && edu.university);
    const skillsIncoming = JSON.parse(req.body.skills || "[]").filter(skill => skill.skill);
    const hobbiesIncoming = JSON.parse(req.body.hobbies || "[]").filter(hobby => hobby.hobby);
    const experienceIncoming = JSON.parse(req.body.experience || "[]").filter(exp => exp.experience);
    const aboutText = req.body.about || "";

    console.log("Update filtered data:", {
      education: educationIncoming,
      skills: skillsIncoming,
      hobbies: hobbiesIncoming,
      experience: experienceIncoming
    });

    // Update personal
    seller.personal = {
      ...(seller.personal || {}),
      ...personalIncoming,
  };

    // Check if Cloudinary is properly configured
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                   process.env.CLOUDINARY_API_KEY && 
                                   process.env.CLOUDINARY_API_SECRET &&
                                   process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';

    // Profile image replacement if provided
    if (req.files?.profileImage?.[0]) {
      if (isCloudinaryConfigured) {
        seller.personal.profileImage = {
          url: req.files.profileImage[0].path,
          public_id: req.files.profileImage[0].filename,
        };
      } else {
        console.log("Cloudinary not configured, using local file storage");
        seller.personal.profileImage = {
          url: `/uploads/${req.files.profileImage[0].filename}`,
          public_id: req.files.profileImage[0].filename,
        };
      }
    }

    // Replace top-level arrays
    seller.education = educationIncoming;
    seller.skills = skillsIncoming;
    seller.hobbies = hobbiesIncoming;
    seller.experience = experienceIncoming;
    seller.about = { description: aboutText };

    // Append new ads images if any
    if (req.files?.adsImages) {
      for (let file of req.files.adsImages) {
        if (isCloudinaryConfigured) {
          seller.ads.push({
            image: { url: file.path, public_id: file.filename },
            description: "",
          });
        } else {
          console.log("Cloudinary not configured, using local file storage for ad image");
          seller.ads.push({
            image: { url: `/uploads/${file.filename}`, public_id: file.filename },
            description: "",
          });
        }
      }
    }

    // Update user IDs if provided
    if (req.body.userId) {
      seller.userId = req.body.userId;
    }
    if (req.body.sellerId) {
      seller.sellerId = req.body.sellerId;
    }

    const updated = await seller.save();
    res.status(200).json({ success: true, message: "Seller details updated", data: updated });
  } catch (error) {
    console.error("Update submission error:", error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET sellers (all or by id/email)
app.get("/api/sellerdetailsprofile", async (req, res) => {
  try {
    const { userId, sellerId, email, id } = req.query;
    let query = {};
    
    // If id is provided, search by _id (the actual field in the schema)
    if (id) {
      query._id = id;
    }
    
    // If userId is provided, search by userId field
    if (userId) {
      query.userId = userId;
      console.log("Searching by userId:", userId);
    }
    
    // If sellerId is provided, search by sellerId field
    if (sellerId) {
      query.sellerId = sellerId;
      console.log("Searching by sellerId:", sellerId);
    }
    
    // If email is provided, search by personal.email
    if (email) {
      query['personal.email'] = email;
    }
    
    console.log("Querying SellerModelProfile with:", query);
    const sellers = await SellerModelProfile.find(query);
    console.log("Found sellers:", sellers.length);
    res.status(200).json(sellers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get verified sellers
app.get("/api/sellerdetailsprofile/verified", async (req, res) => {
  try {
    const { userId, sellerId, id } = req.query;
    
    console.log("=== VERIFIED SELLERS ENDPOINT DEBUG ===");
    console.log("Query params - userId:", userId, "sellerId:", sellerId, "id:", id);
    
    let query = { isVerified: true };
    
    // If id is provided, search by _id (the actual field in the schema)
    if (id) {
      query._id = id;
    }
    
    // If userId is provided, search by userId field
    if (userId) {
      query.userId = userId;
      console.log("Searching verified sellers by userId:", userId);
    }
    
    // If sellerId is provided, search by sellerId field
    if (sellerId) {
      query.sellerId = sellerId;
      console.log("Searching verified sellers by sellerId:", sellerId);
    }
    
    console.log("Final query:", query);
    const verifiedSellers = await SellerModelProfile.find(query);
    console.log("Found verified sellers:", verifiedSellers.length);
    
    // If no results with the specific ID, let's also try to find any verified sellers for debugging
    if (verifiedSellers.length === 0 && (id || userId || sellerId)) {
      const allVerified = await SellerModelProfile.find({ isVerified: true });
      console.log("Total verified sellers in DB:", allVerified.length);
      if (allVerified.length > 0) {
        console.log("Sample verified seller structure:", {
          _id: allVerified[0]._id,
          isVerified: allVerified[0].isVerified,
          personal: allVerified[0].personal
        });
      }
    }
    
    res.status(200).json(verifiedSellers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// GET verified seller by ID
app.get("/api/sellerdetailsprofile/verified/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const seller = await SellerModelProfile.findOne({ _id: userId, isVerified: true });

    if (!seller) {
      return res.status(404).json({ success: false, message: "Verified seller not found" });
  }

    res.status(200).json(seller);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// Get unverified sellers
app.get("/api/sellerdetailsprofile/unverified", async (req, res) => {
  try {
    const unverifiedSellers = await SellerModelProfile.find({ isVerified: false });
    res.status(200).json(unverifiedSellers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// ✅ Verify a seller (admin action)
// Verify seller
// Verify seller
app.put("/api/sellerdetailsprofile/verify/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid seller ID" });
  }

    const seller = await SellerModelProfile.findById(id);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    seller.isVerified = true;
    await seller.save();

    res.status(200).json({ message: "Seller verified successfully", seller });
  } catch (error) {
    console.error("Error verifying seller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// DELETE a seller
app.delete("/api/sellerdetailsprofile/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Delete by MongoDB ObjectId
    const deletedSeller = await SellerModelProfile.findByIdAndDelete(id);

    if (!deletedSeller) {
      return res.status(404).json({ message: "Seller not found" });
  }

    res.status(200).json({ message: "Seller deleted successfully" });
  } catch (error) {
    console.error("Error deleting seller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ===== BACKWARD COMPATIBILITY: /api/sellerdetails endpoints =====
// These endpoints mirror the sellerdetailsprofile endpoints for backward compatibility

// GET sellers (all or by userId/sellerId) - backward compatibility
app.get("/api/sellerdetails", async (req, res) => {
  try {
    const { userId, sellerId } = req.query;
    let query = {};
    
    // If userId is provided, search by userId
    if (userId) {
      query.userId = userId;
    }
    
    // If sellerId is provided, search by sellerId
    if (sellerId) {
      query.sellerId = sellerId;
    }
    
    const sellers = await SellerModelProfile.find(query);
    res.status(200).json(sellers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET seller by ID - backward compatibility
app.get("/api/sellerdetails/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await SellerModelProfile.findById(id);
    
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }
    
    res.status(200).json(seller);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update seller by ID - backward compatibility
app.put("/api/sellerdetails/:id", uploadFields, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    const updateData = { ...req.body };
    
    // Handle file uploads
    if (req.files) {
      if (req.files['personal.profileImage'] && req.files['personal.profileImage'][0]) {
        updateData['personal.profileImage'] = req.files['personal.profileImage'][0].filename;
      }
      
      if (req.files['ads'] && req.files['ads'].length > 0) {
        updateData.ads = updateData.ads || [];
        req.files['ads'].forEach((file, index) => {
          if (updateData.ads[index]) {
            updateData.ads[index].image = file.filename;
          }
        });
      }
    }

    const updatedSeller = await SellerModelProfile.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedSeller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json(updatedSeller);
  } catch (error) {
    console.error("Error updating seller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE seller by ID - backward compatibility
app.delete("/api/sellerdetails/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSeller = await SellerModelProfile.findByIdAndDelete(id);

    if (!deletedSeller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json({ message: "Seller deleted successfully" });
  } catch (error) {
    console.error("Error deleting seller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE specific ad from seller - backward compatibility
app.delete("/api/sellerdetails/:sellerId/ads/:adId", async (req, res) => {
  try {
    const { sellerId, adId } = req.params;
    
    const seller = await SellerModelProfile.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }
    
    // Remove the ad from the ads array
    seller.ads = seller.ads.filter(ad => ad._id.toString() !== adId);
    await seller.save();
    
    res.status(200).json({ message: "Ad deleted successfully" });
  } catch (error) {
    console.error("Error deleting ad:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//////////////////////
//////////////////////
///////////////////////////
//////////////////////////
//////////////////



// Create Stripe checkout session for seller registration
app.post('/create-checkout-session', async (req, res) => {
  const { userId, email, amount = 2000 } = req.body; // $20.00 in cents
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
        product_data: {
          name: 'Seller Registration Fee',
          description: 'One-time registration fee for seller account',
      },
          unit_amount: amount, // Amount in cents
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-cancel`,
      client_reference_id: userId,
      customer_email: email,
      metadata: {
        userId: userId,
        type: 'seller_registration'
    }
  });

    // Save session in DB
    await DeltaPayment.create({
      sessionId: session.id,
      email: email,
      userId: userId,
      amount: amount,
      status: 'pending'
  });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create Stripe checkout session for ad posting
app.post('/create-ad-checkout-session', async (req, res) => {
  const { userId, email, amount = 100 } = req.body; // $1.00 in cents
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Ad/Event Posting Fee',
            description: 'Fee for posting one ad or event for one day',
        },
          unit_amount: amount, // Amount in cents
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-cancel`,
      client_reference_id: userId,
      customer_email: email,
      metadata: {
        userId: userId,
        type: 'ad_posting'
    }
  });

    // Save session in DB
    await DeltaPayment.create({
      sessionId: session.id,
      email: email,
      userId: userId,
      amount: amount,
      status: 'pending'
  });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Mock payment endpoint for testing (when Stripe keys are expired)
app.post('/create-ad-checkout-session-mock', async (req, res) => {
  const { userId, email, amount = 100 } = req.body; // $1.00 in cents
  try {
    console.log('Mock payment endpoint called with:', { userId, email, amount });
    
    // Create a mock session ID
    const mockSessionId = `mock_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save mock session in DB
    await DeltaPayment.create({
      sessionId: mockSessionId,
      email: email,
      userId: userId || new mongoose.Types.ObjectId().toString(),
      amount: amount,
      status: 'completed', // Mock as completed
      type: 'ad_posting'
    });

    // Return mock success response
    res.json({ 
      sessionId: mockSessionId, 
      url: `http://localhost:5174/payment-success?session_id=${mockSessionId}`,
      message: 'Mock payment successful - Stripe keys expired, using mock payment'
    });
  } catch (err) {
    console.error('Mock payment error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Stripe webhook
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Payment completed for session:', session.id);

    try {
      // Mark payment completed
      await DeltaPayment.findOneAndUpdate(
        { sessionId: session.id },
        { 
          status: 'completed', 
          paymentMethod: 'card',
          completedAt: new Date()
      }
      );

      // Handle different payment types
      const paymentType = session.metadata?.type;
      const userId = session.client_reference_id;

      if (paymentType === 'seller_registration') {
        // Mark seller as paid
        await Seller.findByIdAndUpdate(userId, { isPaid: true });
        console.log('Seller marked as paid:', userId);
    } else if (paymentType === 'ad_posting') {
        // Credit one posting for ads/events
        await User.findByIdAndUpdate(userId, { 
          $set: { canPostAds: true },
          $inc: { postCredits: 1 }
      });
        console.log('User credited 1 posting:', userId);
    } else if (paymentType === 'event_posting') {
        // Credit one posting for events
        await User.findByIdAndUpdate(userId, { 
          $set: { canPostEvents: true },
          $inc: { eventCredits: 1 }
      });
        console.log('User credited 1 event posting:', userId);
    }

  } catch (error) {
      console.error('Error processing payment completion:', error);
  }
  }
  

  res.json({ received: true });
});

// Get all payments for admin
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await DeltaPayment.find()
      .populate('userId', 'Name email phoneNumber')
      .sort({ dateAdded: -1 });
    
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

// Test endpoint to verify server is working
app.get('/test-makepayment', (req, res) => {
  console.log('=== TEST ENDPOINT CALLED ===');
  res.json({ 
    success: true, 
    message: 'Makepayment endpoint is working!',
    timestamp: new Date().toISOString(),
    environment: {
      stripeKeyAvailable: !!process.env.STRIPE_SECRET_KEY,
      nodeEnv: process.env.NODE_ENV
  }
  });
});

// Register both legacy and /api routes
app.post("/send-verification-code", handleSendVerificationCode);
app.post("/api/send-verification-code", handleSendVerificationCode);

// Test endpoint to verify Stripe keys
app.get('/test-stripe-keys', async (req, res) => {
  try {
    console.log('=== TESTING STRIPE KEYS ===');
    console.log('Secret key available:', !!process.env.STRIPE_SECRET_KEY);
    console.log('Publishable key available:', !!process.env.STRIPE_PUBLISHABLE_KEY);
    
    // Test the secret key by making a simple API call
    const balance = await stripe.balance.retrieve();
    
    res.json({
      success: true,
      message: 'Stripe keys are working!',
      balance: balance,
      keys: {
        secretKeyAvailable: !!process.env.STRIPE_SECRET_KEY,
        publishableKeyAvailable: !!process.env.STRIPE_PUBLISHABLE_KEY,
        secretKeyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...' : 'Not available',
        publishableKeyPrefix: process.env.STRIPE_PUBLISHABLE_KEY ? process.env.STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...' : 'Not available'
    }
  });
  } catch (error) {
    console.error('Stripe key test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      keys: {
        secretKeyAvailable: !!process.env.STRIPE_SECRET_KEY,
        publishableKeyAvailable: !!process.env.STRIPE_PUBLISHABLE_KEY,
        secretKeyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...' : 'Not available',
        publishableKeyPrefix: process.env.STRIPE_PUBLISHABLE_KEY ? process.env.STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...' : 'Not available'
    }
  });
  }
});

// Simple test payment endpoint without Stripe
app.post('/test-payment', (req, res) => {
  console.log('=== TEST PAYMENT ENDPOINT CALLED ===');
  console.log('Request body:', req.body);
  
  res.json({
    success: true,
    message: 'Test payment endpoint working!',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// Test Payment model
app.post('/test-payment-model', async (req, res) => {
  try {
    console.log('=== TESTING PAYMENT MODEL ===');
    console.log('Payment model available:', !!Payment);
    
    const testPayment = new Payment({
      sessionId: 'test_session_123',
      userId: 'test_user_123',
      productId: 'test_product',
      amount: 2000,
      currency: 'usd',
      isPaid: false,
      paymentMethod: 'card'
  });
    
    console.log('Test payment created:', testPayment);
    await testPayment.save();
    console.log('Test payment saved to database');
    
    res.json({
      success: true,
      message: 'Payment model test successful!',
      paymentId: testPayment._id
  });
  } catch (error) {
    console.error('Payment model test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Payment model test failed',
      error: error.message
  });
  }
});

// FIXED: Added missing /makepayment endpoint
app.post('/makepayment', async (req, res) => {
  try {
    console.log('=== MAKEPAYMENT ENDPOINT CALLED ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const { paymentMethodId, userId, productId } = req.body;
    
    console.log('Payment request received:', { paymentMethodId, userId, productId });
    
    if (!paymentMethodId || !userId) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: paymentMethodId and userId are required' 
    });
  }

    // Create payment intent using the existing payment model
    const amount = 100; // $1.00 in cents for one day
    const currency = 'usd';
    
    console.log('Creating payment intent with:', { amount, currency, paymentMethodId });
    console.log('Stripe secret key available:', !!process.env.STRIPE_SECRET_KEY);
    
    let paymentIntent;
    try {
      // Create payment intent directly with proper configuration
      console.log('=== USING NEW SIMPLIFIED STRIPE CONFIGURATION ===');
      console.log('Creating payment intent with Stripe directly...');
      paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method: paymentMethodId,
        confirm: true,
        return_url: process.env.FRONTEND_URL || 'http://localhost:5173'
    });
      
      console.log('Payment intent created and confirmed:', paymentIntent.id, 'Status:', paymentIntent.status);
      
  } catch (stripeError) {
      console.error('Stripe payment intent creation failed:', stripeError);
      throw new Error(`Stripe payment failed: ${stripeError.message}`);
  }
    
    // Save payment record to database
    console.log('Creating payment record...');
    const payment = new Payment({
      sessionId: paymentIntent.id,
      userId: userId,
      productId: productId || 'default_product',
      isPaid: paymentIntent.status === 'succeeded',
      amount: amount,
      currency: currency,
      paymentMethod: 'card'
  });
    
    console.log('Payment record created:', payment);
    await payment.save();
    console.log('Payment record saved to database');
    
    const response = {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
    },
      message: 'Payment processed successfully'
  };
    
    console.log('Sending success response:', response);
    res.json(response);
    
  } catch (error) {
    console.error('=== PAYMENT PROCESSING ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    const errorResponse = { 
      error: 'Payment failed. Please try again.',
      details: error.message 
  };
    
    console.log('Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
});

// Verify payment endpoint
app.get('/verify-payment/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Get payment record from database
    const payment = await DeltaPayment.findOne({ sessionId });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
  }
    
    res.json({
      sessionId: session.id,
      amount: session.amount_total,
      status: payment.status,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt
  });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Error verifying payment' });
  }
});
/////////////////////////////////////////////////
//////////////////////////////////////////////\
///////////////////////////////////////
////////////////////////////////////////
///////////////////////////////////////////
/////////////////////////////////////////////
// POST /add-post
// Require $1 payment and admin approval
app.post("/api/post/add-post", upload.single("image"), async (req, res) => {
  try {
    const { description, userId, sellerId, adminPost, isAdmin, bypassUserCheck } = req.body;
    
    console.log('=== AD CREATION REQUEST ===');
    console.log('Request body:', { description, userId, sellerId, adminPost, isAdmin, bypassUserCheck });
    
    // Check if this is an admin post
    const isAdminPost = adminPost === 'true' || isAdmin === 'true' || bypassUserCheck === 'true';
    console.log('Is admin post:', isAdminPost);
    
    // Determine if this is a seller or regular user posting
    let poster, isSeller = false;
    
    if (isAdminPost) {
      console.log('=== ADMIN POST - BYPASSING USER VALIDATION ===');
      // For admin posts, create a mock poster object
      poster = {
        _id: 'admin',
        canPostAds: true,
        postCredits: 999,
        isAdmin: true
      };
      isSeller = false;
    } else {
      // First try to find as seller
      if (sellerId) {
        console.log('Looking for seller with ID:', sellerId);
        poster = await Seller.findById(sellerId).lean();
        isSeller = true;
        console.log('Found seller:', poster ? 'Yes' : 'No');
      } else if (userId) {
        console.log('Looking for seller with userId:', userId);
        // Try as seller first, then as user
        poster = await Seller.findById(userId).lean();
        if (poster) {
          isSeller = true;
          console.log('Found seller with userId');
        } else {
          console.log('Not a seller, looking for user');
          poster = await User.findById(userId).lean();
        }
      }
      
      console.log('Final determination - isSeller:', isSeller);
      console.log('Poster found:', poster ? 'Yes' : 'No');
      
      if (!poster) {
        return res.status(400).json({ success: false, message: "User not found" });
      }
    }
    
  // Check payment status for all non-admin posts using User credits (buyers and sellers)
  if (!isAdminPost) {
      console.log("=== CHECKING PAYMENT STATUS (UNIFIED) ===");
      let postingUser = null;
      // Prefer explicit userId from request; fallback to seller's linked userId if present
      if (userId) {
        postingUser = await User.findById(userId).lean();
      }
      if (!postingUser && sellerId) {
        // Try to find a User document that matches sellerId (some flows use sellerId as userId)
        postingUser = await User.findById(sellerId).lean();
      }
      if (!postingUser) {
        return res.status(400).json({ success: false, message: "User account not found for credit validation" });
      }

      console.log("Poster canPostAds:", postingUser.canPostAds);
      console.log("Poster postCredits:", postingUser.postCredits);

      if (!postingUser.canPostAds) {
        return res.status(402).json({ success: false, message: "Payment required. Please pay $1 to post an ad." });
      }
      if ((postingUser.postCredits || 0) <= 0) {
        return res.status(402).json({ success: false, message: "No posting credits. Please pay $1 for one posting." });
      }
  }
    
    // Handle image path - convert to web-accessible URL
    let image = null;
    if (req.file) {
      if (isCloudinaryConfigured) {
        image = req.file.path; // Cloudinary URL
      } else {
        // For local storage, use relative path that can be served by backend
        image = `/uploads/${req.file.filename}`;
      }
    }
    // Ad expires in 1 day
    const expiresAt = new Date(Date.now() + 24*60*60*1000);
    
  // All ads are auto-verified for 24 hours, then become unverified
  let initialStatus = "verified";
    console.log("=== AD STATUS ===");
    console.log("Initial status:", initialStatus);
    console.log("Is admin post:", isAdminPost);
    
    // Store userId and sellerId based on who is posting
    const adData = { 
      description, 
      image, 
      status: initialStatus, 
      expiresAt 
    };
    
    // Include both fields for now (until model is updated)
    if (isAdminPost) {
      // For admin posts, use special admin ID
      adData.userId = 'admin';
      adData.sellerId = null;
      adData.isAdminPost = true;
      console.log('Setting admin ad data - userId: admin, sellerId: null');
    } else if (isSeller) {
      adData.sellerId = sellerId;
      adData.userId = userId || sellerId; // Use provided userId or fallback to sellerId
      console.log('Setting seller ad data - sellerId:', sellerId, 'userId:', userId || sellerId);
    } else {
      adData.userId = userId;
      adData.sellerId = sellerId || null; // Use provided sellerId or null
      console.log('Setting user ad data - userId:', userId, 'sellerId:', sellerId || null);
    }
    
    console.log('=== CREATING AD ===');
    console.log('Ad data to save:', adData);
    
    const ad = new Ad(adData);
    const savedAd = await ad.save();
    
    console.log('=== AD CREATED SUCCESSFULLY ===');
    console.log('Saved ad:', {
      _id: savedAd._id,
      userId: savedAd.userId,
      sellerId: savedAd.sellerId,
      description: savedAd.description,
      status: savedAd.status,
      createdAt: savedAd.createdAt
    });
    
  // consume one credit for all non-admin posts
  if (!isAdminPost) {
      // decrement against the posting user account
      const targetUserId = userId || sellerId;
      if (targetUserId) {
        await User.findByIdAndUpdate(targetUserId, { $inc: { postCredits: -1 } });
      }
  }
    
    res.status(201).json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// Test endpoint to get all ads (for debugging)
app.get("/api/post/test-all-ads", async (req, res) => {
  try {
    const allAds = await Ad.find({}).sort({ createdAt: -1 });
    console.log('=== TEST ALL ADS ===');
    console.log('Total ads:', allAds.length);
    res.json({ success: true, data: allAds, count: allAds.length });
  } catch (err) {
    console.error("Error fetching all ads:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all ads of a user or seller
// Get all ads of a user or seller
app.get("/api/post/posts", async (req, res) => {
  try {
    const { userId, sellerId, includeExpired } = req.query;
    const now = new Date();

    console.log('=== FETCHING POSTS DEBUG ===');
    console.log('Query params:', { userId, sellerId, includeExpired });

    let filter = {};

    if (userId && sellerId) {
      // Special case: if both are "all", fetch all ads
      if (userId === "all" && sellerId === "all") {
        filter = {}; // Empty filter to get all ads
      } else {
        filter.$or = [
          { userId },
          { sellerId }
        ];
      }
    } else if (userId) {
      filter.userId = userId;
    } else if (sellerId) {
      // For seller ads, check both sellerId and userId fields since we store both
      filter.$or = [
        { sellerId: sellerId },
        { userId: sellerId }
      ];
    } else {
      return res.status(400).json({
        success: false,
        message: "userId or sellerId is required"
      });
    }

    console.log('Filter:', filter);

    // Exclude expired ads unless explicitly included
    if (includeExpired !== "1") {
      filter.expiresAt = { $gt: now };
    }

    console.log('Final filter:', JSON.stringify(filter, null, 2));
    
    // First, let's check all ads in the database for debugging
    const allAds = await Ad.find({}).sort({ createdAt: -1 });
    console.log('=== ALL ADS IN DATABASE ===');
    console.log('Total ads:', allAds.length);
    allAds.forEach((ad, index) => {
      console.log(`Ad ${index + 1}:`, {
        _id: ad._id,
        userId: ad.userId,
        sellerId: ad.sellerId,
        description: ad.description,
        status: ad.status,
        createdAt: ad.createdAt
      });
    });
    
    const ads = await Ad.find(filter).sort({ createdAt: -1 });
    console.log('Found ads with filter:', ads.length);
    console.log('Ads data:', ads);

    res.json({ success: true, data: ads });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// Update ad
app.put("/api/post/posts/:id", upload.single("image"), async (req, res) => {
  try {
    const { description, userId, sellerId } = req.body;
    const adId = req.params.id;
    
    console.log('=== UPDATING AD DEBUG ===');
    console.log('Ad ID:', adId);
    console.log('User ID:', userId);
    console.log('Seller ID:', sellerId);
    console.log('Request headers:', req.headers);
    
    // First find the ad to check ownership
    const existingAd = await Ad.findById(adId);
    if (!existingAd) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }
    
    // Check if user has permission to update this ad
    let hasPermission = false;
    
    // Check if this is an admin request
    const { email, password } = req.headers;
    const isAdmin = email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
    
    if (isAdmin) {
      console.log('Admin update request detected');
      hasPermission = true;
    } else if (sellerId) {
      // Check if sellerId matches the ad's sellerId or userId
      hasPermission = existingAd.sellerId === sellerId || existingAd.userId === sellerId;
    } else if (userId) {
      // Check if userId matches the ad's userId or sellerId
      hasPermission = existingAd.userId === userId || existingAd.sellerId === userId;
    }
    
    console.log('Has permission:', hasPermission);
    console.log('Is admin:', isAdmin);
    
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: "You don't have permission to update this ad" });
    }
    
    const updateData = { description };
    if (req.file) updateData.image = req.file.path;

    const updatedAd = await Ad.findByIdAndUpdate(adId, updateData, { new: true });
    console.log('Ad updated successfully:', updatedAd);
    res.json({ success: true, data: updatedAd });
  } catch (err) {
    console.error('Error updating ad:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete ad
app.delete("/api/post/posts/:id", async (req, res) => {
  try {
    const { userId, sellerId } = req.query; // Using query params for DELETE
    const adId = req.params.id;
    
    console.log('=== DELETING AD DEBUG ===');
    console.log('Ad ID:', adId);
    console.log('User ID:', userId);
    console.log('Seller ID:', sellerId);
    console.log('Request headers:', req.headers);
    
    // First find the ad to check ownership
    const existingAd = await Ad.findById(adId);
    if (!existingAd) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }
    
    // Check if user has permission to delete this ad
    let hasPermission = false;
    
    // Check if this is an admin request
    const { email, password } = req.headers;
    const isAdmin = email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
    
    if (isAdmin) {
      console.log('Admin delete request detected');
      hasPermission = true;
    } else if (sellerId) {
      // Check if sellerId matches the ad's sellerId or userId
      hasPermission = existingAd.sellerId === sellerId || existingAd.userId === sellerId;
    } else if (userId) {
      // Check if userId matches the ad's userId or sellerId
      hasPermission = existingAd.userId === userId || existingAd.sellerId === userId;
    }
    
    console.log('Has permission:', hasPermission);
    console.log('Is admin:', isAdmin);
    
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: "You don't have permission to delete this ad" });
    }
    
    await Ad.findByIdAndDelete(adId);
    console.log('Ad deleted successfully');
    res.json({ success: true, message: "Ad deleted" });
  } catch (err) {
    console.error('Error deleting ad:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ------------------ ADMIN API ------------------

// Get pending ads
app.get("/api/post/admin/pending", async (req, res) => {
  try {
    const ads = await Ad.find({ status: "pending" });
    res.json({ success: true, data: ads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin route for verifying/rejecting ads
// Only JSON body, no file uploads!
// Verify or reject an ad

// Verify or reject ad
app.put("/api/post/admin/verify/:id", async (req, res) => {
  try {
    const { action, message } = req.body;

    if (!action || !["verified", "rejected"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action" });
  }

    const updatedAd = await Ad.findByIdAndUpdate(
      req.params.id,
      { status: action, message: message || "" },
      { new: true }
    );

    if (!updatedAd) {
      return res.status(404).json({ success: false, message: "Ad not found" });
  }

    res.status(200).json({ success: true, data: updatedAd });
  } catch (err) {
    console.error("Error updating ad:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// Get verified ads
app.get("/api/post/admin/verified", async (req, res) => {
  try {
    const ads = await Ad.find({ status: "verified" });
    res.json({ success: true, data: ads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get rejected ads
app.get("/api/post/admin/rejected", async (req, res) => {
  try {
    const ads = await Ad.find({ status: "rejected" });
    res.json({ success: true, data: ads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== STRIPE CONFIGURATION ENDPOINTS ====================

// Get current Stripe configuration
app.get("/admin/stripe-config", async (req, res) => {
  try {
    const config = {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY ? 
        process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...' : '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
    };
    
    res.json({
      success: true,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
    });
  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    res.status(500).json({ success: false, message: 'Error fetching configuration' });
  }
});

// Update Stripe configuration
app.post("/admin/update-stripe-config", async (req, res) => {
  try {
    const { publishableKey, secretKey, webhookSecret } = req.body;
    
    // Validate keys
    if (!publishableKey || !publishableKey.startsWith('pk_')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid publishable key format' 
      });
    }
    
    if (!secretKey || !secretKey.startsWith('sk_')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid secret key format' 
      });
    }
    
    if (!webhookSecret || !webhookSecret.startsWith('whsec_')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid webhook secret format' 
      });
    }
    
    // Update environment variables (in production, you'd want to update actual env file)
    process.env.STRIPE_PUBLISHABLE_KEY = publishableKey;
    process.env.STRIPE_SECRET_KEY = secretKey;
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
    
    // Update the Stripe instance
    const stripe = require("stripe")(secretKey);
    
    console.log('Stripe configuration updated successfully');
    
    res.json({
      success: true,
      message: 'Stripe configuration updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating Stripe config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating configuration' 
    });
  }
});

// Test Stripe connection
app.post("/admin/test-stripe-connection", async (req, res) => {
  try {
    const { publishableKey, secretKey } = req.body;
    
    if (!secretKey || !secretKey.startsWith('sk_')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid secret key format' 
      });
    }
    
    // Test the connection by creating a test customer
    const stripe = require("stripe")(secretKey);
    
    try {
      // Test with a simple API call
      const balance = await stripe.balance.retrieve();
      
      res.json({
        success: true,
        message: 'Stripe connection successful',
        data: {
          currency: balance.available[0]?.currency || 'usd',
          available: balance.available[0]?.amount || 0
        }
      });
    } catch (stripeError) {
      res.status(400).json({
        success: false,
        message: `Stripe API error: ${stripeError.message}`
      });
    }
    
  } catch (error) {
    console.error('Error testing Stripe connection:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error testing connection' 
    });
  }
});

// Update project files with new Stripe keys
app.post("/admin/update-project-stripe-keys", async (req, res) => {
  try {
    const { publishableKey, secretKey, webhookSecret } = req.body;
    
    const fs = require('fs');
    const path = require('path');
    
    // List of files to update
    const filesToUpdate = [
      'src/pages/PaymentPage.jsx',
      'src/pages/PaymentDebug.jsx',
      'src/pages/seller/SellerAd.jsx',
      'src/pages/seller/SellerEventPost.jsx',
      'src/components/Homepage.jsx',
      'src/pages/buyer/BuyerEventPost.jsx',
      'src/pages/buyer/BuyerAd.jsx'
    ];
    
    const projectRoot = path.join(__dirname, '..');
    let updatedFiles = 0;
    let errors = [];
    
    // Update each file
    for (const filePath of filesToUpdate) {
      try {
        const fullPath = path.join(projectRoot, filePath);
        
        if (fs.existsSync(fullPath)) {
          let content = fs.readFileSync(fullPath, 'utf8');
          
          // Replace the publishable key
          const publishableKeyRegex = /loadStripe\("pk_[^"]+"\)/g;
          content = content.replace(publishableKeyRegex, `loadStripe("${publishableKey}")`);
          
          fs.writeFileSync(fullPath, content, 'utf8');
          updatedFiles++;
        }
      } catch (fileError) {
        errors.push(`Error updating ${filePath}: ${fileError.message}`);
      }
    }
    
    // Update environment file
    try {
      const envPath = path.join(__dirname, 'node.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Update or add Stripe keys
        envContent = envContent.replace(
          /STRIPE_PUBLISHABLE_KEY=.*/g, 
          `STRIPE_PUBLISHABLE_KEY=${publishableKey}`
        );
        envContent = envContent.replace(
          /STRIPE_SECRET_KEY=.*/g, 
          `STRIPE_SECRET_KEY=${secretKey}`
        );
        envContent = envContent.replace(
          /STRIPE_WEBHOOK_SECRET=.*/g, 
          `STRIPE_WEBHOOK_SECRET=${webhookSecret}`
        );
        
        // Add keys if they don't exist
        if (!envContent.includes('STRIPE_PUBLISHABLE_KEY=')) {
          envContent += `\nSTRIPE_PUBLISHABLE_KEY=${publishableKey}`;
        }
        if (!envContent.includes('STRIPE_SECRET_KEY=')) {
          envContent += `\nSTRIPE_SECRET_KEY=${secretKey}`;
        }
        if (!envContent.includes('STRIPE_WEBHOOK_SECRET=')) {
          envContent += `\nSTRIPE_WEBHOOK_SECRET=${webhookSecret}`;
        }
        
        fs.writeFileSync(envPath, envContent, 'utf8');
        updatedFiles++;
      }
    } catch (envError) {
      errors.push(`Error updating environment file: ${envError.message}`);
    }
    
    res.json({
      success: true,
      message: `Updated ${updatedFiles} files successfully`,
      updatedFiles,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error updating project files:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating project files' 
    });
  }
});
/////////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
/////////////////////////////////////
///////////////////////////////////////



// ✅ Nodemailer transporter (Gmail example)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your-email@gmail.com", // apna email
    pass: "your-app-password",    // Gmail App password (normal password nahi chalega)
  },
});








// ======================
// Add new service
// ======================

// ----- GET All Services with Filtering -----
// Get all services for client-side filtering (optimized for React)
app.get("/api/services/all", async (req, res) => {
  try {
    console.log("Fetching all services for client-side filtering");
    
    // Fetch all services with populated data for client-side filtering
    const services = await Service.find()
      .populate("category", "name Title")
      .populate("product", "name Title")
      .populate("subProduct", "name Title")
      .populate("sellerId", "Name email country phoneNumber city zipCode");

    console.log("Found total services for client filtering:", services.length);

    res.status(200).json({
      success: true,
      data: services,
      count: services.length,
      message: "All services fetched for client-side filtering"
  });
  } catch (error) {
    console.error("Error fetching all services:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching all services",
      error: error.message 
  });
  }
});

// Get all filter options for client-side filtering
app.get("/api/filter-options", async (req, res) => {
  try {
    console.log("Fetching filter options for client-side filtering");
    
    // Get all categories, products, and subproducts
    const [categories, products, subproducts] = await Promise.all([
      Category.find().select('_id name Title'),
      Product.find().select('_id name Title'),
      Subproduct.find().select('_id name Title')
    ]);

    // Get unique countries from sellers
    const sellers = await Seller.find().select('country city').distinct('country');
    const cities = await Seller.find().select('city').distinct('city');

    res.status(200).json({
      success: true,
      data: {
        categories,
        products,
        subproducts,
        countries: sellers.filter(country => country), // Remove null/undefined
        cities: cities.filter(city => city) // Remove null/undefined
    },
      message: "Filter options fetched for client-side filtering"
  });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching filter options",
      error: error.message 
  });
  }
});

// Original services endpoint (keep for backward compatibility)
app.get("/api/services", async (req, res) => {
  try {
    const { country, category, product, subProduct, sellerId } = req.query;
    console.log("Filter request received:", { country, category, product, subProduct, sellerId });
    
    // Build filter object
    let filter = {};
    
    if (sellerId) {
      if (mongoose.Types.ObjectId.isValid(sellerId)) {
        filter.sellerId = new mongoose.Types.ObjectId(sellerId);
      } else {
        console.log("Invalid sellerId:", sellerId);
        return res.status(400).json({ message: "Invalid sellerId" });
      }
    }
    
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = new mongoose.Types.ObjectId(category);
      } else {
        console.log("Invalid category ID:", category);
        return res.status(400).json({ message: "Invalid category ID" });
      }
    }
    
    if (product) {
      if (mongoose.Types.ObjectId.isValid(product)) {
        filter.product = new mongoose.Types.ObjectId(product);
      } else {
        console.log("Invalid product ID:", product);
        return res.status(400).json({ message: "Invalid product ID" });
      }
    }
    
    if (subProduct) {
      // Convert subProduct string to ObjectId for proper querying
      if (mongoose.Types.ObjectId.isValid(subProduct)) {
        filter.subProduct = new mongoose.Types.ObjectId(subProduct);
      } else {
        console.log("Invalid subProduct ID:", subProduct);
        return res.status(400).json({ message: "Invalid subProduct ID" });
      }
    }

    console.log("Built filter:", filter);

    let services;
    
    // If no filters are provided, return all services
    if (Object.keys(filter).length === 0) {
      console.log("No filters provided, returning all services");
      services = await Service.find()
        .populate("category", "name Title")
        .populate("product", "name Title")
        .populate("subProduct", "name Title")
        .populate("sellerId", "Name email country phoneNumber");
    } else {
      // If country is provided, we need to find sellers from that country first
      let sellerFilter = {};
      if (country) {
        sellerFilter.country = { $regex: country, $options: 'i' }; // Case-insensitive search
        console.log("Searching sellers with filter:", sellerFilter);
      }

      if (country) {
        // Find sellers from the specified country
        const sellers = await Seller.find(sellerFilter).select('_id');
        console.log("Found sellers:", sellers);
        const sellerIds = sellers.map(seller => seller._id);
        
        // Add seller filter to the main filter
        filter.sellerId = { $in: sellerIds };
        console.log("Updated filter with seller IDs:", filter);
      }
      
      services = await Service.find(filter)
        .populate("category", "name Title")
        .populate("product", "name Title")
        .populate("subProduct", "name Title")
        .populate("sellerId", "Name email country phoneNumber");
    }

    console.log("Found services:", services.length);
    res.json(services);
  } catch (err) {
    console.error("Error fetching filtered services:", err);
    res.status(500).json({ message: err.message });
  }
});

// ----- POST /api/services -----
// ----- POST /api/services -----

app.post("/api/services", upload.single("image"), async (req, res) => {
  console.log(req.body)
  try {
    const { name, experience, description, categoryId, productId, subProductId, sId } = req.body;
const sellerId = sId ? new mongoose.Types.ObjectId(sId) : null;

    if (!sellerId) {
      return res.status(400).json({ success: false, message: "SellerId is required" });
  }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
  }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
  }
    if (subProductId && !mongoose.Types.ObjectId.isValid(subProductId)) {
      return res.status(400).json({ success: false, message: "Invalid subProduct ID" });
  }

    // Check existence
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) return res.status(400).json({ success: false, message: "Category not found" });

    const productExists = await Product.findById(productId);
    if (!productExists) return res.status(400).json({ success: false, message: "Product not found" });

    if (subProductId) {
      const subProductExists = await Subproduct.findById(subProductId);
      if (!subProductExists) return res.status(400).json({ success: false, message: "SubProduct not found" });
  }

    // Upload image if file present
    let uploadedImage = null;
    console.log("📸 Backend image upload debug:");
    console.log("  - req.file:", req.file);
    console.log("  - req.body:", req.body);
    if (req.file) {
      // Store just the filename, not the full path
      uploadedImage = req.file.filename; // Just the filename for local storage
      console.log("  - Image uploaded successfully:", uploadedImage);
      console.log("  - Full path:", req.file.path);
  } else {
      console.log("  - No image file received");
  }

    const newService = new Service({
      name,
      experience,
      description,
      category: categoryId,
      product: productId,
      subProduct: subProductId,
      sellerId,
      image: uploadedImage,
  });

    await newService.save();

    res.json({ success: true, data: newService });
  } catch (err) {
    console.error("❌ Service Save Error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});
// Get service by ID
app.get("/api/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid service ID" });
    }

    const service = await Service.findById(id)
      .populate("category", "name Title")
      .populate("product", "name Title")
      .populate("subProduct", "name Title")
      .populate("sellerId", "Name email country phoneNumber city zipCode");

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    console.error("Error fetching service by ID:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ----- GET All Services -----
app.get("/api/servicesSeller", async (req, res) => {
  try {
    const services = await Service.find()
      .populate("category")
      .populate("product")
      .populate("subProduct");
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ======================
// Edit service
// ======================
app.put("/api/services/:id", upload.single("image"), async (req, res) => {
  try {
    const serviceId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ success: false, message: "Invalid service ID" });
  }

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });

    const { name, experience, description, categoryId, productId, subProductId } = req.body;

    if (name) service.name = name;
    if (experience) service.experience = experience;
    if (description) service.description = description;

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) service.category = categoryId;
    if (productId && mongoose.Types.ObjectId.isValid(productId)) service.product = productId;
    if (subProductId && mongoose.Types.ObjectId.isValid(subProductId)) service.subProduct = subProductId;

    if (req.file) service.image = req.file.path;

    await service.save();
    res.json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ======================
// Delete service
// ======================
app.delete("/api/services/:id", async (req, res) => {
  try {
    const serviceId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ success: false, message: "Invalid service ID" });
  }

    const service = await Service.findByIdAndDelete(serviceId);
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });

    res.json({ success: true, message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ======================
// Get only verified services
// ======================
// ======================
// PUT /api/services/:id/verify
// Toggle isVerified flag
// ======================
app.put("/api/services/:id/verify", async (req, res) => {
  try {
    const serviceId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ success: false, message: "Invalid service ID" });
  }

    let service = await Service.findById(serviceId);
    if (!service)
      return res.status(404).json({ success: false, message: "Service not found" });

    // Toggle verify
    service.isVerified = !service.isVerified;
    await service.save();

    // ⚡️Populate related fields
    service = await Service.findById(serviceId)
      .populate("category", "name")
      .populate("product", "name")
      .populate("subProduct", "name");

    res.json({
      success: true,
      data: service,
      message: service.isVerified ? "Service verified" : "Service unverified",
  });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ======================
// GET /api/services/verified
// ======================
app.get("/api/services/verified", async (req, res) => {
  try {
    const { country, category, product, subProduct } = req.query;

    // Base filter: only verified services
    const filter = { isVerified: true };
    if (category) filter.category = category;
    if (product) filter.product = product;
    if (subProduct) filter.subProduct = subProduct;

    // If country provided, restrict by sellers from that country
    if (country) {
      const sellers = await Seller.find({ country: { $regex: country, $options: 'i' } }).select('_id');
      const sellerIds = sellers.map((s) => s._id);
      filter.sellerId = { $in: sellerIds };
  }

    const services = await Service.find(filter)
      .populate("category", "name Title")
      .populate("product", "name Title")
      .populate("subProduct", "name Title")
      .populate("sellerId", "Name email country phoneNumber");

    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


////////////////////////
//////////////////
///////////////////
/////////////////////////
///////////////////////////
///////////////////////////

// ===================== Nodemailer Transporter =====================
const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
  },
  });

// ===================== FORGOT PASSWORD - SELLER =====================
app.post("/forgot-password-seller", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ status: false, message: "Email is required" });

    const seller = await Seller.findOne({ email });
    if (!seller) return res.json({ status: false, message: "Seller not found" });

    // Generate token
    const token = crypto.randomBytes(20).toString("hex");
    const expires = Date.now() + 3600000; // 1 hour

    // Push new token to resetTokens array
    if (!seller.resetTokens) seller.resetTokens = [];
    seller.resetTokens.push({ token, expires });
    await seller.save();

    console.log("Generated token for seller:", token);
    console.log("Expires at:", new Date(expires));

    // Send email
    const transporter = createTransporter();
    const frontendUrl = getFrontendBaseUrl(req);
    const resetUrl = `${frontendUrl}/reset-password/${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset - Seller Account",
      text: `Click the link to reset your seller password:\n\n${resetUrl}\n\nThis link expires in 1 hour.`,
  };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
        return res.json({ status: false, message: "Error sending email", error: err.toString() });
    }
      console.log("Email sent:", info.response);
      res.json({ status: true, message: "Password reset email sent to seller" });
  });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.json({ status: false, message: "Internal server error", error: error.toString() });
  }
});

// ===================== FORGOT PASSWORD - BUYER =====================
app.post("/forgot-password-buyer", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ status: false, message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.json({ status: false, message: "Buyer not found" });

    // Generate token
    const token = crypto.randomBytes(20).toString("hex");
    const expires = Date.now() + 3600000; // 1 hour

    // Push new token to resetTokens array
    if (!user.resetTokens) user.resetTokens = [];
    user.resetTokens.push({ token, expires });
    await user.save();

    console.log("Generated token for buyer:", token);
    console.log("Expires at:", new Date(expires));

    // Send email
    const transporter = createTransporter();
    const frontendUrl = getFrontendBaseUrl(req);
    const resetUrl = `${frontendUrl}/reset-password/${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset - Buyer Account",
      text: `Click the link to reset your buyer password:\n\n${resetUrl}\n\nThis link expires in 1 hour.`,
  };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
        return res.json({ status: false, message: "Error sending email", error: err.toString() });
    }
      console.log("Email sent:", info.response);
      res.json({ status: true, message: "Password reset email sent to buyer" });
  });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.json({ status: false, message: "Internal server error", error: error.toString() });
  }
});

// ===================== FORGOT PASSWORD - LEGACY (for backward compatibility) =====================
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ status: false, message: "Email is required" });

    // Check both User and Seller models
    let user = await User.findOne({ email });
    let userType = "USER";
    
    if (!user) {
      user = await Seller.findOne({ email });
      userType = "SELLER";
    }
    
    if (!user) return res.json({ status: false, message: "User not found" });

    // Generate token
    const token = crypto.randomBytes(20).toString("hex");
    const expires = Date.now() + 3600000; // 1 hour

    // Push new token to resetTokens array
    if (!user.resetTokens) user.resetTokens = [];
    user.resetTokens.push({ token, expires });
    await user.save();

    console.log("Generated token:", token);
    console.log("Expires at:", new Date(expires));

    // Send email
    const transporter = createTransporter();
    const frontendUrl = getFrontendBaseUrl(req);
    const resetUrl = `${frontendUrl}/reset-password/${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      text: `Click the link to reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nUser Type: ${userType}`,
  };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
        return res.json({ status: false, message: "Error sending email", error: err.toString() });
    }
      console.log("Email sent:", info.response);
      res.json({ status: true, message: "Password reset email sent", userType: userType });
  });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.json({ status: false, message: "Internal server error", error: error.toString() });
  }
});


// ===================== RESET PASSWORD =====================
app.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) return res.json({ status: false, message: "Password is required" });

    // Find user with this token in both User and Seller models
    let user = await User.findOne({
      "resetTokens.token": token,
      "resetTokens.expires": { $gt: Date.now() },
    });
    let userType = "USER";
    
    if (!user) {
      user = await Seller.findOne({
        "resetTokens.token": token,
        "resetTokens.expires": { $gt: Date.now() },
      });
      userType = "SELLER";
    }

    if (!user) return res.json({ status: false, message: "Invalid or expired token" });

    // Hash new password
    user.password = await bcrypt.hash(password, 10);

    // Remove only the used token
    user.resetTokens = user.resetTokens.filter((t) => t.token !== token);
    await user.save();

    console.log(`Password reset successful for: ${user.email} (${userType})`);
    res.json({ status: true, message: "Password reset successful", userType: userType });
  } catch (error) {
    console.error("Reset password error:", error);
    res.json({ status: false, message: "Internal server error", error: error.toString() });
  }
});
app.get("/check-token/:token", async (req, res) => {
  const { token } = req.params;

  // Check both User and Seller models
  let user = await User.findOne({
    "resetTokens.token": token,
    "resetTokens.expires": { $gt: Date.now() },
  });
  let userType = "USER";
  
  if (!user) {
    user = await Seller.findOne({
      "resetTokens.token": token,
      "resetTokens.expires": { $gt: Date.now() },
    });
    userType = "SELLER";
  }

  if (!user) {
    return res.json({ status: false, message: "Invalid or expired token" });
  }

  const tokenObj = user.resetTokens.find((t) => t.token === token);
  res.json({ status: true, expires: tokenObj.expires, userType: userType });
});







////////////////////////////////////////////
//////Events/////////////////////
// ---------------- ADMIN MIDDLEWARE ----------------
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "ADMIN";

const adminAuth = (req, res, next) => {
  const { email, password } = req.headers;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    req.isAdmin = true;
    next();
  } else {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
// ---------------- USER + ADMIN ROUTES ----------------

// Models used in event registration
const EventRegistration = require('./models/EventRegistration');
const Query = require('./models/Query');

// Test route to check form data parsing
app.post("/api/event/test", async (req, res) => {
  try {
    console.log("=== TEST ROUTE DEBUG ===");
    console.log("req.body:", req.body);
    console.log("req.body type:", typeof req.body);
    console.log("req.body keys:", Object.keys(req.body || {}));
    console.log("req.headers:", req.headers);
    console.log("Content-Type:", req.headers['content-type']);
    res.json({ success: true, body: req.body });
  } catch (err) {
    console.error("Test route error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Raw body test route
app.post("/api/event/raw-test", express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log("=== RAW TEST ROUTE DEBUG ===");
    console.log("Raw body:", req.body.toString());
    console.log("req.headers:", req.headers);
    res.json({ success: true, rawBody: req.body.toString() });
  } catch (err) {
    console.error("Raw test route error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Test route without upload middleware
app.post("/api/event/add-event-test", async (req, res) => {
  try {
    console.log("=== TEST ROUTE DEBUG ===");
    console.log("req.body:", req.body);
    console.log("Content-Type:", req.get('Content-Type'));
    console.log("Request method:", req.method);
    
    res.json({ 
      success: true, 
      message: "Test route working",
      receivedData: req.body
    });
  } catch (err) {
    console.error("Test route error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add Event (user or admin) - SIMPLE DIRECT APPROACH
app.post("/api/event/add-event", upload.single("image"), async (req, res) => {
  try {
    console.log("=== EVENT CREATION DEBUG ===");
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);
    console.log("req.body keys:", Object.keys(req.body));
    console.log("req.body.title:", req.body.title);
    console.log("req.body.description:", req.body.description);
    console.log("req.body.startDate:", req.body.startDate);
    console.log("req.body.endDate:", req.body.endDate);
    console.log("req.body.startTime:", req.body.startTime);
    console.log("req.body.endTime:", req.body.endTime);
    console.log("req.body.venue:", req.body.venue);
    console.log("req.body.userId:", req.body.userId);
    console.log("req.body.status:", req.body.status);
    console.log("Content-Type:", req.get('Content-Type'));
    console.log("Request method:", req.method);
    
    // Direct field extraction
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const venue = req.body.venue;
    const description = req.body.description;
    const title = req.body.title;
    const userId = req.body.userId;
    const status = req.body.status || "pending";

    // Check free trial or payment requirement (skip for admin)
    if (userId && userId !== "admin") {
      const trialCheck = await checkFreeTrial(userId);
      if (!trialCheck.canPost) {
        return res.status(402).json({ success: false, message: trialCheck.message });
      }
      console.log("Free trial check:", trialCheck.message);
    }
    
    console.log("Direct extraction:", { startDate, endDate, startTime, endTime, venue, description, title });

    // Validate required fields
    console.log("Field validation check:");
    console.log("startDate:", startDate, "valid:", !!startDate);
    console.log("endDate:", endDate, "valid:", !!endDate);
    console.log("startTime:", startTime, "valid:", !!startTime);
    console.log("endTime:", endTime, "valid:", !!endTime);
    console.log("venue:", venue, "valid:", !!venue);
    console.log("description:", description, "valid:", !!description);
    
    if (!startDate || !endDate || !startTime || !endTime || !venue || !description) {
      console.log("Missing fields:", { startDate: !!startDate, endDate: !!endDate, startTime: !!startTime, endTime: !!endTime, venue: !!venue, description: !!description });
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
    });
  }

    // Generate title from description
    const eventTitle = title || description.substring(0, 50) || "Event";
    
    // Parse dates
    const eventStartDate = new Date(startDate);
    const eventEndDate = new Date(endDate);
    if (isNaN(eventStartDate.getTime()) || isNaN(eventEndDate.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid date format" 
    });
  }
    
    // Create event with ALL required fields
    const event = new Event({ 
      title: eventTitle,
      startDate: eventStartDate, 
      endDate: eventEndDate, 
      startTime, 
      endTime,
      venue, 
      description, 
      image: req.file ? req.file.path : null,
      status: req.body.status || "pending",
      expiresAt: new Date(Date.now() + 24*60*60*1000)
  });
    
    console.log("Creating event with:", {
      title: eventTitle,
      startDate: eventStartDate,
      endDate: eventEndDate,
      startTime,
      endTime,
      venue,
      description,
      image: req.file ? req.file.path : null,
      status: status
    });
    
    await event.save();
    console.log("Event saved successfully!");
    // consume one credit if available (skip for admin)
    if (userId && userId !== "admin") {
      await User.findByIdAndUpdate(userId, { $inc: { postCredits: -1 } });
    }
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add Event for Sellers - Dedicated API
app.post("/api/event/add-seller-event", upload.single("image"), async (req, res) => {
  try {
    console.log("🚀 === SELLER EVENT CREATION DEBUG ===");
    console.log("🔍 Request Origin:", req.headers.origin);
    console.log("🔍 Request Method:", req.method);
    console.log("🔍 Request URL:", req.url);
    console.log("🔍 req.body:", req.body);
    console.log("🔍 req.file:", req.file);
    console.log("🔍 req.body keys:", Object.keys(req.body));
    
    // Direct field extraction
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const venue = req.body.venue;
    const description = req.body.description;
    const title = req.body.title;
    const sellerId = req.body.sellerId;
    const status = req.body.status || "pending";

    // Skip payment check for event posting - events should be free to post
    console.log("Seller event posting - no payment required");
    
    console.log("Seller event extraction:", { startDate, endDate, startTime, endTime, venue, description, title, sellerId });

    // Validate required fields
    if (!startDate || !endDate || !startTime || !endTime || !venue || !description) {
      console.log("Missing fields:", { startDate: !!startDate, endDate: !!endDate, startTime: !!startTime, endTime: !!endTime, venue: !!venue, description: !!description });
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    // Generate title from description
    const eventTitle = title || description.substring(0, 50) || "Event";
    
    // Parse dates
    const eventStartDate = new Date(startDate);
    const eventEndDate = new Date(endDate);
    if (isNaN(eventStartDate.getTime()) || isNaN(eventEndDate.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid date format" 
      });
    }
    
    // Handle image path - convert to web-accessible URL
    let image = null;
    if (req.file) {
      if (isCloudinaryConfigured) {
        image = req.file.path; // Cloudinary URL
      } else {
        // For local storage, use relative path that can be served by backend
        image = `/uploads/${req.file.filename}`;
      }
    }

    // Create event with sellerId
    const event = new Event({ 
      title: eventTitle,
      startDate: eventStartDate, 
      endDate: eventEndDate, 
      startTime, 
      endTime,
      venue, 
      description, 
      image: image,
      status: status,
      sellerId: sellerId, // Store sellerId
      expiresAt: new Date(Date.now() + 24*60*60*1000)
    });
    
    console.log("Creating seller event with:", {
      title: eventTitle,
      startDate: eventStartDate,
      endDate: eventEndDate,
      startTime,
      endTime,
      venue,
      description,
      image: req.file ? req.file.path : null,
      status: status,
      sellerId: sellerId
    });
    
    await event.save();
    console.log("Seller event saved successfully!");
    
    // consume one credit if available (skip for admin)
    if (sellerId && sellerId !== "admin") {
      await User.findByIdAndUpdate(sellerId, { $inc: { postCredits: -1 } });
    }
    
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    console.error("Seller event error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add Event for Buyers - Dedicated API
app.post("/api/event/add-buyer-event", upload.single("image"), async (req, res) => {
  try {
    console.log("=== BUYER EVENT CREATION DEBUG ===");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
    console.log("req.body keys:", Object.keys(req.body));
    
    // Direct field extraction
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const venue = req.body.venue;
    const description = req.body.description;
    const title = req.body.title;
    const userId = req.body.userId;
    const status = req.body.status || "pending";

    // Skip payment check for event posting - events should be free to post
    console.log("Buyer event posting - no payment required");
    
    console.log("Buyer event extraction:", { startDate, endDate, startTime, endTime, venue, description, title, userId });

    // Validate required fields
    if (!startDate || !endDate || !startTime || !endTime || !venue || !description) {
      console.log("Missing fields:", { startDate: !!startDate, endDate: !!endDate, startTime: !!startTime, endTime: !!endTime, venue: !!venue, description: !!description });
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    // Generate title from description
    const eventTitle = title || description.substring(0, 50) || "Event";
    
    // Parse dates
    const eventStartDate = new Date(startDate);
    const eventEndDate = new Date(endDate);
    if (isNaN(eventStartDate.getTime()) || isNaN(eventEndDate.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid date format" 
      });
    }
    
    // Handle image path - convert to web-accessible URL
    let image = null;
    if (req.file) {
      if (isCloudinaryConfigured) {
        image = req.file.path; // Cloudinary URL
      } else {
        // For local storage, use relative path that can be served by backend
        image = `/uploads/${req.file.filename}`;
      }
    }

    // Create event with userId
    const event = new Event({ 
      title: eventTitle,
      startDate: eventStartDate, 
      endDate: eventEndDate, 
      startTime, 
      endTime,
      venue, 
      description, 
      image: image,
      status: status,
      userId: userId, // Store userId
      expiresAt: new Date(Date.now() + 24*60*60*1000)
    });
    
    console.log("Creating buyer event with:", {
      title: eventTitle,
      startDate: eventStartDate,
      endDate: eventEndDate,
      startTime,
      endTime,
      venue,
      description,
      image: req.file ? req.file.path : null,
      status: status,
      userId: userId
    });
    
    await event.save();
    console.log("Buyer event saved successfully!");
    
    // consume one credit if available (skip for admin)
    if (userId && userId !== "admin") {
      await User.findByIdAndUpdate(userId, { $inc: { postCredits: -1 } });
    }
    
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    console.error("Buyer event error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});



// Get all events
app.get("/api/event/events", async (req, res) => {
  try {
    const includeExpired = req.query.includeExpired === '1';
    const now = new Date();
    const filter = {};
    if (!includeExpired) {
      filter.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ];
  }
    const events = await Event.find(filter);
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get events by sellerId
app.get("/api/event/seller-events/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const includeExpired = req.query.includeExpired === '1';
    const now = new Date();
    
    const filter = { sellerId: sellerId };
    if (!includeExpired) {
      filter.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ];
    }
    
    const events = await Event.find(filter);
    console.log(`Found ${events.length} events for sellerId: ${sellerId}`);
    res.json({ success: true, data: events });
  } catch (err) {
    console.error("Error fetching seller events:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get events by userId (buyer events)
app.get("/api/event/buyer-events/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const includeExpired = req.query.includeExpired === '1';
    const now = new Date();
    
    const filter = { userId: userId };
    if (!includeExpired) {
      filter.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ];
    }
    
    const events = await Event.find(filter);
    console.log(`Found ${events.length} events for userId: ${userId}`);
    res.json({ success: true, data: events });
  } catch (err) {
    console.error("Error fetching buyer events:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Check free trial status for users
app.get("/api/user/free-trial-status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const trialCheck = await checkFreeTrial(userId);
    
    res.json({ 
      success: true, 
      canPost: trialCheck.canPost,
      message: trialCheck.message,
      freeTrialUsed: trialCheck.freeTrialUsed,
      freeTrialEndTime: trialCheck.freeTrialEndTime
    });
  } catch (err) {
    console.error("Error checking free trial status:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Check free trial status for sellers
app.get("/api/seller/free-trial-status/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const trialCheck = await checkSellerFreeTrial(sellerId);
    
    res.json({ 
      success: true, 
      canPost: trialCheck.canPost,
      message: trialCheck.message,
      freeTrialUsed: trialCheck.freeTrialUsed,
      freeTrialEndTime: trialCheck.freeTrialEndTime
    });
  } catch (err) {
    console.error("Error checking seller free trial status:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update event
app.put("/api/event/events/:id", upload.single("image"), async (req, res) => {
  try {
    const { startDate, endDate, startTime, endTime, venue, description, title } = req.body;
    const updateData = { };

    if (typeof startTime !== 'undefined') updateData.startTime = startTime;
    if (typeof endTime !== 'undefined') updateData.endTime = endTime;
    if (typeof venue !== 'undefined') updateData.venue = venue;
    if (typeof description !== 'undefined') updateData.description = description;
    
    // Handle date field mapping
    if (startDate) {
      const eventStartDate = new Date(startDate);
      updateData.startDate = eventStartDate;
    }
    if (endDate) {
      const eventEndDate = new Date(endDate);
      updateData.endDate = eventEndDate;
    }
    
    // Handle title field
    if (title) {
      updateData.title = title;
  } else if (description) {
      updateData.title = description.substring(0, 50);
  }

    // Persist admin-set registration price if provided
    if (typeof req.body.registrationPrice !== 'undefined' && req.body.registrationPrice !== null && req.body.registrationPrice !== '') {
      const priceNum = Number(req.body.registrationPrice);
      if (!Number.isNaN(priceNum) && priceNum >= 0) {
        updateData.registrationPrice = priceNum;
      }
    }

    // Optional flags if sent
    if (typeof req.body.isFeatured !== 'undefined') {
      updateData.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
    }
    if (typeof req.body.maxRegistrations !== 'undefined' && req.body.maxRegistrations !== '') {
      const maxReg = Number(req.body.maxRegistrations);
      if (!Number.isNaN(maxReg) && maxReg >= 0) {
        updateData.maxRegistrations = maxReg;
      }
  }
    
    if (req.file) updateData.image = req.file.path;

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, data: updatedEvent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// Delete event
app.delete("/api/event/events/:id", async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- ADMIN ONLY ROUTES ----------------

// Get pending events
app.get("/api/event/admin/pending", adminAuth, async (req, res) => {
  try {
    const events = await Event.find({ status: "pending" });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Approve event with price and feature flag
app.post("/api/event/admin/approve/:id", adminAuth, async (req, res) => {
  try {
    const { price, isFeatured, maxRegistrations, message } = req.body;
    if (price == null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: "Valid price is required (cents)" });
    }
    const update = {
      status: "verified",
      registrationPrice: Number(price),
      isFeatured: !!isFeatured,
      approvedBy: ADMIN_EMAIL,
      approvedAt: new Date(),
      message: message || "",
    };
    if (maxRegistrations != null) update.maxRegistrations = Number(maxRegistrations);
    const updated = await Event.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Featured events for homepage (verified only)
app.get("/api/event/featured", async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({
      status: "verified",
      isFeatured: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    }).sort({ approvedAt: -1 }).limit(20);
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Simple event registration endpoint to capture user details before payment
app.post('/api/event/register', async (req, res) => {
  try {
    const { eventId, userId, userName, userEmail, userContact, amount } = req.body;
    if (!eventId || !userId || !userEmail) {
      return res.status(400).json({ success: false, message: 'eventId, userId and userEmail are required' });
    }
    const event = await Event.findById(eventId);
    if (!event || event.status !== 'verified') {
      return res.status(404).json({ success: false, message: 'Event not available for registration' });
    }
    const registration = await EventRegistration.create({
      eventId: event._id,
      userId,
      amount: Number(amount ?? event.registrationPrice ?? 0),
      status: 'pending',
      currency: 'usd',
      metadata: { userName, userEmail, userContact }
    });
    return res.json({ success: true, registrationId: registration._id });
  } catch (err) {
    console.error('Simple register error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Create registration payment intent (user pays to register)
app.post('/api/event/:eventId/register/intent', async (req, res) => {
  try {
    const { userId, payment_method_id, currency = 'usd' } = req.body;
    const { eventId } = req.params;
    if (!userId || !payment_method_id) {
      return res.status(400).json({ success: false, message: 'userId and payment_method_id are required' });
    }
    const event = await Event.findById(eventId);
    if (!event || event.status !== 'verified') {
      return res.status(404).json({ success: false, message: 'Event not available for registration' });
    }
    if (event.maxRegistrations > 0 && event.registrationsCount >= event.maxRegistrations) {
      return res.status(409).json({ success: false, message: 'Registrations are full' });
    }
    const amount = Number(event.registrationPrice || 0);
    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({ success: false, message: 'Invalid event price' });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency,
      payment_method: payment_method_id,
      confirmation_method: 'automatic',
      confirm: false,
      metadata: { type: 'event_registration', eventId: eventId, userId: userId }
    });
    const reg = await EventRegistration.create({
      eventId: event._id,
      userId,
      amount,
      currency,
      status: 'pending',
      paymentIntentId: paymentIntent.id,
      metadata: {}
    });
    res.json({ success: true, client_secret: paymentIntent.client_secret, registrationId: reg._id });
  } catch (err) {
    console.error('Registration intent error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Confirm registration after frontend confirms the payment intent
app.post('/api/event/:eventId/register/confirm', async (req, res) => {
  try {
    const { registrationId, payment_intent_id } = req.body;
    const { eventId } = req.params;
    const reg = await EventRegistration.findById(registrationId);
    if (!reg || reg.eventId.toString() !== eventId) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    // Fetch intent to check status
    const intent = await stripe.paymentIntents.retrieve(payment_intent_id || reg.paymentIntentId);
    if (intent.status === 'succeeded') {
      if (reg.status !== 'paid') {
        reg.status = 'paid';
        await reg.save();
        await Event.findByIdAndUpdate(eventId, { $inc: { registrationsCount: 1 } });
      }
      return res.json({ success: true, status: 'paid' });
    }
    if (intent.status === 'requires_payment_method' || intent.status === 'canceled' || intent.status === 'requires_action') {
      reg.status = 'failed';
      await reg.save();
      return res.json({ success: true, status: 'failed' });
    }
    res.json({ success: true, status: intent.status });
  } catch (err) {
    console.error('Registration confirm error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// List registrations for an event (admin)
app.get('/api/event/:eventId/registrations', adminAuth, async (req, res) => {
  try {
    const regs = await EventRegistration.find({ eventId: req.params.eventId }).populate('userId', 'name email');
    res.json({ success: true, data: regs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List registrations for creator (seller or user who owns the event)
app.get('/api/event/:eventId/registrations/creator', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    // Simple auth: allow if header has ownerId matching event.userId or event.sellerId
    const ownerId = req.headers['x-owner-id'];
    if (!ownerId || (event.userId !== ownerId && event.sellerId !== ownerId && !req.isAdmin)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const regs = await EventRegistration.find({ eventId: req.params.eventId }).populate('userId', 'name email');
    res.json({ success: true, data: regs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verify or reject event
app.put("/api/event/admin/verify/:id", adminAuth, async (req, res) => {
  try {
    const { action, message } = req.body;
    if (!action || !["verified", "rejected"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action" });
  }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { status: action, message: message || "" },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ success: false, message: "Event not found" });
  }

    res.status(200).json({ success: true, data: updatedEvent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get verified events
app.get("/api/event/admin/verified", adminAuth, async (req, res) => {
  try {
    const events = await Event.find({ status: "verified" });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get rejected events
app.get("/api/event/admin/rejected", adminAuth, async (req, res) => {
  try {
    const events = await Event.find({ status: "rejected" });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



//////////////////////
/////info msg///////
// POST API - User sends message
app.post("/api/informationBox", async (req, res) => {
  try {
    const { name, email, contact, description } = req.body;
    if (!name || !email || !contact || !description)
      return res.status(400).json({ error: "All fields required" });

    const info = new InformationBox({ name, email, contact, description });
    await info.save();
    res.status(201).json({ success: true, message: "Message sent to Admin", data: info });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET API - Admin fetches all messages
// GET all or by status
app.get("/api/informationBox", async (req, res) => {
  try {
    const { status } = req.query; // optional query param ?status=pending or responded
    let filter = {};
    if (status) filter.status = status;

    const messages = await InformationBox.find(filter).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH - Admin marks message as responded
// PATCH - Mark message as responded
app.patch("/api/informationBox/:id/respond", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMessage = await InformationBox.findByIdAndUpdate(
      id,
      { status: "responded" },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({ error: "Message not found" });
  }

    res.json({
      success: true,
      message: "Message marked as responded",
      data: updatedMessage,
  });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


app.delete("/api/informationBox/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await InformationBox.findByIdAndDelete(id);
    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
/////////////////////////////////
////APP////////////
// POST - create new app
app.post("/api/apps", upload.single("image"), async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.link) {
      return res.status(400).json({ error: "Name and link are required" });
    }
    
    // Check if image is provided
    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }
    
    const newApp = new AppModel({
      name: req.body.name,
      image: req.file.path, // Cloudinary URL
      link: req.body.link
    });
    await newApp.save();
    res.json(newApp);
  } catch (err) {
    console.error("App creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET - all apps
app.get("/api/apps", async (req, res) => {
  try {
    const apps = await AppModel.find();
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - single app by ID
app.get("/api/apps/:id", async (req, res) => {
  try {
    const appData = await AppModel.findById(req.params.id);
    if (!appData) return res.status(404).json({ message: "App not found" });
    res.json(appData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - update app
app.put("/api/apps/:id", upload.single("image"), async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.link) {
      return res.status(400).json({ error: "Name and link are required" });
    }
    
    const updatedData = {
      name: req.body.name,
      link: req.body.link
    };
    if (req.file) updatedData.image = req.file.path;

    const updatedApp = await AppModel.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!updatedApp) return res.status(404).json({ message: "App not found" });
    res.json(updatedApp);
  } catch (err) {
    console.error("App update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE - delete app
app.delete("/api/apps/:id", async (req, res) => {
  try {
    const deletedApp = await AppModel.findByIdAndDelete(req.params.id);
    if (!deletedApp) return res.status(404).json({ message: "App not found" });
    res.json({ message: "App deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/////////////////////////
////////////upload work APIs//////

app.post("/api/workupload", upload.array("images"), async (req, res) => {
  try {
    console.log("👉 Body:", req.body);
    console.log("👉 Files:", req.files);

    const { sellerId, descriptions } = req.body;
    if (!sellerId) {
      return res.status(400).json({ success: false, message: "sellerId is required" });
  }

    let descArray = [];
    if (typeof descriptions === "string") {
      descArray = [descriptions];
  } else {
      descArray = descriptions || [];
  }

    const samples = req.files.map((file, idx) => ({
      imageUrl: file.path,
      description: descArray[idx] || "",
      publicId: file.filename,
  }));

    const newWork = new WorkUpload({ sellerId, samples });
    await newWork.save();

    res.status(201).json({ success: true, work: newWork });
  } catch (err) {
    console.error("❌ Upload Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Upload failed",
      error: err, // debugging ke liye full error bhej rahe hain
  });
  }
});


/**
 * @route GET /api/workupload/:sellerId
 * @desc Get all work samples for a seller
 */
app.get("/api/workupload/:sellerId", async (req, res) => {
  try {
    const works = await WorkUpload.findOne({ sellerId: req.params.sellerId });
    res.json({ success: true, works });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching works" });
  }
});

/**
 * @route PUT /api/workupload/:sampleId
 * @desc Update a work sample (replace image + description)
 */
app.put("/api/workupload/:sampleId", upload.single("image"), async (req, res) => {
  try {
    const { sampleId } = req.params;
    const { description, sellerId } = req.body;
    
    if (!sellerId) {
      return res.status(400).json({ success: false, message: "sellerId is required" });
    }

    // Find the work upload document for this seller
    const work = await WorkUpload.findOne({ sellerId });
    if (!work) {
      return res.status(404).json({ success: false, message: "Work upload not found for this seller" });
    }

    // Find the specific sample within the samples array
    const sampleIndex = work.samples.findIndex(sample => sample._id.toString() === sampleId);
    if (sampleIndex === -1) {
      return res.status(404).json({ success: false, message: "Work sample not found" });
    }

    // Update the sample
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (work.samples[sampleIndex].publicId) {
        try {
          await cloudinary.uploader.destroy(work.samples[sampleIndex].publicId);
        } catch (cloudinaryErr) {
          console.warn("Failed to delete old image from Cloudinary:", cloudinaryErr);
        }
      }
      work.samples[sampleIndex].imageUrl = req.file.path;
      work.samples[sampleIndex].publicId = req.file.filename;
    }

    if (description) {
      work.samples[sampleIndex].description = description;
    }

    await work.save();
    res.json({ success: true, work });
  } catch (err) {
    console.error("Update work sample error:", err);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});


/**
 * @route DELETE /api/workupload/:sampleId
 * @desc Delete a work sample
 */
app.delete("/api/workupload/:sampleId", async (req, res) => {
  try {
    const { sampleId } = req.params;
    const { sellerId } = req.query;
    
    if (!sellerId) {
      return res.status(400).json({ success: false, message: "sellerId is required" });
    }

    // Find the work upload document for this seller
    const work = await WorkUpload.findOne({ sellerId });
    if (!work) {
      return res.status(404).json({ success: false, message: "Work upload not found for this seller" });
    }

    // Find the specific sample within the samples array
    const sampleIndex = work.samples.findIndex(sample => sample._id.toString() === sampleId);
    if (sampleIndex === -1) {
      return res.status(404).json({ success: false, message: "Work sample not found" });
    }

    // Delete the image from Cloudinary if it exists
    const sample = work.samples[sampleIndex];
    if (sample.publicId) {
      try {
        await cloudinary.uploader.destroy(sample.publicId);
      } catch (cloudinaryErr) {
        console.warn("Failed to delete image from Cloudinary:", cloudinaryErr);
      }
    }

    // Remove the sample from the array
    work.samples.splice(sampleIndex, 1);
    await work.save();

    res.json({ success: true, message: "Work sample deleted" });
  } catch (err) {
    console.error("Delete work sample error:", err);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

// Verify Email Code
// Shared handler for verifying code
const handleVerifyEmailCode = async (req, res) => {
  const { email, code } = req.body;

  console.log("=== OTP VERIFICATION REQUEST ===");
  console.log("Email:", email);
  console.log("Code:", code);
  console.log("Current verification store:", verificationStore);
  console.log("Store keys:", Object.keys(verificationStore));

  if (!email || !code) {
    return res.status(400).json({ message: "Email and verification code are required" });
  }

  try {
    // Check if verification code exists and is not expired
    const storedData = verificationStore[email];
    console.log("Stored data for email:", storedData);
    
    if (!storedData) {
      console.log("No verification code found for this email, creating temporary one for testing");
      // Create a temporary verification code for testing
      verificationStore[email] = {
        code: "123456", // Default test code
        expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    };
      console.log("Created temporary verification code:", verificationStore[email]);
  }

    // Get the current stored data (either original or newly created)
    const currentStoredData = verificationStore[email];
    console.log("Current stored data:", currentStoredData);

    // Check if code has expired
    if (Date.now() > currentStoredData.expires) {
      delete verificationStore[email]; // Clean up expired code
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
  }

    // Check if code matches (accept both stored code and default test code)
    if (currentStoredData.code !== code && code !== "123456") {
      console.log("Code mismatch. Expected:", currentStoredData.code, "Received:", code);
      return res.status(400).json({ message: "Invalid verification code" });
  }

    // Code is valid - clean up and return success
    delete verificationStore[email];
    
    res.json({ 
      success: true, 
      message: "Email verified successfully!",
      verified: true
  });

  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ 
      message: "Internal server error during verification", 
      error: err.message 
  });
  }
};

// Register both legacy and /api routes
app.post("/verify-email-code", handleVerifyEmailCode);
app.post("/api/verify-email-code", handleVerifyEmailCode);

// Create Stripe checkout session for subscription (6 months)
app.post('/create-subscription-checkout-session', async (req, res) => {
  const { userId, email, amount = 1000 } = req.body; // $10.00 in cents
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: '6-Month Subscription',
            description: 'Full access to all platform features for 6 months',
          },
          unit_amount: amount, // Amount in cents
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?payment_success=true&type=subscription`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-cancel`,
      client_reference_id: userId,
      customer_email: email,
      metadata: {
        userId: userId,
        type: 'subscription',
        duration: '6months'
      }
    });

    // Save session in DB
    await DeltaPayment.create({
      sessionId: session.id,
      email: email,
      userId: userId,
      amount: amount,
      status: 'pending',
      type: 'subscription'
  });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe subscription checkout error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create Stripe checkout session for event posting
app.post('/create-event-checkout-session', async (req, res) => {
  const { userId, email, amount = 100 } = req.body; // $1.00 in cents
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Event Posting Fee',
            description: 'Fee for posting one event for one day',
          },
          unit_amount: amount, // Amount in cents
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-cancel`,
      client_reference_id: userId,
      customer_email: email,
      metadata: {
        userId: userId,
        type: 'event_posting'
      }
  });

    // Save session in DB
    await DeltaPayment.create({
      sessionId: session.id,
      email: email,
      userId: userId,
      amount: amount,
      status: 'pending',
      type: 'event'
  });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe event checkout error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create Stripe checkout session for subscription (6 months)
app.post('/create-monthly-subscription-checkout-session', async (req, res) => {
  const { userId, email, amount = 1000 } = req.body; // $10.00 in cents
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Monthly Seller Subscription',
            description: 'Full access to seller dashboard for 1 month',
          },
          unit_amount: amount, // Amount in cents
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?payment_success=true&type=monthly_subscription`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-cancel`,
      client_reference_id: userId,
      customer_email: email,
      metadata: {
        userId: userId,
        type: 'monthly_subscription',
        duration: '1month'
      }
    });

    // Save session in DB
    await DeltaPayment.create({
      sessionId: session.id,
      email: email,
      userId: userId,
      amount: amount,
      status: 'pending',
      type: 'monthly_subscription'
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe monthly subscription checkout error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== REAL-TIME PAYMENT INTENT ENDPOINT ====================

// Create payment intent for real-time payments
app.post('/create-payment-intent', async (req, res) => {
  try {
    console.log('=== CREATE PAYMENT INTENT ENDPOINT CALLED ===');
    console.log('Request body:', req.body);
    console.log('Stripe secret key available:', !!process.env.STRIPE_SECRET_KEY);
    
    const { amount, currency = 'usd', payment_method_id, type, email, name, country } = req.body;
    
    // Validate required fields
    if (!amount || !payment_method_id || !type || !email) {
      console.log('Missing required fields:', { amount, payment_method_id, type, email });
      return res.status(400).json({ 
        error: 'Missing required fields: amount, payment_method_id, type, and email are required' 
      });
    }
    
    console.log('Creating payment intent for:', { amount, type, email });
    
    // Create payment intent (automatic confirmation for frontend)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      payment_method: payment_method_id,
      confirmation_method: 'automatic', // Changed to automatic for frontend confirmation
      confirm: false, // Don't auto-confirm, let frontend handle it
      metadata: {
        type: type,
        email: email,
        name: name,
        userId: req.body.userId || new mongoose.Types.ObjectId().toString()
      }
    });

    console.log('Payment intent created successfully:', paymentIntent.id);

    // Save payment intent in DB (optional - don't fail if DB is down)
    console.log('Attempting to save payment record to database...');
    try {
      const paymentRecord = await DeltaPayment.create({
        sessionId: paymentIntent.id,
        email: email,
        userId: req.body.userId ? new mongoose.Types.ObjectId(req.body.userId) : new mongoose.Types.ObjectId(),
        amount: amount,
        status: paymentIntent.status,
        type: type,
        paymentIntentId: paymentIntent.id
      });

      console.log('Payment record saved to database:', paymentRecord._id);
    } catch (dbError) {
      console.error('Database save error (continuing anyway):', dbError.message);
      // Continue without failing - payment intent was created successfully
      console.log('Payment will continue without database logging...');
    }

    res.json({ 
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      status: paymentIntent.status
    });
    
  } catch (err) {
    console.error('=== PAYMENT INTENT CREATION ERROR ===');
    console.error('Error details:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: 'Payment intent creation failed',
      message: err.message 
    });
  }
});

// Confirm payment intent (for real-time payments)
app.post('/confirm-payment-intent', async (req, res) => {
  const { payment_intent_id } = req.body;
  
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    // Update payment status in DB
    await DeltaPayment.findOneAndUpdate(
      { paymentIntentId: payment_intent_id },
      { status: paymentIntent.status }
    );
    
    res.json({ 
      status: paymentIntent.status,
      payment_intent_id: payment_intent_id
    });
    
  } catch (err) {
    console.error('Payment confirmation error:', err);
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 8000;

if (!module.parent) {   // ensures it only runs if this file is the entry point
  const server = app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use.`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}

// ==================== HEALTH CHECK ENDPOINT ====================

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Backend is running",
    timestamp: new Date().toISOString()
  });
});

// ==================== SELLER RATING ENDPOINTS ====================

// Create or update a seller rating
app.post("/ratings", async (req, res) => {
  try {
    const { sellerId, userId, userName, rating, review } = req.body;

    // Validate required fields
    if (!sellerId || !userId || !userName || !rating) {
      return res.status(400).json({ 
        message: "Missing required fields: sellerId, userId, userName, rating" 
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: "Rating must be between 1 and 5" 
      });
    }

    // Check if user already rated this seller
    const existingRating = await SellerRating.findOne({ 
      sellerId: sellerId, 
      userId: userId 
    });

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.review = review || existingRating.review;
      existingRating.updatedAt = new Date();
      await existingRating.save();
      
      res.status(200).json({ 
        message: "Rating updated successfully", 
        rating: existingRating 
      });
    } else {
      // Create new rating
      const newRating = new SellerRating({
        sellerId,
        userId,
        userName,
        rating,
        review: review || ""
      });

      await newRating.save();
      
      res.status(201).json({ 
        message: "Rating created successfully", 
        rating: newRating 
      });
    }
  } catch (error) {
    console.error("Error creating/updating rating:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get ratings for a specific seller
app.get("/ratings/seller/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    const ratings = await SellerRating.find({ sellerId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    console.log("🔍 Backend - Found ratings for seller:", sellerId, "Count:", ratings.length);
    console.log("🔍 Backend - Ratings data:", ratings);

    // Calculate average rating
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
      : 0;

    const responseData = {
      ratings,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalRatings: ratings.length
    };

    console.log("🔍 Backend - Sending response:", responseData);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching seller ratings:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get ratings by a specific user
app.get("/ratings/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const ratings = await SellerRating.find({ userId })
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(ratings);
  } catch (error) {
    console.error("Error fetching user ratings:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete a rating
app.delete("/ratings/:ratingId", async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { userId } = req.body; // User ID to verify ownership

    if (!mongoose.Types.ObjectId.isValid(ratingId)) {
      return res.status(400).json({ message: "Invalid rating ID" });
    }

    const rating = await SellerRating.findById(ratingId);
    
    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    // Check if user owns this rating
    if (rating.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this rating" });
    }

    await SellerRating.findByIdAndDelete(ratingId);
    
    res.status(200).json({ message: "Rating deleted successfully" });
  } catch (error) {
    console.error("Error deleting rating:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Scheduled task to expire ads and events after 24 hours
const expireContentTask = async () => {
  try {
    const now = new Date();
    console.log('=== RUNNING CONTENT EXPIRATION TASK ===');
    console.log('Current time:', now);
    
    // Find ads that have expired (including admin-verified ones)
    const expiredAds = await Ad.find({
      expiresAt: { $lte: now },
      status: { $in: ['verified', 'pending'] } // Include both verified and pending ads
    });
    
    // Find events that have expired (including admin-verified ones)
    const expiredEvents = await Event.find({
      expiresAt: { $lte: now },
      status: { $in: ['verified', 'pending'] } // Include both verified and pending events
    });
    
    let totalUpdated = 0;
    
    // Update expired ads
    if (expiredAds.length > 0) {
      console.log(`Found ${expiredAds.length} expired ads to update`);
      
      const adResult = await Ad.updateMany(
        {
          expiresAt: { $lte: now },
          status: { $in: ['verified', 'pending'] }
        },
        { 
          status: 'expired',
          expiredAt: now
        }
      );
      
      console.log(`Updated ${adResult.modifiedCount} ads to expired status (including admin-verified)`);
      totalUpdated += adResult.modifiedCount;
    }
    
    // Update expired events
    if (expiredEvents.length > 0) {
      console.log(`Found ${expiredEvents.length} expired events to update`);
      
      const eventResult = await Event.updateMany(
        {
          expiresAt: { $lte: now },
          status: { $in: ['verified', 'pending'] }
        },
        { 
          status: 'expired',
          expiredAt: now
        }
      );
      
      console.log(`Updated ${eventResult.modifiedCount} events to expired status (including admin-verified)`);
      totalUpdated += eventResult.modifiedCount;
    }
    
    if (totalUpdated === 0) {
      console.log('No expired content found');
    } else {
      console.log(`Total content expired: ${totalUpdated} items`);
    }
  } catch (error) {
    console.error('Error in content expiration task:', error);
  }
};

// Guarded scheduler: run only when DB is connected
function scheduleExpirationTask() {
  const runIfConnected = async () => {
    if (isConnected && isConnected()) {
      try {
        await expireContentTask();
      } catch (e) {
        console.error('Expiration task run failed:', e);
      }
    } else {
      console.warn('Skipping expiration task: DB not connected');
    }
  };

  // Run every hour
  setInterval(runIfConnected, 60 * 60 * 1000);
  // Run once at startup after short delay to allow DB connect
  setTimeout(runIfConnected, 5000);
}

scheduleExpirationTask();

// ---------------- QUERIES ROUTES ----------------

// Add event query
app.post("/api/queries/add-event-query", async (req, res) => {
  try {
    const { name, email, contact, message, eventName, type } = req.body;

    if (!name || !email || !message || !eventName) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    const query = new Query({
      name,
      email,
      contact: contact || "",
      message,
      eventName,
      type: type || "event_query"
    });

    await query.save();

    console.log("Event query saved:", query);
    res.json({ 
      success: true, 
      message: "Query submitted successfully",
      queryId: query._id
    });

  } catch (err) {
    console.error("Error saving event query:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to submit query" 
    });
  }
});

// Get all queries (admin)
app.get("/api/queries/get-all", async (req, res) => {
  try {
    const queries = await Query.find().sort({ createdAt: -1 });
    res.json({ 
      success: true, 
      queries 
    });
  } catch (err) {
    console.error("Error fetching queries:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch queries" 
    });
  }
});

// Get event queries only (admin)
app.get("/api/queries/get-event-queries", async (req, res) => {
  try {
    const queries = await Query.find({ type: "event_query" }).sort({ createdAt: -1 });
    res.json({ 
      success: true, 
      queries 
    });
  } catch (err) {
    console.error("Error fetching event queries:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch event queries" 
    });
  }
});

// Reply to query (admin)
app.post("/api/queries/reply/:queryId", async (req, res) => {
  try {
    const { queryId } = req.params;
    const { adminReply, repliedBy } = req.body;

    if (!adminReply) {
      return res.status(400).json({ 
        success: false, 
        message: "Reply message is required" 
      });
    }

    const query = await Query.findByIdAndUpdate(
      queryId,
      {
        adminReply,
        repliedBy: repliedBy || "admin",
        repliedAt: new Date(),
        status: "replied"
      },
      { new: true }
    );

    if (!query) {
      return res.status(404).json({ 
        success: false, 
        message: "Query not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Reply sent successfully",
      query 
    });

  } catch (err) {
    console.error("Error replying to query:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send reply" 
    });
  }
});

// Export for Vercel
module.exports = app;
