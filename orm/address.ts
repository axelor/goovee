import type {AOSPartnerAddress, AOSPartner} from '@/goovee/.generated/models';
import type {Client} from '@/goovee/.generated/client';
import {PartnerAddress, Partner, ID, Address} from '@/types';
import type {SelectOptions, UpdateArgs, CreateArgs} from '@goovee/orm';

import {aosClient, toAOSPayload, type AOSConfig} from '@/service';

const PARTNER_ADDRESS_MODEL = 'com.axelor.apps.base.db.PartnerAddress';

/* Partner address writes go through AOS's REST API rather than the shared
 * database, so that AOP's audit listener fires and records the change in the
 * record's tracking history.
 *
 * AOS recomputes fields on save (Address.fullName) and bumps the version more
 * than once, so what the callers expect is rebuilt by re-reading through the
 * ORM instead of being derived from the request. That re-read happens inside
 * the caller's transaction while AOS committed the row in its own: it works
 * because the ORM opens transactions at PostgreSQL's default READ COMMITTED
 * level, where each statement sees the latest committed data. A stricter
 * isolation level would make the re-read come back empty. */
async function savePartnerAddressToAOS(
  data: Record<string, unknown>,
  aos: AOSConfig,
): Promise<ID> {
  const saved = await aosClient(aos).save<{id: number | string}>(
    PARTNER_ADDRESS_MODEL,
    toAOSPayload(data),
  );

  return String(saved.id);
}

const addressFields = {
  address: {
    zip: true,
    addressl2: true,
    addressl3: true,
    addressl4: true,
    addressl5: true,
    addressl6: true,
    city: {id: true, name: true, zip: true},
    streetName: true,
    countrySubDivision: true,
    firstName: true,
    lastName: true,
    companyName: true,
    subDepartment: true,
    townName: true,
    country: {
      id: true,
      name: true,
    },
    fullName: true,
    formattedFullName: true,
  },
  isDefaultAddr: true,
  isDeliveryAddr: true,
  isInvoicingAddr: true,
} satisfies SelectOptions<AOSPartnerAddress>;

export async function findPartnerAddress({
  partnerId,
  addressId,
  client,
}: {
  partnerId: Partner['id'];
  addressId: PartnerAddress['id'];
  client: Client;
}) {
  if (!addressId) return null;

  const address = await client.aOSPartnerAddress.findOne({
    where: {
      id: addressId,
      partner: {
        id: partnerId,
      },
    },
    select: addressFields,
  });

  return address;
}

export async function createPartnerAddress(
  partnerId: Partner['id'],
  values: {
    address: Partial<Address>;
    isDeliveryAddr?: boolean | null;
    isInvoicingAddr?: boolean | null;
    isDefaultAddr?: boolean | null;
  },
  client: Client,
  aos: AOSConfig,
) {
  if (!partnerId) return null;

  const addressId = await savePartnerAddressToAOS(
    {
      partner: {
        select: {
          id: partnerId,
        },
      },
      address: {
        create: {
          addressl2: values.address.addressl2,
          addressl3: values.address.addressl3,
          addressl4: values.address.addressl4,
          addressl5: values.address.addressl5,
          addressl6: values.address.addressl6,
          firstName: values.address.firstName,
          lastName: values.address.lastName,
          companyName: values.address.companyName,
          fullName: values.address.fullName,
          formattedFullName: values.address.formattedFullName,
          streetName: values.address.streetName,
          zip: values.address.zip,
          townName: values.address.townName,
          countrySubDivision: values.address.countrySubDivision,
          subDepartment: values.address.subDepartment,
          country: {
            select: {
              id: values.address.country?.id,
            },
          },
          city: values.address.city?.id
            ? {
                select: {
                  id: values.address.city.id,
                },
              }
            : undefined,
        },
      },
      isInvoicingAddr: values.isInvoicingAddr,
      isDeliveryAddr: values.isDeliveryAddr,
      isDefaultAddr: values.isDefaultAddr,
    },
    aos,
  );

  const address = await client.aOSPartnerAddress.findOne({
    where: {id: {eq: addressId}},
    select: {id: true},
  });

  /* Runs after the address is saved, and deliberately outside its write: an
   * HTTP call cannot take part in a database transaction. Should this fail the
   * address still exists with a stale fiscal position, which the next address
   * save recomputes. */
  if (values.isDeliveryAddr && values.address.country?.id) {
    await updatePartnerFiscal({
      partnerId,
      countryId: values.address.country.id,
      client,
      isDeliveryAddr: !!values.isDeliveryAddr,
      isDefaultAddr: !!values.isDefaultAddr,
    });
  }

  return address;
}

