import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';
import { parsePythonFile, generateReplacement, containsTailwindClasses, ClassMatch } from './python-parser';

let outputChannel: vscode.OutputChannel;
let bridgeProcess: { process: any; lastUsed: number } | null = null;

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('Python Tailwind Sorter');

  // Register commands
  const sortClassesCommand = vscode.commands.registerCommand(
    'pythonTailwindSorter.sortClasses',
    () => sortClassesInActiveEditor()
  );

  const sortFileCommand = vscode.commands.registerCommand(
    'pythonTailwindSorter.sortClassesInFile',
    () => sortClassesInActiveEditor()
  );

  // Register format document provider
  const formatProvider = vscode.languages.registerDocumentFormattingEditProvider(
    { scheme: 'file', language: 'python' },
    {
      provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
        return formatDocument(document);
      }
    }
  );

  // Register format on save
  const onSaveHandler = vscode.workspace.onWillSaveTextDocument((event) => {
    const config = vscode.workspace.getConfiguration('pythonTailwindSorter');
    const formatOnSave = config.get<boolean>('formatOnSave', true);
    
    if (formatOnSave && event.document.languageId === 'python') {
      event.waitUntil(formatDocument(event.document));
    }
  });

  context.subscriptions.push(
    sortClassesCommand,
    sortFileCommand,
    formatProvider,
    onSaveHandler,
    outputChannel
  );

  vscode.window.showInformationMessage('Python Tailwind Sorter extension loaded!');
}

export function deactivate() {
  if (outputChannel) {
    outputChannel.dispose();
  }
  if (bridgeProcess?.process) {
    bridgeProcess.process.kill();
    bridgeProcess = null;
  }
}

async function sortClassesInActiveEditor(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active editor found');
    return;
  }

  if (editor.document.languageId !== 'python') {
    vscode.window.showWarningMessage('This command only works with Python files');
    return;
  }

  try {
    const edits = await formatDocument(editor.document);
    if (edits.length === 0) {
      vscode.window.showInformationMessage('No Tailwind classes found to sort');
      return;
    }

    // Capture original content before changes
    const originalContent = editor.document.getText();

    // Apply edits in reverse order to avoid position shifting
    const sortedEdits = edits.sort((a, b) => {
      if (a.range.start.line !== b.range.start.line) {
        return b.range.start.line - a.range.start.line;
      }
      return b.range.start.character - a.range.start.character;
    });
    
    const success = await editor.edit((editBuilder) => {
      sortedEdits.forEach((edit) => {
        editBuilder.replace(edit.range, edit.newText);
      });
    });

    if (success) {
      // Show diff if changes were made
      if (edits.length > 0) {
        await showChangesDiff(editor.document, edits, originalContent);
      }
      vscode.window.showInformationMessage(`Sorted Tailwind classes in ${edits.length} locations`);
    } else {
      vscode.window.showErrorMessage('Failed to apply edits');
    }
  } catch (error) {
    outputChannel.appendLine(`Error: ${error}`);
    vscode.window.showErrorMessage(`Error sorting classes: ${error}`);
  }
}

async function formatDocument(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
  const content = document.getText();
  
  // Quick check if file might contain Tailwind classes
  if (!containsTailwindClasses(content)) {
    return [];
  }

  const config = vscode.workspace.getConfiguration('tailwindClassSorter');
  const customPatterns = config.get<string[]>('classPatterns', []);
  
  // Parse the Python file to find class strings
  const parseResult = parsePythonFile(content, customPatterns);
  
  if (!parseResult.hasMatches) {
    return [];
  }


  try {
    // Get sorted classes for each match
    const sortedResults = await sortClassesUsingBridge(
      parseResult.matches,
      document.fileName
    );

    // Generate text edits, avoiding overlaps
    const edits: vscode.TextEdit[] = [];
    const usedRanges: Set<string> = new Set();
    
    for (const result of sortedResults) {
      const match = parseResult.matches[result.index];
      
      // Only create edit if classes actually changed
      if (result.sorted !== result.original) {
        const replacement = generateReplacement(match, result.sorted);
        const range = new vscode.Range(
          document.positionAt(replacement.start),
          document.positionAt(replacement.end)
        );
        
        // Create a unique key for this range to detect duplicates
        const rangeKey = `${replacement.start}-${replacement.end}`;
        
        if (!usedRanges.has(rangeKey)) {
          usedRanges.add(rangeKey);
          edits.push(vscode.TextEdit.replace(range, replacement.newContent));
        }
      }
    }

    return edits;
  } catch (error) {
    outputChannel.appendLine(`Error sorting classes: ${error}`);
    throw error;
  }
}

