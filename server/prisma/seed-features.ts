import { FeatureCategory, FeatureType } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log('🌱 Seeding Inventory Management Features...');

  const features = [
    // CORE INVENTORY FEATURES
    {
      key: "inventory_tracking",
      name: "Real-time Inventory Tracking",
      description: "Track inventory levels in real-time across all locations",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.INVENTORY
    },
    {
      key: "max_products",
      name: "Maximum Products",
      description: "Maximum number of products allowed in inventory",
      type: FeatureType.NUMBER,
      category: FeatureCategory.INVENTORY
    },
    {
      key: "inventory_locations",
      name: "Multi-location Support",
      description: "Maximum number of inventory locations/warehouses",
      type: FeatureType.NUMBER,
      category: FeatureCategory.INVENTORY
    },
    {
      key: "batch_tracking",
      name: "Batch/Lot Tracking",
      description: "Track inventory by batch numbers and expiry dates",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.INVENTORY
    },
    {
      key: "low_stock_alerts",
      name: "Low Stock Alerts",
      description: "Automated alerts when stock falls below threshold",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.INVENTORY
    },

    // PRODUCT FEATURES
    {
      key: "product_variants",
      name: "Product Variants",
      description: "Support for product variants (size, color, etc.)",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.PRODUCTS
    },
    {
      key: "product_categories",
      name: "Product Categories",
      description: "Maximum number of product categories",
      type: FeatureType.NUMBER,
      category: FeatureCategory.PRODUCTS
    },
    {
      key: "barcode_scanner",
      name: "Barcode Scanner",
      description: "Mobile barcode scanning capabilities",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.PRODUCTS
    },
    {
      key: "bulk_product_import",
      name: "Bulk Import",
      description: "Import multiple products via CSV/Excel",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.PRODUCTS
    },

    // WAREHOUSING FEATURES
    {
      key: "bin_locations",
      name: "Bin Locations",
      description: "Track inventory by specific bin/shelf locations",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.WAREHOUSING
    },
    {
      key: "picklist_generation",
      name: "Picklist Generation",
      description: "Generate optimized picklists for orders",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.WAREHOUSING
    },
    {
      key: "cycle_counting",
      name: "Cycle Counting",
      description: "Schedule and track inventory cycle counts",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.WAREHOUSING
    },

    // SALES FEATURES
    {
      key: "invoice_generation",
      name: "Invoice Generation",
      description: "Generate professional invoices",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.SALES
    },
    {
      key: "discount_management",
      name: "Discount Management",
      description: "Create and manage discount rules",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.SALES
    },
    {
      key: "returns_management",
      name: "Returns Management",
      description: "Handle product returns and refunds",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.SALES
    },

    // ORDER FEATURES
    {
      key: "order_management",
      name: "Order Management",
      description: "Complete order processing system",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.ORDERS
    },
    {
      key: "backorder_management",
      name: "Backorder Management",
      description: "Handle out-of-stock orders with backordering",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.ORDERS
    },
    {
      key: "order_history_months",
      name: "Order History",
      description: "Months of order history retention",
      type: FeatureType.NUMBER,
      category: FeatureCategory.ORDERS
    },

    // PURCHASE FEATURES
    {
      key: "purchase_orders",
      name: "Purchase Orders",
      description: "Create and manage purchase orders",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.PURCHASE
    },
    {
      key: "reorder_point_calc",
      name: "Reorder Points",
      description: "Automated reorder point calculations",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.PURCHASE
    },

    // SUPPLIER FEATURES
    {
      key: "supplier_management",
      name: "Supplier Management",
      description: "Comprehensive supplier database",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.SUPPLIERS
    },
    {
      key: "max_suppliers",
      name: "Maximum Suppliers",
      description: "Maximum number of suppliers allowed",
      type: FeatureType.NUMBER,
      category: FeatureCategory.SUPPLIERS
    },

    // REPORT FEATURES
    {
      key: "custom_reports",
      name: "Custom Reports",
      description: "Create custom inventory and sales reports",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.REPORTS
    },
    {
      key: "scheduled_reports",
      name: "Scheduled Reports",
      description: "Schedule automatic report generation",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.REPORTS
    },
    {
      key: "report_export_formats",
      name: "Export Formats",
      description: "Available report export formats (PDF, Excel, CSV)",
      type: FeatureType.LIST,
      category: FeatureCategory.REPORTS
    },

    // CUSTOMER FEATURES
    {
      key: "customer_management",
      name: "Customer Management",
      description: "Comprehensive customer database",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.CUSTOMERS
    },
    {
      key: "max_customers",
      name: "Maximum Customers",
      description: "Maximum number of customers allowed",
      type: FeatureType.NUMBER,
      category: FeatureCategory.CUSTOMERS
    },

    // BRANCH & WAREHOUSE LIMITS
    {
      key: "max_branches",
      name: "Maximum Branches",
      description: "Maximum number of branches allowed in the organization",
      type: FeatureType.NUMBER,
      category: FeatureCategory.BRANCHES
    },
    {
      key: "max_warehouses",
      name: "Maximum Warehouses",
      description: "Maximum number of warehouses allowed in the organization",
      type: FeatureType.NUMBER,
      category: FeatureCategory.WAREHOUSING
    },

    // USER FEATURES
    {
      key: "max_users",
      name: "Maximum Users",
      description: "Maximum number of team members",
      type: FeatureType.NUMBER,
      category: FeatureCategory.USERS
    },
    {
      key: "user_roles",
      name: "Custom Roles",
      description: "Create custom user roles with specific permissions",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.USERS
    },
    {
      key: "user_activity_logs",
      name: "Activity Logs",
      description: "Track user actions in the system",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.USERS
    },

    // AI FEATURES
    {
      key: "ai_predictive_analytics",
      name: "Predictive Analytics",
      description: "AI-powered demand forecasting",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.AI
    },
    {
      key: "ai_stock_optimization",
      name: "Stock Optimization",
      description: "AI recommendations for optimal stock levels",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.AI
    },

    // API & INTEGRATION FEATURES
    {
      key: "api_access",
      name: "API Access",
      description: "Access to REST API for integrations",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.HELP
    },
    {
      key: "priority_support",
      name: "Priority Support",
      description: "Priority customer support access",
      type: FeatureType.BOOLEAN,
      category: FeatureCategory.HELP
    }
  ];

  for (const feature of features) {
    await prisma.feature.upsert({
      where: { key: feature.key },
      update: {
        name: feature.name,
        description: feature.description,
        type: feature.type,
        category: feature.category
      },
      create: {
        key: feature.key,
        name: feature.name,
        description: feature.description,
        type: feature.type,
        category: feature.category
      },
    });
  }

  console.log(`✅ Successfully seeded ${features.length} inventory features.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
