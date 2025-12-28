import { db } from "./db";
import { 
  users, profiles, properties, leads,
  type User, type UpsertUser,
  type Profile, type InsertProfile,
  type Property, type InsertProperty, type UpdatePropertyRequest,
  type Lead, type InsertLead, type UpdateLeadRequest
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Auth & Profile
  getUser(id: string): Promise<User | undefined>;
  getProfile(userId: string): Promise<Profile | undefined>;
  updateProfile(userId: string, profile: Partial<InsertProfile>): Promise<Profile>;
  
  // Properties
  getProperties(filters?: { type?: string; status?: string; agentId?: string }): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, updates: UpdatePropertyRequest): Promise<Property>;
  deleteProperty(id: number): Promise<void>;

  // Leads
  getLeads(filters?: { status?: string; assignedTo?: string }): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, updates: UpdateLeadRequest): Promise<Lead>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async updateProfile(userId: string, profile: Partial<InsertProfile>): Promise<Profile> {
    const [existing] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    
    if (existing) {
      const [updated] = await db
        .update(profiles)
        .set(profile)
        .where(eq(profiles.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(profiles)
        .values({ ...profile, userId } as InsertProfile)
        .returning();
      return created;
    }
  }

  async getProperties(filters?: { type?: string; status?: string; agentId?: string }): Promise<Property[]> {
    let query = db.select().from(properties).orderBy(desc(properties.createdAt));
    
    if (filters) {
      if (filters.type) {
        query = query.where(eq(properties.type, filters.type as any)) as any;
      }
      if (filters.status) {
        query = query.where(eq(properties.status, filters.status as any)) as any;
      }
      if (filters.agentId) {
        query = query.where(eq(properties.agentId, filters.agentId)) as any;
      }
    }
    
    return await query;
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [created] = await db.insert(properties).values(property).returning();
    return created;
  }

  async updateProperty(id: number, updates: UpdatePropertyRequest): Promise<Property> {
    const [updated] = await db
      .update(properties)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return updated;
  }

  async deleteProperty(id: number): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

  async getLeads(filters?: { status?: string; assignedTo?: string }): Promise<Lead[]> {
    let query = db.select().from(leads).orderBy(desc(leads.createdAt));

    if (filters) {
      if (filters.status) {
        query = query.where(eq(leads.status, filters.status as any)) as any;
      }
      if (filters.assignedTo) {
        query = query.where(eq(leads.assignedTo, filters.assignedTo)) as any;
      }
    }

    return await query;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [created] = await db.insert(leads).values(lead).returning();
    return created;
  }

  async updateLead(id: number, updates: UpdateLeadRequest): Promise<Lead> {
    const [updated] = await db.update(leads).set(updates).where(eq(leads.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
