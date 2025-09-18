// --- utilitários ---
const API = 'https://dummyjson.com/products';
const $list = document.getElementById('list');
const $error = document.getElementById('error');
const $spinner = document.getElementById('spinner');
const output = document.getElementById('output');
const form = document.getElementById('postForm');

// escape simples para evitar injeção via innerHTML
function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// formata preço para pt-BR
const fmtPrice = (value) => {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  } catch {
    return value;
  }
};

// converte rating para estrelas (acessível)
function stars(rating = 0) {
  const max = 5;
  const full = Math.round(rating); // arredonda pra visual simples
  const filled = '★'.repeat(full);
  const empty = '☆'.repeat(max - full);
  const label = `Avaliação ${rating} de ${max}`;
  return `<span aria-label="${label}" title="${label}">${filled}${empty}</span>`;
}

// --- UI helpers ---
function showSpinner(show, text = 'Carregando…') {
  $spinner.style.display = show ? 'inline-block' : 'none';
  $spinner.textContent = show ? text : '';
  // acessibilidade: indica que a página está ocupada
  document.body.setAttribute('aria-busy', show ? 'true' : 'false');
}

function showError(msg = '') {
  $error.textContent = msg;
  $error.style.display = msg ? 'block' : 'none';
}

// cria skeletons (feedback imediato enquanto carrega)
function showSkeletons(count = 6) {
  $list.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.className = 'card skeleton';
    div.innerHTML = `
      <div style="height:18px; width:70%; background:rgba(255,255,255,0.06); margin-bottom:8px; border-radius:4px;"></div>
      <div style="height:12px; width:45%; background:rgba(255,255,255,0.04); margin-bottom:6px; border-radius:4px;"></div>
      <div style="height:12px; width:30%; background:rgba(255,255,255,0.04); margin-top:auto; border-radius:4px;"></div>
    `;
    frag.appendChild(div);
  }
  $list.appendChild(frag);
}

// --- Renderização segura e performática ---
function renderPosts(posts) {
  $list.innerHTML = ''; // limpa
  if (!posts || !Array.isArray(posts.products) || posts.products.length === 0) {
    $list.innerHTML = '<p>Nenhum produto encontrado.</p>';
    return;
  }

  const frag = document.createDocumentFragment();

  posts.products.forEach(produto => {
    // construir card usando DOM APIs para reduzir risco de XSS
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('tabindex', '0'); // focável via teclado
    card.setAttribute('role', 'article');
    card.setAttribute('aria-label', `${produto.title} - ${produto.category}`);

    // innerHTML controlado com escapeHtml para textos - imagens e atributos são setados explicitamente
    const title = escapeHtml(produto.title);
    const category = escapeHtml(produto.category);
    const price = fmtPrice(produto.price);
    const rating = Number(produto.rating).toFixed(2);
    const stock = Number(produto.stock);

    const img = document.createElement('img');
    img.alt = `${title} imagem`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.style.maxWidth = '70%';
    img.style.display = 'block';
    img.style.margin = '8px auto 0';
    img.onerror = () => {
      img.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="100%" height="100%" fill="#ddd"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="12">sem imagem</text></svg>`
      );
    };
    img.src = produto.thumbnail || ''; // se vazio, onerror tratará

    // monta conteúdo textual
    const top = document.createElement('div');
    top.innerHTML = `<h4>${title}</h4>
      <h5>Categoria - ${category}</h5>
      <p>Preço - <strong>${price}</strong></p>
      <p>Avaliação - ${stars(rating)} <span style="font-size:12px; color:rgba(0,0,0,0.6)"> (${rating})</span></p>
      <p>Estoque - ${stock}</p>`;

    // ações (botões) - sem modificar o HTML base, criamos botões via JS
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.marginTop = '8px';

    const btnDetails = document.createElement('button');
    btnDetails.className = 'btn-details';
    btnDetails.type = 'button';
    btnDetails.textContent = 'Ver detalhes';
    btnDetails.setAttribute('data-id', produto.id);
    btnDetails.setAttribute('aria-label', `Ver detalhes de ${title}`);

    const btnAdd = document.createElement('button');
    btnAdd.className = 'btn-add';
    btnAdd.type = 'button';
    btnAdd.textContent = 'Adicionar';
    btnAdd.setAttribute('data-id', produto.id);
    btnAdd.setAttribute('aria-label', `Adicionar ${title} ao carrinho`);

    // estilo inline simples para manter sem tocar CSS (você pode mover para style.css depois)
    [btnDetails, btnAdd].forEach(b => {
      b.style.padding = '6px 8px';
      b.style.borderRadius = '6px';
      b.style.border = '1px solid rgba(0,0,0,0.08)';
      b.style.background = 'rgba(255,255,255,0.9)';
      b.style.cursor = 'pointer';
    });

    actions.appendChild(btnDetails);
    actions.appendChild(btnAdd);

    // compor card
    card.appendChild(top);
    card.appendChild(img);
    card.appendChild(actions);

    // tecla Enter abre detalhes (acessibilidade)
    card.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        // simula clique no Ver detalhes
        btnDetails.click();
      }
    });

    frag.appendChild(card);
  });

  $list.appendChild(frag);
}

// --- Event delegation para ações nos cards ---
$list.addEventListener('click', (ev) => {
  const btn = ev.target.closest('button');
  if (!btn) return;

  const id = btn.getAttribute('data-id');
  if (btn.classList.contains('btn-add')) {
    // ação: adicionar ao carrinho (exemplo simples)
    showSpinner(true, 'Adicionando…');
    setTimeout(() => {
      showSpinner(false);
      output && (output.textContent = `Produto ${id} adicionado ao carrinho.`);
    }, 700);
  }

  if (btn.classList.contains('btn-details')) {
    // ação: mostrar detalhes no output (pode ser substituído por modal)
    output && (output.textContent = `Abrindo detalhes do produto ${id}...`);
    // se quiser navegar pra outra página: window.location.href = `/produto.html?id=${id}`
  }
});

// --- Busca / filtro simples (se você quiser usar o form já existente) ---
if (form) {
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const q = (form.querySelector('input[name="q"]')?.value || '').trim().toLowerCase();
    // se não tiver dados locais, recarrega tudo
    if (!q) {
      getProducts();
      return;
    }
    // busca local nos cards existentes
    const cards = Array.from($list.children);
    const matches = cards.filter(card => card.textContent.toLowerCase().includes(q));
    // esconder todos e mostrar só matches
    cards.forEach(c => c.style.display = 'none');
    matches.forEach(m => m.style.display = '');
    if (matches.length === 0) showError('Nenhum produto corresponde à busca.');
    else showError('');
  });
}

// --- fetch com skeleton e tratamento robusto ---
async function getProducts() {
  showError('');
  showSkeletons(6);
  showSpinner(true, 'Carregando produtos…');

  try {
    const response = await fetch(API);
    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
    const data = await response.json();
    renderPosts(data);
  } catch (err) {
    showError(err.message || 'Falha ao buscar dados');
    $list.innerHTML = ''; // limpa possíveis skeletons
  } finally {
    showSpinner(false);
  }
}

// chamada inicial já existia no seu HTML: <script> getProducts()</script>
// mas caso prefira chamar por JS:
getProducts();
