import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";

import { UsersRoutingModule } from "./users.routing.module";
import { UsersAvatarPageModule } from "./avatar/avatar.module";
import { UsersListPageModule } from "./list/list.module";
import { UsersLogInPageModule } from "./login/login.module";
import { UsersOtpPageModule } from "./otp/otp.module";
import { UsersProfilePageModule } from "./profile/profile.module";
import { UsersRegisterPageModule } from "./register/register.module";
import { UsersUpdatePageModule } from "./update/update.module";

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
