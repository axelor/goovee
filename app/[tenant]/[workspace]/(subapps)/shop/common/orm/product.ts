import axios from 'axios';

// ---- CORE IMPORTS ---- //
import {clone, scale} from '@/utils';
import {
  DEFAULT_CURRENCY_SCALE,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_PAGE,
  DEFAULT_TAX_VALUE,
  DEFAULT_UNIT_PRICE_SCALE,
  MAIN_PRICE,
  OUT_OF_STOCK_TYPE,
} from '@/constants';
import type {
  Product,
  Currency,
  ComputedProduct,
  PortalWorkspace,
  User,
} from '@/types';
import {manager, type Tenant} from '@/tenant';
import {filterPrivate} from '@/orm/filter';
import {formatNumber} from '@/locale/server/formatters';
import {shouldHidePricesAndPurchase} from '@/orm/product';

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
  workspace,
  shouldHidePrices,
}: {
  workspace: PortalWorkspace;
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
            id: workspace?.config?.company?.id,
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
    slug: true,
  }) as const;

const getWhereClause = async ({
  ids,
  slugs,
  search,
  categoryids,
  associateWorkspace,
  workspace,
  tenantId,
  user,
  archived,
}: {
  ids?: Product['id'][];
  slugs?: Product['slug'][];
  search?: string;
  categoryids?: (string | number)[];
  associateWorkspace?: boolean;
  tenantId: Tenant['id'];
  workspace: PortalWorkspace;
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
      await filterPrivate({tenantId, user}),
      archived ? {archived: true} : {OR: [{archived: false}, {archived: null}]},
    ],
  };

  return whereClause;
};

function getSortOrder(sort?: string) {
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
  user,
  tenantId,
  associateWorkspace,
}: {
  ids?: Product['id'][];
  slugs?: Product['slug'][];
  search?: string;
  sort?: string;
  categoryids?: (string | number)[];
  page?: string | number;
  limit?: string | number;
  workspace?: PortalWorkspace;
  user?: User;
  tenantId: Tenant['id'];
  associateWorkspace?: boolean;
}) {
  if (!(workspace && workspace.config && tenantId)) return [];

  const client = await manager.getClient(tenantId);

  const orderBy = getSortOrder(sort);
  const skip = Number(limit) * Math.max(Number(page) - 1, 0);

  const {
    priceAfterLogin,
    defaultStockLocation,
    noMoreStockSelect,
    outOfStockQty,
  } = workspace.config || {};

  const fromWS = priceAfterLogin === 'fromWS';
  const outOfStockAction =
    noMoreStockSelect ?? OUT_OF_STOCK_TYPE.HIDE_PRODUCT_CANNOT_BUY;

  const hidePrices = await shouldHidePricesAndPurchase({
    user,
    workspace,
    tenantId,
  });
  const productFields = getProductFields({
    workspace,
    shouldHidePrices: hidePrices,
  });

  const $filters: any = await getWhereClause({
    ids,
    slugs,
    search,
    categoryids,
    associateWorkspace,
    workspace,
    tenantId,
    user,
  });

  let $products: any[] = [];

  try {
    const isHideOutOfStockProducts =
      outOfStockAction === OUT_OF_STOCK_TYPE.HIDE_PRODUCT_CANNOT_BUY;

    const availableStockProductsIds = defaultStockLocation
      ? await findProductsFromStockLocation({
          tenantId,
          workspace,
          categoryids,
          associateWorkspace,
          user,
          outOfStockQty,
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

      $products = await client.aOSProduct
        .find({
          where: updatedFilters,
          orderBy: orderBy as any,
          take: limit as any,
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
        );
    } else {
      $products = await client.aOSProduct
        .find({
          where: $filters,
          orderBy: orderBy as any,
          take: limit as any,
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
        );
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
    product: any;
    ws?: boolean;
    wsProduct?: WSProduct;
    errorMessage?: string;
  }) => {
    const productcompany =
      workspace?.config?.company?.id &&
      product?.productCompanyList?.find(
        (c: any) =>
          c.company &&
          Number(c.company.id) === Number(workspace?.config?.company?.id),
      );

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

      const activeTax = account?.saleTaxSet?.find((t: any) => t.activeTaxLine);

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
        return (
          wsProduct?.currency || {
            symbol: DEFAULT_CURRENCY_SYMBOL,
          }
        );
      }

      return (
        product?.saleCurrency ||
        productcompany?.company?.currency || {
          symbol: DEFAULT_CURRENCY_SYMBOL,
        }
      );
    };

    const getPrice = async (): Promise<ComputedProduct['price']> => {
      if (hidePrices) return {};
      const value = productcompany?.salePrice || product.salePrice || 0;

      const taxrate = getTax()?.value || 0;

      let ati, wt, displayAti, displayWt;

      const {config = {}}: any = workspace;
      const {mainPrice, displayTwoPrices} = config;

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

      let primary = mainPrice === MAIN_PRICE.ATI ? ati : wt;
      let secondary = mainPrice === MAIN_PRICE.ATI ? wt : ati;

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
      product,
      price: await getPrice(),
      tax: getTax(),
      scale: getScale(),
      currency: getCurrency(),
      errorMessage,
    };
  };

  $products = ($products || []).map((p: any) => ({
    ...p,
    images: [
      p?.picture?.id,
      ...(p?.portalImageList || [])?.map((i: any) => i?.picture?.id),
    ].filter(Boolean),
  }));

  const pageInfo = getPageInfo({
    count: $products?.[0]?._count,
    page,
    limit,
  });

  if (fromWS) {
    const productsFromWS = await findProductsFromWS({
      productList: $products.map(p => ({productId: p.id})),
      workspace,
      user,
      tenantId,
    });

    const originalProduct = (id: any) =>
      $products.find((p: any) => Number(p.id) === Number(id));

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
      products: await Promise.all(
        $products.map((product: any) => compute({product})),
      ),
      pageInfo,
    };
  }
}

