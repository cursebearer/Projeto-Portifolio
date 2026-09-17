-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'SHARE';

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "previous_document_id" TEXT;

-- CreateTable
CREATE TABLE "document_shares" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "shared_by_user_id" TEXT NOT NULL,
    "shared_with_email" TEXT NOT NULL,
    "message" VARCHAR(500),
    "comprovante_hash" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verification_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "document_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_shares_document_id_idx" ON "document_shares"("document_id");

-- CreateIndex
CREATE INDEX "document_shares_shared_by_user_id_idx" ON "document_shares"("shared_by_user_id");

-- CreateIndex
CREATE INDEX "document_shares_shared_with_email_idx" ON "document_shares"("shared_with_email");

-- CreateIndex
CREATE INDEX "document_shares_sent_at_idx" ON "document_shares"("sent_at");

-- CreateIndex
CREATE INDEX "documents_previous_document_id_idx" ON "documents"("previous_document_id");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_previous_document_id_fkey" FOREIGN KEY ("previous_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_shared_by_user_id_fkey" FOREIGN KEY ("shared_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
