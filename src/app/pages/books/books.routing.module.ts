import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AuthenticatedGuardService } from "../../providers/base.service";

@NgModule({
	imports: [RouterModule.forChild([
		{
			path: "info/:data",
			loadChildren: "../books/info/info.module#BooksInfoPageModule"
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
	])],
	exports: [RouterModule]
})

export class BooksRoutingModule {}
