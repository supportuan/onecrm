

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ApplyUniNow API',
      version: '1.0.0',
      description: 'API documentation for the ApplyUniNow ecosystem',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication and authorization APIs',
      },
      {
        name: 'Users',
        description: 'User and role management APIs',
      },
      {
        name: 'Marketing',
        description: 'Operations related to the Marketing Module',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: [
    './src/modules/**/*.ts',
    './src/modules/**/*.js',
    './src/routes/**/*.ts',
    './src/routes/**/*.js',
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express) => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        tagsSorter: 'none',
        operationsSorter: 'none',
      },
    })
  );
};