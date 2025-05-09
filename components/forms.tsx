"use client";

import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import { Pencil, Trash2, Check, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

interface Material {
  Codigo: string;
  Nome: string;
}

interface MaterialSelecionado extends Material {
  quantidade: number;
  editando?: boolean;
}

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAfterAdd?: () => void
}



export default function MaterialModal({ isOpen, onClose, onAfterAdd }: MaterialModalProps) {
  const [query, setQuery] = useState("");
  const [materiaisAPI, setMateriaisAPI] = useState<Material[]>([]);
  const [filtered, setFiltered] = useState<Material[]>([]);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [materiais, setMateriais] = useState<MaterialSelecionado[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [idColaborador, setIdColaborador] = useState<number | "">("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [quantidadeEdicao, setQuantidadeEdicao] = useState<{ [index: number]: number }>({});

  useEffect(() => {
    const fetchMateriais = async () => {
      try {
        const res = await fetch("https://prod-10.westeurope.logic.azure.com:443/workflows/87057c62a1264ede964f4e43c90624e0/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=GsbRDnKkibWbkRyx7mxB_dcPpX3DS4dnBNJxKclb_zU", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data: Material[] = await res.json();
        setMateriaisAPI(data);
      } catch (error) {
        console.error("Erro ao buscar materiais:", error);
      }
    };

    if (isOpen) fetchMateriais();
  }, [isOpen]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setFiltered(
      materiaisAPI.filter((mat) =>
        mat.Nome.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  const adicionarMaterial = () => {
    const material = materiaisAPI.find((m) => m.Nome === query);
    if (!material || quantidade <= 0) return;

    setMateriais((prev) => [
      ...prev,
      { ...material, quantidade, editando: false },
    ]);
    setQuery("");
    setQuantidade(1);
    setFiltered([]);
  };

  const removerMaterial = (index: number) => {
    setMateriais((prev) => prev.filter((_, i) => i !== index));
  };

  const iniciarEdicao = (index: number) => {
    setMateriais((prev) =>
      prev.map((item, i) => (i === index ? { ...item, editando: true } : item))
    );
  };

  const salvarEdicao = (index: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) return;

    setMateriais((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantidade: novaQuantidade, editando: false }
          : item
      )
    );
  };
  const usuario = JSON.parse(Cookies.get("usuario") || "{}");
const mec = parseInt(usuario.mec);

  const enviarSolicitacao = async () => {
    setIsProcessing(true);
    if (!mec || materiais.length === 0) {
      toast.error("Preencha o Nº mecanográfico e adicione ao menos um material.");
      return setIsProcessing(false);
    }
    

    const payload = materiais.map((mat) => ({
        
      Codigo: mat.Codigo,
      quantidade: -Math.abs(mat.quantidade),
      idcolaborador: mec,
    }));

    try {
      const res = await fetch("https://prod-58.westeurope.logic.azure.com:443/workflows/829890e175f7447c8ffdba5a4ba9d817/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=olo7xu6ivz39InR9AFjBxu2-8Dc3bqKiXE9-82ggswo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao enviar solicitação");

      toast.success("Pedido enviado com sucesso!");
      setMateriais([]);
      setIdColaborador("");
      onClose();
      onAfterAdd?.();
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao enviar solicitação.");
    }
    
    setIsProcessing(false);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-xl font-bold mb-4 text-center">
            📦 Pedido de Materiais
          </Dialog.Title>

          {/* Form content abaixo */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="relative col-span-2">
                <label className="text-sm font-medium text-gray-600">
                  Material
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={handleSearch}
                  placeholder="Digite o nome do material..."
                  className="mt-1 w-full rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-600"
                />
                {filtered.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border bg-white shadow">
                    {filtered.map((item, idx) => (
                      <li
                        key={idx}
                        onClick={() => {
                          setQuery(item.Nome);
                          setFiltered([]);
                        }}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                      >
                        {item.Nome}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Quantidade
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            

            <button
              onClick={adicionarMaterial}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700"
            >
              <PlusCircle size={18} />
              Adicionar Material
            </button>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Código</th>
                    <th className="px-4 py-2">Nome</th>
                    <th className="px-4 py-2">Qtd</th>
                    <th className="px-4 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {materiais.map((mat, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl bg-gray-50 shadow-sm"
                    >
                      <td className="px-4 py-3 font-medium">{mat.Codigo}</td>
                      <td className="px-4 py-3">{mat.Nome}</td>
                      <td className="px-4 py-3">
                        {mat.editando ? (
                          <input
                            type="number"
                            className="w-16 rounded-md border p-2"
                            defaultValue={mat.quantidade}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                salvarEdicao(
                                  idx,
                                  Number((e.target as HTMLInputElement).value)
                                );
                              }
                            }}
                          />
                        ) : (
                          mat.quantidade
                        )}
                      </td>
                      <td className="flex items-center gap-2 px-4 py-3">
                        {mat.editando ? (
                          <button
                            onClick={() => salvarEdicao(idx, mat.quantidade)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Check size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => iniciarEdicao(idx)}
                            className="text-yellow-600 hover:text-yellow-800"
                          >
                            <Pencil size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => removerMaterial(idx)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                  {materiais.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-400">
                        Nenhum material adicionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="rounded-xl border px-4 py-2 text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={enviarSolicitacao}
                disabled={isProcessing}
                className="rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {isProcessing ? "Enviando..." : "Enviar Pedido"}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
