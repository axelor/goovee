import '@/load-swc-env';

import {DEFAULT_CURRENCY_SCALE, DEFAULT_TENANT} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import {manager} from '@/tenant';
import {getAOSAuthHeaders} from '@/tenant/auth';
import axios from 'axios';
import {parseArgs} from 'node:util';
import {buildPriceContext, priceSelectFields} from '../../orm';
import {computePrice} from '../../utils/price';

type AosPriceEntry = {
  productId: number;
  prices?: Array<{type: 'WT' | 'ATI'; price: string}>;
  currency?: {currencyId: number; code: string; symbol: string};
  errorMessage?: string;
};

type ProductRow = {
  ok: boolean;
  productId: string;
  name: string;
  salePrice: string;
  saleCurrency: string;
  gvWt: number;
  gvAti: number;
  gvCcy: string;
  gvRate: number;
  aosWt: string | undefined;
  aosAti: string | undefined;
  aosCcy: string | undefined;
};

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

function pad(s: string, width: number, align: 'L' | 'R' = 'L'): string {
  if (s.length >= width) return s;
  const padding = ' '.repeat(width - s.length);
  return align === 'L' ? s + padding : padding + s;
}

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[90m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function renderTable(rows: ProductRow[]): string[] {
  const widths = {
    flag: 1,
    id: Math.max(2, ...rows.map(r => r.productId.length)),
    name: Math.min(34, Math.max(4, ...rows.map(r => r.name.length))),
    sale: Math.max(
      14,
      ...rows.map(r => `${r.salePrice} ${r.saleCurrency}`.length),
    ),
    gv: 22,
    aos: 22,
    rate: 6,
  };
  const header =
    BOLD +
    pad('', widths.flag) +
    '  ' +
    pad('id', widths.id, 'R') +
    '  ' +
    pad('name', widths.name) +
    '  ' +
    pad('salePrice / CUR', widths.sale) +
    '  ' +
    pad('goovee (WT / ATI / CUR)', widths.gv) +
    '  ' +
    pad('aos (WT / ATI / CUR)', widths.aos) +
    '  ' +
    pad('rate', widths.rate, 'R') +
    RESET;
  const sep =
    DIM +
    '─'.repeat(
      widths.flag +
        widths.id +
        widths.name +
        widths.sale +
        widths.gv +
        widths.aos +
        widths.rate +
        12,
    ) +
    RESET;
  const out = [header, sep];
  for (const r of rows) {
    const flag = (r.ok ? GREEN + '✔' : RED + '✖') + RESET;
    const sale = `${r.salePrice} ${r.saleCurrency}`;
    const gv = `${r.gvWt} / ${r.gvAti} / ${r.gvCcy}`;
    const aos = `${r.aosWt ?? '-'} / ${r.aosAti ?? '-'} / ${r.aosCcy ?? '-'}`;
    out.push(
      flag +
        '  ' +
        pad(r.productId, widths.id, 'R') +
        '  ' +
        pad(truncate(r.name, widths.name), widths.name) +
        '  ' +
        pad(truncate(sale, widths.sale), widths.sale) +
        '  ' +
        pad(truncate(gv, widths.gv), widths.gv) +
        '  ' +
        pad(truncate(aos, widths.aos), widths.aos) +
        '  ' +
        pad(`${r.gvRate}%`, widths.rate, 'R'),
    );
  }
  return out;
}

const {values} = parseArgs({
  args: process.argv.slice(2).filter(a => a !== '--'),
  options: {
    tenant: {type: 'string'},
    product: {type: 'string', multiple: true},
    partner: {type: 'string', multiple: true},
    company: {type: 'string', multiple: true},
    help: {type: 'boolean'},
    verbose: {type: 'boolean'},
  },
  strict: true,
  allowPositionals: false,
});

if (values.help) {
  console.log(`
Price parity test — compares goovee computePrice() with AOS /ws/aos/product/price.

When --product is omitted, every marketplace product (any with a non-null
marketplace_type_select and sale_price > 0) is loaded.

When --partner is omitted, the script picks one partner per distinct
fiscal_position (plus a no-partner row) so every FP variant is exercised.

When --company is omitted, every active company is used.

Usage:
  pnpm marketplace:test-price [-- --product <id>...] [--partner <id>...] [--company <id>...] [--tenant <id>] [--verbose]

Options:
  --product <id>    Product id (repeatable). Default: all marketplace products.
  --partner <id>    Buyer partner id (repeatable). Default: one per fiscal_position + none.
  --company <id>    Selling company id (repeatable). Default: all active companies.
  --tenant <id>     Tenant id (defaults to DEFAULT_TENANT).
  --verbose         Print per-product rows. Default: only mismatches + per-cell totals.
`);
  process.exit(0);
}

async function loadProductIds(
  client: Client,
  explicit?: string[],
): Promise<string[]> {
  if (explicit && explicit.length > 0) return explicit;
  const rows = await client.aOSProduct.find({
    where: {
      marketplaceTypeSelect: {ne: null},
      salePrice: {gt: '0'},
    },
    select: {id: true},
  });
  return rows.map(r => r.id);
}

type CompanySample = {id: string; label: string};

async function loadCompanies(
  client: Client,
  explicit?: string[],
): Promise<CompanySample[]> {
  const where =
    explicit && explicit.length > 0 ? {id: {in: explicit}} : undefined;
  const rows = await client.aOSCompany.find({
    ...(where ? {where} : {}),
    select: {name: true},
  });
  return rows.map(c => ({id: c.id, label: c.name ?? c.id}));
}

type PartnerSample = {id: string | null; label: string};

/* For each distinct fiscal_position present on at least one base_partner
 * row, pick one partner that has it. Returns a "none" entry plus one
 * sample per FP so every variant is exercised. */
async function loadPartnerSamples(
  client: Client,
  explicit?: string[],
): Promise<PartnerSample[]> {
  if (explicit && explicit.length > 0) {
    const partners = await client.aOSPartner.find({
      where: {id: {in: explicit}},
      select: {fullName: true, simpleFullName: true, name: true},
    });
    const byId = new Map(partners.map(p => [p.id, p]));
    return explicit.map(id => {
      const p = byId.get(id);
      const label = p?.fullName ?? p?.simpleFullName ?? p?.name ?? id;
      return {id, label};
    });
  }
  const partners = await client.aOSPartner.find({
    where: {
      AND: [
        {OR: [{archived: false}, {archived: null}]},
        {OR: [{isContact: false}, {isContact: null}]},
      ],
    },
    select: {
      fullName: true,
      simpleFullName: true,
      name: true,
      fiscalPosition: {id: true},
      currency: {code: true},
    },
    take: 5000,
  });
  const samples = new Map<string, PartnerSample>();
  samples.set('none', {id: null, label: 'none'});
  for (const p of partners) {
    const fpKey = p.fiscalPosition?.id ?? 'null';
    const CURKey = p.currency?.code ?? 'null';
    const key = `${fpKey}|${CURKey}`;
    if (samples.has(key)) continue;
    const name = p.fullName ?? p.simpleFullName ?? p.name ?? p.id;
    const label = `${name} (fp=${fpKey}, CUR=${CURKey})`;
    samples.set(key, {id: p.id, label});
  }
  return Array.from(samples.values());
}

type Combo = {company: CompanySample; partner: PartnerSample};

async function runCombo({
  client,
  config,
  combo,
  productIds,
  verbose,
}: {
  client: Client;
  config: {aos: {url: string; auth: any}};
  combo: Combo;
  productIds: string[];
  verbose: boolean;
}): Promise<{combo: Combo; total: number; mismatches: number; rows: string[]}> {
  const company = await client.aOSCompany.findOne({
    where: {id: combo.company.id},
    select: {timezone: true},
  });
  if (!company) throw new Error(`Company ${combo.company.id} not found.`);

  const products = await client.aOSProduct.find({
    where: {id: {in: productIds}},
    select: {...priceSelectFields, name: true},
  });
  const byId = new Map(products.map(p => [p.id, p]));

  const priceContext = await buildPriceContext({
    client,
    mainPartnerId: combo.partner.id ?? undefined,
    productCurrencyCodes: products.map(p => p.saleCurrency?.code),
  });

  const goovee = productIds.map(id => {
    const p = byId.get(id);
    if (!p) return null;
    const productCurrency = p.saleCurrency?.code
      ? {
          code: p.saleCurrency.code,
          symbol: p.saleCurrency.symbol ?? '',
          numberOfDecimals: p.saleCurrency.numberOfDecimals,
        }
      : null;
    return {
      productId: id,
      name: p.name ?? '',
      price: computePrice(p, {
        companyId: combo.company.id,
        companyTimezone: company.timezone,
        scale: p.saleCurrency?.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE,
        productCurrency,
        viewerCurrency: priceContext.viewerCurrency,
        defaultCurrency: priceContext.defaultCurrency,
        conversionLines: priceContext.conversionLines,
        fiscalPosition: priceContext.fiscalPosition,
      }),
    };
  });

  const aosRes = await axios.post(
    `${config.aos.url}/ws/aos/product/price`,
    {
      apiVersion: 1,
      productList: productIds.map(id => ({productId: Number(id)})),
      ...(combo.partner.id ? {partnerId: Number(combo.partner.id)} : {}),
      ...(combo.company.id ? {companyId: Number(combo.company.id)} : {}),
    },
    {headers: getAOSAuthHeaders(config.aos.auth)},
  );
  const aosEntries: AosPriceEntry[] = aosRes.data?.object ?? [];
  const aosById = new Map(aosEntries.map(e => [String(e.productId), e]));

  const productRows: ProductRow[] = [];
  let mismatches = 0;
  for (const g of goovee) {
    if (!g) continue;
    const a = aosById.get(g.productId);
    const aosWt = a?.errorMessage
      ? `err: ${a.errorMessage}`
      : a?.prices?.find(p => p.type === 'WT')?.price;
    const aosAti = a?.errorMessage
      ? undefined
      : a?.prices?.find(p => p.type === 'ATI')?.price;
    const aosCcy = a?.errorMessage ? undefined : a?.currency?.code;
    const ok =
      !a?.errorMessage &&
      Number(aosWt) === g.price.wt &&
      Number(aosAti) === g.price.ati &&
      aosCcy === g.price.currency.code;
    if (!ok) mismatches++;
    const product = byId.get(g.productId);
    productRows.push({
      ok,
      productId: g.productId,
      name: g.name,
      salePrice: String(product?.salePrice ?? '-'),
      saleCurrency: product?.saleCurrency?.code ?? '-',
      gvWt: g.price.wt,
      gvAti: g.price.ati,
      gvCcy: g.price.currency.code,
      gvRate: g.price.taxRate,
      aosWt,
      aosAti,
      aosCcy,
    });
  }
  const visible = verbose ? productRows : productRows.filter(r => !r.ok);
  return {
    combo,
    total: productRows.length,
    mismatches,
    rows: visible.length ? renderTable(visible) : [],
  };
}

async function main() {
  const tenantId = values.tenant ?? DEFAULT_TENANT;
  const tenant = await manager.getTenant(tenantId);
  const {client, config} = tenant;
  const verbose = Boolean(values.verbose);

  const [productIds, companies, partners] = await Promise.all([
    loadProductIds(client, values.product),
    loadCompanies(client, values.company),
    loadPartnerSamples(client, values.partner),
  ]);

  if (productIds.length === 0) throw new Error('No products to test.');
  if (companies.length === 0) throw new Error('No companies found.');

  console.log(
    `\n\x1b[36m→ tenant=${tenantId} products=${productIds.length} companies=${companies.length} partners=${partners.length} (incl. none)\x1b[0m`,
  );

  let totalChecks = 0;
  let totalMismatches = 0;
  for (const company of companies) {
    for (const partner of partners) {
      const result = await runCombo({
        client,
        config,
        combo: {company, partner},
        productIds,
        verbose,
      });
      totalChecks += result.total;
      totalMismatches += result.mismatches;
      const label = `company=${company.label}, partner=${partner.label}`;
      const flag =
        result.mismatches === 0 ? `${GREEN}✔${RESET}` : `${RED}✖${RESET}`;
      console.log(
        `\n${flag} ${label}  ${result.total - result.mismatches}/${result.total} match` +
          (result.mismatches
            ? `  (${RED}${result.mismatches} mismatched${RESET})`
            : ''),
      );
      for (const row of result.rows) console.log(row);
    }
  }

  console.log(
    `\n${totalMismatches === 0 ? '\x1b[32m' : '\x1b[31m'}${totalChecks - totalMismatches}/${totalChecks} matches across all combinations.\x1b[0m\n`,
  );
  process.exit(totalMismatches === 0 ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
