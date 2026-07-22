import {ArrowRight} from 'lucide-react';
import type {Cloned} from '@/types/util';
import {Suspense} from 'react';
import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {NO_IMAGE_URL, ORDER_BY, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {parseCommentContent} from '@/lib/core/comments';
import {t} from '@/lib/core/locale/server';
import type {User} from '@/types';
import type {Workspace} from '@/orm/workspace';
import type {Client} from '@/goovee/.generated/client';
import {Icon} from '@/ui/components/icon';
import {InnerHTML} from '@/ui/components/inner-html';
import {Skeleton} from '@/ui/components/skeleton/skeleton';
import {FileIcon} from '@/ui/components/file-icon';
import {cn} from '@/utils/css';
import {withBasePath} from '@/lib/core/path/base-path';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ----//
import type {ShellConfig} from './orm/config';
import {EVENT_TYPE} from './(subapps)/events/common/constants';
import {findEvents} from './(subapps)/events/common/orm/event';
import {findRecentlyActivePosts} from './(subapps)/forum/common/orm/forum';
import type {RecentlyActivePost} from './(subapps)/forum/common/types/forum';
import {findHomePageHeaderNews} from './(subapps)/news/common/orm/news';
import {fetchLatestFiles} from './(subapps)/resources/common/orm/dms';
import {DateDisplay} from './client';

// Types derived from the finders that feed the home page (source of truth).
type HomeApps = Awaited<
  ReturnType<typeof import('@/orm/workspace').findSubapps>
>;
type HeroArticle = NonNullable<
  Awaited<ReturnType<typeof findHomePageHeaderNews>>['news']
>[number];

export async function Home({
  client,
  user,
  workspace,
  config,
  workspaceURI,
  apps,
}: {
  client: Client;
  user: User | undefined;
  workspace: Workspace | Cloned<Workspace>;
  config: ShellConfig | Cloned<ShellConfig>;
  workspaceURI: string;
  apps: HomeApps;
}) {
  const showNews =
    config.isHomepageDisplayNews &&
    apps.some(app => app.code === SUBAPP_CODES.news && app.isInstalled);

  const showEvents =
    config.isHomepageDisplayEvents &&
    apps.some(app => app.code === SUBAPP_CODES.events && app.isInstalled);

  const showForum =
    config.isHomepageDisplayMessage &&
    apps.some(app => app.code === SUBAPP_CODES.forum && app.isInstalled);

  const showResources =
    config.isHomepageDisplayResources &&
    apps.some(app => app.code === SUBAPP_CODES.resources && app.isInstalled);

  const hasContents = showEvents || showForum || showResources;

  const showHyperlinks =
    config.isHomepageDisplayHyperlinks &&
    (config.hyperlinkList?.length ?? 0) > 0;

  const welcomeTitle =
    config.homepageHeroTitle || (await t('Welcome to your client portal'));
  const welcomeSubtitle =
    config.homepageHeroDescription ||
    (await t('Catalogue, orders, support and events on a single portal'));

  return (
    <div className="bg-ink-25 flex flex-col flex-1 min-h-0">
      {/* Hero welcome */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--royal-dark)) 0%, hsl(var(--royal)) 100%)',
          padding: '56px 32px 64px',
        }}>
        {/* Dot grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.10) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        {/* Decorative waves */}
        <svg
          aria-hidden
          viewBox="0 0 1200 400"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full opacity-50">
          <path
            d="M0,80 Q300,260 600,200 T1200,180 L1200,400 L0,400 Z"
            fill="none"
            stroke="rgba(127,182,255,0.18)"
            strokeWidth="1.5"
          />
          <path
            d="M0,120 Q300,280 600,240 T1200,220 L1200,400 L0,400 Z"
            fill="none"
            stroke="rgba(127,182,255,0.14)"
            strokeWidth="1.5"
          />
          <path
            d="M0,160 Q300,310 600,290 T1200,260 L1200,400 L0,400 Z"
            fill="none"
            stroke="rgba(127,182,255,0.10)"
            strokeWidth="1.5"
          />
        </svg>

        <div className="relative max-w-[1280px] mx-auto flex flex-col items-center text-center">
          <div className="font-extrabold text-2xl tracking-[0.08em] text-white/85 mb-4">
            a<span className="text-royal-light">×</span>elor
          </div>
          <h1 className="m-0 text-[38px] font-extrabold tracking-[-0.025em] leading-[1.15]">
            {welcomeTitle}
          </h1>
          <p className="mt-3 text-[17px] text-white/85 max-w-2xl">
            {welcomeSubtitle}
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] w-full mx-auto px-8 py-10">
        {showNews && (
          <Suspense fallback={<NewsSkeleton />}>
            <LatestNews
              workspace={workspace}
              client={client}
              user={user}
              workspaceURI={workspaceURI}
            />
          </Suspense>
        )}

        {(hasContents || showHyperlinks) && (
          <div
            className={cn(
              'grid grid-cols-1 gap-6 mt-11',
              hasContents && showHyperlinks
                ? 'lg:grid-cols-[1fr_1fr_1fr_240px]'
                : hasContents
                  ? 'lg:grid-cols-3'
                  : '',
            )}>
            {showEvents && (
              <Suspense fallback={<ContentCardSkeleton />}>
                <EventsCard
                  workspace={workspace}
                  client={client}
                  user={user}
                  workspaceURI={workspaceURI}
                />
              </Suspense>
            )}
            {showForum && (
              <Suspense fallback={<ContentCardSkeleton />}>
                <ForumCard
                  workspace={workspace}
                  client={client}
                  user={user}
                  workspaceURI={workspaceURI}
                />
              </Suspense>
            )}
            {showResources && (
              <Suspense fallback={<ContentCardSkeleton />}>
                <ResourcesCard
                  workspace={workspace}
                  client={client}
                  user={user}
                  workspaceURI={workspaceURI}
                />
              </Suspense>
            )}
            {showHyperlinks && (
              <aside>
                <h3 className="m-0 mb-3.5 text-lg font-bold tracking-[-0.015em] text-ink-900">
                  {await t('Useful links')}
                </h3>
                <HyperlinkGrid
                  config={config}
                  workspaceURI={workspaceURI}
                  standalone={!hasContents}
                />
              </aside>
            )}
          </div>
        )}

        <div className="lg:hidden h-20" />
      </div>
    </div>
  );
}

