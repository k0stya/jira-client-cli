# jira-client-cli

A cross-platform CLI client for JIRA.

## Installation

```bash
npm install -g jira-client-cli
```

**Requirements:** Node.js >= 18.0.0

## Quick Start

### Interactive Mode

Start the CLI in interactive mode by running without arguments:

```bash
jira-cli
```

This opens an interactive session where you can run commands:

```
  JIRA CLI - Interactive Mode
  Type "help" for available commands, "exit" to quit.

  No active profile. Run "profile create" to get started.

jira-cli> profile create
? Profile name: work
? JIRA domain: company.atlassian.net
? Email: user@company.com
? API token: ****
✓ Authenticated as John Doe
✓ Profile "work" created and set as active.

jira-cli [work]> issue get PROJ-123
────────────────────────────────────────────────────────
PROJ-123: Fix login button
────────────────────────────────────────────────────────
Type:       Bug
Status:     In Progress
...

jira-cli [work]> exit
Goodbye!
```

### One-Shot Mode

You can also run individual commands directly:

```bash
jira-cli profile create
jira-cli issue get PROJ-123
```

### 1. Create a Profile

First, create a profile with your JIRA credentials:

```bash
jira-cli
# Then in the interactive session:
profile create
```

Or directly:

```bash
jira-cli profile create
```

You'll be prompted for:
- **Profile name**: A name for this profile (e.g., "work", "personal")
- **JIRA domain**: Your JIRA instance (e.g., `company.atlassian.net`)
- **Email**: Your JIRA account email
- **API token**: Your JIRA API token

> **Getting an API token:**
> 1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
> 2. Click "Create API token"
> 3. Give it a label and copy the token

Or create a profile non-interactively:

```bash
jira-cli profile create --name work --domain company.atlassian.net --email user@company.com --token YOUR_TOKEN
```

### 2. Query Issues

Fetch details of a JIRA issue:

```bash
jira-cli issue get PROJ-123
```

Output as JSON:

```bash
jira-cli issue get PROJ-123 --json
```

## Commands

### Profile Management

```bash
# Create a new profile
jira-cli profile create

# List all profiles (* = active)
jira-cli profile list

# Switch to a different profile
jira-cli profile use <name>

# Show profile details
jira-cli profile show [name]

# Delete a profile
jira-cli profile delete <name>
jira-cli profile delete <name> --force  # Skip confirmation
```

### Issue Commands

```bash
# Get issue details
issue get <issue-key>
issue get PROJ-123 --json

# Calculate time in status for issues (outputs CSV)
issue time-in-status "project = PROJ"
issue time-in-status "project = PROJ AND status = Done" --output report.csv
issue time-in-status "assignee = currentUser()" --max-results 200
```

### Session Commands (Interactive Mode)

```bash
help, ?       Show available commands
clear, cls    Clear the screen
exit, quit, q Exit the CLI
```

### Time in Status Report

The `time-in-status` command calculates how long each issue spent in each status and outputs a CSV report with:

- Time per ticket per status (H:MM:SS format)
- Total time per status
- Average time per status
- Median time per status

Example output:
```csv
TICKET ID,To Do,In Progress,Done
PROJ-1,1:30:00,4:15:30,2:00:00
PROJ-2,0:45:00,3:30:15,1:15:45
...
"Total, h",2:15:00,7:45:45,3:15:45
"Average, h",1:07:30,3:52:52,1:37:52
"Median, h",1:07:30,3:52:52,1:37:52
```

## Multiple Profiles

You can manage multiple JIRA accounts:

```bash
# Create profiles
jira-cli profile create --name work
jira-cli profile create --name personal

# List profiles
jira-cli profile list
#   NAME      DOMAIN                     EMAIL
# * work      company.atlassian.net      user@company.com
#   personal  personal.atlassian.net     me@gmail.com

# Switch profiles
jira-cli profile use personal
```

## Configuration

Configuration is stored in a platform-specific location:

| OS | Location |
|----|----------|
| macOS | `~/Library/Preferences/jira-cli-nodejs/config.json` |
| Windows | `%APPDATA%\jira-cli-nodejs\Config\config.json` |
| Linux | `~/.config/jira-cli-nodejs/config.json` |

## Development

```bash
# Clone the repository
git clone https://github.com/k0stya/jira-client-cli.git
cd jira-client-cli

# Install dependencies
npm install

# Build
npm run build

# Run locally
node bin/jira.js --help

# Run tests
npm test

# Link for local development
npm link
jira-cli --help
```

## License

MIT
