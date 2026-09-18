import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";

import MarketingNavbar from "../components/common/MarketingNavbar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import { activities, features, stats } from "../data/landingData";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      {/* HERO */}
      <section className="relative min-h-screen px-6 py-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-violet-500/20 blur-[130px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:70px_70px]" />
        </div>

        <MarketingNavbar />

        <div className="mx-auto grid max-w-7xl items-center gap-14 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-20">
          <div>
            <Badge>Premium AI SaaS Platform for Business Teams</Badge>

            <h1 className="mt-8 max-w-4xl text-5xl font-semibold leading-[1.03] tracking-tight text-white md:text-6xl xl:text-7xl">
              Run your business from one intelligent AI dashboard.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              AI-BOS helps teams generate documents, chat with business files,
              manage users, analyze activity, and automate workflows from one
              premium operating system.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button as={Link} to="/register" size="lg" className="group">
                Start Building
                <ArrowRight
                  className="transition group-hover:translate-x-1"
                  size={20}
                />
              </Button>

              <Button as={Link} to="/login" variant="secondary" size="lg">
                View Demo
              </Button>
            </div>

            <div className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-8">
              <div>
                <p className="text-3xl font-semibold">12+</p>
                <p className="mt-1 text-sm text-slate-400">AI Tools</p>
              </div>

              <div>
                <p className="text-3xl font-semibold">3</p>
                <p className="mt-1 text-sm text-slate-400">User Roles</p>
              </div>

              <div>
                <p className="text-3xl font-semibold">24/7</p>
                <p className="mt-1 text-sm text-slate-400">Automation</p>
              </div>
            </div>
          </div>

          <div className="relative lg:ml-auto lg:w-[520px] xl:w-[580px]">
            <Card className="p-4 shadow-2xl shadow-black/40">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-5">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Command Center</p>
                    <h2 className="text-xl font-semibold">
                      Business Overview
                    </h2>
                  </div>

                  <Badge variant="emerald" className="px-3 py-1 text-xs">
                    Live
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {stats.map(([label, value, growth]) => (
                    <Card key={label} className="rounded-2xl p-5">
                      <p className="text-sm text-slate-400">{label}</p>

                      <div className="mt-3 flex items-end justify-between">
                        <p className="text-3xl font-semibold">{value}</p>
                        <span className="text-sm text-emerald-300">
                          {growth}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card className="mt-5 rounded-2xl p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-medium">Recent AI Activity</p>
                    <p className="text-sm text-slate-400">Today</p>
                  </div>

                  <div className="space-y-4">
                    {activities.map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
                        <p className="text-sm text-slate-300">{item}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </Card>

            <Card className="absolute -right-4 -top-6 z-20 hidden rounded-2xl px-5 py-4 shadow-xl shadow-cyan-500/10 md:block">
              <p className="text-sm text-slate-300">AI Accuracy</p>
              <p className="text-2xl font-semibold text-cyan-200">98.4%</p>
            </Card>
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES */}
      <section
        id="features"
        className="scroll-mt-28 mx-auto max-w-7xl px-6 pb-24"
      >
        <SectionHeader
          eyebrow="Platform Features"
          title="Built like a real SaaS product, not a college demo."
          description="Every module is designed to show real product thinking: authentication, AI workflows, analytics, documents, and team management."
        />

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title} hover className="p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                  <Icon size={24} />
                </div>

                <h3 className="text-lg font-semibold">{feature.title}</h3>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* PLATFORM */}
      <section
        id="platform"
        className="relative scroll-mt-28 border-t border-white/10 px-6 py-28"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.10),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.10),transparent_35%)]" />

        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="The Platform"
            title="One operating layer for your entire business."
            description="AI-BOS brings business intelligence, documents, AI workflows, analytics, and team operations into one connected workspace."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: BrainCircuit,
                title: "AI Workspace",
                text: "Generate professional documents, reports, emails, SOPs, and business content with AI.",
              },
              {
                icon: FileText,
                title: "Document Intelligence",
                text: "Upload business documents and interact with your files through AI-powered search and RAG.",
              },
              {
                icon: BarChart3,
                title: "Business Analytics",
                text: "Track activity, AI usage, documents, users, and operational insights from one dashboard.",
              },
              {
                icon: Users,
                title: "Team Operations",
                text: "Manage workspace members, roles, access, and business activity from a central control layer.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <Card key={title} hover className="group p-7">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 transition group-hover:bg-cyan-400/15">
                  <Icon size={26} />
                </div>

                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{text}</p>
              </Card>
            ))}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <Card className="p-7 lg:col-span-2">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
                  <Workflow size={24} />
                </div>

                <div>
                  <h3 className="text-xl font-semibold">
                    Connected business workflows
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                    Move from document upload to AI analysis, conversation,
                    generation, analytics, and team collaboration without
                    leaving the workspace.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-7">
              <p className="text-sm text-slate-400">Workspace architecture</p>
              <p className="mt-2 text-3xl font-semibold">Unified</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                One place for business operations and AI workflows.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section
        id="security"
        className="relative scroll-mt-28 border-t border-white/10 px-6 py-28"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_25%,rgba(34,197,94,0.09),transparent_32%),radial-gradient(circle_at_15%_80%,rgba(6,182,212,0.08),transparent_35%)]" />

        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Security"
            title="Security controls built into the operating layer."
            description="AI-BOS is designed with authentication, authorization, workspace isolation, rate limiting, audit logging, and secure document access across the application."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: "Authentication",
                text: "JWT-based authentication with protected API routes and active-user checks.",
              },
              {
                icon: LockKeyhole,
                title: "Role-Based Access",
                text: "Admin, manager, and user roles are enforced on protected backend operations.",
              },
              {
                icon: Users,
                title: "Workspace Isolation",
                text: "Business data and audit records are scoped to the authenticated workspace.",
              },
              {
                icon: ShieldCheck,
                title: "API Protection",
                text: "Rate limiting, secure headers, validation, and controlled error responses protect API access.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <Card key={title} hover className="p-7">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                  <Icon size={26} />
                </div>

                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{text}</p>
              </Card>
            ))}
          </div>

          <Card className="mt-8 p-8">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <p className="text-sm text-slate-400">Auditability</p>
                <p className="mt-2 text-xl font-semibold">
                  Activity tracking
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Administrative audit logs capture authenticated workspace
                  activity for review.
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400">Document access</p>
                <p className="mt-2 text-xl font-semibold">
                  Owner-scoped retrieval
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Document chat and retrieval operations verify ownership
                  before accessing stored content.
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400">Password recovery</p>
                <p className="mt-2 text-xl font-semibold">
                  Short-lived reset links
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Reset tokens are hashed, expire quickly, and are invalidated
                  after use.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-white/10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Card className="relative overflow-hidden p-10 text-center md:p-14">
            <div className="absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[90px]" />

            <div className="relative">
              <Badge>AI-BOS</Badge>

              <h2 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
                Bring your business workflows into one intelligent workspace.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400">
                Generate, analyze, collaborate, and manage your business from
                one connected AI operating system.
              </p>

              <div className="mt-8 flex justify-center">
                <Button as={Link} to="/register" size="lg" className="group">
                  Start Building
                  <ArrowRight
                    className="transition group-hover:translate-x-1"
                    size={20}
                  />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
