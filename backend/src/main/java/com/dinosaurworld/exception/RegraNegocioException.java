package com.dinosaurworld.exception;

/**
 * Violação de regra do roster (duplicata no mesmo pai, ciclo ao mover,
 * exclusão de nó com filhos).
 */
public class RegraNegocioException extends RuntimeException {
    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}
