/**
 * IMovies Authentication Service
 * Manages password hashing, token creation, session decoding, and user authentication.
 */

import crypto from 'crypto';
import { db } from '../db/database.js';
import { User, UserRole } from '../models/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'imovies_super_secret_jwt_key_2026';
const SALT = 'imovies_salt_secret';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  iat: number;
  exp: number;
}

export class AuthService {
  /**
   * Hashes a password with salt using SHA-256
   */
  public static hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password + SALT).digest('hex');
  }

  /**
   * Encodes a JSON Web Token
   */
  public static generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 // 7 days
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    return `${header}.${body}.${signature}`;
  }

  /**
   * Decodes and validates a JSON Web Token
   */
  public static verifyToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [header, body, signature] = parts;
      const expectedSignature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${body}`)
        .digest('base64url');

      if (signature !== expectedSignature) return null;

      const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Expired
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Register a new user
   */
  public static register(data: { name: string; email: string; password: string; phone?: string; role?: UserRole }): { user: Omit<User, 'passwordHash'>; token: string } {
    const existing = db.users.findOne(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email address already exists');
    }

    const newUser: User = {
      id: `usr_${crypto.randomUUID().slice(0, 8)}`,
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: this.hashPassword(data.password),
      role: data.role || 'user',
      phone: data.phone,
      createdAt: new Date().toISOString()
    };

    db.users.insertOne(newUser);
    const token = this.generateToken(newUser);

    const { passwordHash, ...safeUser } = newUser;
    return { user: safeUser, token };
  }

  /**
   * Login user with email and password
   */
  public static login(email: string, password: string): { user: Omit<User, 'passwordHash'>; token: string } {
    const user = db.users.findOne(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const hashed = this.hashPassword(password);
    if (user.passwordHash !== hashed) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);
    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, token };
  }
}
