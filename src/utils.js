import * as fsp from 'fs/promises';
import path from 'path';

const mapForNames = {
  html: '.html',
  files: '_files',
};

const formatName = (name) => name.split(/[^А-яA-z0-9]/g).filter((i) => i).join('-');

export const makeName = (url, type) => {
  const newName = formatName(`${url.host}${url.pathname}`);
  return `${newName}${mapForNames[type]}`;
};

export const makeFileName = (url) => {
  const { dir, name, ext } = path.parse(url.pathname);
  const newName = formatName(`${url.hostname}/${dir}/${name}`);
  return ext ? `${newName}${ext}` : `${newName}.html`;
};

export const readFile = (pathName, fileName = '', encoding = null) => {
  const file = fsp.readFile(path.resolve(pathName, fileName), encoding);
  return file;
};
