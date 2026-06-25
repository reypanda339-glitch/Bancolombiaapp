import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userContactsTable = pgTable("user_contacts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull().default(""),
  phoneNumbers: jsonb("phone_numbers").$type<string[]>().notNull().default([]),
  emails: jsonb("emails").$type<string[]>().notNull().default([]),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserContactSchema = createInsertSchema(userContactsTable).omit({ createdAt: true, syncedAt: true });
export type InsertUserContact = z.infer<typeof insertUserContactSchema>;
export type DbUserContact = typeof userContactsTable.$inferSelect;
