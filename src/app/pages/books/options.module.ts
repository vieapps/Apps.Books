import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";
import { BookReadingOptionsPage } from "./options.page";

@NgModule({
	declarations: [BookReadingOptionsPage],
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		RouterModule.forChild([
			{
				path: "",
				component: BookReadingOptionsPage
			}
		])
	]
})

export class BookReadingOptionsPageModule {}
