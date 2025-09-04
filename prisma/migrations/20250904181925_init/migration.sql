-- CreateTable
CREATE TABLE "public"."Day" (
    "id" SERIAL NOT NULL,
    "dateStr" TEXT NOT NULL,
    "who" TEXT,
    "lesson" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Day_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Day_dateStr_key" ON "public"."Day"("dateStr");
