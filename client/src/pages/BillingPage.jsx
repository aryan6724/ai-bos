import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Loader2,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardPageHeader from "../components/dashboard/DashboardPageHeader";
import Card from "../components/ui/Card";
import { getFullAnalytics } from "../services/analyticsService";

const plans = [
  {
    name: "Starter",
    price: "₹0",
    description: "For students and personal AI workspace testing.",
    features: [
      "50 AI generations/month",
      "10 document uploads",
      "Basic document chat",
      "Single workspace user",
    ],
    active: false,
  },
  {
    name: "Premium",
    price: "₹799",
    description: "For serious portfolio, startup, and team usage.",
    features: [
      "1,000 AI generations/month",
      "Unlimited document chat",
      "Team management",
      "Real analytics dashboard",
      "Priority AI workflows",
    ],
    active: true,
  },
  {
    name: "Business",
    price: "₹2,499",
    description: "For agencies and business teams using AI-BOS daily.",
    features: [
      "Unlimited AI generations",
      "Advanced team controls",
      "Admin security center",
      "Custom AI workflows",
      "Dedicated workspace support",
    ],
    active: false,
  },
];

const invoices = [
  {
    id: "INV-2026-001",
    date: "July 2026",
    amount: "₹799",
    status: "Paid",
  },
  {
    id: "INV-2026-000",
    date: "June 2026",
    amount: "₹799",
    status: "Paid",
  },
];

function UsageCard({ title, value, limit, icon: Icon }) {
  const percentage = Math.min(Math.round((value / limit) * 100), 100);

  return (
    <Card className="p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            {value}
            <span className="text-sm font-normal text-slate-500">
              {" "}
              / {limit}
            </span>
          </h3>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
          <Icon size={22} />
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-full bg-cyan-400 shadow-lg shadow-cyan-500/20"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-slate-500">{percentage}% used this cycle</p>
    </Card>
  );
}

function PlanCard({ plan }) {
  return (
    <Card
      className={
        plan.active
          ? "border-cyan-400/40 bg-cyan-400/5 p-6 shadow-xl shadow-cyan-500/10"
          : "p-6"
      }
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {plan.description}
          </p>
        </div>

        {plan.active && (
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
            Current
          </span>
        )}
      </div>

      <div className="mb-6">
        <span className="text-4xl font-semibold text-white">{plan.price}</span>
        <span className="text-sm text-slate-500"> / month</span>
      </div>

      <div className="space-y-3">
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-300" size={18} />
            <span className="text-sm text-slate-300">{feature}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={
          plan.active
            ? "mt-7 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white"
            : "mt-7 w-full rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300"
        }
      >
        {plan.active ? "Current Plan" : "Upgrade Plan"}
      </button>
    </Card>
  );
}

export default function BillingPage() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBillingData = async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getFullAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load billing data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const overview = analytics?.overview || {
    totalGenerations: 0,
    totalDocuments: 0,
    totalChats: 0,
    totalRequests: 0,
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <DashboardPageHeader
          badge="Subscription Center"
          title="Billing"
          description="Manage your AI-BOS subscription, workspace usage, invoices, and billing plan from one premium SaaS billing dashboard."
        />

        <button
          type="button"
          onClick={loadBillingData}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[520px] items-center justify-center">
          <Loader2 className="animate-spin text-cyan-300" size={42} />
        </div>
      ) : (
        <>
          <section className="mb-6 grid gap-6 xl:grid-cols-[1fr_0.75fr]">
            <Card className="p-6">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                <div>
                  <p className="text-sm text-slate-400">Current Plan</p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-semibold text-white">
                      Premium Plan
                    </h2>

                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                      Active
                    </span>
                  </div>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                    Your workspace is running on the Premium plan with access to
                    AI generation, document chat, team management, analytics,
                    and admin control modules.
                  </p>
                </div>

                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5 text-right">
                  <p className="text-sm text-cyan-200">Monthly Billing</p>
                  <p className="mt-2 text-4xl font-semibold text-white">₹799</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Next renewal: 09 Aug 2026
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Payment Method</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">
                    Saved Card
                  </h2>
                </div>

                <CreditCard className="text-cyan-300" size={26} />
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm text-slate-400">Card</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Visa ending in 4242
                </p>
                <p className="mt-1 text-sm text-slate-500">Expires 12/28</p>
              </div>

              <button
                type="button"
                className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                Update Payment Method
              </button>
            </Card>
          </section>

          <section className="mb-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <UsageCard
              title="AI Generations"
              value={overview.totalGenerations}
              limit={1000}
              icon={Sparkles}
            />

            <UsageCard
              title="Document Chats"
              value={overview.totalChats}
              limit={1000}
              icon={MessageSquareText}
            />

            <UsageCard
              title="Documents"
              value={overview.totalDocuments}
              limit={250}
              icon={FileText}
            />

            <UsageCard
              title="Total Requests"
              value={overview.totalRequests}
              limit={2000}
              icon={Activity}
            />
          </section>

          <section className="mb-6">
            <div className="mb-5">
              <p className="text-sm text-slate-400">Available Plans</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Subscription Plans
              </h2>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard key={plan.name} plan={plan} />
              ))}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="p-6">
              <div className="mb-6">
                <p className="text-sm text-slate-400">Billing Records</p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  Invoice History
                </h2>
              </div>

              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-white">{invoice.id}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {invoice.date}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-white">
                        {invoice.amount}
                      </span>

                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                        {invoice.status}
                      </span>

                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:text-white"
                      >
                        <Download size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-6">
                <p className="text-sm text-slate-400">Billing Security</p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  Account Protection
                </h2>
              </div>

              <div className="space-y-4">
                {[
                  "JWT protected billing access",
                  "Admin-level workspace visibility",
                  "Usage connected with real analytics",
                  "Secure SaaS billing UI ready",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <ShieldCheck className="text-emerald-300" size={19} />
                    <span className="text-sm text-slate-300">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
                <div className="mb-3 flex items-center gap-3">
                  <Zap className="text-amber-300" size={20} />
                  <h3 className="font-semibold text-white">Stripe Later</h3>
                </div>

                <p className="text-sm leading-6 text-amber-100/80">
                  This billing page is currently a professional SaaS UI. Real
                  payment processing can be added later using Stripe Checkout.
                </p>
              </div>
            </Card>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}