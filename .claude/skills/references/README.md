# Shared Reference Data

This folder contains reference data shared by both auto-management skills to reduce redundant MCP lookups.

## Files

### slack-channels.md
Maps project codes to their Slack content-development channel IDs.
- **Use when**: You need to post to a project's content-development channel
- **Avoids**: Searching Slack channels API for channel IDs

### project-managers.md
Maps PM names to their Slack user IDs and Airtable record IDs.
- **Use when**: You need to mention a PM in Slack or look up their info
- **Avoids**: Searching Slack users API or Airtable People table

### airtable-structure.md
Contains base ID, table ID, and field IDs for the Airtable Content base.
- **Use when**: You need to query or update Airtable records
- **Avoids**: Calling list_bases, list_tables, or describe_table repeatedly

### constants.md
Contains constant values like bot user IDs and channel IDs.
- **Use when**: You need standard IDs used across workflows
- **Avoids**: Hardcoding values in multiple places

## Usage

Both `auto-management-followup` and `auto-management-updates` skills reference these files. Sub-agents should be instructed to read the relevant reference file before making MCP calls.

## Maintenance

Update these files when:
- New projects are added (add to slack-channels.md)
- PMs change (update project-managers.md)
- Airtable schema changes (update airtable-structure.md)
- New constants are identified (add to constants.md)
