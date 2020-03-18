import { Subject, Subscription } from "rxjs";
import { CompleterData, CompleterItem } from "ng2-completer";
import { AppXHR } from "./app.apis";
import { AppUtility } from "./app.utility";

/** Custom searching service of ng-completer */
export class AppCustomCompleter extends Subject<CompleterItem[]> implements CompleterData {

	constructor(
		public onRequest: (term: string) => string,
		public onConvert: (data: any) => Array<CompleterItem>,
		public onCancel?: () => void
	) {
		super();
	}

	private _subscription: Subscription;

	private _unsubscribe() {
		if (this._subscription !== undefined) {
			this._subscription.unsubscribe();
			this._subscription = undefined;
		}
	}

	public search(term: string) {
		this._unsubscribe();
		this._subscription = AppXHR.get(this.onRequest(term)).subscribe(
			response => this.next(this.onConvert(response)),
			error => console.error(`[Custom Completer]: Error occurred while fetching remote data => ${AppUtility.getErrorMessage(error)}`, error)
		);
	}

	public cancel() {
		if (this.onCancel !== undefined) {
			this.onCancel();
		}
		this._unsubscribe();
	}
}
