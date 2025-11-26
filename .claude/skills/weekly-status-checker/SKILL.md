---
name: weekly-status-checker
description: Check content development channels for missing weekly status updates and notify PMs. Use when the user asks to check weekly status updates, review missing status updates, or run status update checks. ONLY use in the Inbound Square project context.
---
# Weekly Status Update Check

Review content development channels for active clients and identify those missing "Weekly Status" posts in the last 5 calendar days.

## Reference Data

**IMPORTANT**: Use these shared reference files to avoid redundant MCP lookups:

- **Active Clients**: `../../../references/active-clients.md` - Active clients to project code/channel mappings
- **Slack Channels**: `../../../references/slack-channels.md` - Project code to channel ID mappings
- **Project Managers**: `../../../references/project-managers.md` - PM names and Slack IDs
- **Constants**: `../../../references/constants.md` - Bot IDs, channel IDs, constants

Instead of querying Airtable or Slack for basic lookups, consult these references first.

**If references seem stale**: Ask user to run `/refresh-references` first.

## When to Use This Skill

Use this skill when:

- User asks to "check weekly status updates"
- User asks to "review missing status updates"
- User requests to "run status update check"
- User asks about "weekly status" compliance
- The current project context is Inbound Square

**Do NOT use for:**

- Auto-management updates or follow-ups
- Non-Inbound Square projects

## Process Overview

1. Read active clients from `../../../references/active-clients.md`
2. Process channels in batches of up to 10 at a time using sub-agents
3. For each batch: search for "Weekly Status" messages in last 5 calendar days
4. Generate summary report identifying missing status updates
5. Wait for user confirmation for notification actions
6. Execute confirmed actions (send PM reminder messages)

**Critical: Always get confirmation before sending any Slack messages.**
**Critical: All MCP calls (Slack, Airtable) must be made in sub-agents to manage context better.**

## Step 1: Load Active Clients

Read `../../../references/active-clients.md` to get list of:

- Client names
- Project codes
- Channel IDs
- PM assignments

**If file doesn't exist or seems empty**: Instruct user to run `/refresh-references` first.

Example data structure:
```
[
  {clientName: "Example Corp", projectCode: "CP", channelId: "C01EYLFBG0M", pm: "Jahanzeb Arshad"},
  {clientName: "Another Co", projectCode: "NX", channelId: "C035M60DT0C", pm: "Ravi Padmaraj"},
  ...
]
```

## Step 2: Calculate Date Range

**Calculate the date 5 calendar days ago from today.**

For example:
- Today: 2025-11-26
- 5 days ago: 2025-11-21
- Search window: 2025-11-21 to 2025-11-26

Use YYYY-MM-DD format for Slack search queries.

## Step 3: Batch Processing & Channel Search

**Process channels in batches of up to 10 at a time.**

For each batch of up to 10 channels:

### 3.1 Parallel Channel Search (Using Sub-Agents)

**Create a sub-agent for each channel in the batch (up to 10 parallel sub-agents).**

Each sub-agent should:

1. **Search Channel for Weekly Status** (using MCP tools in sub-agent):

   Use `mcp__slack__slack_search_messages`:
   ```
   query: "Weekly Status" in:#<channel-name> after:<5-days-ago>
   sort: timestamp
   sort_dir: desc
   ```

   **Alternative search** (case insensitive):
   ```
   query: "weekly status" in:#<channel-name> after:<5-days-ago>
   ```

2. **Determine Status**:

   **HAS STATUS UPDATE**:
   - Found at least one "Weekly Status" or "weekly status" message within last 5 days
   - Extract date of most recent status post
   - Action: No action needed

   **MISSING STATUS UPDATE**:
   - No "Weekly Status" message found in last 5 days
   - Action: Recommend PM notification

3. **Look Up PM Slack ID**:
   - Use PM name from active-clients.md
   - Look up Slack ID from `../../../references/project-managers.md`
   - Format: `<@SLACK_ID>` for Slack mentions

4. **Return Results**:
   ```
   {
     channelName: "#cp-content-development",
     clientName: "Example Corp",
     projectCode: "CP",
     status: "MISSING" | "HAS_STATUS",
     lastStatusDate: "2025-11-24" | null,
     pmName: "Jahanzeb Arshad",
     pmSlackId: "U09HHEEP5CG"
   }
   ```

**Important**: All Slack MCP tool calls must be made within the sub-agents, not in the main agent context.

## Step 4: Batch Summary Report

After processing each batch (up to 10 channels), provide comprehensive summary:

