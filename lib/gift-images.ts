export function giftImageFor(name:string):string {
 const n=name.toLowerCase();
 if(/tiffin|lunch/.test(n))return '/images/daily-needs/lunch-box.webp';
 if(/water bottle/.test(n))return '/images/daily-needs/school-bottle.webp';
 const image=/teddy|soft toy/.test(n)?'teddy-bear':/greeting|card/.test(n)?'greeting-card':/couple.*mug/.test(n)?'couple-mugs':/mug/.test(n)?'coffee-mug':/frame/.test(n)?'photo-frame':/key.?chain/.test(n)?'keychain':/chocolat/.test(n)?'chocolate-gift':/wrap/.test(n)?'wrapping-paper':/birthday|festival/.test(n)?'return-gift':/clock/.test(n)?'wall-clock':/vase/.test(n)?'flower-vase':'gift-bag';
 return `/images/gifts/${image}.webp`;
}
