import { GoogleAnalytics } from "@ionic-native/google-analytics/ngx";
import { AppConfig } from "../app.config";
import { AppUtility } from "./app.utility";

/** Servicing component for tracking use of app */
export class TrackingUtility {

	private static _ga: GoogleAnalytics = undefined;

	/** Sets the object of Google Analytics */
	static initialize(ga?: GoogleAnalytics) {
		if (ga !== undefined && AppConfig.tracking.google !== "") {
			this._ga = ga;
			this._ga.startTrackerWithId(AppConfig.tracking.google)
				.then(() => {
					this._ga.setAppVersion(AppConfig.app.version);
					console.log("Google Analytics is ready now...", AppConfig.isDebug ? this._ga : "");
				})
				.catch(e => {
					console.error("Error occurred while starting Google Analytics", e);
					this._ga = undefined;
				});
		}
	}

	/** Tracks a view (page-view or screen view) */
	static track(title?: string, path?: string, params?: any) {
		// prepare url
		let url = "";
		if (AppUtility.isObject(params, true)) {
			for (const param in params) {
				url += (url !== "" ? "&" : "") + param + "=" + params[param];
			}
		}
		const uri = AppUtility.parseURI(window.location.href);
		url = uri.path + (AppUtility.isNotEmpty(path) ? path + "/" : "") + (uri.hash !== "" ? uri.hash + "&" : "#?") + url;

		// Google Analytics
		if (this._ga !== null) {
			this._ga.trackView(title || document.title, uri.protocol + uri.host + url);
		}
	}

}
