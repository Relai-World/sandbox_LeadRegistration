import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertPropertySchema, insertLeadSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth setup
  await setupAuth(app);
  registerAuthRoutes(app);

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