// ---- Sub-sections ---- //

async function LatestNews({
  workspace,
  client,
  user,
  workspaceURI,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user: User | undefined;
  workspaceURI: string;
}) {
  const {news} = await findHomePageHeaderNews({
    workspace,
    client,
    user,
    limit: 3,
  });

  if (!news?.length) return null;

  return (
    <section>
      <SectionHeader
        title={await t('Latest news')}
        seeAllHref={`${workspaceURI}/${SUBAPP_CODES.news}`}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
        {news.slice(0, 3).map(article => (
          <HeroNewsCard
            key={article.id}
            article={article}
            workspaceURI={workspaceURI}
          />
        ))}
      </div>
    </section>
  );
}

function HeroNewsCard({
  article,
  workspaceURI,
}: {
  article: HeroArticle;
  workspaceURI: string;
}) {
  const {slug, image, title, description, categorySet, publicationDateTime} =
    article;
  const category = categorySet?.[0];
  const imageURL = image?.id
    ? withBasePath(
        `${workspaceURI}/${SUBAPP_CODES.news}/api/news/${slug}/image?isFullView=true`,
      )
    : withBasePath(NO_IMAGE_URL);

  return (
    <Link
      href={`${workspaceURI}/${SUBAPP_CODES.news}/${SUBAPP_PAGE.article}/${slug}`}
      className={cn(
        'group relative block rounded-[14px] overflow-hidden cursor-pointer h-[360px]',
        'border border-ink-100',
        'transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-md',
      )}>
      <Image
        src={imageURL}
        alt={image?.fileName || 'News image'}
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 420px, (min-width: 768px) 33vw, 100vw"
      />
      {category && (
        <span
          className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-md bg-royal text-white text-[11px] font-bold tracking-[0.04em]"
          style={{lineHeight: 1.4}}>
          {category.name}
        </span>
      )}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.85) 100%)',
        }}
      />
      <div className="absolute left-0 right-0 bottom-0 px-[18px] pb-[18px] text-white">
        <h3
          className="m-0 mb-2 text-lg font-bold tracking-[-0.015em] leading-snug line-clamp-2"
          style={{textShadow: '0 1px 4px rgba(0,0,0,0.4)'}}>
          {title}
        </h3>
        {description && (
          <div
            className="m-0 text-[12.5px] text-white/85 line-clamp-2"
            style={{
              lineHeight: 1.5,
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}>
            <InnerHTML content={description} />
          </div>
        )}
        {publicationDateTime && (
          <div className="mt-2.5 text-[11px] font-semibold text-white/60">
            <DateDisplay date={publicationDateTime} />
          </div>
        )}
      </div>
    </Link>
  );
}

