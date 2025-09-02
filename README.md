# Python Tailwind Sorter

A VS Code extension that automatically sorts Tailwind CSS classes in **Python files** using Tailwind's official class ordering from prettier-plugin-tailwindcss.

> **Python-focused extension:** For JavaScript/JSX/TypeScript files, please use the [official Prettier Tailwind plugin](https://github.com/tailwindlabs/prettier-plugin-tailwindcss).

## Features

- **Python file support** - Sorts Tailwind classes in `.py` files only
- **Automatic sorting on save** - Sorts classes whenever you save Python files
- **Manual sorting commands** - Sort classes on demand via Command Palette  
- **Visual diff feedback** - Shows before/after changes with optional side-by-side diff view
- **Multiple Python patterns** - Django templates, FastHTML, FastAPI, React-style className, f-strings, dictionaries, and utility functions
- **Official Tailwind ordering** - Uses the same sorting logic as prettier-plugin-tailwindcss
- **Tailwind 3.x & 4.x support** - Full compatibility with latest Tailwind versions
- **Optimized performance** - Process reuse for faster sorting on multiple operations
- **No external dependencies** - Self-contained extension with bundled dependencies

## Supported Patterns

The extension automatically detects and sorts Tailwind classes in these contexts:

```python
# FastHTML components (cls attribute)
H1("Title", cls="text-4xl font-bold text-center mb-8 text-blue-600")

# Django/Jinja2 templates
html = '<div class="bg-white p-4 rounded-lg shadow-md">Content</div>'

# React-style className  
component = '<div className="flex items-center space-x-4">Content</div>'

# F-string templates
template = f'<div class="container mx-auto {extra_classes}">Content</div>'

# Dictionary/object literals
styles = {"class": "grid grid-cols-1 md:grid-cols-2 gap-4"}

# Custom utility functions
button_classes = tw("px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600")
```

## Installation

1. Open VS Code/Cursor
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Python Tailwind Sorter"
4. Click Install

## Configuration

Configure the extension through VS Code settings:

```json
{
  "pythonTailwindSorter.formatOnSave": true,
  "pythonTailwindSorter.tailwindConfigPath": "./tailwind.config.js",
  "pythonTailwindSorter.tailwindStylesheet": "./src/styles/tailwind.css",
  "pythonTailwindSorter.filePatterns": ["**/*.py"],
  "pythonTailwindSorter.classPatterns": [
    "class\\\\s*=\\\\s*[\"']([^\"']*)[\"']",
    "cls\\\\s*=\\\\s*[\"']([^\"']*)[\"']",
    "className\\\\s*=\\\\s*[\"']([^\"']*)[\"']"
  ]
}
```

### Settings

- `formatOnSave` - Automatically sort classes when saving Python files (default: true)
- `tailwindConfigPath` - Path to your Tailwind config file (for custom configurations)
- `tailwindStylesheet` - Path to your Tailwind CSS file (**required for Tailwind 4.x support**)
- `filePatterns` - File patterns to process (default: ["**/*.py"])  
- `classPatterns` - Custom regex patterns to find class strings

## Commands

- `Python Tailwind Sorter: Sort Classes` - Sort classes in the active editor
- `Python Tailwind Sorter: Sort Classes in File` - Same as above

## Visual Diff Feedback

When classes are sorted, the extension provides visual feedback showing exactly what changed:

1. **Output Panel Summary** - Shows line-by-line before/after comparison in the "Python Tailwind Sorter" output channel
2. **Optional Full Diff View** - Click "View Diff" to open VS Code's side-by-side diff editor showing complete changes

This makes it easy to see exactly how your Tailwind classes were reordered and ensures transparency in the sorting process.

## How It Works

1. **Python File Analysis** - Scans `.py` files using optimized regex patterns to find Tailwind class strings
2. **Class Extraction** - Extracts classes from Django templates, FastHTML components, f-strings, dictionaries, and utility functions
3. **Official Prettier Integration** - Uses prettier-plugin-tailwindcss via persistent Node.js bridge for authentic Tailwind ordering
4. **Optimized Performance** - Process reuse eliminates startup overhead for multiple operations
5. **Smart Replacement** - Replaces only changed class strings while preserving surrounding syntax

## Tailwind Version Support

### Tailwind 3.x
Works automatically with standard Tailwind installations. No additional configuration required.

### Tailwind 4.x
Requires the `tailwindStylesheet` setting to point to your CSS file:

```json
{
  "pythonTailwindSorter.tailwindStylesheet": "./app.css"
}
```

**Compatible with:**
- Tailwind 4.x npm package
- `@tailwindcss/browser` CDN
- Custom CSS configurations

## Development

### Building from Source

```bash
npm install
npm run compile
```

### Testing

Open the project in VS Code and press F5 to launch the Extension Development Host.

### Project Structure

```
src/
├── extension.ts          # Main VS Code extension logic and bridge management
├── python-parser.ts      # Python file parsing with regex patterns and deduplication  
├── tailwind-bridge.js    # Persistent Node.js bridge using official prettier-plugin
dist/                     # Compiled extension bundle
test-file-original.py     # Sample Python file for testing
```

## Language Support

### ✅ Supported
- **Python (.py files)** - Full support for all Python Tailwind patterns

### ❌ Not Supported (Use Official Plugin Instead)
- **JavaScript/JSX** → Use [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
- **TypeScript/TSX** → Use [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
- **Vue.js** → Use [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
- **Svelte** → Use [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)

## Requirements

- **VS Code 1.74.0 or higher**
- **Node.js** (bundled dependencies, no separate installation required)

## Known Limitations

- **Python files only** - Intentionally focused scope to avoid conflicts
- **String literals only** - Does not process dynamically generated class names
- **Static analysis** - Cannot handle complex runtime class logic

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
