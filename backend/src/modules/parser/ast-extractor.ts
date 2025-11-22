import { FunctionInfo, ClassInfo, ImportStatement, ExportStatement } from '../../types/models';

/**
 * Generic AST extraction utilities
 */
export class ASTExtractor {
  /**
   * Extract source location from AST node
   */
  static extractLocation(node: any): { start: number; end: number; line?: number; column?: number } {
    if (!node) {
      return { start: 0, end: 0 };
    }

    // Handle different AST node formats
    if (node.loc) {
      return {
        start: node.range?.[0] || node.start || 0,
        end: node.range?.[1] || node.end || 0,
        line: node.loc.start?.line,
        column: node.loc.start?.column,
      };
    }

    if (node.range) {
      return {
        start: node.range[0],
        end: node.range[1],
      };
    }

    if (node.start !== undefined && node.end !== undefined) {
      return {
        start: node.start,
        end: node.end,
      };
    }

    return { start: 0, end: 0 };
  }

  /**
   * Extract name from various node types
   */
  static extractName(node: any): string {
    if (!node) return 'anonymous';

    if (typeof node === 'string') return node;
    if (node.name) return node.name;
    if (node.id?.name) return node.id.name;
    if (node.key?.name) return node.key.name;

    return 'anonymous';
  }

  /**
   * Extract parameters from function node
   */
  static extractParameters(node: any): Array<{ name: string; type?: string }> {
    const params = node.params || node.parameters || [];

    return params.map((param: any) => {
      const name = this.extractParamName(param);
      const type = this.extractParamType(param);

      return { name, type };
    });
  }

  /**
   * Extract parameter name from parameter node
   */
  private static extractParamName(param: any): string {
    if (!param) return '';

    if (typeof param === 'string') return param;

    // Handle destructuring
    if (param.type === 'ObjectPattern' || param.type === 'ArrayPattern') {
      return param.type === 'ObjectPattern' ? '{ ... }' : '[ ... ]';
    }

    // Handle rest parameters
    if (param.type === 'RestElement') {
      return `...${this.extractParamName(param.argument)}`;
    }

    // Handle assignment patterns (default values)
    if (param.type === 'AssignmentPattern') {
      return this.extractParamName(param.left);
    }

    // Standard identifier
    if (param.name) return param.name;
    if (param.id?.name) return param.id.name;
    if (param.pattern?.name) return param.pattern.name;

    return '';
  }

  /**
   * Extract parameter type from parameter node (TypeScript)
   */
  private static extractParamType(param: any): string | undefined {
    if (!param) return undefined;

    // TypeScript type annotation
    if (param.typeAnnotation) {
      return this.extractTypeAnnotation(param.typeAnnotation);
    }

    return undefined;
  }

  /**
   * Extract type annotation string
   */
  private static extractTypeAnnotation(typeNode: any): string {
    if (!typeNode) return 'any';

    // Handle TSTypeAnnotation wrapper
    const actualType = typeNode.typeAnnotation || typeNode;

    if (!actualType) return 'any';

    switch (actualType.type) {
      case 'TSStringKeyword':
        return 'string';
      case 'TSNumberKeyword':
        return 'number';
      case 'TSBooleanKeyword':
        return 'boolean';
      case 'TSAnyKeyword':
        return 'any';
      case 'TSUnknownKeyword':
        return 'unknown';
      case 'TSVoidKeyword':
        return 'void';
      case 'TSNullKeyword':
        return 'null';
      case 'TSUndefinedKeyword':
        return 'undefined';
      case 'TSArrayType':
        return `${this.extractTypeAnnotation(actualType.elementType)}[]`;
      case 'TSTypeReference':
        return actualType.typeName?.name || actualType.typeName?.escapedText || 'unknown';
      case 'TSUnionType':
        return actualType.types?.map((t: any) => this.extractTypeAnnotation(t)).join(' | ') || 'unknown';
      case 'TSIntersectionType':
        return actualType.types?.map((t: any) => this.extractTypeAnnotation(t)).join(' & ') || 'unknown';
      default:
        return 'any';
    }
  }

  /**
   * Extract return type from function node
   */
  static extractReturnType(node: any): string | undefined {
    if (!node) return undefined;

    // TypeScript return type annotation
    if (node.returnType) {
      return this.extractTypeAnnotation(node.returnType);
    }

    return undefined;
  }

  /**
   * Check if function is async
   */
  static isAsync(node: any): boolean {
    return Boolean(node?.async);
  }

  /**
   * Check if function is a generator
   */
  static isGenerator(node: any): boolean {
    return Boolean(node?.generator);
  }

  /**
   * Extract decorators from class or method
   */
  static extractDecorators(node: any): string[] {
    if (!node?.decorators) return [];

    return node.decorators.map((decorator: any) => {
      if (decorator.expression?.callee) {
        return this.extractName(decorator.expression.callee);
      }
      return this.extractName(decorator.expression);
    });
  }

  /**
   * Extract modifiers (public, private, static, etc.)
   */
  static extractModifiers(node: any): string[] {
    const modifiers: string[] = [];

    if (!node) return modifiers;

    // TypeScript modifiers
    if (node.modifiers) {
      for (const modifier of node.modifiers) {
        if (modifier.kind) {
          modifiers.push(this.getModifierName(modifier.kind));
        }
      }
    }

    // Standard properties
    if (node.static) modifiers.push('static');
    if (node.async) modifiers.push('async');
    if (node.generator) modifiers.push('generator');

    return modifiers;
  }

  /**
   * Get modifier name from kind
   */
  private static getModifierName(kind: any): string {
    const kindMap: Record<number, string> = {
      125: 'public',
      123: 'private',
      124: 'protected',
      126: 'static',
      129: 'readonly',
      130: 'abstract',
      131: 'async',
    };

    return kindMap[kind] || 'unknown';
  }

  /**
   * Extract JSDoc comments
   */
  static extractJSDoc(node: any): string | undefined {
    if (!node) return undefined;

    // Look for leading comments
    const comments = node.leadingComments || node.jsDoc;
    if (!comments || comments.length === 0) return undefined;

    // Get the last comment (most relevant)
    const lastComment = comments[comments.length - 1];

    if (!lastComment.value) return undefined;

    // Clean up JSDoc formatting
    return lastComment.value
      .split('\n')
      .map((line: string) => line.trim().replace(/^\*\s?/, ''))
      .join('\n')
      .trim();
  }

  /**
   * Check if node is exported
   */
  static isExported(node: any): boolean {
    if (!node) return false;

    // Direct export
    if (node.type?.includes('Export')) return true;

    // Has export modifier
    if (node.modifiers) {
      return node.modifiers.some((mod: any) =>
        mod.kind === 93 || // export keyword
        mod.type === 'ExportKeyword'
      );
    }

    return false;
  }

  /**
   * Normalize import/export source
   */
  static normalizeSource(source: string): string {
    return source.replace(/['"]/g, '');
  }
}
