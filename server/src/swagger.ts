import fs from 'fs'
import path from 'path'
import { z, ZodType } from 'zod'
import { authRouter } from './routes/auth.routes'
import { communityRouter } from './routes/community.routes'
import { episodeRouter } from './routes/episode.routes'
import { genreRouter } from './routes/genre.routes'
import { healthRouter } from './routes/health.routes'
import { movieRouter } from './routes/movie.routes'
import { uploadRouter } from './routes/upload.routes'
import { watchHistoryRouter } from './routes/watch-history.routes'
import { watchProgressRouter } from './routes/watch-progress.routes'
import { watchlistRouter } from './routes/watchlist.routes'
import { billingRouter } from './routes/billing.routes'
import { playbackRouter } from './routes/playback.routes'
import { API_VALIDATION, ApiValidationMetadata } from './middlewares/validate.middleware'

type JsonObject = Record<string, unknown>
type ExpressHandler = {
  name?: string
  handle?: ExpressHandler & { [API_VALIDATION]?: ApiValidationMetadata }
  route?: { path: string; methods: Record<string, boolean>; stack: ExpressHandler[] }
}
type ExpressRouter = { stack: ExpressHandler[] }

const routers: Array<{ basePath: string; tag: string; router: unknown; protected?: boolean }> = [
  { basePath: '/api/health', tag: 'System', router: healthRouter },
  { basePath: '/api/auth', tag: 'Auth', router: authRouter },
  { basePath: '/api/genres', tag: 'Genres', router: genreRouter },
  { basePath: '/api/movies', tag: 'Movies', router: movieRouter },
  { basePath: '/api/movies/{movieId}', tag: 'Episodes', router: episodeRouter },
  { basePath: '/api/movies/{movieId}/community', tag: 'Community', router: communityRouter, protected: true },
  { basePath: '/api/upload', tag: 'Upload', router: uploadRouter },
  { basePath: '/api/watch-progress', tag: 'Watch progress', router: watchProgressRouter },
  { basePath: '/api/watch-history', tag: 'Watch history', router: watchHistoryRouter },
  { basePath: '/api/watchlist', tag: 'Watchlist', router: watchlistRouter },
  { basePath: '/api', tag: 'Billing', router: billingRouter },
  { basePath: '/api/playback-sessions', tag: 'Playback', router: playbackRouter, protected: true },
]

const jsonSchema = (schema: ZodType): JsonObject => {
  const result = z.toJSONSchema(schema, { target: 'draft-7' }) as JsonObject
  delete result.$schema
  return result
}

const parametersFrom = ({ schema, target }: ApiValidationMetadata): JsonObject[] => {
  const converted = jsonSchema(schema)
  if (target === 'body') return []

  const properties = (converted.properties || {}) as Record<string, JsonObject>
  const required = new Set((converted.required || []) as string[])
  return Object.entries(properties).map(([name, property]) => {
    return {
      name,
      in: target === 'params' ? 'path' : 'query',
      required: target === 'params' || (required.has(name) && property.default === undefined),
      schema: property,
    }
  })
}

const paths: Record<string, Record<string, JsonObject>> = {}

for (const entry of routers) {
  const router = entry.router as ExpressRouter
  let inheritedAuth = entry.protected || false

  for (const layer of router.stack) {
    if (!layer.route) {
      if (layer.name === 'authenticate' || layer.handle?.name === 'authenticate') inheritedAuth = true
      continue
    }

    const routePath = layer.route.path.replace(/:([A-Za-z0-9_]+)/g, '{$1}')
    const fullPath = `${entry.basePath}${routePath === '/' ? '' : routePath}`
    paths[fullPath] ||= {}

    const validations = layer.route.stack
      .map((handler) => handler.handle?.[API_VALIDATION])
      .filter((value): value is ApiValidationMetadata => Boolean(value))
    const authenticated = inheritedAuth || layer.route.stack.some((handler) =>
      handler.name === 'authenticate' || handler.handle?.name === 'authenticate')
    const bodyValidation = validations.find(({ target }) => target === 'body')

    for (const method of Object.keys(layer.route.methods).filter((key) => layer.route?.methods[key])) {
      paths[fullPath][method] = {
        tags: [entry.tag],
        parameters: validations.flatMap(parametersFrom),
        ...(bodyValidation ? {
          requestBody: {
            required: true,
            content: { 'application/json': { schema: jsonSchema(bodyValidation.schema) } },
          },
        } : {}),
        ...(authenticated ? { security: [{ bearerAuth: [] }] } : {}),
        responses: {
          200: { description: 'Successful response' },
          400: { description: 'Invalid request data' },
          401: { description: 'Unauthorized' },
        },
      }
    }
  }
}

const port = process.env.PORT || '5000'
const document = {
  openapi: '3.0.3',
  info: {
    version: '1.0.0',
    title: 'Netflix Fullstack API',
    description: 'Generated automatically from Express routes and Zod validation schemas',
  },
  servers: [{ url: `http://localhost:${port}` }],
  tags: routers.map(({ tag }) => ({ name: tag })),
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the access token only; Swagger adds the Bearer prefix automatically.',
      },
    },
  },
  paths,
}

fs.writeFileSync(path.join(__dirname, 'swagger_output.json'), `${JSON.stringify(document, null, 2)}\n`)
console.log(`Swagger generated: ${Object.keys(paths).length} paths`)
