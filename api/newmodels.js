const puppeteer = require('puppeteer');

const database = require('./database.js');

async function scrapeResources(page) {
  const columns = await page.$('.columns');
  const items = await columns.$$('.showcase-item');
  const resources = await Promise.all(items.map(i => parseResource(i, '.showcase-link', 'h3')));
  const feature = await parseResource(await page.$('.feature'), 'a', 'h1');
  return resources.concat([feature]).filter(r => r.label && r.source);
}

function parseLabel(innerHTML) {
  return innerHTML
    .replace('<mark>', '')
    .replace('</mark>', '')
    .trim();
}

async function parseResource(resource, sourceSelector, labelSelector) {
  const source = await resource.$eval(sourceSelector, node => node.getAttribute('href'));
  const label = await resource.$eval(labelSelector, node =>
    node.innerHTML
      .replace('<mark>', '')
      .replace('</mark>', '')
      .trim()
  );

  const isEmbededCode = label[0] === '<' && label[label.length - 1] === '>';
  return { label: isEmbededCode ? source : label, source };
}

async function getResources() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://newmodels.io', { waitUntil: 'networkidle2' });

  const resources = await scrapeResources(page);
  await browser.close();

  return resources;
}

module.exports = async function main() {
  const connection = database.makeConnection();

  const resources = await getResources();
  console.log(`found ${resources.length} resources`);

  await Promise.all(
    resources.map(resource => database.addResource(connection, resource.label, resource.source))
  )
    .then(() => console.log('populated outstanding resources with no errors'))
    .catch(err => console.log(`failed to populate outstanding resources: ${err}`));
  connection.end();
};
