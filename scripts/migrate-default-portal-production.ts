import postgres from "postgres";

const EXPECTED_FINAL_VALUES = ["player", "organization"] as const;

type EnumLabelRow = { enumlabel: string };
type PreferenceCountRow = { default_portal: string; count: number };

const loadEnumLabels = async (client: postgres.Sql) => {
  const rows = await client.unsafe<EnumLabelRow[]>(`
    select e.enumlabel
    from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'default_portal'
    order by e.enumsortorder
  `);

  return rows.map((row) => String(row.enumlabel));
};

const loadPreferenceCounts = async (client: postgres.Sql) => {
  const rows = await client.unsafe<PreferenceCountRow[]>(`
    select default_portal::text as default_portal, count(*)::int as count
    from public.user_preferences
    group by default_portal
    order by default_portal::text asc
  `);

  return rows.map((row) => ({
    defaultPortal: String(row.default_portal),
    count: Number(row.count),
  }));
};

const main = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);

  try {
    const beforeEnumLabels = await loadEnumLabels(client);
    const hasOwner = beforeEnumLabels.includes("owner");
    const hasOrganization = beforeEnumLabels.includes("organization");

    let action: "renamed" | "noop" = "noop";

    if (hasOwner && !hasOrganization) {
      await client.unsafe(`
        ALTER TYPE "public"."default_portal"
        RENAME VALUE 'owner' TO 'organization'
      `);
      action = "renamed";
    } else if (!hasOwner && hasOrganization) {
      action = "noop";
    } else if (hasOwner && hasOrganization) {
      throw new Error(
        [
          "Invalid enum state for default_portal: both 'owner' and 'organization' exist.",
          "Refusing to mutate automatically.",
        ].join(" "),
      );
    } else {
      throw new Error(
        `Invalid enum state for default_portal. Current labels: ${beforeEnumLabels.join(", ") || "(none)"}`,
      );
    }

    const afterEnumLabels = await loadEnumLabels(client);
    const preferenceCounts = await loadPreferenceCounts(client);

    const missingFinalLabels = EXPECTED_FINAL_VALUES.filter(
      (label) => !afterEnumLabels.includes(label),
    );
    const unexpectedFinalLabels = afterEnumLabels.filter(
      (label) =>
        !EXPECTED_FINAL_VALUES.includes(
          label as (typeof EXPECTED_FINAL_VALUES)[number],
        ),
    );
    const ownerRows = preferenceCounts.find(
      (row) => row.defaultPortal === "owner",
    );

    const errors: string[] = [];
    if (missingFinalLabels.length > 0) {
      errors.push(
        `Missing final enum labels: ${missingFinalLabels.join(", ")}`,
      );
    }
    if (unexpectedFinalLabels.length > 0) {
      errors.push(
        `Unexpected final enum labels: ${unexpectedFinalLabels.join(", ")}`,
      );
    }
    if (ownerRows && ownerRows.count > 0) {
      errors.push(
        `Found ${ownerRows.count} user preference rows still using "owner"`,
      );
    }

    console.info(
      JSON.stringify(
        {
          action,
          beforeEnumLabels,
          afterEnumLabels,
          preferenceCounts,
          ok: errors.length === 0,
        },
        null,
        2,
      ),
    );

    if (errors.length > 0) {
      throw new Error(
        `Default portal production migration failed validation: ${errors.join(" | ")}`,
      );
    }
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error("Default portal production migration failed", error);
  process.exit(1);
});
