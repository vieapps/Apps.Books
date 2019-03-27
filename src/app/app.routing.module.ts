import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AppModulePreloader } from "./components/app.preloader";
import { AppReadyGuardService, RegisterGuardService } from "./providers/base.service";
import { AuthenticatedGuardService, NotAuthenticatedGuardService } from "./providers/base.service";

export const routes: Routes = [
	{
		path: "home",
		data: { preload: true },
		loadChildren: "./pages/home/home.module#HomePageModule"
	},
	{
		path: "users",
		canActivate: [AppReadyGuardService],
		loadChildren: "./pages/users/users.module#UsersModule"
		/*children: [
			{
				path: "login",
				canActivate: [NotAuthenticatedGuardService],
				loadChildren: "./pages/users/login.module#UsersLogInPageModule"
			},
			{
				path: "register",
				canActivate: [RegisterGuardService, NotAuthenticatedGuardService],
				loadChildren: "./pages/users/register.module#UsersRegisterPageModule"
			},
			{
				path: "profile/:data",
				canActivate: [AuthenticatedGuardService],
				loadChildren: "./pages/users/profile.module#UsersProfilePageModule"
			},
			{
				path: "update/:data",
				canActivate: [AuthenticatedGuardService],
				loadChildren: "./pages/users/update.module#UsersUpdatePageModule"
			},
			{
				path: "otp",
				canActivate: [AuthenticatedGuardService],
				loadChildren: "./pages/users/otp.module#UsersOtpPageModule"
			},
			{
				path: "list",
				canActivate: [AuthenticatedGuardService],
				loadChildren: "./pages/users/list.module#UsersListPageModule"
			},
			{
				path: "search",
				canActivate: [AuthenticatedGuardService],
				loadChildren: "./pages/users/list.module#UsersListPageModule"
			},
			{
				path: "**",
				redirectTo: "/home",
				pathMatch: "full"
			}
		]*/
	},
	{
		path: "books",
		canActivate: [AppReadyGuardService],
		loadChildren: "./pages/books/books.module#BooksModule"
		/*children: [
			{
				path: "search",
				loadChildren: "./pages/books/list.module#BooksListPageModule"
			},
			{
				path: "list-by-category/:data",
				loadChildren: "./pages/books/list.module#BooksListPageModule"
			},
			{
				path: "list-by-author/:data",
				loadChildren: "./pages/books/list.module#BooksListPageModule"
			},
			{
				path: "read/:data",
				loadChildren: "./pages/books/read.module#BooksReadPageModule"
			},
			{
				path: "info/:data",
				loadChildren: "./pages/books/info.module#BooksInfoPageModule"
			},
			{
				path: "update/:data",
				canActivate: [AuthenticatedGuardService],
				loadChildren: "./pages/books/update.module#BooksUpdatePageModule"
			},
			{
				path: "options",
				loadChildren: "./pages/books/options.module#BooksOptionsPageModule"
			},
			{
				path: "**",
				redirectTo: "search",
				pathMatch: "full"
			}
		]*/
	},
	{
		path: "**",
		redirectTo: "home",
		pathMatch: "full"
	}
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { preloadingStrategy: AppModulePreloader })],
	exports: [RouterModule]
})

export class AppRoutingModule {}
