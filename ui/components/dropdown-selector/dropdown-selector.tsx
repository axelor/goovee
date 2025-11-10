'use client';

// ---- CORE IMPORTS ---- //
import {
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from '@/ui/components';
import {cn} from '@/utils/css';

type DropdownOptionBase = {
  id: string | number;
  name: string;
};

type DropdownSelectorProps<T extends DropdownOptionBase> = {
  options: T[];
  label: string;
  placeholder?: string;
  selectedValue?: string;
  labelClassName?: string;
  rootClassName?: string;
  isRequired?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  onValueChange: (selectedOption: T) => void;
};

export function DropdownSelector<T extends DropdownOptionBase>({
  options = [],
  label,
  placeholder = 'Select an option',
  selectedValue,
  labelClassName,
  rootClassName,
  isRequired,
  disabled,
  hasError,
  onValueChange,
}: DropdownSelectorProps<T>) {
  return (
    <div className={rootClassName}>
      <Label
        className={cn('font-medium mb-1', labelClassName, {
          'text-destructive font-medium': hasError,
        })}>
        {label}
        {isRequired && <span className="text-destructive">*</span>}
      </Label>
      <Select
        value={selectedValue}
        disabled={disabled}
        onValueChange={(value: string) => {
          const selectedOption = options.find(option => option.id === value);
          if (selectedOption) {
            onValueChange(selectedOption);
          }
        }}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{label}</SelectLabel>
            {options.map(option => (
              <SelectItem key={option.id} value={String(option.id)}>
                {option.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
export default DropdownSelector;
