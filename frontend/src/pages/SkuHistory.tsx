import React, { useEffect, useState } from 'react';
import { Download, Upload, RefreshCw } from 'lucide-react';
import api from '../api/client';

type SkuEntry = {
  sku: string;
  gtin?: string;
  name: string;
  brand: string;
  price?: string;
  tax?: string;
  measureUnit?: string;
};

const SkuHistoryPage = () => {
  const [items, setItems] = useState<SkuEntry[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/skus');
      setItems(res.data || []);
      const mdRes = await api.get('/skus/export/md');
      setContent(mdRes.data || '');
    } catch (err) {
      setItems([]);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDownload = async () => {
    try {
      const res = await api.get('/skus/export/txt', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'historico_de_sku.txt');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro ao baixar arquivo');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setEditContent(text);
    setEditing(true);
  };

  const handleEditStart = () => {
    setEditContent(content);
    setEditing(true);
  };

  const handleSaveConfirm = async () => {
    try {
      await api.put('/skus', { content: editContent });
      setMessage('✓ Arquivo salvo com sucesso!');
      setShowConfirmModal(false);
      setEditing(false);
      await load();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Erro ao salvar arquivo');
    }
  };

  const handleGenerateBatch = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/skus/batch/from-db');
      setMessage(`✓ ${res.data.generated} SKUs gerados de ${res.data.total} produtos!`);
      await load();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Erro ao gerar SKUs em lote');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Admin</p>
          <h1 className="text-2xl font-bold text-charcoal">Histórico de SKU</h1>
        </div>
      </div>

      {message && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</div>}

      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <h2 className="text-lg font-semibold text-charcoal">Gerenciador</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleGenerateBatch}
              disabled={generating}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 text-sm"
            >
              <RefreshCw size={14} />
              Gerar SKUs
            </button>
            <button onClick={handleDownload} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm">
              <Download size={14} />
              Download
            </button>
            <label className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer text-sm">
              <Upload size={14} />
              Upload
              <input type="file" accept=".txt" onChange={handleUpload} className="hidden" />
            </label>
            <button
              onClick={handleEditStart}
              disabled={!content}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 text-sm"
            >
              ✏️ Editar
            </button>
          </div>
        </div>

        {editing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-96 p-3 rounded-lg border border-slate-200 font-mono text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditContent('');
                }}
                className="px-4 py-2 rounded-lg bg-slate-300 text-slate-700 hover:bg-slate-400 text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <div className="prose-table:overflow-x-auto bg-slate-50 p-4 rounded-lg">
              <table className="text-sm w-full border-collapse border border-slate-200">
                <tbody>
                  {content.split('\n').map((line, idx) => (
                    <tr key={idx} className={idx === 0 ? 'bg-slate-200 font-bold' : idx === 1 ? 'bg-slate-100' : ''}>
                      {line.split('|').map((cell, i) => (
                        <td key={i} className="border border-slate-200 px-2 py-1 text-xs">
                          {cell.trim()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!editing && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-charcoal mb-2">Registros ({items.length})</h3>
            {loading && <p>Carregando...</p>}
            {!loading && items.length === 0 && <p className="text-sm text-slate-500">Nenhum SKU registrado.</p>}
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {items.map((it) => (
                <div key={it.sku} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-2">
                  <div>
                    <div className="text-sm font-semibold">{it.sku}</div>
                    <div className="text-xs text-slate-500">{it.name} • {it.brand} {it.measureUnit ? `• ${it.measureUnit}` : ''}</div>
                  </div>
                  <div className="text-xs text-slate-600">{it.price ? `R$ ${it.price}` : ''}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm">
            <h3 className="text-lg font-semibold text-charcoal mb-2">Tem certeza disso?</h3>
            <p className="text-sm text-slate-600 mb-4">As alterações serão salvas permanentemente.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-300 text-slate-700 hover:bg-slate-400 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfirm}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkuHistoryPage;
