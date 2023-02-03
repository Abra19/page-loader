import * as fsp from 'fs/promises';
import path from 'path';
import axios from 'axios';

const loader = async (url, outputDir) => {
  const index = url.indexOf('//');
  const filePathTemplate = index === -1 ? url : url.slice(index + 2);
  const fileBase = filePathTemplate.split('').map((el) => (el.match(/[A-z]/g) ? el : '-')).join('');
  const format = '.html';
  const filename = `${fileBase}${format}`;
  const filepath = path.resolve(outputDir, filename);
  const response = await axios.get(url);
  await fsp.writeFile(filepath, JSON.stringify(response.data));
  return { filepath };
};

export default loader;
