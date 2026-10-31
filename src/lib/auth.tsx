import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {useRouter} from '@tanstack/react-router';
import type {User} from '@supabase/supabase-js';
import {supabase} from '@/integrations/supabase/client';
const AuthContext=createContext<{user:User|null;ready:boolean}>({user:null,ready:false});
export function AuthProvider({children}:{children:ReactNode}) {
 const [user,setUser]=useState<User|null>(null);const [ready,setReady]=useState(false);const router=useRouter();const queryClient=useQueryClient();
 useEffect(()=>{let mounted=true;const {data:subscription}=supabase.auth.onAuthStateChange((event,session)=>{if(!['INITIAL_SESSION','SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event))return;setUser(session?.user??null);setReady(true);if(event==='INITIAL_SESSION')return;void router.invalidate();if(event!=='SIGNED_OUT')void queryClient.invalidateQueries();});void supabase.auth.getUser().then(({data})=>{if(mounted){setUser(data.user);setReady(true);}});return()=>{mounted=false;subscription.subscription.unsubscribe();};},[router,queryClient]);
 return <AuthContext.Provider value={{user,ready}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);