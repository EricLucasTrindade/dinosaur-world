package com.dinosaurworld.exception;

/** Lançada quando o táxon não existe para o id informado. */
public class TaxonNaoEncontradoException extends RuntimeException {
    public TaxonNaoEncontradoException(Long id) {
        super("Táxon não encontrado: " + id);
    }
}
