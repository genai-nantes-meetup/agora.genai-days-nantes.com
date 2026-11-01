import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {AUTOSAVE_IDLE_MS,createAutosave} from './autosave';

describe('autosave scheduler',()=>{
 beforeEach(()=>vi.useFakeTimers());
 afterEach(()=>vi.useRealTimers());

 it('saves once after the idle delay without activity',()=>{
  const onSave=vi.fn();const autosave=createAutosave(onSave);
  autosave.changed();
  vi.advanceTimersByTime(AUTOSAVE_IDLE_MS-1);
  expect(onSave).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(onSave).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(AUTOSAVE_IDLE_MS*3);
  expect(onSave).toHaveBeenCalledTimes(1);
 });

 it('resets the idle delay on each new change',()=>{
  const onSave=vi.fn();const autosave=createAutosave(onSave);
  autosave.changed();
  vi.advanceTimersByTime(AUTOSAVE_IDLE_MS-1);
  autosave.changed();
  vi.advanceTimersByTime(AUTOSAVE_IDLE_MS-1);
  expect(onSave).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(onSave).toHaveBeenCalledTimes(1);
 });

 it('saves immediately when focus leaves the field after a change',()=>{
  const onSave=vi.fn();const autosave=createAutosave(onSave);
  autosave.changed();
  autosave.focusLeft();
  expect(onSave).toHaveBeenCalledTimes(1);
 });

 it('does not save when focus leaves with no pending change',()=>{
  const onSave=vi.fn();const autosave=createAutosave(onSave);
  autosave.changed();
  autosave.focusLeft();
  autosave.focusLeft();
  expect(onSave).toHaveBeenCalledTimes(1);
 });

 it('settle cancels a pending save without calling it',()=>{
  const onSave=vi.fn();const autosave=createAutosave(onSave);
  autosave.changed();
  autosave.settle();
  vi.advanceTimersByTime(AUTOSAVE_IDLE_MS*2);
  expect(onSave).not.toHaveBeenCalled();
  expect(autosave.isDirty()).toBe(false);
 });

 it('dispose cancels the pending save',()=>{
  const onSave=vi.fn();const autosave=createAutosave(onSave);
  autosave.changed();
  autosave.dispose();
  vi.advanceTimersByTime(AUTOSAVE_IDLE_MS*2);
  expect(onSave).not.toHaveBeenCalled();
 });
});
