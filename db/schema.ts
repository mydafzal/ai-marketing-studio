import { pgTable, text, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const personaOwners = pgTable(
  'persona_owners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    personaId: text('persona_id').notNull(),
    ownerId: text('owner_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => {
    return {
      personaIdIdx: index('idx_persona_owners_persona_id').on(table.personaId),
      ownerIdIdx: index('idx_persona_owners_owner_id').on(table.ownerId),
      uniquePersonaOwner: uniqueIndex('idx_unique_persona_owner').on(table.personaId, table.ownerId)
    };
  }
);
