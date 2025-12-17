# jira-client-cli

A cross-platform CLI client for JIRA.

## Installation

```bash
npm install -g jira-client-cli
```

**Requirements:** Node.js >= 18.0.0

## Quick Start

### 1. Create a Profile

First, create a profile with your JIRA credentials:

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
jira-cli issue get <issue-key>
jira-cli issue get PROJ-123 --json
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
