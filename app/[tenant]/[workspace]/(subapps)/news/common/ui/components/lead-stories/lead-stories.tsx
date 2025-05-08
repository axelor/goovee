'use client';

import React from 'react';
import Link from 'next/link';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {formatRelativeTime} from '@/locale/formatters';
import {BadgeList, Skeleton} from '@/ui/components';
import {NO_IMAGE_URL, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';

export const LeadStories = ({
  title,
  news,
  navigatingPathFrom,
}: {
  title?: string;
  news?: any[];
  navigatingPathFrom: string;
}) => {
  const {workspaceURI, workspaceURL} = useWorkspace();

  return (
    <div className="flex flex-col gap-6">
      {title && <div className="font-semibold text-xl">{title}</div>}
      <div className="grid gap-5 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <div className="col-span-2">
          {news
            ?.slice(0, 1)
            .map(
              ({
                id,
                title,
                image,
                categorySet,
                description,
                publicationDateTime,
                slug,
              }) => (
                <Link
                  key={id}
                  href={`${workspaceURL}/${navigatingPathFrom}/${SUBAPP_PAGE.article}/${slug}`}
                  className={`relative lg:h-full p-4 bg-no-repeat bg-center bg-cover flex flex-col rounded-lg cursor-pointer`}
                  style={{
                    backgroundImage: image?.id
                      ? `url(${workspaceURI}/${SUBAPP_CODES.news}/api/news/${slug}/image/?isFullView=true)`
                      : `url(${NO_IMAGE_URL})`,
                    height: '100%',
                  }}>
                  <div
                    className="absolute inset-0 rounded-md"
                    style={{
                      background: `linear-gradient(76deg, rgba(0, 0, 0, 0.40) 1.1%, rgba(0, 0, 0, 0.08) 100%)`,
                    }}></div>
                  <div className="flex gap-2 z-10 h-[172px]">
                    <BadgeList
                      items={categorySet}
                      rootClassName="z-10"
                      labelClassName="rounded font-normal text-[8px] h-max"
                    />
                  </div>
                  <div className="flex flex-col flex-1 justify-between gap-2 text-white z-10">
                    <div className="flex flex-col justify-between flex-1">
                      <div className="font-semibold text-base line-clamp-3 h-[72px]">
                        {title}
                      </div>
                      <div className="font-medium text-xs line-clamp-3">
                        {description}
                      </div>
                    </div>
                    <div className="font-medium text-[10px]">
                      {formatRelativeTime(publicationDateTime)}
                    </div>
                  </div>
                </Link>
              ),
            )}
        </div>

        {news
          ?.slice(1, 3)
          .map(
            ({
              id,
              title,
              image,
              categorySet,
              description,
              publicationDateTime,
              slug,
            }) => (
              <Link
                key={id}
                href={`${workspaceURL}/${navigatingPathFrom}/${SUBAPP_PAGE.article}/${slug}`}
                className="flex flex-col col-span-2 md:col-span-1 cursor-pointer">
                <div
                  className="w-full h-[150px] bg-no-repeat bg-center bg-cover rounded-t-lg"
                  style={{
                    backgroundImage: image?.id
                      ? `url(${workspaceURI}/${SUBAPP_CODES.news}/api/news/${slug}/image/?isFullView=true)`
                      : `url(${NO_IMAGE_URL})`,
                  }}
                />
                <div className="bg-white px-4 py-2 rounded-b-lg flex flex-col flex-1">
                  <BadgeList
                    items={categorySet}
                    rootClassName="z-10"
                    labelClassName="rounded font-normal text-[8px] h-max"
                  />
                  <div className="flex-1 flex flex-col gap-2 mt-1">
                    <div className="font-semibold text-base line-clamp-3 h-[72px]">
                      {title}
                    </div>
                    <div className="font-medium text-xs line-clamp-3">
                      {description}
                    </div>
                    <div className="flex-1 content-end font-medium text-[10px] mt-1 text-zinc-500">
                      {formatRelativeTime(publicationDateTime)}
                    </div>
                  </div>
                </div>
              </Link>
            ),
          )}
      </div>
    </div>
  );
};

export function LeadStoriesSkeleton() {
  return (
    <div className="flex flex-col gap-6 mt-6">
      <Skeleton className="h-6 w-32" />

      <div className="grid gap-5 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <div className="col-span-2 h-[21.563rem] relative flex flex-col p-4 rounded-lg bg-muted">
          <div className="z-10 flex flex-col justify-between h-full text-white gap-2">
            <div className="flex gap-2 mb-2">
              <Skeleton className="h-3 w-10 rounded-full bg-white/40" />
              <Skeleton className="h-3 w-8 rounded-full bg-white/40" />
            </div>
            <div className="flex-1 flex flex-col justify-between gap-2">
              <Skeleton className="h-4 w-3/4 bg-white/60" />
              <Skeleton className="h-4 w-2/3 bg-white/50" />
            </div>
            <Skeleton className="h-3 w-1/4 bg-white/40" />
          </div>
        </div>

        {[1, 2].map(i => (
          <div key={i} className="flex flex-col col-span-2 md:col-span-1">
            <Skeleton className="w-full h-[150px] rounded-t-lg" />

            <div className="bg-white px-4 py-2 rounded-b-lg flex flex-col flex-1">
              <div className="flex gap-2 mb-1">
                <Skeleton className="h-3 w-10 rounded-full" />
                <Skeleton className="h-3 w-8 rounded-full" />
              </div>

              <div className="flex-1 flex flex-col gap-2 mt-1">
                <div className="h-[4.5rem]">
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />

                <div className="flex-1" />
                <Skeleton className="h-3 w-1/4 mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LeadStories;
