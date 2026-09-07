'use client';

import {useEffect, useState} from 'react';
import Select, {MultiValue} from 'react-select';
import type {FieldValues, UseFormReturn} from 'react-hook-form';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {createDefaultValues} from '@/ui/form';
import type {Field} from '@/ui/form';
import {useToast} from '@/ui/hooks/use-toast';

// ---- LOCAL IMPORTS ---- //
import {
  fetchContacts,
  isValidParticipant,
} from '@/subapps/events/common/actions/actions';
import type {OptionType} from '@/subapps/events/common/ui/components/custom-select/types';

type ContactItem = {
  id: string;
  simpleFullName: string | null;
  [key: string]: unknown;
};

function formatItems(array: ContactItem[]): OptionType[] {
  return array.map(participant => ({
    ...(participant as unknown as OptionType),
    value: participant.id,
    label: participant.simpleFullName,
  }));
}

type ParticipantItem = {
  fromParticipant?: boolean;
  valueId?: string;
  [key: string]: unknown;
};

export const CustomSelect = ({
  form,
  field,
  arrayName,
  subSchema,
  eventId,
  maxSelections,
}: {
  form: UseFormReturn<FieldValues>;
  field: Field;
  arrayName: string;
  subSchema: Field[];
  eventId: string;
  maxSelections?: number;
}) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<OptionType[]>([]);

  const {toast} = useToast();

  const handleChange = async (selected: MultiValue<OptionType>) => {
    const _current = (form.getValues(arrayName) ?? []) as ParticipantItem[];
    const selectedUsers = selected ?? [];
    const customParticipants = _current.filter(
      ({fromParticipant, valueId}: ParticipantItem) =>
        !fromParticipant ||
        (fromParticipant &&
          selectedUsers.find((_s: OptionType) => _s.id === valueId) != null),
    );

    const invalidParticipants: string[] = [];
    for await (const _s of selectedUsers) {
      if (
        customParticipants.find(
          ({valueId, fromParticipant}: ParticipantItem) =>
            fromParticipant && valueId === _s.id,
        ) == null
      ) {
        if (maxSelections && maxSelections <= customParticipants.length + 1) {
          toast({
            variant: 'destructive',
            title: i18n.t(
              'Registration is limited to {0} participants only.',
              String(maxSelections),
            ),
          });
          return;
        }
        const email = _s.emailAddress?.address;
        if (!email) {
          toast({
            variant: 'destructive',
            title: i18n.t('Email address cannot be empty'),
          });
          invalidParticipants.push(_s.id);
          continue;
        }
        const {error, message} = await isValidParticipant({
          email,
          eventId,
        });
        if (error) {
          toast({variant: 'destructive', title: message});
          invalidParticipants.push(_s.id);
        } else {
          customParticipants.unshift({
            ...createDefaultValues(subSchema),
            ..._s,
            valueId: _s.id,
            fromParticipant: true,
            name: _s.firstName,
            surname: _s.name,
            emailAddress: _s.emailAddress?.address,
            phone: _s.fixedPhone,
            company: _s.mainPartner,
          });
        }
      }
    }

    form.setValue(arrayName, customParticipants);
    form.setValue(
      field.name,
      selected.filter(({value}) => !invalidParticipants.includes(value)),
    );
  };

  const handleInputChange = async (input: string = '') => {
    setInputValue(input.toLocaleLowerCase());

    try {
      const {error, message, data} = await fetchContacts({
        search: input,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: i18n.t(message || 'Error while fetching contacts.'),
        });
      } else {
        setFilteredOptions(formatItems(data));
      }
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const watchFields = form.watch(arrayName);

  useEffect(() => {
    if (Array.isArray(watchFields)) {
      form.setValue(
        field.name,
        formatItems(watchFields.filter(({fromParticipant}) => fromParticipant)),
      );
    } else {
      form.setValue(field.name, []);
    }
  }, [arrayName, field.name, form, watchFields]);

  useEffect(() => {
    handleInputChange();
  }, []);

  return (
    <Select<OptionType, true>
      isMulti
      options={filteredOptions}
      placeholder={i18n.t('Select a user')}
      value={form.watch(field.name) ?? []}
      onChange={handleChange}
      onInputChange={handleInputChange}
      inputValue={inputValue}
      styles={{
        menuPortal: base => ({...base, zIndex: 9999}),
        menu: provided => ({...provided, zIndex: 9999}),
        multiValue: provided => ({
          ...provided,
          backgroundColor: '#CDCFEF',
          borderRadius: '0.25rem',
          padding: '0.25rem 0.5rem',
        }),
        multiValueRemove: provided => ({
          ...provided,
          color: 'black',
          ':hover': {
            backgroundColor: 'transparent',
            color: 'black',
          },
        }),
      }}
    />
  );
};

export default CustomSelect;
