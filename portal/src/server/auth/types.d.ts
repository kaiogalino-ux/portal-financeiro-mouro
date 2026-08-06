import type { RoleName } from '@/shared/types/rbac.types';

declare module 'next-auth' {
  interface User {
    role: RoleName;
    active: boolean;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: RoleName;
      active: boolean;
    };
  }
}
