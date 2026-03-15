
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-12 px-4 text-center">
      <h1 className="text-5xl md:text-7xl font-black pixel-font text-yellow-400 mb-6 drop-shadow-[0_6px_0_rgba(0,0,0,0.5)] tracking-tighter">
        PIXEL <span className="text-indigo-400">GAME</span> STUDIO
      </h1>
      <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
        Transforma fotos reales en personajes de 16-bit para tu juego. 
        Crea boxeadores legendarios o público entusiasta en segundos.
      </p>
    </header>
  );
};

export default Header;
