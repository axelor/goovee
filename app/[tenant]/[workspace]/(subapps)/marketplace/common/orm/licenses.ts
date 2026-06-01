import type {Client} from '@/goovee/.generated/client';

export type ListLicense = Awaited<ReturnType<typeof findLicenses>>[number];

export async function findLicenses({client}: {client: Client}) {
  return client.aOSMarketplaceLicense.find({
    where: {
      OR: [{archived: false}, {archived: null}],
    },
    select: {
      id: true,
      name: true,
      url: true,
      description: true,
      isPaid: true,
    },
    orderBy: {sequence: 'ASC', name: 'ASC'},
  });
}
