import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const slugify = (value) => value.toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const escapeXml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
}[char]));

const fashionShape = (name) => {
  const text = name.toLowerCase();
  if (/t[- ]?shirt|jersey|cotton top|poplin top|\btop\b/.test(text)) return 'tshirt';
  if (/sweater|hoodie|knit/.test(text)) return 'hoodie';
  if (/jacket|blazer|overshirt/.test(text)) return 'jacket';
  if (/jeans|trousers|chinos|pants/.test(text)) return 'trousers';
  if (/skirt/.test(text)) return 'skirt';
  if (/dress/.test(text)) return 'dress';
  if (/scarf/.test(text)) return 'scarf';
  if (/bag|tote|backpack/.test(text)) return 'bag';
  if (/shoes|sneakers|boots/.test(text)) return 'shoes';
  if (/cap|hat/.test(text)) return 'cap';
  if (/shirt/.test(text)) return 'shirt';
  return 'tshirt';
};

function garment(name, color) {
  const shapes = {
    tshirt: `<path d="M218 115 165 137 104 240l66 42 35-52v198q95 28 190 0V230l35 52 66-42-61-103-53-22q-24 34-82 34t-82-34Z" fill="${color}" stroke="#172033" stroke-opacity=".22" stroke-width="8" stroke-linejoin="round"/><path d="M220 116q18 40 80 40t80-40" fill="none" stroke="#101827" stroke-opacity=".23" stroke-width="12"/><path d="M205 256v167q95 28 190 0V256" fill="#fff" opacity=".09"/>`,
    shirt: `<path d="m220 115-55 24-61 101 66 42 35-52v198q95 28 190 0V230l35 52 66-42-61-101-55-24-35 42-45 12-45-12-35-42Z" fill="${color}" stroke="#172033" stroke-opacity=".22" stroke-width="8" stroke-linejoin="round"/><path d="m220 115 40 54-30 25-29-55m119-24-40 54 30 25 29-55" fill="#fff" opacity=".2"/><path d="M300 169v253" stroke="#101827" stroke-opacity=".22" stroke-width="7"/><circle cx="300" cy="220" r="5" fill="#fff" opacity=".85"/><circle cx="300" cy="270" r="5" fill="#fff" opacity=".85"/><circle cx="300" cy="320" r="5" fill="#fff" opacity=".85"/>`,
    hoodie: `<path d="M215 160q-55 10-74 52l-37 94 69 31 30-58v153q97 27 194 0V279l30 58 69-31-37-94q-19-42-74-52l-24-34h-122l-24 34Z" fill="${color}" stroke="#172033" stroke-opacity=".23" stroke-width="8" stroke-linejoin="round"/><path d="M235 157q8-77 65-77t65 77q-24 38-65 38t-65-38Z" fill="#101827" opacity=".16"/><path d="M263 186v65m74-65v65M258 317q42 30 84 0v55h-84Z" fill="none" stroke="#101827" stroke-opacity=".26" stroke-width="8" stroke-linecap="round"/><path d="M207 302v126q93 25 186 0V302" fill="#fff" opacity=".07"/>`,
    jacket: `<path d="m220 114-57 26-60 105 67 43 34-52v171q96 31 192 0V236l34 52 67-43-60-105-57-26-40 43-40 10-40-10-40-43Z" fill="${color}" stroke="#172033" stroke-opacity=".24" stroke-width="8" stroke-linejoin="round"/><path d="m220 114 45 76 35-22-40 111-33-72-22 30v171m175-294-45 76-35-22 40 111 33-72 22 30v171" fill="#111827" opacity=".14"/><path d="M300 168v251" stroke="#111827" stroke-opacity=".23" stroke-width="7"/><path d="M189 288h25m-25 48h25m172-48h25m-25 48h25" stroke="#111827" stroke-opacity=".24" stroke-width="8" stroke-linecap="round"/>`,
    trousers: `<path d="M202 105h196l-18 130 35 229q-47 22-91-2l-23-174-23 174q-44 24-91 2l35-229-20-130Z" fill="${color}" stroke="#172033" stroke-opacity=".24" stroke-width="8" stroke-linejoin="round"/><path d="M202 105h196l-7 54H210Z" fill="#111827" opacity=".14"/><path d="M301 159v128" stroke="#111827" stroke-opacity=".24" stroke-width="7"/><path d="M220 179h43m74 0h43" stroke="#fff" stroke-opacity=".22" stroke-width="8" stroke-linecap="round"/>`,
    skirt: `<path d="M215 112h170l14 82 74 247q-173 45-346 0l74-247 14-82Z" fill="${color}" stroke="#172033" stroke-opacity=".22" stroke-width="8" stroke-linejoin="round"/><path d="M215 112h170l8 57H207Z" fill="#111827" opacity=".14"/><path d="m267 180-31 248m97-248 31 248" stroke="#fff" stroke-opacity=".19" stroke-width="8"/>`,
    dress: `<path d="M240 105q20 42 60 42t60-42l38 22 48 113-61 37-28-48 72 211q-129 44-258 0l72-211-28 48-61-37 48-113 38-22Z" fill="${color}" stroke="#172033" stroke-opacity=".22" stroke-width="8" stroke-linejoin="round"/><path d="M240 105q20 42 60 42t60-42m-60 42v69m-59-7h118" fill="none" stroke="#111827" stroke-opacity=".23" stroke-width="8"/><path d="m229 238-63 202m205-202 63 202" stroke="#fff" stroke-opacity=".14" stroke-width="10"/>`,
    scarf: `<path d="m190 105 104 53 96-53-20 194 40 124-67 39-45-144-43 148-67-30 38-139Z" fill="${color}" stroke="#172033" stroke-opacity=".22" stroke-width="8" stroke-linejoin="round"/><path d="m205 137 163 84m-150-38 140 72m-130-23 113 58" stroke="#fff" stroke-opacity=".2" stroke-width="10"/>`,
    bag: `<path d="M170 210h260l-22 230H192l-22-230Z" fill="${color}" stroke="#172033" stroke-opacity=".22" stroke-width="8" stroke-linejoin="round"/><path d="M225 216v-42q0-77 75-77t75 77v42" fill="none" stroke="${color}" stroke-width="24"/><path d="M225 216v-42q0-77 75-77t75 77v42" fill="none" stroke="#111827" stroke-opacity=".22" stroke-width="8"/><path d="M192 255h216v155H192Z" fill="#fff" opacity=".09"/><path d="M300 282v82m-28-41h56" stroke="#fff" stroke-opacity=".5" stroke-width="8" stroke-linecap="round"/>`,
    shoes: `<path d="M105 348q54-4 82-95l53-4q22 66 90 92l142 39q33 9 29 52H112q-32-14-7-84Z" fill="${color}" stroke="#172033" stroke-opacity=".23" stroke-width="8" stroke-linejoin="round"/><path d="M108 414h389q11 23 4 39H111q-22-12-3-39Z" fill="#fff" opacity=".85"/><path d="m256 275 32 57m-2-65 32 57m-1-65 32 57" stroke="#fff" stroke-opacity=".72" stroke-width="8" stroke-linecap="round"/>`,
    cap: `<path d="M130 325q0-162 170-196 151 4 174 173l-166 36-178 10Z" fill="${color}" stroke="#172033" stroke-opacity=".23" stroke-width="8" stroke-linejoin="round"/><path d="M126 326q198-38 360-18 26 5 14 31-82 65-211 46-102-8-157-59" fill="${color}" stroke="#172033" stroke-opacity=".24" stroke-width="8"/><path d="M301 132v185m-144 7q79-39 144-41" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="9"/>`,
  };
  return shapes[fashionShape(name)];
}

