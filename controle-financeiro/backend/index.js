import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("front"));

// ⚠️  Substitua pelos seus dados do Supabase
// Project Settings → API → Project URL e anon/public key
const supabaseUrl = "https://somtjpceqwhksotmmbkm.supabase.co";
const supabaseKey = "sb_publishable_GqNi9y0qrMardIDr_CsZow_-SE73oxj";

const supabase = createClient(supabaseUrl, supabaseKey);


// =========================
// LISTAR
// =========================
app.get("/movimentacoes", async (req, res) => {

    const { data, error } = await supabase
        .from("movimentacoes")
        .select(`
            *,
            categorias(nome)
        `)
        .order("id", { ascending: false });

    if (error) {
        console.log(error);
        return res.status(500).json(error);
    }

    res.json(data);
});


// =========================
// CADASTRAR
// =========================
app.post("/movimentacoes", async (req, res) => {

    const { descricao, valor, tipo, categoria_id } = req.body;

    const { data, error } = await supabase
        .from("movimentacoes")
        .insert([{ descricao, valor, tipo, categoria_id }])
        .select();

    if (error) {
        console.log(error);
        return res.status(500).json(error);
    }

    res.json(data);
});


// =========================
// EDITAR
// =========================
app.put("/movimentacoes/:id", async (req, res) => {

    const { id } = req.params;
    const { descricao, valor, tipo, categoria_id } = req.body;

    const { data, error } = await supabase
        .from("movimentacoes")
        .update({ descricao, valor, tipo, categoria_id })
        .eq("id", id)
        .select();

    if (error) {
        console.log(error);
        return res.status(500).json(error);
    }

    res.json(data);
});


// =========================
// EXCLUIR
// =========================
app.delete("/movimentacoes/:id", async (req, res) => {

    const { id } = req.params;

    const { error } = await supabase
        .from("movimentacoes")
        .delete()
        .eq("id", id);

    if (error) {
        console.log(error);
        return res.status(500).json(error);
    }

    res.json({ mensagem: "Movimentação excluída com sucesso" });
});


// =========================
// LISTAR CATEGORIAS
// =========================
app.get("/categorias", async (req, res) => {

    const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("nome");

    if (error) {
        console.log(error);
        return res.status(500).json(error);
    }

    res.json(data);
});


app.listen(3000, () => {
    console.log("✅ Servidor rodando em http://localhost:3000");
});
