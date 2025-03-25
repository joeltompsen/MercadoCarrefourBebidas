const fetch = require('node-fetch').default;
const fs = require('fs');

// URL da API GraphQL
const baseUrl = 'https://mercado.carrefour.com.br/api/graphql';

// Variável constante para regionId - HIPER PIRACICABA
const regionId = "v2.16805FBD22EC494F5D2BD799FE9F1FB7";

function buildUrl(params) {
  const queryParams = new URLSearchParams(params).toString();
  return `${baseUrl}?${queryParams}`;
}

async function main() {
  let first = 60;  // Quantidade de Node de Bebidas
  let after = "0";  // Inicializa o after como "0"
  let allProducts = [];  // Array para armazenar todos os produtos

  const variables = {
    isPharmacy: false,
    first: first,  
    after: after,  
    sort: "score_desc",
    term: "",
    selectedFacets: [
      { key: "category-1", value: "bebidas" },
      { key: "category-1", value: "4599" },
      { key: "channel", value: `{"salesChannel":2,"regionId":"${regionId}"}` },
      { key: "locale", value: "pt-BR" },
      { key: "region-id", value: regionId }
    ]
  };

  const queryParams = {
    operationName: "ProductsQuery",
    variables: JSON.stringify(variables)
  };
  const url = buildUrl(queryParams);

  try {
    // Realiza a requisição inicial para pegar o totalCount
    const response = await fetch(url);
    const data = await response.json();
    const totalCount = data.data.search.products.pageInfo.totalCount;
    console.log("Total Count:", totalCount);
    // Loop de 'first' e 'after'
    for (let i = 0; i < totalCount; i += first) {
      // Atualiza o valor de 'after' para o índice do último produto da página anterior
      after = i.toString();

      // Atualiza o valor de 'first' no corpo da requisição
      variables.first = first;
      variables.after = after;

      // Cria a URL da requisição com os novos parâmetros
      const queryParams = {
        operationName: "ProductsQuery",
        variables: JSON.stringify(variables)
      };
      const url = buildUrl(queryParams);

      // Faz a requisição para a API
      const response = await fetch(url);
      const data = await response.json();

      // Coleta os produtos da resposta e adiciona ao array
      const products = data.data.search.products.edges;

      let ignoreUseless= true;
      if(ignoreUseless){
        products.forEach(edge => {
          edge.node.properties = null;
          edge.node.properties = null;
          edge.node.isVariantOf = null;
          edge.node.breadcrumbList = null;
          edge.node.sellers = null;
          edge.node.productClusters = null;
        });
      }
      allProducts = allProducts.concat(products);
      console.log(`Requisição ${i / first + 1}: Produtos encontrados nesta requisição:`, products.length);
    }
    fs.writeFileSync('output.json', JSON.stringify(allProducts, null, 2), 'utf-8');
    console.log('Arquivo output.json salvo com sucesso!');
  } catch (error){
    console.error('Erro ao fazer a requisição:', error);
  }
}

main();
