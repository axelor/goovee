import type {Cloned} from '@/types/util';
import type {OrderByOptions} from '@goovee/orm';

// ---- CORE IMPORTS ---- //
import {aosClient} from '@/service';
import {clone, scale} from '@/utils';
import {getSkip} from '@/utils/pagination';
import {
  DEFAULT_CURRENCY_SCALE,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_PAGE,
  DEFAULT_TAX_VALUE,
  DEFAULT_UNIT_PRICE_SCALE,
  MAIN_PRICE,
  OUT_OF_STOCK_TYPE,
} from '@/constants';
import type {Product, Currency, ComputedProduct, User} from '@/types';
import type {Workspace} from '@/orm/workspace';
import type {TenantConfig} from '@/tenant';
import type {Client} from '@/goovee/.generated/client';
import type {AOSProduct} from '@/goovee/.generated/models';
import {filterPrivate} from '@/orm/filter';
import {formatNumber} from '@/locale/server/formatters';
import {getPartnerId} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import type {ShopConfig} from './config';

type RawProduct = {
  id: string;
  name: string | null;
  code: string | null;
  slug: string | null;
  description: string | null;
  inAti: boolean | null;
  salePrice: number | null;
  featured: number | null;
  createdOn: string | null;
  productAttrs: string | null;
  allowCustomNote: boolean | null;
  _count?: string;
  saleCurrency: {symbol: string | null} | null;
  thumbnailImage: {id: string} | null;
  picture: {id: string} | null;
  portalImageList: Array<{picture: {id: string} | null}> | null;
  productCompanyList: Array<{
    salePrice: number | null;
    company: {
      id: string;
      name: string | null;
      currency: {
        code: string | null;
        numberOfDecimals: number | null;
        symbol: string | null;
      } | null;
    } | null;
  }> | null;
  productFamily: {
    name: string | null;
    accountManagementList: Array<{
      name: string | null;
      saleTaxSet: Array<{
        name: string | null;
        activeTaxLine: {name: string | null; value: number | null} | null;
      }> | null;
    }> | null;
  } | null;
  outOfStockConfig?: {
    outOfStock: boolean;
    showMessage: boolean;
    canBuy: boolean;
  };
  images?: string[];
};

function getPageInfo({
  count = 0,
  limit,
  page,
}: {
  count?: number | string;
  limit?: number | string;
  page?: number | string;
}) {
  const pages = Math.ceil(Number(count) / Number(limit));

  return {
    count,
    limit,
    page,
    pages,
    hasNext: Number(page) !== Number(pages),
    hasPrev: Number(page) > 1,
  };
}

const getProductFields = ({
  config,
  shouldHidePrices,
}: {
  config: ShopConfig | Cloned<ShopConfig>;
  shouldHidePrices: boolean;
}) =>
  ({
    name: true,
    code: true,
    inAti: true,
    description: true,
    saleCurrency: {
      symbol: true,
    },
    ...(shouldHidePrices ? {} : {salePrice: true}),
    featured: true,
    createdOn: true,
    thumbnailImage: {
      id: true,
    },
    picture: {
      id: true,
    },
    productAttrs: true,
    allowCustomNote: true,
    portalImageList: {
      select: {
        picture: {
          id: true,
        },
      },
    },
    productCompanyList: {
      select: {
        ...(shouldHidePrices ? {} : {salePrice: true}),
        company: {
          id: true,
          name: true,
          currency: {
            code: true,
            numberOfDecimals: true,
            symbol: true,
          },
        },
      },
    },
    productFamily: {
      name: true,
      accountManagementList: {
        where: {
          company: {
            id: config?.company?.id,
          },
        },
        select: {
          name: true,
          saleTaxSet: {
            select: {
              name: true,
              activeTaxLine: {
                name: true,
                value: true,
              },
            },
          },
        },
      },
    },
    productCategory: {
      id: true,
      name: true,
      slug: true,
    },
    portalCategorySet: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    slug: true,
  }) as const;

