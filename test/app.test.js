/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-env mocha */

'use strict';

const assert = require('assert');

const {
  DEBUG,
  Nock,
  TestBrowser,
  Setup,
} = require('./utils.js');
const { SidekickTest } = require('./SidekickTest.js');

/**
 * Specific tests for behaviour that only exists in the bookmarklet. All other tests are covered
 * in module.test.js.
 */
describe('Test sidekick bookmarklet only', () => {
  /** @type TestBrowser */
  let browser;

  before(async function before() {
    this.timeout(10000);
    browser = await TestBrowser.create();
  });

  after(async () => browser.close());

  let page;
  let nock;

  beforeEach(async () => {
    page = await browser.openPage();
    nock = new Nock();
  });

  afterEach(async () => {
    await browser.closeAllPages();
    nock.done();
  });

  it('Shows extension hint', async () => {
    nock.admin(new Setup('blog'));
    const { notification } = await new SidekickTest({
      browser,
      page,
    }).run();
    assert.ok(
      notification.message && notification.message.startsWith('Did you know that the Sidekick is also available'),
      'Did not show extension hint',
    );
  });

  it('Extension hint opens share URL and writes local storage', async () => {
    nock.admin(new Setup('blog'));
    nock('https://www.hlx.live')
      .get('/tools/sidekick/?giturl=https%3A%2F%2Fgithub.com%2Fadobe%2Fblog%2Ftree%2Fmain')
      .times(DEBUG ? 2 : 1) // when dev-tools are enabled, browser makes 2 requests.
      .reply(200, 'Share URL');

    const { popupOpened } = await new SidekickTest({
      browser,
      page,
      pre: (p) => p.evaluate(() => window.localStorage.removeItem('hlxSidekickExtensionHint')),
      post: (p) => p.evaluate(() => {
        const installButton = window.hlx.sidekick.shadowRoot
          .querySelector('.hlx-sk-overlay .modal button:first-of-type');
        installButton.click();
      }),
      waitPopup: 2000,
    }).run();
    const ts = await page.evaluate(() => window.localStorage.getItem('hlxSidekickExtensionHint'));
    assert.strictEqual(
      popupOpened,
      'https://www.hlx.live/tools/sidekick/?giturl=https%3A%2F%2Fgithub.com%2Fadobe%2Fblog%2Ftree%2Fmain',
      'Did not open share URL',
    );
    assert.ok(ts && ts * 1 > Date.now(), 'Did not write local storage');
  });

  it('Extension hint opens share URL', async () => {
    nock.admin(new Setup('blog'));
    nock('https://www.hlx.live')
      .get('/tools/sidekick/?giturl=https%3A%2F%2Fgithub.com%2Fadobe%2Fblog%2Ftree%2Fmain')
      .times(DEBUG ? 2 : 1) // when dev-tools are enabled, browser makes 2 requests.
      .reply(200, 'Share URL');

    const { popupOpened } = await new SidekickTest({
      browser,
      page,
      pre: (p) => p.evaluate(() => window.localStorage.removeItem('hlxSidekickExtensionHint')),
      post: (p) => p.evaluate(() => {
        const installButton = window.hlx.sidekick.shadowRoot
          .querySelector('.hlx-sk-overlay .modal button:first-of-type');
        installButton.click();
      }),
      waitPopup: 2000,
    }).run();
    assert.strictEqual(
      popupOpened,
      'https://www.hlx.live/tools/sidekick/?giturl=https%3A%2F%2Fgithub.com%2Fadobe%2Fblog%2Ftree%2Fmain',
      'Did not open share URL',
    );
  });
});
