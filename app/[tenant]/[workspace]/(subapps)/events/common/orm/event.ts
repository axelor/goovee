// ---- CORE IMPORTS ---- //
import type {Cloned, ExpandRecursively} from '@/types/util';
import {
  DATE_FORMATS,
  DAY,
  DEFAULT_CURRENCY_SCALE,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_PAGE,
  MONTH,
  ORDER_BY,
  SUBAPP_CODES,
  YEAR,
} from '@/constants';
import type {
  AOSPortalEvent,
  AOSPortalEventCategory,
} from '@/goovee/.generated/models';
import {dayjs} from '@/locale';
import type {OpUnitType} from 'dayjs';
import {formatNumber} from '@/locale/server/formatters';
import {filterPrivate} from '@/orm/filter';
import type {Client} from '@/goovee/.generated/client';
import type {TenantConfig} from '@/tenant';
import type {ID, PageInfo, User} from '@/types';
import type {WorkspaceLight} from '@/orm/workspace';
import {getPageInfo} from '@/utils';
import {getSkip} from '@/utils/pagination';
import {formatDateToISOString, formatToTwoDigits} from '@/utils/date';
import {and} from '@/utils/orm';

// ---- LOCAL IMPORTS ---- //
import {EVENT_STATUS, EVENT_TYPE} from '@/subapps/events/common/constants';
import {findProductsFromWS} from '@/subapps/events/common/service';
import {
  findSelectionItems,
  modelFieldSelect,
  type ModelField,
} from '@/orm/model-fields';
import type {
  ListEvent,
  EventConfig,
  EventConfigPartner,
  PartnerForEvent,
} from '@/subapps/events/common/types';
export type {ListEvent, EventConfig, EventConfigPartner, PartnerForEvent};

const buildDateFilters = ({
  eventStartDateTimeCriteria,
  year,
  startDate,
  endDate,
}: {
  eventStartDateTimeCriteria?: object[];
  year?: string | number;
  startDate?: string;
  endDate?: string;
}) => {
  if (eventStartDateTimeCriteria) {
    return {OR: eventStartDateTimeCriteria};
  }

  if (year) {
    return {
      OR: [
        {eventStartDateTime: {between: [startDate, endDate]}},
        {eventEndDateTime: {between: [startDate, endDate]}},
        {
          eventStartDateTime: {le: startDate},
          eventEndDateTime: {ge: endDate},
        },
      ],
    };
  }
};

const buildEventTypeFilters = ({
  eventType,
  todayStartTime,
  currentDateTime,
}: {
  eventType: string;
  todayStartTime: string;
  currentDateTime: string;
}) => {
  switch (eventType) {
    case EVENT_TYPE.ACTIVE:
      return {
        OR: [
          {eventEndDateTime: {ge: currentDateTime}},
          {eventStartDateTime: {ge: currentDateTime}},
          {
            eventStartDateTime: {ge: todayStartTime},
            eventAllDay: true,
          },
        ],
      };
    case EVENT_TYPE.UPCOMING:
      return {eventStartDateTime: {gt: currentDateTime}};
    case EVENT_TYPE.ONGOING:
      return {
        OR: [
          {
            eventStartDateTime: {le: currentDateTime},
            eventEndDateTime: {ge: currentDateTime},
          },
          {
            eventStartDateTime: {between: [todayStartTime, currentDateTime]},
            eventAllDay: {eq: true},
          },
        ],
      };
    case EVENT_TYPE.PAST:
      return {
        OR: [
          {
            eventStartDateTime: {lt: currentDateTime},
            eventEndDateTime: {lt: currentDateTime},
          },
          {
            eventAllDay: {eq: true},
            AND: [
              {eventStartDateTime: {lt: currentDateTime}},
              {
                eventStartDateTime: {
                  notBetween: [todayStartTime, currentDateTime],
                },
              },
            ],
          },
        ],
      };
    default:
      return;
  }
};

export type FullEvent = ExpandRecursively<
  NonNullable<Awaited<ReturnType<typeof findEvent>>>
>;

