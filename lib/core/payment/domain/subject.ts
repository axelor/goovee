import {PAYMENT_SOURCE, type PaymentSource} from './types';

/**
 * What a payment is for, as the ERP names it: a model and a record id. One
 * pair instead of one relation per kind of subject, so a source that pays for
 * a new kind of record adds its model here and to the ERP's
 * `portal.payment.subject.select` and `PortalPaymentSubjects`, and no column.
 */
export const SUBJECT_MODEL = {
  invoice: 'com.axelor.apps.account.db.Invoice',
  registration: 'com.axelor.apps.portal.db.Registration',
  marketplaceOrder: 'com.axelor.apps.portal.db.MarketplaceProductOrder',
  orderRequest: 'com.axelor.apps.portal.db.PortalOrderRequest',
} as const;

export type SubjectModel = (typeof SUBJECT_MODEL)[keyof typeof SUBJECT_MODEL];

export type Subject = {model: SubjectModel; id: string};

/* A shop purchase becomes an order request, which the ERP builds its sale
 * order from. */
type SubjectModelsBySource = {
  [PAYMENT_SOURCE.invoices]: typeof SUBJECT_MODEL.invoice;
  [PAYMENT_SOURCE.events]: typeof SUBJECT_MODEL.registration;
  [PAYMENT_SOURCE.marketplace]: typeof SUBJECT_MODEL.marketplaceOrder;
  [PAYMENT_SOURCE.shop]: typeof SUBJECT_MODEL.orderRequest;
};

/** A subject of one of the models the source pays for. */
export type SubjectOf<Source extends PaymentSource> = {
  model: SubjectModelsBySource[Source];
  id: string;
};

type SubjectSpec = {
  /**
   * Whether the record can carry only one payment. An invoice takes several:
   * partial payments, or a shop order's balance paid after its advance.
   */
  exclusive: boolean;
};

const SUBJECTS: Record<SubjectModel, SubjectSpec> = {
  [SUBJECT_MODEL.invoice]: {exclusive: false},
  [SUBJECT_MODEL.registration]: {exclusive: true},
  [SUBJECT_MODEL.marketplaceOrder]: {exclusive: true},
  [SUBJECT_MODEL.orderRequest]: {exclusive: true},
};

/** The columns a subject is written to: its exclusive id is empty for one that takes several payments. */
export function subjectColumns(subject: Subject) {
  return {
    subjectModel: subject.model,
    subjectId: subject.id,
    exclusiveSubjectId: SUBJECTS[subject.model].exclusive ? subject.id : null,
  };
}

/** The payment's subject as stored, or null when it has none yet or names a model we do not know. */
export function readSubject(
  model: string | null,
  id: string | null,
): Subject | null {
  if (!model || !id) {
    return null;
  }
  const known = Object.values(SUBJECT_MODEL).find(value => value === model);
  return known ? {model: known, id} : null;
}

/** The subject's id when it is of the given model, else null. */
export function subjectIdOf(
  subject: Subject | null,
  model: SubjectModel,
): string | null {
  return subject?.model === model ? subject.id : null;
}
