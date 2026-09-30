import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_po9hvJqFPri_AI4uw73AiYb5BbspNjs",
  authDomain: "thomas-teste-d7a3d.firebaseapp.com",
  projectId: "thomas-teste-d7a3d",
  storageBucket: "thomas-teste-d7a3d.firebasestorage.app",
  messagingSenderId: "280109049625",
  appId: "1:280109049625:web:487874357d0173797d0788"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DADOS = [
{lic:1015,cliente:"ACAI EXPRESSO",versao:"04.09.02.02",pdv:2,tef:2,valide:"2026-09-10"},
{lic:2162,cliente:"AGRO PET TANGARA",versao:"04.09.02.02",pdv:2,tef:2,valide:"2026-09-10"},
{lic:1743,cliente:"BALNEARIO RIO VERDE",versao:"04.12.00.00",pdv:2,tef:2,valide:"2026-09-10"},
{lic:1594,cliente:"BOTECO DO BODEGA (TGA)",versao:"04.11.02.00",pdv:3,tef:3,valide:"2026-09-10"},
{lic:2693,cliente:"BPA DISTRIBUIDORA E CONVENIENCIA",versao:"04.11.04.00",pdv:1,tef:1,valide:"2026-09-23"},
{lic:2668,cliente:"BRAGA VEICULOS",versao:"04.11.04.00",pdv:1,tef:1,valide:"2026-09-18"},
{lic:2602,cliente:"BRAVO'S COUNTRY",versao:"04.08.01.00",pdv:1,tef:1,valide:"2026-09-21"},
{lic:2396,cliente:"CAFE & RESENHA PADARIA",versao:"04.09.05.05",pdv:2,tef:2,valide:"2026-09-10"},
{lic:2584,cliente:"CNP GRILL ( CHURRASCARIA CASTOR )",versao:"04.09.02.02",pdv:2,tef:2,valide:"2026-09-10"},
{lic:2158,cliente:"CONVENIENCIA ROTA 242",versao:"04.11.02.00",pdv:1,tef:1,valide:"2026-09-10"},
{lic:2622,cliente:"CUPIM BRASIL  (TGA)",versao:"04.12.00.00",pdv:3,tef:3,valide:"2026-09-10"},
{lic:2542,cliente:"DELICIAS DA MARY",versao:"04.07.01.01",pdv:1,tef:1,valide:"2026-09-21"},
{lic:2612,cliente:"DELLAS BEAUTY",versao:"04.09.01.02",pdv:1,tef:1,valide:"2026-09-15"},
{lic:2529,cliente:"DISTRIBUIDORA TERRA SECA",versao:"04.11.05.00",pdv:2,tef:2,valide:"2026-09-21"},
{lic:429,cliente:"DOD'S SORVETES",versao:"04.09.02.02",pdv:3,tef:3,valide:"2026-09-10"},
{lic:861,cliente:"DOM JOSE",versao:"04.07.01.01",pdv:3,tef:3,valide:"2026-09-15"},
{lic:2464,cliente:"DUPLAST VARIEDADES LTDA",versao:"04.11.02.00",pdv:2,tef:2,valide:"2026-09-10"},
{lic:2659,cliente:"EDU BOLOS PAES E DOCES  (NOVO)",versao:"04.11.00.00",pdv:4,tef:4,valide:"2026-09-08"},
{lic:2579,cliente:"EMPORIO MERLO",versao:"04.11.01.00",pdv:2,tef:2,valide:"2026-09-23"},
{lic:2696,cliente:"FOOD PIZZA DELIVERY TGA",versao:"04.12.00.00",pdv:1,tef:1,valide:"2026-09-28"},
{lic:2637,cliente:"GIRASSOL PIZZARIA LRV",versao:"04.10.01.01",pdv:1,tef:1,valide:"2026-09-08"},
{lic:2479,cliente:"GOYANUS RESTAURANTE",versao:"04.06.02.00",pdv:4,tef:4,valide:"2026-09-10"},
{lic:2700,cliente:"H M PAO & CIA",versao:"04.11.04.00",pdv:1,tef:1,valide:"2026-09-01"},
{lic:2591,cliente:"HOME CORTINAS",versao:"04.11.01.00",pdv:1,tef:1,valide:"2026-09-10"},
{lic:620,cliente:"HOT CHEDDAR'S",versao:"04.11.02.00",pdv:7,tef:7,valide:"2026-09-10"},
{lic:2387,cliente:"JOSUEL GAS",versao:"04.10.01.01",pdv:3,tef:3,valide:"2026-09-21"},
{lic:2544,cliente:"LA BELLA PIZZARIA",versao:"04.11.02.00",pdv:4,tef:4,valide:"2026-12-28"},
{lic:2675,cliente:"LOJA COIMBRA",versao:"04.11.00.00",pdv:1,tef:1,valide:"2026-09-08"},
{lic:402,cliente:"LOJA MODELO",versao:"04.11.05.00",pdv:1,tef:1,valide:"2026-09-10"},
{lic:2604,cliente:"MAGIA DO 7",versao:"04.11.04.00",pdv:1,tef:1,valide:"2026-09-21"},
{lic:2403,cliente:"MARMITARIA VITORIA",versao:"04.11.04.00",pdv:5,tef:5,valide:"2026-09-21"},
{lic:1623,cliente:"MARTCHELLO PIZZARIA",versao:"04.04.00.00",pdv:3,tef:3,valide:"2026-09-10"},
{lic:2723,cliente:"MARTCHELLO PIZZARIA  (NOVO)",versao:null,pdv:1,tef:3,valide:"2026-10-10"},
{lic:2442,cliente:"MERCADINHO SÃO JOSÉ - FILIAL",versao:"04.06.02.00",pdv:1,tef:1,valide:"2026-09-21"},
{lic:2507,cliente:"MERCADO E CONVENIENCIA SILVERIO",versao:"04.11.00.00",pdv:1,tef:1,valide:"2026-09-21"},
{lic:2433,cliente:"MERCADO E CONVENIÊNCIA SILVÉRIO",versao:"04.11.03.00",pdv:1,tef:1,valide:"2026-09-21"},
{lic:2400,cliente:"MERCADO POPULAR",versao:"04.11.04.00",pdv:2,tef:2,valide:"2026-09-10"},
{lic:2369,cliente:"NUTRI PÃO",versao:"04.11.02.00",pdv:1,tef:1,valide:"2026-09-10"},
{lic:1203,cliente:"PALATARE",versao:"04.09.02.02",pdv:4,tef:4,valide:"2026-09-10"},
{lic:2656,cliente:"PALMEIRAS GAS",versao:"04.12.00.00",pdv:2,tef:2,valide:"2026-09-14"},
{lic:173,cliente:"PANIFICADORA CITY PAO",versao:"04.11.03.00",pdv:1,tef:1,valide:"2026-09-10"},
{lic:2364,cliente:"PANIFICADORA TRIGO BOM (VILA ALTA NOVA)",versao:"04.04.00.01",pdv:1,tef:1,valide:"2026-09-10"},
{lic:2111,cliente:"PIZZARIA GIRASSOL",versao:"04.11.04.00",pdv:1,tef:1,valide:"2026-09-15"},
{lic:2652,cliente:"PIZZARIA GIRASSOL SPZ (NOVA)",versao:"04.11.00.00",pdv:4,tef:4,valide:"2026-09-08"},
{lic:2568,cliente:"POR DO SOL PESQUE & CIA",versao:"04.09.02.02",pdv:1,tef:1,valide:"2026-09-15"},
{lic:2697,cliente:"REI DA CERVEJA",versao:"04.11.04.00",pdv:1,tef:3,valide:"2026-09-10"},
{lic:2589,cliente:"RODRIGU'S GRILL DELIVERY (NOVO)",versao:"04.07.00.00",pdv:2,tef:2,valide:"2026-09-21"},
{lic:2681,cliente:"SALTO DAS NUVENS EVENTOS",versao:"04.12.01.00",pdv:10,tef:10,valide:"2026-09-10"},
{lic:2346,cliente:"SALVE MAKE",versao:"04.03.02.00",pdv:2,tef:2,valide:"2026-09-15"},
{lic:2580,cliente:"SORVETERIA DOCE MAGIA (NOVO)",versao:"04.07.01.01",pdv:2,tef:2,valide:"2026-09-21"},
{lic:2556,cliente:"TRIGO BOM PANIFICADORA  (AV BRASIL)",versao:"04.11.02.00",pdv:2,tef:2,valide:"2026-09-10"},
{lic:2655,cliente:"VASELI COMERCIO DE BEBIDAS E GAS",versao:"04.12.00.00",pdv:2,tef:2,valide:"2026-09-14"},
{lic:2654,cliente:"ZAAZ GAS E BEBIDAS",versao:"04.12.00.00",pdv:3,tef:3,valide:"2026-09-14"},
{lic:1502,cliente:"ZUMA COZINHA ORIENTAL",versao:"04.11.04.00",pdv:4,tef:4,valide:"2026-09-10"}
];

async function updateTags() {
  const docRef = doc(db, 'gestao_sistemas', 'controle_versoes_clientes');
  console.log("Fetching doc...");
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    console.error("Doc não existe.");
    process.exit(1);
  }
  
  const data = snap.data();
  let updatedCount = 0;
  
  const licenseMap = new Set(DADOS.map(d => String(d.lic)));
  
  const newClientes = data.clientes.map(c => {
    const isTarget = licenseMap.has(String(c.num)) || licenseMap.has(String(c.id));
    if (isTarget) {
      if (c.etiqueta !== "Stor Smart TEF") {
        updatedCount++;
        return {
          ...c,
          etiqueta: "Stor Smart TEF",
          corRow: "teal"
        };
      }
    }
    return c;
  });
  
  if (updatedCount > 0) {
    console.log(`Atualizando ${updatedCount} clientes no Firestore...`);
    await setDoc(docRef, { clientes: newClientes }, { merge: true });
    console.log("Pronto!");
  } else {
    console.log("Nenhum cliente precisou ser atualizado.");
  }
  process.exit(0);
}

updateTags().catch(err => {
  console.error(err);
  process.exit(1);
});
