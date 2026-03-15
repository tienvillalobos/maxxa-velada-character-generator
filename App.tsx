
import React, { useState, useRef } from 'react';
import Header from './components/Header';
import { generateCharacterSprites } from './services/geminiService';
import { AppStatus, SpriteResult, GeneratorType, ANIMATION_SETS, FRAME_WIDTH, FRAME_HEIGHT } from './types';
import { Upload, RefreshCw, Zap, Palette, FolderArchive, MessageSquarePlus, Users, Swords, Info } from 'lucide-react';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GeneratorType>('BOXER');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [result, setResult] = useState<SpriteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  
  // Customization state
  const [shortsColor, setShortsColor] = useState('red');
  const [glovesColor, setGlovesColor] = useState('black');
  const [hasShorts, setHasShorts] = useState(false);
  const [hasGloves, setHasGloves] = useState(false);
  const [hasShoes, setHasShoes] = useState(false);
  const [additionalDescription, setAdditionalDescription] = useState('');
  const [characterName, setCharacterName] = useState('character');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImage(reader.result as string);
        setMimeType(file.type);
        setStatus(AppStatus.IDLE);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!userImage) return;

    try {
      setStatus(AppStatus.GENERATING);
      setError(null);
      
      const base64Data = userImage.split(',')[1];
      const generatedUrl = await generateCharacterSprites(base64Data, mimeType, {
        type: activeTab,
        shortsColor: activeTab === 'BOXER' ? shortsColor : undefined,
        hasShorts: activeTab === 'BOXER' ? hasShorts : undefined,
        glovesColor: activeTab === 'BOXER' ? glovesColor : undefined,
        hasGloves: activeTab === 'BOXER' ? hasGloves : undefined,
        hasShoes: activeTab === 'BOXER' ? hasShoes : undefined,
        additionalDescription
      });
      
      setResult({
        imageUrl: generatedUrl,
        prompt: `${activeTab} sprites. Desc: ${additionalDescription}`,
        type: activeTab
      });
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      setError('Error al generar los sprites. Por favor, intenta de nuevo.');
      setStatus(AppStatus.ERROR);
    }
  };

  const downloadZip = async () => {
    if (!result) return;
    setIsZipping(true);
    try {
      const img = new Image();
      img.src = result.imageUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const zip = new JSZip();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context error");

      const cols = 4;
      const rows = 3;
      const frameWidth = img.width / cols;
      const frameHeight = img.height / rows;

      canvas.width = FRAME_WIDTH;
      canvas.height = FRAME_HEIGHT;

      const animations = ANIMATION_SETS[result.type];
      const charFolder = zip.folder(characterName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'character');

      for (let r = 0; r < rows; r++) {
        const { folder: folderName, frames: numFrames } = animations[r];
        const animFolder = charFolder?.folder(folderName);
        for (let c = 0; c < numFrames; c++) {
          ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
          ctx.drawImage(
            img,
            c * frameWidth, r * frameHeight, frameWidth, frameHeight,
            0, 0, FRAME_WIDTH, FRAME_HEIGHT
          );

          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
          if (blob && animFolder) {
            animFolder.file(`frame_${String(c).padStart(3, '0')}.png`, blob);
          }
        }
      }

      const zipContent = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipContent);
      link.download = `${characterName}_animations.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("ZIP Error:", err);
      setError("Error al crear el ZIP.");
    } finally {
      setIsZipping(false);
    }
  };

  const reset = () => {
    setUserImage(null);
    setResult(null);
    setStatus(AppStatus.IDLE);
    setError(null);
    setAdditionalDescription('');
    setCharacterName('character');
    setHasGloves(false);
    setHasShorts(false);
    setHasShoes(false);
  };

  return (
    <div className="min-h-screen pb-20 px-4 bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-4xl mx-auto space-y-6">
        {/* Tab Switcher */}
        <div className="flex bg-slate-900 p-1 rounded-2xl border-2 border-slate-800 shadow-lg">
          <button 
            onClick={() => { setActiveTab('BOXER'); reset(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase tracking-wider transition-all ${activeTab === 'BOXER' ? 'bg-yellow-400 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Swords className="w-5 h-5" />
            <span>Modo Boxer</span>
          </button>
          <button 
            onClick={() => { setActiveTab('CROWD'); reset(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase tracking-wider transition-all ${activeTab === 'CROWD' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Users className="w-5 h-5" />
            <span>Modo Público</span>
          </button>
        </div>

        {/* Generator Section */}
        <section className={`bg-slate-900/50 border-2 rounded-3xl p-6 shadow-2xl transition-colors duration-500 ${activeTab === 'BOXER' ? 'border-yellow-400/30' : 'border-indigo-500/30'}`}>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 aspect-square relative">
              {userImage ? (
                <div className={`relative w-full h-full rounded-2xl overflow-hidden border-4 shadow-2xl transition-colors ${activeTab === 'BOXER' ? 'border-yellow-400/50' : 'border-indigo-500/50'}`}>
                  <img src={userImage} alt="Reference" className="w-full h-full object-cover" />
                  <button 
                    onClick={reset}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 p-2 rounded-full shadow-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center w-full h-full border-4 border-dashed rounded-2xl cursor-pointer transition-all bg-slate-900/50 group ${activeTab === 'BOXER' ? 'border-yellow-400/30 hover:border-yellow-400' : 'border-indigo-500/30 hover:border-indigo-500'}`}>
                  <Upload className={`w-12 h-12 mb-4 transition-transform group-hover:scale-110 ${activeTab === 'BOXER' ? 'text-yellow-400/50 group-hover:text-yellow-400' : 'text-indigo-500/50 group-hover:text-indigo-500'}`} />
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-xs text-center px-4">Sube tu foto</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              )}
            </div>

            <div className="flex-1 space-y-6 w-full">
              <div className="flex items-center gap-3">
                <Palette className={`w-6 h-6 ${activeTab === 'BOXER' ? 'text-yellow-400' : 'text-indigo-400'}`} />
                <h3 className="text-xl font-bold uppercase tracking-wider pixel-font text-[10px]">
                  {activeTab === 'BOXER' ? 'Detalles del Luchador' : 'Detalles del Público'}
                </h3>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Nombre del Personaje</label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="character"
                  className={`w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 outline-none transition-colors text-sm ${activeTab === 'BOXER' ? 'focus:border-yellow-400' : 'focus:border-indigo-400'}`}
                />
                <p className="text-[9px] text-slate-500 mt-1">Usado como nombre de la carpeta en el ZIP</p>
              </div>

              {activeTab === 'BOXER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Guantes</label>
                      <input 
                        type="checkbox" 
                        checked={hasGloves} 
                        onChange={(e) => setHasGloves(e.target.checked)}
                        className="w-4 h-4 accent-yellow-400"
                      />
                    </div>
                    <select 
                      disabled={!hasGloves}
                      value={glovesColor}
                      onChange={(e) => setGlovesColor(e.target.value)}
                      className={`w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 focus:border-yellow-400 outline-none transition-colors appearance-none text-sm ${!hasGloves ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="red">Rojo</option>
                      <option value="blue">Azul</option>
                      <option value="black">Negro</option>
                      <option value="gold">Dorado</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shorts</label>
                      <input 
                        type="checkbox" 
                        checked={hasShorts} 
                        onChange={(e) => setHasShorts(e.target.checked)}
                        className="w-4 h-4 accent-yellow-400"
                      />
                    </div>
                    <select 
                      disabled={!hasShorts}
                      value={shortsColor}
                      onChange={(e) => setShortsColor(e.target.value)}
                      className={`w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 focus:border-yellow-400 outline-none transition-colors appearance-none text-sm ${!hasShorts ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="red">Rojo</option>
                      <option value="blue">Azul</option>
                      <option value="black">Negro</option>
                      <option value="white">Blanco</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-3 bg-slate-950/50 border-2 border-slate-800 p-3 rounded-xl cursor-pointer hover:border-yellow-400/50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={hasShoes} 
                        onChange={(e) => setHasShoes(e.target.checked)}
                        className="w-5 h-5 accent-yellow-400"
                      />
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Incluir Zapatillas de Boxeo</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                  <MessageSquarePlus className="w-3 h-3" />
                  Descripción Adicional
                </label>
                <textarea 
                  value={additionalDescription}
                  onChange={(e) => setAdditionalDescription(e.target.value)}
                  placeholder={activeTab === 'BOXER' ? "Ej: Barba larga, tatuajes en brazos..." : "Ej: Camiseta de fútbol, gorra hacia atrás, estilo gamer..."}
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-400 outline-none transition-colors min-h-[80px] text-sm resize-none"
                />
              </div>

              <button
                disabled={!userImage || status === AppStatus.GENERATING}
                onClick={handleGenerate}
                className={`w-full py-5 rounded-2xl font-black text-xl uppercase tracking-tighter flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 ${
                  !userImage || status === AppStatus.GENERATING
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : activeTab === 'BOXER' ? 'bg-yellow-400 text-slate-900 hover:bg-yellow-300' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {status === AppStatus.GENERATING ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    Pixelando...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 fill-current" />
                    Generar Personaje
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Results */}
        {error && (
          <div className="bg-red-500/10 border-2 border-red-500/50 p-6 rounded-2xl text-red-400 flex items-center gap-3 animate-in slide-in-from-bottom-2">
            <span className="font-black">ERROR:</span> {error}
          </div>
        )}

        {status === AppStatus.GENERATING && (
          <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-12 text-center animate-pulse">
            <RefreshCw className={`w-12 h-12 mx-auto mb-6 animate-spin ${activeTab === 'BOXER' ? 'text-yellow-400' : 'text-indigo-400'}`} />
            <h2 className="text-xl font-black uppercase tracking-widest">Generando frames</h2>
            <p className="text-slate-500 text-sm mt-2">
              {activeTab === 'BOXER' ? 'Idle, Walk & Punch' : 'Idle, Cheering & Surprised'}
            </p>
          </div>
        )}

        {result && status === AppStatus.SUCCESS && (
          <section className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-8 rounded-full ${activeTab === 'BOXER' ? 'bg-yellow-400' : 'bg-indigo-500'}`}></div>
                <h2 className="text-xl font-black uppercase tracking-widest pixel-font text-[10px]">Resultado Final</h2>
              </div>
              <button 
                onClick={downloadZip}
                disabled={isZipping}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
              >
                {isZipping ? <RefreshCw className="w-6 h-6 animate-spin" /> : <FolderArchive className="w-6 h-6" />}
                Descargar ZIP
              </button>
            </div>

            <div className="bg-slate-900 border-4 border-slate-800 rounded-3xl p-8 overflow-hidden">
              <div className="bg-[#808080] p-6 rounded-xl shadow-inner w-full flex justify-center overflow-x-auto items-center min-h-[300px]">
                <img 
                  src={result.imageUrl} 
                  alt="Spritesheet" 
                  className="pixelated max-w-none md:max-w-full shadow-2xl border-4 border-slate-700"
                />
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] pixel-font text-center">
                {ANIMATION_SETS[result.type].map((anim, idx) => (
                  <span key={anim.folder} className="bg-slate-800 px-3 py-1 rounded">Fila {idx+1}: {anim.folder} ({anim.frames} frames)</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-start gap-4">
                <Info className="w-8 h-8 text-blue-400 shrink-0" />
                <div>
                  <h4 className="font-black uppercase text-sm mb-1">Estructura del ZIP</h4>
                  <p className="text-xs text-slate-400">
                    {result.type === 'BOXER' ? 'idle/, walk/, attack/' : 'idle/, cheer/, surprised/'} - Cada una con sus frames .png listos para tu juego.
                  </p>
                </div>
              </div>
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-start gap-4">
                <Zap className={`w-8 h-8 shrink-0 ${result.type === 'BOXER' ? 'text-yellow-400' : 'text-indigo-400'}`} />
                <div>
                  <h4 className="font-black uppercase text-sm mb-1">Pixel Art 16-bit</h4>
                  <p className="text-xs text-slate-400">Frames optimizados para motores 2D con fondo gris neutro para facilitar el recorte.</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
