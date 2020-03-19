import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../../components/forms.module";
import { CommonControlsModule } from "../../../controls/common.controls.module";
import { UsersUpdatePage } from "./update.page";

@NgModule({
	providers: [],
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		CommonControlsModule,
		RouterModule.forChild([{ path: "", component: UsersUpdatePage }])
	],
	exports: [],
	declarations: [UsersUpdatePage]
})

export class UsersUpdatePageModule {}
