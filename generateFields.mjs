import fs from 'fs';
import path from 'path';

const rawData = `
N°: 001      Nome: Codproduto          Tamanho: 10
N°: 002      Nome: CodBarra            Tamanho: 20
N°: 003      Nome: Descricao           Tamanho: 25
N°: 004      Nome: Descricao           Tamanho: 25
N°: 005      Nome: DescReduzida        Tamanho: 15
N°: 006      Nome: DescReduzida        Tamanho: 15
N°: 007      Nome: Grupo               Tamanho: 20
N°: 008      Nome: Setor               Tamanho: 20
N°: 009      Nome: Marca               Tamanho: 20
N°: 010      Nome: Preco               Tamanho: 14
N°: 011      Nome: PrecoVista          Tamanho: 14
N°: 012      Nome: Unidade             Tamanho: 3 
N°: 013      Nome: Localizacao         Tamanho: 20
N°: 014      Nome: Aliquota            Tamanho: 3 
N°: 015      Nome: NomeEmpresa         Tamanho: 20
N°: 016      Nome: NomeEmpresa         Tamanho: 20
N°: 017      Nome: FoneEmpresa         Tamanho: 20
N°: 018      Nome: CustoMedio          Tamanho: 14
N°: 019      Nome: OutrasInf           Tamanho: 22
N°: 020      Nome: Data_Lote           Tamanho: 10
N°: 021      Nome: Lote                Tamanho: 15
N°: 022      Nome: Tbn_Codigo          Tamanho: 15
N°: 023      Nome: Tbn_Porcao          Tamanho: 70
N°: 024      Nome: Tbn_Calorias        Tamanho: 20
N°: 025      Nome: Tbn_Carboidratos    Tamanho: 20
N°: 026      Nome: Tbn_Proteina        Tamanho: 20
N°: 027      Nome: Tbn_GordTotal       Tamanho: 20
N°: 028      Nome: Tbn_GordSaturada    Tamanho: 20
N°: 029      Nome: Tbn_Colesterol      Tamanho: 20
N°: 030      Nome: Tbn_Fibra           Tamanho: 20
N°: 031      Nome: Tbn_Calcio          Tamanho: 20
N°: 032      Nome: Tbn_Ferro           Tamanho: 20
N°: 033      Nome: Tbn_Sodio           Tamanho: 20
N°: 034      Nome: Prod_Ingredientes   Tamanho: 25
N°: 035      Nome: CodFabrica          Tamanho: 20
N°: 036      Nome: Validade            Tamanho: 10
N°: 037      Nome: Numero              Tamanho: 8 
N°: 038      Nome: DataHoraLancto      Tamanho: 20
N°: 039      Nome: DataHoraSaida       Tamanho: 20
N°: 040      Nome: TipoLancto          Tamanho: 15
N°: 041      Nome: Situacao            Tamanho: 10
N°: 042      Nome: NomeCliente         Tamanho: 15
N°: 043      Nome: NomeCliente         Tamanho: 15
N°: 044      Nome: EnderecoCliente     Tamanho: 15
N°: 045      Nome: EnderecoCliente     Tamanho: 15
N°: 046      Nome: NumeroCliente       Tamanho: 10
N°: 047      Nome: CidadeCliente       Tamanho: 15
N°: 048      Nome: CidadeCliente       Tamanho: 15
N°: 049      Nome: CodigoCliente       Tamanho: 8 
N°: 050      Nome: Rota                Tamanho: 20
N°: 051      Nome: Qtde                Tamanho: 10
N°: 052      Nome: DataCompra          Tamanho: 10
N°: 053      Nome: DocCompra           Tamanho: 10
N°: 054      Nome: NomeOferta          Tamanho: 20
N°: 055      Nome: ProdDataCadastro    Tamanho: 10
N°: 056      Nome: ProdDescontoMax     Tamanho: 10
N°: 057      Nome: SubGrupo            Tamanho: 20
N°: 058      Nome: NumeroItem          Tamanho: 10
N°: 059      Nome: BairroCliente       Tamanho: 15
N°: 060      Nome: BairroCliente       Tamanho: 15
N°: 061      Nome: NumeroPedido        Tamanho: 10
N°: 062      Nome: DescricaoCompleta   Tamanho: 18
N°: 063      Nome: DescricaoCompleta   Tamanho: 18
N°: 064      Nome: DescricaoCompleta   Tamanho: 18
N°: 065      Nome: DataGeracao         Tamanho: 10
N°: 066      Nome: Sexo                Tamanho: 6 
N°: 067      Nome: EmbalagemUN         Tamanho: 30
N°: 068      Nome: CodEmbalagemUN      Tamanho: 8 
N°: 069      Nome: TaraEmbalagemUN     Tamanho: 10
N°: 070      Nome: QtdeEmbalagemUN     Tamanho: 10
N°: 071      Nome: EmbalagemCX         Tamanho: 30
N°: 072      Nome: CodEmbalagemCX      Tamanho: 8 
N°: 073      Nome: TaraEmbalagemCX     Tamanho: 10
N°: 074      Nome: QtdeEmbalagemCX     Tamanho: 10
N°: 075      Nome: Obs1                Tamanho: 22
N°: 076      Nome: Obs1                Tamanho: 18
N°: 077      Nome: Obs2                Tamanho: 22
N°: 078      Nome: Obs2                Tamanho: 18
N°: 079      Nome: EnderecoEmpresa     Tamanho: 22
N°: 080      Nome: EnderecoEmpresa     Tamanho: 18
N°: 081      Nome: EmailEmpresa        Tamanho: 30
N°: 082      Nome: SiteEmpresa         Tamanho: 30
N°: 083      Nome: CEPEmpresa          Tamanho: 10
N°: 084      Nome: BairroEmpresa       Tamanho: 30
N°: 085      Nome: CidadeUFEmpresa     Tamanho: 30
N°: 086      Nome: Peso                Tamanho: 10
N°: 087      Nome: Total               Tamanho: 10
N°: 088      Nome: DataValidade        Tamanho: 10
N°: 089      Nome: CodBarraBalanca     Tamanho: 20
N°: 090      Nome: AcucarTotal         Tamanho: 11
N°: 091      Nome: AcucarAdicionado    Tamanho: 11
N°: 092      Nome: QtdePorcaoEmbalagem Tamanho: 10
N°: 093      Nome: AltoEmAcucar        Tamanho: 1 
N°: 094      Nome: AltoEmSodio         Tamanho: 1 
N°: 095      Nome: AltoEmGorduraSatura Tamanho: 1 
N°: 096      Nome: MedidaCaseira       Tamanho: 30
N°: 097      Nome: UnidadePorcao       Tamanho: 1 
N°: 098      Nome: TamanhoPorcao       Tamanho: 10
`;

const lines = rawData.split('\n').filter(l => l.trim().length > 0);
const fields = [];

const regex = /N°:\s*(\d{3})\s*Nome:\s*(\w+)\s*Tamanho:\s*(\d+)/;

lines.forEach(line => {
    const match = line.match(regex);
    if (match) {
        fields.push({
            id: match[1],
            nome: match[2],
            tamanho: parseInt(match[3], 10),
            tag: `<CAMPO>CMP${match[1]}</CAMPO>`,
            fastReportTag: `[frxDBDsEtiqueta."${match[2]}"]`
        });
    }
});

// Remove exact duplicates since some fields are listed multiple times with same or different sizes.
// We will keep a unique list by ID.
const uniqueFields = [];
const seenIds = new Set();
for (const f of fields) {
    if (!seenIds.has(f.id)) {
        seenIds.add(f.id);
        uniqueFields.push(f);
    }
}

fs.writeFileSync(path.join(process.cwd(), 'src', 'components', 'labelFields.json'), JSON.stringify(uniqueFields, null, 2));
console.log(`Saved ${uniqueFields.length} unique fields to labelFields.json`);
