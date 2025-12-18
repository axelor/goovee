import Image from 'next/image';
import {i18n} from '@/locale';
import notFound from '@/public/img/illustrations/404.png';
import NextLink from '../../reuseable/links/NextLink';
import {ArrowRight} from 'lucide-react';

export function NotFound({homePageUrl}: {homePageUrl?: string}) {
  return (
    <main className="!flex !h-full !w-full !items-center !justify-center !bg-background !p-4 md:!p-12">
      <div className="!grid !w-full !max-w-4xl !items-center !gap-8 md:!grid-cols-2">
        <div className="!flex !justify-center">
          <Image
            src={notFound}
            className="!max-w-full"
            alt="404 - Not Found Illustration"
          />
        </div>
        <div className="!flex !flex-col !items-center !text-center md:!items-start md:!text-left">
          <h1 className="!text-4xl !font-bold !tracking-tight !text-[#3F78E0] sm:!text-5xl">
            {i18n.t('Page Not Found!')}
          </h1>
          <p className="!p-0 !mt-2 !text-base !text-muted-foreground">
            {i18n.t("Sorry, we couldn't find the page you're looking for.")}
          </p>

          <NextLink
            href={homePageUrl || '/'}
            title={
              <>
                <span>{i18n.t('Go to Homepage')}</span>
                <ArrowRight className="!h-4 !w-4" />
              </>
            }
            className="!mt-4 !inline-flex !items-center !gap-2 !rounded-md !bg-[#3F78E0] !px-4 !py-2 !text-sm !font-medium !text-primary-foreground !shadow !transition-colors hover:!bg-[#3F78E0]/90 focus-visible:!outline-none focus-visible:!ring-1 focus-visible:!ring-ring"></NextLink>
        </div>
      </div>
    </main>
  );
}
