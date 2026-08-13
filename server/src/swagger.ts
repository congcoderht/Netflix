import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    version: '1.0.0',
    title: 'Netflix Fullstack API',
    description: 'Auto-generated API documentation using swagger-autogen',
  },
  tags: [
    { name: 'System', description: 'Health and operational endpoints' },
    { name: 'Auth', description: 'Authentication and profile management' },
    { name: 'Genres', description: 'Genre management' },
    { name: 'Movies', description: 'Movies, actors and discovery' },
    { name: 'Episodes', description: 'Season and episode management' },
    { name: 'Upload', description: 'Admin media uploads' },
  ],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'Use: Bearer <access-token>',
    },
  },
  definitions: {
    Error: {
      status: 'error',
      code: 'ERROR_CODE',
      message: 'Human-readable error message',
    },
    ValidationError: {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: [{ path: 'field', message: 'Validation message' }],
    },
    MovieInput: {
      title: 'Example movie',
      description: 'Movie description',
      type: 'MOVIE',
      duration: 120,
      isPublished: false,
      genreIds: [],
    },
    LoginInput: {
      email: 'user@example.com',
      password: 'password',
    },
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
