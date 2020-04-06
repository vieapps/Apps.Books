import { Subject, Subscription } from "rxjs";
import { CompleterData, CompleterItem } from "ng2-completer";
import { AppXHR } from "./app.apis";
import { AppUtility } from "./app.utility";

/** Custom searching service of ng-completer */
export class AppCustomCompleter extends Subject<CompleterItem[]> implements CompleterData {

	constructor(
		private onSearch: (term: string) => string,
		private onConvertArrayOfItems?: (data: any) => CompleterItem[],
		private onConvertOneItem?: (data: any) => CompleterItem,
		private onCancel?: () => void
	) {
		super();
	}

	private subscription: Subscription;

	private cancelSearch() {
		if (this.subscription !== undefined) {
			this.subscription.unsubscribe();
			this.subscription = undefined;
		}
	}

	public search(term: string) {
		this.cancelSearch();
		this.subscription = AppXHR.get(this.onSearch(term)).subscribe(
			response => {
				const items = AppUtility.isArray(response, true)
					? (response as Array<any>).map(data => {
							return this.onConvertOneItem !== undefined
								? this.onConvertOneItem(data)
								: {
										title: data.toString(),
										originalObject: data
									} as CompleterItem;
						})
					: this.onConvertArrayOfItems !== undefined
						? this.onConvertArrayOfItems(response)
						: AppUtility.isArray(response["Objects"], true)
							? (response["Objects"] as Array<any>).map(data => {
									return this.onConvertOneItem !== undefined
										? this.onConvertOneItem(data)
										: {
												title: data.toString(),
												originalObject: data
											} as CompleterItem;
								})
							: [];
				this.next(items);
			},
			error => console.error(`[Custom Completer]: Error occurred while fetching remote data => ${AppUtility.getErrorMessage(error)}`, error)
		);
	}

	public cancel() {
		if (this.onCancel !== undefined) {
			this.onCancel();
		}
		this.cancelSearch();
	}

	public convertToItem(data: any) {
		return this.onConvertOneItem !== undefined
			? this.onConvertOneItem(data)
			: {
					title: data.toString(),
					originalObject: data
				} as CompleterItem;
	}

}
