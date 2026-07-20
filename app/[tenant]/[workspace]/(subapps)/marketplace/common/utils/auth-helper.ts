import {ROLE} from '@/constants';
import type {Subapp} from '@/orm/workspace';
import type {User} from '@/types';

/**
 * Whether the caller may author/manage marketplace products. Restricted
 * contacts are buyers only; the company partner itself, contact admins, and
 * contacts with the `total` role keep full publisher access.
 */
export function canManageProducts({
  user,
  subapp,
}: {
  user: Pick<User, 'isContact'>;
  subapp: Pick<Subapp, 'isContactAdmin' | 'role'>;
}) {
  return (
    !user.isContact || !!subapp.isContactAdmin || subapp.role === ROLE.TOTAL
  );
}
