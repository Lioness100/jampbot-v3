import { chromium } from 'playwright';
import { MessageAttachment } from 'discord.js';
import { Buffer } from 'node:buffer';

export class WizulusLevelViewerService extends null {
	public static readonly baseURL = new URL('https://smm2.wizul.us/smm2/level/');

	public static async getLevelPreviews(code: string) {
		const url = new URL(code, this.baseURL);

		const browser = await chromium.launch();
		const page = await browser.newPage();

		await page.goto(url.toString(), { waitUntil: 'networkidle' });

		await page.waitForSelector('button > span:nth-child(2) > span:nth-child(2)');
		const [, overworld, subworld] = await page.$$('button > span:nth-child(2) > span:nth-child(2)');

		const overworldDownloadPromise = page.waitForEvent('download');
		await overworld.click();
		const overworldDownload = await overworldDownloadPromise;

		const subworldDownloadPromise = page.waitForEvent('download');
		await subworld.click();
		const subworldDownload = await subworldDownloadPromise;

		await browser.close();

		return [
			new MessageAttachment(Buffer.from(overworldDownload.url().split(',')[1], 'base64'), overworldDownload.suggestedFilename()),
			new MessageAttachment(Buffer.from(subworldDownload.url().split(',')[1], 'base64'), subworldDownload.suggestedFilename())
		];
	}
}
