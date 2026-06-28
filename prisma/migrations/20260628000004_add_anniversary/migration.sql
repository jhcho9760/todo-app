CREATE TABLE "Anniversary" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎉',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anniversary_pkey" PRIMARY KEY ("id")
);
