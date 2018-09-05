import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { BookControlsModule } from "../books/controls.module";
import { HomePage } from "./home.page";

@NgModule({
	declarations: [HomePage],
	imports: [
		CommonModule,
		IonicModule,
		BookControlsModule,
		RouterModule.forChild([
			{
				path: "",
				component: HomePage
			}
		])
	]
})
export class HomePageModule {}
