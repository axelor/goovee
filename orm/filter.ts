import type {Client} from '@/goovee/.generated/client';
import {AOSPartner} from '@/goovee/.generated/models';
import type {WhereOptions} from '@goovee/orm';
import {findPartnerById} from './partner';
import type {User} from '@/types';
import {and, or} from '@/utils/orm';

export type FilterRecord = {
  isPrivate?: boolean | null;
  partnerSet?: Array<{id: string}> | null;
  partnerCategorySet?: Array<{id: string}> | null;
};

/* NOTE:
 * Privacy access for restricted records is expressed in two directions,
 *   filterPrivate(user)             — record-side WHERE: which records can this user see?
 *   filterPartnersByRecordAccess(r) — partner-side WHERE: which partners can see this record?
 * Both walk the same model: a record with isPrivate=true grants access via
 * partnerSet (direct) or partnerCategorySet (via partner.partnerCategory),
 * with the contact->mainPartner indirection. If you change the access model
 * update BOTH
 */
export function filterPartnersByRecordAccess(
  record: FilterRecord,
): WhereOptions<AOSPartner> | undefined {
  if (record.isPrivate !== true) return undefined;

  const partnerIds = (record.partnerSet ?? []).map(p => p.id);
  const categoryIds = (record.partnerCategorySet ?? []).map(c => c.id);

  if (!partnerIds.length && !categoryIds.length) {
    /* Private record with no access; id is non-null so it matches nothing. */
    return {id: {eq: null}};
  }

  const partnerFilter = or<AOSPartner>([
    partnerIds.length && {id: {in: partnerIds}},
    categoryIds.length && {partnerCategory: {id: {in: categoryIds}}},
  ]);

  return or<AOSPartner>([
    and<AOSPartner>([
      {OR: [{isContact: false}, {isContact: {eq: null}}]},
      partnerFilter,
    ]),
    and<AOSPartner>([{isContact: true}, {mainPartner: partnerFilter}]),
  ]);
}

const openRecordFilters = [
  {
    isPrivate: null,
  },
  {
    isPrivate: false,
  },
];

/* Complementary to filterPartnersByRecordAccess — see note above. */
export const filterPrivate = async (
  {user, client}: {user?: User | null; client: Client},
  config: {
    privateOnly?: boolean;
  } = {},
) => {
  const defaultFilter = {
    OR: openRecordFilters,
  };

  if (!(client && user)) {
    return defaultFilter;
  }

  const partnerId = user?.isContact ? user.mainPartnerId : user.id;

  if (!partnerId) {
    return defaultFilter;
  }

  const partner = await findPartnerById(partnerId, client);

  if (!partner) {
    return defaultFilter;
  }

  const partnerCategory = partner?.partnerCategory;

  let OR: any[] = [];

  if (!config?.privateOnly) {
    OR = [...openRecordFilters];
  }

  OR.push({
    AND: [
      {
        isPrivate: true,
      },
      {
        OR: [
          {
            partnerSet: {
              id: {
                in: [partner.id],
              },
            },
          },
          ...(partnerCategory
            ? [
                {
                  partnerCategorySet: {
                    id: {
                      in: [partnerCategory.id],
                    },
                  },
                },
              ]
            : []),
        ],
      },
    ],
  });

  return {
    OR,
  };
};
