import { PlanType } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

// Seeds the subscription Plans (Free / Pro / Enterprise), attaches the existing
// seeded Features to each plan (PlanFeature value/limit), and seeds global AddOns.
//
// IMPORTANT — idempotent & non-destructive:
//   • Plans are upserted by `slug`, preserving ids so existing subscriptions keep
//     pointing at the same plan.
//   • PlanFeature rows are upserted by their (planId, featureId) key — we only
//     touch the three seeded plans, never any plan you later create from the admin.
//   • AddOns are upserted by `slug`.
// Re-running only refreshes the three seeded plans; hand-made plans are left alone.
//
// Value encoding (PlanFeature.value is a String, read back with parseInt for the
// NUMBER limits): BOOLEAN → "true"/"false", NUMBER → digits or "unlimited"
// (parseInt → NaN → no cap, matching the lenient guards in the services), LIST →
// comma-separated. Every plan lists *all* NUMBER features because the branch /
// warehouse / user guards throw when the feature is absent.

// Money is stored in minor units (santim); the admin UI divides by 100 to display.
const ETB = (birr: number) => birr * 100;

type PlanSeed = {
  slug: string;
  name: string;
  description: string;
  badge?: string;
  type: PlanType;
  sortOrder: number;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  isPublic: boolean;
  // featureKey → stored value
  features: Record<string, string>;
};

const PRO: Record<string, string> = {
  inventory_tracking: "true",
  max_products: "5000",
  inventory_locations: "10",
  batch_tracking: "true",
  low_stock_alerts: "true",
  product_variants: "true",
  product_categories: "100",
  barcode_scanner: "true",
  bulk_product_import: "true",
  bin_locations: "true",
  picklist_generation: "true",
  cycle_counting: "true",
  max_warehouses: "5",
  invoice_generation: "true",
  discount_management: "true",
  returns_management: "true",
  order_management: "true",
  backorder_management: "true",
  order_history_months: "24",
  purchase_orders: "true",
  reorder_point_calc: "true",
  supplier_management: "true",
  max_suppliers: "500",
  custom_reports: "true",
  scheduled_reports: "true",
  report_export_formats: "PDF,Excel,CSV",
  customer_management: "true",
  max_customers: "5000",
  max_branches: "10",
  max_users: "25",
  user_roles: "true",
  user_activity_logs: "true",
  ai_predictive_analytics: "false",
  ai_stock_optimization: "false",
  api_access: "true",
  priority_support: "false",
};

const ENTERPRISE: Record<string, string> = {
  inventory_tracking: "true",
  max_products: "unlimited",
  inventory_locations: "unlimited",
  batch_tracking: "true",
  low_stock_alerts: "true",
  product_variants: "true",
  product_categories: "unlimited",
  barcode_scanner: "true",
  bulk_product_import: "true",
  bin_locations: "true",
  picklist_generation: "true",
  cycle_counting: "true",
  max_warehouses: "unlimited",
  invoice_generation: "true",
  discount_management: "true",
  returns_management: "true",
  order_management: "true",
  backorder_management: "true",
  order_history_months: "unlimited",
  purchase_orders: "true",
  reorder_point_calc: "true",
  supplier_management: "true",
  max_suppliers: "unlimited",
  custom_reports: "true",
  scheduled_reports: "true",
  report_export_formats: "PDF,Excel,CSV",
  customer_management: "true",
  max_customers: "unlimited",
  max_branches: "unlimited",
  max_users: "unlimited",
  user_roles: "true",
  user_activity_logs: "true",
  ai_predictive_analytics: "true",
  ai_stock_optimization: "true",
  api_access: "true",
  priority_support: "true",
};

const plans: PlanSeed[] = [
  {
    slug: "pro",
    name: "Pro",
    description: "Multi-location inventory, returns, reports and team roles.",
    badge: "Most popular",
    type: PlanType.PAID,
    sortOrder: 1,
    monthlyPrice: ETB(999),
    yearlyPrice: ETB(9990), // ~2 months free
    trialDays: 14,
    isPublic: true,
    features: PRO,
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    description: "Unlimited scale with AI forecasting, API access and priority support.",
    type: PlanType.PAID,
    sortOrder: 2,
    monthlyPrice: ETB(2999),
    yearlyPrice: ETB(29990),
    trialDays: 14,
    isPublic: true,
    features: ENTERPRISE,
  },
];

