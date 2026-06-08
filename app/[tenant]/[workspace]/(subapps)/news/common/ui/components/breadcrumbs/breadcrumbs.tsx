'use client';

import React from 'react';

// ---- CORE IMPORTS ---- //
import {
  Breadcrumb as ShadCnBreadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components/breadcrumb';
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {Skeleton} from '@/ui/components';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import {NEWS} from '@/subapps/news/common/constants';

type BreadcrumbItem = {
  id: number;
  title: string;
  slug: string;
};

export const Breadcrumbs = ({
  items,
  title,
}: {
  items: BreadcrumbItem[];
  title: string;
}) => {
  const {workspaceURI} = useWorkspace();

  const generateRoute = (index: number) => {
    return items
      .map(item => item.slug)
      .slice(0, index + 1)
      .join('/');
  };

  return (
    <>
      <ShadCnBreadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href={withBasePath(`${workspaceURI}/news`)}
              className="text-xs font-normal text-stone-400">
              {i18n.t(NEWS)}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-black" />
          {items?.map((item, i) => {
            return (
              <React.Fragment key={item.id}>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href={withBasePath(
                      `${workspaceURI}/news/${generateRoute(i)}`,
                    )}
                    className="text-xs font-normal text-stone-400">
                    {item.title}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-black" />
              </React.Fragment>
            );
          })}
          <BreadcrumbItem>
            <BreadcrumbPage className="text-xs font-normal text-black">
              {title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </ShadCnBreadcrumb>
    </>
  );
};

export const BreadcrumbsSkeleton = ({levels = 3}: {levels?: number}) => {
  return (
    <div className="flex items-center gap-2">
      {[...Array(levels)].map((_, index) => (
        <React.Fragment key={index}>
          <Skeleton
            className={`h-3 ${index === levels - 1 ? 'w-48' : 'w-20'} rounded bg-white`}
          />
          {index !== levels - 1 && (
            <BreadcrumbSeparator className="text-white/40" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs;
