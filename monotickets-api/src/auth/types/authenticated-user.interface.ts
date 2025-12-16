import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
}

export type AuthenticatedRequest<TParams = any, TRes = any, TBody = any, TQuery = any> = Request<TParams, TRes, TBody, TQuery> & {
    user: AuthenticatedUser;
};
