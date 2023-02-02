import { promises as fsp } from 'fs';
import path from 'path';
import axios from 'axios';

const loader = async (url, outputDir) => {
  const filepath = path.resolve(outputDir);
  const response = await axios.get(url);

  fsp
    .writeFile(filepath, JSON.stringify(response.data))
    .then(() => console.log('файл записан'))
    .catch(console.log);
};

export default loader;
