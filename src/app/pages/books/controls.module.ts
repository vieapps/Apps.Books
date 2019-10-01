import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";
import { TimePipeModule } from "../../components/time.pipe";
import { BookHomeScreenControl } from "./controls/home";
import { BookmarksControl } from "./controls/bookmarks";
import { BookLinearItemControl } from "./controls/item.linear";
import { BookGridItemControl } from "./controls/item.grid";

@NgModule({
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
