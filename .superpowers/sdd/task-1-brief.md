## Task 1: Prisma 스키마 — Trip / TripPlace 모델 추가

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `Trip { id, name, startDate, endDate?, memo, coverPlaceId?, createdAt }`, `TripPlace { id, tripId, name, lat, lng, memo, visitedAt?, photoData?, createdAt }`

- [ ] **Step 1: schema.prisma에 모델 추가**

`prisma/schema.prisma` 파일 끝에 추가:

```prisma
model Trip {
  id           Int         @id @default(autoincrement())
  name         String
  startDate    String
  endDate      String?
  memo         String      @default("")
  coverPlaceId Int?
  createdAt    DateTime    @default(now())
  places       TripPlace[]
}

model TripPlace {
  id        Int      @id @default(autoincrement())
  tripId    Int
  name      String
  lat       Float
  lng       Float
  memo      String   @default("")
  visitedAt String?
  photoData String?
  createdAt DateTime @default(now())
  trip      Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 2: 마이그레이션 생성 및 적용**

```bash
npx prisma migrate dev --name add_trip
```

Expected output: `✔ Generated Prisma Client` 및 마이그레이션 파일 생성

- [ ] **Step 3: Prisma 클라이언트 재생성 확인**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 4: 커밋**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: Trip, TripPlace Prisma 모델 추가"
```

---

