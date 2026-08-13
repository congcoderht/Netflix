const test = require('node:test')
const assert = require('node:assert/strict')

const { prisma } = require('../dist/lib/prisma')
const jwt = require('../dist/utils/jwt.util')
const authService = require('../dist/services/auth.service')

const futureDate = () => new Date(Date.now() + 60_000)

const replaceMethod = (t, object, name, implementation) => {
  const original = object[name]
  object[name] = implementation
  t.after(() => { object[name] = original })
}

test('refresh rejects blocked users and revokes all of their refresh tokens', async (t) => {
  let revokedUserId

  t.mock.method(jwt, 'verifyRefreshToken', () => ({ userId: 'user-1' }))
  replaceMethod(t, prisma.refreshToken, 'findUnique', async () => ({
    token: 'old-token',
    expiresAt: futureDate(),
  }))
  replaceMethod(t, prisma.user, 'findUnique', async () => ({
    id: 'user-1',
    email: 'blocked@example.com',
    role: 'USER',
    isBlocked: true,
  }))
  replaceMethod(t, prisma.refreshToken, 'deleteMany', async ({ where }) => {
    revokedUserId = where.userId
    return { count: 1 }
  })

  await assert.rejects(
    authService.refreshTokens('old-token'),
    /Account is blocked/,
  )
  assert.equal(revokedUserId, 'user-1')
})

test('refresh rotation deletes the old token and stores a new token', async (t) => {
  const operations = []

  t.mock.method(jwt, 'verifyRefreshToken', () => ({ userId: 'user-1' }))
  t.mock.method(jwt, 'generateAccessToken', () => 'new-access-token')
  t.mock.method(jwt, 'generateRefreshToken', () => 'new-refresh-token')
  replaceMethod(t, prisma.refreshToken, 'findUnique', async () => ({
    token: 'old-token',
    expiresAt: futureDate(),
  }))
  replaceMethod(t, prisma.user, 'findUnique', async () => ({
    id: 'user-1',
    email: 'user@example.com',
    role: 'USER',
    isBlocked: false,
  }))
  replaceMethod(t, prisma.refreshToken, 'delete', async ({ where }) => {
    operations.push(`delete:${where.token}`)
    return {}
  })
  replaceMethod(t, prisma.refreshToken, 'create', async ({ data }) => {
    operations.push(`create:${data.token}`)
    return data
  })

  const result = await authService.refreshTokens('old-token')

  assert.deepEqual(result, {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
  })
  assert.deepEqual(operations, [
    'delete:old-token',
    'create:new-refresh-token',
  ])
})

test('an already-used refresh token cannot be reused', async (t) => {
  t.mock.method(jwt, 'verifyRefreshToken', () => ({ userId: 'user-1' }))
  replaceMethod(t, prisma.refreshToken, 'findUnique', async () => null)

  await assert.rejects(
    authService.refreshTokens('already-used-token'),
    /Invalid refresh token/,
  )
})
