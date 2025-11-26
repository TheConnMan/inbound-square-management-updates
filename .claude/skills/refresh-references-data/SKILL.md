---
name: refresh-references-data
description: Refresh cached reference files by querying Airtable and Slack. Use when reference data may be stale or new projects/PMs have been added. ONLY use in the Inbound Square project context.
---
# Refresh References

Update cached reference files by dynamically querying Airtable and Slack MCP tools.

## Reference Data

This skill REFRESHES the following reference files:

- **Slack Channels**: `../../../references/slack-channels.md` - Project code to channel ID mappings
- **Project Managers**: `../../../references/project-managers.md` - PM names and Slack IDs
- **Active Clients**: `../../../references/active-clients.md` - Active clients to project code mappings

**Not Refreshed** (static configuration):

- **Airtable Structure**: `../../../references/airtable-structure.md` - Base, table, and field IDs
- **Constants**: `../../../references/constants.md` - Bot IDs, channel IDs, constants

## When to Use This Skill

Use this skill when:

- User asks to "refresh references" or "update reference files"
- User requests to "refresh cached data"
- Reference data may be stale (new PMs added, new projects, client status changes)
- Before running weekly status updates for the first time
- The current project context is Inbound Square

**Do NOT use for:**

- Non-Inbound Square projects
- Regular workflow operations (only refresh when data may be stale)

## Process Overview

1. Collect current data from Airtable and Slack using sub-agents
2. Parse existing reference files to detect changes
3. Generate diff summary showing additions, removals, and updates
4. Wait for user confirmation
5. Write updated reference files

**Critical: Always show changes before overwriting files.**
**Critical: All MCP calls (Slack, Airtable) must be made in sub-agents to manage context better.**

## Step 1: Data Collection

### 1.1 Collect Slack Channels (Using Sub-Agent)

**Create a sub-agent to query Slack channels.**

The sub-agent should:

1. Use `mcp__slack__slack_list_channels` with `limit: 200`
2. If more than 200 channels exist, paginate using `cursor` parameter
3. Filter channels ending with `-content-development`
4. Extract project code (uppercase characters before first hyphen)
5. Return list: `[{projectCode, channelName, channelId}]`

**Example filtering logic:**
- Channel: `cp-content-development` → Project Code: `CP`, Channel ID: `C01EYLFBG0M`
- Channel: `isq-content-development` → Project Code: `ISQ`, Channel ID: `C06USGK8JQZ`
- Skip channels not matching pattern

### 1.2 Collect Project Managers (Using Sub-Agent)

**Create a sub-agent to query Airtable People table.**

The sub-agent should:

1. Use `mcp__airtable__list_records`:
   ```
   baseId: appvRZDyTZafVdfEW
   tableId: tblZ7o9S26PY6yxPv (People)
   filterByFormula: FIND('Project Manager', {Role})
   maxRecords: 100
   ```

2. Extract fields:
   - Full Name (fldAMkEDKd2BpxkrA)
   - Email Address (fldGssocoOfvlH4gG)
   - Slack ID (fld5Mg92HXuxjS9CS)
   - Is Project Manager For (fldzOxQTKUSILzwLv) - linked projects
   - Record ID

3. For each PM, get list of project codes from linked projects

4. Return list: `[{name, slackId, email, recordId, projectCodes}]`

### 1.3 Collect Active Clients (Using Sub-Agent)

**Create a sub-agent to query Airtable Clients table.**

The sub-agent should:

1. Use `mcp__airtable__list_records`:
   ```
   baseId: appvRZDyTZafVdfEW
   tableId: tblAH12T3dDKahZMn (Clients)
   filterByFormula: {Invoicing Status} = "Active"
   maxRecords: 200
   ```

2. Extract fields:
   - Name (fldZ25pa1kK9AFdAg)
   - Projects Created For (fldR2OfgoqcP7rhZ5) - linked projects

3. For each client:
   - Get linked project records
   - Extract project codes (2-3 letter codes from project names)
   - Look up PM from project data

4. Return list: `[{clientName, projectCodes, channelIds, pmNames}]`

## Step 2: Parse Existing Reference Files

Read and parse the current content of:

- `../../../references/slack-channels.md` - Extract current channel mappings
- `../../../references/project-managers.md` - Extract current PM data
- `../../../references/active-clients.md` - Extract current active client data (may not exist yet)

## Step 3: Generate Diff Summary

Compare collected data with existing files and identify:

- **Added**: New entries not in existing files
- **Removed**: Existing entries not in new data
- **Changed**: Entries with modified values

**Display summary:**

