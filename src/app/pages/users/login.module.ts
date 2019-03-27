import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";
import { UsersLogInPage } from "./login.page";

@NgModule({
	declarations: [UsersLogInPage],
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		RouterModule.forChild([
			{
				path: "",
				component: UsersLogInPage
			}
		])
	]
})
export class UsersLogInPageModule {}
