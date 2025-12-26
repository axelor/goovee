import {formatStudioFields} from '@/ui/form';

export const getFacilitiesCustomFields = (facilityList: any[]): any[] => {
  const result: any[] = [];

  facilityList.forEach((facility: any) => {
    const fields = formatStudioFields(facility.additionalFieldSet).map(_f => ({
      ..._f,
      order: 8,
      required: false,
      hideIf: (formState: any) => {
        return !formState?.subscriptionSet?.find(
          (_s: any) => _s.id === facility.id,
        );
      },
      requiredIf: _f.required
        ? (formState: any) => {
            return !!formState?.subscriptionSet?.find(
              (_s: any) => _s.id === facility.id,
            );
          }
        : undefined,
    }));

    result.push(...fields);
  });

  return result;
};

export const getEventCustomFields = (customFields: any[]): any[] => {
  const fields = formatStudioFields(customFields).map(_f => ({
    ..._f,
    order: 6,
  }));

  return fields;
};
