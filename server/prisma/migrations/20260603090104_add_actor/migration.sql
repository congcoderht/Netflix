-- CreateTable
CREATE TABLE "actors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actor_on_movies" (
    "movie_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "role" TEXT,

    CONSTRAINT "actor_on_movies_pkey" PRIMARY KEY ("movie_id","actor_id")
);

-- AddForeignKey
ALTER TABLE "actor_on_movies" ADD CONSTRAINT "actor_on_movies_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actor_on_movies" ADD CONSTRAINT "actor_on_movies_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "actors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
