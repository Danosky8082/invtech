-- AlterTable
ALTER TABLE "user_simulations" ADD COLUMN     "price_at_simulation" DOUBLE PRECISION,
ADD COLUMN     "ticker_at_simulation" TEXT;

-- CreateTable
CREATE TABLE "watchlists" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "watchlists_user_id_asset_id_key" ON "watchlists"("user_id", "asset_id");

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
