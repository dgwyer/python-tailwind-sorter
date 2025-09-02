# Python Tailwind Sorter VS Code Extension

## Project Overview
- **Original name**: python-tailwind-sorter  
- **Renamed to**: python-tailwind-sorter (focused on Python)
- **Purpose**: VS Code extension that sorts Tailwind CSS classes in code files using Tailwind's official ordering
- **Current support**: Python files (Django templates, FastAPI, React-style className, etc.)
- **Future plans**: Expandable to other languages (JavaScript, PHP, Ruby, etc.)

## Project Structure
```
python-tailwind-sorter/
├── .gitignore               # Git ignore (node_modules, dist)
├── .vscode/                 # VS Code debug configuration
│   ├── launch.json         # Debug config for extension development
│   └── tasks.json          # Build tasks
├── src/                     # Extension source code
│   ├── extension.ts        # Main VS Code extension logic
│   ├── python-parser.ts    # Python file parser with regex patterns
│   └── tailwind-bridge.js  # Minimal bridge using official prettier-plugin-tailwindcss
├── LICENSE                 # MIT license
├── README.md              # Extension documentation
├── package.json           # VS Code extension manifest
├── tsconfig.json         # TypeScript configuration
├── webpack.config.cjs     # Webpack build configuration
└── test-file.py         # Sample Python file with Tailwind classes for testing
```

## How It Works
1. **File Analysis** - Parses Python files using regex patterns to find class strings
2. **Class Extraction** - Extracts Tailwind class lists from various contexts
3. **Official Prettier Integration** - Uses official prettier-plugin-tailwindcss directly
4. **Replacement** - Replaces original class strings with sorted versions

## Architecture Details
- **Minimal design**: Direct integration with official prettier-plugin-tailwindcss
- **ES Module bridge** - Clean bridge using Prettier API for class sorting
- **Supports Tailwind 3.x and 4.x** - Full compatibility with latest Tailwind versions
- **VS Code integration** handles format-on-save and manual commands

## Extension Configuration
- **Extension ID**: `python-tailwind-sorter`
- **Commands**: 
  - `pythonTailwindSorter.sortClasses`
  - `pythonTailwindSorter.sortClassesInFile`
- **Settings**: All prefixed with `pythonTailwindSorter.*`
- **Activation**: Currently on Python language files

## Supported Patterns (Python)
The extension detects these patterns:
- `class="..."` (Django/Jinja2 templates)
- `className="..."` (React-style)
- `f'class="{classes}"'` (f-strings)
- `{"class": "..."}` (dictionary literals)  
- `tw("...")` (custom utility functions)

## Current State
- ✅ **Complete rewrite using official prettier-plugin-tailwindcss**
- ✅ **Supports Tailwind 3.x and 4.x** with official class ordering
- ✅ **Minimal architecture** - removed legacy code dependencies
- ✅ **FastHTML support** - cls="" attribute parsing
- ✅ **Overlapping match deduplication** - fixed parsing conflicts
- ✅ **ES Module architecture** - modern JavaScript standards

## Next Steps for Testing
1. **Install dependencies**: `npm install`
2. **Build extension**: `npm run compile`
3. **Test in VS Code**: Press F5 to launch Extension Development Host
4. **Test sorting**: Open test-file.py, save file or use Command Palette "Sort Tailwind Classes"
5. **Monitor output**: Check Output panel > "Python Tailwind Sorter" for logs

## Key Files to Know
- **`package.json`**: VS Code extension manifest with commands, settings, activation events
- **`src/extension.ts`**: Main extension logic, VS Code integration, format-on-save
- **`src/python-parser.ts`**: Regex patterns for finding Tailwind classes in Python
- **`src/tailwind-bridge.js`**: Bridge that calls prettier-plugin sorting logic
- **`test-file.py`**: Sample file with various Tailwind class patterns for testing

## Development Notes
- Extension uses dynamic imports to load prettier-plugin modules
- Bridge handles both CLI mode (args) and VS Code mode (stdin/stdout)
- Parser is designed to be extensible for additional languages
- All original prettier-plugin functionality preserved in legacy-prettier-plugin/

## Conversation Context
- Started with exploration of prettier-plugin-tailwindcss codebase
- Built VS Code extension to bring Tailwind sorting to Python files
- Cleaned up project structure and renamed for broader scope
- Extension ready for testing and potential expansion to other languages