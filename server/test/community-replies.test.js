const test = require('node:test')
const assert = require('node:assert/strict')

const { prisma } = require('../dist/lib/prisma')
const communityService = require('../dist/services/community.service')

const replaceMethod = (t, object, name, implementation) => {
  const original = object[name]
  object[name] = implementation
  t.after(() => { object[name] = original })
}

test('replying to a reply stays in the root thread and targets the selected reply', async (t) => {
  let createData

  replaceMethod(t, prisma.movie, 'findFirst', async () => ({ id: 'movie-1' }))
  replaceMethod(t, prisma.comment, 'findFirst', async () => ({
    id: 'reply-1',
    parentId: 'root-1',
    userId: 'user-1',
    movie: { title: 'Movie' },
  }))
  replaceMethod(t, prisma.comment, 'create', async ({ data }) => {
    createData = data
    return {
      id: 'reply-2',
      content: data.content,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: 'user-1', name: 'User', avatar: null },
      replyTo: { id: 'reply-1', user: { id: 'user-1', name: 'User', avatar: null } },
    }
  })

  await communityService.createComment('user-1', 'movie-1', 'Nested reply', 'reply-1')

  assert.equal(createData.parentId, 'root-1')
  assert.equal(createData.replyToId, 'reply-1')
})
