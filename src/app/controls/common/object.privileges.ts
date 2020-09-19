import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, Input, Output, EventEmitter } from "@angular/core";
import { AppUtility } from "@components/app.utility";
import { AppFormsControl, AppFormsService, AppFormsLookupValue } from "@components/forms.service";
import { ConfigurationService } from "@services/configuration.service";
import { AuthenticationService } from "@services/authentication.service";
import { UsersService } from "@services/users.service";
import { Privilege, Privileges } from "@models/privileges";
import { UserProfile } from "@models/user";
import { UsersSelectorModalPage } from "./user.selector.modal.page";

@Component({
	selector: "control-object-privileges",
	templateUrl: "./object.privileges.html",
	styleUrls: ["./object.privileges.scss"]
})

export class ObjectPrivilegesControl implements OnInit, OnDestroy, AfterViewInit {

	constructor(
		public configSvc: ConfigurationService,
		private changeDetector: ChangeDetectorRef,
		private appFormsSvc: AppFormsService,
		private authSvc: AuthenticationService,
		private userSvc: UsersService
	) {
	}

	/** The form control that contains this control */
	@Input() private control: AppFormsControl;

	/** The privileges of the service */
	@Input() private privileges: Privileges;

	/** Set to 'false' to don't allow to inherit the privileges from parent (default is true) */
	@Input() private allowInheritFromParent: boolean;

	/** The information for working with roles selector (prepare name function, modal component, modal properties) */
	@Input() private rolesSelector: {
		/** The function to prepare the information of a role */
		prepare: (role: AppFormsLookupValue) => Promise<void>;

		/** The component to show as the modal to select role(s) */
		modalComponent: any;

		/** The properties of modal component to to select role(s) */
		modalComponentProperties: { [key: string]: any };
	};

	/** The event handler to run when the controls was initialized */
	@Output() init = new EventEmitter<ObjectPrivilegesControl>();

	/** The event handler to run when the control was changed */
	@Output() change = new EventEmitter();

	private current: Privileges;

	inheritFromParent = {
		allow: false,
		inherit: false
	};

	labels = {
		buttons: {
			add: "Add",
			delete: "Delete",
			ok: "OK",
			cancel: "Cancel"
		},
		inheritFromParent: "Inherit from parent",
		confirmDelete: "Are you sure you want to delete?",
		sections: {} as {
			[key: string]: {
				label: string;
				description: string;
				roles: string;
				users: string
			}
		}
	};

	initialized = false;
	sections = Privileges.sections;

	roles = {} as { [key: string]: Array<AppFormsLookupValue> };
	users = {} as { [key: string]: Array<AppFormsLookupValue> };

	selectedRoles = {} as { [key: string]: Array<string> };
	selectedUsers = {} as { [key: string]: Array<string> };

	ngOnInit() {
		this.inheritFromParent.allow = this.allowInheritFromParent !== undefined
			? AppUtility.isTrue(this.allowInheritFromParent)
			: this.control === undefined || this.control.Extras === undefined
				? true
				: this.control.Extras["AllowInheritFromParent"] !== undefined
					? AppUtility.isTrue(this.control.Extras["AllowInheritFromParent"])
					: this.control.Extras["allowInheritFromParent"] !== undefined
						? AppUtility.isTrue(this.control.Extras["allowInheritFromParent"])
						: true;
		this.inheritFromParent.inherit = this.inheritFromParent.allow && (AppUtility.isNull(this.privileges) || this.privileges.isInheritFromParent);
		this.privileges = this.privileges || new Privileges();

		if (this.rolesSelector === undefined) {
			this.rolesSelector = this.control !== undefined && this.control.Extras !== undefined
				? this.control.Extras["RolesSelector"] || this.control.Extras["rolesSelector"] || this.control.Extras["RoleSelector"] || this.control.Extras["roleSelector"] || {}
				: {};
		}
		if (this.rolesSelector.prepare === undefined && this.control !== undefined && this.control.Extras !== undefined) {
			this.rolesSelector.prepare = typeof this.control.Extras["PrepareRole"] === "function"
				? this.control.Extras["PrepareRole"]
				: typeof this.control.Extras["prepareRole"] === "function"
					? this.control.Extras["prepareRole"]
					: typeof this.control.Extras["PrepareRoleFunction"] === "function"
						? this.control.Extras["PrepareRoleFunction"]
						: typeof this.control.Extras["prepareRoleFunction"] === "function"
							? this.control.Extras["prepareRoleFunction"]
							: role => new Promise<void>(() => role.Label = role.Value);
		}
		if (this.rolesSelector.modalComponent === undefined && this.control !== undefined && this.control.Extras !== undefined) {
			this.rolesSelector.modalComponent = this.control.Extras["RoleModalComponent"] || this.control.Extras["roleModalComponent"];
		}
		if (this.rolesSelector.modalComponentProperties === undefined && this.control !== undefined && this.control.Extras !== undefined) {
			this.rolesSelector.modalComponentProperties = this.control.Extras["RoleModalComponentProperties"] || this.control.Extras["roleModalComponentProperties"];
		}

		this.prepareRolesAndUsers();
		this.prepareLabelsAsync().then(() => {
			this.initialized = true;
			this.init.emit(this);
		});
	}

