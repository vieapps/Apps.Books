import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";

import { UsersRoutingModule } from "./users.routing.module";
import { UsersAvatarPageModule } from "./avatar.module";
import { UsersListPageModule } from "./list.module";
import { UsersLogInPageModule } from "./login.module";
import { UsersOtpPageModule } from "./otp.module";
import { UsersProfilePageModule } from "./profile.module";
import { UsersRegisterPageModule } from "./register.module";
import { UsersUpdatePageModule } from "./update.module";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		UsersAvatarPageModule,
		UsersListPageModule,
		UsersLogInPageModule,
		UsersOtpPageModule,
		UsersProfilePageModule,
		UsersRegisterPageModule,
		UsersUpdatePageModule,
		UsersRoutingModule,
	],
	declarations: []
})

export class UsersModule {}
