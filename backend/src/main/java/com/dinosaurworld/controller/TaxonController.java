package com.dinosaurworld.controller;

import jakarta.validation.Valid;
import com.dinosaurworld.domain.enums.Catalogo;
import com.dinosaurworld.domain.enums.StatusRoster;
import com.dinosaurworld.dto.request.MoverTaxonRequest;
import com.dinosaurworld.dto.request.TaxonRequest;
import com.dinosaurworld.dto.response.LocalidadeResponse;
import com.dinosaurworld.dto.response.TaxonArvoreResponse;
import com.dinosaurworld.dto.response.TaxonResponse;
import com.dinosaurworld.service.LocalidadeService;
import com.dinosaurworld.service.TaxonService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/taxons")
public class TaxonController {

    private final TaxonService service;
    private final LocalidadeService localidades;

    public TaxonController(TaxonService service, LocalidadeService localidades) {
        this.service = service;
        this.localidades = localidades;
    }

    @GetMapping("/arvore")
    public List<TaxonArvoreResponse> arvore(@RequestParam(required = false) Catalogo catalogo) {
        return service.arvore(catalogo);
    }

    @GetMapping
    public List<TaxonResponse> listar(@RequestParam(required = false) StatusRoster status) {
        return service.listar(status);
    }

    @GetMapping("/{id}")
    public TaxonResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    /** Sítio e paleocoordenada da ficha. Não altera o contrato da árvore. */
    @GetMapping("/{id}/localidade")
    public LocalidadeResponse localidade(@PathVariable Long id) {
        return localidades.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaxonResponse criar(@Valid @RequestBody TaxonRequest request) {
        return service.criar(request);
    }

    @PutMapping("/{id}")
    public TaxonResponse atualizar(@PathVariable Long id, @Valid @RequestBody TaxonRequest request) {
        return service.atualizar(id, request);
    }

    @PutMapping("/{id}/mover")
    public TaxonResponse mover(@PathVariable Long id, @Valid @RequestBody MoverTaxonRequest request) {
        return service.mover(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
