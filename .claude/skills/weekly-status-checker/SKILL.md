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

**EXCLUSIONS**:
- **ALWAYS exclude ISQ channel (C06USGK8JQZ) and Bob Farzami from all checks and notifications**
- Filter out ISQ from the active clients list before processing

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

### 3.1 Parallel Channel Analysis (Using Sub-Agents)

**Create a sub-agent for each channel in the batch (up to 10 parallel sub-agents).**

Each sub-agent should:

1. **Fetch Channel History** (using MCP tools in sub-agent):

   Use `mcp__slack__slack_get_channel_history` to get all messages from the last 5 days:
   ```
   channel_id: <channel-id>
   oldest: <timestamp-5-days-ago>
   limit: 100
   ```

   Convert the date (5 days ago) to Unix timestamp format for the API.

2. **Evaluate Messages for Status Updates**:

   Review ALL messages from the PM in the channel history. A message counts as a status update if it:

   - Contains project/work updates, progress reports, or summaries
   - Includes information about articles, tasks, or deliverables
   - Has phrases like "Weekly Status", "Weekly Update", "Status", "Update", "Week of", etc.
   - Is a substantial update from the PM (not just a quick response or bot message)

   **Ignore**:
   - Bot messages
   - Simple acknowledgments or short replies
   - Messages from other team members
   - Check-in responses without substantial updates

3. **Determine Status**:

   **HAS STATUS UPDATE**:
   - Found at least one qualifying status update message from the PM within last 5 days
   - Extract date of most recent status update
   - Action: No action needed

   **MISSING STATUS UPDATE**:
   - No qualifying status update found in last 5 days
   - Action: Recommend PM notification

3. **Look Up PM Slack ID**:
   - Use PM name from active-clients.md
   - Look up Slack ID from `../../../references/project-managers.md`
   - Filter channel messages to only evaluate messages from this PM's Slack ID
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

## Message Evaluation Guidelines

**What qualifies as a status update:**
- Contains project progress, work summaries, or deliverable updates
- Discusses articles, tasks, client feedback, or team activities
- Provides overview of current state or recent accomplishments
- Common indicators: "Weekly Status", "Weekly Update", "Update", "Status", bullet lists with project details

**What does NOT qualify:**
- Bot-generated messages or automated reminders
- Brief acknowledgments ("ok", "thanks", "will do")
- Questions without substantial context
- Messages from non-PM team members
- Short tactical responses in threads

**Timestamp conversion:**
For `oldest` parameter in channel history API, convert date to Unix timestamp:
- Example: 2025-11-22 → 1731974400 (seconds since epoch)

## Execution Notes

- **Batch Processing**: Process up to 10 channels per batch, get confirmation, execute, then move to next batch
- **Sub-Agent MCP Calls**: All Slack MCP tool calls must be made in sub-agents to manage context better
- **Parallel Analysis**: Process up to 10 channels in parallel within each batch using sub-agents
- **Per-Batch Confirmation**: Get approval for each batch's actions before executing
- **5 Calendar Day Window**: Always calculate from today's date, not business days
- **Message Evaluation**: Fetch full channel history and evaluate all PM messages, don't rely on keyword searches
- **PM Slack ID Translation**: Use proper Slack mention format (<@SLACK_ID>) for all PMs
- **Reference Files First**: Always read reference files before making MCP calls
- **ISQ Exclusion**: NEVER check ISQ channel or notify Bob Farzami
- **Timestamp Format**: Convert dates to Unix timestamps for channel history API calls

## Refresh Check

Before running this skill, verify `../../../references/active-clients.md` exists and is up to date.

If file is missing or user wants fresh data, recommend:
```
Please run `/refresh-references` first to update cached client data.
```
