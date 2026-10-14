const test = require('node:test')
const assert = require('node:assert/strict')
const { Role } = require('@prisma/client')

const { toolsForRole } = require('../dist/services/chat-tools.service')
const { chatRequestSchema } = require('../dist/validation/chat.validation')
const { chatRouter } = require('../dist/routes/chat.routes')

const names = (tools) => tools.map((tool) => tool.name)

test('chat route is protected before accepting messages', () => {
  assert.equal(chatRouter.stack[0].name, 'authenticate')
  assert.ok(chatRouter.stack.some((layer) => layer.route?.path === '/'))
})

test('customer chat exposes account tools but never admin tools', () => {
  const customerTools = names(toolsForRole(Role.USER))
  assert.ok(customerTools.includes('get_my_subscription'))
  assert.ok(customerTools.includes('get_my_payments'))
  assert.ok(!customerTools.includes('get_admin_dashboard'))
  assert.ok(!customerTools.includes('get_admin_statistics'))
})

test('admin chat exposes operational tools but never customer account tools', () => {
  const adminTools = names(toolsForRole(Role.ADMIN))
  assert.ok(adminTools.includes('get_admin_dashboard'))
  assert.ok(adminTools.includes('get_content_issues'))
  assert.ok(!adminTools.includes('get_my_subscription'))
  assert.ok(!adminTools.includes('get_my_payments'))
})

test('chat input is bounded and must end with a user message', () => {
  assert.equal(chatRequestSchema.safeParse({ messages: [{ role: 'user', content: 'Hello' }] }).success, true)
  assert.equal(chatRequestSchema.safeParse({ messages: [{ role: 'assistant', content: 'Hello' }] }).success, false)
  assert.equal(chatRequestSchema.safeParse({ messages: Array.from({ length: 13 }, () => ({ role: 'user', content: 'Hello' })) }).success, false)
})
