const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const usernameRegex = /^[a-zA-Z0-9_.-]{3,50}$/;
const countryCodeRegex = /^\+[0-9]{1,4}$/;

exports.register = async (req, res) => {
  try {
    const { username, email, password, countryCode, phone } = req.body;

    if (!username || !email || !password || !countryCode || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCountry = String(countryCode).trim();
    const digitsOnlyPhone = String(phone).replace(/[^0-9]/g, '');

    if (!usernameRegex.test(cleanUsername)) {
      return res.status(400).json({ message: 'Username must be 3-50 characters using letters, numbers, dot, dash or underscore' });
    }

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (!countryCodeRegex.test(cleanCountry)) {
      return res.status(400).json({ message: 'Invalid country code format' });
    }

    if (digitsOnlyPhone.length !== 10) {
      return res.status(400).json({ message: 'Phone number must contain exactly 10 digits' });
    }

    if (password.length < 8 || (!password.includes('@') && !password.includes('#'))) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include @ or #' });
    }

    const existing = await User.findByEmail(cleanEmail);
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password_hash,
      phone_country_code: cleanCountry,
      phone_number: digitsOnlyPhone
    });

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    console.error('Registration error:', err);
    // Check if it's a database column error
    if (err.code === 'ER_BAD_FIELD_ERROR' || err.message.includes('phone_country_code') || err.message.includes('phone_number')) {
      return res.status(500).json({ 
        message: 'Database schema error. Please run the migration script to add phone columns to the users table.',
        error: err.message 
      });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ token, message: 'Login successful!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: {
        countryCode: user.phone_country_code,
        number: user.phone_number
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};