import * as Collections from "typescript-collections";
import { AppUtility } from "../components/app.utility";

/** Privilege of an individual business service */
export class Privilege {
	ServiceName = "";
	ObjectName = "";
	ObjectIdentity = "";
	Role = "";
	Actions = new Array<string>();

	public static deserialize(json: any, privilege?: Privilege) {
		privilege = privilege || new Privilege();
		AppUtility.copy(json, privilege);
		return privilege;
	}
}

/** Privilege of an individual business object */
export class Privileges {
	DownloadableRoles = new Collections.Set<string>();
	DownloadableUsers = new Collections.Set<string>();
	ViewableRoles = new Collections.Set<string>();
	ViewableUsers = new Collections.Set<string>();
	ContributiveRoles = new Collections.Set<string>();
	ContributiveUsers = new Collections.Set<string>();
	EditableRoles = new Collections.Set<string>();
	EditableUsers = new Collections.Set<string>();
	ModerateRoles = new Collections.Set<string>();
	ModerateUsers = new Collections.Set<string>();
	AdministrativeRoles = new Collections.Set<string>();
	AdministrativeUsers = new Collections.Set<string>();

	public static deserialize(json: any, privileges?: Privileges) {
		privileges = privileges || new Privileges();
		Object.getOwnPropertyNames(privileges).forEach(property => {
			const data = json[property];
			if (AppUtility.isArray(data, true)) {
				const set = new Collections.Set<string>();
				(data as Array<string>).forEach(o => set.add(o));
				privileges[property] = set;
			}
		});
		return privileges;
	}
}
