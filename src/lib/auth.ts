import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { createUser, getUserByUsername, userCount } from './auth-db.ts';

const SALT_ROUNDS = 12;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function setupUser(username: string, password: string) {
  if (userCount() > 0) {
    throw new Error('User already exists');
  }
  const id = randomBytes(8).toString('hex');
  const hash = hashPassword(password);
  return createUser(id, username, hash);
}

export function authenticate(username: string, password: string): boolean {
  const user = getUserByUsername(username);
  if (!user) return false;
  return verifyPassword(password, user.password_hash);
}

export function hasUsers(): boolean {
  return userCount() > 0;
}