const getWhereClause = ({
  ids,
  slugs,
  search,
  categoryids,
  associateWorkspace,
  workspace,
  user,
  archived,
}: {
  ids?: Product['id'][];
  slugs?: Product['slug'][];
  search?: string;
  categoryids?: (string | number)[];
  associateWorkspace?: boolean;
  workspace: Workspace | Cloned<Workspace>;
  user?: User;
  archived?: boolean;
}) => {
  const whereClause = {
    ...(ids?.length
      ? {
          id: {
            in: ids,
          },
        }
      : {}),
    ...(slugs?.length
      ? {
          slug: {
            in: slugs,
          },
        }
      : {}),
    ...(search
      ? {
          name: {
            like: `%${search}%`,
          },
        }
      : {}),
    ...(categoryids?.length
      ? {
          portalCategorySet: {
            id: {
              in: categoryids,
            },
          },
        }
      : {}),
    ...(associateWorkspace
      ? {
          portalWorkspace: {
            id: workspace.id,
          },
        }
      : {}),
    AND: [
      filterPrivate({user}),
      archived ? {archived: true} : {OR: [{archived: false}, {archived: null}]},
      // The shop only exposes sellable products — this also keeps non-sellable
      // items out even when they are attached to a portal category (e.g. the
      // "[EVENT]" product backing event registrations).
      {sellable: true},
    ],
  };

  return whereClause;
};

function getSortOrder(sort?: string): OrderByOptions<AOSProduct> {
  switch (sort) {
    case 'byMostExpensive':
      return {salePrice: 'DESC'};
    case 'byLessExpensive':
      return {salePrice: 'ASC'};
    case 'byZToA':
      return {name: 'DESC'};
    case 'byFeature':
      return {featured: 'DESC'};
    case 'byNewest':
      return {createdOn: 'DESC'};
    case 'byAToZ':
    default:
      return {name: 'ASC'};
  }
}