	ngAfterViewInit() {
		this.prepareRolesAndUsersAsync().then(() => this.changeDetector.detectChanges());
	}

	ngOnDestroy() {
		this.init.unsubscribe();
		this.change.unsubscribe();
	}

	private async prepareLabelsAsync() {
		this.labels.buttons = {
			add: await this.configSvc.getResourceAsync("common.buttons.add"),
			delete: await this.configSvc.getResourceAsync("common.buttons.delete"),
			ok: await this.configSvc.getResourceAsync("common.buttons.ok"),
			cancel: await this.configSvc.getResourceAsync("common.buttons.cancel")
		};
		this.labels.inheritFromParent = await this.configSvc.getResourceAsync("privileges.objects.inheritFromParent");
		this.labels.confirmDelete = await this.configSvc.getResourceAsync("common.messages.delete.selected");

		this.sections.forEach(name => this.labels.sections[name] = {
			label: `privileges.objects.${name}.label`,
			description: `privileges.objects.${name}.description`,
			roles: `privileges.objects.${name}.roles`,
			users: `privileges.objects.${name}.users`
		});

		await Promise.all(this.sections.map(async name => {
			this.labels.sections[name].label = await this.appFormsSvc.getResourceAsync(this.labels.sections[name].label);
			this.labels.sections[name].description = await this.appFormsSvc.getResourceAsync(this.labels.sections[name].description);
			this.labels.sections[name].roles = await this.appFormsSvc.getResourceAsync(this.labels.sections[name].roles);
			this.labels.sections[name].users = await this.appFormsSvc.getResourceAsync(this.labels.sections[name].users);
		}));
	}

	private prepareRolesAndUsers(sections?: Array<string>) {
		const arraysOfPrivileges = Privileges.getPrivileges(this.privileges, sections);
		(sections || this.sections).forEach(section => {
			this.roles[section] = arraysOfPrivileges[`${section}Roles`].map(id => {
				return { Value: id, Label: undefined };
			});
			this.users[section] = arraysOfPrivileges[`${section}Users`].map(id => {
				return { Value: id, Label: undefined };
			});
		});
	}

	private async prepareRolesAndUsersAsync(sections?: Array<string>) {
		await Promise.all((sections || this.sections).map(async section => await Promise.all([
			Promise.all(this.roles[section].filter(role => role.Label === undefined).map(async role => {
				if (Privilege.systemRoles.indexOf(role.Value) > -1) {
					role.Label = await this.appFormsSvc.getResourceAsync(`privileges.roles.systems.${role.Value}`);
				}
				else {
					await this.rolesSelector.prepare(role);
				}
			})),
			Promise.all(this.users[section].filter(user => user.Label === undefined).map(async user => {
				let profile = UserProfile.get(user.Value);
				if (profile === undefined) {
					await this.userSvc.getProfileAsync(user.Value, _ => profile = (UserProfile.get(user.Value) || new UserProfile()), undefined, true);
				}
				user.Label = profile.Name;
				user.Description = profile.getEmail();
				user.Image = profile.avatarURI;
			}))
		])));
		(sections || this.sections).forEach(section => this.users[section] = this.users[section].sort(AppUtility.getCompareFunction("Label", "Description")));
	}

