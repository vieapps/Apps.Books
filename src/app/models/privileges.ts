import { Set } from "typescript-collections";
import { AppUtility } from "../components/app.utility";

/** Working privileges of an individual business service */
export class Privilege {

	constructor(
		serviceName?: string,
		objectName?: string,
		role?: string
	) {
		if (AppUtility.isNotEmpty(serviceName)) {
			this.ServiceName = serviceName;
			if (AppUtility.isNotEmpty(objectName)) {
				this.ObjectName = objectName;
			}
			if (AppUtility.isNotEmpty(role)) {
				this.Role = role;
			}
		}
	}

	ServiceName = "";
	ObjectName = "";
	ObjectIdentity = "";
	Role = "Viewer";
	Actions = new Array<string>();

	/** Gets the collection of privilege roles */
	public static get privilegeRoles() {
		return ["Administrator", "Moderator", "Editor", "Contributor", "Viewer"];
	}

	/** Gets the collection of system roles */
	public static get systemRoles() {
		return ["All", "Authorized", "SystemAdministrator"];
	}

	/** Deserializes data to object */
	public static deserialize(json: any, privilege?: Privilege) {
		privilege = privilege || new Privilege();
		AppUtility.copy(json, privilege);
		return privilege;
	}

}

/** Working privileges of an individual business object */
export class Privileges {

	constructor(
		visitorCanView: boolean = false
	) {
		if (visitorCanView) {
			this.ViewableRoles.add("All");
		}
	}

	AdministrativeRoles = new Set<string>();
	AdministrativeUsers = new Set<string>();
	ModerateRoles = new Set<string>();
	ModerateUsers = new Set<string>();
	EditableRoles = new Set<string>();
	EditableUsers = new Set<string>();
	ContributiveRoles = new Set<string>();
	ContributiveUsers = new Set<string>();
	ViewableRoles = new Set<string>();
	ViewableUsers = new Set<string>();
	DownloadableRoles = new Set<string>();
	DownloadableUsers = new Set<string>();

	/** Gets the collection of privilege section names */
	public static get sections() {
		return ["Administrative", "Moderate", "Editable", "Contributive", "Viewable", "Downloadable"];
	}

	/** Deserializes data to object */
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

	/** Gets the arrays of privileges */
	public static getPrivileges(privileges: Privileges, sections?: Array<string>) {
		privileges = privileges || new Privileges();
		const arraysOfPrivileges: { [key: string]: Array<string> } = {};
		(sections || this.sections).forEach(section => {
			arraysOfPrivileges[`${section}Roles`] = AppUtility.getArray(privileges[`${section}Roles`]);
			arraysOfPrivileges[`${section}Users`] = AppUtility.getArray(privileges[`${section}Users`]);
		});
		return arraysOfPrivileges;
	}

	/** Resets the privileges from the arrays of privileges */
	public static resetPrivileges(privileges: Privileges, arraysOfPrivileges: { [key: string]: Array<string> }) {
		privileges = privileges || new Privileges();
		arraysOfPrivileges = arraysOfPrivileges || {};
		this.sections.forEach(section => {
			privileges[`${section}Roles`] = AppUtility.toSet(arraysOfPrivileges[`${section}Roles`]);
			privileges[`${section}Users`] = AppUtility.toSet(arraysOfPrivileges[`${section}Users`]);
		});
		return privileges;
	}

	/** Gets the collection of roles */
	public getRoles(section: string) {
		return (AppUtility.isNotEmpty(section) ? this[`${section}Roles`] as Set<string> : undefined) || new Set<string>();
	}

	/** Gets the collection of users */
	public getUsers(section: string) {
		return (AppUtility.isNotEmpty(section) ? this[`${section}Users`] as Set<string> : undefined) || new Set<string>();
	}

	private isEmpty(roles: Set<string>, users: Set<string>) {
		return (roles === undefined || roles.size() < 1) && (users === undefined || users.size() < 1);
	}

	/** Gets the state that determines is inherit from parent or not */
	public get isInheritFromParent() {
		return this.isEmpty(this.AdministrativeRoles, this.AdministrativeUsers)
			&& this.isEmpty(this.ModerateRoles, this.ModerateUsers)
			&& this.isEmpty(this.EditableRoles, this.EditableUsers)
			&& this.isEmpty(this.ContributiveRoles, this.ContributiveUsers)
			&& this.isEmpty(this.ViewableRoles, this.ViewableUsers)
			&& this.isEmpty(this.DownloadableRoles, this.DownloadableUsers);
	}

}
