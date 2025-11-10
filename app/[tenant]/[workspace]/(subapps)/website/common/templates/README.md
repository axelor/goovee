# Website Templates

This document provides a guide on how to create, manage, and seed new website templates.

## Introduction

The template system is designed to allow developers to easily create new reusable components that can be managed through the CMS. Each template consists of a React component for rendering, a schema that defines its structure and fields, and demo data for seeding content.

## Template Structure

Each template is located in its own directory within the `templates` folder. The structure for a typical template (e.g., `about-1`) is as follows:

```
/templates
└── /about-1
    ├── index.tsx    // The React component with a default export
    └── meta.ts      // Defines the schema and demos
```

- **`index.tsx`**: The React component that renders the template. It receives a `data` prop containing the content and must be a **default export**.
- **`meta.ts`**: Defines the `schema` for the template and provides `demos` (example data) for seeding.

## Adding a New Template

To add a new template, follow these steps:

1.  **Create the Template Folder**:
    Create a new folder for your template inside the `app/[tenant]/[workspace]/(subapps)/website/common/templates` directory. The folder name should be `kebab-case`.

    _Example: `my-new-template`_

2.  **Define the Schema and Demos (`meta.ts`)**:
    First, create a `meta.ts` file to define the template's structure, fields, and demo content. The schema variable should be `camelCase`.

    ```ts
    // app/.../templates/my-new-template/meta.ts
    import {
      Template,
      type Data, // Import the Data type helper
      type Demo,
      type TemplateSchema,
    } from '../../types/templates';

    // Code should be camelCase
    export const myNewTemplateCode = 'myNewTemplate';

    // Use 'as const satisfies TemplateSchema' for strict type-checking.
    export const myNewTemplateSchema = {
      // Title is the display name (Start Case)
      title: 'My New Template',
      code: myNewTemplateCode,
      type: Template.block,
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          required: true,
          defaultValue: 'Default Title', // Example of a default value
        },
        {
          name: 'subTitle',
          title: 'Sub Title',
          type: 'string',
        },
        {
          name: 'description',
          title: 'Description',
          type: 'string',
        },
      ],
    } as const satisfies TemplateSchema;

    // (Recommended) Create a type alias for this template's specific data shape.
    export type MyNewTemplateData = Data<typeof myNewTemplateSchema>;

    // Define the demo data, strongly typed with the schema.
    export const myNewTemplateDemos: Demo<typeof myNewTemplateSchema>[] = [
      {
        language: 'en_US',
        site: 'en', // The site slug
        page: 'home', // The page slug
        sequence: 1,
        data: {
          myNewTemplateTitle: 'Hello World',
          myNewTemplateSubTitle: 'A subtitle example',
          myNewTemplateDescription: 'This is a new template',
        },
      },
    ];
    ```

3.  **Create the React Component (`index.tsx`)**:
    Next, create the `index.tsx` file for your component. Use the `Data` type alias you just created to strongly type the component's props. The component must be a **default export**.

    ```tsx
    // app/.../templates/my-new-template/index.tsx
    import {TemplateProps} from '../types';
    import type {MyNewTemplateData} from './meta'; // Import the data type

    // Use the data type alias for TemplateProps
    export default function MyNewTemplate({
      data,
    }: TemplateProps<MyNewTemplateData>) {
      return (
        <div>
          {/* Demo data keys are camelCase(code) + Capitalize(camelCase(fieldName)) */}
          <h1>{data.myNewTemplateTitle}</h1>
          <h2>{data.myNewTemplateSubTitle}</h2>
          <p>{data.myNewTemplateDescription}</p>
        </div>
      );
    }
    ```

4.  **Register the Template**:

    - In `app/[tenant]/[workspace]/(subapps)/website/common/templates/index.ts`, import your new template's `code` and add the component to the `componentMap`.

      ```ts
      // app/.../templates/index.ts
      // ... other imports
      import {myNewTemplateCode} from './my-new-template/meta';

      const componentMap: Record<string, ComponentType<TemplateProps>> = {
        // ... other templates
        [myNewTemplateCode]: dynamic(() => import('./my-new-template')),
      };
      ```

    - In `app/[tenant]/[workspace]/(subapps)/website/common/templates/metas.ts`, import your new template's schema and demos and add them to the `metas` array.

      ```ts
      // app/.../templates/metas.ts
      // ... other imports
      import {
        myNewTemplateDemos,
        myNewTemplateSchema,
      } from './my-new-template/meta';

      export const metas = [
        // ... other metas
        {schema: myNewTemplateSchema, demos: myNewTemplateDemos},
      ];
      ```

    - If your template uses any plugins, register them in `app/[tenant]/[workspace]/(subapps)/website/common/templates/plugins-map.ts`. The available plugins are: `progress-bar`, `lightbox`, `tooltip`, `nested-dropdown`, `clipboard`, `replace-me`.

      ```ts
      // app/.../templates/plugins-map.ts
      // ... other imports
      import {myNewTemplateCode} from './my-new-template/meta';

      const pluginsMap = {
        // ... other templates
        [myNewTemplateCode]: ['plugin-name'], // Replace 'plugin-name' with the actual plugin(s) your template uses
      };
      ```

