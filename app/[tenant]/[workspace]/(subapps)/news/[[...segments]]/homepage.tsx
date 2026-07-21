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

  const newsResult = await findNews({
    workspace,
    client,
    user,
    limit: 9,
    orderBy: {publicationDateTime: 'DESC'},
    params: {
      select: {
        description: true,
        author: {simpleFullName: true},
      },
    },
  }).then(clone);

  const articles = newsResult?.news || [];

  return <NewsEditorial articles={articles} />;
}

export default Homepage;
