# Figma MCP Server Setup Guide

This repository is configured to use the Figma Model Context Protocol (MCP) server with AI coding assistants like GitHub Copilot, Cursor, or Claude.

## Quick Start

1. **Get a Figma API Key**
   - Go to [Figma Account Settings](https://www.figma.com/settings)
   - Create a personal access token
   - Copy the token

2. **Configure the MCP Server**
   - Edit `.vscode/mcp-settings.json`
   - Replace `YOUR_FIGMA_API_KEY_HERE` with your actual API key
   
   **Or use environment variable (recommended):**
   - Copy `.vscode/mcp-settings.env.example.json` to `.vscode/mcp-settings.json`
   - Set the `FIGMA_API_KEY` environment variable in your system

3. **Restart Your IDE**
   - Restart VS Code, Cursor, or your AI-powered IDE
   - The Figma MCP server should now be available

4. **Test It**
   - Open your AI chat
   - Paste a Figma design URL
   - Ask your AI to implement or analyze the design

## Detailed Instructions

See [.vscode/README.md](.vscode/README.md) for comprehensive setup instructions, troubleshooting, and usage examples.

## Security

⚠️ **Important:** Never commit your Figma API key to version control!

- Use environment variables for API keys
- Consider adding `.vscode/mcp-settings.json` to your local `.gitignore` if it contains secrets
- Regularly rotate your API tokens

## What This Enables

With the Figma MCP server configured, your AI assistant can:
- Read Figma designs directly from URLs
- Implement UI components matching Figma designs
- Extract design tokens (colors, spacing, typography)
- Analyze design specifications
- Generate accurate code from visual designs

## Resources

- [Figma Developer MCP Documentation](https://www.framelink.ai/docs/quickstart)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Figma API Documentation](https://www.figma.com/developers/api)