## Advanced: Models and Selections

### Defining and Using Models

Models allow you to define complex, structured data types that can be used as fields within your template. They can be defined in two ways:

<details>
<summary>Model Field Properties</summary>

> **Model Field Properties:** When defining fields **inside a `Model`**, you can (and should) use these additional properties to control how model records are displayed in the CMS:
>
> - **`nameField`** (boolean): If `true`, this field's value is used as the display name for a record of that model (e.g., in dropdowns or search results). **Rule:** Each model must have exactly one `nameField`.
> - **`visibleInGrid`** (boolean): If `true`, this field will appear as a column when a list of records is shown in a table view. **Rule:** Each model must have at least one field with `visibleInGrid: true`.
>
> These properties do not apply to the top-level fields in a `TemplateSchema`.

</details>

**1. Reusable Models (External)**

For models that can be shared across multiple templates, define them in `app/[tenant]/[workspace]/(subapps)/website/common/templates/json-models.ts`.

- **Benefit**: Reusability and a single source of truth.
- **Rule**: Must be exported `as const` and have a unique name. The system requires referential equality, meaning if you use a model with the same name elsewhere, it must be the exact same imported object.

_`json-models.ts` Example:_

```ts
// Use 'as const satisfies Model' for strict type-checking
export const accordionModel = {
  name: 'Accordion',
  title: 'Accordions',
  fields: [
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      nameField: true, // This is the display name for an Accordion record
      visibleInGrid: true,
    },
    {
      name: 'body',
      title: 'Body',
      type: 'string',
      // Not visible in the grid view
    },
  ],
} as const satisfies Model;
```

_Usage in a Template Schema:_

```ts
// my-template/meta.ts
import {accordionModel} from '../json-models';
import type {TemplateSchema} from '../../types/templates';

export const myTemplateSchema = {
  code: 'myTemplate',
  title: 'My Template',
  type: Template.block,
  fields: [
    {
      name: 'items',
      title: 'Accordion Items',
      type: 'json-one-to-many',
      target: 'Accordion', // Target the model by its 'name'
    },
  ],
  // IMPORTANT: Include the imported model here
  models: [accordionModel],
} as const satisfies TemplateSchema;
```

**2. Template-Specific Models (Inline)**

For models used only within a single template, you can define them directly inside the schema's `models` array.

- **Benefit**: Colocation with the template that uses it.
- **Rule**: To ensure the model name is unique across the entire system, you **must** prepend your template's `code` to the model's `name`.

_`my-new-template/meta.ts` Example:_

```ts
import type {TemplateSchema} from '../../types/templates';

export const myNewTemplateSchema = {
  code: 'myNewTemplate',
  title: 'My New Template',
  type: Template.block,
  fields: [
    {
      name: 'items',
      title: 'Items',
      type: 'json-one-to-many',
      target: 'myNewTemplateItem', // Target the inline model by its name
    },
  ],
  // Define the model directly inside the `models` array
  models: [
    {
      // Prepend schema code to ensure uniqueness
      name: 'myNewTemplateItem',
      title: 'Item',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          nameField: true, // This is the display name
          visibleInGrid: true,
        },
      ],
    },
  ],
  selections: [],
} as const satisfies TemplateSchema;
```

> **Note: Models can also contain nested submodels and selections, allowing for highly complex and structured data definitions.**

### Defining and Using Selections

Selections provide a list of choices for a field, rendered as a dropdown.

**1. Inline Selection**

For a simple, non-reusable list of options, define it directly on the field.

_Example:_

```ts
// ...
fields: [
  {
    name: 'alignment',
    title: 'Alignment',
    type: 'string',
    // Define options directly
    selection: [
      {title: 'Left', value: 'left'},
      {title: 'Center', value: 'center'},
      {title: 'Right', value: 'right'},
    ],
  },
],
// ...
```

**2. Reusable Selection (By Name)**

For selections shared across templates, define them in `app/[tenant]/[workspace]/(subapps)/website/common/templates/meta-selections.ts`.

_`meta-selections.ts` Example:_

```ts
// Use 'as const satisfies MetaSelection' for strict type-checking
export const colorsSelection = {
  name: 'colors',
  options: [
    {title: 'Blue', value: 'blue'},
    {title: 'Green', value: 'green'},
  ],
} as const satisfies MetaSelection;
```

