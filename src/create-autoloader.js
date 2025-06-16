import fg from 'fast-glob';
import path from 'path';
import { pathToFileURL } from 'url';
import logger from './logger.js';

const tag = 'autoloader';

function resolveBaseDir(providedBaseDir) {
  if (providedBaseDir) {
    return path.resolve(providedBaseDir);
  }
  return process.cwd();
}

export default function createAutoloader({
  baseDir = null,
  verbose = false,
  onFileLoad = null,
  onError = null,
} = {}) {
  const _baseDir = resolveBaseDir(baseDir);

  async function load(patterns = []) {
    if (!Array.isArray(patterns)) {
      throw new TypeError('patterns deve essere un array di stringhe');
    }

    const files = await fg(patterns, { cwd: _baseDir, absolute: true });

    if (verbose) {
      logger.info(`found ${files.length} files`, { tag });
    }

    for (const file of files) {
      try {
        if (verbose) {
          logger.info(`importing: ${file}`, { tag });
        }

        const module = await import(pathToFileURL(file).href);

        if (typeof onFileLoad === 'function') {
          await onFileLoad(module, file);
        }
      } catch (err) {
        logger.error(`error importing ${file}:`, {tag, err });
        if (typeof onError === 'function') {
          await onError(err, file);
        }
      }
    }
  }

  return { load };
}
