ALTER TABLE "TripPlace" ADD COLUMN "dayIndex" INTEGER;

CREATE TABLE "TripChecklist" (
  "id" SERIAL PRIMARY KEY,
  "tripId" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "checked" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "TripChecklist_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE
);

CREATE TABLE "TripExpense" (
  "id" SERIAL PRIMARY KEY,
  "tripId" INTEGER NOT NULL,
  "date" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  CONSTRAINT "TripExpense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE
);