export async function findProducts({
  ids,
  slugs,
  search,
  sort,
  categoryids,
  page = DEFAULT_PAGE,
  limit,
  workspace,
  workspaceConfig,
  user,
  client,
  config,
  associateWorkspace,
}: {
  ids?: Product['id'][];
  slugs?: Product['slug'][];
  search?: string;
  sort?: string;
  categoryids?: (string | number)[];
  page?: string | number;
  limit?: string | number;
  workspace?: Workspace | Cloned<Workspace>;
  config: TenantConfig;
  workspaceConfig?: ShopConfig | Cloned<ShopConfig>;
  user?: User;
  client: Client;
  associateWorkspace?: boolean;
}) {
  if (!(workspace && workspaceConfig && client))
    return {products: [], pageInfo: getPageInfo({count: 0, limit, page})};

  const orderBy = getSortOrder(sort);
  const skip = limit ? getSkip(limit, page) : undefined;

  const {
    priceAfterLogin,
    defaultStockLocation,
    noMoreStockSelect,
    outOfStockQty,
  } = workspaceConfig || {};

  const fromWS = priceAfterLogin === 'fromWS';
  const outOfStockAction =
    noMoreStockSelect ?? OUT_OF_STOCK_TYPE.HIDE_PRODUCT_CANNOT_BUY;

  const hidePrices = await (async () => {
    const {hidePriceForEmptyPricelist} = workspaceConfig || {};
    if (!hidePriceForEmptyPricelist) return false;
    if (!user) return true;
    const mainPartner = await client.aOSPartner.findOne({
      where: {id: getPartnerId(user)},
      select: {salePartnerPriceList: {id: true}},
    });
    return !mainPartner?.salePartnerPriceList?.id;
  })();
  const productFields = getProductFields({
    config: workspaceConfig,
    shouldHidePrices: hidePrices,
  });

  const $filters = getWhereClause({
    ids,
    slugs,
    search,
    categoryids,
    associateWorkspace,
    workspace,
    user,
  });

  let $products: RawProduct[] = [];

  try {
    const isHideOutOfStockProducts =
      outOfStockAction === OUT_OF_STOCK_TYPE.HIDE_PRODUCT_CANNOT_BUY;

    const availableStockProductsIds = defaultStockLocation
      ? await findProductsFromStockLocation({
          client,
          workspace,
          workspaceConfig,
          categoryids,
          associateWorkspace,
          user,
          outOfStockQty: outOfStockQty != null ? Number(outOfStockQty) : null,
        })
      : [];

    if (isHideOutOfStockProducts) {
      const updatedFilters = {
        AND: [
          {
            ...$filters,
          },
          {
            OR: [
              ...(availableStockProductsIds?.length
                ? [
                    {
                      id: {
                        in: availableStockProductsIds,
                      },
                    },
                  ]
                : []),
              {
                stockManaged: {
                  eq: false,
                },
              },
            ],
          },
        ],
      };

      $products = (await client.aOSProduct
        .find({
          where: updatedFilters,
          orderBy,
          take: limit !== undefined ? Number(limit) : undefined,
          ...(skip ? {skip} : {}),
          select: productFields,
        })
        .then(products =>
          products.map(product => ({
            ...product,
            outOfStockConfig: {
              outOfStock: false,
              showMessage: false,
              canBuy: true,
            },
          })),
        )) as RawProduct[];
    } else {
      $products = (await client.aOSProduct
        .find({
          where: $filters,
          orderBy,
          take: limit !== undefined ? Number(limit) : undefined,
          ...(skip ? {skip} : {}),
          select: productFields,
        })
        .then(products =>
          products.map(product => {
            const isAvailable = availableStockProductsIds.some(
              stockProductId => stockProductId === product.id,
            );

            const canBuy =
              isAvailable ||
              [
                OUT_OF_STOCK_TYPE.ALLOW_BUY_WITH_NO_MESSAGE,
                OUT_OF_STOCK_TYPE.ALLOW_BUY_WITH_MESSAGE,
              ].includes(outOfStockAction);

            const showMessage =
              !isAvailable &&
              [
                OUT_OF_STOCK_TYPE.ALLOW_BUY_WITH_MESSAGE,
                OUT_OF_STOCK_TYPE.DONT_ALLOW_BUY_WITH_MESSAGE,
              ].includes(outOfStockAction);

            return {
              ...product,
              outOfStockConfig: {
                outOfStock: !isAvailable,
                showMessage,
                canBuy,
              },
            };
          }),
        )) as RawProduct[];
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    $products = [];
  }

  const appbase = await client.aOSAppBase
    .findOne({
      select: {
        nbDecimalDigitForUnitPrice: true,
      },
    })
    .then(clone);

  const compute = async ({
    product,
    ws,
    wsProduct,
    errorMessage,
  }: {
    product: RawProduct;
    ws?: boolean;
    wsProduct?: WSProduct;
    errorMessage?: string;
  }): Promise<ComputedProduct> => {
    const companyId = workspaceConfig?.company?.id;
    const productcompany = companyId
      ? product?.productCompanyList?.find(
          c => c.company && Number(c.company.id) === Number(companyId),
        )
      : undefined;

    const account = product?.productFamily?.accountManagementList?.[0];

    const getTax = (): ComputedProduct['tax'] => {
      if (hidePrices) return {value: 0};
      if (ws) {
        const wt = Number(
          wsProduct?.prices.find(p => p.type === 'WT')?.price || 0,
        );
        const ati = Number(
          wsProduct?.prices.find(p => p.type === 'ATI')?.price || 0,
        );

        return {
          value:
            wt && ati ? Number(((ati - wt) / wt) * 100) : DEFAULT_TAX_VALUE,
        };
      }

      const activeTax = account?.saleTaxSet?.find(t => t.activeTaxLine);

      const activeTaxLineValue =
        activeTax?.activeTaxLine?.value || DEFAULT_TAX_VALUE;

      return {
        value: productcompany?.company ? activeTaxLineValue : DEFAULT_TAX_VALUE,
      };
    };

    const getScale = (): ComputedProduct['scale'] => {
      if (ws) {
        return {
          unit: DEFAULT_UNIT_PRICE_SCALE,
          currency:
            wsProduct?.prices?.[0]?.price?.split('.')?.[1]?.length ||
            DEFAULT_CURRENCY_SCALE,
        };
      }

      return {
        unit: appbase?.nbDecimalDigitForUnitPrice || DEFAULT_UNIT_PRICE_SCALE,
        currency:
          productcompany?.company?.currency?.numberOfDecimals ||
          DEFAULT_CURRENCY_SCALE,
      };
    };

    const getCurrency = (): Currency => {
      if (ws) {
        return (wsProduct?.currency || {
          symbol: DEFAULT_CURRENCY_SYMBOL,
        }) as Currency;
      }

      return (product?.saleCurrency ||
        productcompany?.company?.currency || {
          symbol: DEFAULT_CURRENCY_SYMBOL,
        }) as Currency;
    };

    const getPrice = async (): Promise<ComputedProduct['price']> => {
      if (hidePrices) return {};
      const value = productcompany?.salePrice || product.salePrice || 0;

      const taxrate = getTax()?.value || 0;

      let ati, wt, displayAti, displayWt;

      const {mainPrice, displayTwoPrices} = workspaceConfig ?? {};

      const currencySymbol = getCurrency().symbol;
      const unitScale = getScale().unit;

      if (ws) {
        wt = wsProduct?.prices.find(p => p.type === 'WT')?.price || 0;
        ati = wsProduct?.prices.find(p => p.type === 'ATI')?.price || 0;
      } else {
        const inati = product.inAti;

        if (inati) {
          ati = Number(value);
          wt = ati - (ati * taxrate) / 100;
        } else {
          wt = Number(value);
          ati = wt + (wt * taxrate) / 100;
        }

        ati = scale(ati, unitScale);
        wt = scale(wt, unitScale);
      }

      displayAti = (await formatNumber(ati, {
        scale: unitScale,
        currency: currencySymbol,
        type: 'DECIMAL',
      })) as string;
      displayWt = (await formatNumber(wt, {
        scale: unitScale,
        currency: currencySymbol,
        type: 'DECIMAL',
      })) as string;

      const primary = mainPrice === MAIN_PRICE.ATI ? ati : wt;
      const secondary = mainPrice === MAIN_PRICE.ATI ? wt : ati;

      const [formattedPrimary, formattedSecondary] = await Promise.all([
        formatNumber(primary, {
          scale: unitScale,
          currency: currencySymbol,
          type: 'DECIMAL',
        }),
        formatNumber(secondary, {
          scale: unitScale,
          currency: currencySymbol,
          type: 'DECIMAL',
        }),
      ]);

      const unitPrimary = mainPrice === MAIN_PRICE.ATI ? 'ATI' : 'WT';
      const unitSecondary = mainPrice === MAIN_PRICE.ATI ? 'WT' : 'ATI';

      const displayPrimary = `${formattedPrimary} ${unitPrimary}`;
      const displaySecondary = `${formattedSecondary} ${unitSecondary}`;

      return {
        ati,
        wt,
        primary,
        secondary,
        displayAti,
        displayWt,
        displayPrimary,
        displaySecondary,
        mainPrice,
        displayTwoPrices: displayTwoPrices === 'yes',
      };
    };

    return {
      product: product as unknown as Product,
      price: await getPrice(),
      tax: getTax(),
      scale: getScale(),
      currency: getCurrency(),
      errorMessage,
    };
  };

  $products = $products.map(p => ({
    ...p,
    images: [
      p?.picture?.id,
      ...(p?.portalImageList || [])?.map(i => i?.picture?.id),
    ].filter((x): x is string => Boolean(x)),
  }));

  const pageInfo = getPageInfo({
    count: $products?.[0]?._count,
    page,
    limit,
  });

  if (fromWS) {
    const productsFromWS = await findProductsFromWS({
      productList: $products.map(p => ({productId: p.id})),
      workspaceConfig,
      user,
      config,
    });

    const originalProduct = (id: number | string) =>
      $products.find(p => Number(p.id) === Number(id));

    return {
      products: await Promise.all(
        productsFromWS.map(wsProduct => {
          const product = originalProduct(wsProduct.productId);
          if (!product) return null;
          if (isProductError(wsProduct)) {
            return compute({
              product,
              errorMessage: wsProduct.errorMessage,
            });
          }
          return compute({product, ws: true, wsProduct});
        }),
      ).then(products => products.filter(Boolean)),
      pageInfo,
    };
  } else {
    return {
      products: await Promise.all($products.map(product => compute({product}))),
      pageInfo,
    };
  }
}

export async function findProduct({
  id,
  workspace,
  workspaceConfig,
  user,
  client,
  config,
  categoryids,
}: {
  id: Product['id'];
  workspace: Workspace | Cloned<Workspace>;
  workspaceConfig: ShopConfig | Cloned<ShopConfig>;
  user?: User;
  client: Client;
  config: TenantConfig;
  categoryids?: (string | number)[];
}) {
  if (!id) {
    return null;
  }

  if (!workspace) {
    return null;
  }

  return findProducts({
    ids: [id],
    workspace,
    workspaceConfig,
    user,
    client,
    config,
    categoryids,
  }).then(({products}) => products?.[0] ?? null);
}

export async function findProductBySlug({
  slug,
  workspace,
  workspaceConfig,
  user,
  client,
  config,
  categoryids,
}: {
  slug: Product['slug'];
  workspace: Workspace | Cloned<Workspace>;
  workspaceConfig: ShopConfig | Cloned<ShopConfig>;
  user?: User;
  client: Client;
  config: TenantConfig;
  categoryids?: (string | number)[];
}) {
  if (!slug) {
    return null;
  }

  if (!workspace) {
    return null;
  }

  return findProducts({
    slugs: [slug],
    workspace,
    workspaceConfig,
    user,
    client,
    config,
    categoryids,
  }).then(({products}) => products?.[0] ?? null);
}

type WSProduct = {
  productId: number;
  prices: [{type: 'WT'; price: string}, {type: 'ATI'; price: string}];
  currency: {currencyId: number; code: string; name: string; symbol: string};
  unit: {name: string; labelToPrinting: string};
  errorMessage?: never;
};

type WSError = {
  productId: number;
  errorMessage: string;
  prices?: never;
  currency?: never;
  unit?: never;
};

type WSObject = WSProduct | WSError;

function isProductError(obj: WSObject): obj is WSError {
  return !!obj.errorMessage;
}

export async function findProductsFromWS({
  workspaceConfig,
  user,
  productList,
  config,
}: {
  workspaceConfig: ShopConfig | Cloned<ShopConfig>;
  user?: User;
  productList: Array<{productId: Product['id']}>;
  config: TenantConfig;
}): Promise<WSObject[]> {
  if (!workspaceConfig?.company?.id && user && productList && config) {
    return [];
  }

  if (!config?.aos?.url) {
    return [];
  }

  const {aos} = config;

  try {
    const res = await aosClient(aos).request<{
      object?: WSObject[];
      data?: {status?: number};
    }>('ws/aos/product/price', {
      body: {
        productList,
        partnerId: user?.id,
        companyId: workspaceConfig?.company?.id,
      },
    });

    if (res?.data?.status === -1) {
      return [];
    }

    return res?.object || [];
  } catch (err) {
    return [];
  }
}

export async function findProductsFromStockLocation({
  client,
  workspace,
  workspaceConfig,
  categoryids,
  associateWorkspace,
  user,
  outOfStockQty,
}: {
  client: Client;
  categoryids?: (string | number)[];
  associateWorkspace?: boolean;
  workspace: Workspace | Cloned<Workspace>;
  workspaceConfig: ShopConfig | Cloned<ShopConfig>;
  user?: User;
  outOfStockQty: number | null | undefined;
}): Promise<string[]> {
  if (!workspaceConfig?.defaultStockLocation || !client) return [];

  try {
    const {defaultStockLocation} = workspaceConfig;

    const filters = {
      AND: [
        {
          stockLocation: {id: defaultStockLocation.id},
        },
        {
          product: {
            ...(categoryids?.length
              ? {
                  portalCategorySet: {id: {in: categoryids}},
                }
              : {}),
            ...(associateWorkspace
              ? {
                  portalWorkspace: {id: workspace.id},
                }
              : {}),
            ...filterPrivate({user}),
          },
        },
        {
          currentQty: {ge: outOfStockQty ?? undefined},
        },
      ],
    };

    const products = (await client.aOSStockLocationLine.find({
      where: filters as Parameters<
        typeof client.aOSStockLocationLine.find
      >[0]['where'],
      select: {product: {id: true}},
    })) as Array<{product?: {id?: string}}>;

    return (
      products
        ?.map(item => item.product?.id)
        .filter((id): id is string => Boolean(id)) || []
    );
  } catch (error) {
    console.error('Error fetching products from stock location:', error);
    return [];
  }
}
