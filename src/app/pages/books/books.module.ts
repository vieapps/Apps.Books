import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AuthenticatedGuardService } from "../../services/base.service";

import { BookControlsModule } from "./controls.module";
import { BooksInfoPageModule } from "./info/info.module";
import { BooksListPageModule } from "./list/list.module";
import { BooksOptionsPageModule } from "./options/options.module";
import { BooksReadPageModule } from "./read/read.module";
import { BooksUpdatePageModule } from "./update/update.module";

const routes: Routes = [
	{
		path: "",
		loadChildren: "../home.module#HomePageModule"
	},
	{
		path: "search",
		data: { preload: true },
		loadChildren: "../books/list/list.module#BooksListPageModule"
	},
	{
		path: "list-by-category/:data",
		loadChildren: "../books/list/list.module#BooksListPageModule"
	},
	{
		path: "list-by-author/:data",
		loadChildren: "../books/list/list.module#BooksListPageModule"
	},
	{
		path: "options",
		loadChildren: "../books/options/options.module#BooksOptionsPageModule"
	},
	{
		path: "info/:data",
		loadChildren: "../books/info/info.module#BooksInfoPageModule"
	},
	{
		path: "read/:data",
		data: { preload: true },
		loadChildren: "../books/read/read.module#BooksReadPageModule"
	},
	{
		path: "update/:data",
		canActivate: [AuthenticatedGuardService],
		loadChildren: "../books/update/update.module#BooksUpdatePageModule"
	},
	{
		path: "**",
		redirectTo: "search",
		pathMatch: "full"
	}
];

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
		RouterModule.forChild(routes)
	],
	exports: [RouterModule],
	declarations: []
})

export class BooksModule {}
