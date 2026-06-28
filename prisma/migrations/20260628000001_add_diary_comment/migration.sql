CREATE TABLE "DiaryComment" (
    "id" SERIAL NOT NULL,
    "diaryDate" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiaryComment_pkey" PRIMARY KEY ("id")
);
