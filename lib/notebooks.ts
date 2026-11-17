export function notebookImageFor(name:string):string {
 const text=name.toLowerCase();
 if(/diar|pocket|small book|memo/.test(text)&&!/\d/.test(text))return '/images/notebooks/diary.webp';
 if(/draw|sketch|colou?r|activity/.test(text))return '/images/notebooks/drawing.webp';
 if(/graph/.test(text))return '/images/notebooks/graph.webp';
 if(/record|register|ledger|cash book|receipt book|invoice book|project book|assignment/.test(text))return '/images/notebooks/record.webp';
 if(/spiral|binding/.test(text))return '/images/notebooks/spiral.webp';
 const size=/short|small|school note/.test(text)?'short':'long';
 const pages=/172/.test(text)?172:/200/.test(text)?200:100;
 return `/images/notebooks/${size}-${pages}.webp`;
}
export const notebookProducts=[
 ...['Classmate Notebook','A4 Notebook','Ruled Notebook','Unruled Notebook','Composition Book'].map(name=>({name,description:'School and office notebooks. Choose your preferred size, page count and ruling in store.',aliases:name+' school books notes'})),
 ...[100,172,200].flatMap(pages=>['Long','Short','Small'].map(size=>({name:`${size} Notebook - ${pages} Pages`,description:`${pages}-page ${size.toLowerCase()} notebook. Ask about current brands, size and ruling.`,aliases:`school notes ${size==='Small'?'small short':''} ${size==='Short'?'small short':''} ${size} books`}))),
 ...['Single Line','Double Line','Four Line','Square Rule','Plain'].flatMap(ruling=>[100,172,200].flatMap(pages=>['Long','Short'].map(size=>({name:`${ruling} ${size} Notebook - ${pages} Pages`,description:`${pages}-page ${size.toLowerCase()} notebook with ${ruling.toLowerCase()} pages.`,aliases:`${ruling} school notes ${size==='Short'?'small short':''} ${size} books` })))),
 ...['Pocket Diary','Daily Diary','Small Memo Book','Drawing Book','Sketch Book','Colouring Book','Activity Book','Graph Book','Practical Record Book','Observation Record Book','Lab Record Book','Class Work Record Book','Project Record Book','Project Book','Assignment Book','Spiral Notebook'].map(name=>({name,description:'Notebook collection. Ask about page counts, brands and available sizes.',aliases:name==='Pocket Diary'?'small diary diaries pocket book':name.includes('Diary')?'diary diaries planner':name.includes('Drawing')?'drawing art plain book':name}))
];