async function EventsCard({
  workspace,
  client,
  user,
  workspaceURI,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user: User | undefined;
  workspaceURI: string;
}) {
  const {events} = await findEvents({
    limit: 3,
    eventType: EVENT_TYPE.ACTIVE,
    workspaceURL: workspace.url,
    client,
    user,
    orderBy: {eventStartDateTime: ORDER_BY.ASC},
  });

  return (
    <ContentColumn
      title={await t('Events')}
      icon="event"
      seeAllHref={`${workspaceURI}/${SUBAPP_CODES.events}`}
      emptyLabel={await t('No upcoming events')}
      hasItems={Boolean(events?.length)}>
      <ul className="flex flex-col gap-3">
        {events?.map(event => {
          const category = event.eventCategorySet?.[0];
          return (
            <li key={event.id}>
              <Link
                href={`${workspaceURI}/${SUBAPP_CODES.events}/${event.slug}`}
                className={cn(
                  'block p-3 rounded-[10px] border border-ink-100 bg-ink-25',
                  'transition-colors hover:bg-royal-pale',
                )}>
                <p className="text-sm font-bold text-ink-900 leading-snug line-clamp-1 mb-1.5">
                  {event.eventTitle}
                </p>
                <div className="flex items-center justify-between gap-2">
                  {category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-royal text-white text-[10px] font-bold tracking-[0.02em]">
                      {category.name}
                    </span>
                  )}
                  {event.eventStartDateTime && (
                    <span className="text-[11.5px] text-ink-500 tabular-nums">
                      <Suspense>
                        <DateDisplay date={event.eventStartDateTime} />
                      </Suspense>
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </ContentColumn>
  );
}

async function ForumCard({
  workspace,
  client,
  user,
  workspaceURI,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user: User | undefined;
  workspaceURI: string;
}) {
  const posts = await findRecentlyActivePosts({
    workspaceID: workspace.id,
    client,
    user,
    limit: 3,
  });
  const byLabel = await t('by');

  return (
    <ContentColumn
      title={await t('Forum')}
      icon="forum"
      seeAllHref={`${workspaceURI}/${SUBAPP_CODES.forum}`}
      emptyLabel={await t('No recent discussions')}
      hasItems={Boolean(posts?.length)}>
      <ul className="flex flex-col gap-3.5">
        {posts?.map((post: RecentlyActivePost) => {
          const note = parseCommentContent(post.comment.note);
          if (typeof note !== 'string') return null;
          const author =
            post.comment.partner?.simpleFullName ||
            post.comment.partner?.name ||
            post.comment.createdBy?.fullName ||
            '';
          return (
            <li key={post.id}>
              <Link
                href={`${workspaceURI}/${SUBAPP_CODES.forum}/${SUBAPP_PAGE.group}/${post.forumGroup.id}?searchid=${post.id}#post-${post.id}`}
                className="block group">
                <div className="text-[12.5px] text-ink-500 mb-1">
                  <strong className="text-ink-700 font-semibold">
                    {byLabel} {author}
                  </strong>{' '}
                  ·{' '}
                  <Suspense>
                    <DateDisplay date={post.comment.createdOn} />
                  </Suspense>
                </div>
                <InnerHTML
                  content={note}
                  className="text-[13.5px] font-semibold text-ink-900 leading-snug line-clamp-2 mb-1"
                />
                <div className="text-xs font-semibold text-royal line-clamp-1">
                  {post.title}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </ContentColumn>
  );
}

async function ResourcesCard({
  workspace,
  client,
  user,
  workspaceURI,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user: User | undefined;
  workspaceURI: string;
}) {
  const files = await fetchLatestFiles({
    take: 5,
    workspaceURL: workspace.url,
    client,
    user,
  });

  return (
    <ContentColumn
      title={await t('Resources')}
      icon="resource"
      seeAllHref={`${workspaceURI}/${SUBAPP_CODES.resources}`}
      emptyLabel={await t('No recent resources')}
      hasItems={Boolean(files?.length)}>
      <ul className="flex flex-col gap-2 -mx-1">
        {files?.map(file => (
          <li key={file.id}>
            <Link
              href={`${workspaceURI}/${SUBAPP_CODES.resources}/${file.id}`}
              className={cn(
                'flex items-center gap-2.5 px-2 py-2 rounded-lg',
                'transition-colors hover:bg-ink-25',
              )}>
              <FileIcon
                fileType={file.metaFile?.fileType}
                className="h-8 w-8 shrink-0 rounded-md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-ink-900 truncate">
                  {file.fileName}
                </p>
                <p className="text-[10.5px] text-ink-500 tabular-nums">
                  {file.metaFile?.sizeText || '--'}
                  {file.metaFile?.createdOn && (
                    <>
                      {' · '}
                      <Suspense>
                        <DateDisplay date={file.metaFile.createdOn} />
                      </Suspense>
                    </>
                  )}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </ContentColumn>
  );
}

function HyperlinkGrid({
  config,
  workspaceURI,
  standalone = false,
}: {
  config: ShellConfig | Cloned<ShellConfig>;
  workspaceURI: string;
  standalone?: boolean;
}) {
  const hyperlinkList = config.hyperlinkList;

  if (!hyperlinkList?.length) return null;

  return (
    <div
      className={cn(
        'grid gap-3',
        // In the narrow sidebar: two columns. Standalone (only section on the
        // page): cap each tile so the logos don't blow up to full width.
        standalone
          ? 'grid-cols-[repeat(auto-fill,minmax(96px,120px))]'
          : 'grid-cols-2',
      )}>
      {hyperlinkList.map(item => (
        <a
          key={item.id}
          href={item.link || '#'}
          title={item.title ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'aspect-square rounded-[14px] bg-white border border-ink-100',
            'grid place-items-center overflow-hidden p-3',
            'transition-transform duration-150 hover:scale-[1.04] hover:shadow-soft-md',
          )}>
          <Image
            src={withBasePath(`${workspaceURI}/api/hyperlink/${item.id}/logo`)}
            alt={`Related link`}
            width={120}
            height={120}
            className="w-full h-full object-contain"
          />
        </a>
      ))}
    </div>
  );
}

// ---- Building blocks ---- //

function SectionHeader({
  title,
  seeAllHref,
}: {
  title: string;
  seeAllHref?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-[18px]">
      <h2 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-ink-900">
        {title}
      </h2>
      {seeAllHref && <SeeAll href={seeAllHref} />}
    </div>
  );
}

async function SeeAll({href}: {href: string}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-royal hover:underline">
      {await t('View all')} <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

async function ContentColumn({
  title,
  icon,
  seeAllHref,
  emptyLabel,
  hasItems,
  children,
}: {
  title: string;
  icon: string;
  seeAllHref?: string;
  emptyLabel: string;
  hasItems: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-ink-100 rounded-[14px] p-[18px] shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="inline-flex items-center gap-2 text-[17px] font-bold text-ink-900">
          <Icon name={icon} className="h-[17px] w-[17px] text-royal" />
          {title}
        </div>
        {hasItems && seeAllHref && <SeeAll href={seeAllHref} />}
      </div>
      {hasItems ? (
        children
      ) : (
        <p className="py-4 text-center text-sm text-ink-400">{emptyLabel}</p>
      )}
    </section>
  );
}

// ---- Skeletons ---- //

export function NewsSkeleton() {
  return (
    <section>
      <div className="flex items-center justify-between mb-[18px]">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-[360px] w-full rounded-[14px]" />
        ))}
      </div>
    </section>
  );
}

export function ContentCardSkeleton() {
  return (
    <section className="bg-white border border-ink-100 rounded-[14px] p-[18px] shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full rounded-[10px]" />
        ))}
      </div>
    </section>
  );
}
