import { prisma } from '../lib/prisma'

export const getAll = () =>
  prisma.genre.findMany({ orderBy: { name: 'asc' } })

export const create = (name: string) =>
  prisma.genre.create({ data: { name } })

export const update = (id: string, name: string) =>
  prisma.genre.update({ where: { id }, data: { name } })

export const remove = async (id: string) => {
  await prisma.genre.delete({ where: { id } })
}

export const findOrCreate = async (name: string) => {
  return prisma.genre.upsert({
    where: { name },
    update: {},
    create: { name },
  })
}
