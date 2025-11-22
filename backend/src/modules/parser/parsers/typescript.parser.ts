import { parse } from '@typescript-eslint/parser';
import * as fs from 'fs/promises';
import { ParsedFile, FunctionInfo, ClassInfo, ImportStatement, ExportStatement } from '../../../types/models';
import { ASTExtractor } from '../ast-extractor';

export class TypeScriptParser {
  /**
   * Parse a TypeScript/TSX file
   */
  async parseFile(filePath: string): Promise<ParsedFile> {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = filePath;

    const imports: ImportStatement[] = [];
    const exports: ExportStatement[] = [];
    const functions: FunctionInfo[] = [];
    const classes: ClassInfo[] = [];

    try {
      const ast = parse(content, {
        loc: true,
        range: true,
        comment: true,
        tokens: true,
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      });

      // Traverse the AST
      this.traverseNode(ast, {
        imports,
        exports,
        functions,
        classes,
      });

      return {
        path: relativePath,
        language: filePath.endsWith('.tsx') ? 'typescript' : 'typescript',
        imports,
        exports,
        functions,
        classes,
        interfaces: [], // TODO: Extract interfaces
        types: [], // TODO: Extract type aliases
        constants: [], // TODO: Extract constants
        enums: [], // TODO: Extract enums
      };
    } catch (error: any) {
      console.error(`Error parsing TypeScript file ${filePath}:`, error.message);
      return {
        path: relativePath,
        language: 'typescript',
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
   * Traverse AST node and extract information
   */
  private traverseNode(
    node: any,
    context: {
      imports: ImportStatement[];
      exports: ExportStatement[];
      functions: FunctionInfo[];
      classes: ClassInfo[];
    }
  ): void {
    if (!node || typeof node !== 'object') return;

    // Handle different node types
    switch (node.type) {
      case 'ImportDeclaration':
        this.extractImport(node, context.imports);
        break;

      case 'ExportNamedDeclaration':
      case 'ExportDefaultDeclaration':
      case 'ExportAllDeclaration':
        this.extractExport(node, context.exports);
        break;

      case 'FunctionDeclaration':
        this.extractFunction(node, context.functions);
        break;

      case 'ClassDeclaration':
        this.extractClass(node, context.classes);
        break;

      case 'VariableDeclaration':
        // Check if it contains arrow functions
        this.extractVariableDeclaration(node, context.functions);
        break;
    }

    // Traverse children
    for (const key in node) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;

      const child = node[key];

      if (Array.isArray(child)) {
        child.forEach((item) => this.traverseNode(item, context));
      } else if (child && typeof child === 'object') {
        this.traverseNode(child, context);
      }
    }
  }

  /**
   * Extract import statement
   */
  private extractImport(node: any, imports: ImportStatement[]): void {
    const source = node.source?.value;
    if (!source) return;

    const specifiers: Array<{ name: string; alias?: string }> = [];

    if (node.specifiers) {
      for (const spec of node.specifiers) {
        if (spec.type === 'ImportDefaultSpecifier') {
          specifiers.push({
            name: 'default',
            alias: spec.local?.name,
          });
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          specifiers.push({
            name: '*',
            alias: spec.local?.name,
          });
        } else if (spec.type === 'ImportSpecifier') {
          specifiers.push({
            name: spec.imported?.name || spec.imported?.value,
            alias: spec.local?.name !== spec.imported?.name ? spec.local?.name : undefined,
          });
        }
      }
    }

    imports.push({
      source: ASTExtractor.normalizeSource(source),
      specifiers,
      isTypeOnly: node.importKind === 'type',
    });
  }

  /**
   * Extract export statement
   */
  private extractExport(node: any, exports: ExportStatement[]): void {
    if (node.type === 'ExportDefaultDeclaration') {
      const name = this.getExportedName(node.declaration);
      exports.push({
        name: name || 'default',
        type: 'default',
      });
      return;
    }

    if (node.type === 'ExportAllDeclaration') {
      exports.push({
        name: '*',
        type: 'all',
        source: node.source?.value,
      });
      return;
    }

    // Named exports
    if (node.specifiers) {
      for (const spec of node.specifiers) {
        exports.push({
          name: spec.exported?.name || spec.exported?.value,
          type: 'named',
          source: node.source?.value,
        });
      }
    }

    // Export declaration (export const, export function, etc.)
    if (node.declaration) {
      const names = this.getExportedNames(node.declaration);
      for (const name of names) {
        exports.push({
          name,
          type: 'named',
        });
      }
    }
  }

  /**
   * Get exported name from declaration
   */
  private getExportedName(node: any): string | null {
    if (!node) return null;

    if (node.id?.name) return node.id.name;
    if (node.name) return node.name;

    // Arrow function or expression
    if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
      return 'default';
    }

    return null;
  }

  /**
   * Get all exported names from declaration
   */
  private getExportedNames(node: any): string[] {
    const names: string[] = [];

    if (!node) return names;

    // Function or class declaration
    if (node.id?.name) {
      names.push(node.id.name);
    }

    // Variable declaration
    if (node.type === 'VariableDeclaration' && node.declarations) {
      for (const decl of node.declarations) {
        if (decl.id?.name) {
          names.push(decl.id.name);
        }
      }
    }

    return names;
  }

  /**
   * Extract function declaration
   */
  private extractFunction(node: any, functions: FunctionInfo[]): void {
    const name = ASTExtractor.extractName(node);
    const location = ASTExtractor.extractLocation(node);
    const params = ASTExtractor.extractParameters(node);
    const returnType = ASTExtractor.extractReturnType(node);
    const isAsync = ASTExtractor.isAsync(node);
    const isGenerator = ASTExtractor.isGenerator(node);
    const docstring = ASTExtractor.extractJSDoc(node);

    functions.push({
      name,
      parameters: params,
      returnType,
      isAsync,
      isGenerator,
      location,
      docstring,
    });
  }

  /**
   * Extract class declaration
   */
  private extractClass(node: any, classes: ClassInfo[]): void {
    const name = ASTExtractor.extractName(node);
    const location = ASTExtractor.extractLocation(node);
    const methods: FunctionInfo[] = [];
    const properties: Array<{ name: string; type?: string }> = [];
    const docstring = ASTExtractor.extractJSDoc(node);

    // Extract super class
    const superClass = node.superClass?.name;

    // Extract decorators
    const decorators = ASTExtractor.extractDecorators(node);

    // Extract members
    if (node.body?.body) {
      for (const member of node.body.body) {
        if (member.type === 'MethodDefinition') {
          const methodInfo = this.extractMethod(member);
          if (methodInfo) {
            methods.push(methodInfo);
          }
        } else if (member.type === 'PropertyDefinition' || member.type === 'ClassProperty') {
          const propName = ASTExtractor.extractName(member.key);
          const propType = member.typeAnnotation
            ? ASTExtractor.extractLocation(member.typeAnnotation)
            : undefined;

          properties.push({
            name: propName,
            type: propType as any,
          });
        }
      }
    }

    classes.push({
      name,
      methods,
      properties,
      superClass,
      decorators,
      location,
      docstring,
    });
  }

  /**
   * Extract method from class
   */
  private extractMethod(node: any): FunctionInfo | null {
    if (!node.value) return null;

    const name = ASTExtractor.extractName(node.key);
    const location = ASTExtractor.extractLocation(node);
    const params = ASTExtractor.extractParameters(node.value);
    const returnType = ASTExtractor.extractReturnType(node.value);
    const isAsync = ASTExtractor.isAsync(node.value);
    const isGenerator = ASTExtractor.isGenerator(node.value);
    const modifiers = ASTExtractor.extractModifiers(node);
    const docstring = ASTExtractor.extractJSDoc(node);

    return {
      name,
      parameters: params,
      returnType,
      isAsync,
      isGenerator,
      location,
      docstring,
      modifiers,
    };
  }

  /**
   * Extract variable declaration (looking for arrow functions)
   */
  private extractVariableDeclaration(node: any, functions: FunctionInfo[]): void {
    if (!node.declarations) return;

    for (const decl of node.declarations) {
      if (
        decl.init &&
        (decl.init.type === 'ArrowFunctionExpression' || decl.init.type === 'FunctionExpression')
      ) {
        const name = ASTExtractor.extractName(decl.id);
        const location = ASTExtractor.extractLocation(decl.init);
        const params = ASTExtractor.extractParameters(decl.init);
        const returnType = ASTExtractor.extractReturnType(decl.init);
        const isAsync = ASTExtractor.isAsync(decl.init);
        const docstring = ASTExtractor.extractJSDoc(decl);

        functions.push({
          name,
          parameters: params,
          returnType,
          isAsync,
          isGenerator: false,
          location,
          docstring,
        });
      }
    }
  }
}

export const typescriptParser = new TypeScriptParser();
