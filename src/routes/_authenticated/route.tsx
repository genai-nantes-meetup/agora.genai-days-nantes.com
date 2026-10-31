import {createFileRoute,Outlet} from '@tanstack/react-router';
import {useAuth} from '@/lib/auth';
import {SignInInvite} from '@/components/SignInInvite';
import {LoadingView} from '@/components/common';
export const Route=createFileRoute('/_authenticated')({ssr:false,component:AccountLayout});
function AccountLayout(){const {user,ready}=useAuth();if(!ready)return <LoadingView/>;if(!user)return <SignInInvite/>;return <Outlet/>;}