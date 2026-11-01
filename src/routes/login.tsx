import {createFileRoute} from '@tanstack/react-router';
import {EmailSignIn} from '@/components/EmailSignIn';
export const Route=createFileRoute('/login')({head:()=>({meta:[{title:'Connexion · GenAI Days Agora'},{name:'description',content:'Connexion sur invitation aux GenAI Days.'},{property:'og:title',content:'Connexion · GenAI Days Agora'},{property:'og:description',content:'Retrouvez votre profil participant.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:EmailSignIn});
