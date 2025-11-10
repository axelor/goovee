import {manager, type Tenant} from '@/tenant';
import {PartnerAddress, Partner, ID, City} from '@/types';

const addressFields = {
  address: {
    zip: true,
    addressl2: true,
    addressl3: true,
    addressl4: true,
    addressl6: true,
    city: true,
    streetName: true,
    countrySubDivision: true,
    firstName: true,
    lastName: true,
    companyName: true,
    department: true,
    townName: true,
    country: {
      id: true,
      name: true,
    },
    formattedFullName: true,
  },
  isDefaultAddr: true,
  isDeliveryAddr: true,
  isInvoicingAddr: true,
};

export async function findPartnerAddress(
  addressId: PartnerAddress['id'],
  tenantId: Tenant['id'],
) {
  if (!(addressId && tenantId)) return null;

  const client = await manager.getClient(tenantId);

  const address = await client.aOSPartnerAddress.findOne({
    where: {
      id: addressId,
    },
    select: addressFields,
  });

  return address;
}

export async function createPartnerAddress(
  partnerId: Partner['id'],
  values: Partial<PartnerAddress>,
  tenantId: Tenant['id'],
) {
  if (!(partnerId && tenantId)) return null;

  const client = await manager.getClient(tenantId);

  const address = await client.aOSPartnerAddress.create({
    data: {
      partner: {
        select: {
          id: partnerId,
        },
      },
      address: {
        create: {
          ...values.address,
          country: {
            select: {
              id: values?.address?.country?.id,
            },
          },
          townName: values?.address?.townName,
        },
      },
      isInvoicingAddr: values.isInvoicingAddr,
      isDeliveryAddr: values.isDeliveryAddr,
      isDefaultAddr: values.isDefaultAddr,
    },
  });

  if (values.isDeliveryAddr && values?.address?.country?.id) {
    await updatePartnerFiscal({
      partnerId,
      countryId: values.address.country.id,
      tenantId,
      isDeliveryAddr: values.isDeliveryAddr,
      isDefaultAddr: values.isDefaultAddr,
    });
  }

  return address;
}

export async function updatePartnerAddress(
  partnerId: Partner['id'],
  values: Partial<PartnerAddress>,
  tenantId: Tenant['id'],
) {
  const partnerAddressId = values?.id;

  if (!(partnerId && tenantId && partnerAddressId)) return null;

  const partnerAddress = await findPartnerAddress(partnerAddressId, tenantId);

  if (!partnerAddress) return null;

  const client = await manager.getClient(tenantId);

  const address = await client.aOSPartnerAddress.update({
    data: {
      id: values.id as any,
      version: partnerAddress.version as any,
      address: {
        update: {
          ...values.address,
          country: {
            select: {
              id: values?.address?.country?.id,
            },
          },
          townName: values?.address?.townName,
        },
      },
      isInvoicingAddr: values.isInvoicingAddr,
      isDeliveryAddr: values.isDeliveryAddr,
      isDefaultAddr: values.isDefaultAddr,
    },
  });

  if (values.isDeliveryAddr && values?.address?.country?.id) {
    await updatePartnerFiscal({
      partnerId,
      countryId: values.address.country.id,
      tenantId,
      isDeliveryAddr: address?.isDeliveryAddr,
      isDefaultAddr: address?.isDefaultAddr,
    });
  }

  return address;
}

