import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CartItem {
  id: number | string;
  name: string;
  mood: string;
  price: number;
  weight: string;
  badge: string;
  badgeBg: string;
  image: string;
  description: string;
  qty: number;
}

interface CustomerOrder { id:string; customerName:string; customerPhone:string; items:{name:string;weight:string;qty:number;price:number}[]; total:number; mode:string; deliveryTime:string; status:string; createdAt:string; updatedAt:string; history:{status:string;at:string}[]; }
interface GoogleUser { sub:string; email:string; name:string; picture?:string; }

interface BookingSummary {
  orderId: string;
  bookingTime: string;
  deliveryTime: string;
  customerName: string;
  customerPhone: string;
  mode: string;
  address: string;
  totalAmount: number;
  itemsText: string;
  cleanMessage: string;
}

const FontAndStyleInjector = () => {
  useEffect(() => {
    const linkId = 'yummy-cake-fonts';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Baloo+Thambi+2:wght@500;600;700&family=Fredoka:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <style>{`
      :root {
        --bg-buttercream: #FFFBEB;
        --bg-custard: #FEF3C7;
        --accent-honey: #FACC15;
        --accent-amber: #F59E0B;
        --accent-strawberry: #FB7185;
        --accent-chocobi: #4ADE80;
        --text-cocoa: #451A03;
      }
      body {
        font-family: 'Plus Jakarta Sans', 'Baloo Thambi 2', sans-serif;
        background-color: #FFFBEB;
        color: #451A03;
        overflow-x: hidden;
      }
      .font-display {
        font-family: 'Fredoka', 'Baloo Thambi 2', sans-serif;
      }
      .clay-card {
        background: #FFFFFF;
        border-radius: 24px;
        border: 2px solid #FDE68A;
        box-shadow: 0 14px 32px -8px rgba(245, 158, 11, 0.18), 0 4px 10px -2px rgba(69, 26, 3, 0.04);
      }
      .squishy-btn {
        box-shadow: 0 5px 0 #451A03, 0 10px 18px -4px rgba(69, 26, 3, 0.22);
        transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease;
      }
      .squishy-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 7px 0 #451A03, 0 14px 22px -4px rgba(69, 26, 3, 0.28);
      }
      .squishy-btn:active {
        transform: translateY(3px);
        box-shadow: 0 2px 0 #451A03, 0 4px 8px -2px rgba(69, 26, 3, 0.2);
      }
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style>
  );
};

const AllCakesIcon = () => (
  <svg viewBox="0 0 48 48" className="w-7 h-7 shrink-0" fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="21" fill="#FEF3C7" stroke="#451A03" strokeWidth="2.5" />
    <path d="M12 30L14 18L20 23L24 14L28 23L34 18L36 30H12Z" fill="#FACC15" stroke="#451A03" strokeWidth="2.5" strokeLinejoin="round" />
    <rect x="12" y="30" width="24" height="5" rx="2" fill="#FB7185" stroke="#451A03" strokeWidth="2.2" />
    <circle cx="24" cy="12" r="2" fill="#451A03" />
  </svg>
);

const ChocobiBoxIcon = () => (
  <svg viewBox="0 0 48 48" className="w-7 h-7 shrink-0" fill="none" aria-hidden="true">
    <polygon points="24,3 42,13.5 42,34.5 24,45 6,34.5 6,13.5" fill="#4ADE80" stroke="#451A03" strokeWidth="2.6" strokeLinejoin="round" />
    <polygon points="24,8 37.5,16 37.5,32 24,40 10.5,32 10.5,16" fill="#86EFAC" stroke="#451A03" strokeWidth="1.5" />
    <rect x="10" y="19" width="28" height="10" rx="5" fill="#FB7185" stroke="#451A03" strokeWidth="2.2" />
    <polygon points="24,10 25.6,13.3 29.2,13.8 26.6,16.3 27.2,19.8 24,18.1 20.8,19.8 21.4,16.3 18.8,13.8 22.4,13.3" fill="#FACC15" stroke="#451A03" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="19" cy="33" r="1.8" fill="#FACC15" />
    <circle cx="29" cy="33" r="1.8" fill="#FACC15" />
  </svg>
);

const ActionKamenMaskIcon = () => (
  <svg viewBox="0 0 48 48" className="w-7 h-7 shrink-0" fill="none" aria-hidden="true">
    <path d="M9 26C9 15.5 15.7 8 24 8C32.3 8 39 15.5 39 26V32C39 36 33 40 24 40C15 40 9 36 9 32V26Z" fill="#FACC15" stroke="#451A03" strokeWidth="2.6" />
    <path d="M11 21H37L34.5 30H26.5L24 27.2L21.5 30H13.5L11 21Z" fill="#38BDF8" stroke="#451A03" strokeWidth="2.3" strokeLinejoin="round" />
    <path d="M25.5 4L19 14.5H24L22.5 21L29 11.5H24L25.5 4Z" fill="#FB7185" stroke="#451A03" strokeWidth="2" strokeLinejoin="round" />
    <path d="M15 24.5H19" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ShiroFaceIcon = () => (
  <svg viewBox="0 0 48 48" className="w-7 h-7 shrink-0" fill="none" aria-hidden="true">
    <ellipse cx="12" cy="18" rx="5" ry="7.5" transform="rotate(-22 12 18)" fill="#FFFFFF" stroke="#451A03" strokeWidth="2.4" />
    <ellipse cx="36" cy="18" rx="5" ry="7.5" transform="rotate(22 36 18)" fill="#FFFFFF" stroke="#451A03" strokeWidth="2.4" />
    <path d="M12 33C8.5 30.5 8 24.5 11.5 22C11 16.5 16 12.5 21 14.5C23.5 11.5 28.5 11.5 31 14.5C36 12.5 41 16.5 40.5 22C44 24.5 43.5 30.5 40 33C36.5 37.5 15.5 37.5 12 33Z" fill="#FFFFFF" stroke="#451A03" strokeWidth="2.5" strokeLinejoin="round" />
    <circle cx="19.5" cy="24.5" r="2.1" fill="#451A03" />
    <circle cx="28.5" cy="24.5" r="2.1" fill="#451A03" />
    <ellipse cx="24" cy="27.5" rx="2.4" ry="1.7" fill="#451A03" />
    <path d="M21 30.5C22.3 32 23.7 31 24 29.5C24.3 31 25.7 32 27 30.5" stroke="#451A03" strokeWidth="1.9" strokeLinecap="round" />
    <circle cx="15.5" cy="28" r="2.2" fill="#FB7185" opacity="0.6" />
    <circle cx="32.5" cy="28" r="2.2" fill="#FB7185" opacity="0.6" />
  </svg>
);

const TeaTimeTreatIcon = () => (
  <svg viewBox="0 0 48 48" className="w-7 h-7 shrink-0" fill="none" aria-hidden="true">
    <path d="M16 14C15 11.5 17.5 10 16.5 7.5" stroke="#FB7185" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M22 13C21 10.5 23.5 9 22.5 6.5" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M27 21H30.5C32.5 21 34 22.5 34 24.5C34 26.5 32.5 28 30.5 28H27" stroke="#451A03" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M10 18H28V26C28 31 24 34.5 19 34.5C14 34.5 10 31 10 26V18Z" fill="#FB7185" stroke="#451A03" strokeWidth="2.4" strokeLinejoin="round" />
    <polygon points="27,36 41,30 41,38 27,38" fill="#78350F" stroke="#451A03" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M27 35.5L41 29.8" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 38.5H42" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const ShiroMoodMascot = ({ isExcited }: { isExcited: boolean }) => {
  return (
    <div className="relative w-full h-36 flex items-center justify-center select-none overflow-hidden">
      <AnimatePresence mode="wait">
        {!isExcited ? (
          <motion.div
            key="shiro-sleeping"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, y: -6 }}
            transition={{ duration: 0.35 }}
            className="relative w-56 h-32 flex items-center justify-center"
          >
            <motion.span animate={{ y: [4, -18], x: [0, 6], opacity: [0, 1, 0], scale: [0.8, 1.1] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-3 right-12 font-display font-bold text-base text-[#451A03]">Z</motion.span>
            <motion.span animate={{ y: [6, -22], x: [0, 10], opacity: [0, 1, 0], scale: [0.7, 1] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.85 }} className="absolute top-1 right-7 font-display font-bold text-sm text-[#78350F]">z</motion.span>
            <motion.span animate={{ y: [8, -24], x: [0, 12], opacity: [0, 1, 0], scale: [0.6, 0.95] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 1.65 }} className="absolute top-0 right-3 font-display font-bold text-xs text-[#92400E]">z</motion.span>

            <svg viewBox="0 0 220 130" className="w-52 h-32 drop-shadow-sm" fill="none" aria-label="Shiro sleeping peacefully">
              <ellipse cx="110" cy="108" rx="78" ry="14" fill="#FDE68A" stroke="#451A03" strokeWidth="3" />
              <motion.g style={{ transformOrigin: '122px 98px' }} animate={{ scaleY: [1, 1.07, 1], scaleX: [1, 1.02, 1] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>
                <path d="M78 96C76 74 96 60 124 62C150 64 166 78 164 96C162 106 80 106 78 96Z" fill="#FFFFFF" stroke="#451A03" strokeWidth="3.5" strokeLinejoin="round" />
                <circle cx="158" cy="88" r="13" fill="#FFFFFF" stroke="#451A03" strokeWidth="3.5" />
                <circle cx="163" cy="82" r="8" fill="#FFFFFF" />
              </motion.g>
              <g>
                <ellipse cx="64" cy="72" rx="9" ry="14" transform="rotate(28 64 72)" fill="#FFFFFF" stroke="#451A03" strokeWidth="3.5" />
                <ellipse cx="114" cy="70" rx="9" ry="14" transform="rotate(-24 114 70)" fill="#FFFFFF" stroke="#451A03" strokeWidth="3.5" />
                <path d="M64 88C57 83 57 71 64 66C64 55 75 48 86 52C92 47 103 47 109 52C120 48 131 55 130 66C136 71 135 83 128 88C120 96 72 96 64 88Z" fill="#FFFFFF" stroke="#451A03" strokeWidth="3.5" strokeLinejoin="round" />
                <path d="M77 73C80 77 86 77 89 73" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
                <path d="M102 73C105 77 111 77 114 73" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
                <ellipse cx="95.5" cy="79" rx="4" ry="2.8" fill="#451A03" />
                <ellipse cx="74" cy="80" rx="4.5" ry="2.5" fill="#FB7185" opacity="0.55" />
                <ellipse cx="117" cy="80" rx="4.5" ry="2.5" fill="#FB7185" opacity="0.55" />
                <ellipse cx="78" cy="98" rx="12" ry="7" fill="#FFFFFF" stroke="#451A03" strokeWidth="3.2" />
                <ellipse cx="110" cy="98" rx="12" ry="7" fill="#FFFFFF" stroke="#451A03" strokeWidth="3.2" />
              </g>
            </svg>
          </motion.div>
        ) : (
          <motion.div
            key="shiro-excited"
            initial={{ opacity: 0, scale: 0.75, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 420, damping: 20 }}
            className="relative w-64 h-34 flex items-center justify-center"
          >
            <motion.svg animate={{ scale: [0.8, 1.25, 0.8], rotate: [0, 20, 0] }} transition={{ duration: 1.4, repeat: Infinity }} viewBox="0 0 24 24" className="w-5 h-5 absolute top-2 left-10">
              <polygon points="12,1 15,9 23,9 16.5,14 19,22 12,17 5,22 7.5,14 1,9 9,9" fill="#FB7185" stroke="#451A03" strokeWidth="2" />
            </motion.svg>
            <motion.svg animate={{ scale: [1, 1.3, 1], rotate: [0, -25, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }} viewBox="0 0 24 24" className="w-5 h-5 absolute top-2 right-12">
              <polygon points="12,1 15,9 23,9 16.5,14 19,22 12,17 5,22 7.5,14 1,9 9,9" fill="#4ADE80" stroke="#451A03" strokeWidth="2" />
            </motion.svg>

            <motion.svg animate={{ y: [0, -8, 0] }} transition={{ duration: 0.75, repeat: Infinity, ease: 'easeInOut' }} viewBox="0 0 240 135" className="w-60 h-32 drop-shadow-md" fill="none" aria-label="Shiro awake and excited for cake">
              <ellipse cx="105" cy="122" rx="48" ry="8" fill="#F59E0B" opacity="0.35" />
              <motion.g style={{ transformOrigin: '64px 92px' }} animate={{ rotate: [-24, 28, -24] }} transition={{ duration: 0.32, repeat: Infinity, ease: 'easeInOut' }}>
                <circle cx="48" cy="84" r="12" fill="#FFFFFF" stroke="#451A03" strokeWidth="3.5" />
                <circle cx="42" cy="76" r="7" fill="#FFFFFF" />
              </motion.g>
              <path d="M72 74C66 84 68 106 76 112H132C140 106 142 84 136 74Z" fill="#FFFFFF" stroke="#451A03" strokeWidth="3.5" strokeLinejoin="round" />
              <ellipse cx="86" cy="113" rx="10" ry="7" fill="#FFFFFF" stroke="#451A03" strokeWidth="3.2" />
              <ellipse cx="122" cy="113" rx="10" ry="7" fill="#FFFFFF" stroke="#451A03" strokeWidth="3.2" />
              <ellipse cx="74" cy="34" rx="9" ry="16" transform="rotate(-18 74 34)" fill="#FFFFFF" stroke="#451A03" strokeWidth="3.5" />
              <ellipse cx="134" cy="34" rx="9" ry="16" transform="rotate(18 134 34)" fill="#FFFFFF" stroke="#451A03" strokeWidth="3.5" />
              <path d="M68 68C60 63 60 49 68 44C67 32 79 24 91 28C98 22 110 22 117 28C129 24 141 32 140 44C148 49 148 63 140 68C130 78 78 78 68 68Z" fill="#FFFFFF" stroke="#451A03" strokeWidth="3.5" strokeLinejoin="round" />
              <circle cx="90" cy="49" r="5" fill="#451A03" />
              <circle cx="91.8" cy="47.2" r="1.8" fill="#FFFFFF" />
              <circle cx="118" cy="49" r="5" fill="#451A03" />
              <circle cx="119.8" cy="47.2" r="1.8" fill="#FFFFFF" />
              <ellipse cx="104" cy="56" rx="4.5" ry="3.2" fill="#451A03" />
              <path d="M96 62C99 69 109 69 112 62Z" fill="#FB7185" stroke="#451A03" strokeWidth="2.5" strokeLinejoin="round" />
              <ellipse cx="79" cy="57" rx="5" ry="3" fill="#FB7185" opacity="0.7" />
              <ellipse cx="129" cy="57" rx="5" ry="3" fill="#FB7185" opacity="0.7" />
              <g transform="translate(158, 72)">
                <ellipse cx="28" cy="42" rx="28" ry="6" fill="#FFFFFF" stroke="#451A03" strokeWidth="2.8" />
                <polygon points="8,38 46,38 46,18 8,26" fill="#FACC15" stroke="#451A03" strokeWidth="3" strokeLinejoin="round" />
                <path d="M8 31L46 27" stroke="#FB7185" strokeWidth="4" strokeLinecap="round" />
                <polygon points="8,26 46,18 34,11 8,26" fill="#FFFBEB" stroke="#451A03" strokeWidth="2.8" strokeLinejoin="round" />
                <circle cx="28" cy="13" r="5" fill="#FB7185" stroke="#451A03" strokeWidth="2.4" />
                <path d="M28 8C29 4 33 3 35 4" stroke="#4ADE80" strokeWidth="2.4" strokeLinecap="round" />
              </g>
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// ACTION KAMEN CUSTOM CAKE BUILDER DATA & INTERACTIVE STUDIO
// ============================================================================
const CUSTOM_SPONGES = [
  {
    id: 'chocobi-cocoa',
    name: 'Chocobi Dark Cocoa',
    baseColor: '#451A03',
    spongeColor: '#5C2406',
    creamColor: '#92400E',
    accent: '#4ADE80',
    extraPrice: 0,
    photo: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=85&w=600',
    tagline: '70% Belgian Truffle Sponge',
  },
  {
    id: 'lightning-mango',
    name: 'Action Lightning Mango',
    baseColor: '#F59E0B',
    spongeColor: '#FACC15',
    creamColor: '#FEF08A',
    accent: '#38BDF8',
    extraPrice: 120,
    photo: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&q=85&w=600',
    tagline: 'Alphonso Mango & Vanilla Cream',
  },
  {
    id: 'shiro-cloud',
    name: 'Shiro Fluffy Vanilla',
    baseColor: '#E2E8F0',
    spongeColor: '#FFFBEB',
    creamColor: '#FFFFFF',
    accent: '#FB7185',
    extraPrice: 80,
    photo: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=85&w=600',
    tagline: 'Madagascar Bean & Mascarpone',
  },
  {
    id: 'kamen-berry',
    name: 'Hero Red Velvet Berry',
    baseColor: '#BE123C',
    spongeColor: '#E11D48',
    creamColor: '#FFE4E6',
    accent: '#FACC15',
    extraPrice: 150,
    photo: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=85&w=600',
    tagline: 'Velvet Cocoa & Strawberry Swirl',
  },
];

const CUSTOM_WEIGHTS = [
  { id: '0.5kg', label: '500 g', tiers: 1, basePrice: 790, serves: '4–6 Heroes' },
  { id: '1kg', label: '1 Kg', tiers: 2, basePrice: 1390, serves: '10–12 Heroes' },
  { id: '2kg', label: '2 Kg', tiers: 3, basePrice: 2490, serves: '20–25 Heroes' },
];

const CUSTOM_TOPPERS = [
  { id: 'mask-visor', label: 'Action Kamen Visor & Bolt', price: 140 },
  { id: 'chocobi-stars', label: 'Chocobi Star Crunch Gems', price: 110 },
  { id: 'gold-drip', label: 'Golden Beam Drip & Sparkles', price: 90 },
  { id: 'shiro-marshmallows', label: 'Shiro Fluffy Marshmallow Puffs', price: 100 },
];

const ACTION_KAMEN_GALLERY = [
  {
    title: 'Action Kamen Golden Lightning Tier',
    tag: 'Signature Hero Cake',
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&q=85&w=700',
  },
  {
    title: 'Kasukabe Galaxy Smash Pinata',
    tag: 'Smash & Reveal',
    image: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&q=85&w=700',
  },
  {
    title: 'Chocobi Victory Truffle Tower',
    tag: 'Double Cocoa Power',
    image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&q=85&w=700',
  },
];

const ActionKamenCustomStudio = ({
  onAddCustomCake,
}: {
  onAddCustomCake: (item: CartItem) => void;
}) => {
  const [selectedSponge, setSelectedSponge] = useState(CUSTOM_SPONGES[1]);
  const [selectedWeight, setSelectedWeight] = useState(CUSTOM_WEIGHTS[1]);
  const [selectedToppers, setSelectedToppers] = useState<string[]>([
    'mask-visor',
    'chocobi-stars',
  ]);
  const [cakeMessage, setCakeMessage] = useState('ACTION BE-BE-BEAM! 🎉');
  const [beamTrigger, setBeamTrigger] = useState(0);

  const toggleTopper = (id: string) => {
    setSelectedToppers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toppersTotal = selectedToppers.reduce((sum, id) => {
    const found = CUSTOM_TOPPERS.find((t) => t.id === id);
    return sum + (found ? found.price : 0);
  }, 0);

  const customTotalPrice =
    selectedWeight.basePrice + selectedSponge.extraPrice + toppersTotal;

  const handleActionBeam = () => {
    setBeamTrigger((k) => k + 1);
  };

  const handleBuildAndAdd = () => {
    const topperNames = selectedToppers
      .map((id) => CUSTOM_TOPPERS.find((t) => t.id === id)?.label)
      .filter(Boolean)
      .join(', ');

    const customItem: CartItem = {
      id: `custom-${Date.now()}`,
      name: `Custom Action Kamen Cake (${selectedSponge.name})`,
      mood: 'action-kamen',
      price: customTotalPrice,
      weight: selectedWeight.label,
      badge: 'Action Kamen Custom',
      badgeBg: 'bg-[#FACC15] text-[#451A03]',
      image: selectedSponge.photo,
      description: `Message: "${cakeMessage || 'Happy Birthday!'}" • Toppers: ${
        topperNames || 'Classic Cream'
      }`,
      qty: 1,
    };

    handleActionBeam();
    onAddCustomCake(customItem);
  };

  return (
    <section
      id="action-kamen-studio"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
    >
      <div className="relative rounded-[32px] border-4 border-[#451A03] bg-gradient-to-br from-[#FACC15] via-[#FEF3C7] to-[#BAE6FD] p-5 sm:p-8 lg:p-10 shadow-[0_10px_0_#451A03] overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b-2 border-[#451A03]/20">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-[#451A03] text-[#FACC15] px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
              <span>⚡ Action Kamen Hero Bakery Lab</span>
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-[#451A03] leading-tight">
              Design Your Own <span className="underline decoration-[#FB7185] decoration-4">Action Kamen</span> Custom Cake!
            </h2>
            <p className="text-xs sm:text-sm font-bold text-[#78350F]">
              Pick your power sponge, choose tiers, unlock hero toppers &amp; write your custom icing message live.
            </p>
          </div>

          <button
            type="button"
            onClick={handleActionBeam}
            className="self-start lg:self-auto bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#451A03] font-display font-bold text-sm px-5 py-3 rounded-2xl border-2 border-[#451A03] squishy-btn flex items-center gap-2 cursor-pointer"
          >
            <span>⚡ Fire Action Beam!</span>
          </button>
        </div>

        <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          <div className="lg:col-span-5 space-y-5">
            <div className="relative rounded-3xl bg-white border-3 border-[#451A03] p-5 shadow-[0_6px_0_#451A03] overflow-hidden text-center">
              <AnimatePresence>
                {beamTrigger > 0 && (
                  <motion.div
                    key={beamTrigger}
                    initial={{ opacity: 0.9, scale: 0.6 }}
                    animate={{ opacity: 0, scale: 1.6 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#38BDF8]/30"
                  >
                    <span className="font-display font-extrabold text-3xl text-[#451A03] bg-[#FACC15] border-2 border-[#451A03] px-4 py-1.5 rounded-2xl -rotate-6 shadow-lg">
                      BE-BE-BEAM!! ⚡
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between text-xs font-extrabold text-[#451A03] mb-2">
                <span className="bg-[#FEF3C7] border border-[#451A03] px-2.5 py-1 rounded-full">
                  Live Hero Preview
                </span>
                <span className="bg-[#4ADE80] border border-[#451A03] px-2.5 py-1 rounded-full">
                  {selectedWeight.label} • {selectedWeight.serves}
                </span>
              </div>

              <motion.div
                key={`${selectedSponge.id}-${selectedWeight.id}-${selectedToppers.join('-')}`}
                initial={{ scale: 0.94, y: 6 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                className="py-2 flex items-center justify-center"
              >
                <svg viewBox="0 0 320 230" className="w-full max-w-[290px] h-52 drop-shadow-md" fill="none">
                  <circle cx="160" cy="122" r="92" fill="#FEF3C7" stroke="#FACC15" strokeWidth="3" strokeDasharray="8 6" />
                  <ellipse cx="160" cy="204" rx="118" ry="14" fill="#E2E8F0" stroke="#451A03" strokeWidth="3.2" />
                  <rect x="145" y="186" width="30" height="18" fill="#CBD5E1" stroke="#451A03" strokeWidth="3" />

                  <rect x="68" y="138" width="184" height="50" rx="14" fill={selectedSponge.spongeColor} stroke="#451A03" strokeWidth="3.5" />
                  <path d="M68 152 Q90 166 114 152 Q138 166 160 152 Q182 166 206 152 Q230 166 252 152 L252 144 C252 139 246 138 240 138 L80 138 C74 138 68 139 68 144 Z" fill={selectedSponge.creamColor} stroke="#451A03" strokeWidth="2.8" />

                  {selectedWeight.tiers >= 2 && (
                    <g>
                      <rect x="94" y="94" width="132" height="44" rx="12" fill={selectedSponge.spongeColor} stroke="#451A03" strokeWidth="3.5" />
                      <path d="M94 106 Q116 118 138 106 Q160 118 182 106 Q204 118 226 106 L226 100 C226 95 220 94 214 94 L106 94 C100 94 94 95 94 100 Z" fill={selectedSponge.creamColor} stroke="#451A03" strokeWidth="2.6" />
                    </g>
                  )}

                  {selectedWeight.tiers >= 3 && (
                    <g>
                      <rect x="118" y="56" width="84" height="38" rx="10" fill={selectedSponge.spongeColor} stroke="#451A03" strokeWidth="3.5" />
                      <path d="M118 66 Q139 76 160 66 Q181 76 202 66 L202 61 C202 57 196 56 190 56 L130 56 C124 56 118 57 118 61 Z" fill={selectedSponge.creamColor} stroke="#451A03" strokeWidth="2.4" />
                    </g>
                  )}

                  {selectedToppers.includes('mask-visor') && (
                    <g transform={`translate(124, ${selectedWeight.tiers === 3 ? 10 : selectedWeight.tiers === 2 ? 46 : 90})`}>
                      <rect x="8" y="14" width="56" height="26" rx="13" fill="#FACC15" stroke="#451A03" strokeWidth="3" />
                      <path d="M13 22H59L54 34H40L36 30L32 34H18L13 22Z" fill="#38BDF8" stroke="#451A03" strokeWidth="2.4" strokeLinejoin="round" />
                      <polygon points="38,0 28,15 36,15 33,26 45,11 37,11" fill="#FB7185" stroke="#451A03" strokeWidth="2" strokeLinejoin="round" />
                    </g>
                  )}

                  {selectedToppers.includes('chocobi-stars') && (
                    <g>
                      <polygon points="86,126 89,132 96,133 91,138 92,145 86,141 80,145 81,138 76,133 83,132" fill="#4ADE80" stroke="#451A03" strokeWidth="2" />
                      <polygon points="234,126 237,132 244,133 239,138 240,145 234,141 228,145 229,138 224,133 231,132" fill="#4ADE80" stroke="#451A03" strokeWidth="2" />
                      <circle cx="160" cy="172" r="5" fill="#4ADE80" stroke="#451A03" strokeWidth="2" />
                    </g>
                  )}

                  {selectedToppers.includes('gold-drip') && (
                    <g>
                      <circle cx="64" cy="96" r="5" fill="#FACC15" stroke="#451A03" strokeWidth="2" />
                      <circle cx="256" cy="96" r="5" fill="#FACC15" stroke="#451A03" strokeWidth="2" />
                      <circle cx="110" cy="172" r="4" fill="#FACC15" stroke="#451A03" strokeWidth="1.8" />
                      <circle cx="210" cy="172" r="4" fill="#FACC15" stroke="#451A03" strokeWidth="1.8" />
                    </g>
                  )}

                  {selectedToppers.includes('shiro-marshmallows') && (
                    <g>
                      <circle cx="88" cy="182" r="8" fill="#FFFFFF" stroke="#451A03" strokeWidth="2.4" />
                      <circle cx="232" cy="182" r="8" fill="#FFFFFF" stroke="#451A03" strokeWidth="2.4" />
                      <circle cx="160" cy="182" r="7" fill="#FFFFFF" stroke="#451A03" strokeWidth="2.4" />
                    </g>
                  )}
                </svg>
              </motion.div>

              <div className="bg-[#FFFBEB] border-2 border-dashed border-[#451A03] rounded-2xl px-4 py-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#92400E] block">
                  Custom Icing Plaque
                </span>
                <p className="font-display font-bold text-base sm:text-lg text-[#451A03] truncate">
                  “{cakeMessage || 'ACTION BE-BE-BEAM!'}”
                </p>
              </div>
            </div>

            <div className="bg-white/90 border-2 border-[#451A03] rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-[#451A03]">
                  ⚡ Action Kamen Real Bake Inspiration
                </span>
                <span className="text-[11px] font-bold text-[#78350F]">100% Eggless</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {ACTION_KAMEN_GALLERY.map((photo) => (
                  <div
                    key={photo.title}
                    className="group relative rounded-2xl overflow-hidden border-2 border-[#451A03] aspect-square bg-[#FEF3C7]"
                  >
                    <CakeImage src={photo.image} alt={photo.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-x-0 bottom-0 bg-[#451A03]/85 text-[#FFFBEB] p-1.5 text-[10px] font-bold leading-tight">
                      {photo.tag}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border-3 border-[#451A03] rounded-3xl p-5 sm:p-6 shadow-[0_6px_0_#451A03] space-y-6">
            <div>
              <label className="font-display font-bold text-base text-[#451A03] flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#FACC15] border-2 border-[#451A03] text-xs flex items-center justify-center">
                  1
                </span>
                <span>Choose Your Power Sponge &amp; Cream</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CUSTOM_SPONGES.map((sponge) => {
                  const active = selectedSponge.id === sponge.id;
                  return (
                    <button
                      key={sponge.id}
                      type="button"
                      onClick={() => setSelectedSponge(sponge)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-[#FEF3C7] border-[#451A03] shadow-[0_4px_0_#451A03]'
                          : 'bg-[#FFFBEB]/60 border-[#FDE68A] hover:border-[#451A03]'
                      }`}
                    >
                      <CakeImage src={sponge.photo} alt={sponge.name} className="w-12 h-12 rounded-xl object-cover border border-[#451A03] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-display font-bold text-sm text-[#451A03] truncate">
                          {sponge.name}
                        </div>
                        <div className="text-[11px] font-semibold text-[#78350F] truncate">
                          {sponge.tagline}
                        </div>
                        <div className="text-[11px] font-extrabold text-[#16A34A] mt-0.5">
                          {sponge.extraPrice === 0 ? 'Included' : `+₹${sponge.extraPrice}`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="font-display font-bold text-base text-[#451A03] flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#38BDF8] border-2 border-[#451A03] text-xs flex items-center justify-center">
                  2
                </span>
                <span>Select Size &amp; Celebration Tiers</span>
              </label>

              <div className="grid grid-cols-3 gap-3">
                {CUSTOM_WEIGHTS.map((w) => {
                  const active = selectedWeight.id === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWeight(w)}
                      className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                        active
                          ? 'bg-[#FACC15] border-[#451A03] shadow-[0_4px_0_#451A03]'
                          : 'bg-white border-[#FDE68A] hover:border-[#451A03]'
                      }`}
                    >
                      <div className="font-display font-bold text-base text-[#451A03]">
                        {w.label}
                      </div>
                      <div className="text-[11px] font-bold text-[#78350F]">
                        {w.tiers} {w.tiers === 1 ? 'Tier' : 'Tiers'} • {w.serves}
                      </div>
                      <div className="font-display font-bold text-sm text-[#451A03] mt-1">
                        ₹{w.basePrice}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="font-display font-bold text-base text-[#451A03] flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#4ADE80] border-2 border-[#451A03] text-xs flex items-center justify-center">
                  3
                </span>
                <span>Toggle Action Kamen Toppers</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CUSTOM_TOPPERS.map((topper) => {
                  const checked = selectedToppers.includes(topper.id);
                  return (
                    <button
                      key={topper.id}
                      type="button"
                      onClick={() => toggleTopper(topper.id)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                        checked
                          ? 'bg-[#4ADE80]/35 border-[#451A03] text-[#451A03]'
                          : 'bg-[#FFFBEB] border-[#FDE68A] text-[#78350F] hover:border-[#451A03]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-white border border-[#451A03] flex items-center justify-center text-[10px]">
                          {checked ? '✓' : ''}
                        </span>
                        <span>{topper.label}</span>
                      </span>
                      <span className="font-extrabold">+₹{topper.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="custom-cake-msg"
                className="font-display font-bold text-base text-[#451A03] flex items-center gap-2 mb-2"
              >
                <span className="w-6 h-6 rounded-full bg-[#FB7185] text-white border-2 border-[#451A03] text-xs flex items-center justify-center">
                  4
                </span>
                <span>Write Message on Cake (Max 32 chars)</span>
              </label>
              <input
                id="custom-cake-msg"
                type="text"
                maxLength={32}
                value={cakeMessage}
                onChange={(e) => setCakeMessage(e.target.value)}
                placeholder="e.g., Happy Birthday Shin-chan!"
                className="w-full p-3 rounded-2xl border-2 border-[#451A03] bg-[#FFFBEB] font-display font-bold text-sm text-[#451A03] focus:outline-none focus:bg-white"
              />
            </div>

            <div className="pt-4 border-t-2 border-[#FDE68A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#92400E] block">
                  Custom Hero Cake Price
                </span>
                <span className="font-display font-bold text-3xl text-[#451A03]">
                  ₹{customTotalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-[#16A34A] block">
                  {customTotalPrice >= 999
                    ? '✓ Qualifies for FREE Chromepet Delivery!'
                    : 'Freshly baked to order in 45 mins'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleBuildAndAdd}
                className="bg-[#FACC15] hover:bg-[#FDE047] text-[#451A03] font-display font-bold text-base px-6 py-4 rounded-2xl border-2 border-[#451A03] squishy-btn flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>⚡ Add Custom Cake to Box</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// CATALOG DATA (WITH ACTION KAMEN PHOTOS)
// ============================================================================
const MOOD_CATEGORIES = [
  { id: 'all', label: 'All Yummy Cakes', tagline: 'Freshly baked in Chromepet with pure love', Icon: AllCakesIcon },
  { id: 'chocobi', label: 'Chocobi Cravings', tagline: 'Rich Belgian chocolate, truffle & hazelnut crunch', Icon: ChocobiBoxIcon },
  { id: 'action-kamen', label: 'Action Kamen Specials', tagline: 'Heroic theme cakes & rainbow celebration tiers', Icon: ActionKamenMaskIcon },
  { id: 'shiro', label: 'Shiro’s Fluffy Picks', tagline: 'Cloud-soft vanilla, white forest & fresh cream', Icon: ShiroFaceIcon },
  { id: 'misae', label: 'Misae’s Tea-Time Treats', tagline: 'Cozy jar cakes, fudgy brownies & pastel bento boxes', Icon: TeaTimeTreatIcon },
];

const CAKES_DATA = [
  { id: 1, name: 'Chocobi Belgian Truffle Royale', mood: 'chocobi', price: 1350, weight: '1 Kg', badge: 'Chocobi Star Pick', badgeBg: 'bg-[#4ADE80] text-[#451A03]', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=85&w=700', description: '70% dark Belgian couverture ganache layered over moist cocoa sponge with crispy hazelnut pearls.' },
  { id: 2, name: 'Action Kamen Golden Lightning Cake', mood: 'action-kamen', price: 1590, weight: '1.5 Kg', badge: 'Action Kamen Hero', badgeBg: 'bg-[#FACC15] text-[#451A03]', image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&q=85&w=700', description: 'Vibrant mango-vanilla buttercream celebration cake crowned with golden lightning shards & confetti.' },
  { id: 3, name: 'Shiro’s Cloud-Soft White Forest', mood: 'shiro', price: 1180, weight: '1 Kg', badge: 'Fluffy Bestseller', badgeBg: 'bg-white text-[#451A03]', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=85&w=700', description: 'Feather-light Madagascar vanilla bean sponge, whipped mascarpone snow & glazed cherries.' },
  { id: 4, name: 'Misae’s Fudge Brownie & Bento Box', mood: 'misae', price: 680, weight: '500 g', badge: 'Tea-Time Favorite', badgeBg: 'bg-[#FB7185] text-white', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=85&w=700', description: 'Gooey walnut chocolate brownies paired with a pastel strawberry-cream mini bento cake.' },
  { id: 5, name: 'Kasukabe Galaxy Pinata Smash Cake', mood: 'action-kamen', price: 1750, weight: '1.2 Kg', badge: 'Action Beam Smash', badgeBg: 'bg-[#38BDF8] text-[#451A03]', image: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&q=85&w=700', description: 'Crack open the golden chocolate shell to reveal hidden choco-gems, mini cupcakes & caramel drizzle.' },
  { id: 6, name: 'Shiro’s Strawberry Fresh Cream Swirl', mood: 'shiro', price: 1290, weight: '1 Kg', badge: 'Farm-Fresh Berries', badgeBg: 'bg-[#FB7185] text-white', image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=85&w=700', description: 'Pillowy Chantilly cream folded with Mahabaleshwar strawberry compote on tender vanilla chiffon.' },
  { id: 7, name: 'Triple Chocobi Hazelnut Crunch', mood: 'chocobi', price: 1490, weight: '1 Kg', badge: 'Extra Crunchy', badgeBg: 'bg-[#4ADE80] text-[#451A03]', image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&q=85&w=700', description: 'Roasted Piedmont hazelnuts, silky Nutella mousse, and dark chocolate shards in every bite.' },
  { id: 8, name: 'Honey Butterscotch Jar Cake Trio', mood: 'misae', price: 540, weight: '3 Jars', badge: 'Cozy Pack', badgeBg: 'bg-[#FEF3C7] text-[#451A03]', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=85&w=700', description: 'Three layered glass jars of salted caramel butterscotch, golden honey sponge & praline crunch.' },
];

async function submitOrder(
  payload: Record<string, unknown>
): Promise<{ ok: boolean; orderId?: string; whatsappSent?: boolean; error?: string }> {
  try {
    const r = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await r.json().catch(() => ({}));
    return r.ok && d.ok === true ? { ok: true, orderId: d.orderId, whatsappSent: d.whatsappSent } : { ok: false, error: d.error || 'Order could not be saved' };
  } catch {
    return { ok: false };
  }
}

async function fetchCustomerOrders():Promise<{ok:boolean;orders?:CustomerOrder[];error?:string}>{ try { const r=await fetch('/api/orders'); const d=await r.json().catch(()=>({})); return r.ok&&d.ok?{ok:true,orders:d.orders}:{ok:false,error:d.error||'Could not load orders'}; } catch { return {ok:false,error:'Could not connect to the shop'}; } }

function CakeImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Drawn cake shown whenever the photo is missing, blocked or fails to load
  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className ?? ''} flex items-center justify-center bg-gradient-to-br from-[#FEF3C7] via-[#FDE68A] to-[#FACC15]/60`}
      >
        <svg viewBox="0 0 120 120" className="w-1/2 h-1/2 max-w-[140px] max-h-[140px]" aria-hidden="true">
          <ellipse cx="60" cy="104" rx="42" ry="7" fill="#451A03" opacity="0.15" />
          <rect x="22" y="62" width="76" height="40" rx="8" fill="#92400E" stroke="#451A03" strokeWidth="3" />
          <rect x="30" y="38" width="60" height="30" rx="8" fill="#FB7185" stroke="#451A03" strokeWidth="3" />
          <path d="M22 70 q9 12 19 0 q9 12 19 0 q9 12 19 0 q9 12 19 0" fill="#FFFBEB" stroke="#451A03" strokeWidth="3" strokeLinejoin="round" />
          <path d="M30 46 q7 10 15 0 q7 10 15 0 q7 10 15 0 q7 10 15 0" fill="#FFFBEB" stroke="#451A03" strokeWidth="3" strokeLinejoin="round" />
          <rect x="58" y="18" width="4" height="18" rx="2" fill="#38BDF8" stroke="#451A03" strokeWidth="2" />
          <path d="M60 6 q6 7 0 12 q-6 -5 0 -12z" fill="#FACC15" stroke="#451A03" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onLoad={(e) => {
        // Some hosts return a tiny/blank image instead of an error
        if (e.currentTarget.naturalWidth < 20) setFailed(true);
        else setLoaded(true);
      }}
      onError={() => setFailed(true)}
      className={className}
      data-loaded={loaded ? 'true' : 'false'}
    />
  );
}

function normalizeIndianWhatsAppNumber(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
}
function IntroVideo({ onFinish }: { onFinish: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoVisible, setVideoVisible] = useState(false);
  const [muted, setMuted] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);

  // Lock page scroll while the intro is on screen
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Safety net: if the video never starts, don't trap the visitor on white
  useEffect(() => {
    const t = setTimeout(() => {
      if (!videoVisible) onFinish();
    }, 8000);
    return () => clearTimeout(t);
  }, [videoVisible, onFinish]);

  // Try to start WITH sound. If the browser blocks it, fall back to muted
  // playback and unmute on the visitor's first tap / click / key press.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.volume = 1;

    const unmuteOnInteraction = () => {
      const vid = videoRef.current;
      if (!vid) return;
      vid.muted = false;
      setMuted(false);
      setSoundBlocked(false);
      vid.play().catch(() => {});
    };

    v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      setSoundBlocked(true);
      v.play().catch(() => {});
      window.addEventListener('pointerdown', unmuteOnInteraction, { once: true });
      window.addEventListener('keydown', unmuteOnInteraction, { once: true });
    });

    return () => {
      window.removeEventListener('pointerdown', unmuteOnInteraction);
      window.removeEventListener('keydown', unmuteOnInteraction);
    };
  }, []);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    setSoundBlocked(false);
    if (!v.muted) v.play().catch(() => {});
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      <video
        ref={videoRef}
        src="/hero-yummy-cakes.mp4"
        playsInline
        preload="auto"
        onPlaying={() => setVideoVisible(true)}
        onEnded={onFinish}
        onError={onFinish}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: videoVisible ? 1 : 0,
          transition: 'opacity 1.2s ease-in-out',
        }}
      />

      <div
        className="absolute bottom-5 right-5 flex items-center gap-2 transition-opacity duration-700"
        style={{ opacity: videoVisible ? 1 : 0 }}
      >
        <button
          type="button"
          onClick={toggleSound}
          className="bg-[#FACC15] text-[#451A03] font-bold text-xs sm:text-sm px-4 py-2 rounded-2xl border-2 border-[#451A03] cursor-pointer"
        >
          {muted ? (soundBlocked ? '🔇 Tap for sound' : '🔇 Sound off') : '🔊 Mute'}
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="bg-white/90 text-[#451A03] font-bold text-xs sm:text-sm px-4 py-2 rounded-2xl border-2 border-[#451A03] cursor-pointer"
        >
          Skip ›
        </button>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [isInHeroSection, setIsInHeroSection] = useState<boolean>(true);
  const [cyclePass, setCyclePass] = useState<{ active: boolean; direction: 'ltr' | 'rtl'; runId: number }>({ active: false, direction: 'ltr', runId: 0 });

  const [activeMood, setActiveMood] = useState<string>('all');
  const [bouncingTab, setBouncingTab] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartBounceKey, setCartBounceKey] = useState<number>(0);
  const [toastText, setToastText] = useState<string | null>(null);
  const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(null);
  const [myPageOpen,setMyPageOpen]=useState(false);
  const [googleUser,setGoogleUser]=useState<GoogleUser|null>(null); const [myOrders,setMyOrders]=useState<CustomerOrder[]>([]);
  const [lookupId,setLookupId]=useState('');
  const [customerOrder,setCustomerOrder]=useState<CustomerOrder|null>(null);
  const [lookupLoading,setLookupLoading]=useState(false); const [lookupError,setLookupError]=useState(''); const [orderSubmitting,setOrderSubmitting]=useState(false);

  const menuSectionRef = useRef<HTMLElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const cyclePassIndexRef = useRef(0);
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.replace(/\/+$/, '') === '/admin';

  useEffect(() => {
    const hero = heroSectionRef.current;
    if (!hero || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInHeroSection(entry.isIntersecting),
      { threshold: 0.25 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canShowCycle = !isAdminRoute && !showIntro && !isCartOpen && !myPageOpen && !isInHeroSection;
    if (!canShowCycle) {
      setCyclePass((previous) => previous.active ? { ...previous, active: false } : previous);
      return;
    }

    let hideTimer: number | undefined;
    const triggerPass = () => {
      const direction: 'ltr' | 'rtl' = cyclePassIndexRef.current % 2 === 0 ? 'ltr' : 'rtl';
      cyclePassIndexRef.current += 1;
      setCyclePass((previous) => ({ active: true, direction, runId: previous.runId + 1 }));
      if (hideTimer !== undefined) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        setCyclePass((previous) => ({ ...previous, active: false }));
      }, 5000);
    };

    const intervalId = window.setInterval(triggerPass, 15000);
    return () => {
      window.clearInterval(intervalId);
      if (hideTimer !== undefined) window.clearTimeout(hideTimer);
    };
  }, [isAdminRoute, showIntro, isCartOpen, myPageOpen, isInHeroSection]);


  const filteredCakes =
    activeMood === 'all'
      ? CAKES_DATA
      : CAKES_DATA.filter((cake) => cake.mood === activeMood);

  const currentMoodMeta =
    MOOD_CATEGORIES.find((m) => m.id === activeMood) || MOOD_CATEGORIES[0];

  const totalCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const freeDeliveryThreshold = 999;
  const deliveryFee = subtotal === 0 ? 0 : subtotal >= freeDeliveryThreshold ? 0 : 49;
  const grandTotal = subtotal + deliveryFee;

  const handleSelectMood = (moodId: string) => {
    setActiveMood(moodId);
    setBouncingTab(moodId);
    setTimeout(() => setBouncingTab(null), 500);
  };

  const handleAddToCart = (cake: Omit<CartItem, 'qty'> & { qty?: number }) => {
    setBookingSummary(null);
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === cake.id);
      if (existing) {
        return prev.map((item) =>
          item.id === cake.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...cake, qty: cake.qty || 1 }];
    });

    setCartBounceKey((k) => k + 1);
    setToastText(`Woof! ${cake.name} added to your box ✨`);
  };

  useEffect(() => {
    if (!toastText) return;
    const timer = setTimeout(() => setToastText(null), 2600);
    return () => clearTimeout(timer);
  }, [toastText]);

  const updateQuantity = (id: number | string, delta: number) => {
    setBookingSummary(null);
    setCartItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const handleBrowseFromEmptyCart = () => {
    setIsCartOpen(false);
    setTimeout(() => {
      menuSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 220);
  };

  const handleBookCake = async () => {
    if(!googleUser){setMyPageOpen(true);setToastText('Sign in with Google before placing your order.');return;}
    if(orderSubmitting)return; if(!cartItems.length){setToastText('Add a cake to your box first!');return;}
    const customerName=(document.getElementById('cust-name') as HTMLInputElement|null)?.value.trim()||'';
    const customerPhone=(document.getElementById('cust-phone') as HTMLInputElement|null)?.value.trim()||'';
    const mode=(document.getElementById('cust-mode') as HTMLSelectElement|null)?.value||'Delivery';
    const address=(document.getElementById('cust-address') as HTMLInputElement|null)?.value.trim()||'Chrompet, Chennai';
    const digits=customerPhone.replace(/\D/g,''); if(!customerName||!/^(?:[6-9]\d{9}|91[6-9]\d{9})$/.test(digits)){setToastText('Enter your name and a valid Indian mobile number.');return;}
    setOrderSubmitting(true);setBookingSummary(null);setToastText('Saving your order…');
    const now=new Date();
    const bookingTime=now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    const deliveryTime=new Date(now.getTime()+45*60000).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    const itemsText=cartItems.map((item,i)=>`${i+1}. ${item.name} (${item.weight}) x ${item.qty} = ₹${item.price*item.qty}`).join('\n');
    const result=await submitOrder({customerName,customerPhone,mode,address,deliveryTime,total:grandTotal,items:cartItems.map(i=>({name:i.name,weight:i.weight,qty:i.qty,price:i.price}))});
    setOrderSubmitting(false); if(!result.ok||!result.orderId){setToastText(result.error||'Order was not placed. Please try again.');return;}
    const finalId=result.orderId; const map='https://maps.google.com/?q=Chrompet,+Chennai,+Tamil+Nadu+600044';
    const locationLine=mode==='Pickup'?`Pickup Store: Yummy Cake Shop, GST Road, Chromepet\nMap: ${map}`:`Delivery Address: ${address}`;
    const cleanMessage=`🎂 *YUMMY CAKE SHOP (CHROMEPET) - ORDER RECEIVED*\nHello *${customerName}*! We have received your order.\n\n*Booking ID:* #${finalId}\n*Booked At:* ${bookingTime}\n*Est. ${mode} Time:* ${deliveryTime}\n*Mode:* ${mode}\n\n*Order Details:*\n${itemsText}\n\n*Total Payable:* ₹${grandTotal}\n${locationLine}\n\nFor updates: +91 63803 94239`;
    setBookingSummary({orderId:finalId,bookingTime,deliveryTime,customerName,customerPhone,mode,address,totalAmount:grandTotal,itemsText,cleanMessage});
    try{localStorage.setItem('ycs_last_order',JSON.stringify({id:finalId,phone:customerPhone}));}catch{}
    setLookupId(finalId);setCustomerOrder(null);setCartItems([]);const refreshed=await fetchCustomerOrders();if(refreshed.ok)setMyOrders(refreshed.orders||[]);
    setToastText(result.whatsappSent?`Order ${finalId} saved! WhatsApp confirmation sent.`:`Order ${finalId} saved! Track it in My Page.`);
  };
  const handleLookupOrder=async()=>{if(!lookupId.trim()){setLookupError('Enter order ID.');return;}setLookupLoading(true);setLookupError('');setCustomerOrder(null);const r=await fetch('/api/orders?id='+encodeURIComponent(lookupId));const d=await r.json().catch(()=>({}));setLookupLoading(false);if(!r.ok||!d.ok){setLookupError(d.error||'Order not found');return;}setCustomerOrder(d.order);};
  useEffect(()=>{void fetch('/api/auth/session').then(r=>r.json()).then(async d=>{if(d.user){setGoogleUser(d.user);const o=await fetchCustomerOrders();if(o.ok)setMyOrders(o.orders||[]);}}).catch(()=>{});},[]);
  useEffect(()=>{
    let active=true;
    const setup=async()=>{
      try{
        const cfg=await fetch('/api/auth/google-config').then(r=>r.json());
        if(!active||!cfg.clientId){if(active)setToastText('Google sign-in is not configured yet.');return;}
        setGoogleClientId(cfg.clientId);
        const init=()=>{
          const g=(window as any).google;
          if(!active||!g?.accounts?.id)return;
          g.accounts.id.initialize({client_id:cfg.clientId,callback:async(response:any)=>{
            const r=await fetch('/api/auth/google',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential:response.credential})});
            const d=await r.json().catch(()=>({}));
            if(r.ok&&d.ok){setGoogleUser(d.user);const o=await fetchCustomerOrders();if(o.ok)setMyOrders(o.orders||[]);setToastText('Signed in successfully!');}
            else setToastText(d.error||'Google sign-in failed');
          }});
          const el=document.getElementById('google-signin-button');
          if(el)g.accounts.id.renderButton(el,{theme:'outline',size:'large',shape:'pill',text:'continue_with',width:260});
        };
        if((window as any).google?.accounts?.id){init();return;}
        let script=document.getElementById('google-identity-script') as HTMLScriptElement|null;
        if(!script){script=document.createElement('script');script.id='google-identity-script';script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.onload=init;document.head.appendChild(script);}
        else script.addEventListener('load',init,{once:true});
      }catch{if(active)setToastText('Could not load Google sign-in. Please try again.');}
    };
    if(myPageOpen&&!googleUser)void setup();
    return()=>{active=false;};
  },[myPageOpen,googleUser]);
  const signOutCustomer=async()=>{await fetch('/api/auth/session',{method:'DELETE'});setGoogleUser(null);setMyOrders([]);setCustomerOrder(null);setToastText('Signed out');};

  const handleCopyBookingText = () => {
    if (!bookingSummary) return;
    navigator.clipboard?.writeText(bookingSummary.cleanMessage);
    setToastText('Clean booking text copied! 📋');
  };

  const handleSendWhatsApp = () => {
    if (!bookingSummary) return;
    const formattedPhone = normalizeIndianWhatsAppNumber(bookingSummary.customerPhone);
    const targetNumber = formattedPhone.length >= 12 ? formattedPhone : '916380394239';
    const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(bookingSummary.cleanMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBEB] via-[#FEF3C7]/70 to-[#FFFBEB] text-[#451A03] selection:bg-[#FACC15] selection:text-[#451A03]">
      <FontAndStyleInjector />

      {!isAdminRoute && !showIntro && !isCartOpen && !myPageOpen && !isInHeroSection && cyclePass.active && (
        <div
          key={cyclePass.runId}
          aria-hidden="true"
          className={`shinchan-cycle-prop ${cyclePass.direction === 'ltr' ? 'shinchan-cycle-ltr' : 'shinchan-cycle-rtl'}`}
        >
          <video src="/shinchan-site.webm" aria-hidden="true" autoPlay muted loop playsInline preload="auto" />
        </div>
      )}


      <AnimatePresence>
        {showIntro && <IntroVideo onFinish={() => setShowIntro(false)} />}
      </AnimatePresence>

      <div className="bg-[#451A03] text-[#FFFBEB] px-4 py-2 text-center text-xs sm:text-sm font-semibold flex flex-wrap items-center justify-center gap-2">
        <span className="text-[#FACC15] font-bold">★ Yummy Cake Shop • Chromepet, Chennai</span>
        <span className="hidden sm:inline opacity-40">•</span>
        <span>45-Min Express Delivery • 100% Pure Eggless Options</span>
        <span className="bg-[#4ADE80] text-[#451A03] px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase">
          Free Delivery ₹999+
        </span>
      </div>

      <header className="sticky top-0 z-30 bg-[#FFFBEB]/90 backdrop-blur-md border-b-2 border-[#FDE68A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FACC15] border-2 border-[#451A03] flex items-center justify-center shadow-[0_4px_0_#451A03]">
              <ShiroFaceIcon />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-[#451A03] leading-none">
                Yummy Cake Shop
              </h1>
              <p className="text-[11px] sm:text-xs font-bold text-[#78350F] mt-1">
                Chromepet, Chennai • <span className="text-[#92400E]">“நாவின் சுவை அரும்புகள் மலரட்டும்”</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="#action-kamen-studio"
              className="hidden md:inline-flex items-center gap-1.5 bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#451A03] border-2 border-[#451A03] px-4 py-2.5 rounded-2xl font-display font-bold text-sm squishy-btn"
            >
              <span>⚡ Custom Hero Cake</span>
            </a>

            <button type="button" onClick={()=>{setMyPageOpen(true);setCustomerOrder(null);setLookupError('');}} className="bg-white text-[#451A03] border-2 border-[#451A03] px-3 py-2.5 rounded-2xl font-bold text-sm">{googleUser?'My Orders':'Sign in / Orders'}</button>
            <motion.button
              key={cartBounceKey}
              animate={cartBounceKey > 0 ? { scale: [1, 1.22, 0.92, 1.08, 1], rotate: [0, -6, 6, -2, 0] } : {}}
              transition={{ duration: 0.45 }}
              onClick={() => setIsCartOpen(true)}
              aria-label="Open Yummy Cart Drawer"
              className="flex items-center gap-2.5 bg-[#FACC15] hover:bg-[#FDE047] text-[#451A03] border-2 border-[#451A03] px-4 sm:px-5 py-2.5 rounded-2xl font-display font-bold text-sm sm:text-base squishy-btn cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#451A03" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Yummy Box</span>
              <span className="bg-[#FB7185] text-white border border-[#451A03] text-xs font-extrabold min-w-[24px] h-6 px-1.5 rounded-full flex items-center justify-center">
                {totalCount}
              </span>
            </motion.button>
          </div>
        </div>
      </header>

      <section ref={heroSectionRef} className="pt-10 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white border-2 border-[#FDE68A] px-4 py-1.5 rounded-full shadow-xs mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] animate-ping" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#451A03]">
            GST Road, Chromepet • Freshly Baked Daily
          </span>
        </div>


        <h2 className="font-display font-bold text-3xl sm:text-5xl text-[#451A03] max-w-3xl mx-auto leading-tight">
          Pick Your <span className="bg-[#FACC15] px-3 py-0.5 rounded-2xl border-2 border-[#451A03] inline-block -rotate-1">Shin-chan Mood</span> &amp; Taste Pure Happiness!
        </h2>

        <p className="mt-4 font-display font-bold text-lg sm:text-xl text-[#78350F]">
          “நாவின் சுவை அரும்புகள் மலரட்டும்”
        </p>
      </section>

      <ActionKamenCustomStudio onAddCustomCake={handleAddToCart} />

      <main ref={menuSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="mb-8">
          <div role="tablist" aria-label="Shin-chan Mood Cake Categories" className="flex items-center justify-start lg:justify-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-3 px-1">
            {MOOD_CATEGORIES.map((category) => {
              const isActive = activeMood === category.id;
              const isBouncing = bouncingTab === category.id;
              const IconComponent = category.Icon;

              return (
                <button
                  key={category.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectMood(category.id)}
                  className={`relative shrink-0 flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-2xl font-display font-bold text-sm sm:text-[15px] transition-colors cursor-pointer select-none ${
                    isActive
                      ? 'text-[#451A03]'
                      : 'bg-white/90 hover:bg-white text-[#78350F] border-2 border-[#FDE68A]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMoodPill"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 bg-[#FACC15] border-2 border-[#451A03] rounded-2xl shadow-[0_4px_0_#451A03]"
                    />
                  )}
                  <motion.span
                    animate={isBouncing ? { rotate: [-12, 14, -8, 0], scale: [1, 1.25, 0.95, 1] } : { rotate: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <IconComponent />
                  </motion.span>
                  <span className="relative z-10 whitespace-nowrap">{category.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-center mt-2">
            <motion.p key={currentMoodMeta.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-xs sm:text-sm font-bold text-[#78350F] inline-flex items-center gap-2 bg-[#FEF3C7] border border-[#FDE68A] px-4 py-1.5 rounded-full">
              <span>✨ {currentMoodMeta.tagline}</span>
              <span className="bg-white text-[#451A03] px-2 py-0.5 rounded-full text-[11px] font-extrabold">
                {filteredCakes.length} {filteredCakes.length === 1 ? 'Treat' : 'Treats'}
              </span>
            </motion.p>
          </div>
        </div>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          <AnimatePresence mode="popLayout">
            {filteredCakes.map((cake) => (
              <motion.article
                layout
                key={cake.id}
                initial={{ opacity: 0, scale: 0.92, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                whileHover={{ y: -6 }}
                className="clay-card overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#FEF3C7]">
                    <CakeImage src={cake.image} alt={cake.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className={`absolute top-3 left-3 ${cake.badgeBg} border-2 border-[#451A03] px-3 py-1 rounded-full font-display font-bold text-xs shadow-xs`}>
                      {cake.badge}
                    </span>
                    <span className="absolute bottom-2.5 right-2.5 bg-white/95 text-[#451A03] border border-[#FDE68A] px-2.5 py-0.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
                      Eggless
                    </span>
                  </div>

                  <div className="p-5 pb-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-bold text-lg text-[#451A03] leading-snug">
                        {cake.name}
                      </h3>
                      <span className="shrink-0 bg-[#FEF3C7] text-[#451A03] font-bold text-[11px] px-2.5 py-1 rounded-lg border border-[#FDE68A]">
                        {cake.weight}
                      </span>
                    </div>
                    <p className="text-xs text-[#78350F] leading-relaxed line-clamp-2">
                      {cake.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-[#FEF3C7] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#92400E] block">
                      Fresh Price
                    </span>
                    <span className="font-display font-bold text-2xl text-[#451A03]">
                      ₹{cake.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(cake)}
                    className="bg-[#FACC15] hover:bg-[#FDE047] text-[#451A03] font-display font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border-2 border-[#451A03] squishy-btn flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>+ Add to Cart</span>
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      <footer className="bg-[#FEF3C7] border-t-2 border-[#FDE68A] py-8 px-4 text-center space-y-1.5">
        <p className="font-display font-bold text-lg text-[#451A03]">
          Yummy Cake Shop • GST Road, Chromepet, Chennai
        </p>
        <p className="font-display font-bold text-sm text-[#78350F]">
          “நாவின் சுவை அரும்புகள் மலரட்டும்”
        </p>
        <p className="text-xs font-semibold text-[#92400E]">
          Open Daily 9:00 AM – 10:30 PM • Free Doorstep Delivery in Chromepet above ₹999
        </p>
      </footer>

      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-[#451A03]/45 backdrop-blur-xs" />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              aria-label="Yummy Cake Shop Shopping Cart"
             className="relative z-10 w-full max-w-lg shrink-0 bg-[#FFFBEB] border-l-2 border-[#451A03] h-full flex flex-col shadow-2xl"
            >
              <div className="px-5 py-4 bg-white border-b-2 border-[#FDE68A] flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-xl text-[#451A03]">
                    Your Yummy Box ({totalCount})
                  </h2>
                  <p className="text-xs font-semibold text-[#78350F]">
                    Chromepet 45-Min Express Dispatch
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  aria-label="Close Cart Drawer"
                  className="w-10 h-10 rounded-xl bg-[#FEF3C7] hover:bg-[#FB7185] hover:text-white text-[#451A03] border-2 border-[#451A03] flex items-center justify-center font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-[#FEF3C7] border-b-2 border-[#FDE68A]">
                <div className="bg-gradient-to-b from-[#FFFBEB] to-[#FDE68A]/70 border-2 border-[#451A03] rounded-3xl p-3 text-center shadow-[0_4px_0_#451A03]">
                  <ShiroMoodMascot isExcited={cartItems.length > 0} />
                  <AnimatePresence mode="wait">
                    {cartItems.length === 0 ? (
                      <motion.p key="copy-sleep" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="font-display font-bold text-sm text-[#78350F] mt-1">
                        Shiro is napping... Add a yummy cake to wake him up!
                      </motion.p>
                    ) : (
                      <motion.p key="copy-awake" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="font-display font-bold text-base text-[#451A03] mt-1 flex items-center justify-center gap-1.5">
                        <span>Woof! Shiro is ready for cake time!</span>
                        <span className="inline-block bg-[#4ADE80] border border-[#451A03] text-[11px] px-2 py-0.5 rounded-full">Yum!</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-6 space-y-4">
                    <p className="text-sm text-[#78350F] max-w-xs leading-relaxed">
                      Your box is currently empty. Pick a Chocobi Truffle or design your own Action Kamen cake!
                    </p>
                    <button onClick={handleBrowseFromEmptyCart} className="bg-[#FACC15] hover:bg-[#FDE047] text-[#451A03] font-display font-bold px-6 py-3.5 rounded-2xl border-2 border-[#451A03] squishy-btn text-sm cursor-pointer">
                      Browse Yummy Cakes →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="bg-white border-2 border-[#FDE68A] rounded-2xl p-3">
                      <div className="flex justify-between text-xs font-bold text-[#451A03] mb-1.5">
                        <span>
                          {subtotal >= freeDeliveryThreshold
                            ? '🎉 FREE Chromepet Delivery Unlocked!'
                            : `Add ₹${(freeDeliveryThreshold - subtotal).toLocaleString('en-IN')} more for FREE Delivery`}
                        </span>
                        <span>{Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100))}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#FEF3C7] rounded-full overflow-hidden border border-[#FDE68A]">
                        <motion.div animate={{ width: `${Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100))}%` }} className="h-full bg-[#4ADE80] rounded-full" />
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {cartItems.map((item) => (
                        <motion.div layout key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} className="bg-white border-2 border-[#FDE68A] rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
                          <CakeImage src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover border border-[#FDE68A] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-display font-bold text-sm text-[#451A03] truncate">{item.name}</h4>
                            <p className="text-[11px] font-semibold text-[#78350F]">{item.weight} • 100% Eggless</p>
                            {typeof item.id === 'string' && item.id.startsWith('custom-') && (
                              <p className="text-[10px] font-bold text-[#92400E] truncate">{item.description}</p>
                            )}
                            <p className="font-display font-bold text-base text-[#451A03] mt-0.5">₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
                          </div>

                          <div className="flex items-center gap-1.5 bg-[#FEF3C7] border-2 border-[#451A03] rounded-xl px-1.5 py-1">
                            <button onClick={() => updateQuantity(item.id, -1)} aria-label={`Decrease quantity of ${item.name}`} className="w-6 h-6 rounded-lg bg-white hover:bg-[#FB7185] hover:text-white font-bold text-xs text-[#451A03] flex items-center justify-center transition-colors cursor-pointer">−</button>
                            <span className="px-1.5 font-display font-bold text-sm text-[#451A03]">{item.qty}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} aria-label={`Increase quantity of ${item.name}`} className="w-6 h-6 rounded-lg bg-white hover:bg-[#4ADE80] font-bold text-xs text-[#451A03] flex items-center justify-center transition-colors cursor-pointer">+</button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-4 bg-white border-t-2 border-[#FDE68A] space-y-2.5 shrink-0 overflow-y-auto max-h-[42vh]">
                  <div id="checkout-fields" className="space-y-2 text-left">
                    <input id="cust-name" type="text" placeholder="Customer Name" className="w-full p-2.5 rounded-lg border-2 border-[#FDE68A] bg-[#FFFBEB] text-slate-900 text-sm focus:outline-none focus:border-[#451A03]" required />
                    <input id="cust-phone" type="tel" placeholder="Customer WhatsApp Number" className="w-full p-2.5 rounded-lg border-2 border-[#FDE68A] bg-[#FFFBEB] text-slate-900 text-sm focus:outline-none focus:border-[#451A03]" required />
                    <select id="cust-mode" className="w-full p-2.5 rounded-lg border-2 border-[#FDE68A] bg-[#FFFBEB] text-slate-900 text-sm focus:outline-none focus:border-[#451A03]">
                      <option value="Delivery">Doorstep Delivery (Chrompet)</option>
                      <option value="Pickup">Store Pickup (Chrompet)</option>
                    </select>
                    <input id="cust-address" type="text" placeholder="Delivery Address (if Delivery)" className="w-full p-2.5 rounded-lg border-2 border-[#FDE68A] bg-[#FFFBEB] text-slate-900 text-sm focus:outline-none focus:border-[#451A03]" />
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between font-semibold text-[#78350F]">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-[#78350F]">
                      <span>Chromepet Delivery</span>
                      <span className={deliveryFee === 0 ? 'text-[#16A34A] font-extrabold' : ''}>
                        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                      </span>
                    </div>
                    <div className="flex justify-between font-display font-bold text-xl text-[#451A03] pt-2 border-t border-[#FEF3C7]">
                      <span>Total Payable</span>
                      <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBookCake}
                    disabled={orderSubmitting}
                    className="w-full disabled:opacity-60 bg-[#FACC15] hover:bg-[#FDE047] text-[#451A03] font-display font-bold text-base py-3.5 rounded-2xl border-2 border-[#451A03] squishy-btn flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{orderSubmitting?'Saving order…':'Place Order'}</span>
                    <span>✓</span>
                  </button>

                  {bookingSummary && (
                    <div className="bg-[#FFFBEB] border-2 border-[#451A03] rounded-2xl p-3.5 space-y-2.5 text-left shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-sm text-[#451A03]">
                          Order Received • #{bookingSummary.orderId}
                        </span>
                        <span className="bg-[#4ADE80] text-[#451A03] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-[#451A03]">
                          ETA {bookingSummary.deliveryTime}
                        </span>
                      </div>

                      <pre className="whitespace-pre-wrap font-sans text-xs text-[#451A03] bg-white p-2.5 rounded-xl border border-[#FDE68A] leading-relaxed">
                        {bookingSummary.cleanMessage}
                      </pre>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleCopyBookingText}
                          className="bg-white hover:bg-[#FEF3C7] text-[#451A03] font-display font-bold text-xs py-2.5 px-3 rounded-xl border-2 border-[#451A03] cursor-pointer"
                        >
                          Copy Text
                        </button>
                        <button
                          type="button"
                          onClick={handleSendWhatsApp}
                          className="bg-[#4ADE80] hover:bg-[#22C55E] text-[#451A03] font-display font-bold text-xs py-2.5 px-3 rounded-xl border-2 border-[#451A03] cursor-pointer"
                        >
                          Send via WhatsApp
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {myPageOpen && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-[#451A03]/70 p-3 flex items-center justify-center" onClick={e=>{if(e.target===e.currentTarget)setMyPageOpen(false);}}>
          <motion.section className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#FFFBEB] border-4 border-[#451A03] rounded-[28px] p-5 shadow-2xl">
            <div className="flex justify-between mb-4"><div><h2 className="font-display text-3xl font-extrabold">My Account & Orders</h2><p className="text-sm text-[#78350F]">Sign in once to save and track your orders.</p></div><button type="button" onClick={()=>setMyPageOpen(false)} className="text-2xl" aria-label="Close">×</button></div>
            {!googleUser?<div className="rounded-2xl border-2 border-[#FDE68A] bg-white p-5 text-center"><p className="font-bold mb-3">Continue securely with your Google account</p><div id="google-signin-button" className="flex justify-center min-h-11"/><p className="text-xs text-[#78350F] mt-3">Each Google account has its own private order history.</p></div>:<><div className="flex items-center gap-3 rounded-xl bg-white p-3 border border-[#FDE68A]">{googleUser.picture&&<img src={googleUser.picture} className="w-11 h-11 rounded-full" alt=""/>}<div className="min-w-0 flex-1"><b className="block truncate">{googleUser.name}</b><span className="text-xs text-[#78350F]">{googleUser.email}</span></div><button type="button" onClick={()=>void signOutCustomer()} className="text-sm underline">Sign out</button></div><h3 className="font-display text-xl font-extrabold mt-4">Your orders</h3>{myOrders.length===0?<p className="rounded-xl bg-white p-4 text-sm mt-2">No orders yet. Choose a cake and place your first order.</p>:<div className="space-y-3 mt-2">{myOrders.map(o=><button type="button" key={o.id} onClick={()=>{setLookupId(o.id);setCustomerOrder(o);}} className="w-full text-left rounded-xl bg-white border-2 border-[#FDE68A] p-3"><div className="flex justify-between gap-2"><b>#{o.id}</b><span className="text-xs font-bold">{o.status}</span></div><p className="text-xs text-[#78350F]">{new Date(o.createdAt).toLocaleString('en-IN')}</p><p className="text-sm mt-1">{o.items.map(i=>i.name+' × '+i.qty).join(', ')}</p><b className="text-sm">₹{o.total.toLocaleString('en-IN')}</b></button>)}</div>}<form onSubmit={e=>{e.preventDefault();void handleLookupOrder();}} className="space-y-2 mt-4"><label className="block text-sm font-bold">Track by order ID<input value={lookupId} onChange={e=>setLookupId(e.target.value.toUpperCase())} placeholder="YCS-000001" className="mt-1 w-full rounded-xl border-2 border-[#451A03] bg-white p-3"/></label><button disabled={lookupLoading} className="w-full rounded-xl border-2 border-[#451A03] bg-[#FACC15] p-3 font-extrabold">{lookupLoading?'Checking…':'Track order'}</button></form></>}
            {lookupError&&<p role="alert" className="mt-3 rounded-xl bg-red-50 text-red-800 p-3 text-sm">{lookupError}</p>}
            {customerOrder&&<div className="mt-4 rounded-2xl border-2 border-[#451A03] bg-white p-4 space-y-3"><div><p className="text-xs text-[#78350F]">#{customerOrder.id}</p><h3 className="font-display text-2xl font-extrabold">{customerOrder.status}</h3><p className="text-xs text-[#78350F]">Last updated {new Date(customerOrder.updatedAt).toLocaleString('en-IN')}</p></div><div className="space-y-1 text-sm">{customerOrder.items.map((i,n)=><div key={n} className="flex justify-between"><span>{i.name} × {i.qty}</span><b>₹{(i.price*i.qty).toLocaleString('en-IN')}</b></div>)}<div className="border-t pt-2 flex justify-between font-extrabold"><span>Total</span><span>₹{customerOrder.total.toLocaleString('en-IN')}</span></div></div><b className="text-sm">Status history</b><ol className="space-y-2">{(customerOrder.history||[]).map((x,n)=><li key={n} className="text-sm">🟢 {x.status}<span className="block text-xs text-[#78350F]">{new Date(x.at).toLocaleString('en-IN')}</span></li>)}</ol></div>}
          </motion.section>
        </motion.div>}
      </AnimatePresence>
      <AnimatePresence>
        {toastText && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#451A03] text-[#FFFBEB] border-2 border-[#FACC15] px-5 py-3 rounded-2xl shadow-xl font-display font-bold text-sm flex items-center gap-2.5 pointer-events-none"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80]" />
            <span>{toastText}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}