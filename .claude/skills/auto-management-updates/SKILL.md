---
name: auto-management-updates
description: Review new auto-management notifications from Airtable bot and send PM messages for unresolved issues. Use when the user asks to run auto-management updates, review auto-management channel, or check new auto-management messages. ONLY use in the Inbound Square project context. This is distinct from auto-management follow-up (which marks existing tracked issues as complete).
---
# Auto-Management Updates

Review new Airtable bot messages in `#auto-management` and notify PMs about unresolved issues requiring action.

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

1. Search for unreviewed Airtable bot messages in `#auto-management` from the last 14 days only
2. Analyze each message and categorize required actions
3. Generate comprehensive summary report
4. Wait for user confirmation
5. Execute all actions (send PM messages, add emojis, post thread links)

**Critical: Always get confirmation before sending any Slack messages.**

## Step 1: Message Discovery

Search `#auto-management` (C03MBDE9CM8) for bot messages from Airtable bot (U03E50KUNN5) without :eyes: emoji.

Use these Slack searches (within last 10 days):

```
1. Article issues: in:#auto-management from:@Airtable "The article" -has::eyes:
2. Draft due dates: in:#auto-management from:@Airtable "The draft" -has::eyes:
3. Outline due dates: in:#auto-management from:@Airtable "The outline" -has::eyes:
```

If all searches return no results, exit - nothing to review.

## Step 2: Batch Processing & Analysis

For each message found:

### 2.1 Extract Information

- Pull Airtable link and review the record
- Identify two-letter project code (e.g., "The article ARTICLE for PROJECT")
- Find corresponding `#PROJECT-content-development` channel (lowercase)
- Get Project Manager's Slack ID from Airtable field "Project Manager's Slack ID (from Projects)"

### 2.2 Check for Resolution

- Look for project updates within last 7 days in content development channel
- Determine if the SPECIFIC PROBLEM is RESOLVED (not just acknowledged)

### 2.3 Categorize Action

**RESOLVED**:

- Evidence shows specific issue is fixed
- Action: Add :eyes: and :white_check_mark: emojis

**NEEDS PM MESSAGE**:

- No evidence of resolution, PM action required
- Action: Send PM message + add :eyes: and :hourglass_flowing_sand: emojis + post link in thread

**SKIP (Monday only)**:

- 3-day overdue messages
- Action: None (see Monday Special Handling section)

## Step 3: Summary Report

Provide comprehensive summary before taking action:

```
AUTO-MANAGEMENT BATCH REVIEW SUMMARY:
Date: [Date]
Total Messages Found: X

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

SUMMARY:
- Resolved: X messages
- PM Messages: X messages  
- Skipped: X messages
- Total Actions: X
```

## Step 4: Confirmation & Execution

**Wait for user confirmation**, then execute all actions:

1. **Send PM Messages**: Post each message to specified content development channel
2. **Update Auto-Management**:
    - For resolved items: Add :eyes: and :white_check_mark:
    - For PM messages sent: Add :eyes: and :hourglass_flowing_sand:
3. **Post Thread Links**: After each PM message, post the message link in the auto-management thread

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

- **Batch Processing**: Collect all recommendations before taking action
- **Single Confirmation**: Get approval for all actions at once
- **Efficient Execution**: Send all messages and update all emojis in sequence
- **Context Management**: Process efficiently to avoid context window overflow
- **PM Slack ID Translation**: Use proper Slack mention format for all PMs