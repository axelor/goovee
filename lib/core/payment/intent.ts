import 'server-only';

import type {Client} from '@/goovee/.generated/client';
import type {IntentSnapshot} from './sources/types';

/*
 * The intent snapshot is goovee's working data: the cart, the addresses, the
 * token a guest paid with. It lives in a goovee-owned table rather than on the
 * payment row, so an ERP user never sees it in a grid, a form, an export or a
 * message stream. It names the payment by id in a plain column, not a
 * relation, so goovee's boot-time schema sync cannot fail against a module
 * that has not shipped the payment tables yet.
 */

export async function writeSnapshot(
  txClient: Client,
  paymentId: string,
  source: string,
  snapshot: IntentSnapshot,
): Promise<void> {
  const existing = await txClient.paymentIntent.findOne({
    where: {paymentId},
    select: {id: true},
  });
  if (existing) {
    await txClient.paymentIntent.update({
      data: {
        id: existing.id,
        version: existing.version,
        data: Promise.resolve(snapshot),
      },
      select: {id: true},
    });
    return;
  }
  await txClient.paymentIntent.create({
    data: {
      paymentId,
      source,
      data: Promise.resolve(snapshot),
      createdOn: new Date(),
    },
    select: {id: true},
  });
}

export async function readSnapshot(
  client: Client,
  paymentId: string,
): Promise<IntentSnapshot> {
  const row = await client.paymentIntent.findOne({
    where: {paymentId},
    select: {data: true},
  });
  const data = row ? await row.data : null;
  return (data ?? {}) as IntentSnapshot;
}
