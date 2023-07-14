import fs from 'fs';

import * as cheerio from 'cheerio';
import { PackageJson } from 'type-fest';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8')) as PackageJson;

const getURL = (name: string, version: string) => {
  return `https://www.npmjs.com/package/${name}/v/${version}`;
};

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const getDate = async (packageURL: string) => {
  try {
    const resp = await fetch(packageURL, { redirect: 'error' });
    const packageInfo = await resp.text();
    const $ = cheerio.load(packageInfo);
    return $('time:first').attr('datetime');
  } catch (e) {
    return
  }
};

type PackageInfo = {
  packageName: string;
  datetime: string;
};

void (async () => {
  const packageDate: PackageInfo[] = [];
  for (const dependency in packageJson.dependencies) {
    const version = packageJson.dependencies[dependency]
    if (version) {
      const exactVersion = version.replace('^', '');
      const packageURL = getURL(dependency, exactVersion);
      const datetime = await getDate(packageURL);
      if (datetime) {
        packageDate.push({
          packageName: dependency,
          datetime,
        });
      }
      await sleep(1000);
    }
  }
  packageDate.sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
  );
  fs.writeFileSync(
    'result.json',
    JSON.stringify(packageDate, null, 4),
    'utf-8',
  );
})();
