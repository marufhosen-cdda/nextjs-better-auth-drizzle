"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import {
  Building2,
  Check,
  Loader2,
  Mail,
  MailPlus,
  Pencil,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date;
  metadata?: unknown;
};

type Member = {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

type Invitation = {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  inviterId: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
};

type ActiveOrgData = Organization & {
  members: Member[];
  invitations: Invitation[];
};

type Tab = "members" | "invitations" | "settings";

// ── Helpers ─────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Component ───────────────────────────────────────────────────────

export default function OrganizationsPage() {
  const { data: sessionData } = authClient.useSession();
  const { data: orgList, refetch: refetchOrgs } = authClient.useListOrganizations();
  const { data: activeOrgData, refetch: refetchActiveOrg } = authClient.useActiveOrganization();

  const [activeTab, setActiveTab] = useState<Tab>("members");

  // Create org
  const [showCreate, setShowCreate] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState("");

  // Invite member
  const [showInvite, setShowInvite] = useState(false);
  const [invitePending, setInvitePending] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("member");

  // Update org
  const [showUpdate, setShowUpdate] = useState(false);
  const [updatePending, setUpdatePending] = useState(false);
  const [updateError, setUpdateError] = useState("");

  // Delete org
  const [showDelete, setShowDelete] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Remove member
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  // Update member role
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [updateRoleValue, setUpdateRoleValue] = useState<Record<string, string>>({});

  // Cancel invitation
  const [cancellingInvite, setCancellingInvite] = useState<string | null>(null);

  // Pending user invitations
  const [userInvitations, setUserInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [acceptingInvite, setAcceptingInvite] = useState<string | null>(null);
  const [rejectingInvite, setRejectingInvite] = useState<string | null>(null);

  const activeOrg = activeOrgData as ActiveOrgData | undefined;
  const organizations = (orgList as Organization[] | undefined) ?? [];

  const user = sessionData?.user as {
    id: string;
    name: string;
    email: string;
  } | undefined;

  // Fetch user's pending invitations
  const loadUserInvitations = useCallback(async () => {
    setLoadingInvitations(true);
    const { data, error } = await authClient.organization.listUserInvitations();
    if (!error && data) {
      setUserInvitations(data ?? []);
    }
    setLoadingInvitations(false);
  }, []);

  useEffect(() => {
    if (user) loadUserInvitations();
  }, [user, loadUserInvitations]);

  // ── Handlers ──────────────────────────────────────────────────────

  async function handleSetActive(organizationId: string) {
    const { error } = await authClient.organization.setActive({ organizationId });
    if (!error) {
      await refetchActiveOrg();
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreatePending(true);
    setCreateError("");
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const slug = String(form.get("slug") ?? "").trim();

    const { error } = await authClient.organization.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
    });

    if (error) {
      setCreateError(error.message ?? "Failed to create organization");
      setCreatePending(false);
      return;
    }

    setCreatePending(false);
    setShowCreate(false);
    await refetchOrgs();
    await refetchActiveOrg();
  }

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInvitePending(true);
    setInviteError("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();

    const { error } = await authClient.organization.inviteMember({ email, role: inviteRole as "admin" | "member" | "owner" });

    if (error) {
      setInviteError(error.message ?? "Failed to invite member");
      setInvitePending(false);
      return;
    }

    setInvitePending(false);
    setShowInvite(false);
    await refetchActiveOrg();
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUpdatePending(true);
    setUpdateError("");
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const slug = String(form.get("slug") ?? "").trim();

    const { error } = await authClient.organization.update({
      data: { name, slug },
    });

    if (error) {
      setUpdateError(error.message ?? "Failed to update organization");
      setUpdatePending(false);
      return;
    }

    setUpdatePending(false);
    setShowUpdate(false);
    await refetchActiveOrg();
    await refetchOrgs();
  }

  async function handleDelete() {
    setDeletePending(true);
    setDeleteError("");
    const { error } = await authClient.organization.delete({ organizationId: activeOrg!.id });

    if (error) {
      setDeleteError(error.message ?? "Failed to delete organization");
      setDeletePending(false);
      return;
    }

    setDeletePending(false);
    setShowDelete(false);
    await refetchOrgs();
    await refetchActiveOrg();
  }

  async function handleRemoveMember(memberId: string) {
    setRemovingMember(memberId);
    const { error } = await authClient.organization.removeMember({ memberIdOrEmail: memberId });
    if (!error) {
      await refetchActiveOrg();
    }
    setRemovingMember(null);
  }

  async function handleUpdateMemberRole(memberId: string, role: string | null) {
    if (!role) return;
    setUpdatingRole(memberId);
    const { error } = await authClient.organization.updateMemberRole({ memberId, role });
    if (!error) {
      await refetchActiveOrg();
    }
    setUpdatingRole(null);
  }

  async function handleCancelInvitation(invitationId: string) {
    setCancellingInvite(invitationId);
    const { error } = await authClient.organization.cancelInvitation({ invitationId });
    if (!error) {
      await refetchActiveOrg();
    }
    setCancellingInvite(null);
  }

  async function handleAcceptInvitation(invitationId: string) {
    setAcceptingInvite(invitationId);
    const { error } = await authClient.organization.acceptInvitation({ invitationId });
    if (!error) {
      await loadUserInvitations();
      await refetchOrgs();
      await refetchActiveOrg();
    }
    setAcceptingInvite(null);
  }

  async function handleRejectInvitation(invitationId: string) {
    setRejectingInvite(invitationId);
    const { error } = await authClient.organization.rejectInvitation({ invitationId });
    if (!error) {
      await loadUserInvitations();
    }
    setRejectingInvite(null);
  }

  // Determine if current user is owner/admin of active org
  const currentMember = activeOrg?.members?.find(
    (m) => m.userId === user?.id,
  );
  const isOwner = currentMember?.role === "owner";
  const isAdmin = currentMember?.role === "admin" || isOwner;
  const canManageMembers = isAdmin || isOwner;
  const canManageOrg = isOwner;

  if (!user) return null;

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Organizations</h1>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New organization
        </Button>
      </div>

      {/* Pending User Invitations Banner */}
      {userInvitations.length > 0 && (
        <Card className="mb-6 border-dashed border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MailPlus className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Pending invitations</CardTitle>
            </div>
            <CardDescription>
              You have {userInvitations.length} pending invitation
              {userInvitations.length > 1 ? "s" : ""} to join organizations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {userInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {getInitials(inv.organization?.name ?? inv.email)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {(inv as unknown as { organizationName?: string }).organizationName ?? "Organization"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Invited as <span className="font-medium capitalize">{inv.role}</span> &mdash;{" "}
                        {inv.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={rejectingInvite === inv.id}
                      onClick={() => handleRejectInvitation(inv.id)}
                    >
                      {rejectingInvite === inv.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      <span className="ml-1.5 hidden sm:inline">Decline</span>
                    </Button>
                    <Button
                      size="sm"
                      disabled={acceptingInvite === inv.id}
                      onClick={() => handleAcceptInvitation(inv.id)}
                    >
                      {acceptingInvite === inv.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      <span className="ml-1.5 hidden sm:inline">Accept</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Org Selector */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Active organization</CardTitle>
          </div>
          <CardDescription>
            Select the organization you want to manage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium">No organizations yet</p>
                <p className="text-xs text-muted-foreground">
                  Create an organization to get started.
                </p>
              </div>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Create organization
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => handleSetActive(org.id)}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    activeOrg?.id === org.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted-foreground/10 text-[10px] font-bold text-muted-foreground">
                    {getInitials(org.name)}
                  </div>
                  <span>{org.name}</span>
                  {activeOrg?.id === org.id && (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Org Management */}
      {activeOrg && (
        <>
          {/* Tabs */}
          <div className="mb-6 flex items-center gap-1 border-b">
            {(["members", "invitations", "settings"] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── MEMBERS TAB ── */}
          {activeTab === "members" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>
                      Manage who has access to <strong>{activeOrg.name}</strong>.
                    </CardDescription>
                  </div>
                  {canManageMembers && (
                    <Button size="sm" onClick={() => setShowInvite(true)}>
                      <UserPlus className="mr-1.5 h-4 w-4" />
                      Invite member
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {activeOrg.members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members found.</p>
                ) : (
                  <div>
                    {activeOrg.members.map((member, idx) => (
                      <div key={member.id}>
                        {idx > 0 && <Separator className="my-2" />}
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              {getInitials(member.user?.name ?? member.userId)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {member.user?.name ?? "Unknown"}
                                {member.userId === user.id && (
                                  <span className="ml-1.5 text-xs text-muted-foreground">
                                    (you)
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.user?.email ?? member.userId}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {canManageMembers &&
                            member.userId !== user.id ? (
                              <>
                                <Select
                                  defaultValue={member.role}
                                  disabled={updatingRole === member.id}
                                  onValueChange={(role) =>
                                    handleUpdateMemberRole(member.id, role)
                                  }
                                >
                                  <SelectTrigger className="h-8 w-28 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="owner">Owner</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  disabled={removingMember === member.id}
                                  onClick={() => handleRemoveMember(member.id)}
                                >
                                  {removingMember === member.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <UserMinus className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </>
                            ) : (
                              <Badge
                                variant={
                                  member.role === "owner"
                                    ? "default"
                                    : member.role === "admin"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="capitalize text-xs"
                              >
                                {member.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── INVITATIONS TAB ── */}
          {activeTab === "invitations" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Invitations</CardTitle>
                    <CardDescription>
                      Pending invitations for <strong>{activeOrg.name}</strong>.
                    </CardDescription>
                  </div>
                  {canManageMembers && (
                    <Button size="sm" onClick={() => setShowInvite(true)}>
                      <MailPlus className="mr-1.5 h-4 w-4" />
                      Invite member
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {activeOrg.invitations.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Mail className="h-8 w-8 text-muted-foreground/40" />
                    <div>
                      <p className="text-sm font-medium">No pending invitations</p>
                      <p className="text-xs text-muted-foreground">
                        Invite people to join this organization.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {activeOrg.invitations.map((inv, idx) => (
                      <div key={inv.id}>
                        {idx > 0 && <Separator className="my-2" />}
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              {getInitials(inv.email)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{inv.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Role:{" "}
                                <span className="font-medium capitalize">
                                  {inv.role}
                                </span>{" "}
                                &mdash;{" "}
                                {new Date(inv.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={cancellingInvite === inv.id}
                            onClick={() => handleCancelInvitation(inv.id)}
                          >
                            {cancellingInvite === inv.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-1.5 hidden sm:inline">Cancel</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === "settings" && (
            <Card>
              <CardHeader>
                <CardTitle>Organization settings</CardTitle>
                <CardDescription>
                  Manage <strong>{activeOrg.name}</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span>{activeOrg.name}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Slug</span>
                    <span className="font-mono text-xs">{activeOrg.slug}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>
                      {new Date(activeOrg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Members</span>
                    <span>{activeOrg.members.length}</span>
                  </div>
                </div>

                {canManageOrg && (
                  <>
                    <Separator />

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUpdate(true)}
                      >
                        <Pencil className="mr-1.5 h-4 w-4" />
                        Edit organization
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDelete(true)}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Delete organization
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!activeOrg && organizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select an organization</CardTitle>
            <CardDescription>
              Choose an organization above to manage its members and settings.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* ── DIALOGS ── */}

      {/* Create Org */}
      <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); setCreateError(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>
              Create a new organization to collaborate with your team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
                name="name"
                placeholder="Acme Inc."
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug (optional)</Label>
              <Input
                id="org-slug"
                name="slug"
                placeholder="acme-inc"
              />
              <p className="text-xs text-muted-foreground">
                A unique identifier for your organization. Auto-generated if not provided.
              </p>
            </div>
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPending}>
                {createPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Member */}
      <Dialog open={showInvite} onOpenChange={(o) => { setShowInvite(o); setInviteError(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
            <DialogDescription>
              Send an invitation to join <strong>{activeOrg?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                placeholder="colleague@example.com"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v ?? "member")}>
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteError && (
              <p className="text-sm text-destructive">{inviteError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInvite(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={invitePending}>
                {invitePending ? "Sending…" : "Send invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Org */}
      <Dialog open={showUpdate} onOpenChange={(o) => { setShowUpdate(o); setUpdateError(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit organization</DialogTitle>
            <DialogDescription>
              Update the name or slug for <strong>{activeOrg?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="update-name">Name</Label>
              <Input
                id="update-name"
                name="name"
                defaultValue={activeOrg?.name ?? ""}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-slug">Slug</Label>
              <Input
                id="update-slug"
                name="slug"
                defaultValue={activeOrg?.slug ?? ""}
                required
              />
            </div>
            {updateError && (
              <p className="text-sm text-destructive">{updateError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUpdate(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatePending}>
                {updatePending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Org */}
      <Dialog open={showDelete} onOpenChange={(o) => { setShowDelete(o); setDeleteError(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete organization</DialogTitle>
            <DialogDescription>
              Delete <strong>{activeOrg?.name}</strong>? This action cannot be
              undone. All members will be removed and data will be lost.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDelete(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deletePending}
              onClick={handleDelete}
            >
              {deletePending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
