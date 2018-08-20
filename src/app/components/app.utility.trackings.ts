import { GoogleAnalytics } from "@ionic-native/google-analytics/ngx";
import { AppConfig } from "../app.config";
import { AppUtility } from "./app.utility";
import { PlatformUtility } from "./app.utility.platform";

/** Servicing component for tracking use of app */
export class TrackingUtility {

	private static _ga: GoogleAnalytics = undefined;

	/** Sets the object of Google Analytics */
	public static initialize(ga?: GoogleAnalytics) {
		if (this._ga === undefined && ga !== undefined && AppUtility.isNotEmpty(AppConfig.tracking.google)) {
			this._ga = ga;
			this._ga.startTrackerWithId(AppConfig.tracking.google)
				.then(() => {
					this._ga.setAppVersion(AppConfig.app.version);
					PlatformUtility.showLog("[Tracking]: Google Analytics is ready now...", AppConfig.isDebug ? this._ga : "");
				})
				.catch(error => {
					PlatformUtility.showError("[Tracking]: Error occurred while initializing Google Analytics", error);
					this._ga = undefined;
				});
		}
	}

	/** Tracks a view of an app page/screen */
	public static async trackAsync(title?: string, path?: string, params?: any) {
		// Google Analytics
		if (this._ga !== undefined) {
			await this._ga.trackView(title || AppConfig.app.name, path || "/");
		}
	}

}
