import * as fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import nock from 'nock';
import pageLoader from '../src/index.js';

nock.disableNetConnect();

const fixDirname = './__fixtures__';
const filename = 'ru-hexlet-io-courses.html';
const baseUrl = 'https://ru.hexlet.io';
const pagePath = '/courses';
const pageUrl = `${baseUrl}${pagePath}`;

let tmpDirPath = '';

beforeEach(async () => {
  tmpDirPath = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

describe('Loading File - positive', () => {
  test('correctly loading contain', async () => {
    const filepath = path.resolve(fixDirname, filename);
    const fileContent = await fsp.readFile(filepath, 'utf-8');
    nock(baseUrl)
      .get(pagePath)
      .reply(200, fileContent);
    const tmpPathName = path.join(tmpDirPath, filename);

    await pageLoader(pageUrl, tmpDirPath);
    const existContent = await fsp.readFile(tmpPathName, 'utf-8');

    expect(fileContent).toBe(existContent);
  });
});

describe('Loading File - negative', () => {
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
