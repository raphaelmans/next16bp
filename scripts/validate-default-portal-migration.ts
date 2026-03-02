import postgres from "postgres";

const EXPECTED_PORTAL_VALUES = ["player", "organization"] as const;

const main = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);

  try {
    const enumRows = await client.unsafe<{ enumlabel: string }[]>(`
      select e.enumlabel
      from pg_type t
      join pg_enum e on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
        and t.typname = 'default_portal'
      order by e.enumsortorder
    `);

    const preferenceRows = await client.unsafe<
      { default_portal: string; count: number }[]
    >(`
      select default_portal::text as default_portal, count(*)::int as count
      from public.user_preferences
      group by default_portal
      order by default_portal::text asc
    `);

    const enumLabels = enumRows.map((row) => String(row.enumlabel));
    const expectedLabels = [...EXPECTED_PORTAL_VALUES];

    const missingLabels = expectedLabels.filter(
      (label) => !enumLabels.includes(label),
    );
    const unexpectedLabels = enumLabels.filter(
      (label) =>
        !expectedLabels.includes(
          label as (typeof EXPECTED_PORTAL_VALUES)[number],
        ),
    );

    const preferenceCounts = preferenceRows.map((row) => ({
      defaultPortal: String(row.default_portal),
      count: Number(row.count),
    }));

    const ownerRows = preferenceCounts.find(
      (row) => row.defaultPortal === "owner",
    );

    const errors: string[] = [];
    if (missingLabels.length > 0) {
      errors.push(`Missing enum labels: ${missingLabels.join(", ")}`);
    }
    if (unexpectedLabels.length > 0) {
      errors.push(`Unexpected enum labels: ${unexpectedLabels.join(", ")}`);
    }
    if (ownerRows && ownerRows.count > 0) {
      errors.push(
        `Found ${ownerRows.count} user preference rows with value "owner"`,
      );
    }

    console.info(
      JSON.stringify(
        {
          enumLabels,
          preferenceCounts,
          ok: errors.length === 0,
        },
        null,
        2,
      ),
    );

    if (errors.length > 0) {
      throw new Error(
        `Default portal migration validation failed: ${errors.join(" | ")}`,
      );
    }
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error("Default portal migration validation failed", error);
  process.exit(1);
});