	private emitChanges() {
		const privileges = this.inheritFromParent.inherit ? undefined : this.privileges;
		this.change.emit({
			privileges: privileges,
			detail: {
				value: privileges
			}
		});
	}

	track(index: number, item: string) {
		return `${item}@${index}`;
	}

	onInheritFromParentChanged(event: any) {
		const isInheritFromParent = AppUtility.isTrue(event.detail.checked);
		this.inheritFromParent.inherit = isInheritFromParent;
		if (isInheritFromParent) {
			this.current = Privileges.resetPrivileges(undefined, Privileges.getPrivileges(this.privileges));
		}
		else {
			this.privileges = Privileges.resetPrivileges(undefined, Privileges.getPrivileges(this.current));
		}
		this.emitChanges();
	}

	isRoleChecked(section: string, id: string) {
		const roles = this.selectedRoles[section];
		return roles !== undefined && roles.length > 0 && roles.indexOf(id) > -1;
	}

	selectRole(event: any, section: string, id: string) {
		let roles = this.selectedRoles[section];
		if (roles === undefined) {
			roles = this.selectedRoles[section] = new Array<string>();
		}
		if (!event.detail.checked) {
			AppUtility.removeAt(roles, roles.indexOf(id));
		}
		else if (roles.indexOf(id) < 0) {
			roles.push(id);
		}
	}

	addRolesAsync(section: string) {
		if (this.rolesSelector.modalComponent === undefined) {
			return this.appFormsSvc.showAlertAsync(undefined, "Roles selector component is invalid");
		}

		const modalProperties: { [key: string]: any } = {};
		if (this.rolesSelector.modalComponentProperties !== undefined) {
			Object.keys(this.rolesSelector.modalComponentProperties).forEach(key => modalProperties[key] = this.rolesSelector.modalComponentProperties[key]);
		}
		modalProperties["section"] = section;
		modalProperties["multiple"] = true;

		return this.appFormsSvc.showModalAsync(this.rolesSelector.modalComponent, modalProperties, async roles => {
			this.privileges.getRoles(section).update(roles as Array<string>);
			this.prepareRolesAndUsers([section]);
			this.emitChanges();
			await this.prepareRolesAndUsersAsync([section]);
		});
	}

	async deleteRolesAsync(section: string) {
		return this.appFormsSvc.showAlertAsync(
			undefined,
			undefined,
			this.labels.confirmDelete,
			async () => {
				this.privileges.getRoles(section).update(this.selectedRoles[section], false);
				this.selectedRoles[section] = [];
				this.prepareRolesAndUsers([section]);
				this.emitChanges();
				await this.prepareRolesAndUsersAsync([section]);
			},
			this.labels.buttons.ok,
			this.labels.buttons.cancel
		);
	}

	isUserChecked(section: string, id: string) {
		const users = this.selectedUsers[section];
		return users !== undefined && users.length > 0 && users.indexOf(id) > -1;
	}

	selectUser(event: any, section: string, id: string) {
		let users = this.selectedUsers[section];
		if (users === undefined) {
			users = this.selectedUsers[section] = new Array<string>();
		}
		if (!event.detail.checked) {
			AppUtility.removeAt(users, users.indexOf(id));
		}
		else if (users.indexOf(id) < 0) {
			users.push(id);
		}
	}

	async addUsersAsync(section: string) {
		return this.appFormsSvc.showModalAsync(UsersSelectorModalPage, { section: section, multiple: true, hideEmails: !this.authSvc.isSystemAdministrator() }, async users => {
			this.privileges.getUsers(section).update(users as Array<string>);
			this.prepareRolesAndUsers([section]);
			this.emitChanges();
			await this.prepareRolesAndUsersAsync([section]);
		});
	}

	async deleteUsersAsync(section: string) {
		return this.appFormsSvc.showAlertAsync(
			undefined,
			undefined,
			this.labels.confirmDelete,
			async () => {
				this.privileges.getUsers(section).update(this.selectedUsers[section], false);
				this.selectedUsers[section] = [];
				this.prepareRolesAndUsers([section]);
				this.emitChanges();
				await this.prepareRolesAndUsersAsync([section]);
			},
			this.labels.buttons.ok,
			this.labels.buttons.cancel
		);
	}

}
