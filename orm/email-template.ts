import lodash from 'lodash';

export type MailConfig = {
  template: {
    subject?: string;
    content: string;
  };
};

export function isValidMailConfig(mailConfig: MailConfig): boolean {
  return Boolean(mailConfig?.template && mailConfig?.template?.content);
}

export function replacePlaceholders({
  content,
  values,
}: {
  content: string;
  values: any;
}) {
  if (!(content && values)) return;

  return content.replace(/\$\{([^}]+)\}/g, (placeholder: string) => {
    const key = placeholder.slice(2, -1);
    return lodash.get(values, key, placeholder);
  });
}
