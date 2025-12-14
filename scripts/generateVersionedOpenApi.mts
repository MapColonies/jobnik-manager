/* eslint-disable no-console */
import { readFile, writeFile, readdir, unlink } from 'fs/promises';
import { parse, stringify } from 'yaml';
import { execSync } from 'child_process';
import type { OpenAPIV3 } from 'openapi-types';
import { format } from 'prettier';

/**
 * Dynamically generates a unified OpenAPI specification from multiple versioned files.
 * Discovers all openapi_v{number}.yaml files and merges them into a single openapi3.yaml
 */

const VERSION_FILE_PATTERN = /^openapi_v(\d+)\.yaml$/;
const OUTPUT_FILE = 'openapi3.yaml';

type Version = string;

/**
 * Discovers all versioned OpenAPI files matching the pattern openapi_v{number}.yaml
 */
const discoverVersionFiles = async (): Promise<{ version: string; file: string }[]> => {
  const files = await readdir('.');
  const versionFiles: { version: string; file: string }[] = [];

  for (const file of files) {
    const match = file.match(VERSION_FILE_PATTERN);
    if (match) {
      const versionNumber = match[1];
      versionFiles.push({
        version: `v${versionNumber}`,
        file,
      });
    }
  }

  // Sort by version number
  versionFiles.sort((a, b) => {
    const numA = parseInt(a.version.slice(1));
    const numB = parseInt(b.version.slice(1));
    return numA - numB;
  });

  return versionFiles;
};

/**
 * Adds version prefix to paths and suffix to operationIds
 */
const addVersionToSpec = (spec: OpenAPIV3.Document, version: Version): OpenAPIV3.Document => {
  const versionedSpec = structuredClone(spec);

  // Update paths to include version prefix
  const versionedPaths: OpenAPIV3.PathsObject = {};
  for (const [path, pathItem] of Object.entries(versionedSpec.paths)) {
    const versionedPath = `/${version}${path}`;
    versionedPaths[versionedPath] = pathItem;

    if (pathItem) {
      for (const [, operation] of Object.entries(pathItem)) {
        if (typeof operation === 'object' && 'operationId' in operation) {
          if (operation.operationId !== undefined) {
            operation.operationId = `${operation.operationId}${version.toUpperCase()}`;
          }
        }
      }
    }
  }
  versionedSpec.paths = versionedPaths;

  return versionedSpec;
};

try {
  console.log('🚀 Starting versioned OpenAPI generation...\n');

  // Discover all versioned OpenAPI files
  console.log('🔍 Discovering versioned OpenAPI files...');
  const versionFiles = await discoverVersionFiles();

  if (versionFiles.length === 0) {
    console.error('❌ No versioned OpenAPI files found matching pattern openapi_v{number}.yaml');
    process.exit(1);
  }

  console.log(`📋 Found ${versionFiles.length} version(s): ${versionFiles.map((v) => v.version).join(', ')}\n`);

  // Read and process each version file
  const processedFiles: string[] = [];
  for (const { version, file } of versionFiles) {
    console.log(`📖 Reading ${file}...`);
    const content = await readFile(file, 'utf-8');
    const spec = parse(content) as OpenAPIV3.Document;

    console.log(`🔧 Adding version prefix to ${version}...`);
    const versionedSpec = addVersionToSpec(spec, version);
    const outputFile = `${version}.yaml`;
    const yamlContent = stringify(versionedSpec);
    const formattedYaml = await format(yamlContent, { parser: 'yaml' });
    await writeFile(outputFile, formattedYaml, 'utf-8');
    processedFiles.push(outputFile);
    console.log(`✅ Successfully created ${outputFile}\n`);
  }

  // Create merge configuration dynamically
  console.log('📄 Creating merge configuration...');
  const mergeConfig = {
    inputs: processedFiles.map((file, index) => ({
      inputFile: file,
      dispute: {
        prefix: versionFiles[index]?.version,
      },
    })),
    output: OUTPUT_FILE,
  };
  await writeFile('openapi-merge.json', JSON.stringify(mergeConfig, null));
  console.log('✅ Created openapi-merge.json');

  // Run merge directly to final output
  console.log('\n🔧 Merging versioned files...');
  execSync('npx openapi-merge-cli', { stdio: 'inherit' });
  console.log(`✅ Successfully created ${OUTPUT_FILE}`);

  // Clean up temporary files
  console.log('\n🧹 Cleaning up temporary files...');
  const tempFiles = [
    ...processedFiles, // v1.yaml, v2.yaml, etc.
    'openapi-merge.json', // Temporary merge config
  ];

  for (const file of tempFiles) {
    try {
      await unlink(file);
      console.log(`   Removed ${file}`);
    } catch {
      // Ignore errors if file doesn't exist
    }
  }

  console.log('\n🎉 All files generated and merged successfully!');
} catch (error) {
  console.error('❌ Error generating versioned files:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
