// =====================
// Estado
// =====================
let todasMovimentacoes = [];
let editandoId = null;

// =====================
// Elementos
// =====================
const form = document.getElementById("form");
const tabela = document.getElementById("tabela");
const emptyState = document.getElementById("emptyState");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitulo = document.getElementById("modalTitulo");
const filtroTexto = document.getElementById("filtroTexto");
const filtroTipo = document.getElementById("filtroTipo");

// =====================
// Formatação
// =====================
function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(valor);
}

function getCategoriaEmoji(nome) {
    const map = {
        "Alimentação": "🍽",
        "Transporte": "🚗",
        "Salário": "💼",
        "Lazer": "🎮"
    };
    return map[nome] || "📌";
}

// =====================
// Toast
// =====================
function showToast(msg, tipo = "info") {
    const toast = document.getElementById("toast");
    const cores = {
        success: "#32d583",
        error: "#f97066",
        info: "#7c6af5"
    };
    toast.style.borderLeftColor = cores[tipo] || cores.info;
    toast.style.borderLeft = `3px solid ${cores[tipo] || cores.info}`;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2800);
}

// =====================
// Atualizar Cards
// =====================
function atualizarCards(movimentacoes) {
    const receitas = movimentacoes
        .filter(m => m.tipo === "Receita")
        .reduce((a, m) => a + Number(m.valor), 0);

    const despesas = movimentacoes
        .filter(m => m.tipo === "Despesa")
        .reduce((a, m) => a + Number(m.valor), 0);

    const saldo = receitas - despesas;

    document.getElementById("saldoTotal").textContent = formatarMoeda(saldo);
    document.getElementById("totalReceitas").textContent = formatarMoeda(receitas);
    document.getElementById("totalDespesas").textContent = formatarMoeda(despesas);
    document.getElementById("totalMovimentacoes").textContent = movimentacoes.length;

    const saldoBadge = document.getElementById("saldoBadge");
    if (saldo > 0) {
        saldoBadge.textContent = "Saldo positivo ✓";
        saldoBadge.style.background = "rgba(50,213,131,0.1)";
        saldoBadge.style.color = "#32d583";
    } else if (saldo < 0) {
        saldoBadge.textContent = "Saldo negativo ⚠";
        saldoBadge.style.background = "rgba(249,112,102,0.1)";
        saldoBadge.style.color = "#f97066";
    } else {
        saldoBadge.textContent = "Saldo zerado";
        saldoBadge.style.background = "rgba(255,255,255,0.05)";
        saldoBadge.style.color = "#9998a8";
    }
}

