'use client';

import {endOfDay, isPast, isToday} from 'date-fns';
import type {Cloned} from '@/types/util';
import {useEffect, useMemo, useState} from 'react';
import {
  MdOutlineKeyboardArrowUp,
  MdOutlineKeyboardArrowDown,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {RESPONSIVE_SIZES, SUBAPP_CODES, URL_PARAMS} from '@/constants';
import {i18n} from '@/locale';
import {PortalWorkspace} from '@/orm/workspace';
import {Checkbox, Pagination} from '@/ui/components';
import {useResponsive, useSearchParams} from '@/ui/hooks';
import {convertDateToISO8601} from '@/utils/date';
import type {PageInfo} from '@/types';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {
  CATEGORIES,
  EVENT_TAB_ITEMS,
  EVENT_TYPE,
} from '@/subapps/events/common/constants';
import type {Category, ListEvent} from '@/subapps/events/common/ui/components';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/ui/components';
import {
  EventCard,
  EventCardSkeleton,
  Calendar,
  TabsList,
} from '@/subapps/events/common/ui/components';
import {getTabItems} from '@/subapps/events/common/utils';
import {cn} from '@/utils/css';
import {Skeleton} from '@/ui/components/skeleton';

type TabItem = (typeof EVENT_TAB_ITEMS)[number];
export const EventCalendar = ({
  dateOfEvent,
  workspace,
  onlyRegisteredEvent,
  tabs,
}: {
  dateOfEvent: string;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  onlyRegisteredEvent?: boolean;
  tabs: {id: string; title: string; label: string}[];
}) => {
  const [date, setDate] = useState<Date | undefined>(
    dateOfEvent ? new Date(dateOfEvent) : undefined,
  );
  const {update} = useSearchParams();

  const updateDate = (d: Date | undefined) => {
    const newDate = d ? new Date(d) : undefined;
    setDate(newDate);
    const toUpdate = [
      {key: 'page', value: 1},
      {key: 'date', value: convertDateToISO8601(d) || ''},
    ];
    if (newDate) {
      toUpdate.push({
        key: 'type',
        value: isPast(endOfDay(newDate))
          ? EVENT_TYPE.PAST
          : tabs.find(t => t.label === EVENT_TYPE.ACTIVE)
            ? EVENT_TYPE.ACTIVE
            : isToday(newDate)
              ? EVENT_TYPE.ONGOING
              : EVENT_TYPE.UPCOMING,
      });
    }
    update(toUpdate, {scroll: false});
  };

  return (
    <Calendar
      workspace={workspace}
      date={date}
      mode="single"
      selected={date}
      onSelect={updateDate}
      className="flex justify-center mx-auto w-full md:flex-1"
      onlyRegisteredEvent={!!onlyRegisteredEvent}
    />
  );
};

export function EventTabs({
  eventType,
  tabs,
  children,
}: {
  eventType: string;
  tabs: {id: string; title: string; label: string}[];
  children: React.ReactNode;
}) {
  const res = useResponsive();
  const large = ['md', 'lg', 'xl', 'xxl'].some(x => res[x as keyof typeof res]);
  const {update} = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabItem>(
    () => tabs.find(t => t.label === eventType)!,
  );

  const TAB_ITEMS = useMemo(() => getTabItems(tabs, large), [tabs, large]);

  const handleTabChange = (t: TabItem) => {
    setActiveTab(t);
    update([
      {key: 'type', value: t.label},
      {key: 'page', value: null},
    ]);
  };

  useEffect(() => {
    setActiveTab(tabs.find(t => t.label === eventType)!);
  }, [eventType, tabs]);
  return (
    <TabsList
      activeTab={activeTab.id}
      items={TAB_ITEMS}
      onTabChange={handleTabChange}
      controlled>
      {activeTab.label === eventType ? children : <EventCardSkeleton />}
    </TabsList>
  );
}

export function EventTabsContent({
  pageInfo: {page, pages, hasPrev, hasNext} = {} as PageInfo,
  events,
}: {
  pageInfo: PageInfo;
  events: ListEvent[];
}) {
  const {workspaceURI} = useWorkspace();
  const {update} = useSearchParams();
  const handlePreviousPage = () => {
    if (!hasPrev) return;
    update([{key: URL_PARAMS.page, value: Math.max(Number(page) - 1, 1)}]);
  };

  const handleNextPage = () => {
    if (!hasNext) return;
    update([{key: URL_PARAMS.page, value: Number(page) + 1}]);
  };

  const handlePage = (page: string | number) => {
    update([{key: URL_PARAMS.page, value: page}]);
  };
  return (
    <div className="flex flex-col space-y-4 w-full">
      {events.length ? (
        events.map((event, i) => (
          <Link
            href={`${workspaceURI}/${SUBAPP_CODES.events}/${event.slug}`}
            key={event.slug}
            passHref>
            <EventCard event={event} key={event.id} />
          </Link>
        ))
      ) : (
        <>
          <h5 className="text-lg font-bold">{i18n.t('No events')}</h5>
          <p>{i18n.t('There are no events')}</p>
        </>
      )}
      <div className="w-full mt-10 flex items-center justify-center ml-auto">
        {pages > 1 && (
          <Pagination
            page={page}
            pages={pages}
            disablePrev={!hasPrev}
            disableNext={!hasNext}
            onPrev={handlePreviousPage}
            onNext={handleNextPage}
            onPage={handlePage}
          />
        )}
      </div>
    </div>
  );
}

export function EventCollapsible({children}: {children: React.ReactNode}) {
  const res = useResponsive();
  const small = RESPONSIVE_SIZES.some(x => res[x]);

  const [isOpen, setIsOpen] = useState<boolean>(!small);
  return (
    <div className="flex-1 flex flex-col space-y-2">
      <div className="flex flex-col space-y-2 md:flex-1">
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="w-full space-y-4">
          <div className="w-full flex items-center justify-between space-x-4 px-4 cursor-pointer">
            <CollapsibleTrigger asChild>
              <div className="w-full flex justify-between items-center">
                <h2 className="text-[18px] font-semibold">
                  {i18n.t(CATEGORIES)}
                </h2>
                {isOpen ? (
                  <MdOutlineKeyboardArrowUp className="h-4 w-4" />
                ) : (
                  <MdOutlineKeyboardArrowDown className="h-4 w-4" />
                )}
              </div>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-4 mx-4">
            {children}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

export const EventCategoryList = ({
  categories,
  selectedCategories = [],
}: {
  categories: Category[];
  selectedCategories?: string[];
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<string[]>(selectedCategories);
  const {update} = useSearchParams();

  const updateCateg = (category: Category) => {
    const updatedCategories = selectedCategory.some(
      (c: string) => c === category.id,
    )
      ? selectedCategory.filter((i: string) => i !== category.id)
      : [...selectedCategory, category.id];
    update(
      [
        {key: 'category', value: updatedCategories},
        {key: 'page', value: 1},
      ],
      {scroll: false},
    );

    setSelectedCategory(updatedCategories);
  };

  return categories.map((category: Category) => {
    const isActive = selectedCategories.includes(category.id);
    const isPending = isActive != selectedCategory.includes(category.id);

    return (
      <div className="flex items-center space-x-4" key={category.id}>
        <Checkbox
          id={category.id}
          checked={isActive}
          className={cn(
            isActive
              ? `border-none ${category?.color ? `!bg-palette-${category.color}-dark` : 'bg-black'}`
              : '',
            isPending && 'ring-2 animate-pulse',
            !isActive && isPending && 'ring-blue-500',
          )}
          onCheckedChange={() => updateCateg(category)}
        />
        <label
          htmlFor={category.id}
          className="text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {category.name}
        </label>
      </div>
    );
  });
};

export function EventCategorySkeleton() {
  return (
    <div className="flex items-center space-x-4">
      {/* Checkbox placeholder */}
      <Skeleton className="h-4 w-4 rounded" />

      {/* Label placeholder */}
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