function lineTitle(name, maxChars = 18, maxLines = 3) {
  const words = name.split(/\s+/); const lines = []; let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) { lines.push(current); current = word; } else current = next;
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

function accessoryShape(name, category, accent) {
  const value = name.toLowerCase();
  if (category === 'books') {
    const lines = lineTitle(name, 17, 4);
    return `<g filter="url(#shadow)"><path d="M183 95h214q27 0 27 28v326H207q-24 0-24-25V95Z" fill="${accent}"/><path d="M207 95v354q-24 0-24-25V95h24Z" fill="#172033" opacity=".23"/><path d="M225 123h166v2H225Z" fill="#fff" opacity=".38"/>${lines.map((line,index)=>`<text x="238" y="220" dy="${index*31}" fill="#fff" font-size="24" font-weight="700">${escapeXml(line)}</text>`).join('')}<path d="M238 369h119" stroke="#fff" stroke-width="4" opacity=".55"/><text x="238" y="410" fill="#fff" font-size="15" letter-spacing="2" opacity=".78">NORTHSTAR PRESS</text></g>`;
  }
  if (category === 'electronics') {
    if (/headphone/.test(value)) return `<path d="M164 314v-54q0-141 136-141t136 141v54" fill="none" stroke="${accent}" stroke-width="36" stroke-linecap="round"/><rect x="137" y="284" width="76" height="146" rx="30" fill="${accent}"/><rect x="387" y="284" width="76" height="146" rx="30" fill="${accent}"/><rect x="153" y="302" width="28" height="106" rx="14" fill="#fff" opacity=".28"/><rect x="403" y="302" width="28" height="106" rx="14" fill="#fff" opacity=".28"/>`;
    if (/speaker/.test(value)) return `<rect x="190" y="125" width="220" height="320" rx="48" fill="${accent}"/><rect x="207" y="142" width="186" height="286" rx="37" fill="#172033" opacity=".11"/><circle cx="300" cy="270" r="71" fill="#fff" opacity=".82"/><circle cx="300" cy="270" r="34" fill="${accent}"/><circle cx="300" cy="270" r="12" fill="#fff" opacity=".78"/><circle cx="300" cy="378" r="19" fill="#fff" opacity=".84"/>`;
    if (/lamp/.test(value)) return `<path d="m231 151 131 5 47 104H184l47-109Z" fill="${accent}"/><path d="m248 260 26 139h52l27-139" fill="none" stroke="${accent}" stroke-width="24" stroke-linecap="round"/><path d="M245 420h130" stroke="${accent}" stroke-width="24" stroke-linecap="round"/><path d="m229 272 28 89m114-89-28 89" stroke="#fff" stroke-width="7" opacity=".45"/>`;
    if (/keyboard/.test(value)) return `<rect x="112" y="196" width="376" height="214" rx="25" fill="${accent}"/><rect x="129" y="213" width="342" height="178" rx="14" fill="#fff" opacity=".16"/>${Array.from({length:4},(_,row)=>Array.from({length:11},(_,col)=>`<rect x="${143+col*29}" y="${229+row*37}" width="22" height="25" rx="5" fill="#fff" opacity="${(row+col)%2?.7:.9}"/>`).join('')).join('')}<rect x="209" y="378" width="184" height="10" rx="5" fill="#fff" opacity=".86"/>`;
    if (/mouse/.test(value)) return `<path d="M300 110q125 0 125 132v102q0 111-125 111T175 344V242q0-132 125-132Z" fill="${accent}"/><path d="M300 113v123m-124 6h248" stroke="#fff" stroke-width="8" opacity=".45"/><rect x="287" y="150" width="26" height="47" rx="13" fill="#fff" opacity=".82"/>`;
    if (/watch/.test(value)) return `<path d="M246 96h108l18 98H228l18-98Zm-18 256h144l-18 116H246l-18-116Z" fill="${accent}"/><rect x="187" y="177" width="226" height="204" rx="48" fill="${accent}"/><rect x="207" y="197" width="186" height="164" rx="32" fill="#172033"/><circle cx="300" cy="279" r="49" fill="#fff" opacity=".9"/><path d="M300 244v38l24 15" fill="none" stroke="${accent}" stroke-width="9" stroke-linecap="round"/>`;
    if (/camera/.test(value)) return `<rect x="143" y="185" width="314" height="230" rx="30" fill="${accent}"/><path d="m205 185 35-49h120l35 49" fill="${accent}"/><circle cx="300" cy="300" r="82" fill="#fff" opacity=".88"/><circle cx="300" cy="300" r="53" fill="#172033" opacity=".72"/><circle cx="300" cy="300" r="30" fill="${accent}"/><circle cx="414" cy="225" r="12" fill="#fff"/>`;
    if (/ssd|storage/.test(value)) return `<rect x="176" y="127" width="248" height="304" rx="32" fill="${accent}"/><rect x="196" y="147" width="208" height="264" rx="22" fill="#172033" opacity=".12"/><circle cx="300" cy="278" r="69" fill="#fff" opacity=".82"/><path d="M266 278h68m-34-34v68" stroke="${accent}" stroke-width="13" stroke-linecap="round"/><path d="M236 382h128" stroke="#fff" stroke-width="8" opacity=".7"/>`;
    return `<rect x="168" y="167" width="264" height="260" rx="36" fill="${accent}"/><path d="M215 167v-43h170v43" fill="none" stroke="${accent}" stroke-width="18" stroke-linecap="round"/><circle cx="230" cy="375" r="11" fill="#fff"/><circle cx="274" cy="375" r="11" fill="#fff"/><circle cx="318" cy="375" r="11" fill="#fff"/><circle cx="362" cy="375" r="11" fill="#fff"/>`;
  }
  if (/cushion|pillow/.test(value)) return `<path d="M173 170q127-44 254 0 44 130 0 260-127 44-254 0-44-130 0-260Z" fill="${accent}"/><path d="M202 195q98-29 196 0 29 98 0 196-98 29-196 0-29-98 0-196Z" fill="none" stroke="#fff" stroke-width="9" opacity=".52"/><path d="M300 203v194m-97-97h194" stroke="#fff" stroke-width="5" opacity=".25"/>`;
  if (/mug|coffee|carafe|water/.test(value)) return `<path d="M190 166h220v216q0 49-49 49h-122q-49 0-49-49V166Z" fill="${accent}"/><path d="M410 205h37q63 0 63 65t-63 65h-37" fill="none" stroke="${accent}" stroke-width="27"/><path d="M214 193h172v170H214Z" fill="#fff" opacity=".12"/><path d="M233 146q-20-30 0-59m72 59q-20-30 0-59m72 59q-20-30 0-59" fill="none" stroke="${accent}" stroke-width="9" stroke-linecap="round" opacity=".6"/>`;
  if (/lamp/.test(value)) return `<path d="m231 151 131 5 47 104H184l47-109Z" fill="${accent}"/><path d="m248 260 26 139h52l27-139" fill="none" stroke="${accent}" stroke-width="24" stroke-linecap="round"/><path d="M245 420h130" stroke="${accent}" stroke-width="24" stroke-linecap="round"/>`;
  if (/planter|plant/.test(value)) return `<path d="M210 270h180l-20 168H230l-20-168Z" fill="${accent}"/><path d="M300 270q-12-88-88-94 8 80 88 94Zm0 0q20-122 112-130-5 111-112 130Zm0 0q-4-72-59-121 4 79 59 121Z" fill="#66865b"/><path d="M300 271v-98" stroke="#466747" stroke-width="9"/>`;
  if (/basket/.test(value)) return `<path d="M162 217h276l-25 215H187l-25-215Z" fill="${accent}"/><path d="M220 217q0-101 80-101t80 101" fill="none" stroke="${accent}" stroke-width="23"/><path d="M185 263h230m-220 53h210m-198 53h186m-162-150v211m65-211v211m65-211v211" stroke="#fff" stroke-width="8" opacity=".42"/>`;
  if (/candle/.test(value)) return `<rect x="209" y="176" width="182" height="254" rx="17" fill="${accent}"/><path d="M300 176v-58" stroke="#60483b" stroke-width="9"/><path d="M300 133q-31-31 0-62 31 31 0 62Z" fill="#f4ad52"/><rect x="228" y="248" width="144" height="112" rx="7" fill="#fff" opacity=".82"/><path d="M253 281h94m-82 26h70m-61 26h52" stroke="${accent}" stroke-width="7" opacity=".75"/>`;
  if (/cutting board|board/.test(value)) return `<path d="M200 139h200q32 0 32 32v256q0 28-28 28H196q-28 0-28-28V171q0-32 32-32Z" fill="${accent}"/><circle cx="300" cy="179" r="13" fill="#fff" opacity=".72"/><path d="M218 236q84 60 164 0m-164 52q84 60 164 0m-164 52q84 60 164 0" fill="none" stroke="#fff" stroke-width="8" opacity=".28"/>`;
  if (/dinner|ceramic|set/.test(value)) return `<ellipse cx="300" cy="362" rx="178" ry="70" fill="${accent}"/><ellipse cx="300" cy="346" rx="135" ry="45" fill="#fff" opacity=".88"/><ellipse cx="300" cy="346" rx="93" ry="27" fill="${accent}" opacity=".5"/><path d="M183 202q58-53 117 0v81H183Zm136 0q58-53 117 0v81H319Z" fill="${accent}"/><path d="M192 214q49-39 98 0m39 0q49-39 98 0" fill="none" stroke="#fff" stroke-width="8" opacity=".7"/>`;
  if (/quilt|blanket/.test(value)) return `<path d="M150 166q150-47 300 0v260q-150 47-300 0V166Z" fill="${accent}"/><path d="M150 231q150-47 300 0m-300 65q150-47 300 0m-300 65q150-47 300 0M225 150v292m75-305v325m75-325v305" fill="none" stroke="#fff" stroke-width="7" opacity=".42"/>`;
  if (/book stand|stand/.test(value)) return `<path d="m205 160 190 56-62 210-190-56 62-210Z" fill="${accent}"/><path d="m175 372 210 62 45-50-212-63-43 51Z" fill="#172033" opacity=".16"/><path d="M236 221 352 256m-128 5 111 34m-125 7 100 30" stroke="#fff" stroke-width="8" opacity=".56"/>`;
  return `<path d="M190 213h220l-18 218H208l-18-218Z" fill="${accent}"/><path d="M224 213v-45q0-56 76-56t76 56v45" fill="none" stroke="${accent}" stroke-width="20"/><path d="M218 261h164" stroke="#fff" stroke-width="9" opacity=".38"/>`;
}

