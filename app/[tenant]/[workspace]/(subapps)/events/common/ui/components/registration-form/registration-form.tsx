'use client';

import {useCallback, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {MdAdd, MdArrowForward} from 'react-icons/md';
import type {UseFormReturn} from 'react-hook-form';

// ---- CORE IMPORTS ---- //
import {Link} from '@/ui/components/link';
import {cn} from '@/utils/css';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {
  FormView,
  ArrayComponent,
  formatStudioFields,
  type Field,
  type customComponentOptions,
} from '@/ui/form';
import {useToast} from '@/ui/hooks/use-toast';
import {SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {BadgeList, Button} from '@/ui/components';
import {useSearchParams} from '@/ui/hooks';

// ---- LOCAL IMPORTS ---- //
import {
  CustomSelect,
  EventDateCard,
  SubscriptionsPriceView,
  SubscriptionsView,
  EmailFormField,
  EventPayments,
  CompanyAddressField,
} from '@/subapps/events/common/ui/components';
import type {EventPageCardProps} from '@/subapps/events/common/ui/components';
import {
  isValidParticipant,
  register,
} from '@/subapps/events/common/actions/actions';
import {SUCCESS_REGISTER_MESSAGE} from '@/subapps/events/common/constants';
import {
  getPartnerAddress,
  mapParticipants,
} from '@/subapps/events/common/utils';
import {
  getEventCustomFields,
  getFacilitiesCustomFields,
} from './custom-fields-helper';

export const RegistrationForm = ({
  eventDetails,
  metaFields = [],
  config,
  user,
}: EventPageCardProps) => {
  const {
    defaultPrice = 0,
    formattedDefaultPrice = null,
    formattedDefaultPriceAti = null,
    displayAti,
    facilityList = [],
    eventTitle = '',
    eventStartDateTime,
    eventEndDateTime,
    eventAllDay = false,
    eventCategorySet = [],
    eventAllowMultipleRegistrations = false,
    id: eventId,
    eventProduct = null,
    isPrivate = false,
    maxParticipantPerRegistration,
    slug,
    additionalFieldSet,
    priceScale,
  } = eventDetails || {};

  const [totalPrice, setTotalPrice] = useState<number>(0);
  const router = useRouter();
  const {url} = useWorkspace();
  const {toast} = useToast();

  const {searchParams} = useSearchParams();
  const stripeSessionId = searchParams.get('stripe_session_id');
  const payboxResponse = searchParams.get('paybox_response');

  const isLoggedIn = !!user?.emailAddress;
  //NOTE: temprorary disable contacts list
  const showContactsList = false && isLoggedIn && !user?.isContact;
  const canPay = defaultPrice || facilityList?.length;
  const eventPrice = defaultPrice ? Number(displayAti ?? 0) : 0;

  const isCompanyOrAddressRequired = config.isCompanyOrAddressRequired;

  const [facilitiesCustomFields, requiredFacilitiesCustomFields] =
    useMemo(() => {
      const facilitiesCustomFields = getFacilitiesCustomFields(facilityList);
      const requiredFacilitiesCustomFields = facilitiesCustomFields.filter(
        f => f.requiredIf,
      );
      return [facilitiesCustomFields, requiredFacilitiesCustomFields];
    }, [facilityList]);

  const basicPerson = useMemo(
    () => [
      {
        name: 'name',
        title: i18n.t('Name'),
        type: 'string',
        widget: null,
        helper: i18n.t('Enter name'),
        hidden: false,
        required: true,
        readonly: false,
        order: 1,
        defaultValue: user?.firstName || '',
      },
      {
        name: 'surname',
        title: i18n.t('Surname'),
        type: 'string',
        widget: null,
        helper: i18n.t('Enter surname'),
        hidden: false,
        required: true,
        readonly: false,
        order: 2,
        defaultValue: user?.name || '',
      },
      {
        name: 'company',
        title: i18n.t('Company'),
        type: 'string',
        widget: 'custom',
        order: 3,
        defaultValue: getPartnerAddress(user) || '',
        required: isCompanyOrAddressRequired ?? false,
        customComponent: (props: customComponentOptions) => (
          <CompanyAddressField
            {...props}
            title={i18n.t('Company/Address')}
            placeholder={i18n.t('Enter company/address')}
          />
        ),
      },
      {
        name: 'emailAddress',
        type: 'string',
        widget: 'custom',
        order: 4,
        defaultValue: user?.emailAddress?.address || '',
        required: true,
        customComponent: getEmailFieldComponent({
          eventId,
        }),
      },
      {
        name: 'phone',
        title: i18n.t('Mobile phone'),
        type: 'string',
        widget: 'phone',
        helper: i18n.t('Enter phone number'),
        hidden: false,
        required: true,
        readonly: false,
        order: 5,
        defaultValue: user?.mobilePhone || '',
      },
      {
        name: 'subscriptionSet',
        title: null,
        type: 'array',
        widget: 'custom',
        hidden: !facilityList.length,
        order: 7,
        customComponent: (props: customComponentOptions) => (
          <SubscriptionsView
            {...props}
            list={facilityList}
            requiredFacilitiesCustomFields={requiredFacilitiesCustomFields}
            event={{
              price: eventPrice,
              formattedDefaultPriceAti: formattedDefaultPriceAti,
            }}
          />
        ),
      },
    ],
    [
      user,
      isCompanyOrAddressRequired,
      eventId,
      facilityList,
      eventPrice,
      formattedDefaultPriceAti,
      requiredFacilitiesCustomFields,
    ],
  );

  const metaFieldsFacilities = facilityList
    .flatMap(facility => facility.additionalFieldSet)
    .filter(f => f !== null);

  const participantForm = useMemo(
    () => [
      ...basicPerson,
      ...formatStudioFields(metaFields),
      ...getEventCustomFields(additionalFieldSet ?? []),
      ...facilitiesCustomFields,
    ],
    [basicPerson, facilitiesCustomFields, metaFields, additionalFieldSet],
  );

  const externalParticipantForm = useMemo(
    () => [
      ...participantForm,
      {
        name: 'valueId',
        title: null,
        type: 'number',
        hidden: true,
      },
      {
        name: 'fromParticipant',
        title: null,
        type: 'boolean',
        hidden: true,
      },
    ],
    [participantForm],
  );

  const multipleRegistrationForm = useMemo(
    () => [
      ...participantForm,
      {
        name: 'addOtherPeople',
        title: i18n.t('Register other people to this event'),
        type: 'boolean',
        widget: null,
        helper: null,
        hidden: true,
        required: false,
        readonly: true,
        order: 100,
        defaultValue: true,
      },
      ...(showContactsList
        ? [
            {
              name: 'users',
              title: null,
              type: 'array',
              widget: 'custom',
              helper: null,
              hidden: false,
              hideIf: (formState: Record<string, unknown>) =>
                !formState?.addOtherPeople,
              required: false,
              readonly: false,
              order: 110,
              customComponent: (props: customComponentOptions) =>
                CustomSelect({
                  ...props,
                  eventId,
                  maxSelections: maxParticipantPerRegistration ?? undefined,
                  arrayName: 'otherPeople',
                  subSchema: externalParticipantForm as Field[],
                }),
            },
          ]
        : []),
      {
        name: 'otherPeople',
        title: i18n.t('Other people'),
        type: 'array',
        widget: 'custom',
        helper: null,
        hidden: false,
        hideIf: (formState: Record<string, unknown>) =>
          !formState?.addOtherPeople,
        required: false,
        readonly: false,
        order: 120,
        customComponent: (props: customComponentOptions) =>
          ArrayComponent({
            ...props,
            renderItem: props.renderItem!,
            subItemTitle: i18n.t('Participant'),
            renderAddMore: ({addItem}) => {
              if (isPrivate) return null;
              return (
                <Button
                  type="button"
                  className="bg-success-light hover:bg-success p-2 flex whitespace-normal items-center gap-2 h-fit max-w-full group"
                  onClick={() => {
                    const current =
                      props.form.getValues(props.field.name)?.length || 0;
                    const max = maxParticipantPerRegistration;
                    if (max && max <= current + 1) {
                      toast({
                        variant: 'destructive',
                        title: i18n.t(
                          'Registration is limited to {0} participants only.',
                          String(max),
                        ),
                      });
                      return;
                    }
                    addItem();
                  }}>
                  <MdAdd className="w-6 h-6 text-success group-hover:text-white" />
                  <p className="text-sm font-normal text-center text-black">
                    {i18n.t('Add new participant')}
                  </p>
                </Button>
              );
            },
          }),
        subSchema: externalParticipantForm.map(field =>
          field.name === 'subscriptionSet'
            ? {
                ...field,
                customComponent: (props: customComponentOptions) => (
                  <SubscriptionsView
                    {...props}
                    list={facilityList}
                    requiredFacilitiesCustomFields={
                      requiredFacilitiesCustomFields
                    }
                    isSecondary
                    event={{
                      price: eventPrice,
                      formattedDefaultPriceAti: formattedDefaultPriceAti,
                    }}
                  />
                ),
              }
            : field.name === 'company'
              ? {
                  ...field,
                  customComponent: (props: customComponentOptions) => (
                    <CompanyAddressField
                      {...props}
                      title={i18n.t('Company')}
                      placeholder={i18n.t('Enter company')}
                      isSecondary
                    />
                  ),
                }
              : field,
        ) as Field[],
      },
    ],
    [
      participantForm,
      showContactsList,
      externalParticipantForm,
      eventId,
      facilityList,
      isPrivate,
      maxParticipantPerRegistration,
      eventPrice,
      formattedDefaultPriceAti,
      requiredFacilitiesCustomFields,
      toast,
    ],
  );

  const handleTotalPriceChange = useCallback((value: number) => {
    setTotalPrice(value);
  }, []);

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      const result = mapParticipants(
        values as Parameters<typeof mapParticipants>[0],
        metaFields,
        metaFieldsFacilities,
        (additionalFieldSet ?? []).filter(f => f !== null),
      );
      const {error, message} = await register({
        eventId,
        values: result,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: i18n.t(message),
        });
      } else {
        toast({
          variant: 'success',
          title: i18n.t(SUCCESS_REGISTER_MESSAGE),
        });
        router.push(
          url.forRouter(
            `/${SUBAPP_CODES.events}/${slug}/${SUBAPP_PAGE.register}/${SUBAPP_PAGE.confirmation}`,
          ),
        );
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: i18n.t('Error while register to event'),
      });
    }
  };

  const eventDetailHref = url.forRouter(`/${SUBAPP_CODES.events}/${slug}`);

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Event header card */}
      <section className="bg-white rounded-2xl border border-ink-100 shadow-xs p-[22px] flex flex-col gap-3">
        <h2 className="m-0 text-xl font-extrabold tracking-[-0.015em] text-ink-900">
          {eventTitle}
        </h2>
        <EventDateCard
          startDate={eventStartDateTime}
          endDate={eventEndDateTime}
          eventAllDay={eventAllDay}
        />
        {eventCategorySet?.length ? (
          <BadgeList items={eventCategorySet ?? []} />
        ) : null}
        {defaultPrice ? (
          <div className="mt-1 rounded-xl border border-ink-100 bg-ink-25 px-4 py-3.5 flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <span className="text-[13px] font-semibold text-ink-600">
              {i18n.t('Price (incl. tax)')}
            </span>
            <span className="text-lg font-extrabold text-royal-dark">
              {formattedDefaultPriceAti}
            </span>
            <span className="text-[12.5px] text-ink-500">
              {i18n.t('Price (excl. tax)')} {formattedDefaultPrice}
            </span>
          </div>
        ) : null}
        {eventAllowMultipleRegistrations && (
          <h3 className="mt-1 text-sm font-bold text-ink-900">
            {i18n.t('Participant')} #1
          </h3>
        )}
      </section>

      {/* Form card */}
      <section className="bg-white rounded-2xl border border-ink-100 shadow-xs p-[22px]">
        <FormView
          fields={
            [
              ...(eventAllowMultipleRegistrations
                ? multipleRegistrationForm
                : participantForm),
              {
                name: 'facilitiesPrice',
                title: null,
                type: 'array',
                widget: 'custom',
                hidden: !canPay,
                customComponent: (props: customComponentOptions) => (
                  <SubscriptionsPriceView
                    {...props}
                    list={facilityList}
                    event={{
                      displayAti: eventPrice,
                      facilityList,
                    }}
                    currency={
                      eventProduct?.saleCurrency as
                        | {symbol: string; numberOfDecimals: number}
                        | undefined
                    }
                    onTotalPriceChange={handleTotalPriceChange}
                  />
                ),
              },
            ] as Field[]
          }
          superRefineCheck={(val: Record<string, unknown>, ctx) => {
            requiredFacilitiesCustomFields.forEach(field => {
              if (field.requiredIf?.(val) && !val?.[field.name]) {
                ctx.addIssue({
                  code: 'custom',
                  message: i18n.t('Required'),
                  path: [field.name],
                });
              }
              (
                val.otherPeople as Array<Record<string, unknown>> | undefined
              )?.forEach((p: Record<string, unknown>, i: number) => {
                if (field.requiredIf?.(p) && !p?.[field.name]) {
                  ctx.addIssue({
                    code: 'custom',
                    message: i18n.t('Required'),
                    path: ['otherPeople', i, field.name],
                  });
                }
              });
            });
          }}
          mode={'onChange'}
          {...((canPay && totalPrice > 0) || stripeSessionId || payboxResponse
            ? {
                submitButton: ({
                  form,
                }: {
                  form: UseFormReturn<Record<string, unknown>>;
                }) => (
                  <EventPayments
                    config={config}
                    event={{
                      id: eventId,
                      displayAti: String(eventPrice),
                      facilityList,
                      priceScale,
                    }}
                    form={form}
                    metaFields={metaFields}
                    metaFieldsFacilities={metaFieldsFacilities}
                    additionalFieldSet={additionalFieldSet}
                  />
                ),
              }
            : {
                /* Replaces FormView's default full-width button with the mint CTA
                 * + Cancel of the redesign, reusing FormView's own submit wiring
                 * (handleSubmit(onSubmit), disabled on invalid/submitting). */
                submitButton: ({
                  form,
                }: {
                  form: UseFormReturn<Record<string, unknown>>;
                }) => {
                  const disabled =
                    form.formState.isSubmitting ||
                    !form.formState.isValid ||
                    Object.keys(form.formState.errors || {}).length > 0;
                  return (
                    <div className="flex justify-end gap-2.5 pt-2">
                      <Link
                        href={eventDetailHref}
                        className="inline-flex items-center rounded-[10px] border border-ink-150 bg-white px-5 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-25">
                        {i18n.t('Cancel')}
                      </Link>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => form.handleSubmit(onSubmit)()}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-[10px] px-6 py-3 text-sm font-bold text-white transition-colors',
                          disabled
                            ? 'bg-ink-200 cursor-not-allowed'
                            : 'bg-mint-500 hover:bg-mint-600 shadow-[0_1px_2px_rgba(46,163,107,0.3),0_6px_14px_rgba(46,163,107,0.18)]',
                        )}>
                        {form.formState.isSubmitting
                          ? i18n.t('Submitting…')
                          : i18n.t('Confirm registration')}
                        <MdArrowForward className="text-sm" />
                      </button>
                    </div>
                  );
                },
              })}
        />
      </section>
    </div>
  );
};

const getEmailFieldComponent = ({
  isDisabled = false,
  eventId,
}: {
  isDisabled?: boolean;
  eventId: string;
}) => {
  const EmailComponent = (props: customComponentOptions) => (
    <EmailFormField
      {...props}
      title={i18n.t('Email')}
      placeholder={i18n.t('Enter email')}
      disabled={isDisabled}
      onValidation={(email: string) => {
        return isValidParticipant({
          email,
          eventId,
        });
      }}
    />
  );

  EmailComponent.displayName = 'EmailFieldComponent';
  return EmailComponent;
};
