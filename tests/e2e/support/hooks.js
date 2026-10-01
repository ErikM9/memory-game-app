import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import httpServer from 'http-server';
import puppeteer from 'puppeteer';

const SCREENSHOT_DIR = path.join('tests', 'e2e', 'screenshots');

let server;
let baseUrl;
let browser;
let context;
let page;

/* Serves src/ on a free port so the suite never needs a separately started dev server */
export async function mochaGlobalSetup() {
  server = httpServer.createServer({ root: 'src', cache: -1 });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.server.address().port}`;
}

export async function mochaGlobalTeardown() {
  await new Promise(resolve => server.server.close(resolve));
}

export const mochaHooks = {
  async beforeAll() {
    browser = await puppeteer.launch({
      browser: process.env.PUPPETEER_BROWSER || 'chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  },

  /* Failing tests leave a full-page screenshot behind, which the CI workflow uploads as an artifact */
  async afterEach() {
    if (this.currentTest.state === 'failed' && page) {
      await mkdir(SCREENSHOT_DIR, { recursive: true });
      const fileName = this.currentTest.fullTitle().replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${fileName}.png`), fullPage: true });
    }
    await closeContext();
  },

  async afterAll() {
    await browser?.close();
  }
};

export function getBaseUrl() {
  return baseUrl;
}

/* Each call starts a fresh browser context, so cookies, storage and viewport never leak from one test to the next */
export async function newPage(viewport) {
  await closeContext();
  context = await browser.createBrowserContext();
  page = await context.newPage();
  await page.setViewport(viewport);
  await blockThirdPartyRequests(page);
  return page;
}

async function closeContext() {
  await context?.close();
  context = undefined;
  page = undefined;
}

/* Requests that leave the local server, such as Google Fonts, are aborted so results never depend on an outside service */
async function blockThirdPartyRequests(targetPage) {
  await targetPage.setRequestInterception(true);
  targetPage.on('request', request => {
    if (request.url().startsWith(baseUrl)) request.continue();
    else request.abort();
  });
}