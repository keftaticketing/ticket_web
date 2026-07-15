import { Routes } from '@angular/router';
import { Access } from './access';
import { ChangePassword } from './change-password';
import { Login } from './login';
import { Error } from './error';
import { changePasswordPageGuard } from '@/app/core/guards/change-password-page.guard';

export default [
    { path: 'access', component: Access },
    { path: 'error', component: Error },
    { path: 'login', component: Login },
    { path: 'change-password', component: ChangePassword, canActivate: [changePasswordPageGuard] }
] as Routes;