export async function findEvent({
  id,
  slug,
  config,
  client,
  user,
  workspace,
}: {
  id?: ID;
  slug?: string;
  config: TenantConfig;
  client: Client;
  user: User | null | undefined;
  workspace: WorkspaceLight | Cloned<WorkspaceLight>;
}) {
  if (!((slug || id) && workspace.url)) return null;

  const privateFilter = await filterPrivate({user, client});
  const event = await client.aOSPortalEvent
    .findOne({
      where: and<AOSPortalEvent>([
        id && {id},
        slug ? {slug} : {slug: {ne: null}},
        privateFilter,
        {OR: [{archived: false}, {archived: null}]},
        {
          statusSelect: EVENT_STATUS.PUBLISHED,
          eventCategorySet: and<AOSPortalEventCategory>([
            {workspace: {url: workspace.url}},
            privateFilter,
          ]),
        },
      ]),
      select: {
        id: true,
        eventTitle: true,
        eventCategorySet: {select: {id: true, name: true, color: true}},
        eventImage: {id: true},
        eventDescription: true,
        eventPlace: true,
        eventStartDateTime: true,
        eventEndDateTime: true,
        eventAllDay: true,
        eventAllowRegistration: true,
        eventAllowMultipleRegistrations: true,
        registrationDeadlineDateTime: true,
        eventProduct: {
          name: true,
          code: true,
          salePrice: true,
          saleCurrency: {code: true, symbol: true, numberOfDecimals: true},
        },
        registrationList: {
          select: {
            participantList: {
              where: {...(user?.email ? {emailAddress: user?.email} : {})},
              select: {emailAddress: true},
            },
          },
        },
        slug: true,
        defaultPrice: true,
        facilityList: {
          select: {
            id: true,
            facility: true,
            price: true,
            additionalFieldSet: {
              select: modelFieldSelect,
            },
          },
        },
        additionalFieldSet: {
          select: modelFieldSelect,
        },

        isPublic: true,
        isHidden: true,
        isLoginNotNeeded: true,
        isPrivate: true,
        maxParticipantPerRegistration: true,
        workspace: {
          url: true,
        },
      },
    })
    .then(event => {
      if (!event) return null;
      const isRegistered = user?.email
        ? Boolean(
            event?.registrationList?.find(
              r => (r.participantList?.length ?? 0) > 0,
            ),
          )
        : false;
      return {...event, isRegistered};
    });

  if (!event) return null;
  const {eventProduct, defaultPrice} = event;
  const {saleCurrency} = eventProduct || {};

  const productsFromWS = await findProductsFromWS({
    eventId: event.id,
    config,
    partnerWorkspaceId: workspace.id,
    partnerId: user?.id,
  });

  const displayWt: string =
    productsFromWS?.priceWT || defaultPrice?.toString() || '';
  const displayAti: string =
    productsFromWS?.priceATI || defaultPrice?.toString() || '';

  const currencySymbol = saleCurrency?.symbol || DEFAULT_CURRENCY_SYMBOL;
  const scale = saleCurrency?.numberOfDecimals || DEFAULT_CURRENCY_SCALE;

  const formattedDefaultPrice = await formatNumber(displayWt, {
    currency: currencySymbol,
    scale,
    type: 'DECIMAL',
  });

  const formattedDefaultPriceAti = await formatNumber(displayAti, {
    currency: currencySymbol,
    scale,
    type: 'DECIMAL',
  });

  const updatedFacilityList = event?.facilityList?.map(async facility => {
    const matchingFacility = productsFromWS?.facilityPricingList?.find(
      (f: {id: string | number}) => Number(f.id) === Number(facility.id),
    );

    const facilityWt = matchingFacility
      ? matchingFacility.priceWT
      : facility.price?.toString();

    const facilityAti = matchingFacility
      ? matchingFacility.priceATI
      : facility.price?.toString();

    const formattedPriceWt = await formatNumber(facilityWt, {
      currency: currencySymbol,
      scale,
      type: 'DECIMAL',
    });

    const formattedPriceAti = await formatNumber(facilityAti, {
      currency: currencySymbol,
      scale,
      type: 'DECIMAL',
    });

    const additionalFieldSet = (await Promise.all(
      (facility.additionalFieldSet ?? []).map(async field => {
        if (field.selection == null) return {...field, selectionOptions: null};
        const selectionOptions = await findSelectionItems({
          selectionName: field.selection,
          client,
        });
        return {...field, selectionOptions};
      }),
    )) as ModelField[];

    return {
      ...facility,
      additionalFieldSet,
      price: facility.price?.toString(),
      displayWt: facilityWt,
      displayAti: facilityAti,
      formattedPrice: await formatNumber(facilityWt, {
        currency: currencySymbol,
        scale,
      }),
      formattedPriceWt,
      formattedPriceAti,
    };
  });

  const eventLink = `${workspace.url}/${SUBAPP_CODES.events}/${event.slug}`;

  const additionalFieldSet = (await Promise.all(
    (event.additionalFieldSet ?? []).map(async field => {
      if (field.selection == null) return {...field, selectionOptions: null};
      const selectionOptions = await findSelectionItems({
        selectionName: field.selection,
        client,
      });
      return {...field, selectionOptions};
    }),
  )) as ModelField[];

  return {
    ...event,
    additionalFieldSet,
    defaultPrice: event.defaultPrice?.toString(),
    displayWt,
    displayAti,
    formattedDefaultPrice,
    formattedDefaultPriceAti,
    facilityList: await Promise.all(updatedFacilityList || []),
    currency: {
      id: productsFromWS?.currencyId,
      code: productsFromWS?.currencyCode,
    },
    eventLink,
    priceScale: scale,
  };
}

