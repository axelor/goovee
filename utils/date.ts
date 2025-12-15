// ---- CORE IMPORTS ---- //
import {DATE_FORMATS} from '@/constants';
import {dayjs} from '@/locale';

export function formatDateToISOString(mdate: any) {
  return dayjs(mdate).utc().format(DATE_FORMATS.iso_8601_utc_timestamp);
}

export const convertDateToISO8601 = (date: Date | undefined) => {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const dateIsExist = (dateToCheck: Date, datesArray: Date[]) => {
  const formattedDateToCheck = new Date(dateToCheck).toISOString();

  for (let date of datesArray) {
    const formattedDate = new Date(date).toISOString();
    if (formattedDate === formattedDateToCheck) {
      return true;
    }
  }

  return false;
};

export function formatToTwoDigits(val: String | number) {
  return String(val).padStart(2, '0');
}
