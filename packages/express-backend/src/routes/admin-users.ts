import express, { Request, RequestHandler, Response } from 'express';
import AdminUser from '../models/AdminUser.js';

const router = express.Router();

type AdminUserPayload = {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  isAdmin: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function normalize(value?: string): string {
  return value?.trim() || '';
}

function normalizeLower(value?: string): string {
  return normalize(value).toLowerCase();
}

function formatAdminUser(user: {
  _id: unknown;
  email: string;
  name?: string;
  role: 'admin';
  isAdmin: boolean;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): AdminUserPayload {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name || '',
    role: user.role,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

router.get('/', (async (_req: Request, res: Response) => {
  try {
    const adminUsers = await AdminUser.find().sort({ createdAt: -1 }).lean();
    res.json(adminUsers.map((adminUser) => formatAdminUser(adminUser)));
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({
      message: 'Error fetching admin users',
      error: (error as Error).message,
    });
  }
}) as RequestHandler);

router.post('/', (async (req: Request, res: Response) => {
  try {
    const email = normalize(req.body.email);
    const name = normalize(req.body.name);
    const isActive = typeof req.body.isActive === 'boolean' ? req.body.isActive : true;

    if (!email) {
      return res.status(400).json({
        message: 'email is required',
      });
    }

    const emailLower = normalizeLower(email);
    const existing = await AdminUser.findOne({ emailLower }).lean();
    if (existing) {
      return res.status(409).json({
        message: 'An admin with this email already exists',
      });
    }

    const newAdmin = await AdminUser.create({
      email,
      emailLower,
      name: name || undefined,
      role: 'admin',
      isAdmin: true,
      isActive,
    });

    res.status(201).json(formatAdminUser(newAdmin.toObject()));
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({
      message: 'Error creating admin user',
      error: (error as Error).message,
    });
  }
}) as RequestHandler);

router.put('/:id', (async (req: Request, res: Response) => {
  try {
    const adminUser = await AdminUser.findById(req.params.id);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    const email = normalize(req.body.email) || adminUser.email;
    const name = normalize(req.body.name);
    const hasIsActive = typeof req.body.isActive === 'boolean';
    const emailLower = normalizeLower(email);

    const duplicate = await AdminUser.findOne({
      _id: { $ne: adminUser._id },
      emailLower,
    }).lean();

    if (duplicate) {
      return res.status(409).json({
        message: 'Another admin user already uses this email',
      });
    }

    adminUser.email = email;
    adminUser.emailLower = emailLower;
    adminUser.name = name || undefined;
    if (hasIsActive) {
      adminUser.isActive = req.body.isActive;
    }

    await adminUser.save();
    res.json(formatAdminUser(adminUser.toObject()));
  } catch (error) {
    console.error('Error updating admin user:', error);
    res.status(500).json({
      message: 'Error updating admin user',
      error: (error as Error).message,
    });
  }
}) as RequestHandler);

router.delete('/:id', (async (req: Request, res: Response) => {
  try {
    const adminUser = await AdminUser.findById(req.params.id);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    await adminUser.deleteOne();
    res.json({ message: 'Admin user deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    res.status(500).json({
      message: 'Error deleting admin user',
      error: (error as Error).message,
    });
  }
}) as RequestHandler);

router.post('/authorize', (async (req: Request, res: Response) => {
  try {
    const email = normalize(req.body.email);
    const name = normalize(req.body.name);
    const emailLower = normalizeLower(email);

    if (!emailLower) {
      return res.status(400).json({
        allowed: false,
        message: 'email is required',
      });
    }

    const adminUser = await AdminUser.findOne({
      isActive: true,
      emailLower,
    });

    if (!adminUser) {
      return res.status(403).json({
        allowed: false,
        message: 'User is not an active admin',
      });
    }

    adminUser.lastLoginAt = new Date();
    if (!adminUser.name && name) {
      adminUser.name = name;
    }
    await adminUser.save();

    return res.json({
      allowed: true,
      adminUser: formatAdminUser(adminUser.toObject()),
    });
  } catch (error) {
    console.error('Error authorizing admin user:', error);
    res.status(500).json({
      allowed: false,
      message: 'Error authorizing admin user',
      error: (error as Error).message,
    });
  }
}) as RequestHandler);

export default router;
