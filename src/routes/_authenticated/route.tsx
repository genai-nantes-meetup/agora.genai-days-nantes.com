import {createFileRoute,Outlet} from '@tanstack/react-router';
import {useAuth} from '@/lib/auth';
import {SignInInvite} from '@/components/SignInInvite';
import {LoadingView,ErrorView} from '@/components/common';
import {useQuery} from '@tanstack/react-query';
import {myProfileOptions} from '@/lib/member-queries';
import {profileComplete} from '@/lib/networking';
import {AccountOnboarding} from '@/components/AccountOnboarding';
export const Route=createFileRoute('/_authenticated')({ssr:false,component:AccountLayout});
function AccountLayout(){const {user,ready}=useAuth();if(!ready)return <LoadingView/>;if(!user)return <SignInInvite/>;return <MemberGate uid={user.id}/>;}
function MemberGate({uid}:{uid:string}){const q=useQuery(myProfileOptions(uid));if(q.isPending)return <LoadingView/>;if(q.isError||!q.data)return <ErrorView onRetry={()=>q.refetch()}/>;if(!profileComplete(q.data))return <AccountOnboarding profile={q.data}/>;return <Outlet/>;}