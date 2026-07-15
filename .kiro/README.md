# Kiro Configuration for KFMS Project

This directory contains Kiro-specific configuration files that provide AI agents with context and guidelines when working on the KFMS project.

## What Are Steering Files?

**Steering files** are markdown documents that automatically load into the AI agent's context when you start a session. They act as persistent instructions, ensuring consistent behavior across all sessions regardless of which agent you're working with or where you've moved the project folder.

## Available Steering Files

### 1. `fams-project-guidelines.md`
**Purpose**: Core project structure and rules  
**Inclusion**: Automatic (always loaded)

Contains:
- Project structure overview (backend, frontend, mobile)
- Critical rules for location-independent development
- Import rules and patterns
- Database schema reference
- Common pitfalls to avoid
- Emergency fix procedures

**Use this when**: You want agents to understand the overall project architecture.

### 2. `fams-coding-standards.md`
**Purpose**: Code style and best practices  
**Inclusion**: Automatic (always loaded)

Contains:
- Python/FastAPI coding standards
- React/JavaScript best practices
- Security standards (auth, validation)
- Performance optimization patterns
- Testing standards
- Documentation requirements
- Git commit message format

**Use this when**: You want consistent code quality across all contributions.

### 3. `fams-troubleshooting.md`
**Purpose**: Common issues and solutions  
**Inclusion**: Automatic (always loaded)

Contains:
- Quick diagnostic commands
- Common errors with solutions
- Debugging workflows
- Performance issue fixes
- Emergency recovery procedures
- What to include when reporting issues

**Use this when**: Something breaks and you need quick resolution.

## How Steering Files Work

### Automatic Inclusion
All three files use `inclusion: auto` in their frontmatter, meaning they are **automatically loaded** into every Kiro session. Agents will:
- Read these files at the start of each session
- Reference them when making decisions
- Follow the guidelines without needing reminders
- Apply consistent patterns across all work

### Location Independence
Because these guidelines are written to be **path-agnostic**, you can:
- Move the KFMS folder anywhere on your system
- Work from different computers
- Share the project with team members
- Clone to different directories

The steering files use **relative paths and dynamic imports** instead of hardcoded absolute paths.

## How to Use

### Starting a Session
Simply open Kiro in the KFMS project directory. The steering files load automatically:
```
You: "Fix the bug in the authentication flow"
```
The agent will already know:
- Project structure
- Coding standards
- Common authentication issues
- How to test the fix

### Updating Guidelines
When you discover new patterns or issues:

1. **Edit the appropriate steering file**
   - Project structure changes → `fams-project-guidelines.md`
   - New code pattern → `fams-coding-standards.md`
   - New bug fix → `fams-troubleshooting.md`

2. **Changes apply immediately** to new sessions

3. **No need to re-explain** to agents - they'll see the updates

### Manual Reference
If you need to explicitly reference a guideline:
```
You: "Follow the API endpoint pattern from the coding standards"
```

The agent will know exactly which pattern you mean.

## Benefits

### ✅ Consistency
- All agents follow the same rules
- Code style remains uniform
- No need to repeat instructions

### ✅ Knowledge Retention
- Bug fixes are documented
- Solutions persist across sessions
- Team knowledge is preserved

### ✅ Onboarding
- New developers can read the guidelines
- Agents help enforce standards
- Reduces learning curve

### ✅ Portability
- Works regardless of folder location
- No hardcoded paths
- Easy to share project

## Customizing for Your Team

### Adding More Guidelines
Create new `.md` files in `.kiro/steering/` with frontmatter:

```markdown
---
inclusion: auto
---

# Your Custom Guidelines
...
```

### Conditional Inclusion
To load a steering file only when specific files are accessed:

```markdown
---
inclusion: fileMatch
fileMatchPattern: 'backend/app/*.py'
---

# Backend-Specific Rules
...
```

### Manual Inclusion
For guidelines you want to reference explicitly:

```markdown
---
inclusion: manual
---

# Deployment Procedures
...
```

Access with: `#deployment-procedures` in chat

## File Organization

```
.kiro/
├── README.md                        # This file
├── steering/
│   ├── fams-project-guidelines.md   # Project structure & rules
│   ├── fams-coding-standards.md     # Code style & patterns
│   └── fams-troubleshooting.md      # Common issues & fixes
└── hooks/                           # (Future) Automation hooks
```

## Maintenance

### When to Update

**fams-project-guidelines.md**
- New project structure added (e.g., testing directory)
- New critical rule discovered
- Breaking change in dependencies

**fams-coding-standards.md**
- New code pattern established
- Security issue discovered
- Performance optimization found

**fams-troubleshooting.md**
- New bug encountered and fixed
- Emergency procedure added
- Diagnostic command improved

### Best Practices
1. **Keep guidelines current** - Update as you discover issues
2. **Be specific** - Provide exact code examples
3. **Explain why** - Not just what, but why it matters
4. **Link to docs** - Reference official documentation
5. **Include examples** - Show correct and incorrect patterns

## Support

For issues with Kiro steering files:
1. Check the Kiro documentation
2. Verify frontmatter syntax
3. Ensure files are in `.kiro/steering/`
4. Restart Kiro session to reload

---

**These steering files are your project's institutional knowledge.**  
Keep them updated, and your agents will always know how to help.
