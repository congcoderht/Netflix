const test = require('node:test')
const assert = require('node:assert/strict')

const { prisma } = require('../dist/lib/prisma')
const jwt = require('../dist/utils/jwt.util')
const authService = require('../dist/services/auth.service')

const replaceMethod = (t, object, name, implementation) => {
  const original = object[name]
  object[name] = implementation
  t.after(() => { object[name] = original })
}

const activeRecord = (overrides = {}) => ({
  id: 'token-1',
  userId: 'user-1',
  familyId: 'family-1',
  tokenHash: 'stored-hash',
  replacedByTokenHash: null,
  expiresAt: new Date(Date.now() + 60_000),
  usedAt: null,
  revokedAt: null,
  createdAt: new Date(),
  ...overrides,
})

test('refresh rejects blocked users and revokes all active sessions', async (t) => {
  let revokeWhere
  replaceMethod(t, jwt, 'verifyRefreshToken', () => ({ userId: 'user-1' }))
  replaceMethod(t, prisma.refreshToken, 'findUnique', async () => activeRecord())
  replaceMethod(t, prisma.user, 'findUnique', async () => ({
    id: 'user-1', email: 'blocked@example.com', role: 'USER', isBlocked: true,
  }))
  replaceMethod(t, prisma.refreshToken, 'updateMany', async ({ where }) => {
    revokeWhere = where
    return { count: 1 }
  })

  await assert.rejects(authService.refreshTokens('old-token'), /Account is blocked/)
  assert.deepEqual(revokeWhere, { userId: 'user-1', revokedAt: null })
})

test('refresh rotation marks the old token used and creates its replacement in the same family', async (t) => {
  const operations = []
  replaceMethod(t, jwt, 'verifyRefreshToken', () => ({ userId: 'user-1' }))
  replaceMethod(t, jwt, 'generateAccessToken', () => 'new-access-token')
  replaceMethod(t, jwt, 'generateRefreshToken', () => 'new-refresh-token')
  replaceMethod(t, prisma.refreshToken, 'findUnique', async () => activeRecord())
  replaceMethod(t, prisma.user, 'findUnique', async () => ({
    id: 'user-1', email: 'user@example.com', role: 'USER', isBlocked: false,
  }))
  replaceMethod(t, prisma, '$transaction', async (callback) => callback(prisma))
  replaceMethod(t, prisma.refreshToken, 'updateMany', async ({ where, data }) => {
    operations.push({ type: 'claim', where, data })
    return { count: 1 }
  })
  replaceMethod(t, prisma.refreshToken, 'create', async ({ data }) => {
    operations.push({ type: 'create', data })
    return data
  })

  const result = await authService.refreshTokens('old-token')

  assert.deepEqual(result, {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
  })
  assert.equal(operations[0].type, 'claim')
  assert.equal(operations[0].where.id, 'token-1')
  assert.equal(operations[1].type, 'create')
  assert.equal(operations[1].data.familyId, 'family-1')
  assert.notEqual(operations[1].data.tokenHash, 'new-refresh-token')
})

test('reuse of an already-used token revokes the entire token family', async (t) => {
  let revokedFamily
  replaceMethod(t, jwt, 'verifyRefreshToken', () => ({ userId: 'user-1' }))
  replaceMethod(t, prisma.refreshToken, 'findUnique', async () =>
    activeRecord({ usedAt: new Date() }))
  replaceMethod(t, prisma.refreshToken, 'updateMany', async ({ where }) => {
    revokedFamily = where.familyId
    return { count: 2 }
  })

  await assert.rejects(
    authService.refreshTokens('already-used-token'),
    (error) => error.code === 'REFRESH_TOKEN_REUSE',
  )
  assert.equal(revokedFamily, 'family-1')
})

test('unknown refresh tokens are rejected without querying plaintext storage', async (t) => {
  replaceMethod(t, jwt, 'verifyRefreshToken', () => ({ userId: 'user-1' }))
  replaceMethod(t, prisma.refreshToken, 'findUnique', async ({ where }) => {
    assert.ok(where.tokenHash)
    assert.equal(where.token, undefined)
    return null
  })

  await assert.rejects(
    authService.refreshTokens('unknown-token'),
    (error) => error.code === 'INVALID_REFRESH_TOKEN',
  )
})
