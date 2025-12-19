import {workspacePathname} from '@/utils/workspace';
import {permanentRedirect} from 'next/navigation';

export default async function Page(
  props: {
    params: Promise<{tenant: string; workspace: string}>;
  }
) {
  const params = await props.params;
  const {workspaceURI} = workspacePathname(params);
  permanentRedirect(`${workspaceURI}/ticketing`);
}
