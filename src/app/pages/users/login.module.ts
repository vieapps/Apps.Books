import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";

import { LogInPage } from "./login.page";

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		IonicModule,
		AppFormsModule,
		RouterModule.forChild([
			{
				path: "",
				component: LogInPage
			}
		])
	],
	declarations: [LogInPage],
	schemas: []
})
export class LogInPageModule {}
