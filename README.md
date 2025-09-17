# Goovee

Goovee is a modern web portal built with Next.js for clients and partners, providing an intuitive and responsive interface for accessing services, managing information, and streamlining collaboration. Check the website [goovee.com](https://goovee.com/) for more information.

## Features

- Clean and responsive UI built with Next.js
- Integrated with [Goovee ORM](https://github.com/axelor/goovee-orm)
- Modular and scalable architecture
- Easily customizable and extensible

## Tech Stack

- [Next.js](https://nextjs.org/)
- [Goovee ORM](https://github.com/axelor/goovee-orm)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Usage

Here is the project structure:

```
.
├── app/            # Next.js page routes
├── lib/            # Utilities and helpers
├── goovee/         # Goovee ORM setup and models
├── public/         # Static assets
├── ui/             # Reusable UI components
└── ...
```

Check the `.env` file in the root directory and add the necessary environment variables:

Some important commands:

- Install the dependencies : `pnpm i`
- Generate ORM client : `pnpm generate`
- Compile sass for website: `pnpm website:sass`
- Build the project : `pnpm build`
- Start the app : `pnpm start`
- Run development server : `pnpm dev`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ORM

The application make use of `@goovee/orm` for data access.
Make sure to set the database url in `.env` file under the `DATABASE_URL` property :

```
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<db-name>
```

Then, you can define models inside the goovee/schema folder. After each change in the schema folder, you need to re-run the generation command `pnpm generate` to propagate the changes inside the ORM client.

Check [Goovee ORM](https://github.com/axelor/goovee-orm) for more information about its usage.

## License

This package is made available under the Sustainable Use License.

You may use this software for non-commercial or internal business purposes only.
Commercial use requires a valid Axelor SAS Enterprise License.

See [LICENSE.md](https://github.com/axelor/goovee/blob/main/LICENSE.md) for details.

## Development

Please check out our [CONTRIBUTING.md](https://github.com/axelor/goovee/blob/main/CONTRIBUTING.md) for guidelines.

## Contact

For any questions or feedback, feel free to reach out via the contact form on [goovee.com](https://goovee.com) or open an issue on this repository.
