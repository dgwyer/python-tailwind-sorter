# Changelog

All notable changes to the Python Tailwind Sorter extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-09-02

### Added
- Initial release of Python Tailwind Sorter extension
- **Python file support** - Sorts Tailwind classes in `.py` files only
- **Automatic sorting on save** - Sorts classes whenever you save Python files
- **Manual sorting commands** - Sort classes on demand via Command Palette
- **Visual diff feedback** - Shows before/after changes with optional side-by-side diff view
- **Multiple Python patterns support**:
  - Django templates: `class="..."`
  - FastHTML components: `cls="..."`
  - React-style className: `className="..."`
  - F-strings: `f'class="{classes}"'`
  - Dictionary literals: `{"class": "..."}`
  - Custom utility functions: `tw("...")`
- **Official Tailwind ordering** - Uses prettier-plugin-tailwindcss for authentic sorting
- **Tailwind 3.x & 4.x support** - Full compatibility with latest Tailwind versions
- **Optimized performance** - Process reuse for faster sorting on multiple operations
- **No external dependencies** - Self-contained extension with bundled dependencies

### Configuration Options
- `formatOnSave` - Automatically sort classes when saving Python files (default: true)
- `tailwindConfigPath` - Path to your Tailwind config file
- `tailwindStylesheet` - Path to your Tailwind CSS file (required for Tailwind 4.x support)
- `filePatterns` - File patterns to process (default: ["**/*.py"])
- `classPatterns` - Custom regex patterns to find class strings

### Commands
- `Python Tailwind Sorter: Sort Classes` - Sort classes in the active editor
- `Python Tailwind Sorter: Sort Classes in File` - Same as above

### Technical Features
- Persistent Node.js bridge for performance optimization
- Deduplication logic to handle overlapping class patterns
- Integration with VS Code's diff viewer for change visualization
- Comprehensive error handling and logging via output channel

### Notes
- **Python-focused extension** - For JavaScript/JSX/TypeScript files, use the [official Prettier Tailwind plugin](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
- Requires VS Code 1.74.0 or higher
- Compatible with Tailwind 4.x npm package and `@tailwindcss/browser` CDN