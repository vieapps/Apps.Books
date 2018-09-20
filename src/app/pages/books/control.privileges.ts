import { Subscription } from "rxjs";
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppFormsControl } from "../../components/forms.service";
import { ConfigurationService } from "../../providers/configuration.service";
import { Privilege } from "./../../models/privileges";

@Component({
	selector: "control-book-privileges",
	templateUrl: "./control.privileges.html",
	styleUrls: ["./control.privileges.scss"]
})
export class BookPrivilegesControl implements OnInit, OnDestroy {

	constructor (
		public configSvc: ConfigurationService
	) {
	}

	@Input() privileges: Privilege[];
	@Output() changesEvent: EventEmitter<any> = new EventEmitter();

	form = new FormGroup({});
	controls = new Array<AppFormsControl>();
	config: Array<any>;
	objects: Array<{
		Object: string,
		Role: string,
		Label: string
	}>;
	rxSubscription: Subscription;

	ngOnInit() {
		this.rxSubscription = this.form.valueChanges.subscribe(value => this.onFormChanged(value));
		this.initializeFormAsync();
	}

	ngOnDestroy() {
		this.rxSubscription.unsubscribe();
		this.changesEvent.unsubscribe();
	}

	async initializeFormAsync() {
		if (this.privileges === undefined || this.privileges.length < 1) {
			const privilege = new Privilege();
			privilege.ServiceName = "books";
			privilege.Role = "Viewer";
			this.privileges = [privilege];
		}
		const role = this.privileges.find(privilege => privilege.ServiceName === "books" && privilege.ObjectName === "");
		const roles = ["Administrator", "Moderator", "Viewer"].map(r => {
			return {
				Value: r,
				Label: ""
			};
		});
		roles.forEach(async r => r.Label = await this.configSvc.getResourceAsync(`users.roles.${r.Value}`));

		this.objects = this.privileges.filter(privilege => privilege.ServiceName === "books" && privilege.ObjectName !== "").map(privilege => {
			return {
				Object: privilege.ObjectName,
				Role: privilege.Role,
				Label: ""
			};
		});
		this.configSvc.appConfig.services.all.find(svc => svc.name === "books").objects.forEach(async object => {
			const label = await this.configSvc.getResourceAsync("books.privileges.object", { object: await this.configSvc.getResourceAsync(`books.objects.${object}`) });
			const obj = this.objects.find(o => o.Object === object);
			if (obj === undefined) {
				this.objects.push({
					Object: object,
					Role: role !== undefined ? role.Role : "Viewer",
					Label: label
				});
			}
			else {
				obj.Label = label;
			}
		});

		this.config = [
			{
				Name: "Role",
				Type: "Select",
				Options: {
					Label: await this.configSvc.getResourceAsync("books.privileges.role"),
					SelectOptions: {
						Values: roles
					}
				}
			},
			{
				Name: "Objects",
				Options: {
					Label: await this.configSvc.getResourceAsync("books.privileges.other")
				},
				SubControls: {
					Controls: this.objects.map(obj => {
						return {
							Name: obj.Object,
							Type: "Select",
							Options: {
								Label: obj.Label,
								SelectOptions: {
									Values: roles
								}
							}
						};
					})
				}
			}
		];
	}

	onFormInitialized($event) {
		const role = this.privileges.find(privilege => privilege.ServiceName === "books" && privilege.ObjectName === "");
		const value = {
			Role: role !== undefined ? role.Role : "Viewer",
			Objects: {} as { [key: string]: string }
		};
		this.objects.forEach(object => {
			value.Objects[object.Object] = object.Role;
		});
		this.form.patchValue(value);
	}

	onFormChanged(value: any) {
		const servicePrivilege = new Privilege();
		servicePrivilege.ServiceName = "books";
		servicePrivilege.Role = value.Role;
		const privileges = [servicePrivilege];

		const subControls = this.controls.find(control => control.Name === "Objects").SubControls.Controls;
		if (value.Role === "Viewer") {
			subControls.forEach(control => {
				control.Options.Disabled = false;
				const role = value.Objects[control.Name] as string;
				if (role !== "Viewer") {
					const objectPrivilege = new Privilege();
					objectPrivilege.ServiceName = "books";
					objectPrivilege.ObjectName = control.Name;
					objectPrivilege.Role = role;
					privileges.push(objectPrivilege);
				}
			});
		}
		else {
			subControls.forEach(control => control.Options.Disabled = true);
		}

		this.changesEvent.emit({
			privileges: privileges,
			relatedInfo: undefined
		});
	}

}
