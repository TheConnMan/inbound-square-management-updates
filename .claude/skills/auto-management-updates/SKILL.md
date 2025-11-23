---
name: auto-management-updates
description: Review new auto-management notifications from Airtable bot and send PM messages for unresolved issues. Use when the user asks to run auto-management updates, review auto-management channel, or check new auto-management messages. ONLY use in the Inbound Square project context. This is distinct from auto-management follow-up (which marks existing tracked issues as complete).
---
# Auto-Management Updates

Review new Airtable bot messages in `#auto-management` and notify PMs about unresolved issues requiring action.

## Reference Data

**IMPORTANT**: Use these shared reference files to avoid redundant MCP lookups:

- **Slack Channels**: `../references/slack-channels.md` - Project code to channel ID mappings
- **Project Managers**: `../references/project-managers.md` - PM names and Slack IDs
- **Airtable Structure**: `../references/airtable-structure.md` - Base, table, and field IDs
- **Constants**: `../references/constants.md` - Bot IDs, channel IDs, constants

Instead of searching for channel IDs or PM user IDs, consult these references first.

## When to Use This Skill

Use this skill when:

- User asks to "run auto management updates"
- User asks to "run a management channel review"
- User requests to "check auto-management" or "review auto-management channel"
- The current project context is Inbound Square

**Do NOT use for:**

- Auto-management follow-up (marking existing tracked issues as complete)
- Non-Inbound Square projects

## Process Overview

1. Search for unreviewed Airtable bot messages in `#auto-management` from the last 14 days only using a sub-agent (to preserve top level agent context)
2. Process messages in batches of up to 10 at a time using sub-agents
3. For each batch: analyze messages in parallel (using sub-agents for all MCP calls)
4. Generate summary report for the batch
5. Wait for user confirmation for batch actions
6. Execute confirmed actions (send PM messages, add emojis, post thread links)
7. Move to next batch and repeat until all messages are processed

**Critical: Always get confirmation before sending any Slack messages.**
**Critical: All MCP calls (Slack, Airtable) must be made in sub-agents to manage context better.**

## Step 1: Message Discovery

Search `#auto-management` (C03MBDE9CM8) for bot messages from Airtable bot (U03E50KUNN5) without :eyes: emoji.

**IMPORTANT: Calculate the date for 10 days ago** from today's date and use it in the search queries. For example, if today is 2025-11-20, use `after:2025-11-10`.

Use these Slack searches (within last 10 days):

```
1. Article issues: in:#auto-management from:@Airtable "The article" -has::eyes: after:[DATE]
2. Draft due dates: in:#auto-management from:@Airtable "The draft" -has::eyes: after:[DATE]
3. Outline due dates: in:#auto-management from:@Airtable "The outline" -has::eyes: after:[DATE]
```

Replace `[DATE]` with the calculated date (YYYY-MM-DD format).

If all searches return no results, exit - nothing to review.

## Step 2: Batch Processing & Analysis

**Process messages in batches of up to 10 at a time.**

For each batch of up to 10 messages:

### 2.1 Parallel Message Analysis (Using Sub-Agents)

**Create a sub-agent for each message in the batch (up to 10 parallel sub-agents).**

Each sub-agent should:

1. **Extract Information** (using MCP tools in sub-agent):
   - Pull Airtable link and review the record (use Airtable MCP tool)
   - Identify two-letter project code (e.g., "The article ARTICLE for PROJECT")
   - Find corresponding `#PROJECT-content-development` channel (lowercase)
   - Get Project Manager's Slack ID from Airtable field "Project Manager's Slack ID (from Projects)" (use Airtable MCP tool)

2. **Check for Resolution** (using MCP tools in sub-agent):
   - Look for project updates within last 7 days in content development channel (use Slack MCP tool)
   - Determine if the SPECIFIC PROBLEM is RESOLVED (not just acknowledged)

3. **Categorize Action**:

   **RESOLVED**:
   - Evidence shows specific issue is fixed
   - Action: Add :eyes: and :white_check_mark: emojis

   **NEEDS PM MESSAGE**:
   - No evidence of resolution, PM action required
   - Action: Send PM message + add :eyes: and :hourglass_flowing_sand: emojis + post link in thread

   **SKIP (Monday only)**:
   - 3-day overdue messages
   - Action: None (see Monday Special Handling section)

