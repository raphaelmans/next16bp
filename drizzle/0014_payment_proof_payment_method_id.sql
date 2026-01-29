ALTER TABLE "payment_proof" ADD COLUMN "payment_method_id" uuid;
ALTER TABLE "payment_proof" ADD CONSTRAINT "payment_proof_payment_method_id_organization_payment_method_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."organization_payment_method"("id") ON DELETE set null ON UPDATE no action;
