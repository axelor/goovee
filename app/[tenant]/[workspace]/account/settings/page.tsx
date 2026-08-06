import {redirect} from 'next/navigation';
import {workspacePathname} from '@/utils/workspace';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {workspaceURI} = workspacePathname(params);
  redirect(`${workspaceURI}/account/apps`);
}
