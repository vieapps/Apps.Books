import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { BookLinearItemControl } from "./control.item.linear";
import { BookGridItemControl } from "./control.item.grid";
import { BookHomeScreenControl } from "./control.home";
import { BookmarksControl } from "./control.bookmarks";

@NgModule({
	declarations: [
		BookLinearItemControl,
		BookGridItemControl,
		BookHomeScreenControl,
		BookmarksControl
	],
	imports: [
		CommonModule,
		IonicModule,
		RouterModule
	],
	exports: [
		BookLinearItemControl,
		BookGridItemControl,
		BookHomeScreenControl,
		BookmarksControl
	]
})
export class BookControlsModule {}
