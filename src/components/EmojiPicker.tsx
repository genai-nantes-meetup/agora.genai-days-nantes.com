// Small desktop-only emoji picker, lazy-loaded by the composer. Mobile relies on the native keyboard.
const EMOJIS = ['😀','😄','😁','😅','😂','🙂','😉','😊','😍','🤩','😎','🤔','🤗','🙌','👏','👍','👋','🙏','💪','🤝','❤️','🔥','✨','🎉','🚀','💡','✅','👀','☕','🥐','🍷','📅','📍','💼','🤖','🧠','📈','🎤','😮','😢'];
export default function EmojiPicker({onPick,label}:{onPick:(emoji:string)=>void;label:string}){
 return <div role="listbox" aria-label={label} className="grid w-64 grid-cols-8 gap-1 rounded-md border bg-popover p-2 shadow-md">{EMOJIS.map(e=><button key={e} type="button" role="option" aria-selected={false} className="rounded p-1 text-xl hover:bg-surface" onClick={()=>onPick(e)}>{e}</button>)}</div>;
}
