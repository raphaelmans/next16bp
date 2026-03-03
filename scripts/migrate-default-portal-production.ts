import postgres from "postgres";

const EXPECTED_FINAL_VALUES = ["player", "organization"] as const;
const LEGACY_VALUE = "owner";
const DEFAULT_VALUE = "player";
const SCHEMA_NAME = "public";
const TABLE_NAME = "user_preferences";
const COLUMN_NAME = "default_portal";

type EnumLabelRow = { enumlabel: string };
type PreferenceCountRow = { default_portal: string; count: number };
type ColumnTypeRow = { data_type: string; udt_name: string };

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
    select ${COLUMN_NAME}::text as default_portal, count(*)::int as count
    from ${SCHEMA_NAME}.${TABLE_NAME}
    group by default_portal
    order by default_portal::text asc
  `);

  return rows.map((row) => ({
    defaultPortal: String(row.default_portal),
    count: Number(row.count),
  }));
};

const loadColumnType = async (client: postgres.Sql) => {
  const rows = await client.unsafe<ColumnTypeRow[]>(`
    select data_type, udt_name
    from information_schema.columns
    where table_schema = '${SCHEMA_NAME}'
      and table_name = '${TABLE_NAME}'
      and column_name = '${COLUMN_NAME}'
    limit 1
  `);

  const row = rows[0];
  if (!row) {
    throw new Error(
      `Column not found: ${SCHEMA_NAME}.${TABLE_NAME}.${COLUMN_NAME}`,
    );
  }

  return {
    dataType: String(row.data_type),
    udtName: String(row.udt_name),
  };
};

const main = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString, { max: 1 });

  try {
    await client.unsafe("begin");

    const beforeEnumLabels = await loadEnumLabels(client);
    const hasOwner = beforeEnumLabels.includes(LEGACY_VALUE);
    const hasOrganization = beforeEnumLabels.includes("organization");
    const beforeColumnType = await loadColumnType(client);

    let action: "renamed" | "normalized_and_converted" | "noop" = "noop";

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

    if (beforeColumnType.udtName === "text") {
      const unexpectedRows = await client.unsafe<
        { value: string; count: number }[]
      >(
        `
        select ${COLUMN_NAME}::text as value, count(*)::int as count
        from ${SCHEMA_NAME}.${TABLE_NAME}
        where ${COLUMN_NAME}::text not in ('player', 'organization', 'owner')
        group by ${COLUMN_NAME}
        order by ${COLUMN_NAME}::text asc
        `,
      );

      if (unexpectedRows.length > 0) {
        throw new Error(
          `Unexpected values in ${SCHEMA_NAME}.${TABLE_NAME}.${COLUMN_NAME}: ${JSON.stringify(unexpectedRows)}`,
        );
      }

      await client.unsafe(`
        update ${SCHEMA_NAME}.${TABLE_NAME}
        set ${COLUMN_NAME} = 'organization'
        where ${COLUMN_NAME} = 'owner'
      `);

      await client.unsafe(`
        alter table ${SCHEMA_NAME}.${TABLE_NAME}
        alter column ${COLUMN_NAME} drop default
      `);

      await client.unsafe(`
        alter table ${SCHEMA_NAME}.${TABLE_NAME}
        alter column ${COLUMN_NAME}
        type ${SCHEMA_NAME}.${COLUMN_NAME}
        using (
          case
            when ${COLUMN_NAME} = 'owner' then 'organization'::${SCHEMA_NAME}.${COLUMN_NAME}
            else ${COLUMN_NAME}::${SCHEMA_NAME}.${COLUMN_NAME}
          end
        )
      `);

      await client.unsafe(`
        alter table ${SCHEMA_NAME}.${TABLE_NAME}
        alter column ${COLUMN_NAME}
        set default '${DEFAULT_VALUE}'::${SCHEMA_NAME}.${COLUMN_NAME}
      `);

      action = "normalized_and_converted";
    }

    const afterEnumLabels = await loadEnumLabels(client);
    const preferenceCounts = await loadPreferenceCounts(client);
    const afterColumnType = await loadColumnType(client);

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
      (row) => row.defaultPortal === LEGACY_VALUE,
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
    if (afterColumnType.udtName !== COLUMN_NAME) {
      errors.push(
        `Expected ${SCHEMA_NAME}.${TABLE_NAME}.${COLUMN_NAME} to use enum type "${COLUMN_NAME}", found "${afterColumnType.udtName}"`,
      );
    }

    console.info(
      JSON.stringify(
        {
          action,
          beforeColumnType,
          afterColumnType,
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
      await client.unsafe("rollback");
      throw new Error(
        `Default portal production migration failed validation: ${errors.join(" | ")}`,
      );
    }

    await client.unsafe("commit");
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error("Default portal production migration failed", error);
  process.exit(1);
});
