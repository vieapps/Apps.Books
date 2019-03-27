import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";
import { BookHomeScreenControl } from "./controls/home";
import { BookLinearItemControl } from "./controls/item.linear";
import { BookGridItemControl } from "./controls/item.grid";
import { BookmarksControl } from "./controls/bookmarks";
import { BookPrivilegesControl } from "./controls/privileges";

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
