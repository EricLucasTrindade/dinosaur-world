package com.dinosaurworld.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.dinosaurworld.domain.enums.StatusRoster;
import com.dinosaurworld.domain.enums.TipoTaxon;

/**
 * Criação ou correção de um nó. Troca de pai não entra aqui — use
 * {@link MoverTaxonRequest} para não burlar a regra de um gênero / um clado.
 */
public record TaxonRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotNull TipoTaxon tipo,
        StatusRoster status,
        @Size(max = 120) String origemClado,
        Long parentId
) {
}
