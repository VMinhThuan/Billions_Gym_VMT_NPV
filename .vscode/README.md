# Figma MCP Server Configuration for VS Code

This directory contains the configuration for the Figma Model Context Protocol (MCP) server, which allows AI-powered coding assistants to access your Figma design data.

## What is MCP?

The Model Context Protocol (MCP) is a standard that enables AI coding tools (like GitHub Copilot, Cursor, etc.) to access external data sources and tools. The Figma MCP server specifically allows your AI assistant to read Figma designs and use them to implement UI components accurately.

## Setup Instructions

### 1. Get Your Figma API Key

1. Log in to your Figma account
2. Go to your account settings
3. Navigate to the "Personal Access Tokens" section
4. Click "Create a new personal access token"
5. Give it a descriptive name (e.g., "MCP Server Access")
6. Copy the generated token

For detailed instructions, see: [Figma API Token Documentation](https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens)

### 2. Configure the MCP Server

The MCP server configuration is located in `.vscode/mcp-settings.json`.

**Important:** Replace `YOUR_FIGMA_API_KEY_HERE` with your actual Figma API key.

**Platform-Specific Configurations:**
- **macOS/Linux**: Use `mcp-settings.json` (default)
- **Windows**: Use `mcp-settings.windows.json` or modify the default configuration
- **Environment Variables**: Use `mcp-settings.env.example.json` (recommended for all platforms)

You have multiple options to set your API key:

#### Option A: Direct Configuration (Simple but less secure)

Edit `.vscode/mcp-settings.json` and replace the placeholder:

```json
{
  "mcpServers": {
    "Framelink Figma MCP": {
      "command": "npx",
      "args": [
        "-y",
        "figma-developer-mcp",
        "--figma-api-key=YOUR_ACTUAL_FIGMA_API_KEY",
        "--stdio"
      ]
    }
  }
}
```

⚠️ **Warning:** If you use this method, make sure not to commit your API key to version control!

#### Option B: Windows Configuration

If you're on Windows, copy or rename `.vscode/mcp-settings.windows.json` to `.vscode/mcp-settings.json`:

```json
{
  "mcpServers": {
    "Framelink Figma MCP": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "figma-developer-mcp",
        "--figma-api-key=YOUR_ACTUAL_FIGMA_API_KEY",
        "--stdio"
      ]
    }
  }
}
```

#### Option C: Environment Variable (Recommended)

Instead of putting the API key directly in the config file, use an environment variable:

1. Edit `.vscode/mcp-settings.json` to use an environment variable:

```json
{
  "mcpServers": {
    "Framelink Figma MCP": {
      "command": "npx",
      "args": [
        "-y",
        "figma-developer-mcp",
        "--stdio"
      ],
      "env": {
        "FIGMA_API_KEY": "YOUR_ACTUAL_FIGMA_API_KEY"
      }
    }
  }
}
```

2. Or set the environment variable in your system:
   - **Linux/macOS:** Add to `~/.bashrc` or `~/.zshrc`:
     ```bash
     export FIGMA_API_KEY="your_api_key_here"
     ```
   - **Windows:** Set in System Properties > Environment Variables

### 3. Install Node.js

The Figma MCP server requires Node.js. If you don't have it installed:

- Download from [nodejs.org](https://nodejs.org/)
- Or use a version manager like [nvm](https://github.com/nvm-sh/nvm)

### 4. Configure Your IDE

The configuration works with various AI-powered IDEs:

#### For Cursor IDE

Cursor natively supports MCP servers. The configuration should be automatically detected from `.vscode/mcp-settings.json`.

#### For VS Code with GitHub Copilot

If you're using VS Code with GitHub Copilot, you may need to use a Copilot extension that supports MCP servers, or configure the MCP server in your VS Code settings.

#### For Claude Desktop or Other MCP Clients

Copy the configuration to your MCP client's config file (usually in your home directory).

### 5. Test the Configuration

1. Restart your IDE
2. Open an AI chat or agent mode
3. Paste a Figma file URL (e.g., `https://www.figma.com/file/...`)
4. Ask your AI assistant to analyze or implement the design
5. The AI should be able to access the Figma design data through the MCP server

## How to Use

Once configured, you can:

1. **Share Figma Links:** Paste a Figma file, frame, or component URL in your AI chat
2. **Request Implementation:** Ask the AI to implement the design in your framework of choice
3. **Get Design Details:** Query specific design information like colors, spacing, typography, etc.

### Example Prompts

- "Implement this Figma design as a React component: [Figma URL]"
- "What are the color tokens used in this Figma file: [Figma URL]"
- "Create a CSS stylesheet matching this Figma design: [Figma URL]"
- "Extract the layout grid specifications from: [Figma URL]"

## Troubleshooting

### Server Won't Start

- Verify Node.js is installed: `node --version`
- Check your Figma API key is valid
- Ensure you have internet connectivity
- Try running the command manually: `npx -y figma-developer-mcp --figma-api-key=YOUR_KEY --stdio`

### API Key Errors

- Double-check your Figma API key is copied correctly
- Verify the token hasn't expired
- Make sure you have access to the Figma files you're trying to read

### Package Not Found

If you see "404 Not Found" for `@modelcontextprotocol/server-figma`, note that the correct package name is `figma-developer-mcp` (not `@modelcontextprotocol/server-figma`).

## Security Notes

- **Never commit your API key** to version control
- Consider adding `.vscode/mcp-settings.json` to `.gitignore` if it contains sensitive data
- Use environment variables for API keys in shared repositories
- Regularly rotate your Figma API tokens

## Resources

- [Figma Developer MCP Package](https://www.npmjs.com/package/figma-developer-mcp)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Framelink Documentation](https://www.framelink.ai/docs/quickstart)
- [Figma API Documentation](https://www.figma.com/developers/api)

## Version

This configuration uses `figma-developer-mcp` version 0.6.4 or later.

## Support

For issues with:
- The MCP server itself: [Figma Context MCP GitHub](https://github.com/GLips/Figma-Context-MCP)
- This repository: Create an issue in the repository
- Figma API: [Figma Developer Support](https://www.figma.com/developers/api)
