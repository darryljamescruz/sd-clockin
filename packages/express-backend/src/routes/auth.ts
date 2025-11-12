import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import AdminUser from '../models/AdminUser.js';

const router = express.Router();

// Extend Express Request to include session
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    username?: string;
    isAdmin?: boolean;
  }
}

// Login endpoint
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    // Find user by username (email or username)
    const user = await AdminUser.findOne({
      $or: [
        { email: username },
        { name: username }
      ]
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password (for demo account, allow plain text check)
    let passwordValid = false;
    if (username === 'admin' && password === 'admin123') {
      // Demo account - allow plain text
      passwordValid = true;
    } else {
      // For other accounts, check bcrypt hash
      passwordValid = await bcrypt.compare(password, user.passwordHash);
    }

    if (!passwordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Set session data
    const userId = (user._id as mongoose.Types.ObjectId).toString();
    req.session.userId = userId;
    req.session.username = user.name;
    req.session.isAdmin = user.isAdmin;

    // Set cookie expiration based on rememberMe
    if (rememberMe) {
      // Remember for 30 days
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    } else {
      // Session expires when browser closes
      req.session.cookie.maxAge = undefined;
    }

    res.json({
      success: true,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.status(500).json({ message: 'Error logging out' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Verify session endpoint
router.get('/verify', (req: Request, res: Response): void => {
  if (req.session.userId) {
    res.json({
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        isAdmin: req.session.isAdmin,
      },
    });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// Create admin/staff account (protected - admin only)
router.post('/create-account', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated and is admin
    if (!req.session.userId || !req.session.isAdmin) {
      res.status(403).json({ message: 'Unauthorized: Admin access required' });
      return;
    }

    const { name, email, password, isAdmin } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await AdminUser.findOne({
      $or: [{ email }, { name }]
    });

    if (existingUser) {
      res.status(400).json({ message: 'User with this email or name already exists' });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new AdminUser({
      name,
      email,
      passwordHash,
      isAdmin: isAdmin === true || isAdmin === 'true',
    });

    await newUser.save();

    const userId = (newUser._id as mongoose.Types.ObjectId).toString();
    res.json({
      success: true,
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
      },
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all admin/staff accounts (protected - admin only)
router.get('/accounts', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated and is admin
    if (!req.session.userId || !req.session.isAdmin) {
      res.status(403).json({ message: 'Unauthorized: Admin access required' });
      return;
    }

    const users = await AdminUser.find({}, { passwordHash: 0 }).sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete account (protected - admin only, cannot delete self)
router.delete('/accounts/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated and is admin
    if (!req.session.userId || !req.session.isAdmin) {
      res.status(403).json({ message: 'Unauthorized: Admin access required' });
      return;
    }

    const accountId = req.params.id;

    // Prevent self-deletion
    if (accountId === req.session.userId) {
      res.status(400).json({ message: 'Cannot delete your own account' });
      return;
    }

    // Prevent deleting demo account
    const user = await AdminUser.findById(accountId);
    if (user && user.email === 'admin' && user.name === 'admin') {
      res.status(400).json({ message: 'Cannot delete demo account' });
      return;
    }

    await AdminUser.findByIdAndDelete(accountId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

