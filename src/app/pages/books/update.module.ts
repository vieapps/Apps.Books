import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";
import { UpdateBookPage } from "./update.page";

@NgModule({
	declarations: [UpdateBookPage],
	imports: [
		CommonModule,
		AppFormsModule,
		IonicModule,
		RouterModule.forChild([
			{
				path: "",
				component: UpdateBookPage
			}
		])
	]
})
export class UpdateBookPageModule {}
