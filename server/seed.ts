
import { storage } from "./storage";
import { db } from "./db";
import { properties, leads } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Check if properties exist
  const existingProperties = await storage.getProperties();
  if (existingProperties.length === 0) {
    console.log("Seeding properties...");
    await storage.createProperty({
      title: "Modern Apartment in Downtown",
      description: "Beautiful 2BHK apartment with city view.",
      type: "verified_residential",
      status: "published",
      price: 450000,
      location: "New York, NY",
      features: { bedrooms: 2, bathrooms: 2, area: 1200 },
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop"],
    });

    await storage.createProperty({
      title: "Commercial Office Space",
      description: "Prime location office space ready for move-in.",
      type: "commercial",
      status: "published",
      price: 1200000,
      location: "San Francisco, CA",
      features: { area: 3000, floor: 5 },
      images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"],
    });

    await storage.createProperty({
      title: "Suburban Family Home",
      description: "Spacious family home with a large backyard.",
      type: "unverified_residential",
      status: "draft",
      price: 850000,
      location: "Austin, TX",
      features: { bedrooms: 4, bathrooms: 3, area: 2500 },
      images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop"],
    });
  }

  // Check if leads exist
  const existingLeads = await storage.getLeads();
  if (existingLeads.length === 0) {
    console.log("Seeding leads...");
    await storage.createLead({
      name: "John Doe",
      email: "john@example.com",
      phone: "+1 555-0123",
      interest: "Modern Apartment in Downtown",
      status: "new",
      notes: "Interested in visiting this weekend.",
    });

    await storage.createLead({
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+1 555-0124",
      interest: "Commercial Office Space",
      status: "contacted",
      notes: "Looking for a 5-year lease.",
    });
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
