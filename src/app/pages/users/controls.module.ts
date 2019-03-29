import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";
import { UsersServicePrivilegesControl } from "./controls/service.privileges";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule
	],
	exports: [
		UsersServicePrivilegesControl
	],
	declarations: [
		UsersServicePrivilegesControl
	]
})

export class UserControlsModule {}
