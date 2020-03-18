import { GoogleAnalytics } from "@ionic-native/google-analytics/ngx";
import { AppConfig } from "../app.config";
import { AppUtility } from "./app.utility";

/** Servicing component for tracking use of app */
export class TrackingUtility {

	private static _googleAnalytics: GoogleAnalytics = undefined;

	/** Initializes the tracking objects (Google Analytics, Facebook, ...) */
	public static async initializeAsync(googleAnalytics?: GoogleAnalytics) {
		const promises = new Array<Promise<void>>();
		// Google Analytics
		if (this._googleAnalytics === undefined && googleAnalytics !== undefined && AppConfig.tracking.google.length > 0) {
			this._googleAnalytics = googleAnalytics;
			AppConfig.tracking.google.forEach(googleID => {
				promises.push(this._googleAnalytics.startTrackerWithId(googleID, 15).then(
					() => {
						this._googleAnalytics.setAppVersion(AppConfig.app.version);
						console.log(`[Tracking]: Google Analytics [${googleID}] is ready now...`);
					},
					error => {
						console.error(`[Tracking]: Error occurred while initializing Google Analytics [${googleID}] => ${AppUtility.getErrorMessage(error)}`);
						this._googleAnalytics = undefined;
					}
				));
			});
		}
		await Promise.all(promises);
	}

	/** Tracks a view of an app page/screen */
	public static async trackAsync(title?: string, path?: string) {
		// Google Analytics
		if (this._googleAnalytics !== undefined) {
			try {
				await this._googleAnalytics.trackView(title || AppConfig.app.name, path || (AppConfig.url.stack.length > 0 ? AppConfig.url.stack[AppConfig.url.stack.length - 1].url : "/"));
			}
			catch (error) {
				console.error(`[Tracking]: Error occurred while tracking a screen view with Google Analytics => ${AppUtility.getErrorMessage(error)}`, error);
			}
		}
	}

}
