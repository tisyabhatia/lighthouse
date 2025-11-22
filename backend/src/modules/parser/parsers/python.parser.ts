import * as fs from 'fs/promises';
import { ParsedFile, FunctionInfo, ClassInfo, ImportStatement, ExportStatement } from '../../../types/models';

export class PythonParser {
  /**
   * Parse a Python file using regex-based extraction
   */
  async parseFile(filePath: string): Promise<ParsedFile> {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = filePath;

    const imports: ImportStatement[] = [];
    const exports: ExportStatement[] = [];
    const functions: FunctionInfo[] = [];
    const classes: ClassInfo[] = [];

    try {
      const lines = content.split('\n');

      // Extract imports
      this.extractImports(lines, imports);

      // Extract functions
      this.extractFunctions(content, lines, functions);

      // Extract classes
      this.extractClasses(content, lines, classes);

      // Python doesn't have explicit exports like JS/TS
      // We consider all top-level functions and classes as exports
      for (const func of functions) {
        if (!func.name.startsWith('_')) {
          // Not private
          exports.push({
            name: func.name,
            type: 'named',
          });
        }
      }

      for (const cls of classes) {
        if (!cls.name.startsWith('_')) {
          exports.push({
            name: cls.name,
            type: 'named',
          });
        }
      }

      return {
        path: relativePath,
        language: 'python',
        imports,
        exports,
        functions,
        classes,
        interfaces: [],
        types: [],
        constants: [],
        enums: [],
      };
    } catch (error: any) {
      console.error(`Error parsing Python file ${filePath}:`, error.message);
      return {
        path: relativePath,
        language: 'python',
        imports: [],
        exports: [],
        functions: [],
        classes: [],
        interfaces: [],
        types: [],
        constants: [],
        enums: [],
      };
    }
  }

