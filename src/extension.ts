import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = vscode.workspace.getConfiguration('vantageUefi').get('model') || "qwen2.5-coder:7b";
const SYSTEM_PROMPT = `You are the VantageUEFI-AI engine. Your perspective is that of a Senior BIOS Architect. Always evaluate if the code meets modern UEFI 2.10 standards and leverages existing EDK II Library resources over custom implementations.

You are a Principal Firmware Architect specializing in Modern EDK II (Project Mu / TianoCore). 

Your goal is to review code through the lens of portability and silicon-agnostic design. 
Focus on:
1. **Library Over Invention**: Identify logic that can be replaced by standard EDK II LibraryClasses. **PRIORITIZE LibraryClasses from MdePkg and MdeModulePkg** such as BaseLib, MemoryAllocationLib, PrintLib, PcdLib, UefiLib, UefiBootServicesTableLib, UefiRuntimeServicesTableLib, DevicePathLib, DxeServicesTableLib.
2. **Silicon Agnosticism**: Detect hardware-specific hardcoding. Suggest using Industry Standard Protocols (e.g., PciIo, DevicePath) instead of direct Register access where possible.
3. **Modern EDK II Standards**: Ensure use of Safestring functions (StrCpyS, UnicodeSPrint) and modern Status handling.
4. **EDK II Module Design**: For DSC/DEC/FDF, check for proper LibraryInstance mapping and PCD utilization to ensure the module is configurable across different platforms.

**CRITICAL FOR .C FILES**: When analyzing C source code, if you detect missing Library includes that could simplify the code, you MUST:
- Explicitly suggest the header file to include (e.g., #include <Library/BaseLib.h>)
- Provide the exact LibraryClass name (e.g., BaseLib, MemoryAllocationLib)
- Show how the existing code can be replaced with the Library function
- Reference that these are standard EDK II LibraryClasses from MdePkg/MdeModulePkg

Analysis Output:
- **Code Refactoring**: Suggest specific EDK II Library functions to replace custom logic, always include the required header and LibraryClass.
- **Missing Library Suggestions**: For .c files, explicitly call out missing #include statements and the corresponding LibraryClass.
- **Portability Warning**: Highlight code that will break on different CPUs or Chipsets.
- **Security & Stability**: Monitor for Null pointers and SMM-safety.

Always wrap code in \`\`\`c ... \`\`\` blocks.`;

async function findAndReadHeaderFiles(filePath: string): Promise<string> {
    const headerContent: string[] = [];
    const fileName = path.basename(filePath, '.c');
    const dir = path.dirname(filePath);
    
    try {
        // Look for .h file with same name (priority)
        const matchingHeader = path.join(dir, `${fileName}.h`);
        if (fs.existsSync(matchingHeader)) {
            console.log(`Found matching header: ${matchingHeader}`);
            const content = fs.readFileSync(matchingHeader, 'utf8');
            headerContent.push(content);
        }
        
        // Scan all .h files in the directory
        try {
            const files = fs.readdirSync(dir);
            const hFiles = files.filter(file => file.endsWith('.h') && file !== `${fileName}.h`);
            
            for (const hFile of hFiles) {
                const hFilePath = path.join(dir, hFile);
                console.log(`Found additional header: ${hFilePath}`);
                const content = fs.readFileSync(hFilePath, 'utf8');
                headerContent.push(content);
            }
        } catch (dirError) {
            console.error('Error reading directory:', dirError);
        }
        
        return headerContent.join('\n\n');
    } catch (error) {
        console.error('Error reading header files:', error);
        return '';
    }
}

