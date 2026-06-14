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
import { Switch } from "@/components/ui/switch";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Plus,
  Shield,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Permission = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

type Role = {
  id: string;
  name: string;
  isSystem: boolean;
  createdAt: string;
};

type Modal =
  | { type: "create" }
  | { type: "delete"; permission: Permission }
  | null;

export default function PermissionsPage() {
  const { data: sessionData } = authClient.useSession();
  const user = sessionData?.user as { role?: string } | undefined;

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissionsMap, setRolePermissionsMap] = useState<
    Record<string, Set<string>>
  >({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  const canManage = user?.role && user?.role !== "USER";

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError("");

    const [permRes, roleRes] = await Promise.all([
      authClient.$fetch<{ permissions: Permission[] }>(
        "/permission-management/list",
      ),
      authClient.$fetch<{ roles: Role[] }>("/role-management/list"),
    ]);

    if (permRes.error) {
      setFetchError(
        (permRes.error as { message?: string }).message ??
        "Failed to load permissions",
      );
      setLoading(false);
      return;
    }
    if (roleRes.error) {
      setFetchError(
        (roleRes.error as { message?: string }).message ?? "Failed to load roles",
      );
      setLoading(false);
      return;
    }

    const perms = permRes.data?.permissions ?? [];
    const roleList = roleRes.data?.roles ?? [];
    setPermissions(perms);
    setRoles(roleList);

    // Load role-permission assignments for every role
    const map: Record<string, Set<string>> = {};
    await Promise.all(
      roleList.map(async (role) => {
        const res = await authClient.$fetch<{ permissionIds: string[] }>(
          "/permission-management/get-role-permissions",
          { method: "POST", body: { roleId: role.id } },
        );
        map[role.id] = new Set(res.data?.permissionIds ?? []);
      }),
    );
    setRolePermissionsMap(map);

    setLoading(false);
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    if (canManage) loadData();
    else setLoading(false);
  }, [canManage, loadData, user]);

  async function handleTogglePermission(
    roleId: string,
    permissionId: string,
    currentlyAssigned: boolean,
  ) {
    const key = `${roleId}:${permissionId}`;
    setToggling((prev) => ({ ...prev, [key]: true }));
    setError("");

    if (currentlyAssigned) {
      const { error } = await authClient.$fetch("/permission-management/remove", {
        method: "POST",
        body: { roleId, permissionId },
      });
      if (error) {
        setError(
          (error as { message?: string }).message ?? "Failed to remove permission",
        );
        setToggling((prev) => ({ ...prev, [key]: false }));
        return;
      }
      setRolePermissionsMap((prev) => {
        const next = { ...prev };
        const set = new Set(next[roleId]);
        set.delete(permissionId);
        next[roleId] = set;
        return next;
      });
    } else {
      const { error } = await authClient.$fetch("/permission-management/assign", {
        method: "POST",
        body: { roleId, permissionId },
      });
      if (error) {
        setError(
          (error as { message?: string }).message ?? "Failed to assign permission",
        );
        setToggling((prev) => ({ ...prev, [key]: false }));
        return;
      }
      setRolePermissionsMap((prev) => {
        const next = { ...prev };
        const set = new Set(next[roleId]);
        set.add(permissionId);
        next[roleId] = set;
        return next;
      });
    }

    setToggling((prev) => ({ ...prev, [key]: false }));
  }

  function openModal(m: Modal) {
    setError("");
    setModal(m);
  }

  function closeModal() {
    setModal(null);
    setError("");
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();

    const { error } = await authClient.$fetch("/permission-management/create", {
      method: "POST",
      body: { name, description },
    });
    if (error) {
      setError(
        (error as { message?: string }).message ?? "Failed to create permission",
      );
      setPending(false);
      return;
    }
    await loadData();
    setPending(false);
    closeModal();
  }

  async function handleDelete() {
    if (modal?.type !== "delete") return;
    setPending(true);
    setError("");
    const { error } = await authClient.$fetch("/permission-management/delete", {
      method: "POST",
      body: { id: modal.permission.id },
    });
    if (error) {
      setError(
        (error as { message?: string }).message ?? "Failed to delete permission",
      );
      setPending(false);
      return;
    }
    await loadData();
    setPending(false);
    closeModal();
  }

  if (!user) return null;

  if (!canManage) {
    return (
      <div className="px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>
              Only ADMIN users can manage permissions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Permissions</h1>
        <Button size="sm" onClick={() => openModal({ type: "create" })}>
          <Plus className="mr-1.5 h-4 w-4" />
          New permission
        </Button>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Assign granular permissions to each role. Use the{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          resource:action
        </code>{" "}
        naming convention (e.g. <code className="rounded bg-muted px-1 py-0.5 text-xs">user:create</code>).
      </p>

      {fetchError && (
        <p className="mb-4 text-sm text-destructive">{fetchError}</p>
      )}
      {error && (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      )}

      {/* Summary cards for each role */}
      {!loading && roles.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const assigned =
              rolePermissionsMap[role.id]?.size ?? 0;
            return (
              <Card key={role.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {role.isSystem && (
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    )}
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    {role.isSystem && (
                      <Badge variant="secondary" className="text-xs">
                        System
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">{assigned}</span>{" "}
                    of <span className="text-foreground font-medium">{permissions.length}</span>{" "}
                    permissions assigned
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : permissions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No permissions</CardTitle>
            <CardDescription>
              Create your first permission to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  Permission
                </th>
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  Description
                </th>
                {roles.map((role) => (
                  <th
                    key={role.id}
                    className="pb-3 px-3 text-center font-medium text-muted-foreground min-w-[100px]"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {role.isSystem && (
                        <Shield className="h-3 w-3 shrink-0" />
                      )}
                      <span>{role.name}</span>
                    </div>
                  </th>
                ))}
                <th className="pb-3 pl-4 text-right font-medium text-muted-foreground w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm, idx) => (
                <tr
                  key={perm.id}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50",
                    idx % 2 === 0 && "bg-muted/20",
                  )}
                >
                  <td className="py-3 pr-4">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                      {perm.name}
                    </code>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground max-w-[200px] truncate">
                    {perm.description || "—"}
                  </td>
                  {roles.map((role) => {
                    const isAssigned =
                      rolePermissionsMap[role.id]?.has(perm.id) ?? false;
                    const toggleKey = `${role.id}:${perm.id}`;
                    const isToggling = toggling[toggleKey] ?? false;

                    return (
                      <td
                        key={`${role.id}-${perm.id}`}
                        className="py-3 px-3 text-center"
                      >
                        {isToggling ? (
                          <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Switch
                            checked={isAssigned}
                            onCheckedChange={() =>
                              handleTogglePermission(
                                role.id,
                                perm.id,
                                isAssigned,
                              )
                            }
                            aria-label={`${isAssigned ? "Remove" : "Assign"} ${perm.name} ${isAssigned ? "from" : "to"} ${role.name}`}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="py-3 pl-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openModal({ type: "delete", permission: perm })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {/* Create dialog */}
      <Dialog
        open={modal?.type === "create"}
        onOpenChange={(o) => !o && closeModal()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create permission</DialogTitle>
            <DialogDescription>
              Add a new permission using the{" "}
              <code className="rounded bg-muted px-1 text-xs">resource:action</code>{" "}
              format.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                name="name"
                placeholder="post:create"
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Format: <code className="rounded bg-muted px-1">resource:action</code>{" "}
                (lowercase, colon-separated)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Description (optional)</Label>
              <Input
                id="create-description"
                name="description"
                placeholder="Create new posts"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog
        open={modal?.type === "delete"}
        onOpenChange={(o) => !o && closeModal()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete permission</DialogTitle>
            <DialogDescription>
              Delete{" "}
              <strong>
                {modal?.type === "delete" ? modal.permission.name : ""}
              </strong>
              ? This will also remove it from all roles.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
