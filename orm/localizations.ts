import {Client} from '@/goovee/.generated/client';
import {DEFAULT_LOCALE} from '@/locale/contants';
import {findLocaleLanguage, inverseTransformLocale} from '@/locale/utils';
import {Tenant, manager} from '@/tenant';
import {clone} from '@/utils';

export async function findLocalizations({
  tenantId,
  client,
}: {
  tenantId: Tenant['id'];
  client?: Client;
}) {
  if (!tenantId) {
    return [];
  }

  client ??= await manager.getClient(tenantId);

  if (!client) {
    return [];
  }

  const localizations = await client.aOSLocalization
    .find({
      select: {
        name: true,
        code: true,
      },
      where: {
        isAvailableOnPortal: true,
      },
    })
    .then(clone);

  return localizations;
}

export async function findRegistrationLocalization({
  tenantId,
  locale,
  client,
}: {
  locale?: string;
  tenantId: Tenant['id'];
  client?: Client;
}) {
  const availableLocalization = await findLocalizations({tenantId, client});

  const language = locale && findLocaleLanguage(inverseTransformLocale(locale));
  const fallbackLanguages = [locale, language, DEFAULT_LOCALE];

  const localization =
    fallbackLanguages
      .map(lang =>
        availableLocalization.find(l => lang && l.code?.startsWith(lang)),
      )
      .find(Boolean) || availableLocalization?.[0];

  return localization;
}
