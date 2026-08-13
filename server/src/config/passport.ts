import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { config } from './index'
import { prisma } from '../lib/prisma'

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value
        if (!email) return done(new Error('No email from Google'))

        // Tìm oauth account đã tồn tại
        const existingOAuth = await prisma.oAuthAccount.findUnique({
          where: {
            provider_providerAccountId: {
              provider: 'GOOGLE',
              providerAccountId: profile.id,
            },
          },
          include: { user: true },
        })

        if (existingOAuth) {
          if (existingOAuth.user.isBlocked) return done(null, false, { message: 'Account is blocked' })
          return done(null, existingOAuth.user)
        }

        // Tìm user theo email hoặc tạo mới
        let user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
            },
          })
        }

        if (user.isBlocked) return done(null, false, { message: 'Account is blocked' })

        // Tạo oauth account
        await prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'GOOGLE',
            providerAccountId: profile.id,
            accessToken: _accessToken,
          },
        })

        return done(null, user)
      } catch (err) {
        return done(err)
      }
    }
  )
)

export default passport
