import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AuthenticatedGuardService } from "../../providers/base.service";

@NgModule({
	imports: [RouterModule.forChild([
		{
			path: "search",
			loadChildren: "./list.module#ListBooksPageModule"
		},
		{
			path: "list-by-category/:data",
			loadChildren: "./list.module#ListBooksPageModule"
		},
		{
			path: "list-by-author/:data",
			loadChildren: "./list.module#ListBooksPageModule"
		},
		{
			path: "read/:data",
			loadChildren: "./read.module#ReadBookPageModule"
		},
		{
			path: "info/:data",
			loadChildren: "./info.module#ViewBookInfoPageModule"
		},
		{
			path: "update/:data",
			canActivate: [AuthenticatedGuardService],
			loadChildren: "./update.module#UpdateBookPageModule"
		},
		{
			path: "options",
			loadChildren: "./options.module#BookReadingOptionsPageModule"
		},
		{
			path: "**",
			redirectTo: "/home",
			pathMatch: "full"
		}
	])],
	exports: [RouterModule]
})

export class BooksRoutingModule {}
