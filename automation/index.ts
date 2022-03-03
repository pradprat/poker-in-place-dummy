import * as puppeteer from "puppeteer";

// ab7cc2fc-3a48-4f6f-bac1-e9a5c7ed103a
const START_URL = "http://localhost:3000";
// const START_URL = "https://poker-in-place-stage.web.app/";
const PLAYER_COUNT = 2;

async function sleep(timeInMs) {
  return new Promise((resolve) => setTimeout(resolve, timeInMs));
}

let browser;
let pause = false;
(async () => {
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const organizerPage = await browser.newPage();
    let url;
    try {
      url = await script({ page: organizerPage });
    } catch (e) {
      return;
    }
    const actions = [];
    const timestamp = new Date().getTime();
    for (var i = 0; i < PLAYER_COUNT; ++i) {
      actions.push(launchPlayer({ url, name: `${timestamp}-${i}` }));
    }
    const playerPages = await Promise.all(actions);

    await sleep(2500);
    console.log(0);
    // await organizerPage.click(`button[data-pup="tournament-primary-action"]`);
    // console.log(0.1);

    // const startElement = await organizerPage.$(
    //   `button[data-pup="prompt-primary"]`
    // );
    // console.log(1, startElement);
    await organizerPage.waitForSelector(
      'button[data-pup="tournament-primary-action"]'
    );
    console.log(2);
    // console.log(startElement);
    // const attr = (await organizerPage.evaluate(
    //   (el) => el.getAttribute("data-pup"),
    //   startElement
    // )) as string;

    organizerPage.evaluate((_) => {
      console.log(window);
      // @ts-ignore
      window._onStart();
    });
    await sleep(15000);

    // console.log({ attr });
    // startElement.click();

    // await organizerPage.click(`button.MuiButton-containedPrimary`);
    // await organizerPage.waitForSelector(`button.MuiButton-textPrimary`);
    // await organizerPage.click(`button.MuiButton-textPrimary`);
    // Launch the players...
    try {
      await Promise.race(
        playerPages
          .filter((p) => p)
          .map(({ page, name }) => playPlayerPlay({ page, name }))
      );
    } finally {
      await Promise.all(
        playerPages
          .filter((p) => p)
          .map(({ browser }) => {
            try {
              browser.close();
            } catch (e) {
              console.error(e);
              throw e;
            }
          })
      );
    }
  } catch (e) {
    console.error(e);
  }
  browser.close();
})();

const playPlayerPlay = async ({
  page,
  name,
}: {
  page: puppeteer.Page;
  name: string;
}) => {
  try {
    page
      .on("console", (message) =>
        console.log(
          `${name} - ${message
            .type()
            .substr(0, 3)
            .toUpperCase()} ${message.text()}`
        )
      )
      .on("pageerror", ({ message }) => console.log(message))
      .on("response", async (response) =>
        console.log(
          `${name} - ${response.status()} ${response.url()} ${
            response.url().indexOf("respond") >= 0
              ? await response.text().catch(() => {})
              : ""
          } - ${response.request().postData()}`
        )
      )
      .on("requestfailed", (request) =>
        console.log(`${name} - ${request.failure().errorText} ${request.url()}`)
      );
    // Go through 10 actions
    for (let i = 0; i < 10; i++) {
      if (pause) {
        await sleep(1000 * 60 * 10);
      }
      const start = new Date().getTime();
      // await sleep(1000);
      // await page.screenshot({ path: `./${name}.${new Date().getTime()}.png` });
      try {
        await page.waitForSelector(`.options  div[role=button]`, {
          timeout: 70000,
        });
      } catch (e) {
        console.log("xxxxxxxx", name, "oh dear");
        await page.screenshot({ path: `./${name}.final.png` });
        pause = true;
        await sleep(1000 * 60 * 10);
      }
      console.log(new Date().getTime() - start);
      const elements = await page.$$(".options div[role=button]");
      console.log({ elements });
      const elementsWithAttributes = await Promise.all(
        elements.map(async (element) => {
          const action = (await page.evaluate(
            (el) => el.getAttribute("data-pup"),
            element
          )) as string;
          return { element, action };
        })
      );
      console.log({ elementsWithAttributes });
      if (elementsWithAttributes.length > 0) {
        const callAction = elementsWithAttributes.find(
          (x) => x.action === "action-call"
        );
        const checkAction = elementsWithAttributes.find(
          (x) => x.action === "action-check"
        );
        const allinAction = elementsWithAttributes.find(
          (x) => x.action === "action-all-in"
        );
        if (callAction) {
          await callAction.element.click();
        } else if (checkAction) {
          await checkAction.element.click();
        } else if (allinAction) {
          await allinAction.element.click();
        } else {
          await elements[0].click();
        }
        // Make sure it goes away
        await page.waitFor(
          () => !document.querySelector(".options div[role=button]"),
          {
            timeout: 10000,
          }
        );
      } else {
        console.log("yyyyyy", name, "no elements?");
      }
    }
    // await page.screenshot({ path: `./${name}.${new Date().getTime()}.png` });
  } catch (e) {
    console.error("zzzzzzzz", name, e);
  }
  console.log("qqqqqqq", "done");
};

