import * as Rx from "rxjs";
import { map } from "rxjs/operators";
import { CompleterData, CompleterItem } from "ng2-completer";
import { AppAPI } from "./app.api";

/** Custom searching service of ng-completer */
export class CompleterCustomSearch extends Rx.Subject<CompleterItem[]> implements CompleterData {
	private _subscription: Rx.Subscription = undefined;

	constructor(
		public buildRequest: (term: string) => string,
		public doConvert: (data: any) => CompleterItem[],
		public doCancel?: () => void
	) {
		super();
	}

	public search(term: string) {
		this._subscription = AppAPI.get(this.buildRequest(term))
			.pipe(map(response => this.next(this.doConvert(response.json()))))
			.subscribe();
	}

	public cancel() {
		if (this.doCancel !== undefined) {
			this.doCancel();
		}
		this.destroy();
	}

	public destroy() {
		if (this._subscription) {
			this._subscription.unsubscribe();
		}
	}
}
