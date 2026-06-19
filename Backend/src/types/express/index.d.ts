import type { UserRole } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                role: UserRole;
                tenantId: number | null;
            };
            tenantId?: number | null;
        }
    }
}
