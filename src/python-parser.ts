/**
 * Python file parser for extracting and replacing Tailwind class strings
 */

export interface ClassMatch {
  original: string;
  classes: string;
  start: number;
  end: number;
  fullMatch: string;
  quote: string;
  index: number;
}

export interface ParseResult {
  matches: ClassMatch[];
  hasMatches: boolean;
}

/**
 * Default patterns for finding class strings in Python files
 */
const DEFAULT_PATTERNS = [
  // Django/Jinja2 templates: class="..."
  /class\s*=\s*["']([^"']*?)["']/g,
  
  // React-style: className="..."
  /className\s*=\s*["']([^"']*?)["']/g,
  
  // FastHTML: cls="..."
  /cls\s*=\s*["']([^"']*?)["']/g,
  
  // FastAPI/Starlette templates
  /class_\s*=\s*["']([^"']*?)["']/g,
  
  // f-strings with class attributes: f'class="{classes}"'
  /f?["'].*?class\s*=\s*["']([^"']*?)["'].*?["']/g,
  
  // Template literals with class: `class="${classes}"`
  /`[^`]*?class\s*=\s*["']([^"']*?)["'][^`]*?`/g,
  
  // Dictionary/object literals: {"class": "..."}
  /["']class["']\s*:\s*["']([^"']*?)["']/g,
  
  // Tailwind utility functions: tw("...")
  /tw\s*\(\s*["']([^"']*?)["']\s*\)/g,
  
  // CSS class utilities: css_class("...")
  /css_class\s*\(\s*["']([^"']*?)["']\s*\)/g,
];

/**
 * Parse Python file content to find Tailwind class strings
 */
export function parsePythonFile(
  content: string,
  customPatterns: string[] = []
): ParseResult {
  const matches: ClassMatch[] = [];
  let matchIndex = 0;
  
  // Combine default patterns with custom ones
  const patterns = [...DEFAULT_PATTERNS];
  
  // Add custom patterns from configuration
  for (const patternStr of customPatterns) {
    try {
      patterns.push(new RegExp(patternStr, 'g'));
    } catch (error) {
      console.warn(`Invalid regex pattern: ${patternStr}`, error);
    }
  }
  
  // Find all matches across all patterns
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const classes = match[1];
      const start = match.index;
      const end = start + fullMatch.length;
      
      // Skip if classes string is empty or only whitespace
      if (!classes || !classes.trim()) {
        continue;
      }
      
      // Determine quote type used
      const quote = fullMatch.includes('"') ? '"' : "'";
      
      matches.push({
        original: classes,
        classes: classes.trim(),
        start,
        end,
        fullMatch,
        quote,
        index: matchIndex++,
      });
    }
    
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
  }
  
  // Sort matches by position (start index)
  matches.sort((a, b) => a.start - b.start);
  
  // Remove overlapping matches - keep the more specific (smaller range) match
  const deduplicatedMatches: ClassMatch[] = [];
  
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    let isOverlapping = false;
    
    // Check if this match overlaps with any already accepted match
    for (const accepted of deduplicatedMatches) {
      if (
        (current.start >= accepted.start && current.start < accepted.end) ||
        (current.end > accepted.start && current.end <= accepted.end) ||
        (current.start <= accepted.start && current.end >= accepted.end)
      ) {
        // Choose the more specific match (smaller range)
        const currentRange = current.end - current.start;
        const acceptedRange = accepted.end - accepted.start;
        
        if (currentRange < acceptedRange) {
          // Replace the accepted match with the current one
          const acceptedIndex = deduplicatedMatches.indexOf(accepted);
          deduplicatedMatches[acceptedIndex] = current;
        }
        isOverlapping = true;
        break;
      }
    }
    
    if (!isOverlapping) {
      deduplicatedMatches.push(current);
    }
  }
  
  // Re-index after deduplication
  deduplicatedMatches.forEach((match, index) => {
    match.index = index;
  });
  
  return {
    matches: deduplicatedMatches,
    hasMatches: deduplicatedMatches.length > 0,
  };
}


/**
 * Generate replacement content for a class match with sorted classes
 */
export function generateReplacement(
  match: ClassMatch,
  sortedClasses: string
): { start: number; end: number; newContent: string } {
  // Replace just the class content while preserving the surrounding syntax
  const before = match.fullMatch.substring(0, match.fullMatch.indexOf(match.original));
  const after = match.fullMatch.substring(
    match.fullMatch.indexOf(match.original) + match.original.length
  );
  
  return {
    start: match.start,
    end: match.end,
    newContent: before + sortedClasses + after,
  };
}

/**
 * Quick check if file content likely contains Tailwind classes
 */
export function containsTailwindClasses(content: string): boolean {
  // Quick heuristic checks for common Tailwind patterns
  const tailwindIndicators = [
    /\b(?:flex|grid|p-\d+|m-\d+|text-\w+|bg-\w+|border-\w+)\b/,
    /\b(?:hover|focus|active|disabled):/,
    /\b(?:sm|md|lg|xl|2xl):/,
    /\b(?:w-\d+|h-\d+|max-w-\w+|min-h-\w+)\b/,
  ];
  
  return tailwindIndicators.some(pattern => pattern.test(content));
}