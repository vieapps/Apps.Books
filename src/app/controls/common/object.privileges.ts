import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, Input, Output, EventEmitter } from "@angular/core";
import { AppUtility } from "../../components/app.utility";
import { AppFormsControl, AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../services/configuration.service";
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
	@Output() init: EventEmitter<any> = new EventEmitter();

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
		names: {} as {
			[key: string]: {
				label: string;
				description: string;
				roles: string;
				users: string
			}
		}
	};

	initialized = false;
	names = Privileges.sections;

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

		this.names.forEach(name => this.labels.names[name] = {
			label: `privileges.objects.${name}.label`,
			description: `privileges.objects.${name}.description`,
			roles: `privileges.objects.${name}.roles`,
			users: `privileges.objects.${name}.users`
		});

		await Promise.all(this.names.map(async name => {
			this.labels.names[name].label = await this.appFormsSvc.getResourceAsync(this.labels.names[name].label);
			this.labels.names[name].description = await this.appFormsSvc.getResourceAsync(this.labels.names[name].description);
			this.labels.names[name].roles = await this.appFormsSvc.getResourceAsync(this.labels.names[name].roles);
			this.labels.names[name].users = await this.appFormsSvc.getResourceAsync(this.labels.names[name].users);
		}));
	}

	private prepareRolesAndUsers(names?: Array<string>) {
		const arraysOfPrivileges = Privileges.getPrivileges(this.privileges, names);
		(names || this.names).forEach(name => {
			this.roles[name] = arraysOfPrivileges[`${name}Roles`].map(id => {
				return { id: id, name: undefined };
			});
			this.users[name] = arraysOfPrivileges[`${name}Users`].map(id => {
				return { id: id, name: undefined };
			});
		});
	}

	private prepareNamesOfRolesAndUsersAsync(names?: Array<string>) {
		return Promise.all((names || this.names).map(async name => await Promise.all([
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

	isRoleChecked(name: string, id: string) {
		const roles = this.selectedRoles[name];
		return roles !== undefined && roles.length > 0 && roles.indexOf(id) > -1;
	}

	selectRole(name: string, id: string, event: any) {
		let roles = this.selectedRoles[name];
		if (roles === undefined) {
			roles = this.selectedRoles[name] = new Array<string>();
		}
		if (!event.detail.checked) {
			AppUtility.removeAt(roles, roles.indexOf(id));
		}
		else if (roles.indexOf(id) < 0) {
			roles.push(id);
		}
	}

	addRolesAsync(name: string) {
		if (this.roleComponent === undefined) {
			return this.appFormsSvc.showAlertAsync(undefined, undefined, "Role component is invalid");
		}

		const componentProps: { [key: string]: any } = {};
		if (this.roleComponentProps !== undefined) {
			Object.keys(this.roleComponentProps).forEach(key => componentProps[key] = this.roleComponentProps[key]);
		}
		componentProps["name"] = name;
		componentProps["multiple"] = true;

		return this.appFormsSvc.showModalAsync(this.roleComponent, componentProps, async roles => {
			AppUtility.updateSet(this.privileges.getRoles(name), roles as Array<string>);
			this.prepareRolesAndUsers([name]);
			this.emitChanges();
			await this.prepareNamesOfRolesAndUsersAsync([name]);
		});
	}

	async deleteRolesAsync(name: string) {
		return this.appFormsSvc.showAlertAsync(
			undefined,
			undefined,
			this.labels.confirmDelete,
			async () => {
				AppUtility.updateSet(this.privileges.getRoles(name), this.selectedRoles[name], false);
				this.selectedRoles[name] = [];
				this.prepareRolesAndUsers([name]);
				this.emitChanges();
				await this.prepareNamesOfRolesAndUsersAsync([name]);
			},
			this.labels.buttons.ok,
			this.labels.buttons.cancel
		);
	}

	isUserChecked(name: string, id: string) {
		const users = this.selectedUsers[name];
		return users !== undefined && users.length > 0 && users.indexOf(id) > -1;
	}

	selectUser(name: string, id: string, event: any) {
		let users = this.selectedUsers[name];
		if (users === undefined) {
			users = this.selectedUsers[name] = new Array<string>();
		}
		if (!event.detail.checked) {
			AppUtility.removeAt(users, users.indexOf(id));
		}
		else if (users.indexOf(id) < 0) {
			users.push(id);
		}
	}

	async addUsersAsync(name: string) {
		return this.appFormsSvc.showModalAsync(UsersSelectorModalPage, { name: name, multiple: true }, async users => {
			AppUtility.updateSet(this.privileges.getUsers(name), users as Array<string>);
			this.prepareRolesAndUsers([name]);
			this.emitChanges();
			await this.prepareNamesOfRolesAndUsersAsync([name]);
		});
	}

	async deleteUsersAsync(name: string) {
		return this.appFormsSvc.showAlertAsync(
			undefined,
			undefined,
			this.labels.confirmDelete,
			async () => {
				AppUtility.updateSet(this.privileges.getUsers(name), this.selectedUsers[name], false);
				this.selectedUsers[name] = [];
				this.prepareRolesAndUsers([name]);
				this.emitChanges();
				await this.prepareNamesOfRolesAndUsersAsync([name]);
			},
			this.labels.buttons.ok,
			this.labels.buttons.cancel
		);
	}

}
