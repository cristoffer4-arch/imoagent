'use client'

import { useState } from 'react'
import { Scale, Upload, FileText, CheckCircle, AlertTriangle, Clock, Shield, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MOCK_CONTRACTS = [
  {
    id: 1,
    name: 'Contrato_Compra_Venda_Lisboa_T2.pdf',
    type: 'Compra e Venda',
    status: 'Aprovado',
    uploadDate: '10 Jan 2026',
    reviewDate: '11 Jan 2026',
    clauses: 12,
    risks: 0,
    size: '2.3 MB',
  },
  {
    id: 2,
    name: 'Contrato_Arrendamento_Porto_T3.pdf',
    type: 'Arrendamento',
    status: 'Em Análise',
    uploadDate: '12 Jan 2026',
    reviewDate: null,
    clauses: 15,
    risks: 2,
    size: '1.8 MB',
  },
  {
    id: 3,
    name: 'Procuração_Cliente_Santos.pdf',
    type: 'Procuração',
    status: 'Pendente Assinatura',
    uploadDate: '08 Jan 2026',
    reviewDate: '09 Jan 2026',
    clauses: 5,
    risks: 0,
    size: '850 KB',
  },
]

const COMPLIANCE_CHECKLIST = [
  { id: 1, item: 'Identificação das Partes', status: 'complete' },
  { id: 2, item: 'Descrição do Imóvel', status: 'complete' },
  { id: 3, item: 'Valor da Transação', status: 'complete' },
  { id: 4, item: 'Condições de Pagamento', status: 'complete' },
  { id: 5, item: 'Prazo de Entrega', status: 'warning' },
  { id: 6, item: 'Certificação Energética', status: 'complete' },
  { id: 7, item: 'Ónus e Encargos', status: 'pending' },
  { id: 8, item: 'Cláusulas de Rescisão', status: 'complete' },
]

const ALERTS = [
  {
    id: 1,
    type: 'warning',
    title: 'Prazo de Entrega Ambíguo',
    description: 'O contrato não especifica claramente o prazo de entrega do imóvel. Recomenda-se adicionar data exata.',
    severity: 'Médio',
  },
  {
    id: 2,
    type: 'info',
    title: 'Cláusula de Penalização Ausente',
    description: 'Considere adicionar cláusula de penalização em caso de atraso na entrega.',
    severity: 'Baixo',
  },
]

const CONTRACT_TEMPLATES = [
  { id: 1, name: 'Contrato Compra e Venda - Padrão', icon: '📄', type: 'Compra e Venda' },
  { id: 2, name: 'Contrato de Arrendamento Habitacional', icon: '🏠', type: 'Arrendamento' },
  { id: 3, name: 'Promessa de Compra e Venda (CPCV)', icon: '✍️', type: 'CPCV' },
  { id: 4, name: 'Procuração para Venda de Imóvel', icon: '📋', type: 'Procuração' },
  { id: 5, name: 'Acordo de Mediação Imobiliária', icon: '🤝', type: 'Mediação' },
  { id: 6, name: 'Contrato de Arrendamento Comercial', icon: '🏢', type: 'Comercial' },
]

export default function AssistenteJuridicoPage() {
  const [dragActive, setDragActive] = useState(false)
  const [selectedContract, setSelectedContract] = useState<number | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    // Handle file upload logic here
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-indigo-100/70 p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚖️ Assistente Jurídico</h1>
          <p className="text-gray-700">Revise contratos, gere minutas e acompanhe assinaturas com segurança e conformidade.</p>
        </div>

        {/* Upload Area */}
        <div
          className={`rounded-3xl bg-white/80 shadow-lg ring-1 ring-indigo-100/70 p-8 backdrop-blur-sm transition-all ${
            dragActive ? 'ring-4 ring-indigo-500 bg-indigo-50' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="border-2 border-dashed border-indigo-300 rounded-2xl p-12 text-center hover:border-indigo-500 transition-colors cursor-pointer">
            <Upload className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Faça Upload de Contratos</h3>
            <p className="text-gray-600 mb-4">Arraste arquivos aqui ou clique para selecionar</p>
            <p className="text-sm text-gray-500">PDF, DOCX, DOC até 10MB</p>
            <Button className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivo
            </Button>
          </div>
        </div>

        {/* Contracts List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Contratos Recentes</h2>
          {MOCK_CONTRACTS.map((contract) => (
            <div
              key={contract.id}
              className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-indigo-100/70 p-6 backdrop-blur-sm hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-indigo-100 rounded-2xl">
                    <FileText className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{contract.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {contract.type}
                      </span>
                      <span>•</span>
                      <span>{contract.size}</span>
                      <span>•</span>
                      <span>Enviado: {contract.uploadDate}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-600 mb-1">Cláusulas</p>
                        <p className="text-lg font-bold text-gray-900">{contract.clauses}</p>
                      </div>
                      <div className={`rounded-xl p-3 ${
                        contract.risks === 0 ? 'bg-green-50' : 'bg-orange-50'
                      }`}>
                        <p className="text-xs text-gray-600 mb-1">Riscos</p>
                        <p className={`text-lg font-bold ${
                          contract.risks === 0 ? 'text-green-700' : 'text-orange-700'
                        }`}>
                          {contract.risks}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-600 mb-1">Status</p>
                        <p className="text-xs font-semibold text-gray-900">{contract.status}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-600 mb-1">Revisado</p>
                        <p className="text-xs font-semibold text-gray-900">
                          {contract.reviewDate || 'Pendente'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedContract(selectedContract === contract.id ? null : contract.id)}
                  >
                    Ver Detalhes
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedContract === contract.id && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
                  {/* Compliance Checklist */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      Checklist de Conformidade Legal
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {COMPLIANCE_CHECKLIST.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-xl ${
                            item.status === 'complete' ? 'bg-green-50' :
                            item.status === 'warning' ? 'bg-yellow-50' : 'bg-gray-50'
                          }`}
                        >
                          {item.status === 'complete' && <CheckCircle className="w-5 h-5 text-green-600" />}
                          {item.status === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                          {item.status === 'pending' && <Clock className="w-5 h-5 text-gray-400" />}
                          <span className="text-sm font-medium text-gray-900">{item.item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alerts */}
                  {ALERTS.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        Alertas & Recomendações
                      </h4>
                      <div className="space-y-3">
                        {ALERTS.map((alert) => (
                          <div
                            key={alert.id}
                            className={`p-4 rounded-2xl ${
                              alert.type === 'warning' ? 'bg-orange-50' : 'bg-blue-50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {alert.type === 'warning' ? (
                                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                              ) : (
                                <Scale className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="font-semibold text-gray-900">{alert.title}</h5>
                                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    alert.severity === 'Médio' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {alert.severity}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{alert.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contract Templates */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-indigo-100/70 p-8 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Templates de Contratos Pré-Aprovados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONTRACT_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6 hover:from-indigo-100 hover:to-purple-100 transition-all cursor-pointer group"
              >
                <div className="text-4xl mb-3">{template.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.type}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Usar Template
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Signature Section */}
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Assinatura Digital</h2>
              <p className="text-indigo-100">Processo seguro de assinatura eletrónica com validade jurídica</p>
            </div>
            <Button className="bg-white text-indigo-600 hover:bg-indigo-50">
              <FileText className="w-5 h-5 mr-2" />
              Iniciar Assinatura
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">3</div>
              <div className="text-sm text-indigo-100">Contratos Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">12</div>
              <div className="text-sm text-indigo-100">Assinados Este Mês</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">100%</div>
              <div className="text-sm text-indigo-100">Taxa de Conformidade</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
