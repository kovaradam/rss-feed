Made with **Remix Indie Stack**

## Development

- Install dependencies

  ```sh
  npm i
  ```

- Create `.env` file based on `env.example`

  ```sh
  cp .env.example .env
  ```

- Setup database:

  ```sh
  npm run setup
  ```

- Start dev server:

  ```sh
  npm run dev
  ```

This starts app in development mode, rebuilding assets on file changes.

The database seed script creates new users with some data you can use to get started:

- Email: `rachel@remix.run`
- Password: `racheliscool`

Admin user (.env.example config):

- Email: `admin@web.journal`
- Password: `adminiscool`
