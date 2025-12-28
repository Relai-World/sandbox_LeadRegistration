import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertPropertySchema, insertLeadSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // === USER ROUTES (Original API compatibility) ===

  app.post('/api/user/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      console.log('Login attempt for:', normalizedEmail);

      // Query the UsersData table
      const result = await db.execute(
        sql`SELECT id, username, email, password, role FROM "UsersData" WHERE email = ${normalizedEmail}`
      );

      const user = result.rows[0] as any;

      if (!user) {
        console.log('User not found:', normalizedEmail);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log('User found:', user.email);

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        console.log('Password mismatch for:', normalizedEmail);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log('Login successful for:', normalizedEmail);
      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  });

  app.post('/api/user/signup', async (req, res) => {
    try {
      const { username, email, password, role = 'agent' } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user exists
      const existing = await db.execute(
        sql`SELECT id FROM "UsersData" WHERE email = ${normalizedEmail}`
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      await db.execute(
        sql`INSERT INTO "UsersData" (username, email, password, role) VALUES (${username}, ${normalizedEmail}, ${hashedPassword}, ${role})`
      );

      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  });

  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
  });

  // === PROPERTIES ===

  app.get(api.properties.list.path, async (req, res) => {
    try {
      const filters = {
        type: req.query.type as string,
        status: req.query.status as string,
        agentId: req.query.agentId as string,
      };
      const properties = await storage.getProperties(filters);
      res.json(properties);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get(api.properties.get.path, async (req, res) => {
    try {
      const property = await storage.getProperty(Number(req.params.id));
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      res.json(property);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post(api.properties.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(input);
      res.status(201).json(property);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  app.put(api.properties.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = insertPropertySchema.partial().parse(req.body);
      const property = await storage.updateProperty(Number(req.params.id), input);
      if (!property) return res.status(404).json({ message: "Property not found" });
      res.json(property);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete(api.properties.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      await storage.deleteProperty(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // === LEADS ===

  app.get(api.leads.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const filters = {
        status: req.query.status as string,
        assignedTo: req.query.assignedTo as string,
      };
      const leads = await storage.getLeads(filters);
      res.json(leads);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post(api.leads.create.path, async (req, res) => {
    try {
      const input = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(input);
      res.status(201).json(lead);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.put(api.leads.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(Number(req.params.id), input);
      if (!lead) return res.status(404).json({ message: "Lead not found" });
      res.json(lead);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  // === PROFILE ===

  app.get(api.profile.get.path, async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const profile = await storage.getProfile(req.user.claims.sub);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      res.json(profile);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put(api.profile.update.path, async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const profile = await storage.updateProfile(req.user.claims.sub, req.body);
      res.json(profile);
    } catch (err) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  return httpServer;
}
