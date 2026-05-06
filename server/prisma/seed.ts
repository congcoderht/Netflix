import { PrismaClient, ContentType, Role, SubscriptionStatus, PaymentStatus, NotificationType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ============================================================
  // USERS
  // ============================================================
  const hashedPassword = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@netflix.com' },
    update: {},
    create: {
      email: 'admin@netflix.com',
      name: 'Admin',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  })

  const user1 = await prisma.user.upsert({
    where: { email: 'alice@gmail.com' },
    update: {},
    create: {
      email: 'alice@gmail.com',
      name: 'Alice',
      password: hashedPassword,
      role: Role.USER,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@gmail.com' },
    update: {},
    create: {
      email: 'bob@gmail.com',
      name: 'Bob',
      password: hashedPassword,
      role: Role.USER,
    },
  })

  console.log('✓ Users created')

  // ============================================================
  // GENRES
  // ============================================================
  const genreNames = ['Action', 'Drama', 'Comedy', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Animation']
  const genres = await Promise.all(
    genreNames.map((name) =>
      prisma.genre.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  )

  const genreMap = Object.fromEntries(genres.map((g) => [g.name, g]))
  console.log('✓ Genres created')

  // ============================================================
  // MOVIES (phim lẻ)
  // ============================================================
  const avengers = await prisma.movie.upsert({
    where: { id: 'movie-avengers-001' },
    update: {},
    create: {
      id: 'movie-avengers-001',
      title: 'Avengers: Endgame',
      description: 'Sau sự kiện Thanos tiêu diệt một nửa nhân loại, các Avengers còn lại tập hợp để đảo ngược hành động của hắn.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
      type: ContentType.MOVIE,
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      duration: 181,
      isPublished: true,
      genres: {
        create: [
          { genre: { connect: { id: genreMap['Action'].id } } },
          { genre: { connect: { id: genreMap['Sci-Fi'].id } } },
        ],
      },
    },
  })

  const inception = await prisma.movie.upsert({
    where: { id: 'movie-inception-001' },
    update: {},
    create: {
      id: 'movie-inception-001',
      title: 'Inception',
      description: 'Một tên trộm đánh cắp bí mật từ tiềm thức của người khác trong khi họ đang mơ.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
      type: ContentType.MOVIE,
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      duration: 148,
      isPublished: true,
      genres: {
        create: [
          { genre: { connect: { id: genreMap['Action'].id } } },
          { genre: { connect: { id: genreMap['Thriller'].id } } },
          { genre: { connect: { id: genreMap['Sci-Fi'].id } } },
        ],
      },
    },
  })

  console.log('✓ Movies (phim lẻ) created')

  // ============================================================
  // SERIES (phim bộ)
  // ============================================================
  const breakingBad = await prisma.movie.upsert({
    where: { id: 'series-breaking-bad-001' },
    update: {},
    create: {
      id: 'series-breaking-bad-001',
      title: 'Breaking Bad',
      description: 'Một giáo viên hóa học mắc bệnh ung thư chuyển sang sản xuất ma túy để lo cho gia đình.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=HhesaQXLuRY',
      type: ContentType.SERIES,
      isPublished: true,
      genres: {
        create: [
          { genre: { connect: { id: genreMap['Drama'].id } } },
          { genre: { connect: { id: genreMap['Thriller'].id } } },
        ],
      },
    },
  })

  // Season 1 - Breaking Bad
  const bb_s1 = await prisma.season.upsert({
    where: { movieId_number: { movieId: breakingBad.id, number: 1 } },
    update: {},
    create: {
      movieId: breakingBad.id,
      number: 1,
      title: 'Season 1',
    },
  })

  const bb_s1_episodes = [
    { number: 1, title: 'Pilot', duration: 58 },
    { number: 2, title: "Cat's in the Bag", duration: 48 },
    { number: 3, title: "...And the Bag's in the River", duration: 48 },
    { number: 4, title: 'Cancer Man', duration: 48 },
    { number: 5, title: 'Gray Matter', duration: 48 },
    { number: 6, title: 'Crazy Handful of Nothin', duration: 48 },
    { number: 7, title: 'A No-Rough-Stuff-Type Deal', duration: 48 },
  ]

  for (const ep of bb_s1_episodes) {
    await prisma.episode.upsert({
      where: { seasonId_number: { seasonId: bb_s1.id, number: ep.number } },
      update: {},
      create: {
        seasonId: bb_s1.id,
        number: ep.number,
        title: ep.title,
        duration: ep.duration,
        videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      },
    })
  }

  // Season 2 - Breaking Bad
  const bb_s2 = await prisma.season.upsert({
    where: { movieId_number: { movieId: breakingBad.id, number: 2 } },
    update: {},
    create: {
      movieId: breakingBad.id,
      number: 2,
      title: 'Season 2',
    },
  })

  for (let i = 1; i <= 13; i++) {
    await prisma.episode.upsert({
      where: { seasonId_number: { seasonId: bb_s2.id, number: i } },
      update: {},
      create: {
        seasonId: bb_s2.id,
        number: i,
        title: `Episode ${i}`,
        duration: 47,
        videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      },
    })
  }

  const squidGame = await prisma.movie.upsert({
    where: { id: 'series-squid-game-001' },
    update: {},
    create: {
      id: 'series-squid-game-001',
      title: 'Squid Game',
      description: 'Hàng trăm người mắc nợ tham gia trò chơi sinh tồn bí ẩn với giải thưởng khổng lồ.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93X2Fe7NFhkJQo.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=oqxAJKy0ii4',
      type: ContentType.SERIES,
      isPublished: true,
      genres: {
        create: [
          { genre: { connect: { id: genreMap['Drama'].id } } },
          { genre: { connect: { id: genreMap['Thriller'].id } } },
          { genre: { connect: { id: genreMap['Action'].id } } },
        ],
      },
    },
  })

  const sg_s1 = await prisma.season.upsert({
    where: { movieId_number: { movieId: squidGame.id, number: 1 } },
    update: {},
    create: {
      movieId: squidGame.id,
      number: 1,
      title: 'Season 1',
    },
  })

  const sg_episodes = [
    { number: 1, title: 'Red Light, Green Light', duration: 60 },
    { number: 2, title: 'Hell', duration: 63 },
    { number: 3, title: 'The Man with the Umbrella', duration: 56 },
    { number: 4, title: 'Stick to the Team', duration: 58 },
    { number: 5, title: 'A Fair World', duration: 54 },
    { number: 6, title: 'Gganbu', duration: 61 },
    { number: 7, title: 'VIPS', duration: 60 },
    { number: 8, title: 'Front Man', duration: 32 },
    { number: 9, title: 'One Lucky Day', duration: 58 },
  ]

  for (const ep of sg_episodes) {
    await prisma.episode.upsert({
      where: { seasonId_number: { seasonId: sg_s1.id, number: ep.number } },
      update: {},
      create: {
        seasonId: sg_s1.id,
        number: ep.number,
        title: ep.title,
        duration: ep.duration,
        videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      },
    })
  }

  console.log('✓ Series (Breaking Bad, Squid Game) created')

  // ============================================================
  // PLANS
  // ============================================================
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { name: 'Basic' },
      update: {},
      create: {
        name: 'Basic',
        price: 99000,
        description: '1 màn hình, chất lượng SD',
        maxScreens: 1,
      },
    }),
    prisma.plan.upsert({
      where: { name: 'Standard' },
      update: {},
      create: {
        name: 'Standard',
        price: 179000,
        description: '2 màn hình, chất lượng HD',
        maxScreens: 2,
      },
    }),
    prisma.plan.upsert({
      where: { name: 'Premium' },
      update: {},
      create: {
        name: 'Premium',
        price: 249000,
        description: '4 màn hình, chất lượng 4K',
        maxScreens: 4,
      },
    }),
  ])

  const [basicPlan, standardPlan] = plans
  console.log('✓ Plans created')

  // ============================================================
  // SUBSCRIPTIONS & PAYMENTS
  // ============================================================
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

  await prisma.subscription.upsert({
    where: { id: 'sub-alice-001' },
    update: {},
    create: {
      id: 'sub-alice-001',
      userId: user1.id,
      planId: standardPlan.id,
      status: SubscriptionStatus.ACTIVE,
      startedAt: now,
      expiresAt: nextMonth,
    },
  })

  await prisma.payment.upsert({
    where: { id: 'pay-alice-001' },
    update: {},
    create: {
      id: 'pay-alice-001',
      userId: user1.id,
      planId: standardPlan.id,
      amount: standardPlan.price,
      status: PaymentStatus.SUCCESS,
      paidAt: now,
    },
  })

  await prisma.subscription.upsert({
    where: { id: 'sub-bob-001' },
    update: {},
    create: {
      id: 'sub-bob-001',
      userId: user2.id,
      planId: basicPlan.id,
      status: SubscriptionStatus.ACTIVE,
      startedAt: now,
      expiresAt: nextMonth,
    },
  })

  await prisma.payment.upsert({
    where: { id: 'pay-bob-001' },
    update: {},
    create: {
      id: 'pay-bob-001',
      userId: user2.id,
      planId: basicPlan.id,
      amount: basicPlan.price,
      status: PaymentStatus.SUCCESS,
      paidAt: now,
    },
  })

  console.log('✓ Subscriptions & Payments created')

  // ============================================================
  // WATCH HISTORY & PROGRESS
  // ============================================================
  await prisma.watchHistory.createMany({
    skipDuplicates: true,
    data: [
      { userId: user1.id, movieId: avengers.id },
      { userId: user1.id, movieId: inception.id },
      { userId: user2.id, movieId: avengers.id },
    ],
  })

  const existingProgress = await prisma.watchProgress.findFirst({
    where: { userId: user1.id, movieId: avengers.id, episodeId: null },
  })
  if (!existingProgress) {
    await prisma.watchProgress.create({
      data: { userId: user1.id, movieId: avengers.id, progressSec: 3600 },
    })
  }

  await prisma.watchList.createMany({
    skipDuplicates: true,
    data: [
      { userId: user1.id, movieId: breakingBad.id },
      { userId: user1.id, movieId: squidGame.id },
      { userId: user2.id, movieId: inception.id },
    ],
  })

  console.log('✓ Watch history, progress, watchlist created')

  // ============================================================
  // RATINGS
  // ============================================================
  await prisma.rating.createMany({
    skipDuplicates: true,
    data: [
      { userId: user1.id, movieId: avengers.id, score: 5 },
      { userId: user1.id, movieId: inception.id, score: 5 },
      { userId: user2.id, movieId: avengers.id, score: 4 },
      { userId: user2.id, movieId: breakingBad.id, score: 5 },
    ],
  })

  console.log('✓ Ratings created')

  // ============================================================
  // COMMENTS
  // ============================================================
  const comment1 = await prisma.comment.upsert({
    where: { id: 'comment-001' },
    update: {},
    create: {
      id: 'comment-001',
      userId: user1.id,
      movieId: avengers.id,
      content: 'Phim hay tuyệt vời! Cảnh cuối rất xúc động.',
    },
  })

  await prisma.comment.upsert({
    where: { id: 'comment-002' },
    update: {},
    create: {
      id: 'comment-002',
      userId: user2.id,
      movieId: avengers.id,
      parentId: comment1.id,
      content: 'Đồng ý! Tony Stark là nhân vật hay nhất.',
    },
  })

  await prisma.comment.upsert({
    where: { id: 'comment-003' },
    update: {},
    create: {
      id: 'comment-003',
      userId: user2.id,
      movieId: inception.id,
      content: 'Cái kết mở này khiến tôi suy nghĩ mãi.',
    },
  })

  console.log('✓ Comments created')

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: user1.id,
        type: NotificationType.NEW_MOVIE,
        title: 'Phim mới vừa ra mắt!',
        body: 'Squid Game Season 2 đã có mặt trên Netflix. Xem ngay!',
      },
      {
        userId: user1.id,
        type: NotificationType.SUBSCRIPTION,
        title: 'Gói của bạn sắp hết hạn',
        body: 'Gói Standard của bạn sẽ hết hạn sau 7 ngày. Gia hạn ngay để tiếp tục xem.',
      },
      {
        userId: user2.id,
        type: NotificationType.NEW_EPISODE,
        title: 'Tập mới của Breaking Bad',
        body: 'Breaking Bad Season 2 Episode 1 đã có mặt. Xem ngay!',
      },
    ],
  })

  console.log('✓ Notifications created')

  console.log('\n✅ Seed completed!')
  console.log('----------------------------')
  console.log('Admin:  admin@netflix.com / password123')
  console.log('User 1: alice@gmail.com   / password123')
  console.log('User 2: bob@gmail.com     / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
