---
name: auto-management-followup
description: Review and resolve auto-management Slack messages that have been acted upon. Use when the user asks to run auto-management follow-up, review auto-management follow-ups, or check auto-management completions. ONLY use in the Inbound Square project context. This is distinct from auto-management updates (which creates new notifications).
---
# Auto-Management Follow-Up

Review Airtable bot messages in `#auto-management` that have been acted upon and mark them as complete when the original issues are resolved.

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

Search for Airtable bot messages from the last 14 days in `#auto-management` (C03MBDE9CM8) that have:

- ✅ :eyes: and :hourglass_flowing_sand: emojis (reviewed and acted upon)
- ❌ NO :white_check_mark: emoji (not yet marked complete)

**Critical: Mark messages as resolved IMMEDIATELY when confirmed, then move to next message. Do not batch.**

## Step 1: Search for Candidate Messages

Use Slack search to find messages with the required emoji pattern:

```
Search Query: "in:#auto-management has::eyes: has::hourglass_flowing_sand: after:<14 days ago>"
Count: 20
Sort: timestamp (newest first)
```

Filter results to identify messages that:

- Have :eyes: emoji ✅
- Have :hourglass_flowing_sand: emoji ✅
- Do NOT have :white_check_mark: emoji ❌
- Are from Airtable bot (U03E50KUNN5)

If no results, exit - nothing to review.

## Step 2: Process Each Message Individually

**IMPORTANT: Process one message at a time. Mark as resolved immediately when confirmed before moving to the next.**

For each qualifying message:

### 2.1 Review the Original Issue

- Note article title and project code
- Identify the specific issue flagged (draft overdue, needs peer reviewer, waiting on author)

### 2.2 Check Response Thread

- Look in the thread of the auto-management message
- Find the message posted to PM's content development channel
- Note what action was requested

### 2.3 Verify PM Follow-Up

Check the project's `#[project]-content-development` channel for resolution evidence within last 7 days:

- "Draft submitted" for overdue drafts
- "Peer reviewer assigned: [name]" for missing peer reviewers
- "Author provided updates" for pending author work
- Status updates showing progress on flagged issue

### 2.4 Verify in Airtable

- Extract Airtable link from auto-management message
- Use Airtable MCP tool to check the record
- Verify if the issue is resolved:
    - Status field changes
    - Assignee updates for peer reviewers
    - Date field updates for submissions
    - Notes indicating resolution

### 2.5 Decision & Immediate Action

**If RESOLVED:**

1. Immediately add :white_check_mark: emoji to the message
2. Immediately remove :hourglass_flowing_sand: emoji from the message
3. Move to next message

**If UNRESOLVED:**

1. Leave message unmarked (no additional emojis)
2. Move to next message

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

## Key Principles

1. **Progressive Processing**: Mark resolved messages immediately, don't batch
2. **Specific Resolution**: Look for evidence the SPECIFIC problem was addressed, not just PM awareness
3. **No New Messages**: This is purely tracking/completion - don't send new PM messages
4. **No Approval Needed**: Mark messages as complete without asking for permission
5. **Move Quickly**: As soon as resolution evidence is found, mark and move on

## Example Workflow

```
Message 1: Review → Evidence found in Airtable → Mark complete immediately → Continue
Message 2: Review → No evidence → Skip → Continue  
Message 3: Review → PM posted update in channel → Mark complete immediately → Continue
Message 4: Review → Still unresolved → Skip → Continue
...
```

## Exception: Xhelal Likaj

Xhelal Likaj peer reviews his own articles. Any messages about his articles not having a different peer reviewer should be marked complete.