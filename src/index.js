import * as fsp from 'fs/promises';
import path from 'path';
import axios from 'axios';
/* eslint-disable-next-line */
import * as cheerio from 'cheerio';

import { makeName, makeFileName } from './utils.js';

const tags = {
  img: 'src',
};

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

const pageLoader = (req, outputDir = process.cwd()) => {
  const reqUrl = new URL(req);
  const htmlFileName = makeName(reqUrl, 'html');
  const filesDirName = makeName(reqUrl, 'files');

  const htmlFilePath = path.resolve(outputDir, htmlFileName);
  const filesDirPath = path.resolve(outputDir, filesDirName);

  let neededLinks = null;

  return axios.get(req)
    .then(({ data }) => {
      const { html, localLinks } = makeLinks(data, reqUrl, filesDirName);
      neededLinks = localLinks;
      return fsp.writeFile(htmlFilePath, html);
    })
    .then(() => fsp.mkdir(filesDirPath))
    .then(() => {
      const link = neededLinks[0];
      const url = link.fileUrl.toString();
      const filePath = path.join(filesDirPath, link.fileName);
      return axios.get(url, { responseType: 'arraybuffer' })
        .then(({ data }) => fsp.writeFile(filePath, data));
    })
    .then(() => ({ htmlFilePath }));
};

export default pageLoader;