const launchPlayer = async ({ url, name }: { url: string; name: string }) => {
  const browser = await (PLAYER_COUNT > 10
    ? puppeteer.connect({
        browserWSEndpoint:
          "wss://chrome.browserless.io/?token=ab7cc2fc-3a48-4f6f-bac1-e9a5c7ed103a",
      })
    : puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        // devtools: true,
      }));
  try {
    const page = await browser.newPage();
    // const playerName = `${new Date().getTime()}.${Math.random()}`;
    await page.goto(url);
    await page.waitForSelector('button[data-pup="sign-in-anonymously"]');
    await page.click('button[data-pup="sign-in-anonymously"]');
    console.log({ name });
    await page.type("input[type=text]", name);
    await Promise.all([
      page.waitForNavigation(),
      page.click("button.MuiButton-textPrimary"),
      // page.waitForSelector('button[data-pup="close-onboarding"]'),
    ]);
    console.log(1, `div[data-pup="player-tile-*"]`);
    await page.goto(url);
    // await page.click('button[data-pup="close-onboarding"]');
    // await page.waitForSelector(`div[data-pup="player-tile-*"]`);
    await sleep(1000);
    console.log(2);
    return { browser, page, name };
  } catch (e) {
    console.error(e);
    browser.close();
    return null;
  }
};

const script = async ({ page }: { page: puppeteer.Page }) => {
  await page.goto(START_URL, { waitUntil: "networkidle0" });
  // await page.click('button.MuiButton-containedPrimary');
  console.log("Login");
  // const [response] = await Promise.all([
  //   // page.waitForNavigation(), // The promise resolves after navigation has finished
  //   page.click('a[data-pup="login"]'), // Clicking the link will indirectly cause a navigation
  // ]);
  const element = await page.waitForSelector('a[data-pup="login"]');
  // await element.click({ delay: 500 });
  await page.goto(`${START_URL}/login`, { waitUntil: "networkidle0" });
  console.log("Anonymous");
  await page.click('button[data-pup="sign-in-anonymously"]');
  await page.type(
    "input[type=text]",
    `${new Date().getTime()}.${Math.random()}`
  );
  console.log("xxx", 0);
  await page.click("button.MuiButton-textPrimary");
  console.log("xxx", 0.1);
  await page.waitForNavigation({ waitUntil: "networkidle0" });
  console.log("xxx", 0.2);
  await page.goto(`${START_URL}/profile?enableFeature=MULTI_TABLE`);
  console.log("xxx", 1);
  await Promise.all([
    // page.waitForNavigation({ waitUntil: "networkidle0" }),
    page.waitForSelector('button[data-pup="create-new-game"]'),
  ]);
  console.log("xxx", 2);
  // await page.click('button[data-pup="create-new-game"]');
  await page.goto(`${START_URL}/create`);

  console.log("xxx", 3);
  await Promise.all([
    page.waitForSelector('label[data-pup="gametype-multi-table-tournament"]'),
  ]);
  console.log("xxx", 4);
  await page.click('label[data-pup="gametype-multi-table-tournament"]');
  await page.click('button[data-pup="creategameflow-next"]');
  await page.click('label[data-pup="gamemode-multi-table-tournament"]');
  await page.click('button[data-pup="creategameflow-next"]');
  await page.click('button[data-pup="creategameflow-next"]');
  await page.click('button[data-pup="creategameflow-next"]');
  await Promise.all([
    page.waitForNavigation(),
    page.waitForSelector(".copy-link"),
  ]);
  const url = await page.url().replace("/organizer", "?join");
  console.log(url);
  return url;
};
