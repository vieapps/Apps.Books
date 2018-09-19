import { Set } from "typescript-collections";
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
	DownloadableRoles = new Set<string>();
	DownloadableUsers = new Set<string>();
	ViewableRoles = new Set<string>();
	ViewableUsers = new Set<string>();
	ContributiveRoles = new Set<string>();
	ContributiveUsers = new Set<string>();
	EditableRoles = new Set<string>();
	EditableUsers = new Set<string>();
	ModerateRoles = new Set<string>();
	ModerateUsers = new Set<string>();
	AdministrativeRoles = new Set<string>();
	AdministrativeUsers = new Set<string>();

	public static deserialize(json: any, privileges?: Privileges) {
		privileges = privileges || new Privileges();
		Object.getOwnPropertyNames(privileges).forEach(property => {
			const data = json[property];
			if (AppUtility.isArray(data, true)) {
				const set = new Set<string>();
				(data as Array<string>).forEach(o => set.add(o));
				privileges[property] = set;
			}
		});
		return privileges;
	}
}
