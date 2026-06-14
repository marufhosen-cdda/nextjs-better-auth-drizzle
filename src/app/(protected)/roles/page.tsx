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
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Role = {
  id: string;
  name: string;
  isSystem: boolean;
  createdAt: Date;
};

type Modal =
  | { type: "create" }
  | { type: "edit"; role: Role }
  | { type: "delete"; role: Role }
  | null;

export default function RolesPage() {
  const { data: sessionData } = authClient.useSession();
  const user = sessionData?.user as { role?: string } | undefined;

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const canManage = user?.role && user?.role !== "USER";

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    const { data, error } = await authClient.roleManagement.list();
    if (error) {
      setFetchError((error as { message?: string }).message ?? "Failed to load roles");
    } else {
      setRoles(data?.roles ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    if (canManage) loadRoles();
    else setLoading(false);
  }, [canManage, loadRoles, user]);

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
    const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();
    const { error } = await authClient.roleManagement.create({ name });
    if (error) {
      setError((error as { message?: string }).message ?? "Failed to create role");
      setPending(false);
      return;
    }
    await loadRoles();
    setPending(false);
    closeModal();
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (modal?.type !== "edit") return;
    setPending(true);
    setError("");
    const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();
    const { error } = await authClient.roleManagement.update({ id: modal.role.id, name });
    if (error) {
      setError((error as { message?: string }).message ?? "Failed to update role");
      setPending(false);
      return;
    }
    await loadRoles();
    setPending(false);
    closeModal();
  }

  async function handleDelete() {
    if (modal?.type !== "delete") return;
    setPending(true);
    setError("");
    const { error } = await authClient.roleManagement.delete({ id: modal.role.id });
    if (error) {
      setError((error as { message?: string }).message ?? "Failed to delete role");
      setPending(false);
      return;
    }
    await loadRoles();
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
            <CardDescription>Only ADMIN users can manage roles.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Roles</h1>
        <Button size="sm" onClick={() => openModal({ type: "create" })}>
          <Plus className="mr-1.5 h-4 w-4" />
          New role
        </Button>
      </div>

      {fetchError && <p className="mb-4 text-sm text-destructive">{fetchError}</p>}

      <Card>
        <CardHeader>
          <CardTitle>All roles</CardTitle>
          <CardDescription>System roles cannot be modified or deleted.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles found.</p>
          ) : (
            <div>
              {roles.map((role, idx) => (
                <div key={role.id}>
                  {idx > 0 && <Separator className="my-2" />}
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      {role.isSystem && (
                        <Shield className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">{role.name}</span>
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-xs">
                          System
                        </Badge>
                      )}
                    </div>
                    {!role.isSystem && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal({ type: "edit", role })}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openModal({ type: "delete", role })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create */}
      <Dialog open={modal?.type === "create"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create role</DialogTitle>
            <DialogDescription>Add a new custom role.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                name="name"
                placeholder="MANAGER"
                required
                autoFocus
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

      {/* Edit */}
      <Dialog open={modal?.type === "edit"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit role</DialogTitle>
            <DialogDescription>Rename this role.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={modal?.type === "edit" ? modal.role.name : ""}
                required
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={modal?.type === "delete"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete role</DialogTitle>
            <DialogDescription>
              Delete{" "}
              <strong>{modal?.type === "delete" ? modal.role.name : ""}</strong>?
              Users assigned this role will have their role cleared.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={pending} onClick={handleDelete}>
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
