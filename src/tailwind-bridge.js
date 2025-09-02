/**
 * Minimal bridge using official prettier-plugin-tailwindcss
 * Supports both Tailwind 3.x and 4.x
 */

const prettier = require('prettier');

/**
 * Sort Tailwind classes using official prettier plugin
 * @param {string} classString - The string of classes to sort
 * @param {Object} options - Configuration options
 * @param {string} options.tailwindConfigPath - Path to tailwind config
 * @param {string} options.filepath - Path to the file being processed
 * @returns {Promise<string>} Sorted class string
 */
async function sortTailwindClasses(classString, options = {}) {
  try {
    // Create a minimal HTML template with the class string
    const htmlTemplate = `<div class="${classString}"></div>`;
    
    // Configure prettier with tailwindcss plugin
    const prettierConfig = {
      parser: 'html',
      plugins: ['prettier-plugin-tailwindcss'],
      printWidth: 10000, // Prevent wrapping
      htmlWhitespaceSensitivity: 'ignore',
    };

    // Add tailwind config path if provided
    if (options.tailwindConfigPath) {
      prettierConfig.tailwindConfig = options.tailwindConfigPath;
    }

    // Add CSS file for Tailwind 4.x support
    if (options.tailwindStylesheet) {
      prettierConfig.tailwindStylesheet = options.tailwindStylesheet;
    }

    // Format the HTML to sort classes
    const formatted = await prettier.format(htmlTemplate, prettierConfig);
    
    // Extract the sorted classes from the formatted HTML
    const match = formatted.match(/class="([^"]*)"/);
    return match ? match[1] : classString;
    
  } catch (error) {
    console.error('Error sorting Tailwind classes:', error);
    // Return original string if sorting fails
    return classString;
  }
}

// Handle VS Code extension input via stdin  
if (process.argv[1] && process.argv[1].endsWith('tailwind-bridge.js')) {
  const args = process.argv.slice(2);
  
  // CLI mode: node tailwind-bridge.js "classes" [configPath]
  if (args.length > 0) {
    const classString = args[0];
    const options = {
      tailwindConfigPath: args[1] || undefined,
    };
    
    sortTailwindClasses(classString, options)
      .then(sorted => {
        console.log(sorted);
      })
      .catch(error => {
        console.error('Error:', error);
        process.exit(1);
      });
  } else {
    // Persistent mode - handle multiple requests via stdin
    let buffer = '';
    
    process.stdin.setEncoding('utf8');
    
    const processRequest = async (inputData) => {
      try {
        const input = JSON.parse(inputData);
        const { classes, options } = input;
        
        const results = [];
        
        for (const { original, index } of classes) {
          const sorted = await sortTailwindClasses(original, options);
          results.push({ original, sorted, index });
        }
        
        // Output result as single line JSON
        console.log(JSON.stringify(results));
      } catch (error) {
        console.error('Error processing input:', error.message);
      }
    };
    
    process.stdin.on('data', (chunk) => {
      buffer += chunk;
      
      // Process complete requests (terminated by newline)
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim()) {
          processRequest(line.trim());
        }
      }
    });
    
    // Keep process alive
    process.stdin.resume();
  }
}

module.exports = { sortTailwindClasses };