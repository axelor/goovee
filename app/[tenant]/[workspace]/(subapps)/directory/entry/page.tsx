import {workspacePathname} from '@/utils/workspace';
import {permanentRedirect} from 'next/navigation';

export default function Page({
  params,
}: {
  params: {tenant: string; workspace: string};
}) {
  const {workspaceURI} = workspacePathname(params);
  permanentRedirect(`${workspaceURI}/${SUBAPP_CODES.directory}`);
}
