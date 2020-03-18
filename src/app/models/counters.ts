import { AppUtility } from "../components/app.utility";

/** Based-Counter information */
export class CounterBase {

	constructor(
		type?: string,
		total?: number
	) {
		if (AppUtility.isNotEmpty(type) && total !== undefined) {
			this.Type = type;
			this.Total = total;
		}
	}

	Type = "";
	Total = 0;

	public static deserialize(json: any, counter?: CounterBase) {
		counter = counter || new CounterBase();
		AppUtility.copy(json, counter);
		return counter;
	}

}

/** Counter information */
export class CounterInfo extends CounterBase {

	constructor(
		type?: string,
		total?: number
	) {
		super(type, total);
	}

	LastUpdated = new Date();
	Month = 0;
	Week = 0;

	public static deserialize(json: any, counter?: CounterInfo) {
		counter = counter || new CounterInfo();
		AppUtility.copy(json, counter);
		return counter;
	}

}
