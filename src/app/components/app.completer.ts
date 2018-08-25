import * as Rx from "rxjs";
import { map } from "rxjs/operators";
import { CompleterData, CompleterItem } from "ng2-completer";
import { AppAPI } from "./app.api";
import { PlatformUtility } from "./app.utility.platform";

/** Custom searching service of ng-completer */
export class AppCustomCompleter extends Rx.Subject<CompleterItem[]> implements CompleterData {
	private _rxSubscription: Rx.Subscription = undefined;

	constructor(
		public onBuildRequest: (term: string) => string,
		public onConvert: (data: any) => Array<CompleterItem>,
		public onCancel?: () => void
	) {
		super();
	}

	public search(term: string) {
		this._rxSubscription = AppAPI.get(this.onBuildRequest(term))
			.pipe(map(response => response.json()))
			.subscribe(data => this.onConvert(data), error => PlatformUtility.showError("[Custom Completer]: Error occurred while fetching remote data", error));
	}

	public cancel() {
		if (this.onCancel !== undefined) {
			this.onCancel();
		}
		this.destroy();
	}

	public destroy() {
		if (this._rxSubscription !== undefined) {
			this._rxSubscription.unsubscribe();
		}
	}
}
