// ---- CORE IMPORTS ---- /
import {hash, compare as compareHashed} from '@/auth/utils';
import {manager, type Tenant} from '@/tenant';
import {clone} from '@/utils';
import type {ID} from '@/types';

// ---- LOCAL IMPORTS ---- /
import {computeExpiry, generate as generateOTP, isExpired} from '../utils';

export async function create({
  scope,
  entity,
  force,
  digit,
  tenantId,
}: {
  scope: string;
  entity: string;
  force?: boolean;
  digit?: number;
  tenantId: Tenant['id'];
}) {
  if (!(tenantId && scope && entity)) return null;

  const client = await manager.getClient(tenantId);

  if (!client) return null;

  const existing = await findOne({scope, entity, tenantId});

  const createOTP = async () => {
    const otp = generateOTP(digit);
    const hashedOtp = await hash(otp);
    const expiresAt = computeExpiry() as Date;

    return client.otp
      .create({
        data: {
          scope,
          entity,
          value: hashedOtp,
          expiresAt,
          used: false,
        },
        select: {
          entity: true,
          scope: true,
          used: true,
          value: true,
          expiresAt: true,
          createdOn: true,
          updatedOn: true,
        },
      })
      .then(clone)
      .then(result => ({...result, otp}));
  };

  const removeOTP = async ({id, version}: any) => {
    await client.otp.delete({id, version});
  };

  if (force) {
    if (existing) {
      await removeOTP(existing);
    }
    return createOTP();
  }

  if (existing) {
    if (existing.expiresAt && isExpired(existing.expiresAt)) {
      await removeOTP(existing);
      return createOTP();
    } else {
      return existing;
    }
  }

  return createOTP();
}

export async function findOne({
  scope,
  entity,
  tenantId,
}: {
  scope: string;
  entity: string;
  tenantId: Tenant['id'];
}) {
  if (!(tenantId && scope && entity)) return null;

  const client = await manager.getClient(tenantId);

  if (!client) return null;

  return client.otp.findOne({
    where: {
      scope,
      entity,
      OR: [{used: {eq: null}}, {used: {eq: false}}],
    },
    select: {
      entity: true,
      scope: true,
      used: true,
      value: true,
      expiresAt: true,
      createdOn: true,
      updatedOn: true,
    },
  });
}

export async function findOneById({
  id,
  tenantId,
}: {
  id: ID;
  tenantId: Tenant['id'];
}) {
  if (!(tenantId && id)) return null;

  const client = await manager.getClient(tenantId);

  if (!client) return null;

  return client.otp.findOne({
    where: {
      id,
      OR: [{used: {eq: null}}, {used: {eq: false}}],
    },
    select: {
      entity: true,
      scope: true,
      used: true,
      value: true,
      expiresAt: true,
      createdOn: true,
      updatedOn: true,
    },
  });
}

export async function isValid({
  id,
  value,
  tenantId,
}: {
  id?: ID;
  value: string;
  tenantId: Tenant['id'];
}) {
  if (!(id && value && tenantId)) return false;

  const existing = await findOneById({id, tenantId});

  if (!existing?.value) return false;

  if (existing.expiresAt && isExpired(existing.expiresAt)) return false;

  const matched = await compareHashed(value, existing.value);

  return Boolean(matched);
}

export async function markUsed({
  id,
  tenantId,
}: {
  id: string;
  tenantId: Tenant['id'];
}) {
  const existing = await findOneById({id, tenantId});

  if (!existing) return null;

  const client = await manager.getClient(tenantId);

  if (!client) return null;

  const {version} = existing;

  await client.otp.update({
    data: {
      id,
      version,
      used: true,
    },
    select: {id: true},
  });
}
