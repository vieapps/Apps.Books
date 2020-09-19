import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { BookControlsModule } from "@controls/books.controls.module";
import { HomePage } from "@pages/home.page";

@NgModule({
	providers: [],
	imports: [
		CommonModule,
		IonicModule,
		BookControlsModule,
		RouterModule.forChild([{ path: "", component: HomePage }])
	],
	exports: [],
	declarations: [HomePage]
})

export class HomePageModule {}