export async function updatePartnerAddress(
  partnerId: Partner['id'],
  values: {
    id: ID;
    version: number;
    address: Address;
    isDeliveryAddr?: boolean | null;
    isInvoicingAddr?: boolean | null;
    isDefaultAddr?: boolean | null;
  },
  client: Client,
  aos: AOSConfig,
) {
  const partnerAddressId = values.id;

  if (!(partnerId && partnerAddressId)) return null;

  const partnerAddress = await findPartnerAddress({
    partnerId,
    addressId: partnerAddressId,
    client,
  });

  if (!partnerAddress) return null;

  const savedId = await savePartnerAddressToAOS(
    {
      id: values.id,
      version: partnerAddress.version,
      partner: {
        select: {
          id: partnerId,
        },
      },
      address: {
        update: {
          id: values.address.id,
          version: values.address.version,
          addressl2: values.address.addressl2,
          addressl3: values.address.addressl3,
          addressl4: values.address.addressl4,
          addressl5: values.address.addressl5,
          addressl6: values.address.addressl6,
          firstName: values.address.firstName,
          lastName: values.address.lastName,
          companyName: values.address.companyName,
          fullName: values.address.fullName,
          formattedFullName: values.address.formattedFullName,
          streetName: values.address.streetName,
          zip: values.address.zip,
          townName: values.address.townName,
          countrySubDivision: values.address.countrySubDivision,
          subDepartment: values.address.subDepartment,
          country: {
            select: {
              id: values.address.country?.id,
            },
          },
          city: values.address.city?.id
            ? {
                select: {
                  id: values.address.city.id,
                },
              }
            : undefined,
        },
      },
      isInvoicingAddr: values.isInvoicingAddr,
      isDeliveryAddr: values.isDeliveryAddr,
      isDefaultAddr: values.isDefaultAddr,
    },
    aos,
  );

  const address = await client.aOSPartnerAddress.findOne({
    where: {id: {eq: savedId}},
    select: {id: true, isDeliveryAddr: true, isDefaultAddr: true},
  });

  /* See createPartnerAddress: the fiscal alignment runs after the address is
   * saved and outside its write. */
  if (values.isDeliveryAddr && values.address.country?.id) {
    await updatePartnerFiscal({
      partnerId,
      countryId: values.address.country.id,
      client,
      isDeliveryAddr: !!address?.isDeliveryAddr,
      isDefaultAddr: !!address?.isDefaultAddr,
    });
  }

  return address;
}

export async function deletePartnerAddress(
  partnerId: Partner['id'],
  addressId: PartnerAddress['id'],
  client: Client,
) {
  if (!(partnerId && addressId)) return null;

  const address = await client.aOSPartnerAddress.findOne({
    where: {
      partner: {
        id: partnerId,
      },
      id: addressId,
    },
    select: {id: true},
  });

  if (!address) return null;

  try {
    return client.aOSPartnerAddress.delete({
      id: address.id as any,
      version: address.version as any,
    });
  } catch (err) {
    return null;
  }
}

export async function findAddresses(partnerId: Partner['id'], client: Client) {
  if (!partnerId) return null;

  const addresses = await client.aOSPartnerAddress.find({
    where: {
      partner: {
        id: partnerId,
      },
    },
    select: addressFields,
  });

  return addresses;
}

export async function findDeliveryAddresses(
  partnerId: Partner['id'],
  client: Client,
) {
  if (!partnerId) return null;

  const addresses = await client.aOSPartnerAddress.find({
    where: {
      partner: {
        id: partnerId,
      },
      isDeliveryAddr: true,
    },
    select: addressFields,
    orderBy: {
      id: 'DESC',
    },
  });

  return addresses;
}

export async function findInvoicingAddresses(
  partnerId: Partner['id'],
  client: Client,
) {
  if (!partnerId) return null;

  const addresses = await client.aOSPartnerAddress.find({
    where: {
      partner: {
        id: partnerId,
      },
      isInvoicingAddr: true,
    },
    select: addressFields,
    orderBy: {
      id: 'DESC',
    },
  });

  return addresses;
}

export async function findDefaultAddress(
  partnerId: Partner['id'],
  client: Client,
) {
  if (!partnerId) return null;

  const addresses = await client.aOSPartnerAddress.findOne({
    where: {
      partner: {
        id: partnerId,
      },
      isDefaultAddr: true,
    },
    select: addressFields,
  });

  return addresses;
}

