import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";

import { BookControlsModule } from "./controls.module";
import { BooksInfoPageModule } from "./info/info.module";
import { BooksListPageModule } from "./list/list.module";
import { BooksOptionsPageModule } from "./options/options.module";
import { BooksReadPageModule } from "./read/read.module";
import { BooksUpdatePageModule } from "./update/update.module";
import { BooksRoutingModule } from "./books.routing.module";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		BookControlsModule,
		BooksInfoPageModule,
		BooksListPageModule,
		BooksOptionsPageModule,
		BooksReadPageModule,
		BooksUpdatePageModule,
		BooksRoutingModule,
	],
	declarations: []
})

export class BooksModule {}
