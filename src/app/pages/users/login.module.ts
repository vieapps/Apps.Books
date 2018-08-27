import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";
import { LogInPage } from "./login.page";

@NgModule({
	declarations: [LogInPage],
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		RouterModule.forChild([
			{
				path: "",
				component: LogInPage
			}
		])
	]
})
export class LogInPageModule {}