export async function findDefaultDeliveryAddress(
  partnerId: Partner['id'],
  client: Client,
) {
  if (!partnerId) return null;

  const result = await client.aOSPartnerAddress.findOne({
    where: {
      partner: {
        id: partnerId,
      },
      isDefaultAddr: true,
      isDeliveryAddr: true,
    },
    select: addressFields,
  });

  return result;
}

export async function updateDefaultDeliveryAddress({
  partnerAddressId,
  partnerId,
  client,
  isDefault,
}: {
  partnerAddressId: PartnerAddress['id'];
  partnerId: Partner['id'];
  client: Client;
  isDefault?: boolean;
}) {
  if (!(partnerAddressId && partnerId)) return null;

  try {
    const result = await client.aOSPartnerAddress.findOne({
      where: {
        partner: {
          id: partnerId,
        },
        id: partnerAddressId,
      },
      select: addressFields,
    });

    if (!result) return null;

    const current = await findDefaultDeliveryAddress(partnerId, client);

    if (current && current.id !== result.id && isDefault) {
      await client.aOSPartnerAddress.update({
        data: {
          id: current.id,
          version: current.version,
          isDefaultAddr: false,
        },
        select: {id: true},
      });
    }

    if (result.isInvoicingAddr && isDefault) {
      const current = await findDefaultInvoicingAddress(partnerId, client);

      if (current && current.id !== result.id) {
        await client.aOSPartnerAddress.update({
          data: {
            id: current.id,
            version: current.version,
            isDefaultAddr: false,
          },
          select: {id: true},
        });
      }
    }

    const updatedDefault = await client.aOSPartnerAddress.update({
      data: {
        id: result.id,
        version: result.version,
        isDefaultAddr: isDefault,
      },
      select: {id: true},
    });

    if (isDefault && result.address?.country) {
      await updatePartnerFiscal({
        partnerId,
        countryId: result.address.country.id,
        client,
        isDeliveryAddr: true,
        isDefaultAddr: isDefault,
      });
    }

    return updatedDefault;
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function findDefaultInvoicingAddress(
  partnerId: Partner['id'],
  client: Client,
) {
  if (!partnerId) return null;

  const result = await client.aOSPartnerAddress.findOne({
    where: {
      partner: {
        id: partnerId,
      },
      isDefaultAddr: true,
      isInvoicingAddr: true,
    },
    select: addressFields,
  });

  return result;
}

export async function updateDefaultInvoicingAddress({
  partnerAddressId,
  partnerId,
  client,
  isDefault,
}: {
  partnerAddressId: PartnerAddress['id'];
  partnerId: Partner['id'];
  client: Client;
  isDefault?: boolean;
}) {
  if (!(partnerAddressId && partnerId)) return null;

  try {
    const result = await client.aOSPartnerAddress.findOne({
      where: {
        partner: {
          id: partnerId,
        },
        id: partnerAddressId,
      },
      select: addressFields,
    });

    if (!result) return null;

    const current = await findDefaultInvoicingAddress(partnerId, client);

    if (current && current.id !== result.id && isDefault) {
      await client.aOSPartnerAddress.update({
        data: {
          id: current.id,
          version: current.version,
          isDefaultAddr: false,
        },
        select: {id: true},
      });
    }

    if (result.isDeliveryAddr && isDefault) {
      const current = await findDefaultDeliveryAddress(partnerId, client);

      if (current && current.id !== result.id) {
        await client.aOSPartnerAddress.update({
          data: {
            id: current.id,
            version: current.version,
            isDefaultAddr: false,
          },
          select: {id: true},
        });
      }
    }

    const updatedDefault = await client.aOSPartnerAddress.update({
      data: {
        id: result.id,
        version: result.version,
        isDefaultAddr: isDefault,
      },
      select: {id: true},
    });

    return updatedDefault;
  } catch (err) {
    return null;
  }
}

/**
 * Smart address book — assign a partner address as the default for a given
 * kind. Ensures the address carries the matching type flag (so it stays
 * eligible, e.g. for checkout selection), then reuses the per-kind default
 * updater which enforces a single default and handles the shared
 * `isDefaultAddr` flag across types.
 */
export async function assignDefaultAddress({
  partnerId,
  partnerAddressId,
  kind,
  client,
}: {
  partnerId: Partner['id'];
  partnerAddressId: PartnerAddress['id'];
  kind: 'invoicing' | 'delivery';
  client: Client;
}) {
  if (!(partnerId && partnerAddressId)) return null;

  const partnerAddress = await client.aOSPartnerAddress.findOne({
    where: {id: partnerAddressId, partner: {id: partnerId}},
    select: {isInvoicingAddr: true, isDeliveryAddr: true},
  });

  if (!partnerAddress) return null;

  const typeField = kind === 'invoicing' ? 'isInvoicingAddr' : 'isDeliveryAddr';

  if (!partnerAddress[typeField]) {
    await client.aOSPartnerAddress.update({
      data: {
        id: partnerAddress.id,
        version: partnerAddress.version,
        [typeField]: true,
      },
      select: {id: true},
    });
  }

  return kind === 'invoicing'
    ? updateDefaultInvoicingAddress({
        partnerAddressId,
        partnerId,
        client,
        isDefault: true,
      })
    : updateDefaultDeliveryAddress({
        partnerAddressId,
        partnerId,
        client,
        isDefault: true,
      });
}

export async function findCountries(client: Client) {
  const countries = await client.aOSCountry.find({
    select: {name: true},
  });

  return countries;
}

export async function findCountry({id, client}: {id: ID; client: Client}) {
  if (!id) return null;

  try {
    const country = await client.aOSCountry.findOne({
      where: {
        id,
      },
      select: {name: true},
    });

    return country;
  } catch (error) {
    console.log('error:', error);
    return null;
  }
}

export async function getFiscalPositionAndPriceListFromCountry({
  countryId,
  client,
}: {
  countryId: ID;
  client: Client;
}) {
  if (!countryId) return {fiscalPosition: null, partnerPriceList: null};

  try {
    const country = await client.aOSCountry.findOne({
      where: {
        id: countryId,
      },
      select: {
        fiscalPosition: {id: true},
        partnerPriceList: {id: true},
      },
    });

    return {
      fiscalPosition: country?.fiscalPosition || null,
      partnerPriceList: country?.partnerPriceList || null,
    };
  } catch (error) {
    console.error(
      'Error fetching fiscal position and price list from country:',
      error,
    );
    return {fiscalPosition: null, partnerPriceList: null};
  }
}

export async function updatePartnerFiscalAndPriceList({
  partnerId,
  fiscalPositionId,
  partnerPriceListId,
  client,
}: {
  partnerId: Partner['id'];
  fiscalPositionId?: ID | null;
  partnerPriceListId?: ID | null;
  client: Client;
}) {
  if (!partnerId) return null;

  try {
    const currentPartner = await client.aOSPartner.findOne({
      where: {id: partnerId},
      select: {id: true, version: true},
    });

    if (!currentPartner) return null;

    const updateData: UpdateArgs<AOSPartner> = {
      id: partnerId,
      version: currentPartner.version,
    };

    if (fiscalPositionId) {
      updateData.fiscalPosition = {select: {id: fiscalPositionId}};
    }

    if (partnerPriceListId) {
      updateData.salePartnerPriceList = {select: {id: partnerPriceListId}};
    }

    if (Object.keys(updateData).length === 2) return null;

    const updatedPartner = await client.aOSPartner.update({
      data: updateData,
      select: {id: true},
    });

    return updatedPartner;
  } catch (error) {
    console.error(
      'Error updating partner fiscal position and price list:',
      error,
    );
    return null;
  }
}

async function updatePartnerFiscal({
  partnerId,
  countryId,
  client,
  isDeliveryAddr,
  isDefaultAddr,
}: {
  partnerId: Partner['id'];
  countryId: any;
  client: Client;
  isDeliveryAddr: boolean;
  isDefaultAddr?: boolean;
}) {
  if (!isDeliveryAddr || !countryId) return;

  try {
    let addressesCount = 0;
    const existingAddresses = await client.aOSPartnerAddress.find({
      where: {
        partner: {
          id: partnerId,
        },
      },
      select: {id: true},
    });
    addressesCount = existingAddresses.length;

    if (addressesCount === 1 || isDefaultAddr) {
      const {fiscalPosition, partnerPriceList} =
        await getFiscalPositionAndPriceListFromCountry({
          countryId,
          client,
        });

      if (fiscalPosition || partnerPriceList) {
        await updatePartnerFiscalAndPriceList({
          partnerId,
          fiscalPositionId: fiscalPosition?.id,
          partnerPriceListId: partnerPriceList?.id,
          client,
        });
      }
    }
  } catch (error) {
    console.error(
      'Error updating partner fiscal position and price list:',
      error,
    );
  }
}
