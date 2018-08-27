import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { RouterModule } from "@angular/router";

import { HomePage } from "./home.page";

@NgModule({
	declarations: [HomePage],
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		IonicModule,
		RouterModule.forChild([
			{
				path: "",
				component: HomePage
			}
		])
	]
})
export class HomePageModule {}
