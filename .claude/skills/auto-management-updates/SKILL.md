---
name: auto-management-updates
description: Review new auto-management notifications from Airtable bot and send PM messages for unresolved issues. Use when the user asks to run auto-management updates, review auto-management channel, or check new auto-management messages. ONLY use in the Inbound Square project context. This is distinct from auto-management follow-up (which marks existing tracked issues as complete).
---
# Auto-Management Updates

Review new Airtable bot messages in `#auto-management` and notify PMs about unresolved issues requiring action.

## Reference Data

**IMPORTANT**: Use these shared reference files to avoid redundant MCP lookups:

- **Slack Channels**: `../../../references/slack-channels.md` - Project code to channel ID mappings
- **Project Managers**: `../../../references/project-managers.md` - PM names and Slack IDs
- **Airtable Structure**: `../../../references/airtable-structure.md` - Base, table, and field IDs
- **Constants**: `../../../references/constants.md` - Bot IDs, channel IDs, constants

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
   - Check the current Stage field in Airtable (this is the source of truth)
   - Determine if the SPECIFIC PROBLEM is RESOLVED (not just acknowledged)
   - **CRITICAL**: Follow the "Publication Verification Guidelines" section below when determining resolution status

3. **Categorize Action**:

   **RESOLVED**:
   - Article Stage in Airtable has progressed PAST the blocking stage
   - Evidence shows specific issue is fixed (both Airtable stage AND channel evidence)
   - Action: Add :eyes: and :white_check_mark: emojis

   **NEEDS PM MESSAGE**:
   - Article Stage is still in the blocking stage (stuck in review)
   - No evidence of resolution, PM action required
   - Action: Send PM message + add :eyes: and :hourglass_flowing_sand: emojis + post link in thread

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

## Resolution Evidence Examples

**What counts as "resolved":**

- "Draft was due 4 days ago" → Evidence draft was submitted (Airtable status change)
- "Waiting on author updates for X days" → Evidence author provided updates OR article moved forward
- "Needs peer reviewer" → Evidence peer reviewer was assigned (Airtable record)

## Publication Verification Guidelines

**CRITICAL: Be extremely cautious when determining if an article is published.**

### Source of Truth for Workflow Status

The Airtable **Stage** field is the authoritative source for where an article is in the workflow, NOT the presence of a URL in the "Article Published Link" field.

### When to Mark as RESOLVED vs NEEDS PM MESSAGE

**ONLY mark as RESOLVED if:**
1. The article's current Stage in Airtable has progressed PAST the blocking stage mentioned in the alert
2. There is clear evidence in the Slack channel that the specific issue has been addressed
3. Both Airtable stage AND channel evidence confirm resolution

**ALWAYS mark as NEEDS PM MESSAGE if:**
1. The article Stage is still in the blocking stage (e.g., "Needs Manager Draft Review")
2. The article has been in the blocking stage for multiple days without updates
3. You cannot find clear evidence that the PM has addressed the specific issue

### Common Pitfall: URL Fields

**WARNING: The presence of a URL in "Article Published Link" field does NOT mean the article is published.**

- This field often contains TARGET URLs or PLANNED URLs before publication
- Client-published articles may have URLs set up before content is actually live
- The Stage field must show a published/live status for the article to be truly published

### Verification Checklist

Before marking any article as RESOLVED, verify ALL of the following:

1. Current Airtable Stage is PAST the blocking stage (not stuck in review)
2. Last Stage Change date is recent (within 1-2 days of the alert)
3. Slack channel shows explicit evidence the issue was addressed
4. If claiming "published," the Stage field must indicate publication stage (not review stage)

### Example Scenarios

**INCORRECT - Do NOT mark as resolved:**
- Stage: "Needs Manager Draft Review" (since Nov 26)
- Article Published Link: https://example.com/article
- Reasoning: Stage shows stuck in review, URL doesn't prove it's live

**CORRECT - Mark as NEEDS PM MESSAGE:**
- Stage: "Needs Manager Draft Review" (since Nov 26)
- No recent stage changes
- Action: PM needs to complete the review or update status

**CORRECT - Mark as RESOLVED:**
- Stage: "Published" or "Live"
- Article Published Link: https://example.com/article
- Recent stage change showing progression
- Evidence in channel of publication

## Message Templates

**IMPORTANT: Keep messages short and actionable. Main goal is for PMs to follow up with the article.**

Format: `@[PM Mention] please [specific action] for/on [article-title] ([brief context/urgency])`

Examples:

```
@PM please complete the manager editing approval for `article-title` (waiting 4 days)
@PM please follow up with [Author Name] on `article-title` peer review updates (waiting since Dec 2, invoice due Dec 13)
@PM please get status update from [Editor Name] on `article-title` editing (waiting 10+ days)
@PM please review if all 6 graphics are necessary for `article-title` before final approval
@PM please follow up with author on overdue `article-title` draft (due Dec 4)
@PM please line up graphics for `article-title`
@PM please add the peer reviewer for `article-title`
```

**Key principles:**
- Start with PM mention using their Slack ID
- Use "please [verb]" for clear action
- Include article title in backticks
- Add brief context in parentheses only if it adds urgency/clarity
- Keep total message under 20 words when possible

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