export async function findEvents({
  ids,
  search,
  categoryids,
  page = DEFAULT_PAGE,
  limit,
  day,
  month,
  year,
  selectedDates,
  workspaceURL,
  client,
  user,
  onlyRegisteredEvent,
  eventType,
  orderBy,
}: {
  ids?: ID[];
  search?: string;
  categoryids?: ID[];
  page?: string | number;
  limit?: number;
  day?: string | number;
  month?: string | number;
  year?: string | number;
  selectedDates?: (Date | string)[];
  workspaceURL: string;
  client: Client;
  user: User | null | undefined;
  onlyRegisteredEvent?: boolean;
  eventType?: string;
  orderBy?: Record<string, string>;
}): Promise<{events: ListEvent[]; pageInfo: PageInfo}> {
  const emptyPageInfo: PageInfo = {
    count: 0,
    limit: 0,
    page: 1,
    pages: 1,
    hasNext: false,
    hasPrev: false,
  };
  if (!workspaceURL) {
    return {
      events: [],
      pageInfo: emptyPageInfo,
    };
  }

  if (onlyRegisteredEvent && !user) {
    return {
      events: [],
      pageInfo: emptyPageInfo,
    };
  }

  let date: ReturnType<typeof dayjs> | undefined;
  let predicate: OpUnitType = DAY;
  if (day && month && year) {
    predicate = DAY;
    date = dayjs(
      `${formatToTwoDigits(day)}-${formatToTwoDigits(month)}-${year}`,
      DATE_FORMATS.DD_MM_YYYY,
    );
  } else if (month && year) {
    predicate = MONTH;
    date = dayjs(`${formatToTwoDigits(month)}-${year}`, DATE_FORMATS.MM_YYYY);
  } else if (year) {
    predicate = YEAR;
    date = dayjs(year, DATE_FORMATS.YYYY);
  }

  let startDate, endDate;
  if (year) {
    startDate = formatDateToISOString(date?.startOf(predicate));
    endDate = formatDateToISOString(date?.endOf(predicate));
  }

  const eventStartDateTimeCriteria = selectedDates?.map(
    (date: Date | string) => ({
      eventStartDateTime: {
        between: [
          dayjs(date).startOf(DAY).format(DATE_FORMATS.timestamp_with_seconds),
          dayjs(date).endOf(DAY).format(DATE_FORMATS.timestamp_with_seconds),
        ],
      },
    }),
  );
  const currentDateTime = dayjs().toISOString();
  const todayStartTime = dayjs().startOf(DAY).toISOString();
  const privateFilter = await filterPrivate({user, client});
  const whereClause = and<AOSPortalEvent>([
    {
      statusSelect: EVENT_STATUS.PUBLISHED,
      slug: {ne: null},
      eventCategorySet: and<AOSPortalEventCategory>([
        {workspace: {url: workspaceURL}},
        categoryids?.length && {id: {in: categoryids}},
        privateFilter,
      ]),
    },
    privateFilter,
    ids?.length && {id: {in: ids}},
    search && {eventTitle: {like: `%${search}%`}},
    {OR: [{archived: false}, {archived: null}]},
    buildDateFilters({eventStartDateTimeCriteria, year, startDate, endDate}),
    eventType &&
      buildEventTypeFilters({eventType, todayStartTime, currentDateTime}),
    onlyRegisteredEvent
      ? {registrationList: {participantList: {emailAddress: user?.email}}}
      : {
          OR: [
            {isHidden: false},
            {isHidden: null},
            ...(user?.email
              ? [
                  {
                    registrationList: {
                      participantList: {emailAddress: user?.email},
                    },
                  },
                ]
              : []),
          ],
        },
  ]);

  const skip = limit ? getSkip(limit, page) : undefined;

  orderBy = orderBy || {eventStartDateTime: ORDER_BY.DESC};

  const events = await client.aOSPortalEvent
    .find({
      where: whereClause,
      orderBy,
      take: limit,
      ...(skip ? {skip} : {}),
      select: {
        id: true,
        eventTitle: true,
        eventCategorySet: {
          select: {
            id: true,
            name: true,
            color: true,
            image: {id: true},
            thumbnailImage: {id: true},
          },
        },
        eventImage: {id: true},
        eventDescription: true,
        eventStartDateTime: true,
        eventEndDateTime: true,
        eventAllDay: true,
        registrationDeadlineDateTime: true,
        ...(user?.email && {
          registrationList: {
            select: {
              participantList: {
                where: {emailAddress: user.email},
                select: {emailAddress: true},
              },
            },
          },
        }),
        slug: true,
      },
    })
    .then(events =>
      events.map(event => ({
        ...event,
        isRegistered: user?.email
          ? Boolean(
              event.registrationList?.find(
                r => (r.participantList?.length ?? 0) > 0,
              ),
            )
          : false,
      })),
    );

  const pageInfo = getPageInfo({
    count: events?.[0]?._count,
    page,
    limit,
  });

  return {events, pageInfo};
}