// =====================
// Renderizar Tabela
// =====================
function renderizarTabela(movimentacoes) {
    atualizarCards(movimentacoes);

    if (movimentacoes.length === 0) {
        tabela.innerHTML = "";
        emptyState.style.display = "flex";
        return;
    }

    emptyState.style.display = "none";

    tabela.innerHTML = movimentacoes.map(mov => `
        <tr>
            <td>
                <div class="desc-cell">
                    <span class="desc-name">${mov.descricao}</span>
                </div>
            </td>
            <td>
                <span class="cat-pill">
                    ${getCategoriaEmoji(mov.categorias?.nome)} ${mov.categorias?.nome || "—"}
                </span>
            </td>
            <td>
                <span class="tipo-pill ${mov.tipo === 'Receita' ? 'tipo-receita' : 'tipo-despesa'}">
                    ${mov.tipo === 'Receita' ? '↑' : '↓'} ${mov.tipo}
                </span>
            </td>
            <td>
                <span class="valor-cell ${mov.tipo === 'Receita' ? 'valor-receita' : 'valor-despesa'}">
                    ${mov.tipo === 'Receita' ? '+' : '-'} ${formatarMoeda(mov.valor)}
                </span>
            </td>
            <td>
                <div class="acoes-cell">
                    <button class="btn-icon" title="Editar" onclick="editar(${mov.id}, '${mov.descricao.replace(/'/g, "\\'")}', '${mov.valor}', '${mov.tipo}', '${mov.categoria_id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon btn-icon--danger" title="Excluir" onclick="excluir(${mov.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

// =====================
// Listar
// =====================
async function listarMovimentacoes() {
    try {
        const resposta = await fetch("/movimentacoes");
        if (!resposta.ok) throw new Error("Erro ao buscar movimentações");
        todasMovimentacoes = await resposta.json();
        aplicarFiltros();
    } catch (err) {
        console.error(err);
        tabela.innerHTML = `<tr><td colspan="5"><div class="loading-state">Erro ao carregar dados. Verifique o servidor.</div></td></tr>`;
        showToast("Erro ao carregar movimentações", "error");
    }
}

// =====================
// Filtros
// =====================
function aplicarFiltros() {
    const texto = filtroTexto.value.toLowerCase();
    const tipo = filtroTipo.value;

    const filtradas = todasMovimentacoes.filter(m => {
        const matchTexto = m.descricao.toLowerCase().includes(texto) ||
            (m.categorias?.nome || "").toLowerCase().includes(texto);
        const matchTipo = !tipo || m.tipo === tipo;
        return matchTexto && matchTipo;
    });

    renderizarTabela(filtradas);
}

filtroTexto.addEventListener("input", aplicarFiltros);
filtroTipo.addEventListener("change", aplicarFiltros);

// =====================
// Modal
// =====================
function abrirModal(titulo = "Nova Movimentação") {
    modalTitulo.textContent = titulo;
    modalOverlay.classList.add("active");
    document.getElementById("descricao").focus();
}

function fecharModal() {
    modalOverlay.classList.remove("active");
    form.reset();
    editandoId = null;
    modalTitulo.textContent = "Nova Movimentação";
}

document.getElementById("btnNovaMovimentacao").addEventListener("click", () => abrirModal());
document.getElementById("btnFecharModal").addEventListener("click", fecharModal);
document.getElementById("btnCancelar").addEventListener("click", fecharModal);

modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) fecharModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModal();
});

// =====================
// Salvar (criar / editar)
// =====================
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btnSalvar = document.getElementById("btnSalvar");
    btnSalvar.disabled = true;
    btnSalvar.textContent = "Salvando...";

    const dados = {
        descricao: document.getElementById("descricao").value,
        valor: parseFloat(document.getElementById("valor").value),
        tipo: document.getElementById("tipo").value,
        categoria_id: parseInt(document.getElementById("categoria").value)
    };

    try {
        if (editandoId) {
            const res = await fetch(`/movimentacoes/${editandoId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dados)
            });
            if (!res.ok) throw new Error();
            showToast("Movimentação atualizada! ✓", "success");
        } else {
            const res = await fetch("/movimentacoes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dados)
            });
            if (!res.ok) throw new Error();
            showToast("Movimentação criada! ✓", "success");
        }

        fecharModal();
        await listarMovimentacoes();

    } catch {
        showToast("Erro ao salvar movimentação", "error");
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Salvar`;
    }
});

// =====================
// Editar
// =====================
function editar(id, descricao, valor, tipo, categoria_id) {
    document.getElementById("descricao").value = descricao;
    document.getElementById("valor").value = valor;
    document.getElementById("tipo").value = tipo;
    document.getElementById("categoria").value = categoria_id;
    editandoId = id;
    abrirModal("Editar Movimentação");
}

// =====================
// Excluir
// =====================
async function excluir(id) {
    if (!confirm("Deseja excluir esta movimentação?")) return;

    try {
        const res = await fetch(`/movimentacoes/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        showToast("Movimentação excluída", "info");
        await listarMovimentacoes();
    } catch {
        showToast("Erro ao excluir movimentação", "error");
    }
}

// =====================
// Iniciar
// =====================
listarMovimentacoes();
