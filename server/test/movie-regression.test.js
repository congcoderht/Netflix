const test = require('node:test')
const assert = require('node:assert/strict')

const movieService = require('../dist/services/movie.service')
const movieController = require('../dist/controllers/movie.controller')
const { movieRouter } = require('../dist/routes/movie.routes')

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
  return response
}

test('static actor search route is registered before the movie id route', () => {
  const paths = movieRouter.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path)

  assert.ok(paths.indexOf('/actors/search') >= 0)
  assert.ok(paths.indexOf('/:id') >= 0)
  assert.ok(paths.indexOf('/actors/search') < paths.indexOf('/:id'))
})

test('regular users request only published movie details', async (t) => {
  let receivedIncludeUnpublished
  t.mock.method(movieService, 'getById', async (_id, includeUnpublished) => {
    receivedIncludeUnpublished = includeUnpublished
    return null
  })

  await assert.rejects(
    movieController.getById(
      { params: { id: 'movie-1' }, user: { role: 'USER' } },
      createResponse(),
    ),
    (error) => error.statusCode === 404 && error.code === 'MOVIE_NOT_FOUND',
  )

  assert.equal(receivedIncludeUnpublished, false)
})

test('admins may request unpublished movie details', async (t) => {
  let receivedIncludeUnpublished
  const movie = { id: 'movie-1', isPublished: false }
  t.mock.method(movieService, 'getById', async (_id, includeUnpublished) => {
    receivedIncludeUnpublished = includeUnpublished
    return movie
  })

  const response = createResponse()
  await movieController.getById(
    { params: { id: 'movie-1' }, user: { role: 'ADMIN' } },
    response,
  )

  assert.equal(receivedIncludeUnpublished, true)
  assert.deepEqual(response.body, movie)
})