export async function findProduct({
  id,
  workspace,
  user,
  tenantId,
  categoryids,
}: {
  id: Product['id'];
  workspace: PortalWorkspace;
  user?: User;
  tenantId: Tenant['id'];
  categoryids?: (string | number)[];
}) {
  if (!id) {
    return null;
  }

  if (!workspace) {
    return null;
  }

  return findProducts({ids: [id], workspace, user, tenantId, categoryids}).then(
    ({products}: any = {}) => products && products[0],
  );
}

export async function findProductBySlug({
  slug,
  workspace,
  user,
  tenantId,
  categoryids,
}: {
  slug: Product['slug'];
  workspace: PortalWorkspace;
  user?: User;
  tenantId: Tenant['id'];
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
    user,
    tenantId,
    categoryids,
  }).then(({products}: any = {}) => products && products[0]);
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
  workspace,
  user,
  productList,
  tenantId,
}: {
  workspace: PortalWorkspace;
  user?: User;
  productList: Array<{productId: Product['id']}>;
  tenantId: Tenant['id'];
}): Promise<WSObject[]> {
  if (!workspace?.config?.company?.id && user && productList && tenantId) {
    return [];
  }

  const tenant = await manager.getTenant(tenantId);

  if (!tenant?.config?.aos?.url) {
    return [];
  }

  const {aos} = tenant.config;

  const ws = `${aos.url}/ws/aos/product/price`;

  try {
    const res = await axios
      .post(
        ws,
        {
          productList,
          partnerId: user?.id,
          companyId: workspace?.config?.company?.id,
        },
        {
          auth: {
            username: aos.auth.username,
            password: aos.auth.password,
          },
        },
      )
      .then(({data}) => data);

    if (res?.data?.status === -1) {
      return [];
    }

    return res?.object || [];
  } catch (err) {
    return [];
  }
}

export async function findProductsFromStockLocation({
  tenantId,
  workspace,
  categoryids,
  associateWorkspace,
  user,
  outOfStockQty,
}: {
  tenantId: Tenant['id'];
  categoryids?: (string | number)[];
  associateWorkspace?: boolean;
  workspace: PortalWorkspace;
  user?: User;
  outOfStockQty: any;
}): Promise<string[]> {
  if (!workspace?.config?.defaultStockLocation || !tenantId) return [];

  try {
    const client = await manager.getClient(tenantId);
    if (!client) return [];

    const {defaultStockLocation} = workspace.config;

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
            ...(await filterPrivate({tenantId, user})),
          },
        },
        {
          currentQty: {ge: outOfStockQty},
        },
      ],
    };

    const products = await client.aOSStockLocationLine.find({
      where: filters,
      select: {product: {id: true}},
    });

    return products?.map((item: any) => item.product.id) || [];
  } catch (error) {
    console.error('Error fetching products from stock location:', error);
    return [];
  }
}
