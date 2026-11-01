import { Session } from 'next-auth';
import { isDemoEmail } from './auth';

export function isDemoSession(session?: Session | null): boolean {
  if (!session?.user) return false;
  if (session.user.isDemo) return true;
  return isDemoEmail(session.user.email);
}

export function assertNotDemo(session?: Session | null): { allowed: boolean; message?: string } {
  if (!session?.user) {
    return { allowed: false, message: 'Authentication required' };
  }
  if (isDemoSession(session)) {
    return {
      allowed: false,
      message: 'Demo account is in view-only mode. Modifying data is disabled.'
    };
  }
  return { allowed: true };
}

