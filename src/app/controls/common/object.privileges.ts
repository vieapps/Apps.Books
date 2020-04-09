import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, Input, Output, EventEmitter } from "@angular/core";
import { AppUtility } from "../../components/app.utility";
import { AppFormsControl, AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../services/configuration.service";
import { AuthenticationService } from "../../services/authentication.service";
import { UsersService } from "../../services/users.service";
import { Privilege, Privileges } from "../../models/privileges";
import { UserProfile } from "../../models/user";
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
	@Input() control: AppFormsControl;

	/** The privileges of the service */
	@Input() privileges: Privileges;

	/** Set to 'false' to don't allow to inherit the privileges from parent (default is true) */
	@Input() allowInheritFromParent: boolean;

	/** The function to prepare the name of a role */
	@Input() prepareRoleNameFunction: (role: { id: string, name: string }) => Promise<void>;

	/** The component to show as the modal to select role(s) */
	@Input() roleComponent: any;

	/** The properties of component to show as the modal to select role(s) */
	@Input() roleComponentProps: { [key: string]: any };

	/** The event handler to run when the controls was initialized */
	@Output() init: EventEmitter<ObjectPrivilegesControl> = new EventEmitter<ObjectPrivilegesControl>();

	/** The event handler to run when the control was changed */
	@Output() change = new EventEmitter<any>();

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

	roles = {} as { [key: string]: Array<{ id: string, name: string }> };
	users = {} as { [key: string]: Array<{ id: string, name: string }> };

	selectedRoles = {} as { [key: string]: Array<string> };
	selectedUsers = {} as { [key: string]: Array<string> };

	ngOnInit() {
		this.privileges = this.privileges || new Privileges();
		this.inheritFromParent.allow = this.allowInheritFromParent !== undefined
			? AppUtility.isTrue(this.allowInheritFromParent)
			: this.control === undefined || this.control.Extras === undefined
				? true
				: this.control.Extras["AllowInheritFromParent"] !== undefined
					? AppUtility.isTrue(this.control.Extras["AllowInheritFromParent"])
					: this.control.Extras["allowInheritFromParent"] !== undefined
						? AppUtility.isTrue(this.control.Extras["allowInheritFromParent"])
						: true;
		this.inheritFromParent.inherit = this.inheritFromParent.allow && this.privileges.isInheritFromParent;
		if (this.prepareRoleNameFunction === undefined && this.control !== undefined && this.control.Extras !== undefined) {
			this.prepareRoleNameFunction = typeof this.control.Extras["PrepareRoleName"] === "function" || typeof this.control.Extras["PrepareRoleNameFunction"] === "function"
				? this.control.Extras["PrepareRoleName"] || this.control.Extras["PrepareRoleNameFunction"]
				: typeof this.control.Extras["prepareRoleName"] === "function" || typeof this.control.Extras["prepareRoleNameFunction"] === "function"
					? this.control.Extras["prepareRoleName"] || this.control.Extras["prepareRoleNameFunction"]
					: (role: { id: string, name: string }) => new Promise<void>(() => role.name = role.id);
		}
		if (this.roleComponent === undefined && this.control !== undefined && this.control.Extras !== undefined) {
			this.roleComponent = this.control.Extras["RoleComponent"] || this.control.Extras["roleComponent"];
		}
		if (this.roleComponentProps === undefined && this.control !== undefined && this.control.Extras !== undefined) {
			this.roleComponent = this.control.Extras["RoleComponentProps"] || this.control.Extras["roleComponentProps"];
		}
		this.prepareRolesAndUsers();
		Promise.all([this.prepareLabelsAsync()]).then(() => {
			this.initialized = true;
			this.init.emit(this);
		});
	}

	ngAfterViewInit() {
		Promise.all([this.prepareNamesOfRolesAndUsersAsync()]).then(() => this.changeDetector.detectChanges());
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
		(sections || this.sections).forEach(name => {
			this.roles[name] = arraysOfPrivileges[`${name}Roles`].map(id => {
				return { id: id, name: undefined };
			});
			this.users[name] = arraysOfPrivileges[`${name}Users`].map(id => {
				return { id: id, name: undefined };
			});
		});
	}

	private prepareNamesOfRolesAndUsersAsync(sections?: Array<string>) {
		return Promise.all((sections || this.sections).map(async name => await Promise.all([
			Promise.all(this.roles[name].filter(role => role.name === undefined).map(async role => {
				if (Privilege.systemRoles.indexOf(role.id) > -1) {
					role.name = await this.appFormsSvc.getResourceAsync(`privileges.roles.systems.${role.id}`);
				}
				else {
					await this.prepareRoleNameFunction(role);
				}
			})),
			Promise.all(this.users[name].filter(user => user.name === undefined).map(async user => await this.userSvc.getProfileAsync(user.id, _ => user.name = (UserProfile.get(user.id) || new UserProfile()).Name)))
		])));
	}

	private emitChanges() {
		const privileges = this.inheritFromParent.inherit ? new Privileges() : this.privileges;
		this.change.emit({
			control: this.control,
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
		this.inheritFromParent.inherit = AppUtility.isTrue(event.detail.checked);
		this.emitChanges();
	}

	isRoleChecked(section: string, id: string) {
		const roles = this.selectedRoles[section];
		return roles !== undefined && roles.length > 0 && roles.indexOf(id) > -1;
	}

	selectRole(section: string, id: string, event: any) {
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
		if (this.roleComponent === undefined) {
			return this.appFormsSvc.showAlertAsync(undefined, undefined, "Role component is invalid");
		}

		const componentProps: { [key: string]: any } = {};
		if (this.roleComponentProps !== undefined) {
			Object.keys(this.roleComponentProps).forEach(key => componentProps[key] = this.roleComponentProps[key]);
		}
		componentProps["section"] = section;
		componentProps["multiple"] = true;

		return this.appFormsSvc.showModalAsync(this.roleComponent, componentProps, async roles => {
			AppUtility.updateSet(this.privileges.getRoles(section), roles as Array<string>);
			this.prepareRolesAndUsers([section]);
			this.emitChanges();
			await this.prepareNamesOfRolesAndUsersAsync([section]);
		});
	}

	async deleteRolesAsync(section: string) {
		return this.appFormsSvc.showAlertAsync(
			undefined,
			undefined,
			this.labels.confirmDelete,
			async () => {
				AppUtility.updateSet(this.privileges.getRoles(section), this.selectedRoles[section], false);
				this.selectedRoles[section] = [];
				this.prepareRolesAndUsers([section]);
				this.emitChanges();
				await this.prepareNamesOfRolesAndUsersAsync([section]);
			},
			this.labels.buttons.ok,
			this.labels.buttons.cancel
		);
	}

	isUserChecked(section: string, id: string) {
		const users = this.selectedUsers[section];
		return users !== undefined && users.length > 0 && users.indexOf(id) > -1;
	}

	selectUser(section: string, id: string, event: any) {
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
			AppUtility.updateSet(this.privileges.getUsers(section), users as Array<string>);
			this.prepareRolesAndUsers([section]);
			this.emitChanges();
			await this.prepareNamesOfRolesAndUsersAsync([section]);
		});
	}

	async deleteUsersAsync(section: string) {
		return this.appFormsSvc.showAlertAsync(
			undefined,
			undefined,
			this.labels.confirmDelete,
			async () => {
				AppUtility.updateSet(this.privileges.getUsers(section), this.selectedUsers[section], false);
				this.selectedUsers[section] = [];
				this.prepareRolesAndUsers([section]);
				this.emitChanges();
				await this.prepareNamesOfRolesAndUsersAsync([section]);
			},
			this.labels.buttons.ok,
			this.labels.buttons.cancel
		);
	}

}
