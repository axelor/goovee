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

## Compatibility Matrix

| Goovee Version      | Compatible Axelor-Portal                                   |
| ------------------- | ---------------------------------------------------------- |
| **v1.0.0 – v1.2.0** | 8.0.0 – 8.0.2, 8.3.0, 8.4.0, 8.5.0 – 8.5.1                 |
| **v1.3.0**          | 8.0.0 – 8.0.2, 8.3.0 – 8.3.2, 8.4.0 – 8.4.2, 8.5.0 – 8.5.3 |
| **v1.4.0 – v1.4.1** | 8.3.3 – 8.3.6, 8.4.3 – 8.4.6, 8.5.4 – 8.5.6                |
| **v1.5.0 – v1.5.5** | 8.3.6, 8.4.6, 8.5.7+                                       |
| **v1.6.0 – v1.6.2** | 8.5.11+                                                    |
| **v1.6.3 – v1.6.5** | 8.5.13+                                                    |
| **v1.7.x**          | 8.5.17+                                                    |
| **v1.8.x**          | 8.5.19+                                                    |
| **v1.9.x**          | 8.5.20+                                                    |
| **v1.10.x**         | 8.5.21+                                                    |

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

To start the app, run these in order:

1. Install the dependencies: `pnpm i`
2. Copy [`env.example`](env.example) to `.env` in the root directory. The
   settings left uncommented there are the required ones; fill them in.
3. Confirm the settings are valid: `pnpm config:check`
4. Generate the ORM client: `pnpm generate`
5. Compile the website stylesheets: `pnpm website:sass`
6. Build the project: `pnpm build`
7. Start the app: `pnpm start`

`pnpm dev` replaces the last two steps with a development server, which serves
the app without building it first.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ORM

The application make use of `@goovee/orm` for data access.
Each tenant has its own database, named by that tenant's own variable in `.env`:

```
PORTAL_TENANT_<ID>_DB_URL=postgres://<user>:<password>@<host>:<port>/<db-name>
```

Then, you can define models inside the goovee/schema folder. After each change in the schema folder, you need to re-run the generation command `pnpm generate` to propagate the changes inside the ORM client.

Check [Goovee ORM](https://github.com/axelor/goovee-orm) for more information about its usage.

## Documentation

- [CONFIGURATION.md](CONFIGURATION.md) — every setting a deployment carries, written as environment variables or as a JSON file, and how to check them before starting the portal.
- [MIGRATION.md](MIGRATION.md) — which runbooks an upgrade needs, by the version being upgraded from.

## License

This package is made available under the Sustainable Use License.

You may use this software for non-commercial or internal business purposes only.
Commercial use requires a valid Axelor SAS Enterprise License.

See [LICENSE.md](https://github.com/axelor/goovee/blob/main/LICENSE.md) for details.

## Development

Please check out our [CONTRIBUTING.md](https://github.com/axelor/goovee/blob/main/CONTRIBUTING.md) for guidelines.

## Contact

For any questions or feedback, feel free to reach out via the contact form on [goovee.com](https://goovee.com) or open an issue on this repository.
