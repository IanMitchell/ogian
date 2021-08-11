// Sourced from: https://www.contentful.com/blog/2021/03/17/puppeteer-node-open-graph-screenshot-for-socials/

const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const exePath =
  process.platform === 'linux'
    ? '/usr/bin/google-chrome'
    : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function getOptions(isDev = false) {
  if (isDev) {
    return {
      args: [],
      executablePath: exePath,
      headless: true,
    };
  }

  return {
    args: chrome.args,
    executablePath: await chrome.executablePath,
    headless: chrome.headless,
  };
}

module.exports = async (request, response) => {
  const isDev = request.query.isDev === 'true';
  const pageToScreenshot = request.query.page;

  try {
    const options = await getOptions(isDev);
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();

    await page.setViewport({
      width: 1200,
      height: 628,
      deviceScaleFactor: 1,
    });

    await page.goto(pageToScreenshot);

    const file = await page.screenshot({
      type: 'png',
    });

    await browser.close();

    response.statusCode = 200;
    response.setHeader('Content-Type', `image/png`);
    response.end(file);
  } catch (error) {
    response.statusCode = 500;
    response.json({
      error: error.message,
    });
  }
};
