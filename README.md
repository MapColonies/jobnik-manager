# Job Manager Server

This server provides a management interface for job trees and includes a RESTful API for interacting with a PostgreSQL database.

**Key Features:**

* Manages job trees.
* Provides a RESTful API for database management.

**Requirements:**

* **PostgreSQL:** Version 13 or higher is required.

------------------------

## Migration
<u>**How to create a new migration**</u>

***Update and Edit schema***

* New migration will be executed once you have made modification on 'schema.prisma' file [read more](https://www.prisma.io/docs/orm/reference/prisma-schema-reference)
* For example:
    * You modified exists model
    * Add another model or type
    * Remove some model
    * Add some constraint.

***Create new migration on modified schema***

1. **Schema Validation:** `npm run migration:validate` - Ensures the integrity and correctness of your Prisma schema.
2. **Schema Formatting:** 
    * `npm run migration:format` - Formats the Prisma schema for consistency and readability.
    * `npm run migration:format-fix` - Automatically applies formatting changes to the schema.
3. **Migration Creation:** `npm run migration:generate <migration name>` - Creates and applies a new migration to your local development database.

    * To apply only current migration - `npm run migration:dev`
4. **Type Generation:** `npm run migration:generate-types` - Generates and updates TypeScript types for your database models.

<u>**Production Deployment:**</u>
* **Migration Deployment:** `npm run migration:deploy` - Deploys the latest migrations to your production database.

> [!CAUTION]
> **Remember to carefully manage environment variables.**
> Ensure that the `DATABASE_URL` environment variable is correctly configured for each environment (development, staging, production).
