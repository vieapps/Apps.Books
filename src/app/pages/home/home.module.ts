import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { RouterModule } from "@angular/router";
import { HomePage } from "./home.page";

@NgModule({
	declarations: [HomePage],
	imports: [
		CommonModule,
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
