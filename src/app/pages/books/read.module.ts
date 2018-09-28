import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { ReadBookPage } from "./read.page";

@NgModule({
	declarations: [ReadBookPage],
	imports: [
		CommonModule,
		IonicModule,
		RouterModule.forChild([
			{
				path: "",
				component: ReadBookPage
			}
		])
	]
})

export class ReadBookPageModule {}
