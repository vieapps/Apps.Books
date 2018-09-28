import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";
import { AccountAvatarPageModule } from "./avatar.module";
import { ViewAccountProfilePage } from "./profile.page";
import { BookControlsModule } from "../books/controls.module";

@NgModule({
	declarations: [ViewAccountProfilePage],
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		AccountAvatarPageModule,
		BookControlsModule,
		RouterModule.forChild([
			{
				path: "",
				component: ViewAccountProfilePage
			}
		])
	]
})

export class ViewAccountProfilePageModule {}
