import * as fsp from 'fs/promises';
import path from 'path';
import axios from 'axios';
import debug from 'debug';

/* eslint-disable-next-line */
import * as cheerio from 'cheerio';
import Listr from 'listr';

import { makeName, makeFileName } from './utils.js';

const tags = {
  img: 'src',
  link: 'href',
  script: 'src',
};

// DEBUG=page-loader page-loader --output tmp https://hexlet.io/courses

const log = debug('page-loader');

const makeLinks = (data, url, dir) => {
  const $ = cheerio.load(data);
  const localLinks = [];
  Object.entries(tags)
    .forEach(([tag, attr]) => {
      const tagEls = [...$(tag)];
      const tagLocalLinks = tagEls
        .filter((el) => $(el).attr(attr))
        .map((el) => {
          const fileUrl = new URL($(el).attr(attr), url.origin);
          return { el, fileUrl };
        })
        .filter(({ fileUrl }) => fileUrl.origin === url.origin);

      tagLocalLinks.forEach(({ el, fileUrl }) => {
        const fileName = makeFileName(fileUrl);
        localLinks.push({ fileName, fileUrl });
        $(el).attr(attr, `${dir}/${fileName}`);
      });
    });

  return { html: $.html(), localLinks };
};

const handleLinks = (links, filesDirPath) => {
  const tasks = links.map((link) => {
    const url = link.fileUrl.toString();
    const filePath = path.join(filesDirPath, link.fileName);
    return {
      title: `Downloading - ${url}`,
      task: () => axios.get(url, { responseType: 'arraybuffer' })
        .then(({ data }) => fsp.writeFile(filePath, data)),
    };
  });

  return new Listr(tasks, { concurrent: true });
};

const pageLoader = (req, outputDir = process.cwd()) => {
  const reqUrl = new URL(req);
  const htmlFileName = makeName(reqUrl, 'html');
  const filesDirName = makeName(reqUrl, 'files');

  const htmlFilePath = path.resolve(outputDir, htmlFileName);
  const filesDirPath = path.resolve(outputDir, filesDirName);

  let neededLinks = null;

  return axios.get(req)
    .then((res) => {
      log('GET request -', reqUrl);
      log('Response answer code -', res.status);
      const { html, localLinks } = makeLinks(res.data, reqUrl, filesDirName);
      neededLinks = localLinks;
      log('Writing HTML file into -', htmlFilePath);
      return fsp.writeFile(htmlFilePath, html);
    })
    .then(() => {
      log('Make directory for assets -', filesDirPath);
      return fsp.mkdir(filesDirPath);
    })
    .then(() => {
      log('Downloading assets into -', filesDirPath);
      const tasks = handleLinks(neededLinks, filesDirPath);
      return tasks.run();
    })
    .then(() => ({ htmlFilePath }));
};

export default pageLoader;
