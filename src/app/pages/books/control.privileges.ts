import { Subscription } from "rxjs";
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppFormsControl } from "../../components/forms.service";
import { ConfigurationService } from "../../providers/configuration.service";
import { BooksService } from "../../providers/books.service";
import { Privilege } from "./../../models/privileges";

@Component({
	selector: "control-book-privileges",
	templateUrl: "./control.privileges.html",
	styleUrls: ["./control.privileges.scss"]
})
export class BookPrivilegesControl implements OnInit, OnDestroy {

	constructor (
		public configSvc: ConfigurationService,
		public booksSvc: BooksService
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
		const serviceName = this.booksSvc.serviceName.toLowerCase();
		if (this.privileges === undefined || this.privileges.length < 1) {
			this.privileges = [new Privilege(serviceName)];
		}

		const roles = ["Administrator", "Moderator", "Viewer"].map(r => {
			return {
				Value: r,
				Label: ""
			};
		});
		roles.forEach(async r => r.Label = await this.configSvc.getResourceAsync(`users.roles.${r.Value}`));

		this.objects = this.privileges.filter(privilege => privilege.ServiceName === serviceName && privilege.ObjectName !== "").map(privilege => {
			return {
				Object: privilege.ObjectName,
				Role: privilege.Role,
				Label: ""
			};
		});
		this.configSvc.appConfig.services.all.find(svc => svc.name === serviceName).objects.forEach(async object => {
			const label = await this.configSvc.getResourceAsync("books.privileges.object", { object: await this.configSvc.getResourceAsync(`books.objects.${object}`) });
			const obj = this.objects.find(o => o.Object === object);
			if (obj === undefined) {
				this.objects.push({
					Object: object,
					Role: "Viewer",
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
		const role = this.privileges.find(privilege => privilege.ServiceName === this.booksSvc.serviceName.toLowerCase() && privilege.ObjectName === "");
		const value = {
			Role: role !== undefined ? role.Role : "Viewer",
			Objects: {} as { [key: string]: string }
		};
		this.objects.forEach(object => value.Objects[object.Object] = object.Role);
		this.form.patchValue(value);
	}

	onFormChanged(value) {
		const serviceName = this.booksSvc.serviceName.toLowerCase();
		const privileges = [new Privilege(serviceName, undefined, value.Role)];
		const subControls = this.controls.find(control => control.Name === "Objects").SubControls.Controls;

		if (value.Role === "Viewer") {
			subControls.forEach(control => {
				control.Options.Disabled = false;
				const role = value.Objects[control.Name] as string;
				if (role !== "Viewer") {
					privileges.push(new Privilege(serviceName, control.Name, role));
				}
			});
			if (privileges.length === 1) {
				privileges.splice(0, 1);
			}
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
