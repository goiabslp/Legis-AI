import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Save, 
  Plus, 
  Trash2, 
  Building2, 
  Scale
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const Settings: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'municipio';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Estado das configurações do município
  const [name, setName] = useState(profile?.municipality?.name || '');
  const [cnpj, setCnpj] = useState(profile?.municipality?.cnpj || '');
  const [primaryColor, setPrimaryColor] = useState(profile?.municipality?.primaryColor || '#0f2d59');
  const [isSaving, setIsSaving] = useState(false);

  // Estado das imagens base64/URL
  const [logoBase64, setLogoBase64] = useState(
    localStorage.getItem('mun_logo_base64') || profile?.municipality?.logoUrl || ''
  );
  const [watermarkBase64, setWatermarkBase64] = useState(
    localStorage.getItem('mun_watermark_base64') || ''
  );

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoBase64(base64String);
        localStorage.setItem('mun_logo_base64', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setWatermarkBase64(base64String);
        localStorage.setItem('mun_watermark_base64', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Lista de Secretarias do município (simulado)
  const [secretariats, setSecretariats] = useState([
    { id: '1', name: 'Secretaria Municipal de Administração', code: 'SEMAD' },
    { id: '2', name: 'Secretaria Municipal de Educação', code: 'SEMED' },
    { id: '3', name: 'Secretaria Municipal de Saúde', code: 'SMS' },
  ]);
  const [newSecName, setNewSecName] = useState('');
  const [newSecCode, setNewSecCode] = useState('');

  const colors = [
    { name: 'Azul Governo (Padrão)', value: '#0f2d59' },
    { name: 'Verde Brasília', value: '#064e3b' },
    { name: 'Cinza Executivo', value: '#1e293b' },
    { name: 'Bordô Oficial', value: '#7f1d1d' },
    { name: 'Azul Royal', value: '#1d4ed8' },
  ];

  const handleSaveMunicipality = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put(`/municipalities/${profile?.municipalityId}`, {
        name,
        cnpj,
        primaryColor,
        logoUrl: logoBase64,
      });
      await refreshProfile();
      alert('Configurações do município atualizadas com sucesso!');
    } catch (err) {
      console.error(err);
      // Simulação para preview na interface
      document.documentElement.style.setProperty('--color-gov-blue', primaryColor);
      alert('[Demonstração] Configurações de cores e dados aplicadas localmente!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSecretariat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecName || !newSecCode) return;
    const newSec = {
      id: Math.random().toString(),
      name: newSecName,
      code: newSecCode.toUpperCase(),
    };
    setSecretariats([...secretariats, newSec]);
    setNewSecName('');
    setNewSecCode('');
  };

  const handleRemoveSecretariat = (id: string) => {
    setSecretariats(secretariats.filter((s) => s.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight !m-0">
          Prefeitura e Configurações
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gerencie a identidade visual da prefeitura e a estrutura de órgãos/secretarias vinculados.
        </p>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('municipio')}
          className={`pb-3 text-sm font-semibold tracking-tight transition-all relative ${
            activeTab === 'municipio'
              ? 'text-gov-blue border-b-2 border-gov-blue'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Identidade do Município
        </button>
        <button
          onClick={() => setActiveTab('secretarias')}
          className={`pb-3 text-sm font-semibold tracking-tight transition-all relative ${
            activeTab === 'secretarias'
              ? 'text-gov-blue border-b-2 border-gov-blue'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Órgãos e Secretarias
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'municipio' && (
        <form onSubmit={handleSaveMunicipality} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lado Esquerdo - Formulário */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados Gerais</CardTitle>
                <CardDescription>
                  Insira as informações oficiais que constarão no timbre e rodapé de todos os documentos gerados.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <Input
                  label="Nome da Prefeitura"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Prefeitura Municipal de Nova Friburgo"
                  required
                />
                <Input
                  label="CNPJ Oficial"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  required
                />
                {/* Upload do Brasão */}
                <div className="flex flex-col gap-2 text-left">
                  <label className="text-xs font-bold text-slate-700 uppercase">Brasão Oficial (Logo)</label>
                  <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      {logoBase64 ? (
                        <img src={logoBase64} alt="Brasão do Município" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Building2 size={24} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gov-blue/10 file:text-gov-blue hover:file:bg-gov-blue/20 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-400">Tamanho sugerido: 200x200px. PNG transparente recomendado.</span>
                    </div>
                  </div>
                </div>

                {/* Upload da Marca d'Água */}
                <div className="flex flex-col gap-2 text-left">
                  <label className="text-xs font-bold text-slate-700 uppercase">Marca d'Água dos Documentos</label>
                  <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0 relative">
                      {watermarkBase64 ? (
                        <img src={watermarkBase64} alt="Marca d'Água" className="max-w-full max-h-full object-contain opacity-40" />
                      ) : (
                        <Scale size={24} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleWatermarkUpload}
                        className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gov-blue/10 file:text-gov-blue hover:file:bg-gov-blue/20 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-400">Ficará em segundo plano nos PDFs. Use baixa opacidade.</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 mt-4 pt-4">
                <Button type="submit" isLoading={isSaving} className="w-full" leftIcon={<Save size={16} />}>
                  Salvar Configurações Gerais
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Lado Direito - Identidade Visual */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Paleta de Cores</CardTitle>
                <CardDescription>
                  Defina a cor primária institucional para customizar os cabeçalhos, links e botões.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 text-left">
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setPrimaryColor(c.value)}
                      className={`w-9 h-9 rounded-full border-2 transition-transform duration-150 ${
                        primaryColor === c.value
                          ? 'border-slate-800 scale-110 shadow-xs'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
                
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Cor Personalizada (Hexadecimal)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 border border-slate-200 rounded-lg p-0.5 bg-white cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#0f2d59"
                      className="flex-1 text-xs"
                      pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      )}

      {activeTab === 'secretarias' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lado Esquerdo: Lista de Secretarias */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estrutura de Órgãos Vinculados</CardTitle>
                <CardDescription>
                  Essas secretarias e diretorias determinam a triagem e o roteamento de geração de documentos.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {secretariats.map((sec) => (
                  <div
                    key={sec.id}
                    className="flex justify-between items-center p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-sm font-bold text-slate-800">{sec.name}</span>
                      <span className="text-[10px] bg-gov-blue/10 text-gov-blue font-bold px-1.5 py-0.5 rounded-full uppercase w-max tracking-wide">
                        Código: {sec.code}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveSecretariat(sec.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Excluir secretaria"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Lado Direito: Adicionar Secretaria */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Nova Secretaria</CardTitle>
                <CardDescription>
                  Adicione órgãos e diretorias da prefeitura para a triagem inteligente.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleAddSecretariat}>
                <CardContent className="flex flex-col gap-4 text-left">
                  <Input
                    label="Nome da Secretaria / Diretoria"
                    value={newSecName}
                    onChange={(e) => setNewSecName(e.target.value)}
                    placeholder="Ex: Secretaria Municipal de Educação"
                    required
                  />
                  <Input
                    label="Sigla / Código Interno"
                    value={newSecCode}
                    onChange={(e) => setNewSecCode(e.target.value)}
                    placeholder="Ex: SEMED"
                    required
                  />
                </CardContent>
                <CardFooter className="mt-4">
                  <Button type="submit" className="w-full" leftIcon={<Plus size={16} />}>
                    Adicionar Órgão
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
