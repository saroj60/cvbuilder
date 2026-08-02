import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion?: number;
}

export interface ResetPasswordPayload {
  userId: string;
  email: string;
  purpose: 'RESET_PASSWORD';
}

export const generateAccessToken = (payload: TokenPayload, rememberMe: boolean = false): string => {
  const options: SignOptions = {
    expiresIn: rememberMe ? '1d' : '15m',
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const generateRefreshToken = (payload: RefreshTokenPayload, rememberMe: boolean = false): string => {
  const options: SignOptions = {
    expiresIn: rememberMe ? '30d' : '7d',
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const generateResetToken = (payload: { userId: string; email: string }): string => {
  const options: SignOptions = {
    expiresIn: '1h',
  };
  return jwt.sign({ ...payload, purpose: 'RESET_PASSWORD' }, env.JWT_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as RefreshTokenPayload;
};

export const verifyResetToken = (token: string): ResetPasswordPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as ResetPasswordPayload;
  if (decoded.purpose !== 'RESET_PASSWORD') {
    throw new Error('Invalid reset token purpose');
  }
  return decoded;
};
