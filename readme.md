# Claude AI Assistant for VS Code

A VS Code extension that integrates Claude AI directly into your development environment, providing code assistance, explanations, reviews, and chat functionality.

## Features

- **Interactive Chat Panel**: Chat with Claude directly in VS Code
- **Code Explanation**: Get detailed explanations of selected code
- **Code Review**: Receive suggestions and improvements for your code
- **Test Generation**: Generate unit tests for selected code
- **Context Menu Integration**: Right-click on selected code for quick actions
- **Keyboard Shortcuts**: Quick access via `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac)

## Installation

1. Install the extension from the VS Code marketplace
2. Get your Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
3. Configure the API key in VS Code settings

## Configuration

Open VS Code settings and configure:

- `claude.apiKey`: Your Anthropic API key (required)
- `claude.model`: Claude model to use (default: claude-sonnet-4-20250514)
- `claude.maxTokens`: Maximum tokens for responses (default: 4000)

## Usage

### Chat Panel
- Use `Ctrl+Shift+C` (or `Cmd+Shift+C`) to open the chat panel
- Or use the command palette: "Claude: Open Claude Chat"

### Code Actions
1. Select code in the editor
2. Right-click and choose from:
   - "Explain Selected Code"
   - "Review Selected Code" 
   - "Generate Tests for Selected Code"

### Commands
All commands are available via the command palette (`Ctrl+Shift+P`):
- `Claude: Open Claude Chat`
- `Claude: Explain Selected Code`
- `Claude: Review Selected Code`
- `Claude: Generate Tests for Selected Code`

## Development Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Open in VS Code and press `F5` to launch a new Extension Development Host
4. Configure your API key in the development instance

## Building and Publishing

```bash
# Compile TypeScript
npm run compile

# Package the extension
vsce package

# Publish to marketplace
vsce publish
```

## Requirements

- VS Code 1.74.0 or higher
- Valid Anthropic API key
- Internet connection for API calls

## Privacy and Security

- Your API key is stored locally in VS Code settings
- Code selections are sent to Anthropic's API for processing
- Chat history is not persisted between sessions
- No telemetry or usage data is collected by this extension

## Support

For issues and feature requests, please visit the project repository.

## License

MIT License - see LICENSE file for details.