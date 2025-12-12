import {ArrowRight} from 'lucide-react';
import Link from 'next/link';
import {Suspense} from 'react';

import {DEFAULT_LOGO_URL, IMAGE_URL, ORDER_BY, SUBAPP_CODES} from '@/constants';
import {parseCommentContent} from '@/lib/core/comments';
import {t} from '@/lib/core/locale/server';
import type {Tenant} from '@/lib/core/tenant';
import {PortalWorkspace, User} from '@/types';
import {BigNewsCard} from '@/ui/components/big-news-card';
import {Card, CardContent, CardHeader, CardTitle} from '@/ui/components/card';
import {Carousel} from '@/ui/components/carousel';
import {HeroSearch} from '@/ui/components/hero-search';
import {Icon} from '@/ui/components/icon';
import {InnerHTML} from '@/ui/components/inner-html';
import {Skeleton} from '@/ui/components/skeleton/skeleton';
import {getFileTypeIcon, getIconColor} from '@/utils/files';
import {BadgeList} from '@/ui/components/badge-list';
import {clone} from '@/utils';

import {EVENT_TYPE} from './(subapps)/events/common/constants';
import {findEvents} from './(subapps)/events/common/orm/event';
import {findRecentlyActivePosts} from './(subapps)/forum/common/orm/forum';
import type {RecentlyActivePost} from './(subapps)/forum/common/types/forum';
import {findHomePageHeaderNews} from './(subapps)/news/common/orm/news';
import {fetchLatestFiles} from './(subapps)/resources/common/orm/dms';
import {DynamicIcon} from './(subapps)/resources/common/ui/components/dynamic-icon';
import {DateDisplay} from './client';

export async function Home({
  tenant,
  user,
  workspace,
  workspaceURI,
  apps,
}: {
  tenant: Tenant['id'];
  user: User | undefined;
  workspace: PortalWorkspace;
  workspaceURI: string;
  apps: any[];
}) {
  const imageURL = workspace.config?.homepageHeroBgImage?.id
    ? `${workspaceURI}/api/home/hero/background`
    : IMAGE_URL;

  const logoId = workspace.logo?.id || workspace.config?.company?.logo?.id;
  const logoURL = logoId
    ? `${workspaceURI}/api/workspace/logo/image`
    : DEFAULT_LOGO_URL;

  const showNews =
    workspace.config?.isHomepageDisplayNews &&
    apps.some(app => app.code === SUBAPP_CODES.news);

  const showEvents =
    workspace.config?.isHomepageDisplayEvents &&
    apps.some(app => app.code === SUBAPP_CODES.events);

  const showForum =
    workspace.config?.isHomepageDisplayMessage &&
    apps.some(app => app.code === SUBAPP_CODES.forum);

  const showResources =
    workspace.config?.isHomepageDisplayResources &&
    apps.some(app => app.code === SUBAPP_CODES.resources);

  const hasContents = showEvents || showForum || showResources;

  return (
    <div>
      <HeroSearch
        title={workspace.config?.homepageHeroTitle || (await t('app-home'))}
        description={
          workspace.config?.homepageHeroDescription ||
          (await t(
            'Mi eget leo viverra cras pharetra enim viverra. Ac at non pretium etiam viverra. Ac at non pretium etiam',
          ))
        }
        background={
          workspace.config?.homepageHeroOverlayColorSelect || 'default'
        }
        blendMode={
          workspace.config?.homepageHeroOverlayColorSelect
            ? 'overlay'
            : 'normal'
        }
        groupImg={logoURL}
        groupImgClassName="object-contain"
        groupClassName="w-24 aspect-[2/1] mb-2"
        image={imageURL}
      />

      <div className="container my-6 space-y-6 mx-auto">
        {showNews && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold text-xl">
                {await t('Latest news')}
              </h2>
              <Link
                href={`${workspaceURI}/${SUBAPP_CODES.news}`}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                {await t('View all')} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <Suspense fallback={<NewsSkeleton />}>
              <LatestNews
                workspace={workspace}
                tenant={tenant}
                user={user}
                workspaceURI={workspaceURI}
              />
            </Suspense>
          </div>
        )}

        {hasContents && (
          <>
            <h2 className="font-semibold text-xl">
              {await t('Latest contents')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {showEvents && (
                <Suspense fallback={<ContentCardSkeleton />}>
                  <EventsCard
                    workspace={workspace}
                    tenant={tenant}
                    user={user}
                    workspaceURI={workspaceURI}
                  />
                </Suspense>
              )}
              {showForum && (
                <Suspense fallback={<ContentCardSkeleton />}>
                  <ForumCard
                    workspace={workspace}
                    tenant={tenant}
                    user={user}
                    workspaceURI={workspaceURI}
                  />
                </Suspense>
              )}

              {showResources && (
                <Suspense fallback={<ContentCardSkeleton />}>
                  <ResourcesCard
                    workspace={workspace}
                    tenant={tenant}
                    user={user}
                    workspaceURI={workspaceURI}
                  />
                </Suspense>
              )}
            </div>
          </>
        )}
      </div>

      <div className="lg:hidden h-20" />
    </div>
  );
}

