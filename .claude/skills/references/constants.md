# Constants Reference

Quick reference for constant values used in auto-management workflows.

## Slack User IDs

### Bots
- **Airtable Bot**: `U03E50KUNN5`

## Slack Channel IDs

### Management Channels
- **Auto-Management Channel**: `C03MBDE9CM8`
- **Auto Project Managers**: `C03CX2CS0S1`
- **Team Project Managers**: `C03CZULS1PV`

## Airtable

### Base and Table IDs
- **Content Base**: `appvRZDyTZafVdfEW`
- **Articles Table**: `tblLKd6kmtCW1txXY`

## Search Parameters

### Auto-Management Follow-Up
- **Lookback Period**: 14 days
- **Batch Size**: 10 messages
- **Required Emoji Pattern**: `:eyes:` + `:hourglass_flowing_sand:` - `:white_check_mark:`
- **Airtable Bot User**: `U03E50KUNN5`

### Weekly Status Update Check
- **Lookback Period**: 5 calendar days
- **Batch Size**: 10 channels
- **Search Terms**: "Weekly Status", "weekly status"
- **Message Template**: `<@PM_SLACK_ID> please post your weekly status update when you get a chance. thanks`

## Usage

These constants should be used consistently across all management skills to avoid hardcoding values.
