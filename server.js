/**
 * server.js
 * Express server for FireSEO Newsletter
 * Handles subscription form submissions and integrates with Brevo API
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Brevo API Configuration
require('dotenv').config(); // Automatically load the .env for local use
const BREVO_API_KEY = process.env.BREVO_API_KEY; // GitHub secret or .env variable
const BREVO_LIST_ID = process.env.BREVO_LIST_ID || 8;
const BREVO_API_URL = 'https://api.brevo.com/v3';

// Headers for Brevo API
const brevoHeaders = {
  'api-key': BREVO_API_KEY,
  'Content-Type': 'application/json',
};

/**
 * POST /api/subscribe
 * Handle newsletter subscription
 */
app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Add contact to Brevo list
    const response = await axios.post(
      `${BREVO_API_URL}/contacts`,
      {
        email: email,
        listIds: [BREVO_LIST_ID],
        updateEnabled: true,
      },
      { headers: brevoHeaders }
    );

    console.log('Contact added to Brevo:', response.data);

    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed to FireSEO Newsletter! Check your email for confirmation.',
      data: response.data,
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error.response?.data || error.message);

    if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        message: 'Email already subscribed or invalid.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your subscription. Please try again later.',
      error: error.message,
    });
  }
});

/**
 * GET /
 * Serve the landing page
 */
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'FireSEO Server is running!',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Utility function to validate email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔥 FireSEO Newsletter Server is running on http://localhost:${PORT}`);
  console.log(`📧 Brevo Integration Active - List ID: ${BREVO_LIST_ID}`);
  console.log(`✅ Ready to accept newsletter subscriptions!`);
});
