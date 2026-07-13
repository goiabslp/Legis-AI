"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vectorDimensions = 384;
function generateEmbedding(text) {
    const embedding = new Array(vectorDimensions).fill(0);
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
    const words = cleanText.split(/\s+/).filter((w) => w.length > 2);
    for (let i = 0; i < vectorDimensions; i++) {
        let val = 0;
        words.forEach((word, wordIdx) => {
            for (let charIdx = 0; charIdx < word.length; charIdx++) {
                val += Math.sin(word.charCodeAt(charIdx) * (i + 1) + wordIdx);
            }
        });
        embedding[i] = Math.tanh(val / (words.length || 1));
    }
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map((val) => val / magnitude) : embedding;
}
const rootPath = path.resolve(__dirname, '../../Conhecimento');
const storePath = path.join(rootPath, 'vector-store.json');
const constitutionChunks = [
    {
        artigo: "Art. 5",
        texto: "Art. 5º Todos são iguais perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade, nos termos seguintes: I - homens e mulheres são iguais em direitos e obrigações, nos termos desta Constituição; II - ninguém será obrigado a fazer ou deixar de fazer alguma coisa senão em virtude de lei.",
        assunto: ["Direitos Fundamentais", "Igualdade"],
        palavras_chave: ["iguais", "lei", "liberdade", "segurança", "propriedade"]
    },
    {
        artigo: "Art. 37",
        texto: "Art. 37. A administração pública direta e indireta de qualquer dos Poderes da União, dos Estados, do Distrito Federal e dos Municipípios obedecerá aos princípios de legalidade, impessoalidade, moralidade, publicidade e eficiência e, também, ao seguinte: I - os cargos, empregos e funções públicas são acessíveis aos brasileiros que preencham os requisitos estabelecidos em lei, assim como aos estrangeiros, na forma da lei.",
        assunto: ["Administração Pública", "Princípios"],
        palavras_chave: ["legalidade", "impessoalidade", "moralidade", "publicidade", "eficiência"]
    },
    {
        artigo: "Art. 70",
        texto: "Art. 70. A fiscalização contábil, financeira, orçamentária, operacional e patrimonial da União e das entidades da administração direta e indireta, quanto à legalidade, legitimidade, economicidade, aplicação das subvenções e renúncia de receitas, será exercida pelo Congresso Nacional, mediante controle externo, e pelo sistema de controle interno de cada Poder.",
        assunto: ["Fiscalização", "Controle Interno"],
        palavras_chave: ["fiscalização", "financeira", "orçamentária", "controle", "receitas"]
    },
    {
        artigo: "Art. 144",
        texto: "Art. 144. A segurança pública, dever do Estado, direito e responsabilidade de todos, é exercida para a preservação da ordem pública e da incolumidade das pessoas e do patrimônio, através dos seguintes órgãos: I - polícia federal; II - polícia rodoviária federal; III - polícia ferroviária federal; IV - polícias civis; V - polícias militares e corpos de bombeiros militares.",
        assunto: ["Segurança Pública", "Ordem Pública"],
        palavras_chave: ["segurança", "ordem", "preservação", "polícia", "patrimônio"]
    },
    {
        artigo: "Art. 196",
        texto: "Art. 196. A saúde é direito de todos e dever do Estado, garantido mediante políticas sociais e econômicas que visem à redução do risco de doença e de outros agravos e ao acesso universal e igualitário às ações e serviços para sua promoção, proteção e recuperação.",
        assunto: ["Saúde Pública", "Direito à Saúde"],
        palavras_chave: ["saúde", "direito", "estado", "universal", "proteção"]
    },
    {
        artigo: "Art. 205",
        texto: "Art. 205. A educação, direito de todos e dever do Estado e da família, será promovida e incentivada com a colaboração da sociedade, visando ao pleno desenvolvimento da pessoa, seu preparo para o exercício da cidadania e sua qualificação para o trabalho.",
        assunto: ["Educação", "Cidadania"],
        palavras_chave: ["educação", "direito", "estado", "desvolvimento", "cidadania"]
    }
];
async function run() {
    if (!fs.existsSync(rootPath)) {
        fs.mkdirSync(rootPath, { recursive: true });
    }
    const constPath = path.join(rootPath, 'Constituição');
    if (!fs.existsSync(constPath)) {
        fs.mkdirSync(constPath, { recursive: true });
    }
    fs.writeFileSync(path.join(constPath, 'Constituicao_Federal_1988_Principais_Artigos.txt'), constitutionChunks.map(c => `=== ${c.artigo} ===\n${c.texto}`).join('\n\n'), 'utf8');
    const currentStore = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, 'utf8')) : [];
    const filteredStore = currentStore.filter((c) => c.titulo !== "Constituicao Federal 1988");
    const newRecords = constitutionChunks.map((c, index) => {
        const embedding = generateEmbedding(c.texto);
        return {
            id: `constituicao-cf88-chunk-${index}`,
            titulo: "Constituicao Federal 1988",
            artigo: c.artigo,
            assunto: c.assunto,
            palavras_chave: c.palavras_chave,
            texto: c.texto,
            embedding: embedding,
            categoria: "Constituição"
        };
    });
    const updatedStore = [...filteredStore, ...newRecords];
    fs.writeFileSync(storePath, JSON.stringify(updatedStore, null, 2), 'utf8');
    console.log(`Sucesso: indexados ${newRecords.length} artigos da Constituição Federal 1988 no banco vetorial local.`);
}
run();
//# sourceMappingURL=populate-constitution.js.map