4. **Return Results**: Each sub-agent returns its analysis and recommended actions

**Important**: All Slack and Airtable MCP tool calls must be made within the sub-agents, not in the main agent context.

## Step 3: Batch Summary Report

After processing each batch (up to 10 messages), provide comprehensive summary before taking action:

```
BATCH X OF Y - AUTO-MANAGEMENT REVIEW SUMMARY:
Date: [Date]
Messages in This Batch: X

RESOLVED ACTIONS (will add :eyes: and :white_check_mark:):
- [Article Title] - [Project] - [Issue resolved]
- [Article Title] - [Project] - [Issue resolved]

PM MESSAGES TO SEND:
1. Channel: #[project]-content-development
   Message: [@PM Name] [specific action needed for article]
   Auto-Management Thread: [message link]

2. Channel: #[project]-content-development
   Message: [@PM Name] [specific action needed for article]
   Auto-Management Thread: [message link]

SKIPPED (Monday 3-day overdue):
- [Article Title] - [Project] - [Reason]

BATCH SUMMARY:
- Resolved: X messages
- PM Messages: X messages
- Skipped: X messages
- Total Actions: X
```

## Step 4: Batch Confirmation & Execution

**Wait for user confirmation for this batch**, then execute all actions for this batch:

1. **Send PM Messages**: Post each message to specified content development channel (use Slack MCP tool in sub-agents)
2. **Update Auto-Management**:
    - For resolved items: Add :eyes: and :white_check_mark: (use Slack MCP tool in sub-agents)
    - For PM messages sent: Add :eyes: and :hourglass_flowing_sand: (use Slack MCP tool in sub-agents)
3. **Post Thread Links**: After each PM message, post the message link in the auto-management thread (use Slack MCP tool in sub-agents)

**After completing this batch, move to the next batch of up to 10 messages and repeat Steps 2-4 until all messages are processed.**

## Monday Special Handling

**When running on Mondays:**

### Skip 3-Day Overdue Messages

- **Identify**: Messages containing "3 day overdue" or "3 days overdue"
- **Action**: Skip entirely (no emojis, no PM messages, no follow-up)
- **Rationale**: 3-day period includes weekend days, not actionable overdue items

### Examples of Monday Skips

**Skip these on Monday:**

- "Draft was due 3 days ago"
- "Waiting on author updates for 3 days"
- "Peer reviewer needed - 3 days overdue"

**Still process on Monday:**

- "Draft was due 4 days ago"
- "Waiting on author updates for 5 days"
- "Needs peer reviewer" (no time component)
- "Graphics needed"

## Resolution Evidence Examples

**What counts as "resolved":**

- "Draft was due 4 days ago" → Evidence draft was submitted (Airtable status change)
- "Waiting on author updates for X days" → Evidence author provided updates OR article moved forward
- "Needs peer reviewer" → Evidence peer reviewer was assigned (Airtable record)

## Message Templates

Examples of PM messages to send:

```
@[PM Name] please line up graphics for `article-title`
@[PM Name] please add the peer reviewer for `article-title`
@[PM Name] are you still waiting on the author for `article-title`?
```

Use proper Slack mention format with PM's Slack ID from project managers directory.

## Thread Link Posting

After sending each PM message, post the message link in the original auto-management thread to track the notification.

## Exception: Xhelal Likaj

Xhelal Likaj peer reviews his own articles. Any messages about his articles not having a different peer reviewer should be marked complete (add :eyes: and :white_check_mark:).

## Execution Notes

- **Batch Processing**: Process up to 10 messages per batch, get confirmation, execute, then move to next batch
- **Sub-Agent MCP Calls**: All Slack and Airtable MCP tool calls must be made in sub-agents to manage context better
- **Parallel Analysis**: Process up to 10 messages in parallel within each batch using sub-agents
- **Per-Batch Confirmation**: Get approval for each batch's actions before executing
- **Efficient Execution**: Send all messages and update all emojis in sequence (using sub-agents for MCP calls)
- **Context Management**: Using sub-agents for MCP calls prevents context window overflow
- **PM Slack ID Translation**: Use proper Slack mention format for all PMs