-- CreateTable "Trip"
CREATE TABLE "Trip" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "startDate" TEXT NOT NULL,
  "endDate" TEXT,
  "memo" TEXT NOT NULL DEFAULT '',
  "coverPlaceId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable "TripPlace"
CREATE TABLE "TripPlace" (
  "id" SERIAL PRIMARY KEY,
  "tripId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "memo" TEXT NOT NULL DEFAULT '',
  "visitedAt" TEXT,
  "photoData" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TripPlace_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE
);
