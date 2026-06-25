"use client";

import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
  TablePagination,
  formatDate,
  formatNumber,
  initials,
} from "@/app/(components)/ui";
import {
  useCreateInviteMutation,
  useGetInvitesQuery,
  useGetUserQuery,
  useRevokeInviteMutation,
} from "@/state/api";
import { Copy, Search, Trash2, UserPlus } from "lucide-react";
import React, { FormEvent, useState } from "react";

const pageSize = 12;

const Users = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "USER">("USER");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteError, setInviteError] = useState("");
  const usersQuery = useGetUserQuery({ search, page, pageSize });
  const invitesQuery = useGetInvitesQuery();
  const [createInvite, createInviteState] = useCreateInviteMutation();
  const [revokeInvite, revokeInviteState] = useRevokeInviteMutation();
  const visibleUsers = usersQuery.data?.data ?? [];
  const invites = invitesQuery.data?.data ?? [];
  const totalPages = usersQuery.data?.pagination.totalPages ?? 0;
  const currentPage = usersQuery.data?.pagination.page ?? page;
  const filteredCount = usersQuery.data?.pagination.total ?? 0;

  const handleInviteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInviteError("");
    setInviteLink("");

    try {
      const result = await createInvite({
        email: inviteEmail,
        name: inviteName || undefined,
        role: inviteRole,
      }).unwrap();
      setInviteEmail("");
      setInviteName("");
      setInviteRole("USER");
      setInviteLink(result.inviteLink);
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "data" in error &&
        typeof error.data === "object" &&
        error.data &&
        "error" in error.data &&
        typeof error.data.error === "object" &&
        error.data.error &&
        "message" in error.data.error &&
        typeof error.data.error.message === "string"
          ? error.data.error.message
          : "Unable to create invite.";
      setInviteError(message);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
  };

  if (usersQuery.isLoading) {
    return <LoadingState label="Loading users" />;
  }

  if (usersQuery.isError) {
    return <ErrorState onRetry={() => usersQuery.refetch()} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        description="Manage workspace users and invite new accounts."
      />

      <SectionCard
        title="Invite user"
        description="Create a one-time invite link for a new workspace account."
      >
        <form
          className="grid gap-3 p-5 lg:grid-cols-[minmax(180px,1fr)_minmax(160px,1fr)_140px_auto]"
          onSubmit={handleInviteSubmit}
        >
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Email
            </span>
            <input
              className="field"
              onChange={(event) => setInviteEmail(event.target.value)}
              required
              type="email"
              value={inviteEmail}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Name
            </span>
            <input
              className="field"
              onChange={(event) => setInviteName(event.target.value)}
              value={inviteName}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Role
            </span>
            <select
              className="field"
              onChange={(event) =>
                setInviteRole(event.target.value as "ADMIN" | "USER")
              }
              value={inviteRole}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              className="button-primary w-full"
              disabled={createInviteState.isLoading}
            >
              <UserPlus className="h-4 w-4" />
              Invite
            </button>
          </div>
        </form>

        {inviteError ? (
          <div className="mx-5 mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            {inviteError}
          </div>
        ) : null}

        {inviteLink ? (
          <div className="mx-5 mb-5 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 sm:flex-row sm:items-center dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
            <span className="min-w-0 flex-1 break-all">{inviteLink}</span>
            <button className="button-secondary" onClick={copyInviteLink}>
              <Copy className="h-4 w-4" />
              Copy
            </button>
          </div>
        ) : null}
      </SectionCard>

      <div className="surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full max-w-xl">
          <span className="sr-only">Search users</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="field field-icon-left"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            type="search"
            value={search}
          />
        </label>
        <p className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
          {formatNumber(filteredCount)}{" "}
          {filteredCount === 1 ? "user" : "users"}
        </p>
      </div>

      <div className="table-shell">
        {visibleUsers.length === 0 ? (
          <EmptyState
            title="No users match"
            description="Try searching for a different name or email address."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[420px]">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          {initials(user.name)}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <a
                        className="text-blue-600 hover:underline dark:text-blue-400"
                        href={`mailto:${user.email}`}
                      >
                        {user.email}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <TablePagination
          onPageChange={setPage}
          page={currentPage}
          totalPages={totalPages}
        />
      </div>

      <SectionCard
        title="Invites"
        description="Pending, accepted, expired, and revoked invite links."
      >
        {invitesQuery.isLoading ? (
          <LoadingState label="Loading invites" />
        ) : invites.length === 0 ? (
          <EmptyState
            title="No invites yet"
            description="Create an invite to let a user join this workspace."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[760px]">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Accepted by</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.inviteId}>
                    <td>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {invite.email}
                      </p>
                      {invite.name ? (
                        <p className="text-xs text-slate-400">{invite.name}</p>
                      ) : null}
                    </td>
                    <td>{invite.role === "ADMIN" ? "Admin" : "User"}</td>
                    <td>
                      <StatusBadge
                        tone={
                          invite.status === "PENDING"
                            ? "info"
                            : invite.status === "ACCEPTED"
                              ? "success"
                              : invite.status === "REVOKED"
                                ? "danger"
                                : "warning"
                        }
                      >
                        {invite.status.toLowerCase()}
                      </StatusBadge>
                    </td>
                    <td>{formatDate(invite.expiresAt)}</td>
                    <td>{invite.acceptedBy?.email ?? "Not accepted"}</td>
                    <td className="text-right">
                      <button
                        aria-label={`Revoke invite for ${invite.email}`}
                        className="icon-button"
                        disabled={
                          invite.status !== "PENDING" ||
                          revokeInviteState.isLoading
                        }
                        onClick={() => revokeInvite(invite.inviteId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default Users;
