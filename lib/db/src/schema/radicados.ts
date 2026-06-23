import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const radicadosTable = pgTable("radicados", {
  id: text("id").primaryKey(),
  radicado: text("radicado").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  documentNumber: text("document_number").notNull(),
  motive: text("motive").notNull(),
  description: text("description"),
  expiresAt: text("expires_at").notNull(),
  createdBy: text("created_by"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRadicadoSchema = createInsertSchema(radicadosTable).omit({ createdAt: true });
export type InsertRadicado = z.infer<typeof insertRadicadoSchema>;
export type DbRadicado = typeof radicadosTable.$inferSelect;
