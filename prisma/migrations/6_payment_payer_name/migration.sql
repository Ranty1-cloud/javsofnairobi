-- Name the payer gave for their M-Pesa payment (at least two names), shown to staff next to the code and amount.
ALTER TABLE "Payment" ADD COLUMN "payerName" TEXT;
