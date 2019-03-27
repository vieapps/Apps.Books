import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AuthenticatedGuardService } from "../../providers/base.service";

@NgModule({
	imports: [RouterModule.forChild([
		{
			path: "search",
			loadChildren: "./list.module#BooksListPageModule"
		},
		{
			path: "list-by-category/:data",
			loadChildren: "./list.module#BooksListPageModule"
		},
		{
			path: "list-by-author/:data",
			loadChildren: "./list.module#BooksListPageModule"
		},
		{
			path: "read/:data",
			loadChildren: "./read.module#BooksReadPageModule"
		},
		{
			path: "info/:data",
			loadChildren: "./info.module#BooksInfoPageModule"
		},
		{
			path: "update/:data",
			canActivate: [AuthenticatedGuardService],
			loadChildren: "./update.module#BooksUpdatePageModule"
		},
		{
			path: "options",
			loadChildren: "./options.module#BooksOptionsPageModule"
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