function getBridgeProcess() {
  const now = Date.now();
  const PROCESS_TIMEOUT = 30000; // 30 seconds
  
  // Check if existing process is still valid
  if (bridgeProcess && (now - bridgeProcess.lastUsed) < PROCESS_TIMEOUT) {
    bridgeProcess.lastUsed = now;
    return bridgeProcess.process;
  }
  
  // Kill old process if it exists
  if (bridgeProcess?.process) {
    bridgeProcess.process.kill();
  }
  
  // Create new process
  const bridgePath = path.join(__dirname, '..', 'src', 'tailwind-bridge.js');
  const child = spawn('node', [bridgePath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: path.dirname(__dirname)
  });
  
  bridgeProcess = {
    process: child,
    lastUsed: now
  };
  
  return child;
}

async function sortClassesUsingBridge(
  matches: ClassMatch[],
  filePath: string
): Promise<Array<{ original: string; sorted: string; index: number }>> {
  return new Promise((resolve, reject) => {
    const config = vscode.workspace.getConfiguration('pythonTailwindSorter');
    const tailwindConfigPath = config.get<string>('tailwindConfigPath', '');
    const tailwindStylesheet = config.get<string>('tailwindStylesheet', '');
    
    // Prepare input for the bridge
    const input = {
      classes: matches.map(match => ({
        original: match.original,
        index: match.index
      })),
      options: {
        filepath: filePath,
        tailwindConfigPath: tailwindConfigPath || undefined,
        tailwindStylesheet: tailwindStylesheet || undefined,
      }
    };

    const child = getBridgeProcess();
    let stdout = '';
    let stderr = '';
    let resolved = false;

    const cleanup = () => {
      child.stdout.removeAllListeners();
      child.stderr.removeAllListeners();
      child.removeAllListeners('close');
      child.removeAllListeners('error');
    };

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
      
      // Check for complete JSON response
      try {
        if (stdout.includes('\n')) {
          const lines = stdout.split('\n').filter(line => line.trim());
          for (const line of lines) {
            const result = JSON.parse(line);
            if (!resolved) {
              resolved = true;
              cleanup();
              resolve(result);
            }
            return;
          }
        }
      } catch (error) {
        // Not complete JSON yet, continue reading
      }
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', () => {
      if (!resolved) {
        cleanup();
        reject(new Error(`Bridge process failed: ${stderr}`));
      }
    });

    child.on('error', (error: Error) => {
      if (!resolved) {
        cleanup();
        reject(error);
      }
    });

    // Send input to the bridge process
    child.stdin.write(JSON.stringify(input) + '\n');
  });
}

async function showChangesDiff(document: vscode.TextDocument, edits: vscode.TextEdit[], originalContent: string): Promise<void> {
  try {
    
    // Create a summary of changes for the output channel
    let changesSummary = '\n=== Python Tailwind Class Changes ===\n';
    
    // Create a temporary document to get original text at each range
    const originalDoc = await vscode.workspace.openTextDocument({ content: originalContent });
    
    for (const edit of edits) {
      const lineNumber = edit.range.start.line + 1;
      const originalText = originalDoc.getText(edit.range);
      
      changesSummary += `\nLine ${lineNumber}:\n`;
      changesSummary += `- ${originalText}\n`;
      changesSummary += `+ ${edit.newText}\n`;
    }
    
    changesSummary += '\n=== End Changes ===\n';
    
    // Show in output channel
    outputChannel.appendLine(changesSummary);
    outputChannel.show(true); // Show but don't take focus
    
    // Offer to open full diff editor
    const choice = await vscode.window.showInformationMessage(
      `${edits.length} Tailwind class changes applied. View detailed diff?`,
      'View Diff',
      'Dismiss'
    );
    
    if (choice === 'View Diff') {
      await openDiffEditor(document, originalContent);
    }
  } catch (error) {
    outputChannel.appendLine(`Error showing diff: ${error}`);
  }
}

async function openDiffEditor(document: vscode.TextDocument, originalContent: string): Promise<void> {
  try {
    // Create temporary document with original content
    const originalUri = vscode.Uri.parse(`untitled:${document.fileName} (Before)`);
    const modifiedUri = document.uri;
    
    // Write original content to a temporary file
    const tempWorkspaceEdit = new vscode.WorkspaceEdit();
    tempWorkspaceEdit.createFile(originalUri, { ignoreIfExists: true });
    tempWorkspaceEdit.insert(originalUri, new vscode.Position(0, 0), originalContent);
    
    await vscode.workspace.applyEdit(tempWorkspaceEdit);
    
    // Open diff editor
    await vscode.commands.executeCommand(
      'vscode.diff',
      originalUri,
      modifiedUri,
      `${document.fileName} - Python Tailwind Class Sort Diff`,
      { preview: true }
    );
  } catch (error) {
    outputChannel.appendLine(`Error opening diff editor: ${error}`);
    vscode.window.showErrorMessage('Could not open diff editor');
  }
}