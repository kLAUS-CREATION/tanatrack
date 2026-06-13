import { FeatureCategory, PermissionScope } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Starting permission definitions seeding...");

  // DANGER: Deletes ALL existing permission definitions
  const deleteCount = await prisma.permissionDefinition.deleteMany({});
  console.log(`🗑️  Deleted ${deleteCount.count} existing permission definitions.`);

  // Define permissions grouped by category.
  // `slug` defaults to `${category}_${action}`; set it explicitly to override.
  const permissionsToSeed = [
    // ADMINISTRATION — single umbrella permission. Grants the full management
    // surface (branch/warehouse CRUD, member invites, role management). OWNER
    // bypasses it; org-level settings stay OWNER-only and are not covered here.
    {
      category: FeatureCategory.USERS,
      action: "ADMINISTER",
      slug: "ADMINISTRATION_ACCESS",
      name: "Administration Access",
      description:
        "Full administration: manage branches, warehouses, members and roles",
      scope: PermissionScope.GLOBAL,
    },

    // BRANCHES (read)
    {
      category: FeatureCategory.BRANCHES,
      action: "LIST_ALL",
      name: "List All Branches",
      description: "See the full list of branches in the organization",
      scope: PermissionScope.GLOBAL,
    },
    {
      category: FeatureCategory.BRANCHES,
      action: "VIEW_DETAILS",
      name: "View Branch Details",
      description: "View information about a specific branch",
      scope: PermissionScope.LOCAL,
    },

    // WAREHOUSING (read)
    {
      category: FeatureCategory.WAREHOUSING,
      action: "LIST_ALL",
      name: "List All Warehouses",
      description: "See the full list of warehouses in the organization",
      scope: PermissionScope.GLOBAL,
    },
    {
      category: FeatureCategory.WAREHOUSING,
      action: "VIEW_DETAILS",
      name: "View Warehouse Details",
      description: "View information about a specific warehouse",
      scope: PermissionScope.LOCAL,
    },

    // SALES (mostly local / branch-specific)
    {
      category: FeatureCategory.SALES,
      action: "CREATE",
      name: "Create Sale",
      description: "Record a new sale transaction",
      scope: PermissionScope.LOCAL,
    },
    {
      category: FeatureCategory.SALES,
      action: "VIEW_BRANCH",
      name: "View Branch Sales",
      description: "See sales reports for a specific branch",
      scope: PermissionScope.LOCAL,
    },
    {
      category: FeatureCategory.SALES,
      action: "VIEW_ALL",
      name: "View All Sales",
      description: "See aggregated sales across all branches",
      scope: PermissionScope.GLOBAL,
    },

    // PRODUCTS / INVENTORY (mix)
    {
      category: FeatureCategory.PRODUCTS,
      action: "VIEW_ALL",
      name: "View All Products",
      description: "See the full product catalog",
      scope: PermissionScope.GLOBAL,
    },
    {
      category: FeatureCategory.PRODUCTS,
      action: "MANAGE",
      name: "Manage Products",
      description: "Create, update and delete products and their variants",
      scope: PermissionScope.GLOBAL,
    },
    {
      category: FeatureCategory.PRODUCTS,
      action: "MANAGE_CATEGORIES",
      name: "Manage Product Categories",
      description: "Create, rename and delete product categories",
      scope: PermissionScope.GLOBAL,
    },
    {
      category: FeatureCategory.INVENTORY,
      action: "VIEW_GLOBAL_STOCK",
      name: "View Global Stock Summary",
      description: "See total stock levels across all locations",
      scope: PermissionScope.GLOBAL,
    },
    {
      category: FeatureCategory.INVENTORY,
      action: "ADJUST_STOCK",
      name: "Adjust Stock",
      description: "Correct stock counts in a location",
      scope: PermissionScope.LOCAL,
    },
    {
      category: FeatureCategory.INVENTORY,
      action: "PURCHASE_IN",
      name: "Receive Stock",
      description: "Receive new stock (purchase-in) into a branch or warehouse",
      scope: PermissionScope.LOCAL,
    },
    {
      category: FeatureCategory.INVENTORY,
      action: "TRANSFER_STOCK",
      name: "Transfer Stock",
      description: "Move stock between two locations",
      scope: PermissionScope.LOCAL,
    },
    {
      category: FeatureCategory.INVENTORY,
      action: "VIEW_BRANCH_STOCK",
      name: "View Branch Stock",
      description: "See stock levels in a specific branch/warehouse",
      scope: PermissionScope.LOCAL,
    },

    // REPORTS (very clear global vs local split)
    {
      category: FeatureCategory.REPORTS,
      action: "VIEW_ALL_BRANCHES",
      name: "View Organization-wide Reports",
      description: "Access aggregated reports for the entire organization",
      scope: PermissionScope.GLOBAL,
    },
    {
      category: FeatureCategory.REPORTS,
      action: "VIEW_BRANCH",
      name: "View Branch Reports",
      description: "See performance reports for a specific branch",
      scope: PermissionScope.LOCAL,
    },

    // CUSTOMERS (org-wide reference data)
    {
      category: FeatureCategory.CUSTOMERS,
      action: "VIEW_ALL",
      name: "View Customers",
      description: "See the customer directory",
      scope: PermissionScope.GLOBAL,
    },
    {
      category: FeatureCategory.CUSTOMERS,
      action: "MANAGE",
      name: "Manage Customers",
      description: "Create, update and delete customers",
      scope: PermissionScope.GLOBAL,
    },

    // SUPPLIERS (org-wide reference data)
    {
      category: FeatureCategory.SUPPLIERS,
      action: "VIEW_ALL",
      name: "View Suppliers",
      description: "See the supplier directory",
      scope: PermissionScope.GLOBAL,
    },
    {
      category: FeatureCategory.SUPPLIERS,
      action: "MANAGE",
      name: "Manage Suppliers",
      description: "Create, update and delete suppliers",
      scope: PermissionScope.GLOBAL,
    },
  ];

  let createdCount = 0;

  for (const p of permissionsToSeed) {
    const slug = ("slug" in p && p.slug) ? p.slug : `${p.category}_${p.action}`;

    await prisma.permissionDefinition.upsert({
      where: { slug },
      update: {
        name: p.name,
        description: p.description,
        category: p.category,
        action: p.action,
        scope: p.scope,
      },
      create: {
        slug,
        name: p.name,
        description: p.description,
        category: p.category,
        action: p.action,
        scope: p.scope,
      },
    });

    createdCount++;
  }

  console.log(`✅ Successfully seeded ${createdCount} permission definitions.`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
