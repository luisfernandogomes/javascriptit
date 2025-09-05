// Elementos HTML
const $list = document.getElementById('list');
const $error = document.getElementById('error');
const $spinner = document.getElementById('spinner');

const form = document.getElementById("postForm");
const output = document.getElementById("output");

const API = 'https://dummyjson.com/products'; // API pública de testes

function showSpinner(show) {
    $spinner.style.display = show ? 'inline' : 'none';
    $spinner.textContent = "Salvo"
}

function showError(msg) {
    $error.textContent = msg || '';
}


// Função para exibir os posts
function renderPosts(posts) {
    // InnerHTML para modificar o elemento
    // .map transforma o JSON em HTML
    // for carro in carros é igual a posts.map(p=>
    $list.innerHTML = posts.products.map(produto => `
    <div class="card">
        <div class="row">
          <strong>Titulo -${produto.title}</strong>
          <strong>Categoria - ${produto.category}</strong>
          <p>Preço - ${produto.price}</p>
          <p>Avaliação - ${produto.rating}</p>
          <p>Estoque - ${produto.stock} </p>
          <div class = "img">
               <img src="${produto.thumbnail}" alt="img">
          </div>
        </div>
    </div>
  `).join('');
}
// função assincrona que carrega os posts
async function getProducts() {
    showError('');
    try {
        const response = await fetch(`${API}`);
        // verifica se ocorreu algum erro na API
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);}
        // aguarda o retorno da API
        const data = await response.json();
        // chama a função para exibir o responseultado
        renderPosts(data);
    } catch (err) {
        showError(err.message ?? 'Falha ao buscar dados');
    }}