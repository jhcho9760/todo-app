CREATE TABLE "DiaryEntry" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "mood" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiaryEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DiaryEntry_date_key" ON "DiaryEntry"("date");
