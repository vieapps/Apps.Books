import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AppReadyGuardService, RegisterGuardService, AuthenticatedGuardService, NotAuthenticatedGuardService } from "./providers/base.service";

@NgModule({
	imports: [RouterModule.forRoot([
		{
			path: "",
			redirectTo: "home",
			pathMatch: "full"
		},
		{
			path: "home",
			loadChildren: "./pages/home/home.module#HomePageModule"
		},
		{
			path: "users",
			canActivate: [AppReadyGuardService],
			children: [
				{
					path: "",
					redirectTo: "/home",
					pathMatch: "full"
				},
				{
					path: "login",
					loadChildren: "./pages/users/login.module#LogInPageModule",
					canActivate: [NotAuthenticatedGuardService]
				},
				{
					path: "register",
					loadChildren: "./pages/users/register.module#RegisterAccountPageModule",
					canActivate: [RegisterGuardService, NotAuthenticatedGuardService]
				},
				{
					path: "profile/:data",
					loadChildren: "./pages/users/profile.module#AccountProfilePageModule",
					canActivate: [AuthenticatedGuardService]
				},
			]
		},
		{
			path: "books",
			canActivate: [AppReadyGuardService],
			children: [
				{
					path: "",
					redirectTo: "/home",
					pathMatch: "full"
				},
				{
					path: "search",
					loadChildren: "./pages/books/list.module#ListBooksPageModule"
				},
				{
					path: "list/:data",
					loadChildren: "./pages/books/list.module#ListBooksPageModule"
				},
				// {
				// 	path: "read/:data",
				// 	loadChildren: "./pages/books/read.module#ReadBookPageModule"
				// },
				// {
				// 	path: "info/:data",
				// 	loadChildren: "./pages/books/info.module#ViewBookInfoPageModule"
				// },
				// {
				// 	path: "update/:data",
				// 	loadChildren: "./pages/books/update.module#UpdateBookPageModule"
				// },
			]
		},
	])],
	exports: [RouterModule]
})
export class AppRoutingModule {}
