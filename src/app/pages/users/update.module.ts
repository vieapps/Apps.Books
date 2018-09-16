import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";
import { UpdateAccountProfilePage } from "./update.page";

@NgModule({
	declarations: [UpdateAccountProfilePage],
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		RouterModule.forChild([
			{
				path: "",
				component: UpdateAccountProfilePage
			}
		])
	]
})
export class UpdateAccountProfilePageModule {}
