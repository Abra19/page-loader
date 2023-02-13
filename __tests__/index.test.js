import * as fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import nock from 'nock';

import pageLoader from '../src/index.js';
import { readFile, makeFileName } from '../src/utils.js';

nock.disableNetConnect();

const fixDirname = '__fixtures__';

const baseUrl = 'https://ru.hexlet.io';
const pagePath = '/courses';
const pageUrl = `${baseUrl}${pagePath}`;

const imgPathReq = '/assets/professions/nodejs.png';
const scriptPathReq = '/packs/js/runtime.js';
const stylePathReq = '/assets/application.css';
const canonicalPathReq = '/courses';

const pageName = 'ru-hexlet-io-courses';
const ext = '.html';

const filesDir = `${pageName}_files`;
const imgName = 'ru-hexlet-io-assets-professions-nodejs.png';
const scriptName = 'ru-hexlet-io-packs-js-runtime.js';
const styleName = 'ru-hexlet-io-assets-application.css';
const canonicalName = 'ru-hexlet-io-courses.html';

let tmpDirPath = '';

describe('Loading File - Successful', () => {
  beforeEach(async () => {
    tmpDirPath = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });
  test('correctly loading in fixed output', async () => {
    const testPage = await readFile(fixDirname, `${pageName}${ext}`, 'utf8');
    const image = await readFile(fixDirname, `${filesDir}/${imgName}`);
    const script = await readFile(fixDirname, `${filesDir}/${scriptName}`, 'utf8');
    const style = await readFile(fixDirname, `${filesDir}/${styleName}`, 'utf8');
    const canonical = await readFile(fixDirname, `${filesDir}/${canonicalName}`, 'utf8');

    const htmlName = makeFileName(new URL(`${baseUrl}${pagePath}`));
    const pngName = makeFileName(new URL(`${baseUrl}${imgPathReq}`));
    expect(htmlName).toBe(`${pageName}${ext}`);
    expect(pngName).toBe(imgName);

    nock(baseUrl)
      .get(pagePath)
      .reply(200, testPage)
      .get(imgPathReq)
      .reply(200, image)
      .get(scriptPathReq)
      .reply(200, script)
      .get(stylePathReq)
      .reply(200, style)
      .get(canonicalPathReq)
      .reply(200, canonical);

    await pageLoader(pageUrl, tmpDirPath);

    const expectedPage = await readFile(fixDirname, 'expected.html', 'utf8');
    const actualPage = await readFile(tmpDirPath, `${pageName}${ext}`, 'utf8');
    const downloadedImage = await readFile(tmpDirPath, `${filesDir}/${imgName}`);
    const downloadedScript = await readFile(tmpDirPath, `${filesDir}/${scriptName}`, 'utf8');
    const downloadedStyle = await readFile(tmpDirPath, `${filesDir}/${styleName}`, 'utf8');
    const downloadedCanonical = await readFile(tmpDirPath, `${filesDir}/${canonicalName}`, 'utf8');

    expect(actualPage).toEqual(expectedPage);
    expect(downloadedImage).toEqual(image);
    expect(downloadedScript).toEqual(script);
    expect(downloadedStyle).toEqual(style);
    expect(downloadedCanonical).toEqual(canonical);
  });
});

describe('Loading File - Negative', () => {
  test('bad request', async () => {
    nock('http://my.url')
      .get('/not-exist-page')
      .reply(404, '');
    await expect(pageLoader('http://my.url/not-exist-page', tmpDirPath)).rejects.toThrow();
  });

  test('bad url', async () => {
    nock('http:/my.url')
      .get(pagePath)
      .reply(404, '');
    await expect(pageLoader('http:/my.url/not-exist-page', tmpDirPath)).rejects.toThrow();
  });

  test('output path not exist', async () => {
    nock(baseUrl)
      .get(pagePath)
      .reply(200, 'data');

    await expect(pageLoader(pageUrl, 'notExixstPath')).rejects.toThrow('no such file or directory');
  });
});
