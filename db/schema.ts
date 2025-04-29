import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const personaOwners = pgTable('persona_owners', {
  id: uuid('id').primaryKey().defaultRandom(),
  personaId: text('persona_id').notNull(),
  ownerId: text('owner_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Types for TypeScript
export type PersonaOwner = typeof personaOwners.$inferSelect;
export type NewPersonaOwner = typeof personaOwners.$inferInsert; 