# =========================================================================
# 1. IMPORTAÇÕES E CONFIGURAÇÃO DO SERVIDOR FLASK
# =========================================================================
from flask import Flask, jsonify, request
from flask_cors import CORS
from repositories import RepositorioDonos, RepositorioPets

app = Flask(__name__)

# Libera o acesso do Frontend (porta 5500) para este Backend (porta 5000)
CORS(app)

# =========================================================================
# 2. INICIALIZAÇÃO DOS REPOSITÓRIOS (CAMADA DE DADOS)
# =========================================================================
repo_donos = RepositorioDonos()
repo_pets = RepositorioPets()


def nao_encontrado(entidade):
    """Padroniza respostas HTTP 404 quando um registro não existe."""
    return jsonify({"erro": f"{entidade} não encontrado(a)"}), 404


# =========================================================================
# 3. ROTA DE RESUMO (/info) -> NECESSÁRIA PARA O CABEÇALHO E CARREGAMENTO
# =========================================================================
@app.get("/info")
def obter_info():
    """Retorna a contagem total de donos e pets para o frontend."""
    return jsonify({
        "donos": len(repo_donos.listar()),
        "pets": len(repo_pets.listar())
    })


# =========================================================================
# 4. ROTAS DE CRUD PARA DONOS (/donos)
# =========================================================================
@app.get("/donos")
def listar_donos():
    """Retorna a lista completa de donos."""
    return jsonify(repo_donos.listar())


@app.get("/donos/<int:id>")
def buscar_dono(id):
    """Busca um dono específico pelo ID."""
    dono = repo_donos.buscar(id)
    if dono is None:
        return nao_encontrado("Dono")
    return jsonify(dono)


@app.get("/donos/<int:id>/pets")
def listar_pets_do_dono(id):
    """Lista todos os pets vinculados a um dono específico."""
    if repo_donos.buscar(id) is None:
        return nao_encontrado("Dono")
    return jsonify(repo_pets.listar_por_dono(id))


@app.post("/donos")
def criar_dono():
    """Cadastra um novo dono."""
    dados = request.get_json(silent=True) or {}
    nome = dados.get("nome", "").strip()
    telefone = dados.get("telefone", "").strip()
    if not nome:
        return jsonify({"erro": "O campo 'nome' é obrigatório"}), 400
    return jsonify(repo_donos.criar(nome, telefone)), 201


@app.put("/donos/<int:id>")
def atualizar_dono(id):
    """Atualiza os dados de um dono existente."""
    dados = request.get_json(silent=True) or {}
    dono = repo_donos.atualizar(id, dados.get("nome"), dados.get("telefone"))
    if dono is None:
        return nao_encontrado("Dono")
    return jsonify(dono)


@app.delete("/donos/<int:id>")
def remover_dono(id):
    """Remove um dono, desde que ele não possua pets cadastrados."""
    if repo_donos.buscar(id) is None:
        return nao_encontrado("Dono")
    if repo_pets.listar_por_dono(id):
        return jsonify({"erro": "Dono possui pets; remova os pets primeiro"}), 409
    repo_donos.remover(id)
    return "", 204


# =========================================================================
# 5. ROTAS DE CRUD PARA PETS (/pets)
# =========================================================================
@app.get("/pets")
def listar_pets():
    """Retorna a lista completa de pets."""
    return jsonify(repo_pets.listar())


@app.get("/pets/<int:id>")
def buscar_pet(id):
    """Busca um pet específico pelo ID."""
    pet = repo_pets.buscar(id)
    if pet is None:
        return nao_encontrado("Pet")
    return jsonify(pet)


@app.post("/pets")
def criar_pet():
    """Cadastra um novo pet vinculado a um dono existente."""
    dados = request.get_json(silent=True) or {}
    nome = dados.get("nome", "").strip()
    especie = dados.get("especie", "").strip()
    dono_id = dados.get("dono_id")

    if not nome or not especie or dono_id is None:
        return jsonify({"erro": "Campos 'nome', 'especie' e 'dono_id' são obrigatórios"}), 400
    if repo_donos.buscar(dono_id) is None:
        return jsonify({"erro": "dono_id não corresponde a nenhum dono"}), 400

    return jsonify(repo_pets.criar(nome, especie, dono_id)), 201


@app.put("/pets/<int:id>")
def atualizar_pet(id):
    """Atualiza os dados de um pet existente."""
    dados = request.get_json(silent=True) or {}
    dono_id = dados.get("dono_id")

    if dono_id is not None and repo_donos.buscar(dono_id) is None:
        return jsonify({"erro": "dono_id não corresponde a nenhum dono"}), 400

    pet = repo_pets.atualizar(id, dados.get("nome"), dados.get("especie"), dono_id)
    if pet is None:
        return nao_encontrado("Pet")
    return jsonify(pet)


@app.delete("/pets/<int:id>")
def remover_pet(id):
    """Remove um pet pelo ID."""
    if not repo_pets.remover(id):
        return nao_encontrado("Pet")
    return "", 204


# =========================================================================
# 6. INICIALIZAÇÃO DO SERVIDOR
# =========================================================================
if __name__ == "__main__":
    app.run(debug=True)