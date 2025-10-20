import * as fs from 'fs';
import * as path from 'path';

export interface FileWriterOptions {
  ensureDir?: boolean;
  overwrite?: boolean;
}

/**
 * Writes content to a file with optional directory creation
 */
export function writeFile(filePath: string, content: string, options: FileWriterOptions = {}): void {
  const { ensureDir = true, overwrite = true } = options;
  
  if (ensureDir) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  if (!overwrite && fs.existsSync(filePath)) {
    return;
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Generates TypeScript constant export
 */
export function generateConstantExport(constantName: string, value: Record<string, string>): string {
  const entries = Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `  '${key}': '${val.replace(/'/g, "\\'")}'`)
    .join(',\n');
  
  return `export const ${constantName} = {\n${entries}\n} as const;`;
}

/**
 * Generates TypeScript alias export
 */
export function generateAliasExport(aliasName: string, targetName: string): string {
  return `export const ${aliasName} = ${targetName};`;
}

/**
 * Generates file header with metadata
 */
export function generateFileHeader(metadata: {
  cldrVersion: string;
  unicodeVersion: string;
  description?: string;
}): string {
  const { cldrVersion, unicodeVersion, description = 'Auto-generated from Unicode CLDR' } = metadata;
  
  return `/**
 * ${description}
 * CLDR Version: ${cldrVersion}
 * Unicode Version: ${unicodeVersion}
 */

`;
}

/**
 * Generates auto-loader file content
 */
export function generateAutoLoaderContent(
  locale: string,
  countryCode: string,
  constantName: string,
  isRoot: boolean = false
): string {
  const header = generateFileHeader({
    cldrVersion: 'unknown',
    unicodeVersion: 'unknown',
    description: `Auto-loader for ${countryCode} states in ${locale}${isRoot ? ' (native language)' : ''}`
  });
  
  const importPath = isRoot ? '../index' : '../index';
  const i18nKey = `states.${countryCode}`;
  
  return `${header}import { i18n } from '@agape/i18n';
import { ${constantName} } from '${importPath}';

i18n.define('${locale}', '${i18nKey}', ${constantName});
`;
}

/**
 * Generates country directory structure
 */
export function generateCountryDirectoryStructure(
  basePath: string,
  countryCode: string,
  locales: string[],
  rootLocale: string | null
): void {
  const countryDir = path.join(basePath, countryCode.toLowerCase());
  
  // Create country directory
  if (!fs.existsSync(countryDir)) {
    fs.mkdirSync(countryDir, { recursive: true });
  }
  
  // Generate locale files
  for (const locale of locales) {
    const constantName = `STATES_${countryCode}_${locale.toUpperCase()}`;
    const filePath = path.join(countryDir, `${locale}.ts`);
    const content = generateAutoLoaderContent(locale, countryCode, constantName);
    writeFile(filePath, content);
  }
  
  // Generate index.ts file (instead of root.ts) only if we have a root locale
  if (rootLocale) {
    const rootConstantName = `STATES_${countryCode}_ROOT`;
    const indexPath = path.join(countryDir, 'index.ts');
    const indexContent = generateAutoLoaderContent('root', countryCode, rootConstantName, true);
    writeFile(indexPath, indexContent);
  }
}

/**
 * Generates coverage report markdown
 */
export function generateCoverageReport(
  reportPath: string,
  data: {
    totalCountries: number;
    countriesWithTranslations: number;
    countriesWithPartialTranslations: number;
    countriesWithoutTranslations: number;
    totalLocales: number;
    coverageByCountry: Map<string, { locales: string[]; missingLocales: string[] }>;
    missingCountries: string[];
  }
): void {
  const {
    totalCountries,
    countriesWithTranslations,
    countriesWithPartialTranslations,
    countriesWithoutTranslations,
    totalLocales,
    coverageByCountry,
    missingCountries
  } = data;
  
  const report = `# Translation Coverage Report

## Summary

- **Total Countries**: ${totalCountries}
- **Countries with Complete Translations**: ${countriesWithTranslations}
- **Countries with Partial Translations**: ${countriesWithPartialTranslations}
- **Countries without Translations**: ${countriesWithoutTranslations}
- **Total Available Locales**: ${totalLocales}

## Coverage Statistics

- **Complete Coverage**: ${((countriesWithTranslations / totalCountries) * 100).toFixed(1)}%
- **Partial Coverage**: ${((countriesWithPartialTranslations / totalCountries) * 100).toFixed(1)}%
- **No Coverage**: ${((countriesWithoutTranslations / totalCountries) * 100).toFixed(1)}%

## Countries with Complete Translations

${Array.from(coverageByCountry.entries())
  .filter(([, data]) => data.missingLocales.length === 0)
  .map(([country, data]) => `- **${country}**: ${data.locales.length} locales (${data.locales.join(', ')})`)
  .join('\n')}

## Countries with Partial Translations

${Array.from(coverageByCountry.entries())
  .filter(([, data]) => data.missingLocales.length > 0 && data.locales.length > 0)
  .map(([country, data]) => `- **${country}**: ${data.locales.length}/${totalLocales} locales
  - Available: ${data.locales.join(', ')}
  - Missing: ${data.missingLocales.join(', ')}`)
  .join('\n')}

## Countries without Translations

${missingCountries.map(country => `- **${country}**`).join('\n')}

## Notes

This report shows the availability of state/province translations from Unicode CLDR data.
Countries with "complete translations" have data available in all ${totalLocales} locales.
Countries with "partial translations" have data in some but not all locales.
Countries with "no translations" have state codes defined in the standards database but no CLDR translation data available.
`;

  writeFile(reportPath, report);
}
