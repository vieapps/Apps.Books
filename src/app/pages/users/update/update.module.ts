import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../../components/forms.module";
import { BookControlsModule } from "../../books/controls.module";
import { UsersUpdatePage } from "./update.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		BookControlsModule,
		RouterModule.forChild([{ path: "", component: UsersUpdatePage }])
	],
	exports: [],
	declarations: [UsersUpdatePage]
})

export class UsersUpdatePageModule {}
