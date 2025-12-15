import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {FaLinkedin} from 'react-icons/fa';
import {IoArrowBackOutline} from 'react-icons/io5';

// ---- CORE IMPORTS ---- //
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {t, tattr} from '@/lib/core/locale/server';
import {Avatar, AvatarImage, RichTextViewer} from '@/ui/components';
import {clone} from '@/utils';
import {getPartnerImageURL} from '@/utils/files';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {civility} from '../../common/constants';
import {findEntry, findMapConfig} from '../../common/orm';
import type {Entry} from '../../common/types';
import {Map} from '../../common/ui/components/map';
import {ensureAuth} from '../../common/utils/auth-helper';

import '@/ui/components/rich-text-editor/rich-text-editor.css';
export default async function Page({
  params,
}: {
  params: {tenant: string; workspace: string; id: string};
}) {
  const {id} = params;
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);
  const {error} = await ensureAuth(workspaceURL, tenant);
  if (error) notFound();
  const [entry, config] = await Promise.all([
    findEntry({id, tenantId: tenant}),
    findMapConfig({tenantId: tenant}),
  ]);

  if (!entry) notFound();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Link
        href={`${workspaceURI}/${SUBAPP_CODES.directory}`}
        className="mb-4 inline-flex items-center gap-2 text-primary hover:underline">
        <IoArrowBackOutline className="h-5 w-5" />
        {await t('Back to Directory')}
      </Link>
      <div className="bg-card shadow-lg rounded-lg overflow-hidden">
        <Details entryDetail={entry} tenant={tenant} />
        <div className="p-4 sm:p-6 lg:p-8">
          <Map
            className="h-96 w-full rounded-md"
            entries={[clone(entry)]}
            config={config}
          />
        </div>
      </div>

      {entry.mainPartnerContacts && entry.mainPartnerContacts?.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mb-6">
            {await t(
              entry.mainPartnerContacts.length > 1 ? 'Contacts' : 'Contact',
            )}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {entry.mainPartnerContacts.map(contact => (
              <Contact key={contact.id} tenant={tenant} contact={contact} />
            ))}
          </div>
        </div>
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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        <div className="flex-shrink-0">
          <Image
            width={192}
            height={192}
            className="rounded-lg object-cover w-36 h-36 sm:w-48 sm:h-48"
            src={getPartnerImageURL(picture?.id, tenant, {
              noimage: true,
              noimageSrc: NO_IMAGE_URL,
            })}
            alt={portalCompanyName ?? 'Company Logo'}
          />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            {portalCompanyName}
          </h1>
          {mainAddress?.formattedFullName && (
            <p className="mt-2 text-lg text-muted-foreground">
              {mainAddress.formattedFullName}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {emailAddress && (
              <Link
                href={`mailto:${emailAddress.address}`}
                className="text-sm text-primary hover:underline flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {emailAddress.address}
              </Link>
            )}
            {fixedPhone && (
              <Link
                href={`tel:${fixedPhone}`}
                className="text-sm text-primary hover:underline flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {fixedPhone}
              </Link>
            )}
            {mobilePhone && (
              <Link
                href={`tel:${mobilePhone}`}
                className="text-sm text-primary hover:underline flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                {mobilePhone}
              </Link>
            )}
            {webSite && (
              <Link
                href={webSite}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                {webSite}
              </Link>
            )}
          </div>
        </div>
      </div>
      {directoryCompanyDescription && (
        <div className="mt-6 border-t border-border pt-6">
          <h3 className="text-xl font-semibold mb-2">{await t('About')}</h3>
          <RichTextViewer content={directoryCompanyDescription} />
        </div>
      )}
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
    <div className="bg-card rounded-lg shadow-md overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              className="object-cover"
              src={getPartnerImageURL(picture?.id, tenant, {noimage: true})}
              alt={displayName}
            />
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">{displayName}</h3>
            {jobTitleFunction?.name && (
              <p className="text-sm text-muted-foreground">
                {await tattr(jobTitleFunction.name)}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {emailAddress && (
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <Link
                href={`mailto:${emailAddress.address}`}
                className="text-primary hover:underline">
                {emailAddress.address}
              </Link>
            </div>
          )}
          {fixedPhone && (
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <Link
                href={`tel:${fixedPhone}`}
                className="text-primary hover:underline">
                {fixedPhone}
              </Link>
            </div>
          )}
          {mobilePhone && (
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <Link
                href={`tel:${mobilePhone}`}
                className="text-primary hover:underline">
                {mobilePhone}
              </Link>
            </div>
          )}
        </div>
      </div>
      {linkedinLink && (
        <div className="border-t border-border px-5 py-3 bg-muted/50">
          <Link
            href={linkedinLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline">
            <FaLinkedin className="h-5 w-5 text-[#0077b5]" />
            <span>{await t('LinkedIn Profile')}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
