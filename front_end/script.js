// =========================================================================
// CONFIGURAÇÃO DA API
// =========================================================================
// Altere a porta abaixo (ex: 3000, 8080, 5000) para a mesma porta do seu backend!
const API_URL = "http://127.0.0.1:5000";
// =========================================================================
// FUNÇÕES AUXILIARES DE INTERFACE E LOG
// =========================================================================

// Atalho para buscar elementos HTML pelo ID
function el(id) {
  return document.getElementById(id);
}

// Exibe mensagens de sucesso ou erro no topo da tela
function mostrarMensagem(texto, erro = false) {
  const m = el("mensagem");
  m.textContent = texto;
  m.className = erro ? "erro" : "";
}

// Registra cada requisição HTTP no painel de Log na parte inferior da página
function registrarLog(metodo, url, corpo, status, resposta) {
  const linha = document.createElement("div");
  const classe = status < 400 ? "ok" : "falha";
  const enviado = corpo !== undefined ? " " + JSON.stringify(corpo) : "";
  const recebido = resposta ? " → " + JSON.stringify(resposta) : "";
  
  linha.innerHTML = `<span class="${classe}">${status}</span> <b></b><span></span>`;
  linha.querySelector("b").textContent = `${metodo} ${url}`;
  linha.querySelector("span:last-child").textContent = enviado + recebido;
  el("log").prepend(linha);
}

// =========================================================================
// COMUNICAÇÃO CENTRAL COM O SERVIDOR (BACKEND)
// =========================================================================

// Função única que fala com o servidor. Todo o front passa por aqui.
async function api(metodo, rota, corpo, registrar = true) {
  const urlCompleta = API_URL + rota;
  const opcoes = { method: metodo, headers: {} };

  if (corpo !== undefined) {
    opcoes.headers["Content-Type"] = "application/json";
    opcoes.body = JSON.stringify(corpo);
  }

  try {
    const resp = await fetch(urlCompleta, opcoes);

    // Lê a resposta como texto primeiro para evitar erro caso o corpo venha vazio
    const texto = await resp.text();
    let dados = null;
    try {
      dados = texto ? JSON.parse(texto) : null;
    } catch {
      dados = { erro: `Resposta inválida do servidor (Status ${resp.status})` };
    }

    if (registrar) registrarLog(metodo, rota, corpo, resp.status, dados);

    if (!resp.ok) {
      mostrarMensagem(dados?.erro || `Erro HTTP ${resp.status}`, true);
    } else {
      mostrarMensagem("");
    }

    return { ok: resp.ok, dados };
  } catch (erroRede) {
    // Captura falhas quando o servidor backend está desligado ou bloqueado por CORS
    const msg = "Não foi possível conectar ao backend. Verifique se o servidor está rodando.";
    if (registrar) registrarLog(metodo, rota, corpo, 0, { erro: msg });
    mostrarMensagem(msg, true);
    return { ok: false, dados: null };
  }
}

// =========================================================================
// CARREGAMENTO E RENDERIZAÇÃO NA TELA
// =========================================================================

async function carregar() {
  const info = await api("GET", "/info", undefined, false);
  
  // Se o servidor não responder, avisa no cabeçalho e interrompe o carregamento
  if (!info.ok || !info.dados) {
    el("backend").textContent = "Offline (verifique o servidor)";
    return;
  }

  el("backend").textContent =
    `Donos: ${info.dados.donos} | Pets: ${info.dados.pets}`;

  const respDonos = await api("GET", "/donos", undefined, false);
  const respPets = await api("GET", "/pets", undefined, false);

  const donos = respDonos.dados || [];
  const pets = respPets.dados || [];

  desenharDonos(donos, pets);
  desenharPets(donos, pets);
}