  /**
   * Extract import statements
   */
  private extractImports(lines: string[], imports: ImportStatement[]): void {
    // Match: import module
    // Match: import module as alias
    // Match: from module import name1, name2
    // Match: from module import name as alias

    const importRegex = /^\s*import\s+([\w.]+)(?:\s+as\s+(\w+))?/;
    const fromImportRegex = /^\s*from\s+([\w.]+)\s+import\s+(.+)/;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments
      if (trimmed.startsWith('#')) continue;

      // Match "import module"
      const importMatch = importRegex.exec(line);
      if (importMatch) {
        const [, moduleName, alias] = importMatch;
        imports.push({
          source: moduleName,
          specifiers: [
            {
              name: moduleName,
              alias: alias || undefined,
            },
          ],
          isTypeOnly: false,
        });
        continue;
      }

      // Match "from module import ..."
      const fromMatch = fromImportRegex.exec(line);
      if (fromMatch) {
        const [, moduleName, importedNames] = fromMatch;

        // Parse imported names (handle commas, aliases, parentheses)
        const names = importedNames
          .replace(/[()]/g, '') // Remove parentheses
          .split(',')
          .map((name) => name.trim())
          .filter((name) => name && !name.startsWith('#'));

        const specifiers: Array<{ name: string; alias?: string }> = [];

        for (const name of names) {
          const parts = name.split(/\s+as\s+/);
          if (parts.length === 2) {
            specifiers.push({
              name: parts[0].trim(),
              alias: parts[1].trim(),
            });
          } else {
            specifiers.push({
              name: parts[0].trim(),
            });
          }
        }

        imports.push({
          source: moduleName,
          specifiers,
          isTypeOnly: false,
        });
      }
    }
  }

  /**
   * Extract function definitions
   */
  private extractFunctions(content: string, lines: string[], functions: FunctionInfo[]): void {
    // Match: def function_name(params):
    // Capture: async def, decorators, docstrings

    const funcRegex = /^(\s*)(async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->?\s*([^:]+))?:/gm;

    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const [fullMatch, indent, asyncKeyword, name, paramsStr, returnType] = match;

      // Skip methods (indented functions inside classes)
      if (indent.length > 0) {
        // This is likely a method, skip for now (will be extracted with class)
        continue;
      }

      // Parse parameters
      const parameters = this.parseParameters(paramsStr);

      // Find line number
      const position = match.index;
      const lineNumber = content.substring(0, position).split('\n').length;

      // Try to extract docstring
      const docstring = this.extractDocstring(lines, lineNumber);

      functions.push({
        name,
        parameters,
        returnType: returnType?.trim(),
        isAsync: Boolean(asyncKeyword),
        isGenerator: false, // Python generators use 'yield', harder to detect with regex
        location: {
          start: position,
          end: position + fullMatch.length,
          line: lineNumber,
        },
        docstring,
      });
    }
  }

  /**
   * Extract class definitions
   */
  private extractClasses(content: string, lines: string[], classes: ClassInfo[]): void {
    // Match: class ClassName:
    // Match: class ClassName(BaseClass):

    const classRegex = /^(\s*)class\s+(\w+)(?:\(([^)]+)\))?:/gm;

    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const [fullMatch, indent, name, baseClasses] = match;

      // Skip nested classes
      if (indent.length > 0) continue;

      // Find line number
      const position = match.index;
      const lineNumber = content.substring(0, position).split('\n').length;

      // Try to extract docstring
      const docstring = this.extractDocstring(lines, lineNumber);

      // Extract methods from this class
      const methods = this.extractMethodsFromClass(content, lines, lineNumber, name);

      // Parse base classes
      const superClass = baseClasses?.split(',')[0].trim();

      classes.push({
        name,
        methods,
        properties: [], // Python properties are harder to detect statically
        superClass,
        decorators: [], // TODO: Extract decorators
        location: {
          start: position,
          end: position + fullMatch.length,
          line: lineNumber,
        },
        docstring,
      });
    }
  }

  /**
   * Extract methods from a class
   */
  private extractMethodsFromClass(
    content: string,
    lines: string[],
    classLine: number,
    className: string
  ): FunctionInfo[] {
    const methods: FunctionInfo[] = [];

    // Find all methods (indented def statements after class line)
    const methodRegex = /^(\s+)(async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*([^:]+))?:/gm;

    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      const [fullMatch, indent, asyncKeyword, name, paramsStr, returnType] = match;

      const position = match.index;
      const lineNumber = content.substring(0, position).split('\n').length;

      // Only include methods that come after the class definition
      if (lineNumber <= classLine) continue;

      // Only include if properly indented (methods should have indent)
      if (indent.length === 0) continue;

      // Check if this method belongs to this class by checking if it's before the next class
      const nextClassRegex = new RegExp(`^class\\s+\\w+`, 'gm');
      nextClassRegex.lastIndex = match.index + fullMatch.length;
      const nextClassMatch = nextClassRegex.exec(content);

      if (nextClassMatch && nextClassMatch.index < match.index) {
        // This method belongs to a different class
        continue;
      }

      // Parse parameters (skip 'self' or 'cls')
      const parameters = this.parseParameters(paramsStr).filter(
        (p) => p.name !== 'self' && p.name !== 'cls'
      );

      // Extract docstring
      const docstring = this.extractDocstring(lines, lineNumber);

      // Determine modifiers
      const modifiers: string[] = [];
      if (name.startsWith('_') && !name.startsWith('__')) {
        modifiers.push('protected');
      } else if (name.startsWith('__')) {
        modifiers.push('private');
      }

      methods.push({
        name,
        parameters,
        returnType: returnType?.trim(),
        isAsync: Boolean(asyncKeyword),
        isGenerator: false,
        location: {
          start: position,
          end: position + fullMatch.length,
          line: lineNumber,
        },
        docstring,
        modifiers,
      });
    }

    return methods;
  }

  /**
   * Parse function parameters
   */
  private parseParameters(paramsStr: string): Array<{ name: string; type?: string }> {
    if (!paramsStr.trim()) return [];

    const params = paramsStr.split(',').map((p) => p.trim());
    const result: Array<{ name: string; type?: string }> = [];

    for (const param of params) {
      if (!param) continue;

      // Match: name: type = default
      // Match: name: type
      // Match: name = default
      // Match: name

      const typeMatch = /^(\w+)\s*:\s*([^=]+)/.exec(param);
      if (typeMatch) {
        result.push({
          name: typeMatch[1],
          type: typeMatch[2].trim(),
        });
      } else {
        const nameMatch = /^(\*{0,2}\w+)/.exec(param);
        if (nameMatch) {
          result.push({
            name: nameMatch[1],
          });
        }
      }
    }

    return result;
  }

  /**
   * Extract docstring from the line after a definition
   */
  private extractDocstring(lines: string[], defLineNumber: number): string | undefined {
    // defLineNumber is 1-indexed
    const nextLineIndex = defLineNumber; // 0-indexed

    if (nextLineIndex >= lines.length) return undefined;

    const nextLine = lines[nextLineIndex]?.trim();

    // Check if it starts with a docstring delimiter
    if (!nextLine || (!nextLine.startsWith('"""') && !nextLine.startsWith("'''"))) {
      return undefined;
    }

    const delimiter = nextLine.startsWith('"""') ? '"""' : "'''";

    // Check if it's a single-line docstring
    if (nextLine.endsWith(delimiter) && nextLine.length > delimiter.length * 2) {
      return nextLine.substring(delimiter.length, nextLine.length - delimiter.length).trim();
    }

    // Multi-line docstring
    const docLines: string[] = [];
    let foundEnd = false;

    for (let i = nextLineIndex; i < lines.length; i++) {
      const line = lines[i];

      if (i === nextLineIndex) {
        // First line
        const content = line.substring(line.indexOf(delimiter) + delimiter.length);
        if (content.trim()) {
          docLines.push(content.trim());
        }
      } else {
        if (line.includes(delimiter)) {
          // Last line
          const content = line.substring(0, line.indexOf(delimiter));
          if (content.trim()) {
            docLines.push(content.trim());
          }
          foundEnd = true;
          break;
        } else {
          docLines.push(line.trim());
        }
      }
    }

    return foundEnd ? docLines.join('\n') : undefined;
  }
}

export const pythonParser = new PythonParser();
