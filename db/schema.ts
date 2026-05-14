import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial().primaryKey(),
  username: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  salt: text().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: serial().primaryKey(),
  userId: text("user_id").notNull().unique(),
  savedAccounts: jsonb("saved_accounts").default([]),
  propSettings: jsonb("prop_settings").default({}),
  tradeHistory: jsonb("trade_history").default([]),
  metaToken: text("meta_token").default(""),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
