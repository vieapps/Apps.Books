import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "@components/forms.module";
import { TimePipeModule } from "@components/time.pipe";
import { BookHomeScreenControl } from "@controls/books/home";
import { BookmarksControl } from "@controls/books/bookmarks";
import { BookLinearItemControl } from "@controls/books/item.linear";
import { BookGridItemControl } from "@controls/books/item.grid";

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
