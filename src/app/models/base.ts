import { Privileges } from "./privileges";
import { AppUtility } from "../components/app.utility";

/** Base of all model/entity classes */
export abstract class Base {

	abstract ID = "";
	Privileges: Privileges = undefined;

	/** Copys data from source (object or JSON) and fill into this objects" properties */
	public copy(source: any, onCompleted?: (data: any) => void) {
		AppUtility.copy(source, this, data => {
			if (AppUtility.isObject(data.Privileges, true)) {
				this.Privileges = Privileges.deserialize(data.Privileges);
			}
			if (AppUtility.isNotNull(onCompleted)) {
				onCompleted(data);
			}
		});
	}
}
