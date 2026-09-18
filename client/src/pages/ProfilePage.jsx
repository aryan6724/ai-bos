import { useEffect, useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardPageHeader from "../components/dashboard/DashboardPageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import {
  changePassword,
  getProfile,
  updateProfile,
} from "../services/profileService";

const initialProfileForm = {
  fullName: "",
  companyName: "",
  avatarInitial: "",
};

const initialPasswordForm = {
  currentPassword: "",
  newPassword: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getProfile();
      const user = data.user;

      setProfile(user);

      setProfileForm({
        fullName: user.fullName || "",
        companyName: user.companyName || "",
        avatarInitial:
          user.avatarInitial || user.fullName?.slice(0, 1)?.toUpperCase() || "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccessMessage("");
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccessMessage("");
  };

  const handleUpdateProfile = async (event) => {
    event.preventDefault();

    if (!profileForm.fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    try {
      setIsUpdatingProfile(true);
      setError("");
      setSuccessMessage("");

      const data = await updateProfile(profileForm);

      setProfile(data.user);
      setSuccessMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError("Current password and new password are required.");
      return;
    }

    try {
      setIsChangingPassword(true);
      setError("");
      setSuccessMessage("");

      const data = await changePassword(passwordForm);

      setSuccessMessage(data.message || "Password changed successfully.");
      setPasswordForm(initialPasswordForm);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <DashboardPageHeader
          badge="Account Center"
          title="Profile Settings"
          description="Manage your AI-BOS account profile, workspace identity, security settings, and password."
        />

        <button
          type="button"
          onClick={loadProfile}
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

      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 size={18} />
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[520px] items-center justify-center">
          <Loader2 className="animate-spin text-cyan-300" size={42} />
        </div>
      ) : (
        <>
          <section className="mb-6 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
            <Card className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-cyan-400 text-4xl font-bold text-slate-950 shadow-xl shadow-cyan-500/20">
                  {profile?.avatarInitial ||
                    profile?.fullName?.slice(0, 1)?.toUpperCase() ||
                    "U"}
                </div>

                <h2 className="mt-5 text-2xl font-semibold text-white">
                  {profile?.fullName}
                </h2>

                <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                  <Mail size={15} />
                  {profile?.email}
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm capitalize text-cyan-200">
                    {profile?.role}
                  </span>

                  <span
                    className={
                      profile?.isActive
                        ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200"
                        : "rounded-full border border-slate-400/20 bg-slate-400/10 px-4 py-2 text-sm text-slate-300"
                    }
                  >
                    {profile?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-6 w-full rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm text-slate-400">Workspace</p>
                  <p className="mt-2 font-semibold text-white">
                    {profile?.companyName || "AI-BOS Workspace"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-6">
                <p className="text-sm text-slate-400">Personal Details</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  Edit Profile
                </h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <Input
                  label="Full Name"
                  name="fullName"
                  value={profileForm.fullName}
                  onChange={handleProfileChange}
                  placeholder="Enter your full name"
                />

                <Input
                  label="Company Name"
                  name="companyName"
                  value={profileForm.companyName}
                  onChange={handleProfileChange}
                  placeholder="Enter workspace/company name"
                />

                <Input
                  label="Avatar Initial"
                  name="avatarInitial"
                  value={profileForm.avatarInitial}
                  onChange={handleProfileChange}
                  placeholder="A"
                  maxLength={1}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="animate-spin" size={19} />
                      Updating...
                    </>
                  ) : (
                    <>
                      <User size={19} />
                      Update Profile
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card className="p-6">
              <div className="mb-6">
                <p className="text-sm text-slate-400">Security</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  Change Password
                </h2>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                <Input
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                />

                <Input
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="animate-spin" size={19} />
                      Changing...
                    </>
                  ) : (
                    <>
                      <KeyRound size={19} />
                      Change Password
                    </>
                  )}
                </Button>
              </form>
            </Card>

            <Card className="p-6">
              <div className="mb-6">
                <p className="text-sm text-slate-400">Account Protection</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  Security Status
                </h2>
              </div>

              <div className="space-y-4">
                {[
                  "JWT authentication enabled",
                  "Password stored securely with hashing",
                  "Profile routes protected",
                  "Role-based access enabled",
                  "Admin routes restricted",
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
            </Card>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}