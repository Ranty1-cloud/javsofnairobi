// Kenya's 47 counties with well-known towns and places for suggestions. Towns are free text, so any place can be typed in.
export const COUNTIES: Record<string, string[]> = {
  Mombasa: ["Mombasa Island", "Nyali", "Likoni", "Bamburi", "Fort Jesus"],
  Kwale: ["Diani", "Ukunda", "Msambweni", "Shimoni", "Kinango", "Lunga Lunga"],
  Kilifi: ["Kilifi", "Malindi", "Watamu", "Mtwapa", "Mariakani", "Gede"],
  "Tana River": ["Hola", "Garsen", "Bura"],
  Lamu: ["Lamu", "Shela", "Manda", "Mpeketoni"],
  "Taita-Taveta": ["Voi", "Taveta", "Wundanyi", "Mwatate", "Tsavo"],
  Garissa: ["Garissa", "Dadaab", "Masalani"],
  Wajir: ["Wajir", "Habaswein", "Eldas"],
  Mandera: ["Mandera", "Elwak", "Rhamu"],
  Marsabit: ["Marsabit", "Moyale", "Loiyangalani", "North Horr"],
  Isiolo: ["Isiolo", "Merti", "Garbatulla"],
  Meru: ["Meru", "Maua", "Nkubu", "Timau"],
  "Tharaka-Nithi": ["Chuka", "Chogoria", "Marimanti"],
  Embu: ["Embu", "Runyenjes", "Siakago"],
  Kitui: ["Kitui", "Mwingi", "Mutomo"],
  Machakos: ["Machakos", "Athi River", "Kangundo", "Matuu"],
  Makueni: ["Wote", "Makindu", "Emali", "Sultan Hamud"],
  Nyandarua: ["Ol Kalou", "Engineer", "Njabini"],
  Nyeri: ["Nyeri", "Karatina", "Mukurweini", "Naro Moru"],
  Kirinyaga: ["Kerugoya", "Kutus", "Sagana", "Wanguru"],
  "Murang'a": ["Murang'a", "Kenol", "Maragua", "Kangari"],
  Kiambu: ["Thika", "Kiambu", "Limuru", "Ruiru", "Juja", "Karuri", "Kikuyu"],
  Turkana: ["Lodwar", "Kakuma", "Lokichoggio", "Kalokol"],
  "West Pokot": ["Kapenguria", "Makutano", "Sigor"],
  Samburu: ["Maralal", "Baragoi", "Archers Post"],
  "Trans Nzoia": ["Kitale", "Endebess", "Kiminini"],
  "Uasin Gishu": ["Eldoret", "Burnt Forest", "Moiben", "Turbo"],
  "Elgeyo-Marakwet": ["Iten", "Kapsowar", "Chebiemit"],
  Nandi: ["Kapsabet", "Nandi Hills", "Mosoriot"],
  Baringo: ["Kabarnet", "Marigat", "Eldama Ravine", "Lake Baringo"],
  Laikipia: ["Nanyuki", "Nyahururu", "Rumuruti", "Dol Dol"],
  Nakuru: ["Nakuru", "Naivasha", "Gilgil", "Molo", "Njoro", "Hell's Gate"],
  Narok: ["Narok", "Maasai Mara", "Kilgoris", "Ololulunga"],
  Kajiado: ["Kajiado", "Ngong", "Kitengela", "Ongata Rongai", "Loitokitok", "Magadi", "Namanga"],
  Kericho: ["Kericho", "Litein", "Londiani"],
  Bomet: ["Bomet", "Sotik", "Mogogosiek"],
  Kakamega: ["Kakamega", "Mumias", "Malava", "Butere"],
  Vihiga: ["Mbale", "Luanda", "Hamisi"],
  Bungoma: ["Bungoma", "Webuye", "Kimilili", "Mount Elgon"],
  Busia: ["Busia", "Malaba", "Port Victoria"],
  Siaya: ["Siaya", "Bondo", "Ugunja", "Usenge"],
  Kisumu: ["Kisumu", "Ahero", "Maseno", "Kombewa"],
  "Homa Bay": ["Homa Bay", "Mbita", "Rusinga Island", "Oyugis"],
  Migori: ["Migori", "Rongo", "Awendo", "Isebania"],
  Kisii: ["Kisii", "Ogembo", "Suneka"],
  Nyamira: ["Nyamira", "Keroka", "Nyansiongo"],
  Nairobi: ["Nairobi CBD", "Westlands", "Karen", "Kasarani", "Langata", "Embakasi", "Eastleigh"],
};
export const COUNTY_NAMES = Object.keys(COUNTIES).sort((a, b) => a.localeCompare(b));
export const isCounty = (c: string) => Object.prototype.hasOwnProperty.call(COUNTIES, c);
export const slugify = (s: string) => s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
// "Naivasha" in "Nakuru" -> { name: "Naivasha", region: "Nakuru County" }. No town -> the county itself.
export const placeOf = (county: string, town: string) => ({ name: town.trim() || county, region: `${county} County`, slug: slugify(town.trim() ? `${town}-${county}` : county) });
// Reverse of placeOf, used to prefill edit forms. Older destinations without a county come back with county "".
export const countyOf = (region: string, name: string) => {
  const c = region.replace(/ County$/, "");
  return isCounty(c) && region.endsWith(" County") ? { county: c, town: name === c ? "" : name } : { county: "", town: "" };
};
