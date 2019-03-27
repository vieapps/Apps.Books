import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";
import { BookHomeScreenControl } from "./controls/control.home";
import { BookLinearItemControl } from "./controls/control.item.linear";
import { BookGridItemControl } from "./controls/control.item.grid";
import { BookmarksControl } from "./controls/control.bookmarks";
import { BookPrivilegesControl } from "./controls/control.privileges";

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
