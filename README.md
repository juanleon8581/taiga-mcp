# taiga-mcp

MCP server for the [Taiga](https://taiga.io) project management API. Lets AI assistants (Claude, etc.) manage projects, issues, user stories, tasks, epics, sprints, wiki pages, and more through natural language.

## Requirements

- Node.js 18+
- A running Taiga instance (cloud or self-hosted)
- Claude Code, Claude Desktop, or any MCP-compatible client

## Installation

### Option A — via npx (recommended)

No cloning or building required. Run once:

```bash
claude mcp add taiga -s user \
  -e TAIGA_URL=https://your-taiga-instance.com \
  -e TAIGA_USERNAME=your_username \
  -e TAIGA_PASSWORD=your_password \
  -- npx -y taiga-mcp
```

### Option B — from source

```bash
git clone https://github.com/YOUR_USER/taiga-mcp
cd taiga-mcp
npm install && npm run build
```

Then register with Claude Code:

```bash
claude mcp add taiga -s user \
  -e TAIGA_URL=https://your-taiga-instance.com \
  -e TAIGA_USERNAME=your_username \
  -e TAIGA_PASSWORD=your_password \
  -- node /absolute/path/to/taiga-mcp/dist/index.js
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "taiga": {
      "command": "npx",
      "args": ["-y", "taiga-mcp"],
      "env": {
        "TAIGA_URL": "https://your-taiga-instance.com",
        "TAIGA_USERNAME": "your_username",
        "TAIGA_PASSWORD": "your_password"
      }
    }
  }
}
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `TAIGA_URL` | Yes | Base URL of your Taiga instance (no trailing slash) |
| `TAIGA_USERNAME` | Yes | Taiga username or email |
| `TAIGA_PASSWORD` | Yes | Taiga password |

## Authentication

On startup the server logs in with your credentials and stores the JWT access token in memory. On token expiry (401), it automatically refreshes using the refresh token. If the refresh token also expires, it re-logs in with your credentials. Credentials are never sent more than necessary.

## Available tools

### Projects
| Tool | Description |
|---|---|
| `list_projects` | List all accessible projects |
| `get_project` | Get project details by ID or slug |
| `create_project` | Create a new project |
| `update_project` | Update project settings (name, description, visibility, etc.) |

### Issues
| Tool | Description |
|---|---|
| `list_issues` | List issues with optional filters |
| `get_issue` | Get issue details |
| `create_issue` | Create a new issue |
| `update_issue` | Update status, assignee, description, etc. |

### User Stories
| Tool | Description |
|---|---|
| `list_userstories` | List user stories, filter by sprint |
| `get_userstory` | Get user story details |
| `create_userstory` | Create a user story |
| `update_userstory` | Update a user story |
| `bulk_create_userstories` | Create multiple user stories at once |

### Tasks
| Tool | Description |
|---|---|
| `list_tasks` | List tasks, filter by US or sprint |
| `create_task` | Create a task |
| `update_task` | Update a task |

### Milestones / Sprints
| Tool | Description |
|---|---|
| `list_milestones` | List sprints |
| `get_milestone` | Get sprint details |
| `create_milestone` | Create a new sprint/milestone |
| `update_milestone` | Update sprint name, dates, or close it |
| `get_milestone_stats` | Burndown and progress stats |

### Epics
| Tool | Description |
|---|---|
| `list_epics` | List epics |
| `get_epic` | Get epic details |
| `create_epic` | Create an epic |
| `update_epic` | Update an epic |
| `list_epic_userstories` | List user stories linked to an epic |
| `link_userstory_to_epic` | Link a user story to an epic |
| `unlink_userstory_from_epic` | Remove the link |

### Roles
| Tool | Description |
|---|---|
| `list_roles` | List all roles in a project (needed for story points) |
| `get_role` | Get role details including permissions |
| `create_role` | Create a new role in a project |
| `update_role` | Update role name, order, or permissions |
| `delete_role` | Delete a role from a project |

### Members & Lookups
| Tool | Description |
|---|---|
| `get_me` | Get the authenticated user |
| `list_members` | List project members with user IDs |
| `add_member` | Add a user to a project by email (role defaults to first project role) |
| `list_issue_statuses` | Issue status IDs for a project |
| `list_userstory_statuses` | User story status IDs |
| `list_task_statuses` | Task status IDs |
| `list_priorities` | Priority IDs |
| `list_severities` | Severity IDs |
| `list_issue_types` | Issue type IDs |
| `list_tags` | Tags with colors |

### Comments & History
| Tool | Description |
|---|---|
| `add_comment` | Add a comment to any object |
| `get_history` | Get activity history and comments |

### Search
| Tool | Description |
|---|---|
| `search` | Full-text search across issues, US, tasks, wiki, epics |

### Wiki
| Tool | Description |
|---|---|
| `list_wiki_pages` | List wiki pages |
| `get_wiki_page` | Get page content |
| `create_wiki_page` | Create a wiki page |
| `update_wiki_page` | Update a wiki page |
| `delete_wiki_page` | Delete a wiki page |

### Delete
| Tool | Description |
|---|---|
| `delete_issue` | Delete an issue permanently |
| `delete_userstory` | Delete a user story permanently |
| `delete_task` | Delete a task permanently |
| `delete_epic` | Delete an epic permanently |
| `delete_milestone` | Delete a milestone permanently |

## Verify connection

```bash
claude mcp list
# taiga: node ... - ✔ Connected
```

## Update (npx install)

npx always pulls the latest published version. No action needed.

## Update (source install)

```bash
cd taiga-mcp
git pull
npm install && npm run build
```

## License

MIT
