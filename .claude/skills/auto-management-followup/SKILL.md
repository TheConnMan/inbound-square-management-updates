---
name: auto-management-followup
description: Review and resolve auto-management Slack messages that have been acted upon. Use when the user asks to run auto-management follow-up, review auto-management follow-ups, or check auto-management completions. ONLY use in the Inbound Square project context. This is distinct from auto-management updates (which creates new notifications).
---
# Auto-Management Follow-Up

Review Airtable bot messages in `#auto-management` that have been acted upon and mark them as complete when the original issues are resolved.

## Reference Data

**IMPORTANT**: Use these shared reference files to avoid redundant MCP lookups:

- **Slack Channels**: `../../../references/slack-channels.md` - Project code to channel ID mappings
- **Project Managers**: `../../../references/project-managers.md` - PM names and Slack IDs
- **Airtable Structure**: `../../../references/airtable-structure.md` - Base, table, and field IDs
- **Constants**: `../../../references/constants.md` - Bot IDs, channel IDs, constants

Instead of searching for channel IDs or PM user IDs, consult these references first.

## When to Use This Skill

Use this skill when:

- User asks to "run auto management follow-up"
- User asks to "review auto management follow-ups"
- User requests to "check auto-management completions"
- The current project context is Inbound Square

**Do NOT use for:**

- Auto-management updates (creating new notifications)
- Initial auto-management reviews
- Non-Inbound Square projects

## Process Overview

1. Search for Airtable bot messages from the last 14 days in `#auto-management` (C03MBDE9CM8) that have:
   - ✅ :eyes: and :hourglass_flowing_sand: emojis (reviewed and acted upon)
   - ❌ NO :white_check_mark: emoji (not yet marked complete)
2. Process messages in batches of up to 10 at a time using sub-agents
3. For each batch: analyze messages in parallel (using sub-agents for all MCP calls)
4. Generate summary report for the batch
5. Wait for user confirmation for batch actions
6. Execute confirmed actions (mark resolved messages)
7. Move to next batch and repeat until all messages are processed

**Critical: All MCP calls (Slack, Airtable) must be made in sub-agents to manage context better.**

## Step 1: Search for Candidate Messages

Use Slack search (via MCP tool in sub-agent) to find messages with the required emoji pattern.

**IMPORTANT**: Use this EXACT search query format.

### Calculate Date Filter

First, calculate the date 14 days ago from today (use current date from system context).

### Execute Search

Use `mcp__slack__slack_search_messages` with these EXACT parameters:

```
query: "in:#auto-management from:@Airtable has::eyes: has::hourglass_flowing_sand: after:YYYY-MM-DD"
count: 100
sort: "timestamp"
sort_dir: "desc"
```

Replace `YYYY-MM-DD` with the calculated date (e.g., `after:2025-11-19`).

**Key Points:**
- Use `from:@Airtable` (display name), NOT `from:@U03E50KUNN5` (user ID) - user IDs don't work in Slack search
- The emoji filters will exclude messages that already have :white_check_mark:
- This query returns only Airtable bot messages with the required emoji pattern

### Filter Results After Search

After receiving search results, verify messages have:

- :eyes: emoji ✅
- :hourglass_flowing_sand: emoji ✅
- NO :white_check_mark: emoji ❌

If no results, exit - nothing to review.

**Note**: Collect all candidate messages first, then process them in batches of up to 10.

## Step 2: Batch Processing & Analysis

**Process messages in batches of up to 10 at a time.**

For each batch of up to 10 messages:

### 2.1 Parallel Message Analysis (Using Sub-Agents)

**Create a sub-agent for each message in the batch (up to 10 parallel sub-agents).**

Each sub-agent should:

1. **Review the Original Issue** (using MCP tools in sub-agent):
   - Note article title and project code
   - Identify the specific issue flagged (draft overdue, needs peer reviewer, waiting on author)

2. **Check Response Thread** (using MCP tools in sub-agent):
   - Look in the thread of the auto-management message (use Slack MCP tool)
   - Find the message posted to PM's content development channel
   - Note what action was requested

