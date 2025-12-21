# Tiny Inventory (Home Assignment)

## Run instructions

- `docker compose up --build`
- Web UI: `http://localhost:5173`
- GraphQL endpoint: `http://localhost:4001/graphql` (also proxied at `http://localhost:5173/graphql`)
- Server health endpoint: `http://localhost:4001/health` (used by Docker Compose healthcheck)

## GraphQL API sketch

- Query `_health`: health check string (`"ok"`)
- Query `stores`: list stores
- Query `store(id: ID!)`: store detail (+ `inventoryItems` field)
- Query `inventoryItems(filter, sort, page = 1, pageSize = 20)`: filtered + sorted + paginated list across stores
- Query `storeInventorySummary(storeId: ID!)`: totals + `lowStockCount` (aggregation)
- Mutation `createStore(input: StoreCreateInput!)`, `updateStore(id: ID!, input: StoreUpdateInput!)`
- Mutation `createProduct(input: ProductCreateInput!)`, `updateProduct(id: ID!, input: ProductUpdateInput!)`
- Mutation `upsertInventoryItem(input: InventoryItemUpsertInput!)`
- Mutation `deleteInventoryItem(storeId: ID!, productId: ID!)`

## Decisions & trade-offs
- **Mikro-ORM + Postgres**: Mikro-ORM is my favourite Postgre ORM, it's small, easy to use, fast. Postgre SQL is a good choice for various types of applications. It's popular, so it's easy to find different hosting options.
- **Express 5 + Apollo Server 5**: Express, because it's the most used and because of this the most compatible with everything framework. I'm not a fan of framework magic, like in Nest.js. SDL-first GraphQL for clarity and easy review; errors use GraphQL `extensions.code` (`BAD_USER_INPUT`, `NOT_FOUND`).
- **Pagination**: offset pagination (`page`/`pageSize`) is simple and good for the assignment; cursor pagination would be a natural next step.
- **Seeding**: migrations + seed run automatically on server container start so reviewers can click around immediately.
- Explicit `InventoryItem` join entity because price/stock are store-specific; `price` stored as `numeric` and surfaced as a string to avoid float issues.

## Testing approach
- Kept tests lightweight and fast: a small unit test suite runs via Node’s built-in test runner.
  - Run: `cd server && npm test`
  - Coverage: `cd server && npm run coverage`
- To make test very quick and not dependend on slow DB startup I use in-memory versions of Repositories for testing the Domain code.
- To test Repositories I use contract tests that run the same tests on in-memory and real (Postgre based) versions.
- **Repo “contract tests” warning (DB-backed)**: the optional Postgres-backed repository contract tests **TRUNCATE** the `inventory_item`, `product`, and `store` tables between tests.
  - They are only enabled when you run with `REPO_CONTRACT_DB=1`.
  - For safety, they will **refuse to run** unless the current database name ends with `_test` (recommended) or you explicitly set `REPO_CONTRACT_DB_ALLOW_DESTRUCTIVE=1`.
  - Recommended invocation:
    - `cd server && DB_NAME=always_open_shop_test REPO_CONTRACT_DB=1 npm test`
  - Override (dangerous):
    - `cd server && REPO_CONTRACT_DB=1 REPO_CONTRACT_DB_ALLOW_DESTRUCTIVE=1 npm test`

## If I had more time I'd add:
- Deployment for this example app.
- Playwright automated frontend end-to-end tests.
- 

## Non-trivial operation:
It's a store inventory summary with:
- total value of products in the store
- number of SKUs (unique products)
- total quantity of products in stock
- number of low stock (<= 5) items
This summary is exposed as storeInventorySummary GQL query.