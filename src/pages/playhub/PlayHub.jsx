import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Gamepad2, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  AlertCircle 
} from 'lucide-react';
import { fetchGamesConfig } from '../../redux/slices/playHubSlice';
import Loading from '../../ui/Loading';

const PlayHub = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { games, loading: gamesLoading, error: gamesError } = useSelector((state) => state.playHub);

  useEffect(() => {
    dispatch(fetchGamesConfig());
  }, [dispatch]);

  const handlePlayGame = (gameKey) => {
    if (gameKey === 'sentence_builder') {
      navigate('/play/sentence-builder');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0e1b] text-slate-100 flex flex-col overflow-x-hidden selection:bg-teal-500 selection:text-black">
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-3 sm:px-4 py-3 sm:py-6 justify-center">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 sm:gap-4 mb-3 sm:mb-5 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-indigo-500/20 border border-teal-500/30 text-teal-300 text-[10px] sm:text-xs font-bold tracking-wide uppercase mb-1 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
              <Sparkles className="w-3 h-3" />
              <span>Pic2Speak Arcade</span>
            </div>
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
              Play & Practice <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-300 to-indigo-300">Hub</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-base mt-1 max-w-xl line-clamp-2 sm:line-clamp-none">
              Strengthen your speaking, vocabulary, and sentence construction through fun, interactive games.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/adventure-map')}
              className="px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-[#121629] hover:bg-[#1a213b] border border-indigo-900/60 text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all shadow-sm hover:border-cyan-500/40 cursor-pointer"
            >
              <span>🗺️</span>
              <span>Adventure Map</span>
            </button>
          </div>
        </div>

        {gamesLoading ? (
          <div className="py-20 flex flex-col items-center justify-center flex-1">
            <Loading message="Loading game library..." />
          </div>
        ) : gamesError ? (
          <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/40 text-center my-auto max-w-md mx-auto">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-200 font-bold mb-4">{gamesError}</p>
            <button
              onClick={() => dispatch(fetchGamesConfig())}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 pb-4 sm:pb-8">
            {games.map((game) => {
              const isSentenceBuilder = game.gameKey === 'sentence_builder';
              const isInteractive = isSentenceBuilder && !game.isComingSoon;

              return (
                <motion.div
                  key={game._id || game.gameKey}
                  whileHover={isInteractive ? { y: -4, transition: { duration: 0.2 } } : {}}
                  className={`relative rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col border transition-all duration-300 ${
                    isInteractive
                      ? 'bg-gradient-to-b from-[#13182e] to-[#0d1021] border-teal-500/40 hover:border-teal-400 hover:shadow-[0_10px_35px_rgba(20,184,166,0.25)]'
                      : 'bg-[#101322]/80 border-indigo-950/70 opacity-85'
                  }`}
                >
                  <div className="relative w-full h-32 sm:h-48 lg:h-52 bg-slate-950 overflow-hidden">
                    {game.thumbnailUrl ? (
                      <img
                        src={game.thumbnailUrl}
                        alt={game.title}
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          isInteractive ? 'hover:scale-105' : 'grayscale-[40%]'
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-950/30 text-slate-600">
                        <Gamepad2 className="w-12 h-12 sm:w-16 sm:h-16 opacity-30" />
                      </div>
                    )}

                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                      {isInteractive ? (
                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-wider uppercase bg-teal-500/90 text-slate-950 backdrop-blur-md shadow-md flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          Active Game
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-slate-900/90 text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-md flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          Coming Soon
                        </span>
                      )}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#13182e] to-transparent pointer-events-none" />
                  </div>

                  <div className="p-3.5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        {game.title}
                      </h3>
                      <p className="text-slate-400 text-[11px] sm:text-sm mt-1 leading-snug sm:leading-relaxed">
                        {game.description || 'Interactive language learning practice challenge.'}
                      </p>
                    </div>

                    <div className="mt-3 sm:mt-6 pt-2.5 sm:pt-4 border-t border-indigo-950/65">
                      {isInteractive ? (
                        <button
                          onClick={() => handlePlayGame(game.gameKey)}
                          className="w-full py-2 sm:py-3 px-4 rounded-xl font-black text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <span>Play Sentence Builder</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-500 bg-slate-900/60 border border-slate-800 flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <Clock className="w-4 h-4 text-amber-400/60" />
                          <span>In Development</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayHub;