-- Flatten every series episode into a standalone movie while preserving the
-- episode UUID. This lets watch activity and playback sessions be remapped
-- without losing their relationship to the content that was watched.

CREATE TEMP TABLE "series_first_movie" AS
SELECT DISTINCT ON (s."movie_id")
  s."movie_id" AS "series_id",
  e."id" AS "movie_id"
FROM "seasons" s
JOIN "episodes" e ON e."season_id" = s."id"
ORDER BY s."movie_id", s."number", e."number";

INSERT INTO "movies" (
  "id", "title", "description", "thumbnail", "trailer_url", "type",
  "is_published", "video_url", "duration", "created_at", "updated_at"
)
SELECT
  e."id",
  m."title" || ' - S' || LPAD(s."number"::text, 2, '0') ||
    'E' || LPAD(e."number"::text, 2, '0') || ': ' || e."title",
  m."description",
  COALESCE(e."thumbnail", m."thumbnail"),
  m."trailer_url",
  'MOVIE'::"ContentType",
  m."is_published",
  e."video_url",
  e."duration",
  e."created_at",
  e."updated_at"
FROM "episodes" e
JOIN "seasons" s ON s."id" = e."season_id"
JOIN "movies" m ON m."id" = s."movie_id"
WHERE m."type" = 'SERIES';

INSERT INTO "genre_on_movies" ("movie_id", "genre_id")
SELECT e."id", gm."genre_id"
FROM "episodes" e
JOIN "seasons" s ON s."id" = e."season_id"
JOIN "genre_on_movies" gm ON gm."movie_id" = s."movie_id"
ON CONFLICT DO NOTHING;

INSERT INTO "actor_on_movies" ("movie_id", "actor_id", "role")
SELECT e."id", am."actor_id", am."role"
FROM "episodes" e
JOIN "seasons" s ON s."id" = e."season_id"
JOIN "actor_on_movies" am ON am."movie_id" = s."movie_id"
ON CONFLICT DO NOTHING;

-- Episode-specific activity follows the newly created standalone movie.
UPDATE "watch_histories"
SET "movie_id" = "episode_id"
WHERE "episode_id" IS NOT NULL;

UPDATE "watch_progresses"
SET "movie_id" = "episode_id"
WHERE "episode_id" IS NOT NULL;

UPDATE "playback_sessions"
SET "movie_id" = "episode_id"
WHERE "episode_id" IS NOT NULL;

-- Series-level data is attached to the first episode so favourites, ratings,
-- comments and activity are not discarded when the series container is removed.
UPDATE "watch_histories" h
SET "movie_id" = f."movie_id"
FROM "series_first_movie" f
WHERE h."movie_id" = f."series_id" AND h."episode_id" IS NULL;

UPDATE "watch_progresses" p
SET "movie_id" = f."movie_id"
FROM "series_first_movie" f
WHERE p."movie_id" = f."series_id" AND p."episode_id" IS NULL;

UPDATE "playback_sessions" p
SET "movie_id" = f."movie_id"
FROM "series_first_movie" f
WHERE p."movie_id" = f."series_id" AND p."episode_id" IS NULL;

UPDATE "comments" c
SET "movie_id" = f."movie_id"
FROM "series_first_movie" f
WHERE c."movie_id" = f."series_id";

UPDATE "ratings" r
SET "movie_id" = f."movie_id"
FROM "series_first_movie" f
WHERE r."movie_id" = f."series_id";

UPDATE "watch_list" w
SET "movie_id" = f."movie_id"
FROM "series_first_movie" f
WHERE w."movie_id" = f."series_id";

-- Keep only the latest activity row if series-level and episode-level records
-- now point to the same standalone movie.
DELETE FROM "watch_histories" older
USING "watch_histories" newer
WHERE older."user_id" = newer."user_id"
  AND older."movie_id" = newer."movie_id"
  AND (
    older."watched_at" < newer."watched_at"
    OR (older."watched_at" = newer."watched_at" AND older."id" < newer."id")
  );

DELETE FROM "watch_progresses" older
USING "watch_progresses" newer
WHERE older."user_id" = newer."user_id"
  AND older."movie_id" = newer."movie_id"
  AND (
    older."updated_at" < newer."updated_at"
    OR (older."updated_at" = newer."updated_at" AND older."id" < newer."id")
  );

DROP INDEX IF EXISTS "watch_progresses_user_movie_film_key";
DROP INDEX IF EXISTS "watch_histories_user_movie_film_key";
DROP INDEX IF EXISTS "watch_histories_user_movie_episode_key";
DROP INDEX IF EXISTS "watch_progresses_user_id_movie_id_episode_id_key";

ALTER TABLE "watch_histories" DROP CONSTRAINT IF EXISTS "watch_histories_episode_id_fkey";
ALTER TABLE "watch_progresses" DROP CONSTRAINT IF EXISTS "watch_progresses_episode_id_fkey";

ALTER TABLE "watch_histories" DROP COLUMN "episode_id";
ALTER TABLE "watch_progresses" DROP COLUMN "episode_id";
ALTER TABLE "playback_sessions" DROP COLUMN "episode_id";

CREATE UNIQUE INDEX "watch_histories_user_movie_key"
ON "watch_histories"("user_id", "movie_id");

CREATE UNIQUE INDEX "watch_progresses_user_id_movie_id_key"
ON "watch_progresses"("user_id", "movie_id");

-- Remove the old series containers only after every dependent record has been
-- moved. Empty series have no standalone content and are removed here as well.
DELETE FROM "playback_sessions"
WHERE "movie_id" IN (SELECT "id" FROM "movies" WHERE "type" = 'SERIES');

DELETE FROM "movies" WHERE "type" = 'SERIES';

DROP TABLE "episodes";
DROP TABLE "seasons";
ALTER TABLE "movies" DROP COLUMN "type";
DROP TYPE "ContentType";

UPDATE "notifications" SET "type" = 'NEW_MOVIE' WHERE "type" = 'NEW_EPISODE';
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
CREATE TYPE "NotificationType" AS ENUM ('NEW_MOVIE', 'SUBSCRIPTION', 'SYSTEM');
ALTER TABLE "notifications"
  ALTER COLUMN "type" TYPE "NotificationType"
  USING ("type"::text::"NotificationType");
DROP TYPE "NotificationType_old";
