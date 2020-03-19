import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../components/forms.module";
import { TimePipeModule } from "../components/time.pipe";
import { BookHomeScreenControl } from "./books/home";
import { BookmarksControl } from "./books/bookmarks";
import { BookLinearItemControl } from "./books/item.linear";
import { BookGridItemControl } from "./books/item.grid";

@NgModule({
	providers: [],
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		TimePipeModule
	],
	exports: [
		BookHomeScreenControl,
		BookLinearItemControl,
		BookGridItemControl,
		BookmarksControl
	],
	declarations: [
		BookHomeScreenControl,
		BookLinearItemControl,
		BookGridItemControl,
		BookmarksControl
	]
})

export class BookControlsModule {}