```
REFERENCE FILE REFRESH SUMMARY
==============================
Date: 2025-11-26

## Slack Channels (slack-channels.md)

Changes detected:
+ Added (2):
  - QS (qs-content-development, C09MNUF0BV1)
  - WA (wa-content-development, C07GY382SEM)
- Removed (1):
  - DF (df-content-development, C01ABC123XY)
~ Updated: (none)

Total channels: 35 (was 34)

## Project Managers (project-managers.md)

Changes detected:
+ Added (1):
  - Jahanzeb Arshad (U09HHEEP5CG, jahanzeb.arshad@inboundsquare.com)
~ Updated (1):
  - Ilyas Hamdi: Projects changed from "NB, ON, IB (15 total)" to "NB, ON, SW, IB (16 total)"
- Removed: (none)

Total PMs: 5 (was 4)

## Active Clients (active-clients.md)

Changes detected:
+ Added (3):
  - Client A (CP, C01EYLFBG0M, Jahanzeb Arshad)
  - Client B (NX, C035M60DT0C, Ravi Padmaraj)
  - Client C (DE, C039XQBNMDF, Sudip Sengupta)
- Removed: (none)
~ Updated: (none)

Total active clients: 28 (was 25)

PROCEED WITH UPDATE? (Y/N)
```

## Step 4: User Confirmation

**Wait for explicit user confirmation** before overwriting any files.

If user approves, proceed to Step 5. If user declines, exit without changes.

## Step 5: Write Updated Files

### 5.1 Update slack-channels.md

Write file with format:

```markdown
# Slack Channel Reference

Quick reference for Inbound Square Slack channels used in auto-management workflows.

## Content Development Channels

Map project codes to their content-development channel IDs:

| Project | Channel Name | Channel ID |
|---------|--------------|------------|
| CB | cb-content-development | C020V2BBHG9 |
| CH | ch-content-development | C06J2PMNG6N |
...

## Management Channels

| Channel | Channel ID | Purpose |
|---------|------------|---------|
| auto-management | C03MBDE9CM8 | Auto-management notifications |
| auto-project-managers | C03CX2CS0S1 | Machine channel for PMs |
| team-project-managers | C03CZULS1PV | PM team discussions |

## Usage

Use project code to look up channel ID:
```
Project: CP → Channel ID: C01EYLFBG0M
Channel name: #cp-content-development
```
```

**Sort channels alphabetically by project code.**

**Management channels are static** - always include the three management channels with hardcoded IDs.

### 5.2 Update project-managers.md

Write file with format:

```markdown
# Project Manager Reference

Quick reference for Inbound Square Project Managers.

## Project Managers

| Name | Slack ID | Email | Airtable Record ID |
|------|----------|-------|-------------------|
| Sudip Sengupta | U04HDE1NVCP | sudip.sengupta@inboundsquare.com | recrrGQrsMT0nYePb |
...

## PM to Project Mapping

| PM Name | Projects |
|---------|----------|
| Sudip Sengupta | DE, TR, SW, CY, FW (30 total) |
...

## Usage

When mentioning a PM in Slack, use their Slack ID:
```
@U04HDE1NVCP (mentions Sudip Sengupta)
```
```

**Sort PMs alphabetically by name.**

### 5.3 Create/Update active-clients.md

Write file with format:

```markdown
# Active Clients Reference

Active clients from Airtable with their project codes and content development channels.

**Last Updated**: 2025-11-26

## Active Client Mappings

| Client Name | Project Code | Channel ID | PM |
|-------------|--------------|------------|-----|
| Example Corp | CP | C01EYLFBG0M | Jahanzeb Arshad |
| Another Co | NX | C035M60DT0C | Ravi Padmaraj |
...

## Usage

Use this table to quickly look up which channels to check for active clients.

## Notes

- Only includes clients with "Invoicing Status" = "Active" in Airtable
- Refresh this file when client statuses change
- Project codes link to channels via slack-channels.md
- PM assignments link via project-managers.md
```

**Sort clients alphabetically by client name.**

## Step 6: Confirmation Report

After writing files, report:

```
REFERENCE FILES UPDATED SUCCESSFULLY
====================================

Files written:
- /workspace/git/inbound-square/management-updates/.claude/skills/references/slack-channels.md
- /workspace/git/inbound-square/management-updates/.claude/skills/references/project-managers.md
- /workspace/git/inbound-square/management-updates/.claude/skills/references/active-clients.md

Summary:
- Slack channels: 35 total
- Project managers: 5 total
- Active clients: 28 total

Reference files are now up to date.
```

## Error Handling

- **Slack pagination**: If >200 channels, use cursor to paginate through all results
- **Missing Slack IDs**: If PM has no Slack ID, use "(no Slack ID)" placeholder and warn user
- **Empty results**: If any query returns empty, warn user but continue with other files
- **File write errors**: If Write tool fails, report error and exit without partial updates

## Execution Notes

- **Sub-Agent MCP Calls**: All Slack and Airtable MCP tool calls must be made in sub-agents
- **Parallel Collection**: Can run all three data collection sub-agents in parallel
- **Always Show Diff**: Never write files without showing user what will change
- **Preserve Format**: Maintain exact markdown table format from existing files
- **Static Management Channels**: The three management channels are hardcoded constants, not dynamically queried
