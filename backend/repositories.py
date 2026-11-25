class RepositorioDonos:
    """Guarda os donos em um dicionário dentro do processo Python."""

    def __init__(self):
        self._donos = {}
        self._proximo_id = 1

    def listar(self):
        return list(self._donos.values())

    def buscar(self, id):
        return self._donos.get(id)

    def criar(self, nome, telefone):
        dono = {"id": self._proximo_id, "nome": nome, "telefone": telefone}
        self._donos[dono["id"]] = dono
        self._proximo_id += 1
        return dono

    def atualizar(self, id, nome=None, telefone=None):
        dono = self._donos.get(id)
        if dono is None:
            return None
        if nome is not None:
            dono["nome"] = nome
        if telefone is not None:
            dono["telefone"] = telefone
        return dono

    def remover(self, id):
        return self._donos.pop(id, None) is not None


class RepositorioPets:
    """Guarda os pets em um dicionário. Cada pet aponta para um dono via dono_id."""

    def __init__(self):
        self._pets = {}
        self._proximo_id = 1

    def listar(self):
        return list(self._pets.values())

    def listar_por_dono(self, dono_id):
        return [p for p in self._pets.values() if p["dono_id"] == dono_id]

    def buscar(self, id):
        return self._pets.get(id)

    def criar(self, nome, especie, dono_id):
        pet = {
            "id": self._proximo_id,
            "nome": nome,
            "especie": especie,
            "dono_id": dono_id,
        }
        self._pets[pet["id"]] = pet
        self._proximo_id += 1
        return pet

    def atualizar(self, id, nome=None, especie=None, dono_id=None):
        pet = self._pets.get(id)
        if pet is None:
            return None
        if nome is not None:
            pet["nome"] = nome
        if especie is not None:
            pet["especie"] = especie
        if dono_id is not None:
            pet["dono_id"] = dono_id
        return pet

    def remover(self, id):
        return self._pets.pop(id, None) is not None