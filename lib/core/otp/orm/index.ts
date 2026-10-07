// ---- CORE IMPORTS ---- /
import {hash, compare as compareHashed} from '@/auth/utils';
import type {Client, GooveeClient} from '@/goovee/.generated/client';
import {clone} from '@/utils';
import type {ID} from '@/types';

// ---- LOCAL IMPORTS ---- /
import {computeExpiry, generate as generateOTP, isExpired} from '../utils';
import {MAX_OTP_FAILED_ATTEMPTS} from '../constants';

function isExhausted(failedAttempts: number | null) {
  return (failedAttempts ?? 0) >= MAX_OTP_FAILED_ATTEMPTS;
}

export async function create({
  scope,
  entity,
  force,
  digit,
  client,
}: {
  scope: string;
  entity: string;
  force?: boolean;
  digit?: number;
  client: Client;
}) {
  if (!(scope && entity)) return null;

  const existing = await findOne({scope, entity, client});

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
          failedAttempts: 0,
        },
        select: {
          entity: true,
          scope: true,
          used: true,
          value: true,
          expiresAt: true,
          failedAttempts: true,
          createdOn: true,
          updatedOn: true,
        },
      })
      .then(clone)
      .then(result => ({...result, otp}));
  };

  const removeOTP = async ({id, version}: {id: ID; version: number}) => {
    await client.otp.delete({id, version});
  };

  if (force) {
    if (existing) {
      await removeOTP(existing);
    }
    return createOTP();
  }

  if (existing) {
    if (
      (existing.expiresAt && isExpired(existing.expiresAt)) ||
      isExhausted(existing.failedAttempts)
    ) {
      await removeOTP(existing);
      return createOTP();
    } else {
      //BUG: email won't be sent if otp is undefined figure out how to convert value to otp
      return {...existing, otp: undefined};
    }
  }

  return createOTP();
}

export async function findOne({
  scope,
  entity,
  client,
}: {
  scope: string;
  entity: string;
  client: Client;
}) {
  if (!(scope && entity)) return null;

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
      failedAttempts: true,
      createdOn: true,
      updatedOn: true,
    },
  });
}

export async function findOneById({id, client}: {id: ID; client: Client}) {
  if (!id) return null;

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
      failedAttempts: true,
      createdOn: true,
      updatedOn: true,
    },
  });
}

export async function isValid({
  id,
  value,
  client,
}: {
  id?: ID;
  value: string;
  client: GooveeClient;
}) {
  if (!(id && value)) return false;

  return client.$transaction(async txClient => {
    /* Lock the row until the transaction ends without changing it, so parallel
     * checks of the same code run one after another and each one reads the
     * failed attempts counted by the ones before it. Callers keep the version
     * they read before this check, so a correct code must leave it as is. */
    const locked = await txClient.$raw(
      'SELECT id FROM portal_otp WHERE id = $1 AND (used IS NULL OR used = false) FOR UPDATE',
      id,
    );

    if (!(Array.isArray(locked) && locked.length)) return false;

    const existing = await findOneById({id, client: txClient});

    if (!existing?.value) return false;

    if (existing.expiresAt && isExpired(existing.expiresAt)) return false;

    if (isExhausted(existing.failedAttempts)) return false;

    const matched = await compareHashed(value, existing.value);

    if (matched) return true;

    await txClient.otp.updateAll({
      set: {failedAttempts: (existing.failedAttempts ?? 0) + 1},
      where: {id},
    });

    return false;
  });
}

export async function markUsed({id, client}: {id: string; client: Client}) {
  const existing = await findOneById({id, client});

  if (!existing) return null;

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