function desenharDonos(donos, pets) {
  const ul = el("lista-donos");
  ul.innerHTML = "";
  
  if (donos.length === 0) {
    ul.innerHTML = '<li class="vazio">Nenhum dono cadastrado</li>';
  }
  
  for (const d of donos) {
    const qtd = pets.filter(p => p.dono_id === d.id).length;
    const li = document.createElement("li");
    li.innerHTML = `<div><b></b><small></small></div><div class="acoes"></div>`;
    li.querySelector("b").textContent = `#${d.id} ${d.nome}`;
    li.querySelector("small").textContent = `${d.telefone || "sem telefone"} · ${qtd} pet(s)`;
    
    const acoes = li.querySelector(".acoes");
    acoes.append(
      botao("Editar", "sec", () => editarDono(d)),
      botao("Remover", "perigo", () => removerDono(d.id))
    );
    ul.append(li);
  }
}

function desenharPets(donos, pets) {
  const nomes = Object.fromEntries(donos.map(d => [d.id, d.nome]));

  // Atualiza o <select> de donos no formulário de pets
  const select = el("pet-dono");
  const escolhido = select.value;
  select.innerHTML = "";
  for (const d of donos) {
    const op = document.createElement("option");
    op.value = d.id;
    op.textContent = d.nome;
    select.append(op);
  }
  if (escolhido) select.value = escolhido;

  const ul = el("lista-pets");
  ul.innerHTML = "";
  
  if (pets.length === 0) {
    ul.innerHTML = '<li class="vazio">Nenhum pet cadastrado</li>';
  }
  
  for (const p of pets) {
    const li = document.createElement("li");
    li.innerHTML = `<div><b></b><small></small></div><div class="acoes"></div>`;
    li.querySelector("b").textContent = `#${p.id} ${p.nome} (${p.especie})`;
    li.querySelector("small").textContent = `Dono: ${nomes[p.dono_id] || "Desconhecido"} (id ${p.dono_id})`;
    
    const acoes = li.querySelector(".acoes");
    acoes.append(
      botao("Editar", "sec", () => editarPet(p)),
      botao("Remover", "perigo", () => removerPet(p.id))
    );
    ul.append(li);
  }
}

function botao(texto, classe, aoClicar) {
  const b = document.createElement("button");
  b.textContent = texto;
  b.className = classe;
  b.type = "button"; // Evita envio acidental se estiver dentro de algum formulário
  b.addEventListener("click", aoClicar);
  return b;
}

// =========================================================================
// AÇÕES DE CRUD: DONOS
// =========================================================================

el("form-dono").addEventListener("submit", async (e) => {
  e.preventDefault();
  await api("POST", "/donos", {
    nome: el("dono-nome").value,
    telefone: el("dono-telefone").value,
  });
  e.target.reset();
  carregar();
});

async function editarDono(d) {
  const nome = prompt("Nome:", d.nome);
  if (nome === null) return;
  const telefone = prompt("Telefone:", d.telefone);
  if (telefone === null) return;
  await api("PUT", `/donos/${d.id}`, { nome, telefone });
  carregar();
}

async function removerDono(id) {
  await api("DELETE", `/donos/${id}`);
  carregar();
}

// =========================================================================
// AÇÕES DE CRUD: PETS
// =========================================================================

el("form-pet").addEventListener("submit", async (e) => {
  e.preventDefault();
  await api("POST", "/pets", {
    nome: el("pet-nome").value,
    especie: el("pet-especie").value,
    dono_id: Number(el("pet-dono").value),
  });
  el("pet-nome").value = "";
  el("pet-especie").value = "";
  carregar();
});

async function editarPet(p) {
  const nome = prompt("Nome:", p.nome);
  if (nome === null) return;
  const especie = prompt("Espécie:", p.especie);
  if (especie === null) return;
  const donoId = prompt("ID do dono:", p.dono_id);
  if (donoId === null) return;
  await api("PUT", `/pets/${p.id}`, { nome, especie, dono_id: Number(donoId) });
  carregar();
}

async function removerPet(id) {
  await api("DELETE", `/pets/${id}`);
  carregar();
}

// Inicia a aplicação ao carregar a página
carregar();