export function productSvg({ name, category, colorHex }) {
  const fashion = category === 'fashion';
  const accent = fashion ? colorHex : ({ electronics: '#6674d9', home: '#c77b54', books: '#4f6a52' }[category] || '#6674d9');
  const art = fashion ? garment(name, accent) : accessoryShape(name, category, accent);
  const title = escapeXml(name);
  const fashionLabel = fashion ? `<text x="300" y="536" text-anchor="middle" fill="#475569" font-size="20" font-weight="600" font-family="Arial,sans-serif">${title}</text>` : '';
  const nonBookLabel = !fashion && category !== 'books' ? `<text x="300" y="536" text-anchor="middle" fill="#334155" font-size="18" font-weight="600" font-family="Arial,sans-serif" textLength="500" lengthAdjust="spacingAndGlyphs">${title}</text>` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title><desc id="desc">Illustration of ${title}</desc>
  <defs><filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="12" stdDeviation="13" flood-color="#172033" flood-opacity=".15"/></filter></defs>
  <rect width="600" height="600" fill="#f4f2ed"/><circle cx="300" cy="276" r="207" fill="#fff" opacity=".64"/><ellipse cx="300" cy="476" rx="158" ry="18" fill="#172033" opacity=".1"/>
  <g>${art}</g>${fashionLabel}${nonBookLabel}
</svg>`;
}

export async function prepareIllustrationDirectory(directory) {
  await mkdir(directory, { recursive: true });
  for (const file of await readdir(directory)) {
    if (file.toLowerCase().endsWith('.svg')) await unlink(path.join(directory, file));
  }
}

export async function writeProductSvg(directory, name, category, color) {
  const filename = `${slugify(name)}${color ? `-${slugify(color.name)}` : ''}.svg`;
  await writeFile(path.join(directory, filename), productSvg({ name, category, colorHex: color?.hex }), 'utf8');
  return `/uploads/products/${filename}`;
}
