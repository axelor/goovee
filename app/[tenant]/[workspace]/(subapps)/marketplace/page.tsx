import {SUBAPP_CODES} from '@/constants';
import {workspacePathname} from '@/utils/workspace';
import {redirect} from 'next/navigation';
import {DEFAULT_MARKETPLACE_TYPE_SEGMENT} from './common/constants/route-types';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {workspaceURI} = workspacePathname(params);
  redirect(
    `${workspaceURI}/${SUBAPP_CODES.marketplace}/${DEFAULT_MARKETPLACE_TYPE_SEGMENT}`,
  );
}
