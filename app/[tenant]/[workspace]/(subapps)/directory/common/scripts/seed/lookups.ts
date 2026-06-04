import type {Client} from '@/goovee/.generated/client';

/* The directory seed mutates existing partner accounts rather than
 * creating rows, so the only lookup it needs is "find the partner for
 * this email". It returns null instead of throwing — a missing email is
 * an expected, skippable case (the demo accounts may not all be loaded
 * in every tenant), not a hard error. */
export async function findPartnerByEmail(client: Client, email: string) {
  return client.aOSPartner.findOne({
    where: {emailAddress: {address: email}},
    select: {
      id: true,
      version: true,
      name: true,
      simpleFullName: true,
      isCustomer: true,
      isContact: true,
    },
  });
}

export type SeedPartner = NonNullable<
  Awaited<ReturnType<typeof findPartnerByEmail>>
>;
