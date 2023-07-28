'use strict';

const ts = require('typescript');
const { merge } = require('lodash');

const reportDiagnostics = require('../utils/report-diagnostics');
const resolveConfigOptions = require('../utils/resolve-config-options');
const { glob } = require('glob');

module.exports = {
  /**
   * Default TS -> JS Compilation for Strapi
   * @param {string} tsConfigPath
   * @param {Object} configOptions
   * @param {Array.<string>} configOptions.fileNames
   * @param {Object} configOptions.options
   */
  async run(tsConfigPath, configOptions = {}) {
    // Parse the tsconfig.json file & resolve the configuration options
    const { options, projectReferences } = resolveConfigOptions(tsConfigPath);

    const files = await new Promise((resolve, reject) => {
      glob('./**/*.test-d.ts', (err, matches) => (err ? reject(err) : resolve(matches)));
    });

    const program = ts.createProgram({
      rootNames: files,
      projectReferences,
      options: merge(options, configOptions.options),
    });

    const emitResults = program.emit();

    const diagnostics = ts.sortAndDeduplicateDiagnostics(
      ts.getPreEmitDiagnostics(program).concat(emitResults.diagnostics)
    );

    if (diagnostics.length > 0) {
      const ds = diagnostics.map((diagnostic) => {
        const comment = diagnostic.file?.commentDirectives.find(
          (comment) =>
            comment.range.pos === diagnostic.start &&
            comment.range.end === diagnostic.start + diagnostic.length
        );

        if (comment) {
          const text = diagnostic.file.text.slice(comment.range.pos, comment.range.end);

          if (text.startsWith('// @ts-expect-error')) {
            const [, message] = text.split('// @ts-expect-error');
            console.log('message?', message);
            diagnostic.messageText = message;
          }
        }

        return diagnostic;
      });

      reportDiagnostics(ds);
    }

    // If the compilation failed, exit early
    if (emitResults.emitSkipped) {
      process.exit(1);
    }
  },
};
