export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Inventory Management API",
    version: "1.0.0",
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/healthz": {
      get: {
        security: [],
        summary: "Liveness check",
        responses: {
          "200": { description: "API process is running" },
        },
      },
    },
    "/readyz": {
      get: {
        security: [],
        summary: "Readiness check",
        responses: {
          "200": { description: "API and database are ready" },
          "503": { description: "API is not ready" },
        },
      },
    },
    "/dashboard": {
      get: {
        summary: "Dashboard metrics",
        responses: {
          "200": { description: "Aggregated inventory, sales, purchase, and expense metrics" },
        },
      },
    },
    "/products": {
      get: {
        summary: "Paginated products",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
          { name: "sortBy", in: "query", schema: { type: "string" } },
          { name: "stockFilter", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Product page with pagination metadata" },
        },
      },
      post: {
        summary: "Create a product",
        responses: {
          "201": { description: "Product created" },
          "403": { description: "Admin access required" },
        },
      },
    },
    "/users": {
      get: {
        summary: "Paginated users",
        responses: {
          "200": { description: "User page with pagination metadata" },
          "403": { description: "Admin access required" },
        },
      },
    },
    "/expenses": {
      get: {
        summary: "Paginated expenses with aggregate metadata",
        responses: {
          "200": { description: "Expense page with pagination and chart metadata" },
        },
      },
    },
  },
} as const;