3. **Verify PM Follow-Up** (using MCP tools in sub-agent):
   - Check the project's `#[project]-content-development` channel for resolution evidence within last 7 days (use Slack MCP tool):
     - "Draft submitted" for overdue drafts
     - "Peer reviewer assigned: [name]" for missing peer reviewers
     - "Author provided updates" for pending author work
     - Status updates showing progress on flagged issue

4. **Verify in Airtable** (using MCP tools in sub-agent):
   - Extract Airtable link from auto-management message
   - Use Airtable MCP tool to check the record
   - Verify if the issue is resolved:
     - Status field changes
     - Assignee updates for peer reviewers
     - Date field updates for submissions
     - Notes indicating resolution

5. **Decision**:

   **If RESOLVED:**
   - Action: Add :white_check_mark: emoji and remove :hourglass_flowing_sand: emoji

   **If UNRESOLVED:**
   - Action: Leave message unmarked (no additional emojis)

6. **Return Results**: Each sub-agent returns its analysis and recommended actions

**Important**: All Slack and Airtable MCP tool calls must be made within the sub-agents, not in the main agent context.

## Resolution Evidence Examples

**Mark as Complete when:**

- Original: "Draft was due 4 days ago" → Airtable shows draft status "Submitted"
- Original: "Needs peer reviewer" → Airtable shows peer reviewer assigned OR PM posted "Added [name] as peer reviewer"
- Original: "Waiting on author updates for X days" → Airtable shows author activity OR status moved forward

## Search Optimization

**If too many results:**

- Add date filters: `after:2025-06-01`
- Increase specificity with project codes
- Add specific issue terms

**If too few results:**

- Expand timeframe by removing date filters
- Check for emoji variations
- Verify channel and user IDs

## Step 3: Batch Summary Report

After processing each batch (up to 10 messages), provide comprehensive summary before taking action:

```
BATCH X OF Y - AUTO-MANAGEMENT FOLLOW-UP SUMMARY:
Date: [Date]
Messages in This Batch: X

RESOLVED ACTIONS (will add :white_check_mark: and remove :hourglass_flowing_sand:):
- [Article Title] - [Project] - [Issue resolved]
- [Article Title] - [Project] - [Issue resolved]

UNRESOLVED (no action):
- [Article Title] - [Project] - [Issue still pending]

BATCH SUMMARY:
- Resolved: X messages
- Unresolved: X messages
- Total Actions: X
```

## Step 4: Batch Execution

Execute all actions for this batch:

1. **Mark Resolved Messages**: Add :white_check_mark: emoji and remove :hourglass_flowing_sand: emoji (use Slack MCP tool in sub-agents)
2. **Leave Unresolved Messages**: No action needed

**After completing this batch, move to the next batch of up to 10 messages and repeat Steps 2-4 until all messages are processed.**

## Key Principles

1. **Batch Processing**: Process up to 10 messages per batch, execute actions, then move to next batch
2. **Sub-Agent MCP Calls**: All Slack and Airtable MCP tool calls must be made in sub-agents to manage context better
3. **Parallel Analysis**: Process up to 10 messages in parallel within each batch using sub-agents
4. **Automatic Execution**: Execute batch actions automatically after generating summary
5. **Specific Resolution**: Look for evidence the SPECIFIC problem was addressed, not just PM awareness
6. **No New Messages**: This is purely tracking/completion - don't send new PM messages
7. **Context Management**: Using sub-agents for MCP calls prevents context window overflow

## Example Workflow

```
Batch 1 (Messages 1-10):
  - Create 10 sub-agents in parallel
  - Each sub-agent analyzes one message using MCP tools
  - Collect results: 7 resolved, 3 unresolved
  - Show summary to user
  - Execute: Mark 7 messages as complete
  - Move to Batch 2

Batch 2 (Messages 11-20):
  - Create 10 sub-agents in parallel
  - Repeat process...
```

## Exception: Xhelal Likaj

Xhelal Likaj peer reviews his own articles. Any messages about his articles not having a different peer reviewer should be marked complete.