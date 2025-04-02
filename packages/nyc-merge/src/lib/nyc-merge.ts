#!/usr/bin/env node
'use strict';

import fastGlob from 'fast-glob';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import * as istanbul from 'istanbul-lib-coverage';
import { CoverageMapData } from 'istanbul-lib-coverage';
import pLimit from 'p-limit';

interface GlobOptions {
  concurrency?: number;
  [key: string]: unknown;
}

interface CliArguments {
  out: string;
  concurrency: number;
  _: string[];
  [key: string]: unknown;
}

interface ProcessedResult {
  file: string;
  data: CoverageMapData;
}

async function findFiles(
  patterns: string[],
  options: GlobOptions = {}
): Promise<string[]> {
  try {
    return await fastGlob(patterns, {
      stats: false,
      onlyFiles: true,
      absolute: true,
      concurrency: options.concurrency,
      // deep: 10,
      followSymbolicLinks: false,
      ...options,
    });
  } catch (err) {
    console.error(`Error processing patterns: ${(err as Error).message}`);
    return [];
  }
}

async function processFile(file: string): Promise<CoverageMapData> {
  try {
    const content = await fs.readFile(file, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`Error processing file ${file}: ${(err as Error).message}`);
  }
}

async function mergeCoverageFiles(
  files: string[],
  concurrency: number
): Promise<istanbul.CoverageMap> {
  const coverageMap = istanbul.createCoverageMap({});
  // Create a limit function with the p-limit module
  const limit = pLimit(concurrency);
  const errors: Error[] = [];

  const promises = files.map((file) => {
    return limit(async () => {
      try {
        const data = await processFile(file);
        return { file, data } as ProcessedResult;
      } catch (err) {
        errors.push(err as Error);
        return null;
      }
    });
  });

  const results = await Promise.all(promises);

  for (const result of results) {
    if (result && result.data) {
      coverageMap.merge(result.data);
    }
  }

  if (errors.length > 0) {
    errors.forEach((err) => console.error(err.message));
  }

  return coverageMap;
}

async function writeResultToFile(
  outputFile: string,
  data: CoverageMapData
): Promise<void> {
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(data, null, 2), 'utf8');
}

async function main(): Promise<void> {
  try {
    const argv = yargs(hideBin(process.argv))
      .usage(
        'Usage: $0 --out <output.json> <glob-pattern> [<glob-pattern> ...]'
      )
      .option('out', {
        alias: 'o',
        type: 'string',
        describe: 'Path to output JSON file for the merged coverage report',
        demandOption: true,
      })
      .option('concurrency', {
        alias: 'c',
        type: 'number',
        describe: 'Number of parallel operations when processing files',
        default: Math.max(1, os.cpus().length - 1),
      })
      .demandCommand(
        1,
        'You must provide at least one glob pattern to find coverage-final.json files'
      )
      .help()
      .strict()
      .parse() as CliArguments;

    const outputFile = path.resolve(argv.out);
    const patterns = argv._;
    const concurrency = argv.concurrency;

    console.log(`Searching files with ${patterns.length} patterns...`);
    const startFindTime = Date.now();
    const files = await findFiles(patterns, { concurrency });
    console.log(
      `Search completed in ${(Date.now() - startFindTime) / 1000} sec.`
    );

    if (files.length === 0) {
      console.error('No files found matching the provided patterns.');
      process.exit(1);
    }

    console.log(
      `Found ${files.length} files. Merging reports (concurrency: ${concurrency})...`
    );
    const startMergeTime = Date.now();
    const coverageMap = await mergeCoverageFiles(files, concurrency);
    console.log(
      `Merge completed in ${(Date.now() - startMergeTime) / 1000} sec.`
    );

    console.log(`Writing merged report to ${outputFile}...`);
    const startWriteTime = Date.now();
    await writeResultToFile(outputFile, coverageMap.toJSON());
    console.log(
      `Write completed in ${(Date.now() - startWriteTime) / 1000} sec.`
    );

    console.log(`Merged coverage report successfully written to ${outputFile}`);
    console.log(
      `Total execution time: ${(Date.now() - startFindTime) / 1000} sec.`
    );
  } catch (error) {
    console.error(`Critical error: ${(error as Error).message}`);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Unhandled error: ${(err as Error).message}`);
  console.error((err as Error).stack);
  process.exit(1);
});
