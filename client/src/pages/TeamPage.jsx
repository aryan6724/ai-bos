import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  Power,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardPageHeader from "../components/dashboard/DashboardPageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMembers,
  toggleTeamMemberStatus,
  updateTeamMemberRole,
} from "../services/teamService";

const roleOptions = ["admin", "manager", "employee"];

const initialForm = {
  fullName: "",
  email: "",
  companyName: "Aryan Technologies",
  role: "employee",
  password: "",
};

const getRoleBadgeClass = (role) => {
  if (role === "admin") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  if (role === "manager") {
    return "border-violet-400/20 bg-violet-400/10 text-violet-200";
  }

  return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
};

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const activeMembers = teamMembers.filter((member) => member.isActive).length;
  const adminCount = teamMembers.filter((member) => member.role === "admin").length;

  const loadTeamMembers = async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getTeamMembers();
      setTeamMembers(data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load team members.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccessMessage("");
  };

  const handleCreateMember = async (event) => {
    event.preventDefault();

    if (!formData.fullName || !formData.email || !formData.password) {
      setError("Full name, email, and password are required.");
      return;
    }

    try {
      setIsCreating(true);
      setError("");
      setSuccessMessage("");

      await createTeamMember(formData);

      setSuccessMessage("Team member created successfully.");
      setFormData(initialForm);
      await loadTeamMembers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create team member.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      setUpdatingId(userId);
      setError("");
      setSuccessMessage("");

      await updateTeamMemberRole({
        userId,
        role,
      });

      setSuccessMessage("User role updated successfully.");
      await loadTeamMembers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user role.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      setUpdatingId(userId);
      setError("");
      setSuccessMessage("");

      const data = await toggleTeamMemberStatus(userId);

      setSuccessMessage(data.message || "User status updated successfully.");
      await loadTeamMembers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user status.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleDeleteMember = async (userId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this team member?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(userId);
      setError("");
      setSuccessMessage("");

      await deleteTeamMember(userId);

      setSuccessMessage("Team member deleted successfully.");
      await loadTeamMembers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete team member.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <DashboardLayout>
      <DashboardPageHeader
        badge="Team Workspace"
        title="Team Management"
        description="Manage workspace users, roles, access status, and team-level collaboration from one premium dashboard."
      />

      <div className="mb-6 grid gap-5 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Members</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">
                {teamMembers.length}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
              <Users size={23} />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active Users</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">
                {activeMembers}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <Power size={23} />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Admins</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">
                {adminCount}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
              <ShieldCheck size={23} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="p-6">
          <div className="mb-6">
            <p className="text-sm text-slate-400">Admin Action</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Add Team Member
            </h2>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
              <CheckCircle2 size={18} />
              {successMessage}
            </div>
          )}

          <form onSubmit={handleCreateMember} className="space-y-5">
            <Input
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter team member name"
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="member@aibos.com"
            />

            <Input
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Aryan Technologies"
            />

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Role
              </span>

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm capitalize text-white outline-none transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role} className="bg-slate-950">
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="Temporary Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create temporary password"
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="animate-spin" size={19} />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus size={19} />
                  Add Member
                </>
              )}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Workspace Access</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Team Members
              </h2>
            </div>

            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              {teamMembers.length} users
            </span>
          </div>

          {isLoading ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <Loader2 className="animate-spin text-cyan-300" size={36} />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <Users className="text-slate-500" size={44} />
              <h3 className="mt-4 text-lg font-semibold text-white">
                No team members found
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Add your first team member to start managing workspace access.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => {
                const userId = member._id || member.id;
                const isUpdating = updatingId === userId;
                const isDeleting = deletingId === userId;

                return (
                  <div
                    key={userId}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/30 hover:bg-cyan-400/5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 text-sm font-bold text-slate-950">
                          {member.avatarInitial ||
                            member.fullName?.charAt(0)?.toUpperCase() ||
                            "U"}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-white">
                              {member.fullName}
                            </h3>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs capitalize ${getRoleBadgeClass(
                                member.role
                              )}`}
                            >
                              {member.role}
                            </span>

                            <span
                              className={
                                member.isActive
                                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200"
                                  : "rounded-full border border-slate-400/20 bg-slate-400/10 px-3 py-1 text-xs text-slate-300"
                              }
                            >
                              {member.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-col gap-1 text-sm text-slate-400 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-1">
                            <span className="flex items-center gap-2">
                              <Mail size={15} />
                              {member.email}
                            </span>

                            <span className="flex items-center gap-2">
                              <Building2 size={15} />
                              {member.companyName || "AI-BOS Workspace"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={member.role}
                          onChange={(event) =>
                            handleRoleChange(userId, event.target.value)
                          }
                          disabled={isUpdating || isDeleting}
                          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-2 text-sm capitalize text-white outline-none transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10 disabled:opacity-60"
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(userId)}
                          disabled={isUpdating || isDeleting}
                          className={
                            member.isActive
                              ? "flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-400/20 disabled:opacity-60"
                              : "flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20 disabled:opacity-60"
                          }
                        >
                          {isUpdating ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Power size={16} />
                          )}

                          {member.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMember(userId)}
                          disabled={isUpdating || isDeleting}
                          className="flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-400/20 disabled:opacity-60"
                        >
                          {isDeleting ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Trash2 size={16} />
                          )}

                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}