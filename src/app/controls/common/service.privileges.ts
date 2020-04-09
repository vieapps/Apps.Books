import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from "@angular/core";
import { AppUtility } from "../../components/app.utility";
import { AppFormsControl } from "../../components/forms.service";
import { ConfigurationService } from "../../services/configuration.service";
import { Privilege } from "../../models/privileges";

@Component({
	selector: "control-service-privileges",
	templateUrl: "./service.privileges.html",
	styleUrls: ["./service.privileges.scss"]
})

export class ServicePrivilegesControl implements OnInit, OnDestroy {

	constructor(
		public configSvc: ConfigurationService
	) {
	}

	/** The form control that contains this control */
	@Input() control: AppFormsControl;

	/** The name of the service */
	@Input() service: string;

	/** The privileges of the service */
	@Input() privileges: Array<Privilege>;

	/** The position of labels (default is 'stacked') */
	@Input() labelPosition: string;

	/** The interface of select boxes (default is 'popover') */
	@Input() selectInterface: string;

	/** The event handler to run when the controls was initialized */
	@Output() init: EventEmitter<ServicePrivilegesControl> = new EventEmitter<ServicePrivilegesControl>();

	/** The event handler to run when the control was changed */
	@Output() change = new EventEmitter<any>();

	roles = Privilege.privilegeRoles;
	labels = {
		service: "",
		other: "",
		buttons: {
			ok: "OK",
			cancel: "Cancel"
		},
		roles: {} as { [key: string]: string },
		objects: {} as { [key: string]: string }
	};

	objectRoles: Array<{ name: string; role: string }>;
	get serviceRole() {
		return ((this.privileges || []).find(privilege => AppUtility.isEquals(privilege.ServiceName, this.service) && AppUtility.isEquals(privilege.ObjectName, "")) || new Privilege(this.service)).Role;
	}

	ngOnInit() {
		this.service = this.service || this.configSvc.appConfig.services.active;
		this.privileges = this.privileges || [];
		this.labelPosition = (this.labelPosition || "stacked").trim().toLowerCase();
		this.selectInterface = (this.selectInterface || "popover").trim().toLowerCase();

		if (this.privileges.findIndex(privilege => AppUtility.isEquals(privilege.ServiceName, this.service) && AppUtility.isEquals(privilege.ObjectName, "")) < 0) {
			AppUtility.insertAt(this.privileges, new Privilege(this.service.toLowerCase()), 0);
		}

		(this.configSvc.appConfig.services.all.find(service => AppUtility.isEquals(service.name, this.service)).objects || []).forEach(object => {
			if (this.privileges.findIndex(privilege => AppUtility.isEquals(privilege.ServiceName, this.service) && AppUtility.isEquals(privilege.ObjectName, object)) < 0) {
				this.privileges.push(new Privilege(this.service.toLowerCase(), object.toLowerCase()));
			}
		});

		this.prepareObjectRoles();
		Promise.all([this.prepareLabelsAsync()]).then(() => this.init.emit(this));
	}

	ngOnDestroy() {
		this.init.unsubscribe();
		this.change.unsubscribe();
	}

	private prepareObjectRoles() {
		this.objectRoles = this.privileges.filter(privilege => AppUtility.isEquals(privilege.ServiceName, this.service) && !AppUtility.isEquals(privilege.ObjectName, "")).map(privilege => {
			return {
				name: privilege.ObjectName,
				role: privilege.Role
			};
		});
	}

	private async prepareLabelsAsync() {
		this.labels.service = await this.configSvc.getResourceAsync(`${this.service.toLowerCase()}.name`);
		this.labels.service = await this.configSvc.getResourceAsync("privileges.services.role", { service: AppUtility.isEquals(this.labels.service, `${this.service.toLowerCase()}.name`) ? this.service : this.labels.service });
		this.labels.other = await this.configSvc.getResourceAsync("privileges.services.other");
		this.labels.buttons = {
			ok: await this.configSvc.getResourceAsync("common.buttons.ok"),
			cancel: await this.configSvc.getResourceAsync("common.buttons.cancel")
		};
		await Promise.all([
			Promise.all(this.roles.map(async role => this.labels.roles[role] = await this.configSvc.getResourceAsync(`privileges.roles.privileges.${role}`))),
			Promise.all(this.objectRoles.map(objectRole => objectRole.name).map(async object => {
				const label = await this.configSvc.getResourceAsync(`${this.service.toLowerCase()}.objects.${object}`);
				this.labels.objects[object] = await this.configSvc.getResourceAsync("privileges.services.object", { object: AppUtility.isEquals(label, `${this.service.toLowerCase()}.objects.${object}`) ? object : label });
			}))
		]);
	}

	private emitChanges() {
		const privileges = this.serviceRole === "Viewer"
			? this.privileges.filter(privilege => AppUtility.isEquals(privilege.ServiceName, this.service) && (AppUtility.isEquals(privilege.ObjectName, "") || (privilege.ObjectName !== "" && privilege.Role !== "Viewer")))
			: this.privileges.filter(privilege => AppUtility.isEquals(privilege.ServiceName, this.service) && AppUtility.isEquals(privilege.ObjectName, ""));
		this.change.emit({
			control: this.control,
			service: this.service,
			privileges: privileges,
			relatedInfo: undefined,
			detail: {
				value: privileges
			}
		});
	}

	track(index: number, item: string) {
		return `${item}@${index}`;
	}

	onServiceRoleChanged(event: any) {
		this.privileges.find(privilege => AppUtility.isEquals(privilege.ServiceName, this.service) && AppUtility.isEquals(privilege.ObjectName, "")).Role = event.detail.value;
		if (event.detail.value !== "Viewer") {
			this.privileges.filter(privilege => AppUtility.isEquals(privilege.ServiceName, this.service) && !AppUtility.isEquals(privilege.ObjectName, "")).forEach(privilege => privilege.Role = "Viewer");
		}
		else {
			this.objectRoles.forEach(objectRole => this.privileges.find(privilege => AppUtility.isEquals(privilege.ServiceName, this.service) && AppUtility.isEquals(privilege.ObjectName, objectRole.name)).Role = objectRole.role);
		}
		this.emitChanges();
	}

	onObjectRoleChanged(event: any, name: string) {
		this.privileges.find(privilege => AppUtility.isEquals(privilege.ServiceName, this.service) && AppUtility.isEquals(privilege.ObjectName, name)).Role = event.detail.value;
		this.prepareObjectRoles();
		this.emitChanges();
	}

}
