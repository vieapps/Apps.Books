import { Subscription } from "rxjs";
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from "@angular/core";
import { FormGroup } from "@angular/forms";
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

	@Input() serviceName: string;
	@Input() roles: Array<string>;
	@Input() privileges: Array<Privilege>;
	@Output() changesEvent = new EventEmitter<any>();

	form = new FormGroup({});
	controls = new Array<AppFormsControl>();
	config: Array<any>;
	objects: Array<{ Name: string, Role: string	}>;
	subscription: Subscription;

	ngOnInit() {
		this.subscription = this.form.valueChanges.subscribe(value => this.onFormChanged(value));
		this.initializeFormAsync();
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
		this.changesEvent.unsubscribe();
	}

	async initializeFormAsync() {
		if (this.privileges === undefined || this.privileges.length < 1) {
			this.privileges = [new Privilege(this.serviceName)];
		}

		if (this.roles === undefined || this.roles.length < 1) {
			this.roles = ["Administrator", "Moderator", "Editor", "Contributor", "Viewer"];
		}
		const roles = this.roles.map(role => {
			return {
				Value: role,
				Label: ""
			};
		});
		roles.forEach(async role => role.Label = await this.configSvc.getResourceAsync(`users.roles.${role.Value}`));

		const resourceID = `${this.serviceName.toLowerCase()}.name`;
		let serviceLabel = await this.configSvc.getResourceAsync(resourceID);
		serviceLabel = await this.configSvc.getResourceAsync("users.privileges.role", { service: serviceLabel !== resourceID ? serviceLabel : this.serviceName });

		const config = [{
			Name: "Role",
			Type: "Select",
			Options: {
				Label: serviceLabel,
				SelectOptions: {
					Values: roles
				}
			}
		}] as Array<any>;

		const objects = (this.configSvc.appConfig.services.all.find(service => service.name === this.serviceName).objects || []).map(object => object.toLowerCase());
		if (objects.length > 0) {
			this.objects = objects.map(object => {
				return {
					Name: object,
					Role: (this.privileges.find(privilege => privilege.ServiceName === this.serviceName && privilege.ObjectName === object) || new Privilege()).Role
				};
			});
			const labels = {} as { [key: string]: string };
			await Promise.all(objects.map(async object => {
				const resID = `${this.serviceName.toLowerCase()}.objects.${object}`;
				const name = await this.configSvc.getResourceAsync(resID);
				const label = await this.configSvc.getResourceAsync("users.privileges.object", { object: name !== resID ? name : object });
				labels[object] = label;
			}));
			config.push({
				Name: "Objects",
				Options: {
					Label: await this.configSvc.getResourceAsync("users.privileges.other")
				},
				SubControls: {
					Controls: this.objects.map(object => {
						return {
							Name: object.Name,
							Type: "Select",
							Options: {
								Label: labels[object.Name],
								SelectOptions: {
									Values: roles
								}
							}
						};
					})
				}
			});
		}

		this.config = config;
	}

	onFormInitialized($event: any) {
		const role = this.privileges.find(privilege => privilege.ServiceName === this.serviceName && privilege.ObjectName === "");
		const value = {
			Role: role !== undefined ? role.Role : "Viewer",
			Objects: {} as { [key: string]: string }
		};
		(this.objects || []).forEach(object => value.Objects[object.Name] = object.Role);
		this.form.patchValue(value);
	}

	onFormChanged(value: any) {
		const privileges = [new Privilege(this.serviceName, undefined, value.Role)];

		const subControls = this.controls.find(control => control.Name === "Objects");
		if (subControls !== undefined) {
			const objectControls = subControls.SubControls.Controls;
			if (value.Role === "Viewer") {
				objectControls.forEach(control => {
					control.Options.Disabled = false;
					const role = value.Objects[control.Name] as string;
					if (role !== "Viewer") {
						privileges.push(new Privilege(this.serviceName, control.Name, role));
					}
				});
				if (privileges.length === 1) {
					privileges.splice(0, 1);
				}
			}
			else {
				objectControls.forEach(control => control.Options.Disabled = true);
			}
		}

		this.changesEvent.emit({
			service: this.serviceName,
			privileges: privileges,
			relatedInfo: undefined
		});
	}

}
