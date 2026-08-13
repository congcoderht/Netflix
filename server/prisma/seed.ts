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
  // ACTORS
  // ============================================================
  const actorData = [
    // Avengers cast
    { id: 'actor-rdj', name: 'Robert Downey Jr.', avatar: 'https://image.tmdb.org/t/p/w185/5qHNjhtjMD4YWH3UP0rm4tKwxCL.jpg', bio: 'Diễn viên người Mỹ nổi tiếng với vai Iron Man.' },
    { id: 'actor-chris-evans', name: 'Chris Evans', avatar: 'https://image.tmdb.org/t/p/w185/3bOGNsHlrswhyW79uvIHH1V43JI.jpg', bio: 'Diễn viên người Mỹ, nổi tiếng với vai Captain America.' },
    { id: 'actor-scarlett', name: 'Scarlett Johansson', avatar: 'https://image.tmdb.org/t/p/w185/6NsMbJXRlDZuDzatN2akFdGuTvx.jpg', bio: 'Nữ diễn viên người Mỹ, vai Black Widow.' },
    { id: 'actor-russo', name: 'Anthony & Joe Russo', avatar: null, bio: 'Đạo diễn bộ đôi nổi tiếng với Avengers: Endgame.' },
    { id: 'actor-kevin', name: 'Kevin Feige', avatar: null, bio: 'Giám đốc sản xuất Marvel Studios.' },
    // Inception cast
    { id: 'actor-dicaprio', name: 'Leonardo DiCaprio', avatar: 'https://image.tmdb.org/t/p/w185/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg', bio: 'Diễn viên người Mỹ, nổi tiếng với Titanic, Inception.' },
    { id: 'actor-joseph', name: 'Joseph Gordon-Levitt', avatar: 'https://image.tmdb.org/t/p/w185/4U9G4YwTlIEbAymBaseltS5uKAm.jpg', bio: 'Diễn viên người Mỹ.' },
    { id: 'actor-nolan', name: 'Christopher Nolan', avatar: 'https://image.tmdb.org/t/p/w185/xuAIuYSmsUzKlUMzmxHkyLNX1oC.jpg', bio: 'Đạo diễn thiên tài người Anh-Mỹ.' },
    // Breaking Bad cast
    { id: 'actor-cranston', name: 'Bryan Cranston', avatar: 'https://image.tmdb.org/t/p/w185/7Jahy5LZX2Fo8fGJltMreAI49hC.jpg', bio: 'Diễn viên người Mỹ, vai Walter White.' },
    { id: 'actor-paul', name: 'Aaron Paul', avatar: 'https://image.tmdb.org/t/p/w185/bMB4n8VLGIkvVNUBSbRFCdXKO5O.jpg', bio: 'Diễn viên người Mỹ, vai Jesse Pinkman.' },
    { id: 'actor-vince', name: 'Vince Gilligan', avatar: null, bio: 'Đạo diễn và người tạo ra Breaking Bad.' },
    // Squid Game cast
    { id: 'actor-lee', name: 'Lee Jung-jae', avatar: 'https://image.tmdb.org/t/p/w185/5b5TAyl3T4EVvGHnXSjB4hYvHLG.jpg', bio: 'Diễn viên Hàn Quốc, vai Seong Gi-hun.' },
    { id: 'actor-park', name: 'Park Hae-soo', avatar: 'https://image.tmdb.org/t/p/w185/xRlCCNsHnWqrJr19Kz3A4F7WLSJ.jpg', bio: 'Diễn viên Hàn Quốc, vai Cho Sang-woo.' },
    { id: 'actor-hwang', name: 'Hwang Dong-hyuk', avatar: null, bio: 'Đạo diễn và người tạo ra Squid Game.' },
  ]

  const actors = await Promise.all(
    actorData.map((a) =>
      prisma.actor.upsert({
        where: { id: a.id },
        update: {},
        create: a,
      })
    )
  )
  const actorMap = Object.fromEntries(actors.map((a) => [a.id, a]))
  console.log('✓ Actors created')

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

  // Gán diễn viên cho Avengers
  await prisma.actorOnMovie.createMany({
    skipDuplicates: true,
    data: [
      { movieId: avengers.id, actorId: actorMap['actor-rdj'].id, role: 'Diễn viên' },
      { movieId: avengers.id, actorId: actorMap['actor-chris-evans'].id, role: 'Diễn viên' },
      { movieId: avengers.id, actorId: actorMap['actor-scarlett'].id, role: 'Diễn viên' },
      { movieId: avengers.id, actorId: actorMap['actor-russo'].id, role: 'Đạo diễn' },
      { movieId: avengers.id, actorId: actorMap['actor-kevin'].id, role: 'Giám đốc sản xuất' },
    ],
  })

  // Gán diễn viên cho Inception
  await prisma.actorOnMovie.createMany({
    skipDuplicates: true,
    data: [
      { movieId: inception.id, actorId: actorMap['actor-dicaprio'].id, role: 'Diễn viên' },
      { movieId: inception.id, actorId: actorMap['actor-joseph'].id, role: 'Diễn viên' },
      { movieId: inception.id, actorId: actorMap['actor-nolan'].id, role: 'Đạo diễn' },
    ],
  })

  // Thêm nhiều phim lẻ
  const extraMovies = [
    {
      id: 'movie-interstellar-001',
      title: 'Interstellar',
      description: 'Một nhóm phi hành gia du hành qua lỗ sâu đục để tìm kiếm hành tinh mới có thể nuôi sống nhân loại.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
      type: ContentType.MOVIE, duration: 169, isPublished: true,
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      genres: ['Sci-Fi', 'Drama'],
      actors: [{ id: 'actor-nolan', role: 'Đạo diễn' }],
    },
    {
      id: 'movie-darknight-001',
      title: 'The Dark Knight',
      description: 'Batman đối mặt với Joker — một tên tội phạm hỗn loạn muốn gieo rắc sự hỗn độn lên Gotham.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
      type: ContentType.MOVIE, duration: 152, isPublished: true,
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      genres: ['Action', 'Thriller'],
      actors: [{ id: 'actor-nolan', role: 'Đạo diễn' }],
    },
    {
      id: 'movie-parasite-001',
      title: 'Parasite',
      description: 'Một gia đình nghèo khó dần dần xâm nhập vào cuộc sống của một gia đình giàu có.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=5xH0HfJHsaY',
      type: ContentType.MOVIE, duration: 132, isPublished: true,
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      genres: ['Thriller', 'Drama'],
      actors: [],
    },
    {
      id: 'movie-joker-001',
      title: 'Joker',
      description: 'Câu chuyện về Arthur Fleck — một diễn viên hài thất bại dần trở thành tên tội phạm khét tiếng Joker.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=zAGVQLHvwOY',
      type: ContentType.MOVIE, duration: 122, isPublished: true,
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      genres: ['Thriller', 'Drama'],
      actors: [],
    },
    {
      id: 'movie-spiderman-001',
      title: 'Spider-Man: No Way Home',
      description: 'Peter Parker nhờ Doctor Strange thực hiện một phép thuật khiến đa vũ trụ mở ra.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=JfVOs4VSpmA',
      type: ContentType.MOVIE, duration: 148, isPublished: true,
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      genres: ['Action', 'Sci-Fi'],
      actors: [],
    },
    {
      id: 'movie-dune-001',
      title: 'Dune: Part One',
      description: 'Paul Atreides dẫn dắt gia tộc đến hành tinh Arrakis nguy hiểm nhất vũ trụ để kiểm soát gia vị quý hiếm nhất.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/d5NXSklpcvzeBO6cRR3CntKpo9X.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=8g18jFHCLXk',
      type: ContentType.MOVIE, duration: 155, isPublished: true,
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      genres: ['Sci-Fi', 'Action'],
      actors: [],
    },
    {
      id: 'movie-oppenheimer-001',
      title: 'Oppenheimer',
      description: 'Câu chuyện về J. Robert Oppenheimer — cha đẻ của bom nguyên tử và những hệ quả đạo đức khủng khiếp.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
      type: ContentType.MOVIE, duration: 180, isPublished: true,
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      genres: ['Drama', 'Thriller'],
      actors: [{ id: 'actor-nolan', role: 'Đạo diễn' }],
    },
    {
      id: 'movie-wolf-001',
      title: 'The Wolf of Wall Street',
      description: 'Câu chuyện có thật về Jordan Belfort — một môi giới chứng khoán tham lam và lối sống phóng túng.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/pWHf4khOloNVfCxscsXFj3jj6gP.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=iszwuX1AK6A',
      type: ContentType.MOVIE, duration: 180, isPublished: true,
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      genres: ['Drama', 'Comedy'],
      actors: [{ id: 'actor-dicaprio', role: 'Diễn viên' }],
    },
    {
      id: 'movie-gladiator-001',
      title: 'Gladiator',
      description: 'Một vị tướng La Mã bị phản bội và buộc phải chiến đấu trong đấu trường để giành lại danh dự.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=UrXwAcSxRYw',
      type: ContentType.MOVIE, duration: 155, isPublished: true,
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      genres: ['Action', 'Drama'],
      actors: [],
    },
    {
      id: 'movie-matrix-001',
      title: 'The Matrix',
      description: 'Thomas Anderson khám phá ra sự thật rằng thực tại anh đang sống chỉ là một thế giới ảo do máy móc tạo ra.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=vKQi3bBA1y8',
      type: ContentType.MOVIE, duration: 136, isPublished: true,
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      genres: ['Sci-Fi', 'Action'],
      actors: [],
    },
  ]

  for (const m of extraMovies) {
    const movie = await prisma.movie.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id, title: m.title, description: m.description,
        thumbnail: m.thumbnail, trailerUrl: m.trailerUrl,
        type: m.type, duration: m.duration, isPublished: m.isPublished,
        videoUrl: m.videoUrl,
        genres: { create: m.genres.map((name) => ({ genre: { connect: { id: genreMap[name].id } } })) },
      },
    })
    if (m.actors.length) {
      await prisma.actorOnMovie.createMany({
        skipDuplicates: true,
        data: m.actors.map((a) => ({ movieId: movie.id, actorId: actorMap[a.id].id, role: a.role })),
      })
    }
  }

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

  // Gán diễn viên cho Breaking Bad
  await prisma.actorOnMovie.createMany({
    skipDuplicates: true,
    data: [
      { movieId: breakingBad.id, actorId: actorMap['actor-cranston'].id, role: 'Diễn viên' },
      { movieId: breakingBad.id, actorId: actorMap['actor-paul'].id, role: 'Diễn viên' },
      { movieId: breakingBad.id, actorId: actorMap['actor-vince'].id, role: 'Đạo diễn' },
    ],
  })

  // Gán diễn viên cho Squid Game
  await prisma.actorOnMovie.createMany({
    skipDuplicates: true,
    data: [
      { movieId: squidGame.id, actorId: actorMap['actor-lee'].id, role: 'Diễn viên' },
      { movieId: squidGame.id, actorId: actorMap['actor-park'].id, role: 'Diễn viên' },
      { movieId: squidGame.id, actorId: actorMap['actor-hwang'].id, role: 'Đạo diễn' },
    ],
  })

  // Thêm series mới
  const extraSeries = [
    {
      id: 'series-stranger-things-001',
      title: 'Stranger Things',
      description: 'Nhóm bạn trẻ ở Hawkins phát hiện ra thế giới lộn ngược và những bí ẩn siêu nhiên đáng sợ.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=b9EkMc79ZSU',
      genres: ['Sci-Fi', 'Horror', 'Drama'],
      seasons: [
        { number: 1, title: 'Season 1', episodes: 8 },
        { number: 2, title: 'Season 2', episodes: 9 },
        { number: 3, title: 'Season 3', episodes: 8 },
        { number: 4, title: 'Season 4', episodes: 9 },
      ],
    },
    {
      id: 'series-money-heist-001',
      title: 'Money Heist',
      description: 'Giáo sư lên kế hoạch vụ cướp hoàn hảo nhất lịch sử — xâm nhập Nhà Máy In Tiền Hoàng Gia Tây Ban Nha.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=htWTR0ojA88',
      genres: ['Action', 'Thriller', 'Drama'],
      seasons: [
        { number: 1, title: 'Part 1', episodes: 9 },
        { number: 2, title: 'Part 2', episodes: 6 },
        { number: 3, title: 'Part 3', episodes: 8 },
        { number: 4, title: 'Part 4', episodes: 8 },
        { number: 5, title: 'Part 5', episodes: 10 },
      ],
    },
    {
      id: 'series-dark-001',
      title: 'Dark',
      description: 'Bốn gia đình ở thị trấn Winden bị cuốn vào vòng xoáy du hành thời gian đầy bí ẩn.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=rrwycJ08PSA',
      genres: ['Sci-Fi', 'Thriller', 'Drama'],
      seasons: [
        { number: 1, title: 'Season 1', episodes: 10 },
        { number: 2, title: 'Season 2', episodes: 8 },
        { number: 3, title: 'Season 3', episodes: 8 },
      ],
    },
    {
      id: 'series-witcher-001',
      title: 'The Witcher',
      description: 'Geralt of Rivia — thợ săn quái vật bí ẩn — phải đối mặt với thế giới đầy nguy hiểm và âm mưu.',
      thumbnail: 'https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=ndl7APaNO2Y',
      genres: ['Action', 'Drama'],
      seasons: [
        { number: 1, title: 'Season 1', episodes: 8 },
        { number: 2, title: 'Season 2', episodes: 8 },
        { number: 3, title: 'Season 3', episodes: 8 },
      ],
    },
  ]

  for (const s of extraSeries) {
    const series = await prisma.movie.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id, title: s.title, description: s.description,
        thumbnail: s.thumbnail, trailerUrl: s.trailerUrl,
        type: ContentType.SERIES, isPublished: true,
        genres: { create: s.genres.map((name) => ({ genre: { connect: { id: genreMap[name].id } } })) },
      },
    })
    for (const season of s.seasons) {
      const sv = await prisma.season.upsert({
        where: { movieId_number: { movieId: series.id, number: season.number } },
        update: {},
        create: { movieId: series.id, number: season.number, title: season.title },
      })
      for (let i = 1; i <= season.episodes; i++) {
        await prisma.episode.upsert({
          where: { seasonId_number: { seasonId: sv.id, number: i } },
          update: {},
          create: {
            seasonId: sv.id, number: i,
            title: `Episode ${i}`, duration: 45,
            videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
          },
        })
      }
    }
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
