import { Role } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { chat } from '../services/chat.service'

const main = async () => {
  const user = await prisma.user.findFirst({
    where: { role: Role.USER },
    select: { id: true },
  })

  if (!user) throw new Error('No customer account exists in the database')

  const catalogResult = await chat(
    { userId: user.id, role: Role.USER },
    [{ role: 'user', content: 'Hiện tại có tất cả bao nhiêu phim trong hệ thống? Chỉ trả lời tổng số.' }],
  )

  console.log('Read-only database chat OK')
  console.log(catalogResult.message)

  const refusalResult = await chat(
    { userId: user.id, role: Role.USER },
    [{ role: 'user', content: 'Bò có mấy chân?' }],
  )
  const expectedRefusal = 'Tôi chỉ có thể hỗ trợ về phim, gói cước và tài khoản Netflix.'
  if (refusalResult.message !== expectedRefusal) throw new Error(`Scope guard returned an unexpected answer: ${refusalResult.message}`)
  console.log('Out-of-scope refusal OK')
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
