"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { Combobox } from "@/components/ui/combobox";
import { variantOptions } from "@/components/dashboard/inventory/stock-fields";
import {
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  Store,
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Wallet,
  Smartphone,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { formatMoney, cn } from "@/lib/utils";
import { useOrgAccess } from "@/lib/hooks/use-org-access";
import { useGetProductsQuery } from "@/lib/features/services/product.api";
import {
  SaleItemInput,
  PaymentMethod,
  useGetSellableBranchesQuery,
  useCreateSaleMutation,
} from "@/lib/features/services/sales.api";
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
} from "@/lib/features/services/customer.api";

const WALK_IN = "__walkin__";
const CUSTOMERS_MANAGE = "CUSTOMERS_MANAGE";
const VAT_RATE = 0.15;

interface Line {
  variantId: string;
  quantity: number;
}

type Step = "cart" | "payment";

const METHODS: { value: PaymentMethod; label: string; icon: typeof Wallet }[] = [
  { value: "CASH", label: "Cash", icon: Wallet },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "MOBILE_MONEY", label: "Mobile Money", icon: Smartphone },
];

export default function NewSalePage() {
  const params = useParams();
  const lang = params.lang as string;
  const orgId = params.orgId as string;
  const branchId = params.branchId as string;

  const { isOwner, canAdminister, permissions } = useOrgAccess(orgId);
  const canManageCustomers =
    isOwner || canAdminister || permissions.includes(CUSTOMERS_MANAGE);

  const { data: branches, isLoading: branchesLoading } =
    useGetSellableBranchesQuery(orgId);
  const { data: products } = useGetProductsQuery(orgId);
  const { data: customers } = useGetCustomersQuery(orgId);
  const [createSale, { isLoading }] = useCreateSaleMutation();
  const [createCustomer, { isLoading: isCreatingCustomer }] =
    useCreateCustomerMutation();

  const branch = useMemo(
    () => branches?.find((b) => b.id === branchId) ?? null,
    [branches, branchId],
  );
  const backHref = `/${lang}/organizations/${orgId}/new-sale`;

  const [step, setStep] = useState<Step>("cart");
  const [customerId, setCustomerId] = useState(WALK_IN);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [lines, setLines] = useState<Line[]>([{ variantId: "", quantity: 1 }]);
  const [discountInput, setDiscountInput] = useState("");
  const [vat, setVat] = useState(false);

  // Payment step state.
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [tenderInput, setTenderInput] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [processing, setProcessing] = useState(false);

  // Inline "new customer" mini-form.
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  const variantMap = useMemo(() => {
    const map = new Map<string, { label: string; price: number }>();
    (products ?? []).forEach((p) =>
      (p.variants ?? []).forEach((v) =>
        map.set(v.id, {
          label: `${p.name} — ${v.name} (${v.sku})`,
          price: v.sellingPrice,
        }),
      ),
    );
    return map;
  }, [products]);

  const variantOpts = useMemo(() => variantOptions(products ?? []), [products]);
  const customerOpts = useMemo(
    () => [
      { value: WALK_IN, label: "Walk-in (no customer)" },
      ...(customers ?? []).map((c) => ({
        value: c.id,
        label: c.phone ? `${c.name} (${c.phone})` : c.name,
        keywords: [c.name, c.phone ?? ""],
      })),
    ],
    [customers],
  );

  // --- Money (all minor units) ---
  const subtotal = lines.reduce((sum, l) => {
    const price = variantMap.get(l.variantId)?.price ?? 0;
    return sum + price * (l.quantity || 0);
  }, 0);
  const discount = Math.min(
    Math.max(0, Math.round((Number(discountInput) || 0) * 100)),
    subtotal,
  );
  const tax = vat ? Math.round((subtotal - discount) * VAT_RATE) : 0;
  const total = Math.max(0, subtotal - discount + tax);
  const itemCount = lines.reduce(
    (n, l) => (l.variantId ? n + (l.quantity || 0) : n),
    0,
  );
  const hasItems = lines.some((l) => l.variantId && l.quantity > 0);

  const tendered = Math.round((Number(tenderInput) || 0) * 100);
  const changeDue = Math.max(0, tendered - total);
  const isCredit = customerId !== WALK_IN;

  const updateLine = (idx: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const resetAll = () => {
    setStep("cart");
    setLines([{ variantId: "", quantity: 1 }]);
    setCustomerId(WALK_IN);
    setCustomerName("");
    setCustomerPhone("");
    setDiscountInput("");
    setVat(false);
    setMethod("CASH");
    setTenderInput("");
    setCardNumber("");
    setMobileNumber("");
    setCreatingCustomer(false);
    setNewCustomerName("");
    setNewCustomerPhone("");
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    try {
      const created = await createCustomer({
        orgId,
        body: {
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || undefined,
        },
      }).unwrap();
      setCustomerId(created.id);
      setCreatingCustomer(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      toast.success("Customer created");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create customer");
    }
  };

  const goToPayment = () => {
    if (!hasItems) {
      toast.error("Add at least one item");
      return;
    }
    setTenderInput((total / 100).toString());
    setStep("payment");
  };

  // Mock gateway: simulate processing, then record the sale with payment fields.
  const handlePay = async () => {
    const items: SaleItemInput[] = lines
      .filter((l) => l.variantId && l.quantity > 0)
      .map((l) => ({ variantId: l.variantId, quantity: l.quantity }));
    if (items.length === 0) {
      toast.error("Add at least one item");
      setStep("cart");
      return;
    }
    const amountPaid = Math.min(tendered, total);
    if (!isCredit && amountPaid < total) {
      toast.error("Walk-in sales must be paid in full");
      return;
    }

    setProcessing(true);
    // Simulated gateway latency — no real processor.
    await new Promise((r) => setTimeout(r, 1200));
    const paymentRef = `MOCK-${method}-${Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase()}`;

    try {
      await createSale({
        orgId,
        body: {
          branchId,
          customerId: isCredit ? customerId : undefined,
          customerName: isCredit ? undefined : customerName || undefined,
          customerPhone: isCredit ? undefined : customerPhone || undefined,
          discount,
          tax,
          paymentMethod: method,
          amountPaid,
          paymentRef,
          items,
        },
      }).unwrap();
      toast.success(
        amountPaid >= total
          ? "Payment successful — sale recorded"
          : "Sale recorded on credit",
      );
      resetAll();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to record sale");
    } finally {
      setProcessing(false);
    }
  };

  // Guard: branch loaded but not permitted.
  if (!branchesLoading && !branch) {
    return (
      <PageShell title="New Sale" actionCount={0}>
        <EmptyState
          icon={ShoppingBag}
          title="Can't sell at this branch"
          description="You don't have permission to record sales at this branch."
          action={
            <Button asChild variant="outline">
              <Link href={backHref}>Choose another branch</Link>
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={step === "payment" ? "Payment" : "New Sale"}
      subtitle={
        step === "payment"
          ? "Confirm the payment to complete the sale."
          : "Add items, choose a customer, and proceed to payment."
      }
      loading={branchesLoading}
      actionCount={1}
      actions={
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="gap-1.5 rounded-full px-3 py-1 font-normal"
          >
            <Store className="h-3.5 w-3.5" />
            {branch?.name}
          </Badge>
          {step === "payment" ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setStep("cart")}
              disabled={processing}
            >
              <ArrowLeft className="h-4 w-4" /> Back to cart
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" /> Branches
              </Link>
            </Button>
          )}
        </div>
      }
    >
      {step === "payment" ? (
        <PaymentStep
          total={total}
          method={method}
          setMethod={setMethod}
          tenderInput={tenderInput}
          setTenderInput={setTenderInput}
          cardNumber={cardNumber}
          setCardNumber={setCardNumber}
          mobileNumber={mobileNumber}
          setMobileNumber={setMobileNumber}
          changeDue={changeDue}
          isCredit={isCredit}
          processing={processing || isLoading}
          onPay={handlePay}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left — items */}
          <div className="space-y-3 rounded-sm border border-border bg-background2 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Items</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setLines((prev) => [...prev, { variantId: "", quantity: 1 }])
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Add item
              </Button>
            </div>

            {lines.map((line, idx) => {
              const price = variantMap.get(line.variantId)?.price ?? 0;
              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 items-center gap-2 rounded-sm border border-border p-2"
                >
                  <div className="col-span-6">
                    <Combobox
                      options={variantOpts}
                      value={line.variantId}
                      onChange={(v) => updateLine(idx, { variantId: v })}
                      placeholder="Select product"
                      searchPlaceholder="Search products…"
                      emptyText="No products found."
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(idx, { quantity: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="col-span-3 text-right text-sm">
                    {formatMoney(price * (line.quantity || 0))}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {lines.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() =>
                          setLines((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right — order summary (sticky) */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="space-y-4 rounded-sm border border-border bg-background2 p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Customer</Label>
                  {canManageCustomers && !creatingCustomer && (
                    <button
                      type="button"
                      onClick={() => setCreatingCustomer(true)}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> New customer
                    </button>
                  )}
                </div>
                <Combobox
                  options={customerOpts}
                  value={customerId}
                  onChange={setCustomerId}
                  placeholder="Select customer"
                  searchPlaceholder="Search customers…"
                  emptyText="No customers found."
                />
              </div>

              {creatingCustomer && (
                <div className="space-y-3 rounded-sm border border-border bg-muted/20 p-3">
                  <div className="space-y-2">
                    <Label>New customer name *</Label>
                    <Input
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="e.g. Abebe Bekele"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateCustomer()
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCreatingCustomer(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateCustomer}
                      disabled={isCreatingCustomer || !newCustomerName.trim()}
                    >
                      {isCreatingCustomer && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save customer
                    </Button>
                  </div>
                </div>
              )}

              {customerId === WALK_IN && !creatingCustomer && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Walk-in name</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Walk-in phone</Label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}

              {/* Discount + VAT */}
              <div className="space-y-3 border-t border-border pt-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Discount (ETB)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="text-sm">Add VAT (15%)</span>
                  <Checkbox
                    checked={vat}
                    onCheckedChange={(c) => setVat(c === true)}
                  />
                </label>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 border-t border-border pt-3 text-sm">
                <Row label={`Subtotal (${itemCount} items)`} value={formatMoney(subtotal)} muted />
                {discount > 0 && (
                  <Row label="Discount" value={`- ${formatMoney(discount)}`} muted />
                )}
                {vat && <Row label="VAT (15%)" value={formatMoney(tax)} muted />}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-semibold tabular-nums">
                    {formatMoney(total)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full gap-2"
                onClick={goToPayment}
                disabled={!hasItems}
              >
                <Lock className="h-4 w-4" /> Proceed to Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        muted && "text-muted-foreground",
      )}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function PaymentStep({
  total,
  method,
  setMethod,
  tenderInput,
  setTenderInput,
  cardNumber,
  setCardNumber,
  mobileNumber,
  setMobileNumber,
  changeDue,
  isCredit,
  processing,
  onPay,
}: {
  total: number;
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  tenderInput: string;
  setTenderInput: (v: string) => void;
  cardNumber: string;
  setCardNumber: (v: string) => void;
  mobileNumber: string;
  setMobileNumber: (v: string) => void;
  changeDue: number;
  isCredit: boolean;
  processing: boolean;
  onPay: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-lg border border-border bg-background2 shadow-sm">
        {/* Amount banner */}
        <div className="border-b border-border bg-primary/5 px-6 py-5 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Amount due
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {formatMoney(total)}
          </p>
        </div>

        <div className="space-y-5 p-6">
          {/* Method selector */}
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  disabled={processing}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-md border p-3 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent/40",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Method-specific dummy fields */}
          {method === "CARD" && (
            <div className="space-y-2">
              <Label>Card number</Label>
              <Input
                inputMode="numeric"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4242 4242 4242 4242"
                disabled={processing}
              />
            </div>
          )}
          {method === "MOBILE_MONEY" && (
            <div className="space-y-2">
              <Label>Mobile number</Label>
              <Input
                inputMode="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="09xx xxx xxx"
                disabled={processing}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Amount tendered (ETB)</Label>
            <Input
              type="number"
              min={0}
              value={tenderInput}
              onChange={(e) => setTenderInput(e.target.value)}
              disabled={processing}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {isCredit ? (
                <span>Pay less than the total to record the rest on credit.</span>
              ) : (
                <span>Walk-in sales must be paid in full.</span>
              )}
              {method === "CASH" && changeDue > 0 && (
                <span className="font-medium text-foreground">
                  Change: {formatMoney(changeDue)}
                </span>
              )}
            </div>
          </div>

          <Button className="w-full gap-2" onClick={onPay} disabled={processing}>
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Pay {formatMoney(total)}
              </>
            )}
          </Button>
          <p className="flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" /> Simulated payment — no real charge is made.
          </p>
        </div>
      </div>
    </div>
  );
}
