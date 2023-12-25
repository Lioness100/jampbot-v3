import { chromium } from 'playwright';
import { MessageAttachment } from 'discord.js';

export class WizulusLevelViewerService extends null {
	public static readonly baseURL = new URL('https://smm2.wizul.us/smm2/level/');

	public static async getLevelPreviews(code: string) {
		const url = new URL(code, this.baseURL);
		console.log(url.toString());
		const browser = await chromium.launch();
		const page = await browser.newPage();

		await page.goto(url.toString(), { waitUntil: 'networkidle' });

		await page.waitForSelector('button > span:nth-child(2) > span:nth-child(2)');
		const [, overworld, subworld] = await page.$$('button > span:nth-child(2) > span:nth-child(2)');

		const overWorldDownloadPromise = page.waitForEvent('download');
		await overworld.click();
		const overWorldDownload = await overWorldDownloadPromise;

		const subWorldDownloadPromise = page.waitForEvent('download');
		await subworld.click();
		const subWorldDownload = await subWorldDownloadPromise;

		await browser.close();

		return [
			new MessageAttachment(overWorldDownload.url(), overWorldDownload.suggestedFilename()),
			new MessageAttachment(subWorldDownload.url(), subWorldDownload.suggestedFilename())
		];
	}
}
