CREATE TABLE "PushSubscription" (
  "id"       SERIAL PRIMARY KEY,
  "user"     TEXT NOT NULL,
  "endpoint" TEXT NOT NULL UNIQUE,
  "p256dh"   TEXT NOT NULL,
  "auth"     TEXT NOT NULL
);
