import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AppReadyGuardService, RegisterGuardService, AuthenticatedGuardService, NotAuthenticatedGuardService } from "./providers/base.service";

@NgModule({
	imports: [RouterModule.forRoot([
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
					loadChildren: "./pages/users/profile.module#ViewAccountProfilePageModule",
					canActivate: [AuthenticatedGuardService]
				},
				{
					path: "update/:data",
					loadChildren: "./pages/users/update.module#UpdateAccountProfilePageModule",
					canActivate: [AuthenticatedGuardService]
				},
				{
					path: "otp",
					loadChildren: "./pages/users/otp.module#UpdateAccount2FAPageModule",
					canActivate: [AuthenticatedGuardService]
				},
				{
					path: "list",
					loadChildren: "./pages/users/list.module#ListAccountProfilesPageModule",
					canActivate: [AuthenticatedGuardService]
				},
				{
					path: "search",
					loadChildren: "./pages/users/list.module#ListAccountProfilesPageModule",
					canActivate: [AuthenticatedGuardService]
				}
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
					path: "list-by-category/:data",
					loadChildren: "./pages/books/list.module#ListBooksPageModule"
				},
				{
					path: "list-by-author/:data",
					loadChildren: "./pages/books/list.module#ListBooksPageModule"
				},
				{
					path: "read/:data",
					loadChildren: "./pages/books/read.module#ReadBookPageModule"
				},
				{
					path: "info/:data",
					loadChildren: "./pages/books/info.module#ViewBookInfoPageModule"
				},
				{
					path: "update/:data",
					loadChildren: "./pages/books/update.module#UpdateBookPageModule",
					canActivate: [AuthenticatedGuardService]
				},
				{
					path: "options",
					loadChildren: "./pages/books/options.module#BookReadingOptionsPageModule"
				}
			]
		},
		{
			path: "",
			redirectTo: "home",
			pathMatch: "full"
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
