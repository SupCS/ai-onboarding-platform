# Access Control Matrix

This file is the project-level reference for permissions. Before changing roles,
permission keys, defaults, or permission checks, read this file and update it in
the same change.

Runtime source of truth:
- Role defaults live in `src/lib/permissions.js`.
- Per-user overrides live in the `user_permission_overrides` database table.
- Effective permission = role default + user override.

## Permission Keys

| Key | Meaning |
| --- | --- |
| `admin.manage_roles` | Assign and remove team lead roles. |
| `permissions.manage_teamleads` | Configure team lead permission overrides. |
| `permissions.manage_team_members` | Configure permission overrides for direct team members. |
| `teams.manage_members` | Add and remove team members in manageable teams. |
| `materials.create` | Create/upload materials. |
| `materials.edit` | Edit materials. |
| `materials.delete` | Delete materials. |
| `lessons.create` | Create lessons. |
| `lessons.manage` | Edit/delete manageable lessons. |
| `lessons.publish_archive` | Publish, archive, and restore manageable lessons. |
| `lessons.manage_activities` | Generate/edit activities for manageable lessons. |
| `lessons.manage_assets` | Add uploaded files/links to manageable lessons. |
| `roadmaps.create` | Create roadmaps. |
| `roadmaps.manage` | Edit/delete manageable roadmaps. |
| `learning.enroll` | Enroll/unenroll in lessons and roadmaps. |
| `learning.complete` | Complete lessons and activities. |
| `learning.ask` | Ask the lesson assistant. |

## Default Role Rights

| Permission | Admin | Teamlead | Member |
| --- | --- | --- | --- |
| `admin.manage_roles` | Yes | No | No |
| `permissions.manage_teamleads` | Yes | No | No |
| `permissions.manage_team_members` | Yes | Yes | No |
| `teams.manage_members` | Yes | Yes | No |
| `materials.create` | Yes | Yes | No |
| `materials.edit` | Yes | Yes | No |
| `materials.delete` | Yes | Yes | No |
| `lessons.create` | Yes | Yes | No |
| `lessons.manage` | Yes | Yes | No |
| `lessons.publish_archive` | Yes | Yes | No |
| `lessons.manage_activities` | Yes | Yes | No |
| `lessons.manage_assets` | Yes | Yes | No |
| `roadmaps.create` | Yes | Yes | No |
| `roadmaps.manage` | Yes | Yes | No |
| `learning.enroll` | Yes | Yes | Yes |
| `learning.complete` | Yes | Yes | Yes |
| `learning.ask` | Yes | Yes | Yes |

## Delegation Rules

| Actor | Can configure | Cannot configure |
| --- | --- | --- |
| Admin | Non-admin users, normally teamleads | `admin.manage_roles`, `permissions.manage_teamleads`, admin users |
| Teamlead | Direct team members with role `member` | Admin permissions, teamlead-permission management, team membership management |

Object-level rules still apply after permission checks:
- Teamleads can manage only their own team members.
- Lessons can be managed by the creator or admin.
- Roadmaps can be managed by the author, author's teamlead, or admin.

## Current Actual Rights

The current actual rights are the effective permissions visible in:
- Admin tab: teamlead permission matrices.
- Teams tab: member permission matrices.
- Database table: `user_permission_overrides`.

No static per-user override rows are tracked in this file yet. If a migration,
seed, or manual DB change adds known overrides, record them here.

| User | Role | Overrides | Updated by | Notes |
| --- | --- | --- | --- | --- |
| _None recorded_ |  |  |  | Runtime overrides are stored in DB. |
