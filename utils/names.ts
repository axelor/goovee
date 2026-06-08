import {capitalize, startCase} from 'lodash-es';

export function toTitleCase(name: string): string;
export function toTitleCase(name: string, allUpper: boolean): string;
export function toTitleCase(name: string, allUpper = false) {
  const res = startCase(name);
  return allUpper ? res : capitalize(res);
}

export function getInitials(fullName?: string): string {
  if (!fullName) return '';

  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length === 0) return '';

  const firstInitial = nameParts[0].charAt(0).toUpperCase();
  if (nameParts.length === 1) return firstInitial;

  const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
  return firstInitial + lastInitial;
}
