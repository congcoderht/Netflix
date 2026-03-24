import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    version: '1.0.0',
    title: 'Netflix Fullstack API',
    description: 'Auto-generated API documentation using swagger-autogen',
  },
  host: 'localhost:5000',
  basePath: '/',
  schemes: ['http'],
  consumes: ['application/json'],
  produces: ['application/json'],
};

const outputFile = './src/swagger_output.json';
const endpointsFiles = ['./src/index.ts'];

// Generate swagger.json
swaggerAutogen()(outputFile, endpointsFiles, doc);