async function LatestNews({
  workspace,
  tenant,
  user,
  workspaceURI,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  user: User | undefined;
  workspaceURI: string;
}) {
  const {news} = await findHomePageHeaderNews({
    workspace,
    tenant,
    user,
    limit: 5,
  });

  if (!news?.length)
    return (
      <h2 className="text-xl font-semibold">{await t('No news available.')}</h2>
    );

  return (
    <Carousel
      pagination={false}
      className="overflow-visible pb-2"
      slideClassName="!h-auto [&>*]:h-full"
      breakpoints={{0: {slidesPerView: 1}, 768: {slidesPerView: 3}}}>
      {news.map(
        ({
          id,
          title,
          image,
          categorySet,
          description,
          publicationDateTime,
          slug,
        }: any) => (
          <BigNewsCard
            key={id}
            navigatingPathFrom={SUBAPP_CODES.news}
            slug={slug}
            image={image}
            workspaceURI={workspaceURI}
            categorySet={categorySet}
            title={title}
            description={description}
            publicationDateTime={publicationDateTime}
          />
        ),
      )}
    </Carousel>
  );
}

async function EventsCard({
  workspace,
  tenant,
  user,
  workspaceURI,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  user: User | undefined;
  workspaceURI: string;
}) {
  const {events} = await findEvents({
    limit: 3,
    eventType: EVENT_TYPE.ACTIVE,
    workspace,
    tenantId: tenant,
    user,
    orderBy: {eventStartDateTime: ORDER_BY.ASC},
  });

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Icon name="event" className="h-5 w-5 text-primary" />
          {await t('Events')}
        </CardTitle>
        {events?.length > 0 && (
          <Link
            href={`${workspaceURI}/${SUBAPP_CODES.events}`}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
            {await t('View all')} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {events && events.length > 0 ? (
          events.map((event: any) => (
            <Link
              key={event.id}
              href={`${workspaceURI}/${SUBAPP_CODES.events}/${event.slug}`}
              className="block group">
              <div className="flex flex-col space-y-1 rounded-md border p-3 hover:bg-muted/50 transition-colors">
                <span className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                  {event.eventTitle}
                </span>
                <div className="flex justify-between text-xs text-muted-foreground text-right">
                  <BadgeList items={clone(event.eventCategorySet)} />
                  <Suspense>
                    <DateDisplay date={event.eventStartDateTime} />
                  </Suspense>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            {await t('No upcoming events')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function ForumCard({
  workspace,
  tenant,
  user,
  workspaceURI,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  user: User | undefined;
  workspaceURI: string;
}) {
  const forumPosts = await findRecentlyActivePosts({
    workspaceID: workspace.id,
    tenantId: tenant,
    user,
    limit: 3,
  });

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Icon name="forum" className="h-5 w-5 text-primary" />
          {await t('Forum')}
        </CardTitle>
        {forumPosts?.length > 0 && (
          <Link
            href={`${workspaceURI}/${SUBAPP_CODES.forum}`}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
            {await t('View all')} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {forumPosts && forumPosts.length > 0 ? (
          forumPosts.map((post: RecentlyActivePost) => {
            const note = parseCommentContent(post.comment.note);
            if (typeof note !== 'string') return null;
            return (
              <Link
                key={post.id}
                href={`${workspaceURI}/${SUBAPP_CODES.forum}`}
                className="block group">
                <div className="flex flex-col space-y-1 rounded-md border p-3 hover:bg-muted/50 transition-colors">
                  <InnerHTML
                    content={note}
                    className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2"
                  />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <div>
                      {t('by')}{' '}
                      <span className="font-medium truncate">
                        {post.comment.partner
                          ? (post.comment.partner.simpleFullName ??
                            post.comment.partner.name)
                          : post.comment.createdBy?.fullName}
                      </span>{' '}
                    </div>
                    <Suspense>
                      <DateDisplay date={post.comment.createdOn} />
                    </Suspense>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground line-clamp-1">
                    <span className="font-medium truncate">{post.title}</span>
                  </div>
                </div>{' '}
              </Link>
            );
          })
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            {await t('No recent discussions')}
          </div>
        )}{' '}
      </CardContent>
    </Card>
  );
}

async function ResourcesCard({
  workspace,
  tenant,
  user,
  workspaceURI,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  user: User | undefined;
  workspaceURI: string;
}) {
  const files = await fetchLatestFiles({
    take: 5,
    workspace,
    tenantId: tenant,
    user,
  });

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Icon name="resource" className="h-5 w-5 text-primary" />
          {await t('Resources')}
        </CardTitle>
        {files?.length > 0 && (
          <Link
            href={`${workspaceURI}/${SUBAPP_CODES.resources}`}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
            {await t('View all')} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {files && files.length > 0 ? (
          files.map(file => {
            const icon = getFileTypeIcon(file.metaFile?.fileType);
            const iconColor = getIconColor(icon);
            return (
              <Link
                key={file.id}
                href={`${workspaceURI}/${SUBAPP_CODES.resources}/${file.id}`}
                className="block group rounded-md border p-3 hover:bg-muted/50 transition-colors">
                <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
                  <DynamicIcon
                    icon={icon}
                    className={'h-6 w-6 shrink-0'}
                    {...(iconColor
                      ? {
                          style: {
                            color: iconColor,
                          },
                        }
                      : {})}
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                        {file.fileName}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                      {file.metaFile?.sizeText && (
                        <p className="line-clamp-1">{file.metaFile.sizeText}</p>
                      )}
                      {file.metaFile?.createdOn && (
                        <span className="line-clamp-1 ms-auto">
                          <DateDisplay date={file.metaFile.createdOn} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            {await t('No recent resources')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function NewsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-48" /> {/* Title "Latest news" */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ContentCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="flex flex-col space-y-2 rounded-md border p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
