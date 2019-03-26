import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AppReadyGuardService } from "./providers/base.service";

@NgModule({
	imports: [RouterModule.forRoot([
		{
			path: "home",
			loadChildren: "./pages/home/home.module#HomePageModule"
		},
		{
			path: "users",
			canActivate: [AppReadyGuardService],
			loadChildren: "./pages/users/router.module#UsersRoutingModule",
		},
		{
			path: "books",
			canActivate: [AppReadyGuardService],
			loadChildren: "./pages/books/router.module#BooksRoutingModule",
		},
		{
			path: "**",
			redirectTo: "home",
			pathMatch: "full"
		}
	])],
	exports: [RouterModule]
})

export class AppRoutingModule {}
