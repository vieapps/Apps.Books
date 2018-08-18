import { AppUtility } from "../components/app.utility";

/** Based-Counter information */
export class CounterBase {
	Type = "";
	Total = 0;

	constructor(type?: string, total?: number) {
		if (AppUtility.isNotEmpty(type) && total !== undefined) {
			this.Type = type;
			this.Total = total;
		}
	}

	public static deserialize(json: any) {
		const obj = new CounterBase();
		AppUtility.copy(json, obj);
		return obj;
	}
}

/** Counter information */
export class CounterInfo extends CounterBase {
	LastUpdated = new Date();
	Month = 0;
	Week = 0;

	public static deserialize(json: any, obj?: CounterInfo) {
		obj = obj || new CounterInfo();
		AppUtility.copy(json, obj);
		return obj;
	}
}
