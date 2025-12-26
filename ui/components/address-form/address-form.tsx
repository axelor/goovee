'use client';

import {useState, useEffect} from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  TextField,
  Button,
  Label,
  Checkbox,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@/ui/components';
import type {Address, Country} from '@/types';

export type AddressFormProps = {
  values?: Partial<Address> & {multipletype?: boolean};
  countries: Country[];
  onSubmit: (event: React.FormEvent<any>, values: Partial<Address>) => void;
};

const defaultAddress = {
  addressl2: '',
  addressl3: '',
  addressl4: '',
  addressl6: '',
  multipletype: false,
};

export function AddressForm({
  values: valuesProp,
  countries,
  onSubmit,
}: AddressFormProps) {
  const [values, setValues] = useState(
    valuesProp || {...defaultAddress, country: countries?.[0]},
  );
  const [selectedValue, setSelectedValue] = useState<string>(
    countries?.[0].id.toString(),
  );

  const handleCheckbox = (event: any) => {
    setValues(v => ({
      ...v,
      multipletype: event,
    }));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value, type} = event.target;
    setValues(v => ({
      ...v,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<any>) => {
    onSubmit && onSubmit(event, values);
  };

  useEffect(() => {
    valuesProp && setValues(valuesProp);
  }, [valuesProp]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white py-4 px-6">
        <TextField
          label={i18n.t('Recipient details')}
          name="addressl2"
          value={values.addressl2}
          onChange={handleChange}
        />
        <TextField
          label={i18n.t('N° and Street label')}
          name="addressl4"
          value={values.addressl4}
          onChange={handleChange}
          required
        />
        <TextField
          label={i18n.t('Address precision')}
          name="addressl3"
          value={values.addressl3}
          onChange={handleChange}
        />
        <TextField
          label={i18n.t('Zip/City')}
          name="addressl6"
          value={values.addressl6}
          onChange={handleChange}
          required
        />

        <div className="w-full mb-4">
          <Label className="font-medium mb-1">{i18n.t('Country')}</Label>
          <Select
            onValueChange={o => {
              const selectedCountry = countries?.find(op => op.id === o);
              setSelectedValue(o);
              setValues(v => ({...v, country: selectedCountry}) as any);
            }}
            defaultValue={selectedValue as string | undefined}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Country</SelectLabel>
                {countries.map((op: any) => {
                  return (
                    <SelectItem key={op?.id} value={op.id}>
                      {op?.name}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 mb-6">
          <Checkbox
            onCheckedChange={handleCheckbox}
            name="multipletype"
            checked={values.multipletype}
          />
          <Label className="ml-2">
            {i18n.t('Use this address for both billing and delivery')}
          </Label>
        </div>
      </div>
      <Button type="submit" className="mt-6 rounded-full w-full">
        {i18n.t('Save modifications')}
      </Button>
    </form>
  );
}

export default AddressForm;
