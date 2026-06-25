import {AOSPartner} from '@/goovee/.generated/models';
import type {WhereOptions} from '@goovee/orm';
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

/* Complementary to filterPartnersByRecordAccess — see note above.
 * Pure transform: the partner id and partner-category id both come from the
 * request-scoped session (customSession), so no partner lookup is needed. */
export const filterPrivate = (
  {user}: {user: User | null | undefined},
  config: {
    privateOnly?: boolean;
  } = {},
) => {
  const defaultFilter = {
    OR: openRecordFilters,
  };

  const partnerId = user?.isContact ? user.mainPartnerId : user?.id;

  if (!partnerId) {
    return defaultFilter;
  }

  const categoryId = user?.partnerCategoryId;

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
                in: [partnerId],
              },
            },
          },
          ...(categoryId
            ? [
                {
                  partnerCategorySet: {
                    id: {
                      in: [categoryId],
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