_Usage in a Template Schema:_

```ts
// my-template/meta.ts
import {colorsSelection} from '../meta-selections';
import type {TemplateSchema} from '../../types/templates';

export const myTemplateSchema = {
  code: 'myTemplate',
  title: 'My Template',
  type: Template.block,
  fields: [
    {
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      // Reference the selection by its 'name'
      selection: 'colors',
    },
  ],
  selections: [colorsSelection],
} as const satisfies TemplateSchema;
```

> **A Note on `as const` and `satisfies`**
>
> You will notice the pattern `as const satisfies <Type>` used for all schema, model, and selection definitions. This is a critical TypeScript practice for this system.
>
> **Always use this pattern for all definitions to ensure type safety and enable the full power of static analysis.**

## The `schema` Object

The `schema` object is the heart of a template, defining its properties, fields, and associated data structures.

- **`title`** (string): The display name of the template in the UI.
- **`code`** (string): A unique `camelCase` identifier for the template.
- **`type`** (Template): The category of the template. Possible values are:
  - `Template.block`: A standard, reusable content block.
  - `Template.topMenu`: For components intended to be used as a top navigation menu.
  - `Template.leftRightMenu`: For components with left/right menu structures.
- **`fields`** (Field[]): An array of field objects that define the content and configuration of the template.
- **`models`** (Model[]): An array of custom data structures used by the template (see Advanced section).
- **`selections`** (MetaSelection[]): An array of reusable selection options used by the template (see Advanced section).

### Field Types and Properties

Each object in the `fields` array defines a single piece of content for the template.

#### Common Properties (All Fields)

- **`name`** (string): The `camelCase` name of the field, used to access its data.
- **`title`** (string): A `Start Case` label for the field in the UI.
- **`required`** (boolean, optional): Whether the field must have a value.
- **`defaultValue`** (any, optional): Sets a default value for the field when a new content item is created. This is supported for primitive field types (`string`, `integer`, `decimal`, `boolean`, `date`, `time`, `datetime`).
- **`widgetAttrs`** (Record<string, string>, optional): Allows passing arbitrary string attributes to the rendering widget for custom styling or behavior.

---

##### String Field

- **`type`**: `'string'`
- **`widget`**: `'Email'`, `'Url'`, `'Password'`, `'Html'`, `'CodeEditor'`, `'ImageLine'`, `'NavSelect'`, `'CheckboxSelect'`, `'RadioSelect'`, `'MultiSelect'`, `'ImageSelect'`.

---

##### Number Fields

- **`type`**: `'integer'` or `'decimal'`
- **`widget`**: `'RelativeTime'`, `'Duration'`, `'Progress'`, `'SelectProgress'`, `'NavSelect'`, `'CheckboxSelect'`, `'RadioSelect'`, `'MultiSelect'`, `'ImageSelect'`.

---

##### Boolean Field

- **`type`**: `'boolean'`
- **`widget`**: `'InlineCheckbox'`, `'Toggle'`, `'BooleanSelect'`, `'BooleanRadio'`, `'BooleanSwitch'`, `'NavSelect'`, `'CheckboxSelect'`, `'RadioSelect'`, `'MultiSelect'`, `'ImageSelect'`.

---

##### Date/Time Fields

- **`type`**: `'datetime'`, `'date'`, or `'time'`
- **`widget`**: `'NavSelect'`, `'CheckboxSelect'`, `'RadioSelect'`, `'MultiSelect'`, `'ImageSelect'`.

> **Data Structure**: The value is a `string` representing the date/time.

---

##### Panel Field

- **`type`**: `'panel'`

> This is a decorative field for grouping other fields in the UI and does not hold any data.

---

##### Standard `many-to-one`

- **`type`**: `'many-to-one'`
- **`target`** (string): The name of the target database model.
- **`widget`**: `'SuggestBox'`, `'Image'`, `'binary-link'`. `'SuggestBox'`, `'Image'`, `'binary-link'`.

> **Data Structure**: The value is an object containing the raw fields of the related record.
>
> - **Limitation**: This is primarily supported for relations to the `metaFileModel`.
> - **Helper**: When using `metaFileModel`, always use the `getMetaFileURL` helper.
>
> _Example:_
>
> ```tsx
> // Schema: { name: 'heroImage', type: 'many-to-one', target: 'com.axelor.meta.db.MetaFile' }
>
> // Component:
> const imageUrl = getMetaFileURL({
>   metaFile: data.myTemplateHeroImage,
>   path: 'myTemplateHeroImage',
>   ...props,
> });
> ```

---

##### Standard `one-to-many` / `many-to-many`

- **`type`**: `'one-to-many'` or `'many-to-many'`
- **`target`** (string): The name of the target database model.
- `widget`: `'TagSelect'`.

