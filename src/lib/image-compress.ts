// Browser-only: re-encodes a picture as a small square-friendly JPEG so avatars stay light on mobile data.
export const AVATAR_MAX=400;
export const AVATAR_QUALITY=0.8;
export function canvasToJpeg(source:CanvasImageSource,width:number,height:number,max=AVATAR_MAX,quality=AVATAR_QUALITY):Promise<Blob|null>{
 const scale=Math.min(1,max/Math.max(width,height));const w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale));
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');if(!ctx)return Promise.resolve(null);
 ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);ctx.imageSmoothingQuality='high';ctx.drawImage(source,0,0,w,h);
 return new Promise(resolve=>c.toBlob(b=>resolve(b),'image/jpeg',quality));
}
export async function compressBlob(blob:Blob):Promise<Blob|null>{
 const bitmap=await createImageBitmap(blob);try{return await canvasToJpeg(bitmap,bitmap.width,bitmap.height);}finally{bitmap.close();}
}
