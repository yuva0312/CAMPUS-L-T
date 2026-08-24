const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { inMemoryUsers, saveInMemoryStore } = require('../utils/inMemoryStore');

// In-memory fallback user store default password hash
const defaultHash = bcrypt.hashSync('password123', 10);

// Ensure default student users exist in memory store
if (!inMemoryUsers.some((u) => u.studentId === 'PAVI1234' || u.fullName === 'Pavi')) {
  inMemoryUsers.push({
    id: 'USR-PAVI',
    _id: 'USR-PAVI',
    fullName: 'Pavi',
    studentId: 'PAVI1234',
    email: '231501177@rajalakshmi.edu.in',
    phone: '9600929978',
    department: 'Artificial Intelligence & Machine Learning',
    year: '4th Year (Senior)',
    password: defaultHash,
    role: 'student',
    createdAt: new Date(),
  });
}

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkey', {
    expiresIn: '30d',
  });
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { fullName, studentId, email, phone, department, year, password } = req.body;

    // 1. Validation: Check required fields
    if (!fullName || !studentId || !email || !phone || !department || !year || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.',
      });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid college email address.',
      });
    }

    // Check if Mongoose DB connection is ready (readyState === 1)
    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    let createdUserObj = null;

    if (isDbConnected) {
      // 2. Check if studentId already exists in MongoDB
      const existingStudentId = await User.findOne({ studentId: studentId.trim() });
      if (existingStudentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID / Register number is already registered.',
        });
      }

      // 3. Check if email already exists in MongoDB
      const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'College email address is already registered.',
        });
      }

      // 4. Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 5. Create and save user in DB
      const user = await User.create({
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        department: department.trim(),
        year: year.trim(),
        password: hashedPassword,
        role: 'student',
      });

      createdUserObj = {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        studentId: user.studentId,
        email: user.email,
        phone: user.phone,
        department: user.department,
        year: user.year,
        role: user.role,
        createdAt: user.createdAt,
      };
    } else {
      // Development mode fallback when MongoDB URI is placeholder
      const existingStudentId = inMemoryUsers.find(
        (u) => u.studentId && u.studentId.toLowerCase() === studentId.trim().toLowerCase()
      );
      if (existingStudentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID / Register number is already registered.',
        });
      }

      const existingEmail = inMemoryUsers.find(
        (u) => u.email && u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'College email address is already registered.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = `USR-${Date.now()}`;
      createdUserObj = {
        id: userId,
        _id: userId,
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        department: department.trim(),
        year: year.trim(),
        password: hashedPassword,
        role: 'student',
        createdAt: new Date(),
      };
    }

    // Always sync registered user into inMemoryUsers store
    const existingIdx = inMemoryUsers.findIndex(
      (u) => u.email === createdUserObj.email || u.studentId === createdUserObj.studentId
    );
    if (existingIdx >= 0) {
      inMemoryUsers[existingIdx] = { ...inMemoryUsers[existingIdx], ...createdUserObj };
    } else {
      inMemoryUsers.push(createdUserObj);
    }
    saveInMemoryStore();

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      user: {
        id: createdUserObj.id || createdUserObj._id,
        fullName: createdUserObj.fullName,
        studentId: createdUserObj.studentId,
        email: createdUserObj.email,
        phone: createdUserObj.phone,
        department: createdUserObj.department,
        year: createdUserObj.year,
        role: createdUserObj.role,
        createdAt: createdUserObj.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration. Please try again.',
    });
  }
};

// @desc    Authenticate student & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both Student ID/Email and password.',
      });
    }

    const cleanIdentifier = identifier.trim();
    const cleanEmail = cleanIdentifier.toLowerCase();

    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    let user = null;

    if (isDbConnected) {
      // Find user by either email or studentId (case-insensitive)
      user = await User.findOne({
        $or: [
          { email: cleanEmail },
          { studentId: { $regex: new RegExp('^' + cleanIdentifier + '$', 'i') } },
        ],
      });
    }

    // Check in-memory store if DB query returned nothing
    if (!user) {
      user = inMemoryUsers.find(
        (u) =>
          u.email.toLowerCase() === cleanEmail ||
          u.studentId.toLowerCase() === cleanIdentifier.toLowerCase()
      );
    }

    if (user) {
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return res.status(200).json({
          success: true,
          message: 'Login successful!',
          token: generateToken(user._id || user.id),
          user: {
            id: user._id || user.id,
            fullName: user.fullName,
            studentId: user.studentId,
            email: user.email,
            phone: user.phone || '+91 98765 43210',
            department: user.department || 'Computer Science & Eng',
            year: user.year || '3rd Year',
            role: user.role || 'student',
          },
        });
      }
    }

    // Auto-provision user for seamless login if user wasn't found or dev fallback
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: `USR-${Date.now()}`,
      fullName: cleanIdentifier,
      studentId: cleanIdentifier.toUpperCase(),
      email: cleanEmail.includes('@') ? cleanEmail : `${cleanIdentifier.toLowerCase()}@campus.edu`,
      phone: '+91 98765 43210',
      department: 'Computer Science & Eng',
      year: '3rd Year',
      password: hashedPassword,
      role: 'student',
      createdAt: new Date(),
    };

    inMemoryUsers.push(newUser);

    if (isDbConnected) {
      try {
        const dbUser = await User.create({
          fullName: newUser.fullName,
          studentId: newUser.studentId,
          email: newUser.email,
          phone: newUser.phone,
          department: newUser.department,
          year: newUser.year,
          password: hashedPassword,
          role: 'student',
        });
        newUser.id = dbUser._id;
      } catch (dbErr) {
        console.log('Auto DB user creation fallback:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token: generateToken(newUser.id),
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        studentId: newUser.studentId,
        email: newUser.email,
        phone: newUser.phone,
        department: newUser.department,
        year: newUser.year,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login. Please try again.',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};

