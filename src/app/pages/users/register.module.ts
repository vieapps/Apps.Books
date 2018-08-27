import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";
import { RegisterAccountPage } from "./register.page";

@NgModule({
	declarations: [RegisterAccountPage],
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		RouterModule.forChild([
			{
				path: "",
				component: RegisterAccountPage
			}
		])
	]
})
export class RegisterAccountPageModule {}
