import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";

import { BookControlsModule } from "./controls.module";
import { BooksInfoPageModule } from "./info.module";
import { BooksListPageModule } from "./list.module";
import { BooksOptionsPageModule } from "./options.module";
import { BooksReadPageModule } from "./read.module";
import { BooksUpdatePageModule } from "./update.module";
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
