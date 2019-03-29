import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../../components/forms.module";
import { UserControlsModule } from "../controls.module";
import { UsersUpdatePage } from "./update.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		UserControlsModule,
		RouterModule.forChild([{ path: "", component: UsersUpdatePage }])
	],
	exports: [],
	declarations: [UsersUpdatePage]
})

export class UsersUpdatePageModule {}
