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
			path: "books",
			canActivate: [AppReadyGuardService],
			// loadChildren: "./pages/books/router.module#BooksRoutingModule",
			children: [
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
					canActivate: [AuthenticatedGuardService],
					loadChildren: "./pages/books/update.module#UpdateBookPageModule"
				},
				{
					path: "options",
					loadChildren: "./pages/books/options.module#BookReadingOptionsPageModule"
				},
				{
					path: "**",
					redirectTo: "/home",
					pathMatch: "full"
				}
			]
		},
		{
			path: "users",
			canActivate: [AppReadyGuardService],
			// loadChildren: "./pages/users/router.module#UsersRoutingModule",
			children: [
				{
					path: "login",
					canActivate: [NotAuthenticatedGuardService],
					loadChildren: "./pages/users/login.module#LogInPageModule"
				},
				{
					path: "register",
					canActivate: [RegisterGuardService, NotAuthenticatedGuardService],
					loadChildren: "./pages/users/register.module#RegisterAccountPageModule"
				},
				{
					path: "profile/:data",
					canActivate: [AuthenticatedGuardService],
					loadChildren: "./pages/users/profile.module#ViewAccountProfilePageModule"
				},
				{
					path: "update/:data",
					canActivate: [AuthenticatedGuardService],
					loadChildren: "./pages/users/update.module#UpdateAccountProfilePageModule"
				},
				{
					path: "otp",
					canActivate: [AuthenticatedGuardService],
					loadChildren: "./pages/users/otp.module#UpdateAccount2FAPageModule"
				},
				{
					path: "list",
					canActivate: [AuthenticatedGuardService],
					loadChildren: "./pages/users/list.module#ListAccountProfilesPageModule"
				},
				{
					path: "search",
					canActivate: [AuthenticatedGuardService],
					loadChildren: "./pages/users/list.module#ListAccountProfilesPageModule"
				},
				{
					path: "**",
					redirectTo: "/home",
					pathMatch: "full"
				}
			]
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
