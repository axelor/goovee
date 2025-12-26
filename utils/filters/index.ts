// ---- CORE IMPORTS ---- //
import {ROLE} from '@/constants';
import {PartnerKey, User} from '@/types';

export function getWhereClauseForEntity({
  user,
  role,
  isContactAdmin,
  partnerKey = PartnerKey.CLIENT_PARTNER,
}: {
  user: User;
  role: any;
  isContactAdmin?: boolean;
  partnerKey?: PartnerKey;
}) {
  if (!user) return {};

  const {id, mainPartnerId, isContact} = user;

  const where: any = {
    [partnerKey]: {
      id: isContact ? mainPartnerId : id,
    },
  };

  if (isContact) {
    where.contactPartner = {
      id,
    };
  }

  if (isContactAdmin || role === ROLE.TOTAL) {
    delete where.contactPartner;
  }

  return where;
}
