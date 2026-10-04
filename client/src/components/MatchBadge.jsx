import { FiSun } from 'react-icons/fi';
import { matchesUserColors } from '../utils/colorMatch.js';
import { useColorProfile } from '../context/ColorProfileContext.jsx';

export default function MatchBadge({ product }) {
  const { colorProfile } = useColorProfile();
  if (!matchesUserColors(product, colorProfile)) return null;
  return <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800"><FiSun/> Matches your color</span>;
}
