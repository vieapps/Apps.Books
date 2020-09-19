import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AuthenticatedGuardService } from "@services/base.service";
import { BookControlsModule } from "@controls/books.controls.module";

export const routes: Routes = [
	{
		path: "search",
		data: { preload: true },
		loadChildren: "@pages/books/list/list.module#BooksListPageModule"
	},
	{
		path: "category/:data",
		loadChildren: "@pages/books/list/list.module#BooksListPageModule"
	},
	{
		path: "author/:data",
		loadChildren: "@pages/books/list/list.module#BooksListPageModule"
	},
	{
		path: "list-by-category/:data",
		loadChildren: "@pages/books/list/list.module#BooksListPageModule"
	},
	{
		path: "list-by-author/:data",
		loadChildren: "@pages/books/list/list.module#BooksListPageModule"
	},
	{
		path: "options",
		loadChildren: "@pages/books/options/options.module#BooksOptionsPageModule"
	},
	{
		path: "info/:data",
		loadChildren: "@pages/books/info/info.module#BooksInfoPageModule"
	},
	{
		path: "read/:data",
		data: { preload: true },
		loadChildren: "@pages/books/read/read.module#BooksReadPageModule"
	},
	{
		path: "update/:data",
		canActivate: [AuthenticatedGuardService],
		loadChildren: "@pages/books/update/update.module#BooksUpdatePageModule"
	}
];

@NgModule({
	providers: [],
	imports: [
		CommonModule,
		IonicModule,
		BookControlsModule,
		RouterModule.forChild(routes)
	],
	exports: [RouterModule],
	declarations: []
})

export class BooksModule {}