> **Data Structure**: The value is an array of objects, where each object is a raw record.
>
> _Example (Image Gallery):_
>
> ```tsx
> // Schema: { name: 'imageGallery', type: 'one-to-many', target: 'com.axelor.meta.db.MetaFile' }
>
> // Component:
> const imageUrls =
>   data.myTemplateImageGallery?.map((file, i) =>
>     getMetaFileURL({
>       metaFile: file,
>       path: `myTemplateImageGallery[${i}]`,
>       ...props,
>     }),
>   ) ?? [];
> ```

---

##### JSON `json-many-to-one`

- **`type`**: `'json-many-to-one'`
- **`target`** (string): The `name` of the target custom JSON Model.
- **`widget`**: `'SuggestBox'`, `'Image'`, `'binary-link'`. `'SuggestBox'`, `'Image'`, `'binary-link'`.

> **Data Structure**: The value is a `JSONRecord` object. The actual fields of your custom model are inside the `attrs` property.
>
> _Example Type:_
>
> ```ts
> // For a field targeting a 'ProgressList' model
> myTemplateFeaturedItem?: {
>   id: string;
>   version: number;
>   attrs: {
>     title?: string;
>     percent?: number;
>   };
> };
> ```

---

##### JSON `json-one-to-many` / `json-many-to-many`

- **`type`**: `'json-one-to-many'` or `'json-many-to-many'`
- **`target`** (string): The `name` of the target custom JSON Model.
- `widget`: `'TagSelect'`.

> **Data Structure**: The value is an array of `JSONRecord` objects.
>
> _Example Type:_
>
> ```ts
> // For a field targeting a 'ProgressList' model
> myTemplateProgressList?: {
>   id: string;
>   version: number;
>   attrs: {
>     title?: string;
>     percent?: number;
>   };
> }[];
> ```

### Selections

Selections provide a list of choices for `string` or `integer` fields. The `SelectionOption` object has the following shape:

```ts
{
  title: string; // The label shown in the dropdown
  value: string | number; // The value stored in the database
  color?: Color; // Optional: A color name for styling
  icon?: Icon; // Optional: An icon name for styling
}
```

# Seeding

Populate the database with template definitions and demo content.

## Commands

```bash
# Seed template structure (components and fields)
pnpm website:seed:templates
```

Creates the `AOSPortalCmsComponent` and `AOSMetaJsonField` records in the database based on the template schemas.

⚠️ **Known Issue:** Re-running this command after modifying selections will cause partial failures if selections with identical names already exist in the database.
As a workaround, run the reset script before seeding again to ensure a clean import.

```bash
# Seed content with demo data
pnpm website:seed:contents
```

**Prerequisites:** This script must be run **after** `website:seed:templates`.

Creates `AOSPortalCmsContent` records using the demo data defined in each template’s `meta.ts` file.

⚠️ **Known Issue:** Re-running this command creates duplicate `meta-json` records and overwrites existing metafiles (images, etc.), potentially losing manual changes.

```bash
# Seed website structure and pages
pnpm website:seed:website
```

<details>
<summary>Website Configuration (`site.ts`)</summary>

The `website:seed:website` script is configured by the `website` object in `app/[tenant]/[workspace]/(subapps)/website/common/templates/site.ts`. It defines the website's name and its language-specific sites.

**Example:**

```ts
export const website = {
  name: 'Lighthouse',
  sites: [
    {
      language: 'en_US',
      website: {
        // The resulting URL for a page is /[tenant]/[workspace]/website/[slug]/[page-slug]
        // e.g., /[tenant]/[workspace]/website/en/demo-1
        name: 'English',
        slug: 'en',
        homepage: 'demo-1',
      },
    },
    {
      language: 'fr_FR',
      website: {name: 'Français', slug: 'fr', homepage: 'demo-1'},
    },
  ],
};
```

> **Note:** Before adding a new site, you must first update the `Language` and `Site` types in `.../types/templates.ts`.

</details>

**Prerequisites:** This script must be run **after** `website:seed:contents`, as it uses the content records created by that script.

**What it does:**

- Creates the main website and its language-specific sites (e.g., English and French sites).
- Creates individual pages (e.g., `/home`, `/about`) for each site by grouping demos by their `site` and `page` slugs.
- Populates pages by linking the appropriate content records in the correct order (using the `sequence` property from the demo data).
- Sets the homepage for each site based on a central configuration.
- Links translated pages together.

```bash
# Reset all templates and content (clean slate)
pnpm website:reset:templates
```

Deletes all custom fields, models, and selections created by the seeding process.

⚠️ **Note:** This does **not** delete components (`AOSPortalCmsComponent`) or contents (`AOSPortalCmsContent`).
