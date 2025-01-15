# Job Manager Server

This server provides a management interface for job trees and includes a RESTful API for interacting with a PostgreSQL database.

**Key Features:**

* Manages job trees.
* Provides a RESTful API for database management.

**Requirements:**

* **PostgreSQL:** Version 13 or higher is required.

------------------------

## Migration
**Development Workflow:**

* **Schema Validation:** `npm run migration:validate` - Ensures the integrity and correctness of your Prisma schema.
* **Schema Formatting:** 
    * `npm run migration:format` - Formats the Prisma schema for consistency and readability.
    * `npm run migration:format-fix` - Automatically applies formatting changes to the schema.
* **Migration Creation:** `npm run migration:dev` - Creates and applies a new migration to your local development database.
* **Type Generation:** `npm run migration:generate` - Generates and updates TypeScript types for your database models.

**Production Deployment:**
* **Migration Deployment:** `npm run migration:deploy` - Deploys the latest migrations to your production database.

> [!CAUTION]
> **Remember to carefully manage environment variables.**
> Ensure that the `DATABASE_URL` environment variable is correctly configured for each environment (development, staging, production).
