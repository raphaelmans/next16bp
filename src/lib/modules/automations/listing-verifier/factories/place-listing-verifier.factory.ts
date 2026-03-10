import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/shared/infra/db/schema";
import type { DbClient } from "@/lib/shared/infra/db/types";
import { PlaceListingVerifierRepository } from "../repositories/place-listing-verifier.repository";
import { PlaceListingVerifierService } from "../services/place-listing-verifier.service";
import { RunPlaceListingVerifierUseCase } from "../use-cases/run-place-listing-verifier.use-case";

export function makeRunPlaceListingVerifierUseCase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString, {
    connect_timeout: 30,
    idle_timeout: 20 * 60,
    max_lifetime: 60 * 30,
    max: 5,
    prepare: false,
  });

  const db: DbClient = drizzle({ client, casing: "snake_case", schema });
  const repository = new PlaceListingVerifierRepository(db);
  const verifier = new PlaceListingVerifierService();

  const useCase = new RunPlaceListingVerifierUseCase(repository, verifier);

  return {
    useCase,
    close: async () => {
      await client.end();
    },
  };
}
