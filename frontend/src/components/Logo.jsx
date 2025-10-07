const Logo = ({ className = "h-12" }) => {
  return (
    <div className="inline-flex items-center gap-2 transition-all duration-300 hover:scale-105 cursor-pointer">
      <svg className={className} viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Icône goutte d'eau avec cercles concentriques */}
        <g transform="translate(5, 5)">
          {/* Cercles concentriques */}
          <circle cx="20" cy="20" r="18" fill="none" stroke="#175C64" strokeWidth="1.5" opacity="0.3"/>
          <circle cx="20" cy="20" r="14" fill="none" stroke="#175C64" strokeWidth="1.5" opacity="0.5"/>
          
          {/* Goutte d'eau principale */}
          <path d="M20 8 C20 8, 12 16, 12 22 C12 27, 15.5 30, 20 30 C24.5 30, 28 27, 28 22 C28 16, 20 8, 20 8 Z" fill="#175C64"/>
          
          {/* Reflet sur la goutte */}
          <ellipse cx="17" cy="18" rx="3" ry="4" fill="#EEF2F2" opacity="0.4"/>
          
          {/* Goutte intérieure plus foncée */}
          <path d="M20 14 C20 14, 15 19, 15 23 C15 26, 17 28, 20 28 C23 28, 25 26, 25 23 C25 19, 20 14, 20 14 Z" fill="#0E3A40" opacity="0.6"/>
        </g>
        
        {/* Texte COLLABLE */}
        <text x="50" y="32" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="600" letterSpacing="1">
          <tspan fill="#F7C7BB">COLL</tspan>
          <tspan fill="#175C64">ABLE</tspan>
        </text>
      </svg>
    </div>
  )
}

export default Logo