```
BATCH X OF Y - WEEKLY STATUS UPDATE CHECK
==========================================
Date: 2025-11-26
Lookback: 5 calendar days (since 2025-11-21)
Channels in This Batch: X

CHANNELS WITH STATUS UPDATES (no action needed):
- #cp-content-development (Example Corp) - Status posted 2025-11-24
- #de-content-development (Another Corp) - Status posted 2025-11-22
- #tr-content-development (Third Corp) - Status posted 2025-11-23

CHANNELS MISSING STATUS UPDATES:
1. Channel: #nx-content-development
   Client: Client Name
   Project: NX
   PM: Ravi Padmaraj (<@U07PRTGJ9S5>)
   Last Status: None found in last 5 days
   Recommended Message: <@U07PRTGJ9S5> please post your weekly status update when you get a chance. thanks

2. Channel: #ss-content-development
   Client: Another Client
   Project: SS
   PM: Ravi Padmaraj (<@U07PRTGJ9S5>)
   Last Status: None found in last 5 days
   Recommended Message: <@U07PRTGJ9S5> please post your weekly status update when you get a chance. thanks

3. Channel: #sw-content-development
   Client: Third Client
   Project: SW
   PM: Sudip Sengupta (<@U04HDE1NVCP>)
   Last Status: None found in last 5 days
   Recommended Message: <@U04HDE1NVCP> please post your weekly status update when you get a chance. thanks

BATCH SUMMARY:
- Compliant: 3 channels
- Missing: 3 channels
- Total: 6 channels
```

## Step 5: Batch Confirmation & Execution

**Wait for user confirmation for this batch**, then execute all actions for this batch:

1. **Send PM Reminder Messages**: Post each reminder message to the specified content development channel (use Slack MCP tool in sub-agents)

**Message template:**
```
<@PM_SLACK_ID> please post your weekly status update when you get a chance. thanks
```

**Example execution:**
```
Sending messages:
1. #nx-content-development: <@U07PRTGJ9S5> please post your weekly status update when you get a chance. thanks
2. #ss-content-development: <@U07PRTGJ9S5> please post your weekly status update when you get a chance. thanks
3. #sw-content-development: <@U04HDE1NVCP> please post your weekly status update when you get a chance. thanks

Messages sent successfully: 3
```

**After completing this batch, move to the next batch of up to 10 channels and repeat Steps 3-5 until all channels are processed.**

## Final Summary

After all batches are complete:

```
WEEKLY STATUS UPDATE CHECK - FINAL SUMMARY
==========================================
Date: 2025-11-26
Total channels checked: 28

RESULTS:
- Compliant: 20 channels (71%)
- Missing: 8 channels (29%)
- Messages sent: 8

COMPLIANT CHANNELS:
- #cp-content-development, #de-content-development, #tr-content-development...

MISSING STATUS (NOTIFIED):
- #nx-content-development (Ravi Padmaraj)
- #ss-content-development (Ravi Padmaraj)
- #sw-content-development (Sudip Sengupta)
- #fw-content-development (Sudip Sengupta)
- #cy-content-development (Sudip Sengupta)
- #ib-content-development (Ilyas Hamdi)
- #on-content-development (Ilyas Hamdi)
- #cr-content-development (James Selvage)

Check complete. All PMs have been notified.
```

## PM Slack ID Lookup

Use the PM Slack IDs from `../../../references/project-managers.md`:

| Name | Slack ID |
|------|----------|
| Sudip Sengupta | U04HDE1NVCP |
| Ravi Padmaraj | U07PRTGJ9S5 |
| Ilyas Hamdi | U06QTU2DE8P |
| Jahanzeb Arshad | U09HHEEP5CG |
| James Selvage | U0575FNHUG3 |

## Search Query Examples

**Slack search syntax:**

```
"Weekly Status" in:#cp-content-development after:2025-11-21
"weekly status" in:#nx-content-development after:2025-11-21
```

**Case variations to consider:**
- "Weekly Status"
- "weekly status"
- "Weekly Status Update"
- "weekly status update"

Search for both capitalized and lowercase versions to catch all variations.

## Execution Notes

- **Batch Processing**: Process up to 10 channels per batch, get confirmation, execute, then move to next batch
- **Sub-Agent MCP Calls**: All Slack MCP tool calls must be made in sub-agents to manage context better
- **Parallel Analysis**: Process up to 10 channels in parallel within each batch using sub-agents
- **Per-Batch Confirmation**: Get approval for each batch's actions before executing
- **5 Calendar Day Window**: Always calculate from today's date, not business days
- **Case Insensitive Search**: Search for both "Weekly Status" and "weekly status"
- **PM Slack ID Translation**: Use proper Slack mention format (<@SLACK_ID>) for all PMs
- **Reference Files First**: Always read reference files before making MCP calls

## Refresh Check

Before running this skill, verify `../../../references/active-clients.md` exists and is up to date.

If file is missing or user wants fresh data, recommend:
```
Please run `/refresh-references` first to update cached client data.
```
