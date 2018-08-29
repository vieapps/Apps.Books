import * as Rx from "rxjs";
import { map } from "rxjs/operators";
import { CompleterData, CompleterItem } from "ng2-completer";
import { AppAPI } from "./app.api";
import { AppUtility } from "./app.utility";

/** Custom searching service of ng-completer */
export class AppCustomCompleter extends Rx.Subject<CompleterItem[]> implements CompleterData {

	constructor(
		public onRequest: (term: string) => string,
		public onConvert: (data: any) => Array<CompleterItem>,
		public onCancel?: () => void
	) {
		super();
	}

	private _rxSubscriptions = new Array<Rx.Subscription>();

	public search(term: string) {
		this._rxSubscriptions.push(AppAPI.get(this.onRequest(term)).pipe(map(response => response.json())).subscribe(
			data => this.next(this.onConvert(data)),
			error => console.error("[Custom Completer]: Error occurred while fetching remote data => " + AppUtility.getErrorMessage(error), error)
		));
	}

	public cancel() {
		if (this.onCancel !== undefined) {
			this.onCancel();
		}
		this._rxSubscriptions.forEach(subscription => subscription.unsubscribe());
	}
}
