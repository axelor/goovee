import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {FaLinkedin} from 'react-icons/fa';

// ---- CORE IMPORTS ---- //
import {t, tattr} from '@/lib/core/locale/server';
import {Avatar, AvatarImage, InnerHTML} from '@/ui/components';
import {clone} from '@/utils';
import {getPartnerImageURL} from '@/utils/files';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {NO_IMAGE_URL} from '@/constants';
import {findEntry, findMapConfig} from '../../common/orm';
import type {Entry} from '../../common/types';
import {Map} from '../../common/ui/components/map';
import {ensureAuth} from '../../common/utils/auth-helper';
import {civility} from '../../common/constants';

export default async function Page({
  params,
}: {
  params: {tenant: string; workspace: string; id: string};
}) {
  const {id} = params;
  const {workspaceURL, tenant} = workspacePathname(params);
  const {error} = await ensureAuth(workspaceURL, tenant);
  if (error) notFound();
  const [entry, config] = await Promise.all([
    findEntry({id, tenantId: tenant}),
    findMapConfig({tenantId: tenant}),
  ]);

  if (!entry) notFound();

  return (
    <div className="container flex flex-col gap-4 mt-4 mb-5">
      <div className="flex flex-col gap-4 bg-card p-4 rounded-lg">
        <Details entryDetail={entry} tenant={tenant} />
        <Map className="h-80 w-full" entries={[clone(entry)]} config={config} />
      </div>
      {entry.mainPartnerContacts && entry.mainPartnerContacts?.length > 0 && (
        <>
          <h2 className="font-semibold text-xl pl-4">
            {await t(
              entry.mainPartnerContacts.length > 1 ? 'Contacts' : 'Contact',
            )}
          </h2>

          {entry.mainPartnerContacts.map(contact => (
            <Contact key={contact.id} tenant={tenant} contact={contact} />
          ))}
        </>
      )}
    </div>
  );
}

async function Details({
  entryDetail,
  tenant,
}: {
  entryDetail: Entry;
  tenant: string;
}) {
  const {
    mainAddress,
    emailAddress,
    fixedPhone,
    portalCompanyName,
    picture,
    webSite,
    directoryCompanyDescription,
    mobilePhone,
  } = entryDetail;

  return (
    <div>
      <div className="flex bg-card gap-5 justify-between">
        <div className="space-y-4 mt-4">
          <h2 className="font-semibold text-xl">{portalCompanyName}</h2>
          <p className="text-success text-base">
            {mainAddress?.formattedFullName}
          </p>
        </div>

        {/* image */}
        <Image
          width={156}
          height={138}
          className="rounded-r-lg h-[138px] object-cover"
          src={getPartnerImageURL(picture?.id, tenant, {
            noimage: true,
            noimageSrc: NO_IMAGE_URL,
          })}
          alt="image"
        />
      </div>
      <hr />

      {/* directory description */}

      <div className="DraftEditor-editorContainer my-3">
        <InnerHTML
          content={directoryCompanyDescription}
          className="public-DraftEditor-content"
        />
      </div>
      <div className="ms-4 space-y-4">
        {emailAddress && (
          <>
            <h4 className="font-semibold">{await t('Email')}</h4>
            <Link
              className="text-sm text-muted-foreground hover:underline hover:!text-palette-blue-dark"
              href={`mailto:${emailAddress.address}`}>
              {emailAddress.address}
            </Link>
          </>
        )}
        <>
          <h4 className="font-semibold">{await t('Phone number')}</h4>
          {fixedPhone && (
            <Link
              className="text-sm text-muted-foreground hover:underline hover:!text-palette-blue-dark"
              href={`tel:${fixedPhone}`}>
              {fixedPhone}
            </Link>
          )}
          <br />
          {mobilePhone && (
            <Link
              className="text-sm text-muted-foreground hover:underline hover:!text-palette-blue-dark"
              href={`tel:${mobilePhone}`}>
              {mobilePhone}
            </Link>
          )}
          {webSite && (
            <Link
              className="text-sm text-muted-foreground hover:underline hover:!text-palette-blue-dark"
              href={webSite}
              target="_blank"
              rel="noreferrer">
              {webSite}
            </Link>
          )}
        </>
      </div>
    </div>
  );
}

async function Contact({
  tenant,
  contact,
}: {
  tenant: string;
  contact: NonNullable<Entry['mainPartnerContacts']>[number];
}) {
  const {
    emailAddress,
    fixedPhone,
    firstName,
    name,
    titleSelect,
    linkedinLink,
    mobilePhone,
    picture,
    jobTitleFunction,
  } = contact;

  const title = civility.find(x => x.value === titleSelect)?.title;
  const displayName = [title && (await t(title)), firstName, name]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="bg-card space-y-4 p-4 rounded-lg">
      <div className="flex items-center gap-2">
        <Avatar className="h-10 w-10">
          <AvatarImage
            className="object-cover"
            src={getPartnerImageURL(picture?.id, tenant, {noimage: true})}
          />
        </Avatar>
        <span className="font-semibold">{displayName}</span>
      </div>
      <div className="ms-4 space-y-4">
        {jobTitleFunction?.name && (
          <h4 className="font-semibold">
            {await tattr(jobTitleFunction.name)}
          </h4>
        )}
        {emailAddress && (
          <>
            <h4 className="font-semibold">{await t('Email')}</h4>
            <Link
              className="text-sm text-muted-foreground hover:underline hover:!text-palette-blue-dark"
              href={`mailto:${emailAddress.address}`}>
              {emailAddress.address}
            </Link>
          </>
        )}
        <>
          {(fixedPhone || mobilePhone) && (
            <h4 className="font-semibold">{await t('Phone number')}</h4>
          )}
          {fixedPhone && (
            <Link
              className="text-sm text-muted-foreground hover:underline hover:!text-palette-blue-dark"
              href={`tel:${fixedPhone}`}>
              {fixedPhone}
            </Link>
          )}
          <br />
          {mobilePhone && (
            <Link
              className="text-sm text-muted-foreground hover:underline hover:!text-palette-blue-dark"
              href={`tel:${mobilePhone}`}>
              {mobilePhone}
            </Link>
          )}
        </>

        {linkedinLink && (
          <Link href={linkedinLink} target="_blank" rel="noreferrer">
            <FaLinkedin className="h-8 w-8 text-palette-blue-dark" />
          </Link>
        )}
      </div>
    </div>
  );
}