class UEFIAnalysisPanel {
    public static currentPanel: UEFIAnalysisPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, code: string, analysis: string) {
        console.log("Creating or showing UEFI Analysis Panel");
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : vscode.ViewColumn.One;

        if (UEFIAnalysisPanel.currentPanel) {
            console.log("Reusing existing panel");
            UEFIAnalysisPanel.currentPanel._panel.reveal(column);
            UEFIAnalysisPanel.currentPanel._updateContent(code, analysis);
            return;
        }

        console.log("Creating new webview panel");
        const panel = vscode.window.createWebviewPanel(
            'uefiAnalysis',
            'VantageUEFI-AI Expert Analysis',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
                retainContextWhenHidden: true
            }
        );

        UEFIAnalysisPanel.currentPanel = new UEFIAnalysisPanel(panel, code, analysis);
    }

    private constructor(panel: vscode.WebviewPanel, code: string, analysis: string) {
        console.log("UEFIAnalysisPanel constructor called");
        this._panel = panel;
        this._updateContent(code, analysis);
        this._panel.onDidDispose(() => {
            console.log("UEFI Analysis Panel disposed");
            this.dispose();
        }, null, this._disposables);
    }

    private _updateContent(code: string, analysis: string) {
        const html = this._getHtmlForWebview(code, analysis);
        this._panel.webview.html = html;
    }

    public updateContent(code: string, analysis: string) {
        const html = this._getHtmlForWebview(code, analysis);
        this._panel.webview.html = html;
    }

    public _updateStreamingContent(code: string, thinkingContent: string, analysisContent: string, isThinking: boolean) {
        const html = this._getStreamingHtmlForWebview(code, thinkingContent, analysisContent, isThinking);
        this._panel.webview.html = html;
    }

    public updateViaMessage(thinkingContent: string, analysisContent: string, isThinking: boolean) {
        // Decode HTML entities for streaming content
        const decodedThinking = thinkingContent
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
            
        const decodedAnalysis = analysisContent
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
            
        console.log('Sending message to webview:', { thinkingContent: decodedThinking.substring(0, 100), analysisContent: decodedAnalysis.substring(0, 100), isThinking });
        this._panel.webview.postMessage({
            type: 'update',
            thinking: decodedThinking,
            analysis: decodedAnalysis,
            isThinking: isThinking
        });
    }

    private _getHtmlForWebview(code: string, analysis: string): string {
        const currentModel = vscode.workspace.getConfiguration('omnilocal').get('model') || "qwen2.5-coder:7b";
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OmniLocal AI Analysis</title>
    <!-- Marked.js for Markdown parsing -->
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <!-- Highlight.js for code syntax highlighting -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css">
    <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>
    <style>
        body {
            font-family: var(--vscode-font-family, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
            margin: 0;
        }
        .header {
            border-bottom: 2px solid var(--vscode-panel-border);
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: var(--vscode-textLink-foreground);
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            color: var(--vscode-descriptionForeground);
            margin: 8px 0 0 0;
            font-style: italic;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: var(--vscode-textLink-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 8px;
            margin-bottom: 15px;
            font-size: 20px;
            font-weight: 600;
        }
        .section h3 {
            color: var(--vscode-textLink-foreground);
            margin: 20px 0 10px 0;
            font-size: 16px;
            font-weight: 600;
        }
        .code-block {
            background-color: #1e1e1e;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 16px;
            margin: 15px 0;
            overflow-x: auto;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .code-block pre {
            margin: 0;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 14px;
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.5;
        }
        .code-block code {
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 14px;
        }
        /* Highlight.js theme override */
        .hljs {
            background-color: #1e1e1e !important;
            color: #d4d4d4 !important;
            border-radius: 6px;
            padding: 0 !important;
        }
        .analysis-content {
            background-color: var(--vscode-editor-background);
            border-left: 4px solid var(--vscode-textLink-foreground);
            padding: 20px;
            margin: 15px 0;
            border-radius: 0 8px 8px 0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .analysis-content h1, .analysis-content h2, .analysis-content h3 {
            margin-top: 0;
            color: var(--vscode-textLink-foreground);
        }
        .analysis-content ul, .analysis-content ol {
            margin: 10px 0;
            padding-left: 25px;
        }
        .analysis-content li {
            margin: 8px 0;
            line-height: 1.5;
        }
        .analysis-content p {
            margin: 12px 0;
            line-height: 1.6;
        }
        .analysis-content strong {
            color: var(--vscode-textLink-foreground);
            font-weight: 600;
        }
        .analysis-content em {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
        .analysis-content blockquote {
            border-left: 4px solid var(--vscode-textLink-foreground);
            margin: 15px 0;
            padding: 10px 20px;
            background-color: var(--vscode-textBlockQuote-background);
            border-radius: 0 6px 6px 0;
            font-style: italic;
            color: var(--vscode-descriptionForeground);
        }
        .reasoning-block {
            background-color: var(--vscode-textBlockQuote-background);
            border: 1px solid var(--vscode-textBlockQuote-border);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            opacity: 0.9;
        }
        .reasoning-header {
            color: var(--vscode-descriptionForeground);
            font-weight: 600;
            margin-bottom: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }
        .reasoning-content {
            font-style: italic;
            color: var(--vscode-descriptionForeground);
            white-space: pre-wrap;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.5;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-high { background-color: #ff4444; }
        .status-medium { background-color: #ffaa00; }
        .status-low { background-color: #44ff44; }
        .status-info { background-color: #4444ff; }
        .reasoning-toggle {
            font-size: 12px;
            transition: transform 0.2s;
        }
        .reasoning-collapsed .reasoning-toggle {
            transform: rotate(-90deg);
        }
        .reasoning-collapsed .reasoning-content {
            display: none;
        }
        .collapsible {
            cursor: pointer;
            user-select: none;
            padding: 8px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            margin-bottom: 8px;
            transition: background-color 0.2s;
        }
        .collapsible:hover {
            background-color: var(--vscode-toolbar-hoverBackground);
        }
        .collapsible .toggle-icon {
            display: inline-block;
            transition: transform 0.2s;
            margin-right: 8px;
        }
        .collapsible.collapsed .toggle-icon {
            transform: rotate(-90deg);
        }
        .collapsible-content {
            overflow: hidden;
            transition: max-height 0.2s ease-out;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 VantageUEFI-AI Expert Analysis</h1>
        <p>Analysis performed by ${currentModel} | Modern EDK II perspective with LibraryClass optimization</p>
    </div>

    <div class="section">
        <h2 class="collapsible" onclick="toggleSection('original-code')">
            <span class="toggle-icon">▼</span> 📝 Original Code
        </h2>
        <div id="original-code" class="collapsible-content" style="display: none;">
            <div class="code-block">
                <pre><code class="language-c">${code}</code></pre>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>🔍 Security & Compliance Analysis</h2>
        <div class="analysis-content" id="analysis-content">
            ${this._formatAnalysis(analysis)}
        </div>
    </div>

    <script>
        // Initialize highlight.js
        hljs.highlightAll();
        
        // Parse and render markdown content
        const analysisContent = document.getElementById('analysis-content');
        let markdownText = analysisContent.innerHTML;
        
        // Decode HTML entities before marked.parse
        markdownText = markdownText
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
            
        const parsedHtml = marked.parse(markdownText);
        analysisContent.innerHTML = parsedHtml;
        
        // Re-highlight code blocks after markdown parsing
        hljs.highlightAll();
        
        function toggleReasoning(index) {
            const block = document.getElementById(\`reasoning-\${index}\`);
            if (block) {
                block.classList.toggle('reasoning-collapsed');
            }
        }
        
        function toggleSection(sectionId) {
            const section = document.getElementById(sectionId);
            const header = section.previousElementSibling;
            
            if (section.style.display === 'none') {
                section.style.display = 'block';
                header.classList.remove('collapsed');
            } else {
                section.style.display = 'none';
                header.classList.add('collapsed');
            }
        }
        
        // Initialize Original Code section as collapsed
        document.addEventListener('DOMContentLoaded', function() {
            const originalCodeHeader = document.querySelector('h2.collapsible');
            if (originalCodeHeader) {
                originalCodeHeader.classList.add('collapsed');
            }
        });
        
        document.querySelectorAll('.analysis-content h3').forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                if (content && (content.tagName === 'UL' || content.tagName === 'OL' || content.tagName === 'DIV')) {
                    content.style.display = content.style.display === 'none' ? 'block' : 'none';
                }
            });
        });
    </script>
</body>
</html>`;
    }

    private _escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    private _formatAnalysis(analysis: string): string {
        let formatted = analysis;
        
        // Decode HTML entities that Ollama might return
        formatted = formatted.replace(/&gt;/g, '>');
        formatted = formatted.replace(/&lt;/g, '<');
        formatted = formatted.replace(/&amp;/g, '&');
        formatted = formatted.replace(/&quot;/g, '"');
        formatted = formatted.replace(/&#039;/g, "'");
        
        // Handle </think> tags for reasoning model
        const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
        const thinkMatches = [];
        let match;
        while ((match = thinkRegex.exec(formatted)) !== null) {
            thinkMatches.push({
                full: match[0],
                content: match[1].trim()
            });
        }
        
        // Remove </think> tags from main content
        formatted = formatted.replace(/<think>[\s\S]*?<\/think>/g, '');
        
        // Add reasoning sections at the beginning in Markdown format
        let reasoningMarkdown = '';
        if (thinkMatches.length > 0) {
            reasoningMarkdown = '\n\n## 🧠 AI Reasoning Process\n\n';
            thinkMatches.forEach((think, index) => {
                reasoningMarkdown += `<details>\n<summary>Reasoning Step ${index + 1}</summary>\n\n\`\`\`\n${think.content}\n\`\`\`\n\n</details>\n\n`;
            });
        }

        // Add status indicators as Markdown-friendly text - only critical issues
        formatted = formatted.replace(/(critical|high risk|dangerous)/gi, '🔴 $1');
        // Remove other status indicators to reduce visual noise
        formatted = formatted.replace(/(warning|caution|medium risk)/gi, '$1');
        formatted = formatted.replace(/(good|safe|recommended)/gi, '$1');
        formatted = formatted.replace(/(info|note|consider)/gi, '$1');

        return reasoningMarkdown + formatted;
    }

    private _getStreamingHtmlForWebview(code: string, thinkingContent: string, analysisContent: string, isThinking: boolean): string {
        const statusText = isThinking ? "🤖 AI is thinking..." : "🔍 AI is analyzing...";
        const currentModel = vscode.workspace.getConfiguration('omnilocal').get('model') || "qwen2.5-coder:7b";
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UEFI Code Analysis - Live</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            border-bottom: 2px solid var(--vscode-panel-border);
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: var(--vscode-textLink-foreground);
            margin: 0;
            font-size: 24px;
        }
        .status {
            color: var(--vscode-textLink-foreground);
            font-style: italic;
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section h2 {
            color: var(--vscode-textLink-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 8px;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .code-block {
            background-color: var(--vscode-textBlockQuote-background);
            border: 1px solid var(--vscode-textBlockQuote-border);
            border-radius: 6px;
            padding: 15px;
            margin: 10px 0;
            overflow-x: auto;
        }
        .code-block pre {
            margin: 0;
            font-family: var(--vscode-editor-font-family);
            font-size: 13px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .reasoning-block {
            background-color: var(--vscode-textBlockQuote-background);
            border: 1px solid var(--vscode-textBlockQuote-border);
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            opacity: 0.8;
        }
        .reasoning-header {
            color: var(--vscode-descriptionForeground);
            font-weight: bold;
            margin-bottom: 10px;
        }
        .reasoning-content {
            font-style: italic;
            color: var(--vscode-descriptionForeground);
            white-space: pre-wrap;
        }
        .analysis-content {
            background-color: var(--vscode-editor-background);
            border-left: 4px solid var(--vscode-textLink-foreground);
            padding: 15px;
            margin: 10px 0;
        }
        .analysis-content h3 {
            color: var(--vscode-textLink-foreground);
            margin-top: 0;
        }
        .analysis-content ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .analysis-content li {
            margin: 5px 0;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-high { background-color: #ff4444; }
        .status-medium { background-color: #ffaa00; }
        .status-low { background-color: #44ff44; }
        .status-info { background-color: #4444ff; }
        .live-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            background-color: #44ff44;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
        }
        .collapsible {
            cursor: pointer;
            user-select: none;
            padding: 8px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            margin-bottom: 8px;
            transition: background-color 0.2s;
        }
        .collapsible:hover {
            background-color: var(--vscode-toolbar-hoverBackground);
        }
        .collapsible .toggle-icon {
            display: inline-block;
            transition: transform 0.2s;
            margin-right: 8px;
        }
        .collapsible.collapsed .toggle-icon {
            transform: rotate(-90deg);
        }
        .collapsible-content {
            overflow: hidden;
            transition: max-height 0.2s ease-out;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 VantageUEFI-AI Expert Analysis</h1>
        <p class="status"><span class="live-indicator"></span>${statusText} (Live streaming from ${currentModel})</p>
    </div>

    <div class="section">
        <h2 class="collapsible" onclick="toggleSection('original-code')">
            <span class="toggle-icon">▼</span> 📝 Original Code
        </h2>
        <div id="original-code" class="collapsible-content" style="display: none;">
            <div class="code-block">
                <pre><code>${code}</code></pre>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>🧠 AI Reasoning Process</h2>
        <div class="reasoning-block">
            <div class="reasoning-header">Internal Thought Process</div>
            <div class="reasoning-content" id="reasoning-content">${thinkingContent ? this._escapeHtml(thinkingContent) : ''}</div>
        </div>
    </div>

    <div class="section">
        <h2>🔍 Security & Compliance Analysis</h2>
        <div class="analysis-content" id="analysis-content">${analysisContent ? this._formatAnalysis(analysisContent) : ''}</div>
    </div>

    <script>
        window.addEventListener('message', event => {
            const message = event.data;
            console.log('Received message:', message);
            if (message.type === 'update') {
                const thinkingSection = document.getElementById('reasoning-content');
                const analysisSection = document.getElementById('analysis-content');
                const statusElement = document.querySelector('.status');
                
                if (thinkingSection && message.thinking) {
                    thinkingSection.textContent = message.thinking;
                }
                
                if (analysisSection && message.analysis) {
                    // Decode HTML entities before setting innerHTML
                    let decodedAnalysis = message.analysis
                        .replace(/&gt;/g, '>')
                        .replace(/&lt;/g, '<')
                        .replace(/&amp;/g, '&')
                        .replace(/&quot;/g, '"')
                        .replace(/&#039;/g, "'");
                    
                    analysisSection.innerHTML = decodedAnalysis;
                }
                
                if (statusElement) {
                    statusElement.innerHTML = message.isThinking ? 
                        '<span class="live-indicator"></span>🤖 AI is thinking... (Live streaming)' : 
                        '<span class="live-indicator"></span>🔍 AI is analyzing... (Live streaming)';
                }
            }
        });
        
        function toggleSection(sectionId) {
            const section = document.getElementById(sectionId);
            const header = section.previousElementSibling;
            
            if (section.style.display === 'none') {
                section.style.display = 'block';
                header.classList.remove('collapsed');
            } else {
                section.style.display = 'none';
                header.classList.add('collapsed');
            }
        }
        
        // Initialize Original Code section as collapsed
        document.addEventListener('DOMContentLoaded', function() {
            const originalCodeHeader = document.querySelector('h2.collapsible');
            if (originalCodeHeader) {
                originalCodeHeader.classList.add('collapsed');
            }
        });
    </script>
</body>
</html>`;
    }

    public dispose() {
        UEFIAnalysisPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    try {
        console.log("UEFI Local AI Extension activated");
        
        const disposable = vscode.commands.registerCommand("vantageUefi.analyze", async () => {
        console.log("UEFI Analysis command triggered");
        
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found");
            return;
        }

        const selection = editor.selection;
        let selectedText = editor.document.getText(selection);
        console.log(`Selected code length: ${selectedText.length} characters`);

        if (!selectedText.trim()) {
            vscode.window.showWarningMessage("Please select C code to analyze");
            return;
        }

        // Context limiter - truncate if too long
        if (selectedText.length > 128000) {
            vscode.window.showWarningMessage("Code selection too long. Please select 128000 characters or less for analysis.");
            console.log(`Code selection too long (${selectedText.length} characters). Terminating process.`);
            return;
        }

        // Find and read header files
        const filePath = editor.document.uri.fsPath;
        console.log(`Scanning for header files for: ${filePath}`);
        const headerContent = await findAndReadHeaderFiles(filePath);
        
        if (headerContent) {
            console.log(`Found header files, adding ${headerContent.length} characters to prompt`);
        } else {
            console.log("No matching header files found");
        }

        // Get file extension for language awareness
        const fileExtension = path.extname(filePath).toLowerCase();
        const fileName = path.basename(filePath);
        
        // Language-aware system prompt
        const getLanguageSpecificPrompt = (ext: string) => {
            const languageMap: { [key: string]: string } = {
                '.c': 'C programming language for UEFI/BIOS development',
                '.cpp': 'C++ programming language for system development',
                '.py': 'Python programming language for scripting and automation',
                '.bat': 'Windows batch script for automation',
                '.vfr': 'UEFI Visual Forms Representation (VFR) file',
                '.dsc': 'EDK II Platform Description (DSC) file',
                '.dec': 'EDK II Package Declaration (DEC) file',
                '.fdf': 'EDK II Flash Definition (FDF) file',
                '.uni': 'UEFI Unicode (UNI) file for internationalization',
                '.asl': 'ACPI Source Language (ASL) file',
                '.s': 'Assembly language file for low-level programming'
            };
            
            const language = languageMap[ext] || `${ext} file format`;
            return `You are an expert developer specializing in ${language}. The following content is from a ${ext} file. Please provide analysis or debugging advice based on this specific file format and best practices. Focus on: 1. Code quality and potential issues. 2. Security vulnerabilities. 3. Performance optimizations. 4. Best practices for this specific file type. Always wrap any code snippets in triple backticks with the appropriate language identifier.`;
        };

        // Update system prompt based on file type
        const languageSpecificPrompt = getLanguageSpecificPrompt(fileExtension);

        // Build context-aware prompt with language information
        const contextIntro = `Below is a ${fileExtension} file (${fileName}) and its associated context. Please use the provided information to give accurate analysis and recommendations for this specific file type.`;
        
        let fullPrompt = contextIntro + "\n\n[HEADER DEFINITIONS]\n" + (headerContent || "No header files found.");
        fullPrompt += "\n\n[SOURCE CODE]\n" + selectedText;

        // Check total length and truncate headers if needed (preserve source code priority)
        if (fullPrompt.length > 128000) {
            const sourceCodeLength = selectedText.length + "[SOURCE CODE]\n".length;
            const introLength = contextIntro.length + "\n\n[HEADER DEFINITIONS]\n".length + "\n\n".length;
            const maxHeaderLength = 128000 - sourceCodeLength - introLength;
            
            if (maxHeaderLength > 100) { // Keep some header content
                const truncatedHeader = headerContent.substring(0, maxHeaderLength) + "\n\n... (header content truncated due to length limit)";
                fullPrompt = contextIntro + "\n\n[HEADER DEFINITIONS]\n" + truncatedHeader + "\n\n[SOURCE CODE]\n" + selectedText;
                console.log(`Truncated header content to ${maxHeaderLength} characters to fit within 128000 limit`);
            } else {
                // No room for headers, just use source code
                fullPrompt = contextIntro + "\n\n[SOURCE CODE]\n" + selectedText;
                console.log("Insufficient space for headers, analyzing source code only");
            }
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "UEFI AI Analysis...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "正在讀取相關標頭檔並進行深度分析..." });
                
                console.log(`Sending request to Ollama at ${OLLAMA_URL} with model ${MODEL}`);
                console.log(`Full prompt length: ${fullPrompt.length} characters`);
                console.log(`Prompt preview: ${fullPrompt.substring(0, 100)}...`);

                progress.report({ increment: 20, message: "Sending analysis request..." });

                // Create webview panel immediately for streaming updates
                UEFIAnalysisPanel.createOrShow(context.extensionUri, selectedText, "🤖 AI is thinking...");

                // Wait a moment for webview to be ready
                await new Promise(resolve => setTimeout(resolve, 500));

                const response = await axios.post(OLLAMA_URL, { 
                    model: MODEL, 
                    system: languageSpecificPrompt, 
                    prompt: fullPrompt, 
                    stream: true 
                }, {
                    timeout: 300000, // 5 minutes timeout for initial connection
                    responseType: 'stream', // Handle streaming response
                    headers: {
                        'Connection': 'keep-alive'
                    }
                });

                console.log("Starting to receive streaming response...");
                progress.report({ increment: 40, message: "Receiving AI analysis..." });

                let fullResponse = "";
                let isInThinking = false;
                let thinkingContent = "";
                let analysisContent = "";

                // Process streaming response
                response.data.on('data', async (chunk: Buffer) => {
                    console.log('Chunk received');
                    const lines = chunk.toString().split('\n').filter(line => line.trim());
                    
                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line);
                            
                            if (data.response) {
                                const text = data.response;
                                fullResponse += text;
                                
                                // Check if we're in a thinking block
                                if (text.includes('<think>')) {
                                    isInThinking = true;
                                    thinkingContent += text.replace('<think>', '');
                                } else if (text.includes('</think>')) {
                                    isInThinking = false;
                                    thinkingContent += text.replace('</think>', '');
                                    // Update webview directly with thinking content
                                    if (UEFIAnalysisPanel.currentPanel) {
                                        UEFIAnalysisPanel.currentPanel._updateStreamingContent(selectedText, thinkingContent, analysisContent, true);
                                    }
                                } else if (isInThinking) {
                                    thinkingContent += text;
                                    // Update webview directly with live thinking
                                    if (UEFIAnalysisPanel.currentPanel) {
                                        UEFIAnalysisPanel.currentPanel._updateStreamingContent(selectedText, thinkingContent, analysisContent, true);
                                    }
                                } else {
                                    analysisContent += text;
                                    // Update webview directly with live analysis
                                    if (UEFIAnalysisPanel.currentPanel) {
                                        UEFIAnalysisPanel.currentPanel._updateStreamingContent(selectedText, thinkingContent, analysisContent, false);
                                    }
                                }
                            }
                            
                            if (data.done) {
                                console.log("Streaming completed");
                                progress.report({ increment: 100, message: "Analysis complete!" });
                                console.log("=== FULL ANALYSIS RESULT ===");
                                console.log(fullResponse);
                                console.log("=== END ANALYSIS ===");
                                
                                // Update webview with final content
                                if (UEFIAnalysisPanel.currentPanel) {
                                    UEFIAnalysisPanel.currentPanel.updateContent(selectedText, fullResponse);
                                }
                                
                                // Also save analysis to file
                                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                                const analysisFileName = `uefi-analysis-${timestamp}.md`;
                                const analysisFilePath = path.join(path.dirname(filePath), analysisFileName);
                                
                                const analysisContent = `# UEFI Code Analysis\n\n**Analysis Time:** ${new Date().toLocaleString()}\n**File:** ${filePath}\n**Model:** ${MODEL}\n\n## Original Code\n\`\`\`c\n${selectedText}\n\`\`\`\n\n## Analysis Results\n\n${fullResponse}`;
                                
                                fs.writeFileSync(analysisFilePath, analysisContent, 'utf8');
                                console.log(`Analysis saved to: ${analysisFilePath}`);
                            }
                        } catch (e) {
                            console.error("Error parsing streaming chunk:", e);
                        }
                    }
                });

                // Wait for streaming to complete
                await new Promise((resolve, reject) => {
                    response.data.on('end', resolve);
                    response.data.on('error', reject);
                });

                if (!fullResponse || fullResponse.trim().length === 0) {
                    console.error("No content received from streaming");
                    vscode.window.showErrorMessage("Received empty response from Ollama");
                    return;
                }
            });
        } catch (error) {
            console.error("Error during analysis:", error);
            console.error("Full error object:", JSON.stringify(error, null, 2));
            
            let errorMessage = "Failed to analyze code";
            
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    errorMessage = "Cannot connect to Ollama. Please ensure Ollama is running on localhost:11434";
                } else if (error.code === 'ECONNABORTED') {
                    errorMessage = "Request timeout. Ollama took too long to respond. Try again or use a smaller code selection.";
                } else if (error.response) {
                    errorMessage = `Ollama API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
                } else if (error.request) {
                    errorMessage = "Network error: No response received from Ollama server";
                } else {
                    errorMessage = `Request setup error: ${error.message}`;
                }
            } else {
                errorMessage = `Unexpected error: ${error}`;
            }
            
            vscode.window.showErrorMessage(errorMessage);
        }
    });

    context.subscriptions.push(disposable);
    } catch (error) {
        console.error("Failed to activate UFI Local AI Extension:", error);
        // Don't show error to user on activation to avoid interference with language server
    }
}

export function deactivate() {}
