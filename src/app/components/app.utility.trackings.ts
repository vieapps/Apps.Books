import { GoogleAnalytics } from "@ionic-native/google-analytics/ngx";
import { AppConfig } from "../app.config";
import { AppUtility } from "./app.utility";

/** Servicing component for tracking use of app */
export class TrackingUtility {

	private static _ga: GoogleAnalytics = undefined;

	/** Initializes the tracking objects (Google Analytics, Facebook, ...) */
	public static initializeAsync(ga?: GoogleAnalytics) {
		const promises = new Array<Promise<void>>();
		// Google Analytics
		if (this._ga === undefined && ga !== undefined && AppUtility.isNotEmpty(AppConfig.tracking.google)) {
			this._ga = ga;
			promises.push(this._ga.startTrackerWithId(AppConfig.tracking.google)
				.then(() => {
					this._ga.setAppVersion(AppConfig.app.version);
					console.log("[Tracking]: Google Analytics is ready now...", AppConfig.isDebug ? this._ga : "");
				})
				.catch(error => {
					console.error("[Tracking]: Error occurred while initializing Google Analytics => " + AppUtility.getErrorMessage(error));
					this._ga = undefined;
				})
			);
		}
		return Promise.all(promises);
	}

	/** Tracks a view of an app page/screen */
	public static async trackAsync(title?: string, path?: string) {
		// Google Analytics
		if (this._ga !== undefined) {
			await this._ga.trackView(title || AppConfig.app.name, path || "/");
		}
	}

}