export async function findEventConfig({
  id,
  client,
  workspaceURL,
}: {
  id: ID;
  client: Client;
  workspaceURL: WorkspaceLight['url'];
}): Promise<EventConfig | null> {
  if (!id) return null;

  const partnersFields = {
    emailAddress: {address: true},
    isProspect: true,
    isContact: true,
    isCustomer: true,
    isActivatedOnPortal: true,
    canSubscribeNoPublicEvent: true,
    contactPartnerSet: {
      select: {
        emailAddress: {address: true},
        isActivatedOnPortal: true,
      },
    },
  };

  const eventConfig = await client.aOSPortalEvent.findOne({
    where: and<AOSPortalEvent>([
      {
        statusSelect: EVENT_STATUS.PUBLISHED,
        id,
        slug: {ne: null},
        eventCategorySet: {workspace: {url: workspaceURL}},
      },
      {OR: [{archived: false}, {archived: null}]},
    ]),
    select: {
      isPrivate: true,
      isHidden: true,
      isLoginNotNeeded: true,
      isPublic: true,
      eventEndDateTime: true,
      eventStartDateTime: true,
      eventAllDay: true,
      eventAllowRegistration: true,
      eventAllowMultipleRegistrations: true,
      partnerCategorySet: {select: {partners: {select: partnersFields}}},
      partnerSet: {select: partnersFields},
      registrationDeadlineDateTime: true,
      registrationList: {
        select: {participantList: {select: {emailAddress: true}}},
      },
      maxParticipantPerEvent: true,
      maxParticipantPerRegistration: true,
    },
  });

  return eventConfig;
}

export async function findPartnerByEmailForEvent(
  email: string,
  client: Client,
): Promise<PartnerForEvent | null> {
  if (!email) return null;

  const partners = await client.aOSPartner.find({
    where: {
      emailAddress: {address: {eq: email}},
      OR: [{archived: false}, {archived: null}],
    },
    select: {
      id: true,
      isActivatedOnPortal: true,
      canSubscribeNoPublicEvent: true,
      emailAddress: {address: true},
    },
  });

  if (partners.length) {
    if (partners.length === 1) return partners[0];
    return partners.find(p => p.isActivatedOnPortal) ?? partners[0];
  }
  return null;
}
