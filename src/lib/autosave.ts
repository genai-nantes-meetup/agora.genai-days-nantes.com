// Pure autosave scheduling for profile fields: any change schedules a save
// after AUTOSAVE_IDLE_MS of inactivity; leaving a field saves immediately
// when something changed. No DOM or React dependencies.
export const AUTOSAVE_IDLE_MS=10000;
export function createAutosave(onSave:()=>void){
 let dirty=false;let timer:ReturnType<typeof setTimeout>|null=null;
 function clear(){if(timer){clearTimeout(timer);timer=null;}}
 function fire(){clear();if(dirty){dirty=false;onSave();}}
 return{
  changed(){dirty=true;clear();timer=setTimeout(fire,AUTOSAVE_IDLE_MS);},
  focusLeft:fire,
  settle(){clear();dirty=false;},
  isDirty(){return dirty;},
  dispose:clear
 };
}
