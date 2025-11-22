import * as path from 'path';
import * as fs from 'fs/promises';

export interface LanguageDetectionResult {
  language: string;
  confidence: 'high' | 'medium' | 'low';
  detectedBy: 'extension' | 'content' | 'shebang';
}

const EXTENSION_MAP: Record<string, string> = {
  // JavaScript/TypeScript
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',

  // Python
  '.py': 'python',
  '.pyw': 'python',
  '.pyx': 'python',

  // Java/Kotlin
  '.java': 'java',
  '.kt': 'kotlin',
  '.kts': 'kotlin',

  // C/C++
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.hh': 'cpp',
  '.hxx': 'cpp',

  // C#
  '.cs': 'csharp',

  // Go
  '.go': 'go',

  // Rust
  '.rs': 'rust',

  // Ruby
  '.rb': 'ruby',
  '.rake': 'ruby',

  // PHP
  '.php': 'php',

  // Swift
  '.swift': 'swift',

  // Dart
  '.dart': 'dart',

  // Scala
  '.scala': 'scala',

  // Shell
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',

  // Other
  '.sql': 'sql',
  '.r': 'r',
  '.R': 'r',
  '.m': 'objective-c',
  '.mm': 'objective-c',
};

const SHEBANG_MAP: Record<string, string> = {
  'python': 'python',
  'python2': 'python',
  'python3': 'python',
  'node': 'javascript',
  'ruby': 'ruby',
  'perl': 'perl',
  'php': 'php',
  'bash': 'shell',
  'sh': 'shell',
  'zsh': 'shell',
};

const CONTENT_PATTERNS: Array<{
  language: string;
  patterns: RegExp[];
  minMatches: number;
}> = [
  {
    language: 'typescript',
    patterns: [
      /\binterface\s+\w+/,
      /\btype\s+\w+\s*=/,
      /:\s*(string|number|boolean|any|void|unknown|never)/,
      /\bas\s+(const|any|unknown)/,
      /<\w+>/,
    ],
    minMatches: 2,
  },
  {
    language: 'javascript',
    patterns: [
      /\bimport\s+.*\bfrom\s+['"]/,
      /\bexport\s+(default|const|function|class)/,
      /\brequire\s*\(['"]/,
      /\bmodule\.exports\s*=/,
      /\bconst\s+\w+\s*=/,
      /\blet\s+\w+\s*=/,
      /\bvar\s+\w+\s*=/,
    ],
    minMatches: 1,
  },
  {
    language: 'python',
    patterns: [
      /\bdef\s+\w+\s*\(/,
      /\bclass\s+\w+\s*[:(]/,
      /\bimport\s+\w+/,
      /\bfrom\s+\w+\s+import/,
      /\bif\s+__name__\s*==\s*['"]__main__['"]/,
      /\bself\./,
    ],
    minMatches: 2,
  },
  {
    language: 'java',
    patterns: [
      /\bpublic\s+class\s+\w+/,
      /\bprivate\s+(static\s+)?(\w+\s+)?(\w+)\s*\(/,
      /\bpublic\s+(static\s+)?(\w+\s+)?(\w+)\s*\(/,
      /\bimport\s+[\w.]+;/,
      /\bpackage\s+[\w.]+;/,
    ],
    minMatches: 2,
  },
  {
    language: 'go',
    patterns: [
      /\bpackage\s+\w+/,
      /\bfunc\s+\w+\s*\(/,
      /\bimport\s+\(/,
      /\btype\s+\w+\s+struct/,
      /\bvar\s+\w+\s+\w+/,
    ],
    minMatches: 2,
  },
  {
    language: 'rust',
    patterns: [
      /\bfn\s+\w+\s*\(/,
      /\bstruct\s+\w+/,
      /\bimpl\s+\w+/,
      /\buse\s+[\w:]+;/,
      /\blet\s+mut\s+/,
      /\bpub\s+(fn|struct|enum)/,
    ],
    minMatches: 2,
  },
];

export class LanguageDetector {
  /**
   * Detect language from file extension
   */
  detectFromExtension(filePath: string): string | null {
    const ext = path.extname(filePath).toLowerCase();
    return EXTENSION_MAP[ext] || null;
  }

  /**
   * Detect language from shebang line
   */
  detectFromShebang(content: string): string | null {
    const lines = content.split('\n');
    if (lines.length === 0) return null;

    const firstLine = lines[0].trim();
    if (!firstLine.startsWith('#!')) return null;

    // Extract the interpreter
    const shebang = firstLine.substring(2).trim();
    const parts = shebang.split(/\s+/);
    const interpreter = path.basename(parts[0]);

    return SHEBANG_MAP[interpreter] || null;
  }

  /**
   * Detect language from content patterns
   */
  detectFromContent(content: string): string | null {
    let bestMatch: { language: string; score: number } | null = null;

    for (const { language, patterns, minMatches } of CONTENT_PATTERNS) {
      let matches = 0;
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          matches++;
        }
      }

      if (matches >= minMatches) {
        const score = matches / patterns.length;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { language, score };
        }
      }
    }

    return bestMatch ? bestMatch.language : null;
  }

  /**
   * Detect language using all available methods
   */
  async detectLanguage(filePath: string): Promise<LanguageDetectionResult> {
    // Try extension first (fastest and most reliable)
    const extLang = this.detectFromExtension(filePath);
    if (extLang) {
      return {
        language: extLang,
        confidence: 'high',
        detectedBy: 'extension',
      };
    }

    // Read file content for further analysis
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Try shebang
      const shebangLang = this.detectFromShebang(content);
      if (shebangLang) {
        return {
          language: shebangLang,
          confidence: 'high',
          detectedBy: 'shebang',
        };
      }

      // Try content analysis (read first 5000 characters for performance)
      const sample = content.substring(0, 5000);
      const contentLang = this.detectFromContent(sample);
      if (contentLang) {
        return {
          language: contentLang,
          confidence: 'medium',
          detectedBy: 'content',
        };
      }
    } catch (error) {
      // File read error, fall back to unknown
    }

    // Default to unknown
    return {
      language: 'unknown',
      confidence: 'low',
      detectedBy: 'extension',
    };
  }

  /**
   * Check if a language is supported for parsing
   */
  isSupportedForParsing(language: string): boolean {
    return ['typescript', 'javascript', 'python'].includes(language);
  }
}

// Export singleton instance
export const languageDetector = new LanguageDetector();
