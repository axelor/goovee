export type Theme = {
  colors?: {
    background?: string;
    foreground?: string;

    card?: string;
    'card-foreground'?: string;

    popover?: string;
    'popover-foreground'?: string;

    primary?: string;
    'primary-foreground'?: string;

    secondary?: string;
    'secondary-foreground'?: string;

    muted?: string;
    'muted-foreground'?: string;

    accent?: string;
    'accent-foreground'?: string;

    'destructive-light'?: string;
    destructive?: string;
    'destructive-dark'?: string;
    'destructive-foreground'?: string;

    'success-light'?: string;
    success?: string;
    'success-dark'?: string;
    'success-foreground'?: string;

    gray?: string;
    'gray-light'?: string;
    'gray-dark'?: string;
    'gray-fog'?: string;

    border?: string;
    input?: string;
    ring?: string;

    /* Redesign primary accent (sidebar, CTAs). CSS vars: --royal,
     * --royal-dark, --royal-light, --royal-pale, --royal-border. */
    royal?: {
      default?: string;
      dark?: string;
      light?: string;
      pale?: string;
      border?: string;
    };

    /* Redesign semantic success accent. CSS vars: --mint-50 … --mint-900. */
    mint?: Partial<
      Record<
        | '50'
        | '100'
        | '200'
        | '300'
        | '400'
        | '500'
        | '600'
        | '700'
        | '800'
        | '900',
        string
      >
    >;

    /* Redesign neutral scale (text, surfaces, borders). CSS vars:
     * --ink-0, --ink-25, --ink-50 … --ink-900. */
    ink?: Partial<
      Record<
        | '0'
        | '25'
        | '50'
        | '100'
        | '150'
        | '200'
        | '300'
        | '400'
        | '500'
        | '600'
        | '700'
        | '800'
        | '900',
        string
      >
    >;

    palette?: Record<string, Record<string, string>>;
  };
  radius?: string;
};

export type ColorPalette =
  | 'indigo'
  | 'red'
  | 'blue'
  | 'lightblue'
  | 'cyan'
  | 'teal'
  | 'pink'
  | 'green'
  | 'lightgreen'
  | 'lime'
  | 'yellow'
  | 'amber'
  | 'orange'
  | 'deeporange'
  | 'brown'
  | 'grey'
  | 'bluegrey'
  | 'black'
  | 'white'
  | 'purple'
  | 'deeppurple';
