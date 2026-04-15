import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Book My Ticket API",
      version: "1.0.0",
      description: "REST API for a movie ticket booking system with seat locking and booking management.",
    },
    servers: [
      { url: "http://localhost:5000", description: "Local" },
      { url: "https://your-app.vercel.app", description: "Production" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Paste your access token here",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            total:      { type: "integer" },
            page:       { type: "integer" },
            limit:      { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
      },
    },
  },
  apis: ["./src/modules/**/*.routes.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
