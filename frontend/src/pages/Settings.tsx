import React, { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const Settings: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('municipio');

  // Estado das configurações do município
  const [name, setName] = useState(profile?.municipality?.name || '');
  const [cnpj, setCnpj] = useState(profile?.municipality?.cnpj || '');
  const [primaryColor, setPrimaryColor] = useState(profile?.municipality?.primaryColor || '#0f2d59');
  const [logoUrl, setLogoUrl] = useState(profile?.municipality?.logoUrl || '');
  const [isSaving, setIsSaving] = useState(false);

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
        logoUrl,
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
                <Input
                  label="URL do Logotipo/Brasão"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://exemplo.com/brasao.png"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Identidade Visual & Cores</CardTitle>
                <CardDescription>
                  Selecione a cor primária do município. Ela será aplicada em todo o painel administrativo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {colors.map((color) => (
                    <div
                      key={color.value}
                      onClick={() => setPrimaryColor(color.value)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        primaryColor === color.value
                          ? 'border-gov-blue bg-slate-50'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-xs font-semibold text-slate-700">{color.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" isLoading={isSaving} leftIcon={<Save size={16} />}>
                  Salvar Alterações
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Lado Direito - Preview em tempo real */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pré-visualização do Tema
            </h3>
            <Card className="flex flex-col items-center text-center p-8 border-slate-200">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-xl mb-4 transition-all duration-300"
                style={{ backgroundColor: primaryColor }}
              >
                Gov
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">{name || 'Minha Prefeitura'}</h4>
              <span className="text-[10px] text-gov-gold font-bold uppercase tracking-wider mt-1.5">
                Brasão / Logotipo Oficial
              </span>
              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                As áreas de navegação e componentes principais adotarão este esquema de cores.
              </p>
            </Card>
          </div>
        </form>
      )}

      {activeTab === 'secretarias' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lado Esquerdo - Lista de Secretarias */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-950 tracking-tight">Órgãos Cadastrados</h3>
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Nome da Secretaria / Órgão
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {secretariats.map((sec) => (
                    <tr key={sec.id} className="hover:bg-slate-50/40">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {sec.name}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                        {sec.code}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          leftIcon={<Trash2 size={16} />}
                          onClick={() => handleRemoveSecretariat(sec.id)}
                        >
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Lado Direito - Adicionar Secretaria */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Nova Secretaria</CardTitle>
                <CardDescription>Vincule um novo órgão ao município.</CardDescription>
              </CardHeader>
              <form onSubmit={handleAddSecretariat}>
                <CardContent className="flex flex-col gap-4">
                  <Input
                    label="Nome do Órgão/Secretaria"
                    placeholder="Ex: Secretaria Municipal de Educação"
                    required
                    value={newSecName}
                    onChange={(e) => setNewSecName(e.target.value)}
                  />
                  <Input
                    label="Sigla / Código"
                    placeholder="Ex: SEMED"
                    required
                    value={newSecCode}
                    onChange={(e) => setNewSecCode(e.target.value)}
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
