export type AOSPayload = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/* Returned instead of a value when the field must not reach AOS at all. */
const OMIT = Symbol('omit');

function toAOSValue(key: string, value: unknown): unknown | typeof OMIT {
  if (key === 'id' || key === 'version') return Number(value);

  /* A list sent over ws/rest REPLACES the collection instead of adding to it,
   * so a to-many write must never be translated silently. The sites that
   * manipulate collections keep writing through the ORM on purpose. */
  if (isRecord(value)) {
    for (const op of ['select', 'create', 'update', 'remove'] as const) {
      if (Array.isArray(value[op])) {
        throw new Error(
          `toAOSPayload: refusing to translate the collection "${key}" ` +
            `(a ws/rest list replaces the collection); write it through the ORM`,
        );
      }
    }
  }

  if (isRecord(value) && isRecord(value.select)) {
    const id = value.select.id;
    /* A relation resolved from an optional source (`country?.id`) arrives as
     * {select: {id: undefined}}; sending {id: NaN} would fail the save. */
    if (id == null) return OMIT;
    return {id: Number(id)};
  }

  /* AOP accepts a nested record for a to-one relation, so an inline create
   * translates to the record itself. */
  if (isRecord(value) && isRecord(value.create)) {
    return toAOSPayload(value.create);
  }

  if (isRecord(value) && isRecord(value.update)) {
    return toAOSPayload(value.update);
  }

  return value;
}

/* Fields the Goovee schema spells differently from AOS, on the same column.
 * `password` sits on `portal_password`, which AOS declares as `portalPassword`;
 * the five address lines are `addressL2`..`addressL6` in axelor-base, with a
 * capital L, and dropping the rename makes AOS ignore them without a word. */
const FIELD_RENAMES: Record<string, string> = {
  password: 'portalPassword',
  addressl2: 'addressL2',
  addressl3: 'addressL3',
  addressl4: 'addressL4',
  addressl5: 'addressL5',
  addressl6: 'addressL6',
};

/* Recomputed by AOS on save (PartnerService, AddressService). Sending them
 * would be ignored at best, and lets Goovee's own concatenation drift from the
 * ERP convention at worst. */
const COMPUTED_FIELDS = new Set(['fullName', 'simpleFullName']);

export function toAOSPayload(data: Record<string, unknown>): AOSPayload {
  const payload: AOSPayload = {};

  for (const [key, value] of Object.entries(data)) {
    if (COMPUTED_FIELDS.has(key) || value === undefined) continue;

    const aosValue = toAOSValue(key, value);
    if (aosValue === OMIT) continue;

    payload[FIELD_RENAMES[key] ?? key] = aosValue;
  }

  return payload;
}
