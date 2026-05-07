import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import utils, { logger, loggerCloud } from '../src/index.js';

test('exports local logger as default behavior', () => {
    assert.equal(utils.logger, logger);
    assert.deepEqual(
        logger.transports.map((transport) => transport.constructor.name),
        [ 'DailyRotateFile', 'DailyRotateFile', 'Console' ]
    );
});

test('exports cloud logger as console-only behavior', () => {
    assert.equal(utils.loggerCloud, loggerCloud);
    assert.deepEqual(
        loggerCloud.transports.map((transport) => transport.constructor.name),
        [ 'Console' ]
    );
});

test('exports cloud express logger separately', () => {
    assert.equal(typeof utils.express.logger, 'function');
    assert.equal(typeof utils.express.loggerCloud, 'function');
    assert.notEqual(utils.express.logger, utils.express.loggerCloud);
});

test('using loggerCloud only does not create logs directory', () => {
    const fixtureDirectory = mkdtempSync(join(tmpdir(), 'nodejs-utils-cloud-'));
    const script = `
        process.chdir(${JSON.stringify(fixtureDirectory)});
        const fs = await import('node:fs');
        const { loggerCloud } = await import(${JSON.stringify(new URL('../src/index.js', import.meta.url).href)});
        loggerCloud.info('cloud only test', { tag: 'test' });
        console.log(fs.existsSync('logs') ? 'present' : 'missing');
    `;

    const result = spawnSync(process.execPath, [ '--input-type=module', '--eval', script ], {
        cwd: fixtureDirectory,
        encoding: 'utf8'
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /missing/);
});
