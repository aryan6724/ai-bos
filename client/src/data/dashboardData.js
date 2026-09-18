import {
  Brain,
  FileText,
  Users,
  CreditCard,
  Mail,
  UploadCloud,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const dashboardStats = [
  {
    title: "AI Generations",
    value: "2,481",
    change: "+18.2%",
    trend: "up",
    icon: Brain,
  },
  {
    title: "Documents",
    value: "846",
    change: "+32.4%",
    trend: "up",
    icon: FileText,
  },
  {
    title: "Team Members",
    value: "128",
    change: "+12.8%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Revenue",
    value: "₹4.8L",
    change: "+24.1%",
    trend: "up",
    icon: CreditCard,
  },
];

export const recentActivities = [
  {
    title: "AI report generated",
    description: "Aryan generated a monthly investor report.",
    time: "2 min ago",
    icon: Sparkles,
  },
  {
    title: "PDF uploaded",
    description: "Refund policy document was uploaded to workspace.",
    time: "18 min ago",
    icon: UploadCloud,
  },
  {
    title: "Email draft created",
    description: "AI generated a client follow-up email.",
    time: "42 min ago",
    icon: Mail,
  },
  {
    title: "Role updated",
    description: "Manager access was assigned to Aryan.",
    time: "1 hr ago",
    icon: ShieldCheck,
  },
];

export const usageBars = [
  { label: "Mon", value: 42 },
  { label: "Tue", value: 68 },
  { label: "Wed", value: 55 },
  { label: "Thu", value: 88 },
  { label: "Fri", value: 74 },
  { label: "Sat", value: 92 },
  { label: "Sun", value: 63 },
];

export const aiTools = [
  {
    title: "Resume Generator",
    description: "Create ATS-friendly resumes using AI.",
    status: "Ready",
  },
  {
    title: "Email Writer",
    description: "Generate professional business emails.",
    status: "Ready",
  },
  {
    title: "PDF Chat",
    description: "Ask questions from uploaded documents.",
    status: "Coming Soon",
  },
  {
    title: "Invoice OCR",
    description: "Extract invoice fields from uploaded images.",
    status: "Coming Soon",
  },
];