export type Entry = {id:string; channel:string; name:string; text:string; avatar:string; link:string};
export type Collection = {platform:'youtube'; title:string; owner:string; demo:boolean; fetched:number; skipped:number; collectedAt:number; entries:Entry[]};
export type Result = {title:string; demo:boolean; time:number; tickets:number; people:number; weighted:boolean; winners:Entry[]};