// Global add-ons (planId left null → purchasable on any plan). linkedFeature
// references a Feature key so the app can credit the bought quantity against it.
const addOns = [
  {
    slug: "extra_users",
    name: "Additional Team Members",
    description: "Add 5 more team member seats.",
    monthlyPrice: ETB(199),
    yearlyPrice: ETB(1990),
    linkedFeature: "max_users",
    maxQuantity: 20,
  },
  {
    slug: "extra_branch",
    name: "Additional Branch",
    description: "Add one more branch / selling location.",
    monthlyPrice: ETB(299),
    yearlyPrice: ETB(2990),
    linkedFeature: "max_branches",
    maxQuantity: 50,
  },
  {
    slug: "extra_warehouse",
    name: "Additional Warehouse",
    description: "Add one more warehouse.",
    monthlyPrice: ETB(299),
    yearlyPrice: ETB(2990),
    linkedFeature: "max_warehouses",
    maxQuantity: 50,
  },
  {
    slug: "ai_suite",
    name: "AI Forecasting Suite",
    description: "Unlock predictive analytics and stock optimization.",
    monthlyPrice: ETB(499),
    yearlyPrice: ETB(4990),
    linkedFeature: "ai_predictive_analytics",
    maxQuantity: 1,
  },
  {
    slug: "priority_support",
    name: "Priority Support",
    description: "Front-of-queue support with a faster response SLA.",
    monthlyPrice: ETB(399),
    yearlyPrice: ETB(3990),
    linkedFeature: "priority_support",
    maxQuantity: 1,
  },
];

async function main() {
  console.log("🌱 Seeding subscription plans, plan-features and add-ons...");

  // Resolve every Feature key → id once. The Feature catalog must be seeded first
  // (npm run seed:features), so fail loudly if a referenced key is missing.
  const features = await prisma.feature.findMany({
    select: { id: true, key: true },
  });
  const featureIdByKey = new Map(features.map((f) => [f.key, f.id]));

  for (const plan of plans) {
    const { features: featureValues, ...planData } = plan;

    const upserted = await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: planData.name,
        description: planData.description,
        badge: planData.badge,
        type: planData.type,
        sortOrder: planData.sortOrder,
        monthlyPrice: planData.monthlyPrice,
        yearlyPrice: planData.yearlyPrice,
        trialDays: planData.trialDays,
        isPublic: planData.isPublic,
        isActive: true,
      },
      create: {
        slug: planData.slug,
        name: planData.name,
        description: planData.description,
        badge: planData.badge,
        type: planData.type,
        sortOrder: planData.sortOrder,
        monthlyPrice: planData.monthlyPrice,
        yearlyPrice: planData.yearlyPrice,
        trialDays: planData.trialDays,
        isPublic: planData.isPublic,
        isActive: true,
      },
    });

    let attached = 0;
    for (const [key, value] of Object.entries(featureValues)) {
      const featureId = featureIdByKey.get(key);
      if (!featureId) {
        console.warn(
          `  ⚠️  ${plan.slug}: feature "${key}" not found — run seed:features first. Skipping.`,
        );
        continue;
      }

      await prisma.planFeature.upsert({
        where: {
          planId_featureId: { planId: upserted.id, featureId },
        },
        update: { value },
        create: { planId: upserted.id, featureId, value },
      });
      attached++;
    }

    console.log(`  ✅ ${plan.name}: ${attached} features attached.`);
  }

  for (const addOn of addOns) {
    await prisma.addOn.upsert({
      where: { slug: addOn.slug },
      update: {
        name: addOn.name,
        description: addOn.description,
        monthlyPrice: addOn.monthlyPrice,
        yearlyPrice: addOn.yearlyPrice,
        linkedFeature: addOn.linkedFeature,
        maxQuantity: addOn.maxQuantity,
      },
      create: {
        slug: addOn.slug,
        name: addOn.name,
        description: addOn.description,
        monthlyPrice: addOn.monthlyPrice,
        yearlyPrice: addOn.yearlyPrice,
        linkedFeature: addOn.linkedFeature,
        maxQuantity: addOn.maxQuantity,
      },
    });
  }

  console.log(
    `✅ Seeded ${plans.length} plans and ${addOns.length} add-ons.`,
  );
}

main()
  .catch((e) => {
    console.error("Plan seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
