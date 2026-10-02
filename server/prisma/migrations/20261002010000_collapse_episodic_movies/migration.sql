-- Collapse the standalone episode rows created by the previous migration into
-- one simple movie per former series. The first episode supplies the retained
-- movie id and playable video; all dependent user data is remapped to it.

CREATE TEMP TABLE "collapsed_movie_map" AS
WITH candidates AS (
  SELECT
    "id" AS "old_id",
    REGEXP_REPLACE("title", ' - S[0-9]+E[0-9]+:.*$', '') AS "base_title",
    "title",
    "created_at"
  FROM "movies"
  WHERE "title" ~ ' - S[0-9]+E[0-9]+:'
), ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY "base_title"
      ORDER BY "title", "created_at", "old_id"
    ) AS "position"
  FROM candidates
), keepers AS (
  SELECT "old_id" AS "keeper_id", "base_title"
  FROM ranked
  WHERE "position" = 1
)
SELECT r."old_id", k."keeper_id", r."base_title"
FROM ranked r
JOIN keepers k USING ("base_title");

-- Temporarily remove uniqueness so multiple episode records can converge on
-- the same movie before duplicates are resolved.
DROP INDEX IF EXISTS "watch_histories_user_movie_key";
DROP INDEX IF EXISTS "watch_progresses_user_id_movie_id_key";

UPDATE "watch_histories" h
SET "movie_id" = m."keeper_id"
FROM "collapsed_movie_map" m
WHERE h."movie_id" = m."old_id";

UPDATE "watch_progresses" p
SET "movie_id" = m."keeper_id"
FROM "collapsed_movie_map" m
WHERE p."movie_id" = m."old_id";

UPDATE "playback_sessions" p
SET "movie_id" = m."keeper_id"
FROM "collapsed_movie_map" m
WHERE p."movie_id" = m."old_id";

UPDATE "comments" c
SET "movie_id" = m."keeper_id"
FROM "collapsed_movie_map" m
WHERE c."movie_id" = m."old_id";

-- Composite-primary-key tables need an insert/delete merge to avoid conflicts.
INSERT INTO "watch_list" ("user_id", "movie_id", "created_at")
SELECT w."user_id", m."keeper_id", MIN(w."created_at")
FROM "watch_list" w
JOIN "collapsed_movie_map" m ON m."old_id" = w."movie_id"
GROUP BY w."user_id", m."keeper_id"
ON CONFLICT ("user_id", "movie_id") DO NOTHING;

DELETE FROM "watch_list" w
USING "collapsed_movie_map" m
WHERE w."movie_id" = m."old_id"
  AND m."old_id" <> m."keeper_id";

INSERT INTO "ratings" ("user_id", "movie_id", "score", "created_at", "updated_at")
SELECT DISTINCT ON (r."user_id", m."keeper_id")
  r."user_id", m."keeper_id", r."score", r."created_at", r."updated_at"
FROM "ratings" r
JOIN "collapsed_movie_map" m ON m."old_id" = r."movie_id"
ORDER BY r."user_id", m."keeper_id", r."updated_at" DESC
ON CONFLICT ("user_id", "movie_id") DO UPDATE
SET "score" = EXCLUDED."score", "updated_at" = EXCLUDED."updated_at";

DELETE FROM "ratings" r
USING "collapsed_movie_map" m
WHERE r."movie_id" = m."old_id"
  AND m."old_id" <> m."keeper_id";

-- Preserve any genre or cast metadata that may have been edited per row.
INSERT INTO "genre_on_movies" ("movie_id", "genre_id")
SELECT DISTINCT m."keeper_id", g."genre_id"
FROM "genre_on_movies" g
JOIN "collapsed_movie_map" m ON m."old_id" = g."movie_id"
ON CONFLICT DO NOTHING;

INSERT INTO "actor_on_movies" ("movie_id", "actor_id", "role")
SELECT DISTINCT ON (m."keeper_id", a."actor_id")
  m."keeper_id", a."actor_id", a."role"
FROM "actor_on_movies" a
JOIN "collapsed_movie_map" m ON m."old_id" = a."movie_id"
ORDER BY m."keeper_id", a."actor_id", a."role" NULLS LAST
ON CONFLICT DO NOTHING;

-- Retain the latest history/progress after all rows point to one movie.
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

CREATE UNIQUE INDEX "watch_histories_user_movie_key"
ON "watch_histories"("user_id", "movie_id");

CREATE UNIQUE INDEX "watch_progresses_user_id_movie_id_key"
ON "watch_progresses"("user_id", "movie_id");

-- Delete episode-like duplicates, then give the retained row the clean title.
DELETE FROM "movies" movie
USING "collapsed_movie_map" m
WHERE movie."id" = m."old_id"
  AND m."old_id" <> m."keeper_id";

UPDATE "movies" movie
SET "title" = m."base_title"
FROM "collapsed_movie_map" m
WHERE movie."id" = m."keeper_id";
