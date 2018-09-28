import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";
import { BookLinearItemControl } from "./control.item.linear";
import { BookGridItemControl } from "./control.item.grid";
import { BookHomeScreenControl } from "./control.home";
import { BookmarksControl } from "./control.bookmarks";
import { BookPrivilegesControl } from "./control.privileges";

@NgModule({
	declarations: [
		BookLinearItemControl,
		BookGridItemControl,
		BookHomeScreenControl,
		BookmarksControl,
		BookPrivilegesControl
	],
	imports: [
		CommonModule,
		IonicModule,
		RouterModule,
		AppFormsModule
	],
	exports: [
		BookLinearItemControl,
		BookGridItemControl,
		BookHomeScreenControl,
		BookmarksControl,
		BookPrivilegesControl
	]
})

export class BookControlsModule {}
