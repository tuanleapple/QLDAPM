import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { User } from '../../database/entities.entity';
import { AuthenticatedUser, TokenPayload } from './auth.types';
import { AuthUserRepository } from './auth.repository';

const scrypt = promisify(scryptCallback);

@Injectable()
export class AuthService {
  constructor(
    private readonly users: AuthUserRepository,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<Record<string, unknown>> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.users.findByEmailWithPassword(normalizedEmail);
    if (!user || !(await this.verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueSession(user);
  }

  async refresh(refreshToken: string): Promise<Record<string, unknown>> {
    const payload = this.verifyToken(refreshToken, 'refresh');
    const user = await this.users.findActiveByIdWithRefreshToken(payload.id);
    if (
      !user ||
      !user.refreshTokenHash ||
      !this.hash(refreshToken).equals(Buffer.from(user.refreshTokenHash, 'hex'))
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.users.clearRefreshToken(user.id);
    return this.issueSession(user);
  }

  async logout(userId: string): Promise<void> {
    await this.users.clearRefreshToken(userId);
  }

  async me(userId: string): Promise<AuthenticatedUser> {
    const user = await this.users.findActiveById(userId);
    if (!user) throw new UnauthorizedException('Account unavailable');
    return { id: user.id, email: user.email, role: user.role };
  }

  verifyAccessToken(token: string): AuthenticatedUser {
    const payload = this.verifyToken(token, 'access');
    return { id: payload.id, email: payload.email, role: payload.role };
  }

  private async issueSession(user: User): Promise<Record<string, unknown>> {
    const identity: AuthenticatedUser = { id: user.id, email: user.email, role: user.role };
    const accessToken = this.sign(identity, 'access', this.ttl('AUTH_ACCESS_TTL_SECONDS', 900));
    const refreshToken = this.sign(
      identity,
      'refresh',
      this.ttl('AUTH_REFRESH_TTL_SECONDS', 604800),
    );
    await this.users.saveRefreshTokenHash(user.id, this.hash(refreshToken).toString('hex'));
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.ttl('AUTH_ACCESS_TTL_SECONDS', 900),
      user: identity,
    };
  }

  private sign(identity: AuthenticatedUser, type: 'access' | 'refresh', ttl: number): string {
    const payload: TokenPayload = {
      ...identity,
      type,
      exp: Math.floor(Date.now() / 1000) + ttl,
      jti: randomUUID(),
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${encoded}.${createHmac('sha256', this.secret(type)).update(encoded).digest('base64url')}`;
  }

  private verifyToken(token: string, type: 'access' | 'refresh'): TokenPayload {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) throw new UnauthorizedException('Invalid token');
    const expected = createHmac('sha256', this.secret(type)).update(encoded).digest('base64url');
    if (
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      throw new UnauthorizedException('Invalid token');
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as TokenPayload;
    if (payload.type !== type || payload.exp <= Math.floor(Date.now() / 1000))
      throw new UnauthorizedException('Expired token');
    return payload;
  }

  private secret(type: 'access' | 'refresh'): string {
    return (
      this.config.get<string>(type === 'access' ? 'auth.accessSecret' : 'auth.refreshSecret') ??
      'development-only-change-me'
    );
  }

  private ttl(name: string, fallback: number): number {
    const key =
      name === 'AUTH_ACCESS_TTL_SECONDS' ? 'auth.accessTtlSeconds' : 'auth.refreshTtlSeconds';
    return this.config.get<number>(key, fallback);
  }

  private hash(value: string): Buffer {
    return createHash('sha256').update(value).digest();
  }

  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt.toString('hex')}:${derived.toString('hex')}`;
  }

  private async verifyPassword(password: string, encoded: string): Promise<boolean> {
    const [saltHex, hashHex] = encoded.split(':');
    if (!saltHex || !hashHex) return false;
    const derived = (await scrypt(password, Buffer.from(saltHex, 'hex'), 64)) as Buffer;
    const expected = Buffer.from(hashHex, 'hex');
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  }
}
