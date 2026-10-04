const color = (name, hex) => ({ name, hex });
const palette = (bestColors, avoidColors, stylingTip) => ({ bestColors, avoidColors, stylingTip });

// Explicit depth/undertone combinations keep every saved profile deterministic.
export const PALETTE_TABLE = Object.freeze({
  fair: {
    warm: palette([color('Peach','#F4A582'),color('Coral','#E76F51'),color('Warm Ivory','#FFF1D0'),color('Camel','#C19A6B'),color('Sage','#A3B18A'),color('Teal','#2A9D8F'),color('Terracotta','#C65D3B')],[color('Icy Blue','#C8DDF0'),color('Cool Lavender','#B8A9D9'),color('Optic White','#FFFFFF')],'Try warm, medium-value colors near your face; use ivory instead of stark white.'),
    cool: palette([color('Berry','#9B3155'),color('Rose','#D47791'),color('Soft Navy','#344B6C'),color('Periwinkle','#8FA8D4'),color('Pine','#346B5B'),color('Plum','#74436B'),color('Cool Gray','#9CA3AF')],[color('Mustard','#D4A017'),color('Orange','#E87524'),color('Warm Camel','#C19A6B')],'Choose softened jewel tones and cool pinks; keep very yellow shades away from the face.'),
    neutral: palette([color('Dusty Rose','#C98291'),color('Soft Teal','#5F9E9A'),color('Mushroom','#A79383'),color('Denim','#52769B'),color('Olive','#78866B'),color('Mauve','#A27C9D'),color('Soft White','#F4F1EA')],[color('Neon Yellow','#DFFF00'),color('Electric Orange','#FF5B00'),color('Icy Lilac','#DDD6F3')],'Balanced, gently muted shades are easy to wear; mix one soft color with a neutral.'),
  },
  light: {
    warm: palette([color('Warm Coral','#E8755A'),color('Apricot','#F2A66F'),color('Olive','#74834A'),color('Warm Navy','#283D5B'),color('Cream','#F2E5C4'),color('Rust','#B85C38'),color('Jade','#278B73')],[color('Pale Gray','#D8DDE2'),color('Icy Pink','#E7C9D4'),color('Neon Lime','#B7E000')],'Use clear warm shades with enough depth to create gentle contrast.'),
    cool: palette([color('Cranberry','#A52A4C'),color('Cool Red','#B94354'),color('Sapphire','#315AA6'),color('Emerald','#24745B'),color('Lavender','#A68BC5'),color('Blue Gray','#667F99'),color('Rose Pink','#D77E9A')],[color('Golden Mustard','#C99916'),color('Orange','#DF702E'),color('Warm Beige','#D1B48C')],'Cool reds and blues give definition; pair a bright shade with a calm neutral.'),
    neutral: palette([color('Soft Navy','#354C6B'),color('Muted Coral','#D87B69'),color('Sea Glass','#68A9A0'),color('Mauve','#9B7191'),color('Stone','#A89B89'),color('Pine','#3E705E'),color('Cream','#F3EBDD')],[color('Highlighter Yellow','#DFFF00'),color('Neon Pink','#FF2D95'),color('Very Pale Beige','#F4EAD8')],'Choose medium-strength colors; a tonal outfit with one accent shade works well.'),
  },
  medium: {
    warm: palette([color('Paprika','#C64D32'),color('Mustard','#D2A21B'),color('Forest','#315B3D'),color('Petrol Teal','#176B70'),color('Warm Cream','#F1E1BE'),color('Cinnamon','#A95732'),color('Deep Coral','#D95D4F')],[color('Ash Gray','#A9ADB1'),color('Icy Blue','#BED5E8'),color('Neon Yellow','#DFFF00')],'Earthy, saturated colors complement warmth; add cream for a lighter balance.'),
    cool: palette([color('Cobalt','#315AB5'),color('Raspberry','#B33260'),color('Aubergine','#56345F'),color('Pine','#28624E'),color('Plum','#784469'),color('Cool Red','#B83A4B'),color('Slate','#5E7185')],[color('Golden Orange','#D66A21'),color('Warm Mustard','#D2A21B'),color('Peach Beige','#EBC7A2')],'Try crisp jewel tones and berry shades, balanced with navy or slate.'),
    neutral: palette([color('Teal','#247F7B'),color('Terracotta','#B95D45'),color('Denim','#426C91'),color('Olive','#707B45'),color('Berry','#8E3D5A'),color('Warm Taupe','#9C8170'),color('Soft White','#F2F0E9')],[color('Neon Green','#39FF14'),color('Fluorescent Orange','#FF5B00'),color('Flat Beige','#CBB99C')],'A mix of earthy and jewel tones creates flexible combinations without overpowering.'),
  },
  tan: {
    warm: palette([color('Burnt Sienna','#B84A2F'),color('Turquoise','#168C91'),color('Marigold','#D69E16'),color('Olive','#68763E'),color('Ivory','#F4E8CA'),color('Tomato Red','#CE4438'),color('Chocolate','#5A382C')],[color('Dusty Mauve','#B89AAE'),color('Cool Silver','#BFC4C9'),color('Pale Peach','#F5D4C3')],'Rich warm colors and vivid turquoise add contrast; ground the look with chocolate or olive.'),
    cool: palette([color('Royal Blue','#3158A8'),color('Fuchsia','#C32976'),color('Emerald','#167054'),color('Wine','#713447'),color('Icy Lilac','#A999C8'),color('Cool White','#F4F5F7'),color('Cranberry','#A52D50')],[color('Pumpkin','#D96A22'),color('Golden Yellow','#D4A31A'),color('Warm Camel','#B98A5F')],'Clear cool jewel tones create definition; use cool white or navy as a grounding neutral.'),
    neutral: palette([color('Deep Teal','#176B70'),color('Brick','#A84D3D'),color('Petrol Blue','#285C78'),color('Plum','#704366'),color('Sage','#84916B'),color('Oat','#D9C8AA'),color('Berry','#963E5A')],[color('Neon Lime','#B7E000'),color('Fluorescent Pink','#FF2D95'),color('Pale Gray','#D8DDE2')],'Blend mid-depth neutrals with one saturated accent for a balanced look.'),
  },
  deep: {
    warm: palette([color('Saffron','#E0A51B'),color('Vermilion','#D44732'),color('Jade','#16836B'),color('Cobalt','#315DB8'),color('Warm Ivory','#F4E6C7'),color('Copper','#B8663D'),color('Bright Teal','#078C8B')],[color('Dusty Gray','#85878A'),color('Pale Lavender','#D3C8E3'),color('Muted Taupe','#A08E7A')],'Choose vivid warm colors and bright teal; strong contrast keeps outfits lively.'),
    cool: palette([color('Fuchsia','#C32976'),color('Sapphire','#315BB4'),color('Emerald','#08744F'),color('Icy Blue','#A8C8E5'),color('Ruby','#B51F3A'),color('Lavender','#A58BC7'),color('Cool White','#F7F8FA')],[color('Warm Beige','#D2B18A'),color('Rust','#A94F31'),color('Mustard','#C99715')],'Cool, saturated colors and crisp light shades create clear, confident contrast.'),
    neutral: palette([color('Aqua','#22A6A1'),color('Persimmon','#DD6243'),color('Orchid','#A35288'),color('Royal Blue','#355CB5'),color('Lime','#87A93B'),color('Soft Cream','#F2EAD8'),color('Red','#C9323E')],[color('Muddy Brown','#705849'),color('Flat Gray','#777B80'),color('Dark Olive','#4F5636')],'Use bright colors or soft cream near the face; avoid muddy shades that reduce contrast.'),
  },
});

export function getPalette(depth, undertone) {
  const depthKey = String(depth || '').toLowerCase() === 'very-deep' ? 'deep' : String(depth || '').toLowerCase();
  return PALETTE_TABLE[depthKey]?.[String(undertone || '').toLowerCase()] || null;
}
