import type {Cloned} from '@/types/util';

// ---- CORE IMPORTS ----//
import type {Client} from '@/goovee/.generated/client';
import {getSession} from '@/auth';
import type {Workspace} from '@/orm/workspace';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import type {NewsConfig} from '@/subapps/news/common/orm/config';
import {NewsEditorial} from '@/subapps/news/common/ui/components';
import {findNews} from '@/subapps/news/common/orm/news';

const FEATURED_LIMIT = 10;
const FEED_FETCH_LIMIT = 20;
const FEED_GRID_SIZE = 9;

export async function Homepage({
  workspace,
  config,
  client,
}: {
  workspace: Workspace | Cloned<Workspace>;
  config: NewsConfig | Cloned<NewsConfig>;
  client: Client;
}) {
  const session = await getSession();
  const user = session?.user;

  const select = {
    description: true,
    /* Not selected at all when the workspace hides the author, so the name
       never reaches the browser — hiding it in the markup alone would still
       ship it in the payload. */
    ...(config.isShowPublicationAuthor ? {author: {simpleFullName: true}} : {}),
  };

  /* Two reads: the editor-flagged articles that fill the "Featured" rail, and
     the recent feed behind the grid. Fetch a few extra for the feed so that,
     after dropping the ones already featured, the grid still fills up. */
  const [featuredResult, feedResult] = await Promise.all([
    findNews({
      workspace,
      client,
      user,
      isFeaturedNews: true,
      limit: FEATURED_LIMIT,
      orderBy: {publicationDateTime: 'DESC'},
      params: {select},
    }).then(clone),
    findNews({
      workspace,
      client,
      user,
      limit: FEED_FETCH_LIMIT,
      orderBy: {publicationDateTime: 'DESC'},
      params: {select},
    }).then(clone),
  ]);

  const featured = featuredResult?.news || [];
  const featuredSlugs = new Set(featured.map(a => a.slug));
  // Keep featured articles out of the grid below so nothing appears twice.
  const feed = (feedResult?.news || [])
    .filter(a => !featuredSlugs.has(a.slug))
    .slice(0, FEED_GRID_SIZE);

  return (
    <NewsEditorial
      articles={feed}
      featured={featured}
      config={config}
      publisher={workspace?.name ?? undefined}
    />
  );
}

export default Homepage;
