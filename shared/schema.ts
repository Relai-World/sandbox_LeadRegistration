import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

// === TABLE DEFINITIONS ===

// Extend the users table from auth model with application specific fields
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["admin", "agent"] }).default("agent").notNull(),
  phoneNumber: text("phone_number"),
  agencyName: text("agency_name"),
  licenseNumber: text("license_number"),
  metadata: jsonb("metadata"),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type", { 
    enum: [
      "verified_residential", 
      "unverified_residential", 
      "commercial", 
      "plotting", 
      "commission_residential"
    ] 
  }).notNull(),
  status: text("status", { enum: ["draft", "published", "archived", "sold"] }).default("draft").notNull(),
  price: integer("price"),
  location: text("location"),
  images: text("images").array(),
  features: jsonb("features"), // Flexible storage for property-specific features
  agentId: varchar("agent_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  interest: text("interest"), // Property type or specific property ID
  status: text("status", { enum: ["new", "contacted", "qualified", "closed"] }).default("new").notNull(),
  notes: text("notes"),
  assignedTo: varchar("assigned_to").references(() => users.id), // Agent ID
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true });

// === TYPES ===

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

// Request Types
export type CreatePropertyRequest = InsertProperty;
export type UpdatePropertyRequest = Partial<InsertProperty>;

export type CreateLeadRequest = InsertLead;
export type UpdateLeadRequest = Partial<InsertLead>;

// Response Types
export type PropertyResponse = Property;
export type LeadResponse = Lead;
