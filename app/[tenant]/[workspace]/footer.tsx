import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import type {PortalAppConfig} from '@/orm/workspace';
import {withBasePath} from '@/lib/core/path/base-path';
import {Link} from '@/ui/components/link';
import type {Cloned} from '@/types/util';

export default function Footer({
  config,
}: {
  config: PortalAppConfig | Cloned<PortalAppConfig>;
}) {
  const displayContact = config.isDisplayContact;
  const contactEmail = config.contactEmailAddress?.address;

  return (
    <>
      <div className="mt-auto bg-background text-foreground px-4 py-1 z-10 lg:flex hidden items-center justify-center border-t border-border border-solid">
        <div className="px-4">
          {displayContact && (
            <div className="flex flex-col gap-0.5 items-start text-xs">
              <p className="font-medium">{config.contactName}</p>
              <p>
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </p>
              <p>{config.contactPhone}</p>
            </div>
          )}
        </div>
        <div className="mx-auto">
          <Link
            href={`https://axelor.com/fr/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center">
            <div className="text-xs">{i18n.t('Powered by')}</div>
            <Image
              src={withBasePath('/images/axelor.png')}
              alt="Axelor Logo"
              width={50}
              height={25}
              className="h-6 ml-1"
              style={{width: 'auto', height: 'auto'}}
            />
          </Link>
        </div>
      </div>
    </>
  );
}
