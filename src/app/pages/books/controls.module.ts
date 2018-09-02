import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { BookLinearControl } from "./control.book.linear";
import { BookGridControl } from "./control.book.grid";

@NgModule({
	declarations: [
		BookLinearControl,
		BookGridControl
	],
	imports: [
		CommonModule,
		IonicModule,
		RouterModule
	],
	exports: [
		BookLinearControl,
		BookGridControl
	]
})
export class BookControlsModule {}
