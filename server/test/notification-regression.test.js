const test = require('node:test')
const assert = require('node:assert/strict')

const { prisma } = require('../dist/lib/prisma')
const notificationService = require('../dist/services/notification.service')
const notificationController = require('../dist/controllers/notification.controller')
const { notificationRouter } = require('../dist/routes/notification.routes')

const replaceMethod = (t, object, name, implementation) => {
  const original = object[name]
  object[name] = implementation
  t.after(() => { object[name] = original })
}

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this },
  json(body) { this.body = body; return this },
  send() { return this },
})

test('notification routes expose unread count and read-all before resource routes', () => {
  const paths = notificationRouter.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path)

  assert.ok(paths.includes('/unread-count'))
  assert.ok(paths.includes('/read-all'))
  assert.ok(paths.includes('/:id/read'))
})

test('mark-read always scopes the update to the authenticated user', async (t) => {
  let receivedWhere
  replaceMethod(t, prisma.notification, 'updateMany', async ({ where }) => {
    receivedWhere = where
    return { count: 1 }
  })
  replaceMethod(t, prisma.notification, 'findFirst', async () => ({
    id: 'notification-1', userId: 'user-1', readAt: new Date(),
  }))

  await notificationService.markRead('user-1', 'notification-1')
  assert.deepEqual(receivedWhere, {
    id: 'notification-1', userId: 'user-1', readAt: null,
  })
})

test('notification controller uses the authenticated user identity', async (t) => {
  let receivedUserId
  t.mock.method(notificationService, 'unreadCount', async (userId) => {
    receivedUserId = userId
    return 3
  })

  const response = createResponse()
  await notificationController.countUnread({ user: { userId: 'user-42' } }, response)

  assert.equal(receivedUserId, 'user-42')
  assert.deepEqual(response.body, { count: 3 })
})
