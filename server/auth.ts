import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { SafeUser } from './types';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'media_portal_jwt_secret_super_secure_key_2025';

export interface AuthRequest extends Request {
  user?: SafeUser;
}

export function signToken(user: SafeUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): SafeUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SafeUser;
    return decoded;
  } catch (err) {
    return null;
  }
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  const decodedUser = verifyToken(token);
  if (!decodedUser) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }

  // Real-time lookup to enforce immediate ID block
  const liveUser = db.findUserById(decodedUser.id);
  if (liveUser) {
    if (liveUser.status === 'SUSPENDED' || liveUser.status === 'BLOCKED') {
      res.status(403).json({ error: `This account (ID: ${liveUser.id}) has been blocked by the administrator.` });
      return;
    }
    const { passwordHash, ...safe } = liveUser;
    req.user = safe;
  } else {
    if (decodedUser.status === 'SUSPENDED' || decodedUser.status === 'BLOCKED') {
      res.status(403).json({ error: 'Your account has been blocked by the administrator.' });
      return;
    }
    req.user = decodedUser;
  }

  next();
}

export function optionalAuthenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    const decodedUser = verifyToken(token);
    if (decodedUser) {
      const liveUser = db.findUserById(decodedUser.id);
      if (liveUser && liveUser.status !== 'SUSPENDED' && liveUser.status !== 'BLOCKED') {
        const { passwordHash, ...safe } = liveUser;
        req.user = safe;
      } else if (!liveUser && decodedUser.status !== 'SUSPENDED' && decodedUser.status !== 'BLOCKED') {
        req.user = decodedUser;
      }
    }
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access denied: Administrator privileges required' });
    return;
  }

  next();
}
