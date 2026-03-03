'use client';

import * as React from 'react';
import {useParams, useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {Website} from '@/types';
import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import {getLocaleRedirectionURL} from '../common/action';
import {useToast} from '@/ui/hooks';

export function LanguageSelection({languageList, active}: any) {
  const {workspaceURI, workspaceURL} = useWorkspace();
  const router = useRouter();
  const {toast} = useToast();
  const params = useParams();

  const websitePageSlug = params.websitePageSlug as string;

  if (!languageList?.length) return null;

  const handleLanguageChange = async (websiteSlug: Website['slug']) => {
    const result = await getLocaleRedirectionURL({
      workspaceURL,
      workspaceURI,
      websiteSlug,
      websitePageSlug,
    });

    if (result?.success && result?.data?.url) {
      return router.push(result.data.url);
    }

    toast({
      variant: 'destructive',
      title: result.message || i18n.t('Error redirecting'),
    });
  };

  return (
    <Select defaultValue={active} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select an locale" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{i18n.t('Locales')}</SelectLabel>
          {languageList
            .filter((item: any) => item.language && item.website)
            .map((item: any) => {
              const {language, website} = item;
              return (
                <SelectItem value={website.slug} key={website.slug}>
                  {language.name}
                </SelectItem>
              );
            })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
