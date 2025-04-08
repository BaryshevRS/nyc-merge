# nyc-merge

**nyc-merge** is a lightweight Node.js tool designed to merge multiple Istanbul (nyc) coverage reports into a single, unified JSON report. This makes it easier to aggregate test coverage results from various sources and present a comprehensive overview.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Features

- **Multi-Pattern Search:** Use one or more glob patterns to locate coverage files.
- **Concurrent Processing:** Leverages parallel operations for fast file processing, configurable to match your machine's capabilities.
- **Robust Merging:** Uses Istanbul’s coverage library to combine coverage data accurately.
- **Error Reporting:** Logs errors encountered during file processing, ensuring that issues are visible and can be addressed.
- **CLI Usability:** Provides a simple command line interface with clear options for output and concurrency.

---

## Installation

Ensure you have Node.js (version 18 or higher) installed, then install **nyc-merge** globally via npm:

```bash
npm install -g nyc-merge
```

Alternatively, you can add it to your project as a dependency:

```bash
npm install nyc-merge --save-dev
```

---

## Usage

After installation, you can run **nyc-merge** directly from the command line.

### Command Syntax

```bash
nyc-merge --out <output.json> [--concurrency <number>] <glob-pattern> [<glob-pattern> ...]
```

### Options

- `--out, -o`  
  **(Required)**  
  Path to the output JSON file where the merged coverage report will be written.

- `--concurrency, -c`  
  Number of parallel operations used to process files. Defaults to the number of CPU cores available.

### Examples

Merge all coverage files matching a single glob pattern:

```bash
nyc-merge --out merged-coverage.json "coverage/**/coverage-final.json"
```

Merge coverage reports from multiple directories:

```bash
nyc-merge --out merged-coverage.json "coverage/**/coverage-final.json" "test-coverage/**/coverage-final.json"
```

Customize concurrency:

```bash
nyc-merge --out merged-coverage.json --concurrency 4 "coverage/**/coverage-final.json"
```

---

## How It Works

1. **File Discovery:**  
   The tool utilizes [fast-glob](https://www.npmjs.com/package/fast-glob) to locate files matching the provided glob patterns.

2. **File Processing:**  
   Each found file is read asynchronously, and its JSON content is parsed. Any errors during this process are logged.

3. **Data Merging:**  
   Istanbul’s [lib-coverage](https://www.npmjs.com/package/istanbul-lib-coverage) library is used to merge the JSON coverage reports into a single cohesive report.

4. **Output Generation:**  
   The resulting merged JSON report is written to the specified output file. Directories are created as needed.

---

## Contributing

Contributions are welcome! If you encounter issues, have suggestions, or want to contribute new features, please check the [issues](https://github.com/BaryshevRS/nyc-merge/issues) page and submit a pull request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

