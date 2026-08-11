export declare const MUTED_FG: string;
export declare const MUTED_BG_RE: RegExp;
export declare const CONTRAST_EXEMPT_FILES: string[];
export declare function isExempt(file: string): boolean;
export declare function findSingleStringViolations(file: string, source: string): string[];
export declare function extractCvaCalls(source: string): { body: string; index: number }[];
export declare function findCvaViolations(file: string, source: string): string[];