export async function deletePartnerAddress(
  partnerId: Partner['id'],
  addressId: PartnerAddress['id'],
  tenantId: Tenant['id'],
) {
  if (!(partnerId && addressId && tenantId)) return null;

  const client = await manager.getClient(tenantId);

  const address = await client.aOSPartnerAddress.findOne({
    where: {
      partner: {
        id: partnerId,
      },
      id: addressId,
    },
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

export async function findAddresses(
  partnerId: Partner['id'],
  tenantId: Tenant['id'],
) {
  if (!(partnerId && tenantId)) return null;

  const client = await manager.getClient(tenantId);

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
  tenantId: Tenant['id'],
) {
  if (!(partnerId && tenantId)) return null;

  const client = await manager.getClient(tenantId);

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
  tenantId: Tenant['id'],
) {
  if (!(partnerId && tenantId)) return null;

  const client = await manager.getClient(tenantId);

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
  tenantId: Tenant['id'],
) {
  if (!(partnerId && tenantId)) return null;

  const client = await manager.getClient(tenantId);

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
  tenantId: Tenant['id'],
) {
  if (!(partnerId && tenantId)) return null;

  const client = await manager.getClient(tenantId);

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
  tenantId,
  isDefault,
}: {
  partnerAddressId: PartnerAddress['id'];
  partnerId: Partner['id'];
  tenantId: Tenant['id'];
  isDefault?: boolean;
}) {
  if (!(partnerAddressId && partnerId && tenantId)) return null;

  const client = await manager.getClient(tenantId);

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

    const current = await findDefaultDeliveryAddress(partnerId, tenantId);

    if (current && current.id !== result.id && isDefault) {
      await client.aOSPartnerAddress.update({
        data: {
          id: current.id,
          version: current.version,
          isDefaultAddr: false,
        },
      });
    }

    if (result.isInvoicingAddr && isDefault) {
      const current = await findDefaultInvoicingAddress(partnerId, tenantId);

      if (current && current.id !== result.id) {
        await client.aOSPartnerAddress.update({
          data: {
            id: current.id,
            version: current.version,
            isDefaultAddr: false,
          },
        });
      }
    }

    const updatedDefault = await client.aOSPartnerAddress.update({
      data: {
        id: result.id,
        version: result.version,
        isDefaultAddr: isDefault,
      },
    });

    if (isDefault && result.address?.country) {
      await updatePartnerFiscal({
        partnerId,
        countryId: result.address.country.id,
        tenantId,
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
  tenantId: Tenant['id'],
) {
  if (!(partnerId && tenantId)) return null;

  const client = await manager.getClient(tenantId);

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
  tenantId,
  isDefault,
}: {
  partnerAddressId: PartnerAddress['id'];
  partnerId: Partner['id'];
  tenantId: Tenant['id'];
  isDefault?: boolean;
}) {
  if (!(partnerAddressId && partnerId && tenantId)) return null;

  const client = await manager.getClient(tenantId);

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

    const current = await findDefaultInvoicingAddress(partnerId, tenantId);

    if (current && current.id !== result.id && isDefault) {
      await client.aOSPartnerAddress.update({
        data: {
          id: current.id,
          version: current.version,
          isDefaultAddr: false,
        },
      });
    }

    if (result.isDeliveryAddr && isDefault) {
      const current = await findDefaultDeliveryAddress(partnerId, tenantId);

      if (current && current.id !== result.id) {
        await client.aOSPartnerAddress.update({
          data: {
            id: current.id,
            version: current.version,
            isDefaultAddr: false,
          },
        });
      }
    }

    const updatedDefault = await client.aOSPartnerAddress.update({
      data: {
        id: result.id,
        version: result.version,
        isDefaultAddr: isDefault,
      },
    });

    return updatedDefault;
  } catch (err) {
    return null;
  }
}

export async function findCountries(tenantId: Tenant['id']) {
  if (!tenantId) return [];

  const client = await manager.getClient(tenantId);

  const countries = await client.aOSCountry.find();

  return countries;
}

export async function findCountry({
  id,
  tenantId,
}: {
  id: ID;
  tenantId: Tenant['id'];
}) {
  if (!tenantId || !id) return null;

  try {
    const client = await manager.getClient(tenantId);

    const country = await client.aOSCountry.findOne({
      where: {
        id,
      },
    });

    return country;
  } catch (error) {
    console.log('error:', error);
    return null;
  }
}

export async function getFiscalPositionAndPriceListFromCountry({
  countryId,
  tenantId,
}: {
  countryId: ID;
  tenantId: Tenant['id'];
}) {
  if (!countryId || !tenantId)
    return {fiscalPosition: null, partnerPriceList: null};

  try {
    const client = await manager.getClient(tenantId);

    const country = await client.aOSCountry.findOne({
      where: {
        id: countryId,
      },
      select: {
        fiscalPosition: true,
        partnerPriceList: true,
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
  tenantId,
}: {
  partnerId: Partner['id'];
  fiscalPositionId?: ID | null;
  partnerPriceListId?: ID | null;
  tenantId: Tenant['id'];
}) {
  if (!partnerId || !tenantId) return null;

  try {
    const client = await manager.getClient(tenantId);

    const currentPartner = await client.aOSPartner.findOne({
      where: {id: partnerId},
      select: {id: true, version: true},
    });

    if (!currentPartner) return null;

    const updateData: any = {
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
  tenantId,
  isDeliveryAddr,
  isDefaultAddr,
}: {
  partnerId: Partner['id'];
  countryId: any;
  tenantId: Tenant['id'];
  isDeliveryAddr: boolean;
  isDefaultAddr?: boolean;
}) {
  if (!isDeliveryAddr || !countryId) return;

  try {
    const client = await manager.getClient(tenantId);

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
          tenantId,
        });

      if (fiscalPosition || partnerPriceList) {
        await updatePartnerFiscalAndPriceList({
          partnerId,
          fiscalPositionId: fiscalPosition?.id,
          partnerPriceListId: partnerPriceList?.id,
          tenantId,
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
