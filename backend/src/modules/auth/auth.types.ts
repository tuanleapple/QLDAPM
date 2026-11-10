import { UserRole } from '../../database/entities.entity';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
}

export interface TokenPayload extends AuthenticatedUser {
  type: 'access' | 'refresh';
  exp: number;
  jti: string;
}
