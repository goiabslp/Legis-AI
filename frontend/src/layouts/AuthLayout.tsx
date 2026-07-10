import React from 'react';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Lado Esquerdo - Formulário */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 bg-white relative z-10 shadow-xl">
        <div className="max-w-md w-full mx-auto animate-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gov-blue flex items-center justify-center font-bold text-white shadow-md">
              Gov
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none !m-0">DocIA Gov</h1>
              <span className="text-xs text-gov-gold font-semibold uppercase tracking-wider">
                Documentos Administrativos Inteligentes
              </span>
            </div>
          </div>

          {children}

          {/* LGPD Compliance Footer */}
          <div className="mt-12 pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Este portal utiliza autenticação criptografada e está em total conformidade com a{' '}
              <strong className="text-slate-500">Lei Geral de Proteção de Dados (LGPD)</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Lado Direito - Ilustrativo (WOW factor) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gov-blue relative items-center justify-center overflow-hidden">
        {/* Background Gradients & Art */}
        <div className="absolute inset-0 bg-radial-at-tr from-slate-800 via-gov-blue to-slate-950 opacity-90" />
        
        {/* Linhas decorativas modernas */}
        <div className="absolute -top-40 -right-40 w-120 h-120 rounded-full border border-white/5 animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full border border-white/5" />

        {/* Conteúdo */}
        <div className="relative z-10 max-w-lg text-center px-12 animate-slide-up">
          <div className="inline-block bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-gov-gold text-xs font-semibold uppercase tracking-wider mb-6">
            Gestão Pública Moderna e Eficiente
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            A Inteligência Artificial aliada ao serviço público municipal.
          </h2>
          <p className="text-slate-300 leading-relaxed text-base font-light">
            Reduza em até 90% o tempo gasto na redação de memorandos, ofícios, decretos e editais, mantendo a
            padronização legal exigida pelos órgãos de controle.
          </p>
        </div>
      </div>
    </div>
  );
};
