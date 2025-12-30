'use client';

import * as React from 'react';

import {ChevronLeft, ChevronRight} from 'lucide-react';
import {DayPicker} from 'react-day-picker';
import {MdOutlineArrowDropDown} from 'react-icons/md';
import {addMonths, subMonths} from 'date-fns';
import {authClient} from '@/lib/auth-client';

// ---- CORE IMPORTS ---- //
import {cn} from '@/utils/css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  buttonVariants,
} from '@/ui/components';
import {dateIsExist} from '@/utils/date';
import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import {getAllEvents} from '@/subapps/events/common/actions/actions';
import {CalendarProps} from '@/subapps/events/common/ui/components/calendar/types';
import styles from '@/subapps/events/common/ui/components/calendar/calendar.module.css';
import {datesBetweenTwoDates} from '@/subapps/events/common/utils';

const months = Array.from({length: 12}, (_, i) =>
  new Date(0, i).toLocaleString('en-US', {month: 'long'}),
);

const CustomCaptionLayout: React.FC<{
  date: Date | undefined;
  fromDate: Date;
  toDate: Date;
  onChange: (date: Date) => void;
  nextMonth: () => void;
  prevMonth: () => void;
}> = ({date, fromDate, toDate, onChange, nextMonth, prevMonth}) => {
  const selectedYear = date?.getFullYear();
  const selectedMonth = date?.getMonth();
  const [newYear, setNewYear] = React.useState<number | undefined>(undefined);
  const years = Array.from(
    {length: toDate.getFullYear() - fromDate.getFullYear() + 1},
    (_, i) => fromDate.getFullYear() + i,
  );

  const selectYear = (year: number) => {
    setNewYear(year);
  };

  const selectMonth = (monthIndex: number) => {
    if (newYear !== undefined) {
      const newDate = new Date(newYear, monthIndex);
      if (newDate >= fromDate && newDate <= toDate) {
        onChange(new Date(newYear, monthIndex));
        setNewYear(undefined);
      }
    }
  };

  const isMonthSelectable = (year: number, month: number) => {
    const date = new Date(year, month);
    return date >= fromDate && date <= toDate;
  };

  const isPrevButtonDisabled = date
    ? new Date(date.getFullYear(), date.getMonth()) <=
      new Date(fromDate.getFullYear(), fromDate.getMonth())
    : false;
  const isNextButtonDisabled = date
    ? new Date(date.getFullYear(), date.getMonth()) >=
      new Date(toDate.getFullYear(), toDate.getMonth())
    : false;

  return (
    <div className="flex items-center justify-between h-10 px-4 xs:px-0">
      <button
        onClick={() => !isPrevButtonDisabled && prevMonth()}
        className={
          isPrevButtonDisabled
            ? 'text-grey-1 dark:text-grey-3 cursor-default'
            : ''
        }
        disabled={isPrevButtonDisabled}>
        <ChevronLeft />
      </button>
      <div className="relative">
        <DropdownMenu onOpenChange={() => setNewYear(undefined)}>
          <DropdownMenuTrigger>
            <p className="font-semibold text-main-black dark:text-grey-1 leading-8 flex items-center gap-x-2">
              {selectedMonth !== undefined && selectedYear !== undefined && (
                <>
                  {i18n.t(months[selectedMonth])} {selectedYear}
                </>
              )}
              <MdOutlineArrowDropDown />
            </p>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="z-50 p-0 bg-white dark:bg-slate-950 min-w-full">
            {newYear == undefined ? (
              <div className="px-4 py-2 gap-x-4 flex items-center">
                {years.map(year => (
                  <div
                    key={year}
                    onClick={() => selectYear(year)}
                    className={`font-semibold  py-2 px-6 text-sm cursor-pointer`}>
                    {year}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 py-2 px-4 xs:gap-x-4 gap-x-2 gap-y-4">
                {months.map((month, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() =>
                      isMonthSelectable(newYear, index) && selectMonth(index)
                    }
                    className={`font-semibold mx-auto text-sm cursor-pointer py-2 w-fit ${isMonthSelectable(newYear, index) ? '' : 'cursor-default text-grey-1 dark:text-grey-3'}`}>
                    {i18n.t(month)}
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <button
        onClick={() => !isNextButtonDisabled && nextMonth()}
        className={
          isNextButtonDisabled
            ? 'text-grey-1 dark:text-grey-3 cursor-default'
            : ''
        }
        disabled={isNextButtonDisabled}>
        <ChevronRight />
      </button>
    </div>
  );
};

export function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  date,
  workspace,
  onlyRegisteredEvent,
  ...props
}: CalendarProps & {
  date: Date | undefined;
  workspace: any;
  onlyRegisteredEvent: boolean;
}) {
  const [eventDates, setEventDates] = React.useState<Date[]>([]);

  const {data: session} = authClient.useSession();
  const {user} = session || {};

  const today = date !== undefined ? new Date(date) : new Date();

  const isSaturday = (date: Date) => date.getDay() === 6;
  const isSunday = (date: Date) => date.getDay() === 0;

  const modifiersClassNames = {
    booked: styles.booked,
    selected:
      date && dateIsExist(date, eventDates)
        ? `${styles.booked} ${styles.selected}`
        : styles.noEvent,
    saturday: styles['weekend-days'],
    sunday: styles['weekend-days'],
    today: styles.today,
  };

  const fromMonth = new Date(today.getFullYear() - 1, today.getMonth());
  const toMonth = new Date(today.getFullYear() + 1, today.getMonth());

  const [month, setMonth] = React.useState(today);

  const formatWeekdayName = (date: Date) => {
    const daysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return daysShort[date.getDay()];
  };

  const formatters = {
    formatWeekdayName: formatWeekdayName,
  };

  const modifiers = {
    booked: eventDates,
    selected: date ? [date] : [],
    saturday: isSaturday,
    sunday: isSunday,
    today: new Date(),
  };

  const nextMonth = () => {
    if (month < toMonth) {
      setMonth(prevMonth => addMonths(prevMonth, 1));
    }
  };

  const prevMonth = () => {
    const currentMonth = new Date(month).getMonth();
    const currentYear = new Date(month).getFullYear();

    if (
      currentYear > fromMonth.getFullYear() ||
      (currentYear === fromMonth.getFullYear() &&
        currentMonth > fromMonth.getMonth())
    ) {
      setMonth(prevMonth => subMonths(prevMonth, 1));
    }
  };

  const handleDateChange = (newDate: Date) => {
    setMonth(newDate);
  };

  React.useEffect(() => {
    const fetchEventDates = async () => {
      try {
        const {events: data}: any = await getAllEvents({
          month: month.getMonth() + 1,
          year: month.getFullYear(),
          workspace,
          user,
          onlyRegisteredEvent,
        });
        const allDates = datesBetweenTwoDates(data);

        setEventDates(allDates);
      } catch (error) {
        console.log(error);
      }
    };
    fetchEventDates();
  }, [month, workspace, user]);

  return (
    <DayPicker
      weekStartsOn={1}
      formatters={formatters}
      fromMonth={fromMonth}
      toMonth={toMonth}
      modifiers={modifiers}
      modifiersClassNames={modifiersClassNames}
      month={month}
      onMonthChange={setMonth}
      showOutsideDays={false}
      className={cn(' ', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center ',
        caption_label:
          'text-base font-semibold text-main-black dark:text-grey-1  leading-8',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({variant: 'outline'}),
          'h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 border-none',
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row:
          'border-b-[0.125rem] border-grey-8 px-[0.4rem] items-center justify-center flex ',
        head_cell:
          'text-main-black rounded-md w-12 h-8 px-[1.06rem] py-1 font-semibold w-full weekend-label dark:text-slate-400 dark:weekend-label  text-[0.93rem] ',
        row: 'flex items-center justify-center px-[0.4rem] w-full mt-2',
        cell: 'h-12  w-12 text-center text-[0.93rem] rounded-md text-main-black dark:text-slate-400 leading-6 font-normal p-0 flex item-center justify-center relative  ',
        day: cn(
          buttonVariants({variant: 'ghost'}),
          'h-12 w-12 px-5 py-2 text-center flex items-center cursor-default justify-center text-[0.93rem] font-normal aria-selected:opacity-100 hover:bg-transparent dark:hover:bg-transparent dark:text-slate-400 dark:hover:text-slate-400',
        ),
        day_range_end: 'day-range-end ',
        day_selected: cn(
          'bg-slate-900 hover:bg-slate-900 hover:text-white focus:bg-slate-900 focus:text-slate-200 dark:bg-slate-200 dark:hover:bg-slate-400 dark:hover:text-black dark:focus:bg-slate-300 dark:focus:text-black',
          styles['forced-white'],
          styles['forced-black'],
        ),
        day_today: '',
        day_outside:
          'day-outside text-slate-500 opacity-50 aria-selected:bg-slate-100/50 aria-selected:text-slate-500 aria-selected:opacity-30 dark:text-slate-400 dark:aria-selected:bg-slate-800/50 dark:aria-selected:text-slate-400',
        day_disabled: 'text-slate-500 opacity-50 dark:text-slate-400',
        day_range_middle:
          'aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Caption: props => (
          <CustomCaptionLayout
            date={month}
            fromDate={fromMonth}
            toDate={toMonth}
            onChange={handleDateChange}
            nextMonth={nextMonth}
            prevMonth={prevMonth}
          />
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';
